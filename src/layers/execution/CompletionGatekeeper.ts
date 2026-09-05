/**
 * CompletionGatekeeper - Enforces completion requirements and prevents premature termination
 * Provides configurable enforcement levels and technique-specific requirements
 */

import type {
  ExecuteThinkingStepInput,
  SessionData,
  LateralThinkingResponse,
} from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import {
  SessionCompletionTracker,
  type SessionCompletionMetadata,
} from '../../core/session/SessionCompletionTracker.js';
import { ResponseBuilder } from '../../core/ResponseBuilder.js';
import { loadEnforcementConfigFromEnv } from '../../config/CompletionEnforcementConfig.js';
import { EnforcementLevel, type CompletionGatekeeperConfig } from '../../types/enforcement.js';

// Re-export for backward compatibility
export { EnforcementLevel, type CompletionGatekeeperConfig };

/**
 * Enforces completion requirements for thinking sessions
 */
export class CompletionGatekeeper {
  private config: CompletionGatekeeperConfig;
  private completionTracker = new SessionCompletionTracker();
  private responseBuilder = new ResponseBuilder();

  constructor(config?: Partial<CompletionGatekeeperConfig>) {
    // Load config from environment first, then apply any explicit overrides
    const envConfig = loadEnforcementConfigFromEnv();
    this.config = { ...envConfig, ...config };
  }

  /**
   * Check if execution can proceed to next step
   */
  canProceedToNextStep(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    plan?: PlanThinkingSessionOutput
  ): { allowed: boolean; response?: LateralThinkingResponse } {
    // No enforcement
    if (this.config.enforcementLevel === EnforcementLevel.NONE) {
      return { allowed: true };
    }

    // Check every termination, not only the ones whose step NUMBER is early.
    //
    // This used to fire only when `currentStep < totalSteps`, so a session that
    // skipped an interior step and then ended on the final step number sailed
    // past the gate: 14 of 15 steps run, step 7 never sent, and the response
    // said `completed: true` with zero warnings — while its own
    // `techniqueStatuses` recorded the gap. The always-block-on-skips check
    // below only protects terminations that reach it. Ending is what makes a
    // missing step permanent, so ending is when the check runs; a genuinely
    // complete session has no skips and passes untouched.
    if (!input.nextStepNeeded) {
      return this.handleEarlyTermination(input, session, plan);
    }

    return { allowed: true };
  }

  /**
   * Check if synthesis is allowed based on completion status
   */
  canProceedToSynthesis(
    session: SessionData,
    plan?: PlanThinkingSessionOutput
  ): { allowed: boolean; response?: LateralThinkingResponse } {
    // Both gatekeeper paths run only when the session is trying to end, so
    // incompleteness here is a real finding rather than progress.
    const metadata = this.completionTracker.calculateCompletionMetadata(session, plan, true);
    const synthesisCheck = this.completionTracker.canProceedToSynthesis(metadata);

    if (synthesisCheck.allowed || this.config.enforcementLevel === EnforcementLevel.LENIENT) {
      return { allowed: true };
    }

    // Build blocking response
    const response = this.buildBlockingResponse(
      'Synthesis Blocked - Incomplete Analysis',
      synthesisCheck.reason || 'Insufficient completion',
      synthesisCheck.requiredActions || [],
      metadata
    );

    return { allowed: false, response };
  }

