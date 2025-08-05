/**
 * LLM Handoff Bridge
 * Formats parallel creative thinking results for flexible LLM synthesis
 */
import type { SessionManager } from '../../core/SessionManager.js';
import type { MetricsCollector } from '../../core/MetricsCollector.js';
import type { ParallelResult } from '../../types/handoff.js';
import type { LLMHandoffPackage, LLMHandoffOptions } from '../../types/handoff.js';
export declare class LLMHandoffBridge {
    private sessionManager;
    private metricsCollector;
    private resultStructures;
    private promptGenerator;
    private visualizationGenerator;
    private actionSuggester;
    constructor(sessionManager: SessionManager, metricsCollector: MetricsCollector);
    prepareHandoff(parallelResults: ParallelResult[], problem: string, options?: LLMHandoffOptions): LLMHandoffPackage;
    private structureResults;
    private generateContextSummary;
    private prepareMetadata;
    private calculateExecutionStats;
    private calculateTechniqueMetrics;
    private assessQuality;
    private extractThemes;
    private calculateTotalExecutionTime;
    private countIdeas;
    private calculateTechniqueCompleteness;
    private calculateCompleteness;
    private calculateIdeaDiversity;
    private calculateInsightDepth;
    private calculateRiskCoverage;
    private validateParallelResults;
    private validateProblem;
}
//# sourceMappingURL=LLMHandoffBridge.d.ts.map