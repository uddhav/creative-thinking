/**
 * Insight generation strategies for different thinking techniques
 */
import type { ThinkingOperationData, SessionData } from '../types/index.js';
export interface InsightStrategy {
    technique: string;
    generateInsight(input: ThinkingOperationData, session: SessionData): string | undefined;
}
export declare class SixHatsInsightStrategy implements InsightStrategy {
    technique: string;
    generateInsight(input: ThinkingOperationData): string | undefined;
}
export declare class POInsightStrategy implements InsightStrategy {
    technique: string;
    generateInsight(input: ThinkingOperationData): string | undefined;
}
export declare class DesignThinkingInsightStrategy implements InsightStrategy {
    technique: string;
    generateInsight(input: ThinkingOperationData): string | undefined;
}
export declare class TRIZInsightStrategy implements InsightStrategy {
    technique: string;
    generateInsight(input: ThinkingOperationData): string | undefined;
}
export declare class SCAMPERInsightStrategy implements InsightStrategy {
    technique: string;
    generateInsight(input: ThinkingOperationData): string | undefined;
}
export declare class YesAndInsightStrategy implements InsightStrategy {
    technique: string;
    generateInsight(input: ThinkingOperationData): string | undefined;
}
export declare class NeuralStateInsightStrategy implements InsightStrategy {
    technique: string;
    generateInsight(input: ThinkingOperationData): string | undefined;
}
export declare class CollectiveIntelInsightStrategy implements InsightStrategy {
    technique: string;
    generateInsight(input: ThinkingOperationData): string | undefined;
}
export declare class CrossCulturalInsightStrategy implements InsightStrategy {
    technique: string;
    generateInsight(input: ThinkingOperationData): string | undefined;
}
export declare class TemporalWorkInsightStrategy implements InsightStrategy {
    technique: string;
    generateInsight(input: ThinkingOperationData): string | undefined;
}
/**
 * Registry of all insight strategies
 */
export declare class InsightStrategyRegistry {
    private strategies;
    constructor();
    private registerDefaultStrategies;
    getStrategy(technique: string): InsightStrategy | undefined;
    registerStrategy(strategy: InsightStrategy): void;
}
/**
 * Problem categorization strategies
 */
export interface ProblemCategoryStrategy {
    keywords: string[];
    category: string;
}
export declare class ProblemCategorizationEngine {
    private strategies;
    categorize(problem: string): string;
}
/**
 * Solution pattern identification strategies
 */
export interface SolutionPatternStrategy {
    identifier: (techniques: string[], history: Array<{
        antifragileProperties?: string[];
    }>) => boolean;
    pattern: string;
}
export declare class SolutionPatternIdentifier {
    private strategies;
    identify(techniques: string[], history: Array<{
        antifragileProperties?: string[];
    }>): string;
}
//# sourceMappingURL=insightStrategies.d.ts.map