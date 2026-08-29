/**
 * ExecutionResponseBuilder - Handles response building and enhancement
 * Extracted from executeThinkingStep to improve maintainability
 */

import type {
  ExecuteThinkingStepInput,
  LateralTechnique,
  SessionData,
  ThinkingOperationData,
  LateralThinkingResponse,
} from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import type { PathMemory } from '../../ergodicity/types.js';
import type { OptionGenerationResult } from '../../ergodicity/optionGeneration/types.js';
import type { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import type { ExecutionMetadata } from '../../core/ResponseBuilder.js';
import type { ErgodicityResult } from './ErgodicityResultAdapter.js';
import { ResponseBuilder } from '../../core/ResponseBuilder.js';
import { MemoryAnalyzer } from '../../core/MemoryAnalyzer.js';

/**
 * Carry forward the flags that change what the next step should say. Without
 * this, random_entry's Rory Mode guidance was unreachable: the branch took a
 * third argument no call site supplied.
 */
function guidanceContext(input: ExecuteThinkingStepInput): StepGuidanceContext {
  return { roryMode: input.roryMode };
}
import type { MemoryOutputs } from '../../core/MemoryAnalyzer.js';
import { RealityIntegration } from '../../reality/integration.js';
import { JsonOptimizer } from '../../utils/JsonOptimizer.js';
import type {
  HistoryEntry,
  StepGuidanceContext,
  TechniqueHandler,
} from '../../techniques/types.js';
import type { EscalationPromptGenerator } from '../../ergodicity/escalationPrompts.js';
import type { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { monitorCriticalSection } from '../../utils/PerformanceIntegration.js';
import { TelemetryCollector } from '../../telemetry/TelemetryCollector.js';
import { SessionCompletionTracker } from '../../core/session/SessionCompletionTracker.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import type { SessionManager } from '../../core/SessionManager.js';
import type { ReflexivityWarning } from '../../core/ReflexivityTracker.js';

interface ComplexitySuggestion {
  complexityNote: string;
  suggestedApproach: Record<string, string>;
}

/** Escape steps shown inline; the rest are counted rather than dropped. */
const ESCAPE_STEPS_SHOWN = 3;

/**
 * The response keys minimal verbosity keeps — the contract, pinned by
 * response-verbosity.test.ts. Everything here is the step acknowledgment,
 * steering, or a warning/verdict: the fields SOCKETES.md and the
 * lateral-thinking skill tell callers to read. Echoes of the caller's own
 * input (problem, output, technique field values, modificationHistory) and
 * cumulative re-sends are deliberately absent; `insights` is replaced by
 * `newInsights` (this step's additions only) and field values by
 * `fieldsRecorded` (their names — a receipt without the echo). Three nested
 * picks that a flat list cannot reach are handled in slimToMinimal:
 * completionMetadata.completionWarnings, executionMetadata.appliedReversibility,
 * and ruinAssessment minus its prompt. The terminal step's completion block
 * bypasses slimming by mechanism — handleSessionCompletion merges it into the
 * already-serialized response after this filter runs — as do the autoSave
 * status fields, added the same way.
 *
 * Declared sunset: 'minimal' is the intended future DEFAULT ('full' exists
 * for compatibility); the default flip will ship as a breaking release.
 */
export const MINIMAL_RESPONSE_KEEP_KEYS = [
  'sessionId',
  'technique',
  'currentStep',
  'totalSteps',
  'nextStepNeeded',
  'historyLength',
  'techniqueProgress',
  'nextStepGuidance',
  'sequentialThinkingSuggestion',
  'ergodicityMetrics',
  'flexibilityScore',
  'flexibilityMessage',
  'alternativeSuggestions',
  'ergodicityCheck',
  'earlyWarningState',
  'escapeRecommendation',
  'reflexivityWarning',
  'reflectionRequired',
  'optionGeneration',
  'realityAssessment',
  'persona',
] as const;

export class ExecutionResponseBuilder {
  private responseBuilder = new ResponseBuilder();
  private memoryAnalyzer = new MemoryAnalyzer();
  private jsonOptimizer: JsonOptimizer;
  private telemetry = TelemetryCollector.getInstance();
  private completionTracker = new SessionCompletionTracker();
  private metricsCollector = new MetricsCollector();

  constructor(
    private complexityAnalyzer: HybridComplexityAnalyzer,
    private escalationGenerator: EscalationPromptGenerator,
    private techniqueRegistry?: TechniqueRegistry,
    private sessionManager?: SessionManager
  ) {
    this.jsonOptimizer = new JsonOptimizer({
      maxArrayLength: 50, // Limit array sizes for history, path memory
      maxStringLength: 800, // Reasonable string length
      maxDepth: 8, // Prevent deep nesting issues
      maxResponseSize: 512 * 1024, // 512KB limit
    });
  }

  /**
   * Build comprehensive execution response
   */
  buildResponse(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    sessionId: string,
    handler: TechniqueHandler,
    techniqueLocalStep: number,
    techniqueIndex: number,
    plan: PlanThinkingSessionOutput | undefined,
    currentFlexibility: number,
    optionGenerationResult: OptionGenerationResult | undefined,
    // What the ergodicity adapter measured this step, beyond the flexibility
    // number. Optional so the handful of call sites that only have flexibility
    // keep working; when absent the response simply carries no metrics block
    // rather than an invented one.
    ergodicityMetrics?: ErgodicityResult['metrics'],
    // The edge-triggered warning this step produced, if any — computed once
    // in ReflexivityTracker.trackStep and threaded here as a value, replacing
    // a private reach-through that recomputed threshold state per response.
    reflexivityWarning?: ReflexivityWarning | null
  ): LateralThinkingResponse {
    const verbosity =
      input.verbosity ?? (process.env.RESPONSE_VERBOSITY === 'minimal' ? 'minimal' : 'full');
    // Captured before buildCoreResponseData, which reassigns session.insights:
    // minimal mode reports this step's additions, not the cumulative list.
    const insightsBefore = new Set(session.insights);

    // Track technique step
    this.telemetry
      .trackTechniqueStep(sessionId, input.technique, input.currentStep, input.totalSteps, {
        techniqueStep: techniqueLocalStep,
        techniqueTotalSteps: handler.getTechniqueInfo().totalSteps,
        flexibilityScore: currentFlexibility,
        problemLength: input.problem.length,
        outputLength: input.output.length,
      })
      .catch(console.error);

    // Build core response object (not JSON) with insights and metadata
    const { responseData, currentInsights } = this.buildCoreResponseData(
      input,
      session,
      sessionId,
      handler,
      techniqueLocalStep,
      techniqueIndex,
      plan,
      currentFlexibility
    );

    // buildCoreResponseData is where this step's insights land in the session,
    // so the completeness metric is only current once it has returned. The
    // completion summary and the session-complete telemetry below both read it.
    this.metricsCollector.refreshOutputCompleteness(session);

    // Track insights if generated
    if (currentInsights.length > 0) {
      this.telemetry
        .trackInsight(sessionId, input.technique, currentInsights.length)
        .catch(console.error);
    }

    // Track risks if identified
    if (input.risks && input.risks.length > 0) {
      this.telemetry.trackRisk(sessionId, input.technique, input.risks.length).catch(console.error);
    }

    // Monitor memory usage periodically (every 10 steps, but not on the first step)
    if (session.history.length > 0 && session.history.length % 10 === 0 && this.sessionManager) {
      // Use type-safe public API to get reflexivity memory stats
      const memStats = this.sessionManager.getReflexivityMemoryStats();

      // Warn if memory usage is high
      const MB = 1024 * 1024;
      if (memStats.estimatedMemoryBytes > 10 * MB) {
        console.warn(
          `[Memory Warning] High memory usage detected: ${(memStats.estimatedMemoryBytes / MB).toFixed(2)}MB across ${memStats.sessionCount} sessions`
        );
      }

      // Log memory stats for monitoring (telemetry doesn't have trackMemoryUsage yet)
      // Using console.error for DEBUG logging as it's allowed by lint rules
      if (process.env.LOG_LEVEL === 'DEBUG') {
        console.error('[Memory Stats]', {
          sessionId,
          estimatedBytes: memStats.estimatedMemoryBytes,
          sessionCount: memStats.sessionCount,
          totalActions: memStats.totalActions,
          totalConstraints: memStats.totalConstraints,
        });
      }
    }

    // Enhance response object directly (no parsing needed)
    this.enhanceWithMemoryAndProgress(
      responseData,
      input,
      session,
      sessionId,
      handler,
      techniqueLocalStep,
      techniqueIndex,
      plan,
      verbosity === 'minimal'
    );

    // Enhance with flexibility and warnings
    this.enhanceWithFlexibilityAndWarnings(
      responseData,
      currentFlexibility,
      input,
      session,
      ergodicityMetrics,
      reflexivityWarning
    );

    // Track flexibility warnings
    if (currentFlexibility < 0.4) {
      const warningLevel =
        currentFlexibility < 0.2 ? 'critical' : currentFlexibility < 0.3 ? 'high' : 'medium';
      this.telemetry
        .trackFlexibilityWarning(sessionId, currentFlexibility, warningLevel)
        .catch(console.error);
    }

    // Enhance with analysis and options
    this.enhanceWithAnalysisAndOptions(
      responseData,
      input,
      session,
      currentFlexibility,
      optionGenerationResult
    );

    // Track option generation if occurred
    if (optionGenerationResult && optionGenerationResult.options.length > 0) {
      this.telemetry
        .trackOptionGeneration(sessionId, optionGenerationResult.options.length, currentFlexibility)
        .catch(console.error);
    }

    // Build optimized response with single JSON stringify. Minimal verbosity
    // filters here — after every producer has run, before serialization — so
    // there is exactly one place that owns what survives.
    const finalData =
      verbosity === 'minimal'
        ? this.slimToMinimal(responseData, input, sessionId, currentInsights, insightsBefore)
        : responseData;
    const response = this.jsonOptimizer.buildOptimizedResponse(finalData);

    // Handle session completion
    if (!input.nextStepNeeded) {
      this.handleSessionCompletion(response, session);

      // Track technique completion. handleSessionCompletion has just
      // refreshed outputCompleteness, so this reads the honest session-level
      // coverage score rather than the retired per-step presence heuristic.
      const effectiveness = session.metrics?.outputCompleteness ?? 0;
      this.telemetry
        .trackTechniqueComplete(sessionId, input.technique, effectiveness, {
          insightCount: currentInsights.length,
          riskCount: session.metrics?.risksCaught ?? 0,
          duration: Date.now() - (session.startTime || Date.now()),
          revisionCount: session.history.filter(h => h.isRevision).length,
          branchCount: Object.keys(session.branches).length,
        })
        .catch(console.error);
    }

    return response;
  }

  /**
   * Build core response data object with insights and metadata
   */
  private buildCoreResponseData(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    sessionId: string,
    handler: TechniqueHandler,
    techniqueLocalStep: number,
    techniqueIndex: number,
    plan: PlanThinkingSessionOutput | undefined,
    currentFlexibility: number
  ): { responseData: Record<string, unknown>; currentInsights: string[] } {
    // Extract insights
    const currentInsights = this.extractInsights(handler, session, input);

    // Generate next step guidance
    const nextStepGuidance = this.generateNextStepGuidance(
      input,
      session,
      handler,
      techniqueLocalStep,
      techniqueIndex,
      plan
    );

    // Generate execution metadata
    const executionMetadata = this.generateExecutionMetadata(
      input,
      session,
      currentInsights,
      session.pathMemory,
      currentFlexibility
    );

    // Build response data object
    const operationData = this.createOperationData(input, sessionId);
    const responseData: Record<string, unknown> = {
      sessionId,
      technique: operationData.technique,
      problem: operationData.problem,
      currentStep: operationData.currentStep,
      totalSteps: operationData.totalSteps,
      output: operationData.output, // Include the output field
      nextStepNeeded: operationData.nextStepNeeded,
      insights: currentInsights,
      ...this.extractTechniqueSpecificFields(operationData),
      historyLength: session.history.length,
    };

    // Add persona context if present (truncate to prevent payload bloat)
    if (input.persona) {
      responseData.persona = input.persona.slice(0, 200);
    }

    // Add optional fields
    if (nextStepGuidance) {
      responseData.nextStepGuidance = nextStepGuidance;
    }
    if (executionMetadata) {
      responseData.executionMetadata = executionMetadata;
    }

    // Add reflexivity data for ANY technique that has tracked action steps
    // Only show reflexivity data if there have been action steps
    if (this.sessionManager) {
      const reflexivityData = this.sessionManager.getSessionReflexivity(sessionId);
      // Only include reflexivity if there have been action steps (actionSteps > 0)
      if (reflexivityData && reflexivityData.summary && reflexivityData.summary.actionSteps > 0) {
        responseData.reflexivity = {
          summary: reflexivityData.summary,
          currentConstraints: reflexivityData.realityState?.pathsForeclosed || [],
          activeExpectations: reflexivityData.realityState?.stakeholderExpectations || [],
        };
      }
    }

    return { responseData, currentInsights };
  }

  /**
   * Enhance response with memory outputs and technique progress
   */
  private enhanceWithMemoryAndProgress(
    parsedResponse: Record<string, unknown>,
    input: ExecuteThinkingStepInput,
    session: SessionData,
    sessionId: string,
    handler: TechniqueHandler,
    techniqueLocalStep: number,
    techniqueIndex: number,
    plan: PlanThinkingSessionOutput | undefined,
    // Minimal verbosity drops the five memory decoration keys anyway, so the
    // analysis is skipped rather than computed-and-discarded. MemoryAnalyzer
    // is side-effect-free; nothing else reads its output.
    skipMemoryOutputs = false
  ): void {
    // Optimization: Skip or simplify memory analysis for deep revision chains
    const revisionCount = session.history.filter(h => h.isRevision).length;
    const skipMemoryAnalysis = input.isRevision && revisionCount > 30 && revisionCount % 5 !== 0;

    const memoryOutputs =
      skipMemoryOutputs || skipMemoryAnalysis
        ? {} // Skip memory analysis for performance
        : this.memoryAnalyzer.generateMemoryOutputs(
            this.createOperationData(input, sessionId),
            session
          );

    // Build technique progress info.
    //
    // `global*` are computed against the plan, not echoed from the request.
    // They were `input.currentStep` / `input.totalSteps`, and step numbering is
    // technique-local by default — so on triz step 1 of 4 they reported
    // "globalStep 1, globalTotalSteps 4", duplicating the technique counters
    // beside them while `completionMetadata.totalPlannedSteps` correctly said
    // 25. A field named global that mirrors the local one is worse than absent:
    // a caller reading it believes it knows where it is in the plan.
    const stepsBeforeThisTechnique = (plan?.workflow ?? [])
      .slice(0, techniqueIndex)
      .reduce((sum, entry) => sum + entry.steps.length, 0);
    const techniqueProgress = {
      techniqueStep: techniqueLocalStep,
      techniqueTotalSteps:
        plan?.workflow[techniqueIndex]?.steps.length || handler.getTechniqueInfo().totalSteps,
      globalStep: plan ? stepsBeforeThisTechnique + techniqueLocalStep : input.currentStep,
      globalTotalSteps: plan?.totalSteps ?? input.totalSteps,
      currentTechnique: input.technique,
      techniqueIndex: techniqueIndex + 1,
      totalTechniques: plan?.techniques.length || 1,
    };

    this.addMemoryOutputs(parsedResponse, memoryOutputs);
    this.addTechniqueProgress(parsedResponse, techniqueProgress);

    // Add completion tracking metadata
    const completionMetadata = this.completionTracker.calculateCompletionMetadata(
      session,
      plan,
      !input.nextStepNeeded
    );
    this.addCompletionMetadata(parsedResponse, completionMetadata, !input.nextStepNeeded);
  }

  /**
   * The minimal-verbosity filter: an allowlist over the fully built response.
   * Built-then-filtered (rather than skipping producers) so warning and
   * verdict producers always run; the one producer worth skipping outright
   * (memory decoration) is handled at its call site.
   */
  private slimToMinimal(
    responseData: Record<string, unknown>,
    input: ExecuteThinkingStepInput,
    sessionId: string,
    currentInsights: string[],
    insightsBefore: Set<string>
  ): Record<string, unknown> {
    const slim: Record<string, unknown> = {};
    for (const key of MINIMAL_RESPONSE_KEEP_KEYS) {
      if (key in responseData) {
        slim[key] = responseData[key];
      }
    }

    // Nested picks a flat allowlist cannot reach.
    const completionMetadata = responseData.completionMetadata as
      Record<string, unknown> | undefined;
    if (
      Array.isArray(completionMetadata?.completionWarnings) &&
      completionMetadata.completionWarnings.length > 0
    ) {
      slim.completionMetadata = { completionWarnings: completionMetadata.completionWarnings };
    }
    if (input.appliedReversibility) {
      // The clamp audit is verdict-adjacent: a caller whose claim was moved
      // must see what was applied, in either mode.
      slim.executionMetadata = { appliedReversibility: input.appliedReversibility };
    }
    const ruinAssessment = responseData.ruinAssessment as Record<string, unknown> | undefined;
    if (ruinAssessment) {
      const { prompt: _prompt, ...verdict } = ruinAssessment;
      slim.ruinAssessment = verdict;
    }

    // This step's additions only. Full mode's `insights` stays the cumulative
    // documented reading (SOCKETES.md); a different key for a different
    // meaning, so no parser reads one as the other.
    slim.newInsights = currentInsights.filter(insight => !insightsBefore.has(insight));

    // Receipt without the echo: the names of the technique fields the server
    // read from this call.
    slim.fieldsRecorded = Object.keys(
      this.extractTechniqueSpecificFields(this.createOperationData(input, sessionId))
    );

    return slim;
  }

  /**
   * Enhance response with flexibility and warnings
   */
  private enhanceWithFlexibilityAndWarnings(
    parsedResponse: Record<string, unknown>,
    currentFlexibility: number,
    input: ExecuteThinkingStepInput,
    session: SessionData,
    ergodicityMetrics?: ErgodicityResult['metrics'],
    reflexivityWarning?: ReflexivityWarning | null
  ): void {
    this.addFlexibilityInfo(parsedResponse, currentFlexibility, input.alternativeSuggestions);
    this.addErgodicityMetrics(parsedResponse, ergodicityMetrics);
    this.addPathAnalysis(parsedResponse, session.pathMemory, currentFlexibility);
    this.addWarnings(parsedResponse, session, reflexivityWarning);
  }

  /**
   * Enhance response with analysis and option generation
   */
  private enhanceWithAnalysisAndOptions(
    parsedResponse: Record<string, unknown>,
    input: ExecuteThinkingStepInput,
    session: SessionData,
    currentFlexibility: number,
    optionGenerationResult: OptionGenerationResult | undefined
  ): void {
    this.addRealityAssessment(parsedResponse, input);
    this.addComplexityAnalysis(parsedResponse, input, session);
    this.addRiskAssessments(parsedResponse, input);
    this.addReflectionRequirement(parsedResponse, session, input);
    this.addOptionGeneration(parsedResponse, currentFlexibility, optionGenerationResult);
  }

  private extractInsights(
    handler: TechniqueHandler,
    session: SessionData,
    input: ExecuteThinkingStepInput
  ): string[] {
    // Only this technique's own steps. Handlers label insights by position —
    // `this.steps[index]` — so in a multi-technique plan the preceding
    // technique's entries shift every label onto the wrong step and push the
    // final step off the end of the array, discarding it. A session running
    // disney_method before keeper_test reported keeper_test's "Reconstruct the
    // Fence" output under "Decide and Set the Trigger" and dropped the verdict.
    const techniqueHistory = this.ownHistory(session, input.technique);

    const currentInsights = monitorCriticalSection(
      'extract_insights',
      () => handler.extractInsights(techniqueHistory),
      { technique: input.technique, historyLength: techniqueHistory.length }
    );

    // Rebuild rather than append. `extractInsights` returns the technique's
    // complete current reading — one entry per step, latest wins — so a
    // revision supersedes inside the handler. Appending undid that: the
    // superseded text had already been pushed by the earlier call and nothing
    // took it back out, so a revised session reported both readings and ended
    // with more insights than it had steps.
    //
    // session.insights is a view of the history, not a log of what was said
    // along the way, so every technique in the session is re-read each step.
    session.insights = this.readInsightsFromHistory(session, currentInsights, input);

    return currentInsights;
  }

  /**
   * One technique's own entries, each presented under its technique-local step.
   *
   * Handlers key on `currentStep` so a revision supersedes the entry it
   * revises, but `currentStep` may count across the whole plan. For any
   * technique that is not first, that number falls outside the technique's own
   * step range and the step vanishes.
   */
  /**
   * One technique's own entries, each presented under its technique-local step.
   *
   * The conversion at the end is the one place the two shapes meet.
   * `ThinkingOperationData` is a declared interface, so TypeScript will not
   * give it an implicit index signature, while `HistoryEntry` needs one to
   * carry the technique-specific fields a handler reads. The values are the
   * same objects either way.
   */
  private ownHistory(session: SessionData, technique: LateralTechnique): HistoryEntry[] {
    return session.history
      .filter(entry => entry.technique === technique)
      .map(entry =>
        entry.techniqueLocalStep === undefined
          ? entry
          : { ...entry, currentStep: entry.techniqueLocalStep }
      ) as unknown as HistoryEntry[];
  }

  /**
   * Every technique's current reading of its own steps, in the order the
   * techniques were first used.
   */
  private readInsightsFromHistory(
    session: SessionData,
    currentInsights: string[],
    input: ExecuteThinkingStepInput
  ): string[] {
    const seen: string[] = [];
    const techniques: LateralTechnique[] = [];
    for (const entry of session.history) {
      if (entry.technique && !techniques.includes(entry.technique)) {
        techniques.push(entry.technique);
      }
    }

    for (const technique of techniques) {
      const insights =
        technique === input.technique
          ? currentInsights
          : this.readTechniqueInsights(session, technique);
      for (const insight of insights) {
        if (!seen.includes(insight)) seen.push(insight);
      }
    }

    // Deliberately no carry-over of whatever was already in session.insights:
    // that is exactly the superseded text this rebuild exists to drop. Every
    // technique in the history came from this registry, so each one is re-read
    // above; one that cannot be resolved contributes nothing rather than
    // preserving a stale reading.
    return seen;
  }

  private readTechniqueInsights(session: SessionData, technique: LateralTechnique): string[] {
    const handler = this.techniqueRegistry?.tryGetHandler(technique);
    if (!handler) return [];
    try {
      return handler.extractInsights(this.ownHistory(session, technique));
    } catch {
      return [];
    }
  }

  private createOperationData(
    input: ExecuteThinkingStepInput,
    sessionId: string
  ): ThinkingOperationData {
    // Remove realityAssessment to avoid duplication
    const inputCopy: Partial<ExecuteThinkingStepInput> = { ...input };
    delete inputCopy.realityAssessment;

    return {
      ...(inputCopy as Omit<ExecuteThinkingStepInput, 'realityAssessment'>),
      sessionId,
    };
  }

  private generateNextStepGuidance(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    handler: TechniqueHandler,
    techniqueLocalStep: number,
    techniqueIndex: number,
    plan?: PlanThinkingSessionOutput
  ): string | undefined {
    if (!input.nextStepNeeded) return undefined;

    const nextStep = input.currentStep + 1;

    // Out-of-order and duplicate submissions, read from the same counter the
    // completion metadata uses. Measured in 6 of 8 eval runs: an executor sent
    // step-2 content under currentStep 3, the server accepted it, recorded the
    // skip only in buried metadata — and this function then steered to step 4,
    // actively pointing away from the hole it had just accepted. The executors
    // recovered against the guidance, not because of it. A hole now redirects
    // the guidance to the earliest missing step, before anything else this
    // function might say (including the end-of-technique transition, which
    // would otherwise walk into the next technique with the hole left behind);
    // a duplicate gets named rather than silently appended.
    let duplicateNotice = '';
    if (plan) {
      const { completedStepNumbers, submissionsByStep } =
        this.completionTracker.techniqueLocalProgress(
          session,
          plan,
          input.technique,
          techniqueIndex
        );
      for (let step = 1; step < techniqueLocalStep; step++) {
        if (!completedStepNumbers.has(step)) {
          return (
            `⚠️ Step ${step} of ${input.technique} has not been recorded — the session has moved past it. ` +
            `Complete it before continuing. ${handler.getStepGuidance(step, input.problem, guidanceContext(input))}`
          );
        }
      }
      if ((submissionsByStep.get(techniqueLocalStep) ?? 0) > 1) {
        duplicateNotice =
          `⚠️ Step ${techniqueLocalStep} of ${input.technique} had already been recorded; ` +
          `this submission was appended alongside the earlier one, not merged into it. `;
      }
    }

    // Ensure next step is valid
    if (nextStep < 1 || nextStep > input.totalSteps) {
      // Same contract the handlers use for an out-of-range step, so callers see
      // one shape rather than two near-identical ones.
      return `${duplicateNotice}Complete the ${handler.getTechniqueInfo().name} process for: "${input.problem}"`;
    }

    // No completion nag here. This function returns early unless
    // input.nextStepNeeded is true, so anything it emits fires mid-session by
    // definition — and it fired below 50% progress, i.e. on the opening steps of
    // every session, prefixing "MANDATORY: Only 14% complete" onto the guidance
    // for a step being taken exactly on plan. It was invisible because it also
    // carried a NODE_ENV/VITEST exemption, so no test could ever see it.
    //
    // Incompleteness is reported once, where it means something: on the
    // terminating step, via SessionCompletionTracker's warnings.

    // Check if we're transitioning to a new technique
    const currentTechniqueSteps =
      plan?.workflow[techniqueIndex]?.steps.length || handler.getTechniqueInfo().totalSteps;

    if (techniqueLocalStep >= currentTechniqueSteps) {
      // We're at the last step of current technique, next step is first step of next technique
      if (techniqueIndex + 1 < (plan?.techniques.length || 1)) {
        const nextTechnique = plan?.techniques[techniqueIndex + 1];
        if (nextTechnique) {
          // Track workflow transition
          this.telemetry
            .trackWorkflowTransition(input.sessionId || '', input.technique, nextTechnique)
            .catch(console.error);

          // tryGetHandler, not getHandler: the fallback below is the whole point
          // of this branch, and getHandler throws on an unknown id. With a plan
          // naming a technique the registry does not hold, throwing here fails
          // the *previous* technique's final step, which had already succeeded.
          const nextHandler = this.techniqueRegistry?.tryGetHandler(nextTechnique);
          const assigned = this.assignedStimulusLine(plan, nextTechnique);
          return nextHandler
            ? `${duplicateNotice}Transitioning to ${nextTechnique}.${assigned} ${nextHandler.getStepGuidance(1, input.problem, guidanceContext(input))}`
            : `${duplicateNotice}Transitioning to ${nextTechnique}${assigned}`;
        }
      }
    } else {
      // Still in the same technique
      const nextLocalStep = techniqueLocalStep + 1;
      let guidance = handler.getStepGuidance(nextLocalStep, input.problem, guidanceContext(input));

      // Add contextual guidance for temporal_work
      if (input.technique === 'temporal_work' && nextStep === 3) {
        const step1Data = session.history.find(h => h.currentStep === 1 && h.temporalLandscape);
        if (step1Data && step1Data.temporalLandscape?.pressurePoints) {
          const pressurePoints = step1Data.temporalLandscape.pressurePoints;
          if (pressurePoints.length > 0) {
            guidance = `💎 Transform time pressure into creative force. Focus on ${pressurePoints.join(', ')} as creative catalysts. How can these constraints enhance rather than limit?`;
          }
        }
      }

      // Server-assigned stimulus (P3): keep the assigned value in front of the
      // caller on every remaining step of a stimulus-bearing technique — the
      // plan carries it, but guidance is what callers actually read.
      const assigned = this.assignedStimulusLine(plan, input.technique);

      return `${duplicateNotice}${guidance}${assigned}`;
    }

    return undefined;
  }

  /**
   * One-line reminder of a plan-time assigned stimulus, or '' when the plan
   * carries no assignment for this technique. When the technique appears more
   * than once in the plan, ALL assignments are listed by instance — a
   * technique-local step number cannot name its instance (issue #301), so
   * asserting the first instance's value here misdirected every later one.
   */
  private assignedStimulusLine(
    plan: PlanThinkingSessionOutput | undefined,
    technique: string | undefined
  ): string {
    if (!plan || !technique) return '';
    const values: string[] = [];
    for (const entry of plan.workflow) {
      if (entry.technique !== technique) continue;
      const first = entry.steps?.[0];
      if (first?.stimulusSource === 'assigned' && first.stimulus) values.push(first.stimulus);
    }
    if (values.length === 0) return '';
    const label = technique === 'po' ? 'assigned provocation' : 'assigned stimulus';
    if (values.length === 1) {
      return ` 🎲 Work with the ${label}: "${values[0]}" — it is not re-rollable within this plan.`;
    }
    const listed = values.map((v, i) => `instance ${i + 1}: "${v}"`).join('; ');
    return ` 🎲 This plan runs ${technique} ${values.length} times with distinct ${label}s — ${listed}. Work with your instance's value; none is re-rollable.`;
  }

  private getBaseGuidance(
    handler: TechniqueHandler,
    nextLocalStep: number,
    input: ExecuteThinkingStepInput
  ): string {
    return handler.getStepGuidance(nextLocalStep, input.problem, guidanceContext(input));
  }

  private generateExecutionMetadata(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    insights: string[],
    pathMemory: PathMemory | undefined,
    currentFlexibility: number
  ): ExecutionMetadata {
    const metadata: ExecutionMetadata = {
      pathDependenciesCreated: this.extractPathDependencies(input, pathMemory),
      flexibilityImpact: this.calculateFlexibilityImpact(input, session),
    };

    // Audit trail for a reversibility claim — the caller must be able to see
    // what the clamp did with what they sent. The rationale is not echoed:
    // it is the caller's own input, already on the session record.
    if (input.appliedReversibility) {
      metadata.appliedReversibility = input.appliedReversibility;
    }

    const noteworthyMoment = this.identifyNoteworthyMoment(input, session, insights);
    if (noteworthyMoment) {
      metadata.noteworthyMoment = noteworthyMoment;
    }

    const futureRelevance = this.assessFutureRelevance(input, session, currentFlexibility);
    if (futureRelevance) {
      metadata.futureRelevance = futureRelevance;
    }

    return metadata;
  }

  private addMemoryOutputs(
    parsedResponse: Record<string, unknown>,
    memoryOutputs: MemoryOutputs
  ): void {
    Object.assign(parsedResponse, memoryOutputs);
  }

  private addTechniqueProgress(
    parsedResponse: Record<string, unknown>,
    techniqueProgress: {
      techniqueStep: number;
      techniqueTotalSteps: number;
      globalStep: number;
      globalTotalSteps: number;
      currentTechnique: string;
      techniqueIndex: number;
      totalTechniques: number;
    }
  ): void {
    parsedResponse.techniqueProgress = techniqueProgress;
  }

  private addCompletionMetadata(
    parsedResponse: Record<string, unknown>,
    completionMetadata: ReturnType<SessionCompletionTracker['calculateCompletionMetadata']>,
    isTerminating: boolean
  ): void {
    // A technique the session has not reached is pending, not skipped. The
    // tracker reports every unstarted technique on purpose — the completion
    // gatekeeper reads that, and thinning it there would change enforcement
    // rather than presentation (completion-warning-timing.test.ts guards
    // exactly that line). So the suppression happens here, on the way to the
    // caller, alongside the warning string that is already gated this way.
    //
    // Unsuppressed, the FIRST step of a two-technique plan told the caller the
    // second was skipped and named a missed perspective for it — false on
    // every early step of every multi-technique plan, in the same channel as
    // advisory findings. A warning true of every session at step one carries
    // no information and teaches its reader to discount the ones that do.
    const skippedTechniques = isTerminating ? completionMetadata.skippedTechniques : [];
    const missedPerspectives = isTerminating ? completionMetadata.missedPerspectives : [];

    // Add completion metadata
    parsedResponse.completionMetadata = {
      overallProgress: completionMetadata.overallProgress,
      totalPlannedSteps: completionMetadata.totalPlannedSteps,
      completedSteps: completionMetadata.completedSteps,
      techniqueStatuses: completionMetadata.techniqueStatuses.map(status => ({
        technique: status.technique,
        completionPercentage: status.completionPercentage,
        skippedSteps: status.skippedSteps,
      })),
      skippedTechniques,
      missedPerspectives,
      completionWarnings: completionMetadata.completionWarnings,
      // Reported only at termination for the same reason: a session in
      // progress has not failed to meet a threshold it is still working
      // toward, and `false` on step one reads as a verdict.
      minimumThresholdMet: isTerminating ? completionMetadata.minimumThresholdMet : undefined,
    };

    // Add visual progress indicator
    if (completionMetadata.overallProgress < 0.8) {
      parsedResponse.progressDisplay =
        this.completionTracker.formatProgressDisplay(completionMetadata);
    }
  }

  private addFlexibilityInfo(
    parsedResponse: Record<string, unknown>,
    currentFlexibility: number,
    alternativeSuggestions?: string[]
  ): void {
    if (currentFlexibility < 0.7) {
      parsedResponse.flexibilityScore = currentFlexibility;

      if (currentFlexibility < 0.2) {
        parsedResponse.flexibilityMessage =
          '⚠️ Critical: Very limited options remain. Consider immediate alternatives.';
      } else if (currentFlexibility < 0.4) {
        parsedResponse.flexibilityMessage =
          '⚠️ Warning: Flexibility is low. Generate options to avoid lock-in.';
      } else {
        parsedResponse.flexibilityMessage =
          '📊 Note: Flexibility decreasing. Monitor commitments carefully.';
      }
    }

    if (alternativeSuggestions && alternativeSuggestions.length > 0) {
      parsedResponse.alternativeSuggestions = alternativeSuggestions;
    }
  }

  /**
   * What the ergodicity adapter measured, alongside the flexibility number.
   *
   * The orchestrator computed `constraintLevel`, `optionSpaceSize` and
   * `pathDivergence` on every step and `execution.ts` took only the flexibility
   * score off the result, so three measurements the engine already had reached
   * no caller. Reported unconditionally, not only when flexibility is low —
   * these are readings, and withholding them until things look bad is what
   * makes a reading unusable as a baseline.
   */
  private addErgodicityMetrics(
    parsedResponse: Record<string, unknown>,
    ergodicityMetrics?: ErgodicityResult['metrics']
  ): void {
    if (!ergodicityMetrics) return;

    parsedResponse.ergodicityMetrics = {
      currentFlexibility: ergodicityMetrics.currentFlexibility,
      constraintLevel: ergodicityMetrics.constraintLevel,
      // Omitted rather than zeroed when unmeasured — see ErgodicityResultAdapter.
      ...(ergodicityMetrics.optionSpaceSize === undefined
        ? {}
        : { optionSpaceSize: ergodicityMetrics.optionSpaceSize }),
      pathDivergence: ergodicityMetrics.pathDivergence,
    };
  }

  private addPathAnalysis(
    parsedResponse: Record<string, unknown>,
    pathMemory?: PathMemory,
    currentFlexibility?: number
  ): void {
    if (
      pathMemory &&
      pathMemory.currentFlexibility &&
      currentFlexibility &&
      currentFlexibility < 0.5
    ) {
      parsedResponse.pathAnalysis = {
        flexibilityScore: pathMemory.currentFlexibility.flexibilityScore,
        reversibilityIndex: pathMemory.currentFlexibility.reversibilityIndex || currentFlexibility,
        interpretation:
          currentFlexibility < 0.3
            ? 'Most decisions are now irreversible. Proceed with extreme caution.'
            : 'Some decisions are becoming harder to reverse. Consider preserving options.',
      };
    }
  }

  private addWarnings(
    parsedResponse: Record<string, unknown>,
    session: SessionData,
    reflexivityWarning?: ReflexivityWarning | null
  ): void {
    if (session.earlyWarningState && session.earlyWarningState.activeWarnings.length > 0) {
      parsedResponse.earlyWarningState = {
        // The verdict, not only the evidence. This reported a list of warnings
        // and a count and withheld what the subsystem concluded from them, so a
        // caller could see that something was flagged but not whether the
        // server thought it should continue, change course, or stop. Reading
        // that off the message strings is the caller doing the server's job.
        overallRisk: session.earlyWarningState.overallRisk,
        recommendedAction: session.earlyWarningState.recommendedAction,
        compoundRisk: session.earlyWarningState.compoundRisk,
        activeWarnings: session.earlyWarningState.activeWarnings.map(w => ({
          level: w.severity,
          message: w.message,
        })),
        summary: `${session.earlyWarningState.activeWarnings.length} warning(s) active. Review before continuing.`,
      };
    }

    if (session.escapeRecommendation) {
      const steps = session.escapeRecommendation.steps;
      const shown = steps.slice(0, ESCAPE_STEPS_SHOWN);
      parsedResponse.escapeRecommendation = {
        protocol: session.escapeRecommendation.name,
        steps: shown,
        // Say when there are more. Slicing to three silently made a protocol
        // look like a three-step one.
        ...(steps.length > shown.length ? { furtherSteps: steps.length - shown.length } : {}),
        recommendation: 'Consider these alternative approaches to regain flexibility.',
      };
    }

    // The edge-triggered warning arrives as a typed value from trackStep —
    // no private reach-through, no silent catch, no per-response recompute.
    // pathsForeclosed carries only this step's new entries (capped at
    // source), replacing the frozen first-five prefix of the aggregate list.
    if (reflexivityWarning && process.env.DISABLE_REFLEXIVITY_WARNINGS !== 'true') {
      parsedResponse.reflexivityWarning = {
        level: reflexivityWarning.level,
        type: reflexivityWarning.type,
        message: reflexivityWarning.message,
        constraintCount: reflexivityWarning.currentConstraints,
        pathsForeclosed: reflexivityWarning.pathsForeclosed,
        suggestions: reflexivityWarning.suggestions,
      };
    }
  }

  private addRealityAssessment(
    parsedResponse: Record<string, unknown>,
    input: ExecuteThinkingStepInput
  ): void {
    const realityResult = RealityIntegration.enhanceWithReality(input, input.output);
    if (
      realityResult &&
      typeof realityResult === 'object' &&
      'realityAssessment' in realityResult &&
      realityResult.realityAssessment
    ) {
      parsedResponse.realityAssessment = realityResult.realityAssessment;
    }
  }

  private addComplexityAnalysis(
    parsedResponse: Record<string, unknown>,
    input: ExecuteThinkingStepInput,
    session: SessionData
  ): void {
    const complexityCheck = monitorCriticalSection(
      'complexity_check',
      () => this.checkExecutionComplexity(input, session),
      { outputLength: input.output.length }
    );

    if (
      complexityCheck &&
      typeof complexityCheck === 'object' &&
      'suggestion' in complexityCheck &&
      complexityCheck.suggestion
    ) {
      parsedResponse.sequentialThinkingSuggestion = complexityCheck.suggestion;
    }
  }

  private addRiskAssessments(
    parsedResponse: Record<string, unknown>,
    input: ExecuteThinkingStepInput
  ): void {
    const inputWithChecks = input as ExecuteThinkingStepInput & {
      ergodicityCheck?: unknown;
      ruinAssessment?: unknown;
    };

    if (inputWithChecks.ergodicityCheck) {
      parsedResponse.ergodicityCheck = inputWithChecks.ergodicityCheck;
    }

    if (inputWithChecks.ruinAssessment) {
      parsedResponse.ruinAssessment = inputWithChecks.ruinAssessment;
    }
  }

  private addReflectionRequirement(
    parsedResponse: Record<string, unknown>,
    session: SessionData,
    input: ExecuteThinkingStepInput
  ): void {
    if (session.riskEngagementMetrics && session.riskEngagementMetrics.escalationLevel >= 2) {
      const reflectionRequirement = this.escalationGenerator.generateReflectionRequirement(
        session,
        input.currentStep
      );
      if (reflectionRequirement) {
        parsedResponse.reflectionRequired = reflectionRequirement;
      }
    }
  }

  private addOptionGeneration(
    parsedResponse: Record<string, unknown>,
    currentFlexibility: number,
    optionGenerationResult?: OptionGenerationResult
  ): void {
    if (optionGenerationResult && optionGenerationResult.options.length > 0) {
      // topOptions must follow the evaluator's score order (evaluations are
      // sorted best-first), not the strategies' generation order — otherwise
      // `recommendation` (the top-scored option) can name an option absent
      // from the list. Reading flexibilityGain off the evaluation, not the
      // option: strategies never populate Option.flexibilityGain.
      const rankedOptions = optionGenerationResult.evaluations.slice(0, 3).flatMap(evaluation => {
        const option = optionGenerationResult.options.find(o => o.id === evaluation.optionId);
        return option ? [{ option, evaluation }] : [];
      });
      parsedResponse.optionGeneration = {
        triggered: true,
        flexibility: currentFlexibility,
        optionsGenerated: optionGenerationResult.options.length,
        strategies: optionGenerationResult.strategiesUsed,
        topOptions: rankedOptions.map(({ option, evaluation }) => ({
          name: option.name,
          description: option.description,
          flexibilityGain: evaluation.flexibilityGain,
          recommendation: evaluation.recommendation,
        })),
        recommendation:
          optionGenerationResult.topRecommendation?.name || 'Consider implementing top options',
      };
    }
  }

  private handleSessionCompletion(response: LateralThinkingResponse, session: SessionData): void {
    session.endTime = Date.now();

    // Recompute once more now that endTime is set: completion is one of the
    // metric's four factors, and it is only true from this line onward. Both
    // the completion summary built below and the effectiveness reported to
    // telemetry read the stored value, so computing it before this point
    // reported every finished session as unfinished.
    this.metricsCollector.refreshOutputCompleteness(session);

    // Optimize: Parse once, modify, and use optimizer to stringify
    const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
    const completedData = this.responseBuilder.addCompletionData(responseData, session);

    // Use optimizer for final response
    response.content[0].text = this.jsonOptimizer.optimizeResponse(completedData);

    // Track session completion
    const sessionId = (responseData.sessionId as string) || '';
    this.telemetry
      .trackSessionComplete(sessionId, {
        duration: session.endTime - (session.startTime || Date.now()),
        insightCount: session.insights.length,
        // The derived session counter covers every technique-native risk
        // field, not just the legacy `risks` array.
        riskCount: session.metrics?.risksCaught ?? 0,
        totalSteps: session.history.length,
        completedSteps: session.history.length,
        revisionCount: session.history.filter(h => h.isRevision).length,
        branchCount: Object.keys(session.branches).length,
        flexibilityScore: session.pathMemory?.currentFlexibility?.flexibilityScore,
        // effectiveness is 0-1 throughout this file.
        // 0.5 is the fallback for sessions persisted before outputCompleteness existed.
        effectiveness: session.metrics?.outputCompleteness ?? 0.5,
      })
      .catch(console.error);
  }

  /**
   * Extract technique-specific fields from input
   *
   * This was a switch: one `case` per technique, one `if (field)` per field.
   * It knew fourteen techniques, so the other eighteen declared fields in the
   * tool schema, accepted them on input, and got none of them back — a caller
   * could not tell whether the server had read them at all. (An earlier round
   * fixed a narrower version of the same fault: there were two copies of the
   * switch, one live and knowing six, one dead and knowing fourteen.)
   *
   * A table instead, keyed by technique, so `tsc` fails until all thirty-two
   * have an entry. Four of them read no declared field and echo nothing; that
   * is recorded as an empty list rather than an absence, because an absence is
   * what let the eighteen go unnoticed.
   *
   * Membership is what each handler actually reads, recorded by proxying the
   * input object through `validateStep` and `extractInsights` for every step of
   * every technique, not by reading field names. `nine_windows.currentCell` is
   * added on top: it is read at `NineWindowsHandler:212` behind a branch the
   * probe did not reach.
   */
  private static readonly TECHNIQUE_FIELDS: Record<LateralTechnique, readonly string[]> = {
    six_hats: ['hatColor'],
    scamper: [
      'alternativeSuggestions',
      'modificationHistory',
      'modifications',
      'pathImpact',
      'scamperAction',
    ],
    po: ['principles', 'provocation'],
    random_entry: ['connections', 'randomStimulus', 'roryMode'],
    concept_extraction: [
      'abstractedPatterns',
      'applications',
      'extractedConcepts',
      'successExample',
    ],
    yes_and: ['additions', 'evaluations', 'initialIdea'],
    design_thinking: [
      'designStage',
      'empathyInsights',
      'failureInsights',
      'failureModesPredicted',
      'ideaList',
      'problemStatement',
      'prototypeDescription',
      'stressTestResults',
      'userFeedback',
    ],
    triz: ['contradiction', 'inventivePrinciples', 'minimalSolution', 'viaNegativaRemovals'],
    neural_state: ['dominantNetwork', 'integrationInsights', 'suppressionDepth', 'switchingRhythm'],
    temporal_work: [
      'asyncSyncBalance',
      'circadianAlignment',
      'pressureTransformation',
      'temporalEscapeRoutes',
      'temporalLandscape',
    ],
    cultural_integration: [
      'bridgeBuilding',
      'culturalFrameworks',
      'parallelPaths',
      'respectfulSynthesis',
    ],
    collective_intel: [
      'collectiveInsights',
      'emergentPatterns',
      'synergyCombinations',
      'wisdomSources',
    ],
    disney_method: ['criticRisks', 'dreamerVision', 'realistPlan'],
    nine_windows: ['currentCell', 'interdependencies', 'nineWindowsMatrix'],
    quantum_superposition: [
      'amplitudes',
      'chosenState',
      'entanglements',
      'interferencePatterns',
      'measurementCriteria',
      'preservedInsights',
      'solutionStates',
    ],
    temporal_creativity: [
      'accelerationOptions',
      'activeOptions',
      'blackSwanScenarios',
      'currentConstraints',
      'decisionPatterns',
      'delayOptions',
      'lessonIntegration',
      'parallelTimelines',
      'pathHistory',
      'preservedOptions',
      'strategyEvolution',
      'synthesisStrategy',
      'timelineProjections',
    ],
    paradoxical_problem: [
      'metaPath',
      'paradox',
      'parallelPaths',
      'pathContexts',
      'resolutionVerified',
      'solutionA',
      'solutionB',
      'validation',
    ],
    meta_learning: [
      'learningHistory',
      'metaSynthesis',
      'patternRecognition',
      'strategyAdaptations',
    ],
    biomimetic_path: [
      'immuneResponse',
      'mutations',
      'naturalSynthesis',
      'resiliencePatterns',
      'swarmBehavior',
      'symbioticRelationships',
    ],
    first_principles: [
      'assumptions',
      'components',
      'fundamentalTruths',
      'reconstruction',
      'solution',
    ],
    neuro_computational: [
      'computationalModels',
      'convergenceMetrics',
      'finalSynthesis',
      'interferenceAnalysis',
      'neuralMappings',
      'optimizationCycles',
      'patternGenerations',
    ],
    criteria_based_analysis: ['validityScore'],
    linguistic_forensics: ['coherenceScore', 'pronounRatios'],
    competing_hypotheses: ['leadingHypothesis', 'matrix', 'probabilities'],
    reverse_benchmarking: [
      'antiMimeticStrategy',
      'excellenceDesign',
      'vacantSpaces',
      'weaknessMapping',
    ],
    context_reframing: [
      'behavioralMetrics',
      'contextAnalysis',
      'environmentDesign',
      'frameShift',
      'interventions',
    ],
    perception_optimization: [
      'experienceDesign',
      'perceptionGaps',
      'perceptionROI',
      'psychologicalValue',
      'valueAmplification',
    ],
    anecdotal_signal: [
      'anecdoteCount',
      'earlyWarnings',
      'scalingScenarios',
      'signals',
      'strategicResponse',
      'trajectoryAnalysis',
    ],
    cognitive_bias_audit: [],
    latticework: [],
    keeper_test: [],
    // failureModes is the field the step-5 advisory gate reads; a gated field
    // must also be echoed, or the caller can never see what the gate saw.
    steelman_red_team: ['failureModes'],
  };

  private extractTechniqueSpecificFields(input: ThinkingOperationData): Record<string, unknown> {
    const fields: Record<string, unknown> = {};
    const stepInput = input as unknown as Record<string, unknown>;

    // `!== undefined`, not truthiness. Zero is a reading: a `validityScore` of
    // 0 is the criteria-based analysis concluding the account does not hold up,
    // and dropping it reports the step as having measured nothing. The switch
    // had this right for exactly one field — `suppressionDepth`, patched after
    // it bit someone — and wrong for every other number and boolean.
    for (const field of ExecutionResponseBuilder.TECHNIQUE_FIELDS[input.technique]) {
      if (stepInput[field] !== undefined) fields[field] = stepInput[field];
    }

    // Add common risk/adversarial fields if present
    if (stepInput.risks) fields.risks = stepInput.risks;
    if (stepInput.failureModes) fields.failureModes = stepInput.failureModes;
    if (stepInput.mitigations) fields.mitigations = stepInput.mitigations;
    if (stepInput.antifragileProperties)
      fields.antifragileProperties = stepInput.antifragileProperties;
    if (stepInput.blackSwans) fields.blackSwans = stepInput.blackSwans;

    // Add revision fields if present
    if (stepInput.isRevision) fields.isRevision = stepInput.isRevision;
    if (stepInput.revisesStep !== undefined) fields.revisesStep = stepInput.revisesStep;
    if (stepInput.branchFromStep !== undefined) fields.branchFromStep = stepInput.branchFromStep;
    if (stepInput.branchId) fields.branchId = stepInput.branchId;

    // Add synthesis for convergence, whichever technique reached it
    if (stepInput.synthesis) fields.synthesis = stepInput.synthesis;

    return fields;
  }

  private extractPathDependencies(
    input: ExecuteThinkingStepInput,
    pathMemory?: PathMemory
  ): string[] {
    const dependencies: string[] = [];

    if (input.pathImpact && input.pathImpact.dependenciesCreated) {
      dependencies.push(...input.pathImpact.dependenciesCreated);
    }

    if (input.pathImpact && input.pathImpact.commitmentLevel === 'high') {
      dependencies.push(`commitment to ${input.scamperAction || input.technique} approach`);
    }

    if (
      pathMemory &&
      'pathHistory' in pathMemory &&
      Array.isArray(pathMemory.pathHistory) &&
      pathMemory.pathHistory.length > 0
    ) {
      const latestEvent = pathMemory.pathHistory[
        pathMemory.pathHistory.length - 1
      ] as unknown as Record<string, unknown>;
      if (
        'constraintsCreated' in latestEvent &&
        Array.isArray(latestEvent.constraintsCreated) &&
        latestEvent.constraintsCreated.length > 0
      ) {
        dependencies.push(...(latestEvent.constraintsCreated as string[]));
      }
    }

    return dependencies;
  }

  private calculateFlexibilityImpact(
    input: ExecuteThinkingStepInput,
    session: SessionData
  ): number {
    // What this step cost, as the engine recorded it. SCAMPER used to report
    // `-(1 - flexibilityRetention)` here — a cumulative total published under
    // a per-step name, four to five times the actual step cost and
    // non-monotonic — while every other technique reported an unrelated
    // `-(1 - currentFlexibility) * 0.1`. Two formulas, one field name.
    const lastEvent = session.pathMemory?.pathHistory?.at(-1);
    if (lastEvent?.flexibilityImpact !== undefined) {
      // Rounded: this is a 0-1 fraction, and publishing it raw put sixteen
      // significant figures of binary residue on the wire — 0.005 serialised
      // as -0.004999999999999999.
      return Number((-lastEvent.flexibilityImpact).toFixed(4));
    }

    return -0.05;
  }

  private identifyNoteworthyMoment(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    insights: string[]
  ): string | undefined {
    if (input.provocation && input.principles && input.principles.length >= 2) {
      return 'Provocation challenged multiple core assumptions';
    }

    if (input.technique === 'scamper' && input.scamperAction === 'parameterize') {
      return 'Parameter analysis revealed hidden coupling';
    }

    if (input.antifragileProperties && input.antifragileProperties.length >= 3) {
      return 'Multiple antifragile properties discovered';
    }

    if (insights.length > 3 && session.history.length > 5) {
      const recentInsightGrowth = insights.length / session.history.length;
      if (recentInsightGrowth > 0.5) {
        return 'High insight generation rate detected';
      }
    }

    // Temporal work: pressure transformation
    if (
      input.technique === 'temporal_work' &&
      input.currentStep === 3 &&
      input.pressureTransformation &&
      input.pressureTransformation.length > 0
    ) {
      return 'Time pressure successfully transformed into creative catalyst';
    }

    // Disney method: role transitions
    if (
      input.technique === 'disney_method' &&
      input.disneyRole === 'realist' &&
      session.history.some(h => h.disneyRole === 'dreamer')
    ) {
      return 'Successful transition from dreamer to realist perspective';
    }

    // Nine windows: cross-cell insights
    if (
      input.technique === 'nine_windows' &&
      input.currentCell &&
      session.history.length >= 3 &&
      input.interdependencies &&
      input.interdependencies.length > 2
    ) {
      return 'Multiple system interdependencies discovered across time-space matrix';
    }

    // Temporal kairos moments
    if (
      input.technique === 'temporal_work' &&
      input.temporalLandscape?.kairosOpportunities &&
      input.temporalLandscape.kairosOpportunities.length > 0
    ) {
      return 'Kairos opportunities identified';
    }

    return undefined;
  }

  private assessFutureRelevance(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    currentFlexibility: number
  ): string | undefined {
    if (input.technique === 'scamper' && input.scamperAction === 'parameterize') {
      return 'This parameter coupling pattern appears in many system designs';
    }

    if (input.technique === 'triz' && input.contradiction) {
      return 'This contradiction type commonly appears in technical systems';
    }

    if (input.antifragileProperties && input.antifragileProperties.length > 0) {
      return 'These antifragile properties can be applied to other systems';
    }

    // Cross-cultural insights have broad applicability
    if (input.technique === 'cultural_integration') {
      if (input.culturalFrameworks && input.culturalFrameworks.length > 2) {
        return 'These cultural patterns provide templates for diverse problem contexts';
      }
      // Check for implementation paths
      if (input.parallelPaths && input.parallelPaths.length > 0) {
        return 'Implementation patterns can be adapted across different contexts';
      }
    }

    // Collective intelligence patterns
    if (
      input.technique === 'collective_intel' &&
      input.wisdomSources &&
      input.wisdomSources.length > 3
    ) {
      return 'These collective intelligence patterns can enhance future group decisions';
    }

    // Neural state switching techniques
    if (input.technique === 'neural_state' && input.dominantNetwork === 'ecn') {
      return 'This attention management technique improves creative problem-solving capacity';
    }

    // Option generation creates reusable strategies
    // Check if we have generated options in this step (passed as parameter)
    // or if flexibility is low enough that options would have been generated
    // The second arm scanned history for a caller-typed flexibilityScore.
    // The engine's own measurement is what currentFlexibility now carries.
    const hasGeneratedOptions = currentFlexibility < 0.4 && session.history.length > 5;

    if (hasGeneratedOptions) {
      return 'The option generation strategies used here apply to many constrained situations';
    }

    return undefined;
  }

  private checkExecutionComplexity(
    input: ExecuteThinkingStepInput,
    session: SessionData
  ): { level: 'low' | 'medium' | 'high'; suggestion?: ComplexitySuggestion } {
    const assessment = this.complexityAnalyzer.analyze(input.output);
    const recentOutputs = session.history
      .slice(-3)
      .map(h => h.output)
      .join(' ');
    const recentAssessment = this.complexityAnalyzer.analyze(recentOutputs);

    if (assessment.level === 'high' || recentAssessment.level === 'high') {
      const techniqueSpecificSuggestions = this.getComplexitySuggestions(
        input.technique,
        assessment.factors
      );

      return {
        level: 'high',
        suggestion: {
          complexityNote: this.generateComplexityNote(assessment.factors, input.technique),
          suggestedApproach: techniqueSpecificSuggestions,
        },
      };
    }

    return { level: assessment.level };
  }

  private getComplexitySuggestions(technique: string, factors: string[]): Record<string, string> {
    const baseSuggestions: Record<string, string> = {
      Decompose: 'Break this complex problem into 3-5 manageable sub-problems',
      Prioritize: 'Focus on the most critical aspect first, defer others',
    };

    const techniqueSpecific: Record<string, Record<string, string>> = {
      six_hats: {
        'Use White Hat': 'List only facts and data to clarify the situation',
        'Apply Black Hat': 'Focus on one specific risk at a time',
        'Switch to Blue': 'Step back and reorganize your thinking process',
      },
      scamper: {
        'Simplify first': 'Apply "Eliminate" to remove non-essential elements',
        'One action at a time': 'Focus on a single SCAMPER action before combining',
        Parameterize: 'Identify the key parameters driving complexity',
      },
      triz: {
        'Identify core contradiction': 'Strip away details to find the fundamental conflict',
        'Use separation principles': 'Separate in time, space, or condition',
        'Apply inventive principles': 'Try segmentation or asymmetry principles',
      },
    };

    const specific = techniqueSpecific[technique] || {};

    if (factors.includes('multipleInteractingElements')) {
      baseSuggestions['Systems diagram'] = 'Create a simple diagram showing key interactions';
    }

    if (factors.includes('conflictingRequirements')) {
      baseSuggestions['Prioritize conflicts'] = 'Rank conflicts by impact and address the top one';
    }

    return { ...baseSuggestions, ...specific };
  }

  private generateComplexityNote(factors: string[], technique: string): string {
    const factorDescriptions: Record<string, string> = {
      multipleInteractingElements: 'multiple interacting elements',
      conflictingRequirements: 'conflicting requirements',
      highUncertainty: 'high uncertainty',
      multipleStakeholders: 'multiple stakeholders',
      systemComplexity: 'system-level complexity',
      timePressure: 'time pressure',
    };

    const detectedFactors = factors
      .map(f => factorDescriptions[f] || f)
      .filter(Boolean)
      .slice(0, 3);

    if (detectedFactors.length === 0) {
      return 'High complexity detected in current thinking';
    }

    return `High complexity detected due to ${detectedFactors.join(', ')}. The ${technique.replace(/_/g, ' ')} technique can help by focusing on specific aspects.`;
  }
}