  /**
   * Handle early termination attempt
   */
  private handleEarlyTermination(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    plan?: PlanThinkingSessionOutput
  ): { allowed: boolean; response?: LateralThinkingResponse } {
    // Both gatekeeper paths run only when the session is trying to end, so
    // incompleteness here is a real finding rather than progress.
    const metadata = this.completionTracker.calculateCompletionMetadata(session, plan, true);
    const remainingSteps = input.totalSteps - input.currentStep;

    // Score termination over the techniques this session actually STARTED.
    //
    // The plan advertises cross-technique parallelism, and running those
    // branches concurrently needs one sessionId each — concurrent executions
    // sharing a session lose a step, measured five runs out of five. But a
    // branch session could not then finish: scoring against the whole plan made
    // the other branches' steps read as skips, so a session holding all four
    // `po` steps of a `po` + `triz` plan was refused with "4 steps were
    // skipped". Shared session loses work, separate sessions could not
    // complete, and the advertised schedule had no valid execution (#308).
    //
    // A technique with no history here was not skipped, it was not this
    // session's business. The protection that matters is untouched: a started
    // technique with an internal gap still blocks.
    //
    // The cost, stated rather than hidden: this cannot distinguish a deliberate
    // branch from an abandoned plan, so a caller running one technique of five
    // in one session can now terminate where it was previously refused. The
    // unstarted techniques stay in the metadata, and the response names them.
    const startedStatuses = metadata.techniqueStatuses.filter(s => s.completedSteps > 0);
    // A session that ran nothing at all is degenerate; fall back to the
    // plan-wide view rather than calling an empty session complete.
    const scoredStatuses =
      startedStatuses.length > 0 ? startedStatuses : metadata.techniqueStatuses;

    // Progress is scored over the same set, for the same reason: judging a
    // finished branch against the whole plan reads 50% and blocks it below.
    const scoredTotal = scoredStatuses.reduce((sum, s) => sum + s.totalSteps, 0);
    const scoredDone = scoredStatuses.reduce((sum, s) => sum + s.completedSteps, 0);
    const completionPercentage =
      scoredTotal > 0 ? scoredDone / scoredTotal : metadata.overallProgress;

    const totalSkippedSteps = scoredStatuses.reduce((sum, s) => sum + s.skippedSteps.length, 0);
    if (totalSkippedSteps > 0) {
      return this.blockTermination(
        input,
        metadata,
        `❌ BLOCKED: ${totalSkippedSteps} steps were skipped. ALL steps MUST be completed sequentially.`
      );
    }

    // Check enforcement level
    switch (this.config.enforcementLevel) {
      case EnforcementLevel.LENIENT:
        // Even in lenient mode, block if very incomplete
        if (completionPercentage < 0.5) {
          return this.blockTermination(
            input,
            metadata,
            `⚠️ Cannot terminate: Only ${Math.round(completionPercentage * 100)}% complete. ` +
              `${remainingSteps} steps remain. ALL steps must be executed.`
          );
        }
        return { allowed: true };

      case EnforcementLevel.STANDARD:
        // Block on what the caller failed to RUN, not on what they never
        // planned. `criticalGapsIdentified` lists techniques the tracker
        // thinks the problem deserved — including ones the plan never
        // contained — so gating on it here refused a fully-run 5-step plan
        // with "100% complete. MANDATORY: Complete all 0 remaining steps."
        // Skipped steps are already an unconditional block above; the gaps
        // stay in the metadata for the caller to weigh.
        if (completionPercentage < 0.7) {
          return this.blockTermination(
            input,
            metadata,
            `❌ Early termination BLOCKED: ${Math.round(completionPercentage * 100)}% complete. ` +
              `MANDATORY: Complete all ${remainingSteps} remaining steps.`
          );
        }
        // Require confirmation for moderate completion
        if (completionPercentage < this.config.requireConfirmationThreshold) {
          return this.requireConfirmation(input, metadata);
        }
        return { allowed: true };

      case EnforcementLevel.STRICT:
        // Always enforce minimum threshold strictly
        if (completionPercentage < this.config.minimumCompletionThreshold) {
          return this.blockTermination(
            input,
            metadata,
            `❌ STRICT MODE: Termination BLOCKED. ` +
              `Minimum ${Math.round(this.config.minimumCompletionThreshold * 100)}% required, ` +
              `currently ${Math.round(completionPercentage * 100)}%. ` +
              `MUST complete all ${remainingSteps} remaining steps.`
          );
        }
        return { allowed: true };

      default:
        return { allowed: true };
    }
  }

  /**
   * Block termination with response
   */
  private blockTermination(
    input: ExecuteThinkingStepInput,
    metadata: SessionCompletionMetadata,
    reason: string
  ): { allowed: boolean; response: LateralThinkingResponse } {
    const remainingSteps = metadata.totalPlannedSteps - metadata.completedSteps;
    const requiredActions = [
      `Complete ${remainingSteps} more steps`,
      ...metadata.criticalGapsIdentified,
    ];

    const response = this.buildBlockingResponse(
      'Early Termination Blocked',
      reason,
      requiredActions,
      metadata
    );

    return { allowed: false, response };
  }

  /**
   * Require confirmation for termination
   */
  private requireConfirmation(
    input: ExecuteThinkingStepInput,
    metadata: SessionCompletionMetadata
  ): { allowed: boolean; response?: LateralThinkingResponse } {
    // In standard mode, we'll add a strong warning but allow continuation
    // In a real implementation, this could trigger a confirmation dialog
    const warnings = [
      `⚠️ Only ${Math.round(metadata.overallProgress * 100)}% complete`,
      `Missing perspectives: ${metadata.missedPerspectives.join(', ')}`,
      'Consider completing more steps for comprehensive analysis',
    ];

    // For now, we'll allow but with warnings
    // In a UI implementation, this would trigger a confirmation
    console.warn('Confirmation required for early termination:', warnings);
    return { allowed: true };
  }

