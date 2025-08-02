/**
 * ExecutionResponseBuilder - Handles response building and enhancement
 * Extracted from executeThinkingStep to improve maintainability
 */
import type { ExecuteThinkingStepInput, SessionData, LateralThinkingResponse } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import type { OptionGenerationResult } from '../../ergodicity/optionGeneration/types.js';
import type { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import type { TechniqueHandler } from '../../techniques/types.js';
import type { EscalationPromptGenerator } from '../../ergodicity/escalationPrompts.js';
import type { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
export declare class ExecutionResponseBuilder {
    private complexityAnalyzer;
    private escalationGenerator;
    private techniqueRegistry?;
    private responseBuilder;
    private memoryAnalyzer;
    private jsonOptimizer;
    constructor(complexityAnalyzer: HybridComplexityAnalyzer, escalationGenerator: EscalationPromptGenerator, techniqueRegistry?: TechniqueRegistry | undefined);
    /**
     * Build comprehensive execution response
     */
    buildResponse(input: ExecuteThinkingStepInput, session: SessionData, sessionId: string, handler: TechniqueHandler, techniqueLocalStep: number, techniqueIndex: number, plan: PlanThinkingSessionOutput | undefined, currentFlexibility: number, optionGenerationResult: OptionGenerationResult | undefined): LateralThinkingResponse;
    /**
     * Build core response data object with insights and metadata
     */
    private buildCoreResponseData;
    /**
     * Build core response with insights and metadata
     */
    private buildCoreResponse;
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
    private createOperationData;
    private generateNextStepGuidance;
    private generateExecutionMetadata;
    private addMemoryOutputs;
    private addTechniqueProgress;
    private addFlexibilityInfo;
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
     */
    private extractTechniqueSpecificFields;
    private assessTechniqueEffectiveness;
    private extractPathDependencies;
    private calculateFlexibilityImpact;
    private identifyNoteworthyMoment;
    private assessFutureRelevance;
    private checkExecutionComplexity;
    private getComplexitySuggestions;
    private generateComplexityNote;
}
//# sourceMappingURL=ExecutionResponseBuilder.d.ts.map