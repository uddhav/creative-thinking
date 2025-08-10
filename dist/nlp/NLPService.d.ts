/**
 * Centralized NLP Service
 * Provides consistent and comprehensive natural language processing capabilities
 * using the Compromise library more effectively
 */
/**
 * Semantic analysis result with rich linguistic features
 */
export interface SemanticAnalysis {
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    entities: string[];
    topics: string[];
    people: string[];
    places: string[];
    organizations: string[];
    verbs: string[];
    nouns: string[];
    adjectives: string[];
    adverbs: string[];
    negations: Array<{
        phrase: string;
        scope: string;
    }>;
    conditionals: Array<{
        condition: string;
        consequence: string;
    }>;
    comparisons: string[];
    questions: string[];
    temporalExpressions: string[];
    dates: string[];
    durations: string[];
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    emotionalTone: string[];
    relationships: Array<{
        subject: string;
        verb: string;
        object: string;
    }>;
    contradictionPatterns: Array<{
        type: 'negation' | 'opposition' | 'conditional' | 'antonym';
        pattern: string;
        confidence: number;
    }>;
}
/**
 * Options for semantic analysis
 */
export interface AnalysisOptions {
    maxTextLength?: number;
    includePartOfSpeech?: boolean;
    includeRelationships?: boolean;
    includeSentiment?: boolean;
    cacheResults?: boolean;
}
/**
 * Centralized NLP Service for consistent text analysis
 */
export declare class NLPService {
    private static instance;
    private cache;
    private readonly CACHE_TTL;
    private readonly MAX_CACHE_SIZE;
    private readonly MAX_TEXT_LENGTH;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): NLPService;
    /**
     * Perform comprehensive semantic analysis on text
     */
    analyzeText(text: string, options?: AnalysisOptions): SemanticAnalysis;
    /**
     * Check if text contains paradoxical or contradictory patterns
     */
    detectParadox(text: string): {
        hasParadox: boolean;
        patterns: Array<{
            type: string;
            pattern: string;
            confidence: number;
        }>;
    };
    /**
     * Detect complexity indicators in text
     */
    detectComplexity(text: string): {
        isComplex: boolean;
        factors: string[];
        score: number;
    };
    private validateAndCleanText;
    private getCached;
    private cacheResult;
    private calculateAvgSentenceLength;
    private extractEntities;
    private extractTopics;
    private extractPeople;
    private extractPlaces;
    private extractOrganizations;
    private extractVerbs;
    private extractNouns;
    private extractAdjectives;
    private extractAdverbs;
    private extractNegations;
    private extractConditionals;
    private extractComparisons;
    private extractQuestions;
    private extractTemporalExpressions;
    private extractDates;
    private extractDurations;
    private analyzeSentiment;
    private extractEmotionalTone;
    private extractRelationships;
    private detectContradictionPatterns;
    private findNegationConflicts;
    private findOppositions;
    private findConditionalConflicts;
    /**
     * Clear the cache
     */
    clearCache(): void;
}
//# sourceMappingURL=NLPService.d.ts.map