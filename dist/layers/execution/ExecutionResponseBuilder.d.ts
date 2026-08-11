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
    buildResponse(input: ExecuteThinkingStepInput, session: SessionData, sessionId: string, handler: TechniqueHandler, techniqueLocalStep: number, techniqueIndex: number, plan: PlanThinkingSessionOutput | undefined, currentFlexibility: number, optionGenerationResult: OptionGenerationResult | undefined, ergodicityMetrics?: ErgodicityResult['metrics']): LateralThinkingResponse;
    /**
     * Build core response data object with insights and metadata
     */
    private buildCoreResponseData;
    /**
     * Enhance response with memory outputs and technique progress
     */
    private enhanceWithMemoryAndProgress;
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
     * There were two of these. This one is on the live path and covered six
     * techniques; a second copy in `ResponseBuilder` covered fourteen, and sat
     * behind a private `buildCoreResponse` that nothing called — so the eight
     * techniques only the copy knew about (concept_extraction, yes_and,
     * design_thinking, triz, neural_state, temporal_work, cultural_integration,
     * collective_intel) declared fields in the tool schema, accepted them on
     * input, and got none of them back. The copy's coverage is folded in here
     * and the copy is gone, so there is one list to keep in step with the schema
     * rather than two that disagree.
     */
    private extractTechniqueSpecificFields;
    /**
     * How completely a step filled in the outputs its technique asks for.
     *
     * This counts whether optional fields were populated — insights, risks,
     * antifragile properties, provocation/principles. It is a COMPLETENESS
     * measure, not a quality one: four vacuous insights score higher than two
     * excellent ones, and nothing here inspects what was actually written.
     * Named accordingly so it is not mistaken for evidence that a technique
     * worked. Measuring real quality needs the guidance eval, not this.
     */
    private assessOutputCompleteness;
    private extractPathDependencies;
    private calculateFlexibilityImpact;
    private identifyNoteworthyMoment;
    private assessFutureRelevance;
    private checkExecutionComplexity;
    private getComplexitySuggestions;
    private generateComplexityNote;
}
//# sourceMappingURL=ExecutionResponseBuilder.d.ts.map