/**
 * Memory Analyzer
 * Generates memory-suggestive outputs based on session history and patterns
 */
import type { SessionData, ThinkingOperationData } from '../types/index.js';
export interface MemoryOutputs {
    contextualInsight?: string;
    historicalNote?: string;
    patternObserved?: string;
    sessionFingerprint?: {
        problemType: string;
        solutionPattern: string;
        breakthroughLevel: number;
        pathDependencies: string[];
    };
    noteworthyPatterns?: {
        observed: string;
        significance: string;
        recommendation?: string;
        applicability?: string[];
    };
}
export declare class MemoryAnalyzer {
    private insightRegistry;
    private problemCategorizer;
    private solutionPatternIdentifier;
    constructor();
    /**
     * Generate memory-suggestive outputs for a thinking step
     */
    generateMemoryOutputs(input: ThinkingOperationData, session: SessionData): MemoryOutputs;
    private generateContextualInsight;
    private generateHistoricalNote;
    private identifyPattern;
    private identifyNoteworthyPattern;
    private categorizeProblem;
    private identifySolutionPattern;
    private assessBreakthroughLevel;
    private extractPathDependencies;
}
//# sourceMappingURL=MemoryAnalyzer.d.ts.map