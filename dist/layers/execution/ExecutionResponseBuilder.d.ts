/**
 * ExecutionResponseBuilder - Handles response building and enhancement
 * Extracted from executeThinkingStep to improve maintainability
 */
import type { ExecuteThinkingStepInput, SessionData, LateralThinkingResponse } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import type { OptionGenerationResult } from '../../ergodicity/optionGeneration/types.js';
import type { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import type { ErgodicityResult } from './ErgodicityResultAdapter.js';
import type { TechniqueHandler } from '../../techniques/types.js';
import type { EscalationPromptGenerator } from '../../ergodicity/escalationPrompts.js';
import type { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import type { SessionManager } from '../../core/SessionManager.js';
import type { ReflexivityWarning } from '../../core/ReflexivityTracker.js';
/**
 * The response keys minimal verbosity keeps — the contract, pinned by
 * response-verbosity.test.ts and minimal-keeps-this-steps-verdict.test.ts.
 *
 * THE RULE, decided rather than accumulated: minimal keeps the step
 * acknowledgment, the steering, and THIS STEP'S VERDICTS — what the server
 * judged about the step just sent. It drops two other kinds of field:
 *
 *  - ECHOES of the caller's own input: problem, output, technique field
 *    values. The caller wrote these; sending them back is weight. Field
 *    values are replaced by `fieldsRecorded` (their names — a receipt
 *    without the echo).
 *  - CUMULATIVE RE-SENDS: fields that repeat, on every step, something the
 *    server already delivered when it happened. `insights` is replaced by
 *    `newInsights` (this step's additions only), and `modificationHistory`
 *    is dropped outright — it is rebuilt by the server from history every
 *    step (execution.ts resets `input.modificationHistory = []` before the
 *    rebuild, and separately strips it from the history entry), so it is not
 *    an echo, but it re-sends every prior scamper step's pathImpact and made
 *    session growth quadratic. Each of those pathImpacts reached the caller
 *    on the step that produced it.
 *
 * `pathImpact` is the case that forced the rule to be written down. It is
 * this step's reversibility judgment — the handler computes it and REPLACES
 * anything sent, and it carries a per-step `reversible` boolean nothing else
 * in a minimal response substitutes for. It was absent from this list while
 * the sunset notice, in three places, described the omission as dropping
 * "echoes of your own input". Measured: a fully populated caller-sent
 * pathImpact comes back with none of its values surviving. It is kept now.
 *
 * Three nested picks that a flat list cannot reach are handled in
 * slimToMinimal: completionMetadata.completionWarnings,
 * executionMetadata.appliedReversibility, and ruinAssessment minus its
 * prompt. The terminal step's completion block bypasses slimming by
 * mechanism — handleSessionCompletion merges it into the already-serialized
 * response after this filter runs — as do the autoSave status fields and
 * advisoryFindings, added the same way.
 *
 * Declared sunset: 'minimal' is the intended future DEFAULT ('full' exists
 * for compatibility); the default flip will ship as a breaking release.
 */
export declare const MINIMAL_RESPONSE_KEEP_KEYS: readonly ["sessionId", "technique", "currentStep", "totalSteps", "nextStepNeeded", "historyLength", "techniqueProgress", "nextStepGuidance", "sequentialThinkingSuggestion", "ergodicityMetrics", "flexibilityScore", "flexibilityMessage", "alternativeSuggestions", "ergodicityCheck", "earlyWarningState", "escapeRecommendation", "reflexivityWarning", "reflectionRequired", "optionGeneration", "realityAssessment", "pathImpact", "persona"];
export declare class ExecutionResponseBuilder {
    private complexityAnalyzer;
    private escalationGenerator;
    private techniqueRegistry?;
    private sessionManager?;
    private responseBuilder;
    private memoryAnalyzer;
    private jsonOptimizer;
    private telemetry;
    private completionTracker;
    private metricsCollector;
    constructor(complexityAnalyzer: HybridComplexityAnalyzer, escalationGenerator: EscalationPromptGenerator, techniqueRegistry?: TechniqueRegistry | undefined, sessionManager?: SessionManager | undefined);
    /**
     * Build comprehensive execution response
     */
    buildResponse(input: ExecuteThinkingStepInput, session: SessionData, sessionId: string, handler: TechniqueHandler, techniqueLocalStep: number, techniqueIndex: number, plan: PlanThinkingSessionOutput | undefined, currentFlexibility: number, optionGenerationResult: OptionGenerationResult | undefined, ergodicityMetrics?: ErgodicityResult['metrics'], reflexivityWarning?: ReflexivityWarning | null): LateralThinkingResponse;
    /**
     * Build core response data object with insights and metadata
     */
    private buildCoreResponseData;
    /**
     * Enhance response with memory outputs and technique progress
     */
    private enhanceWithMemoryAndProgress;
    /**
     * The minimal-verbosity filter: an allowlist over the fully built response.
     * Built-then-filtered (rather than skipping producers) so warning and
     * verdict producers always run; the one producer worth skipping outright
     * (memory decoration) is handled at its call site.
     */
    private slimToMinimal;
    /**
     * Enhance response with flexibility and warnings
     */
    private enhanceWithFlexibilityAndWarnings;
    /**
     * Enhance response with analysis and option generation
     */
    private enhanceWithAnalysisAndOptions;
    private extractInsights;
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
    private ownHistory;
    /**
     * Every technique's current reading of its own steps, in the order the
     * techniques were first used.
     */
    private readInsightsFromHistory;
    private readTechniqueInsights;
    private createOperationData;
    private generateNextStepGuidance;
    /**
     * One-line reminder of a plan-time assigned stimulus, or '' when the plan
     * carries no assignment for this technique. When the technique appears more
     * than once in the plan, ALL assignments are listed by instance — a
     * technique-local step number cannot name its instance (issue #301), so
     * asserting the first instance's value here misdirected every later one.
     */
    private assignedStimulusLine;
    private getBaseGuidance;
    private generateExecutionMetadata;
    private addMemoryOutputs;
    private addTechniqueProgress;
    private addCompletionMetadata;
    private addFlexibilityInfo;
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
    private addErgodicityMetrics;
    private addPathAnalysis;
    private addWarnings;
    private addRealityAssessment;
    private addComplexityAnalysis;
    private addRiskAssessments;
    private addReflectionRequirement;
    private addOptionGeneration;
    private handleSessionCompletion;
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
    private static readonly TECHNIQUE_FIELDS;
    private extractTechniqueSpecificFields;
    private extractPathDependencies;
    private calculateFlexibilityImpact;
    private identifyNoteworthyMoment;
    private assessFutureRelevance;
    private checkExecutionComplexity;
    private getComplexitySuggestions;
    private generateComplexityNote;
}
//# sourceMappingURL=ExecutionResponseBuilder.d.ts.map