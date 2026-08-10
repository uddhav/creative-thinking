/**
 * Observations about a step, for the memory channel.
 *
 * These sit beside each handler's own `extractInsights`, which reports what the
 * step said. What belongs here is what is true of the step by construction —
 * counts of what the caller sent, readings it recorded — and nothing else.
 *
 * Seven entries here used to assert outcomes instead: a green hat on step 6
 * meant "Creative solutions generated after systematic analysis", a
 * contradiction meant "opening path to breakthrough", more than three
 * additions meant "Collaborative momentum achieved", and user feedback on the
 * last Design Thinking step meant "Testing validated solution assumptions" —
 * emitted whether the testing validated anything or refuted it. Two strategies
 * held nothing but such a claim and are gone.
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
export declare class SCAMPERInsightStrategy implements InsightStrategy {
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
    private static instance;
    private strategies;
    private strategyCache;
    private constructor();
    static getInstance(): InsightStrategyRegistry;
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
    private static instance;
    private strategies;
    private categoryCache;
    private constructor();
    static getInstance(): ProblemCategorizationEngine;
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
    private static instance;
    private strategies;
    private patternCache;
    private constructor();
    static getInstance(): SolutionPatternIdentifier;
    identify(techniques: string[], history: Array<{
        antifragileProperties?: string[];
    }>): string;
    private hasAntifragileProperties;
}
//# sourceMappingURL=insightStrategies.d.ts.map