  /**
   * Build blocking response
   */
  private buildBlockingResponse(
    title: string,
    reason: string,
    requiredActions: string[],
    metadata: SessionCompletionMetadata
  ): LateralThinkingResponse {
    const totalSkippedSteps = metadata.techniqueStatuses.reduce(
      (sum, s) => sum + s.skippedSteps.length,
      0
    );
    const outstandingWork = this.describeOutstandingWork(metadata);

    const content = {
      blocked: true,
      title,
      reason,
      completionStatus: {
        overallProgress: Math.round(metadata.overallProgress * 100),
        progressDisplay: this.completionTracker.formatProgressDisplay(metadata),
        criticalGaps: metadata.criticalGapsIdentified,
        missedPerspectives: metadata.missedPerspectives,
        skippedSteps: totalSkippedSteps,
      },
      requiredActions: [
        '❌ MANDATORY: Complete ALL remaining steps sequentially',
        ...requiredActions,
      ],
      criticalInstructions: [
        '1. Set nextStepNeeded: true to continue execution',
        '2. Execute EVERY step in sequence (no skipping)',
        '3. Each step MUST build on previous insights',
        '4. Do NOT terminate until ALL steps are complete',
      ],
      suggestions: [
        'ALL steps in the thinking process are REQUIRED',
        'Use execute_thinking_step with the NEXT sequential step number',
        metadata.skippedTechniques.length > 0
          ? `Execute skipped techniques: ${metadata.skippedTechniques.join(', ')}`
          : null,
      ].filter(Boolean),
      override: this.config.allowExplicitSkip
        ? {
            // What actually clears the block, not a switch that does not exist.
            //
            // This read "To skip anyway, set forceComplete: true in your
            // request". No tool schema declares `forceComplete`, nothing reads
            // one, and `allowExplicitSkip` is on in three of the four
            // enforcement levels — so a blocked caller followed the
            // instruction, the field was ignored, the same block fired again
            // and the session looped. The config and this block stay, because
            // a deployment may key off them; the sentence they carry is now
            // the route that exists, named from what the tracker measured.
            message: outstandingWork.named
              ? `There is no skip flag. Call execute_thinking_step for ${outstandingWork.text} ` +
                `with totalSteps ${outstandingWork.planTotal} — these numbers count across the ` +
                `whole plan, and totalSteps is what tells the server to read them that way. ` +
                `Sent with a single technique's own step count instead, the same numbers name ` +
                `different steps and this block fires again unchanged. Sent as shown, it clears ` +
                `on its own.`
              : `There is no skip flag. Call execute_thinking_step for ${outstandingWork.text} ` +
                `and this block clears on its own.`,
            consequences: metadata.missedPerspectives,
          }
        : undefined,
    };

    return this.responseBuilder.buildSuccessResponse(content);
  }

  /**
   * Name the steps a caller still owes, numbered across the whole plan.
   *
   * Plan-wide is the numbering that can always be acted on. A technique-local
   * number cannot say WHICH run of a repeated technique it means:
   * resolveTechniqueInstance (layers/execution.ts) stamps a run from a cursor
   * that only advances, so once a second run has begun a technique-local step
   * lands on it and a hole in the first run can never be filled — this same
   * block then fires again, unchanged, for as long as the caller keeps
   * following it. A plan-wide number resolves by global range instead, so it
   * names one run and only that one.
   *
   * The total is load-bearing, not decoration. SessionCompletionTracker reads
   * an entry's numbering off that entry's own `totalSteps`, so the total has
   * to travel with the numbers or they are ambiguous at the point of use.
   *
   * Statuses arrive one per workflow occurrence, in order, each carrying that
   * occurrence's own step count — so the offset is the running sum of the
   * ones before it, and the final sum is the plan total.
   *
   * A technique that never started is NOT also read from `skippedTechniques`.
   * Both gatekeeper paths build metadata with isTerminating=true, which makes
   * findSkippedSteps enumerate every unrun step, so an unstarted technique is
   * already in `techniqueStatuses` with a full list. Reading both lists named
   * it twice in one sentence: "po steps 1, 2, 3, 4; six_hats steps 4; po
   * steps 1-4" was the measured output.
   */
  private describeOutstandingWork(metadata: SessionCompletionMetadata): {
    text: string;
    named: boolean;
    planTotal: number;
  } {
    let stepsBefore = 0;
    const fragments: string[] = [];
    for (const status of metadata.techniqueStatuses) {
      if (status.skippedSteps.length > 0) {
        const planWide = status.skippedSteps.map(n => n + stepsBefore);
        fragments.push(
          `${status.technique} ${planWide.length === 1 ? 'step' : 'steps'} ${planWide.join(', ')}`
        );
      }
      stepsBefore += status.totalSteps;
    }

    if (fragments.length > 0) {
      return { text: fragments.join('; '), named: true, planTotal: stepsBefore };
    }

    // No plan, or a session the tracker measures without per-step numbering —
    // say how many are outstanding rather than invent which ones. No numbers
    // named, so no numbering advice applies.
    const remaining = Math.max(0, metadata.totalPlannedSteps - metadata.completedSteps);
    return {
      text: `the ${remaining} step${remaining === 1 ? '' : 's'} still outstanding`,
      named: false,
      planTotal: stepsBefore,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CompletionGatekeeperConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current enforcement level
   */
  getEnforcementLevel(): EnforcementLevel {
    return this.config.enforcementLevel;
  }

  /**
   * Check if a specific technique is critical
   */
  isCriticalTechnique(technique: string): boolean {
    return this.config.criticalTechniques.includes(technique);
  }

  /**
   * Get mandatory steps for a problem type
   */
  getMandatorySteps(problemType: string): string[] {
    return this.config.mandatoryStepsForProblemTypes[problemType] || [];
  }
}
