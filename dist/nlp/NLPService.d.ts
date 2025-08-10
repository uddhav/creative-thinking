/**
 * Comprehensive NLP Service using compromise.js
 *
 * This service provides advanced natural language processing capabilities
 * utilizing the full feature set of compromise.js including:
 * - Part-of-speech tagging with 83 tags
 * - Grammar interpretation and syntactic parsing
 * - Entity extraction and recognition
 * - Semantic analysis and pattern detection
 * - Temporal expression processing
 *
 * Designed to be extensible for future MCP Sampling integration.
 */
/**
 * Entity types that can be extracted
 */
export interface EntityExtraction {
    people: string[];
    places: string[];
    organizations: string[];
    dates: string[];
    money: string[];
    percentages: string[];
    emails: string[];
    phoneNumbers: string[];
    urls: string[];
    hashtags: string[];
    topics: string[];
    nouns: string[];
    verbs: string[];
    adjectives: string[];
    adverbs: string[];
}
/**
 * Part-of-speech tagging result
 */
export interface POSTagging {
    tokens: Array<{
        text: string;
        tags: string[];
        normal: string;
        implicit?: string;
    }>;
    sentences: Array<{
        text: string;
        type: 'statement' | 'question' | 'exclamation' | 'command';
    }>;
}
/**
 * Contradiction analysis result
 */
export interface ContradictionAnalysis {
    hasContradiction: boolean;
    contradictions: Array<{
        type: 'negation' | 'opposition' | 'mutual_exclusion' | 'semantic';
        elements: [string, string];
        confidence: number;
        context: string;
    }>;
    negations: Array<{
        verb: string;
        negated: boolean;
        context: string;
    }>;
}
/**
 * Paradox analysis result
 */
export interface ParadoxAnalysis {
    hasParadox: boolean;
    paradoxes: Array<{
        type: 'self_reference' | 'circular' | 'contradictory_requirements' | 'impossible_conditions';
        description: string;
        elements: string[];
        confidence: number;
    }>;
    conflictingGoals: Array<{
        goal1: string;
        goal2: string;
        conflict: string;
    }>;
}
/**
 * Relationship extraction result
 */
export interface RelationshipGraph {
    relationships: Array<{
        subject: string;
        verb: string;
        object: string;
        modifiers: string[];
        type: 'action' | 'state' | 'possession' | 'comparison';
    }>;
    dependencies: Array<{
        dependent: string;
        dependency: string;
        type: 'causal' | 'conditional' | 'temporal' | 'logical';
    }>;
}
/**
 * Topic modeling result
 */
export interface TopicModeling {
    mainTopics: string[];
    keywords: string[];
    concepts: Array<{
        concept: string;
        frequency: number;
        importance: number;
    }>;
    categories: string[];
}
/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
    overall: 'positive' | 'negative' | 'neutral' | 'mixed';
    score: number;
    emotions: Array<{
        emotion: string;
        intensity: number;
    }>;
    subjectivity: number;
    confidence: number;
}
/**
 * Intent classification result
 */
export interface IntentClassification {
    primaryIntent: string;
    intents: Array<{
        intent: string;
        confidence: number;
    }>;
    questionType?: 'what' | 'why' | 'how' | 'when' | 'where' | 'who' | 'which' | 'yes_no';
    actionRequired: boolean;
}
/**
 * Temporal analysis result
 */
export interface TemporalAnalysis {
    expressions: Array<{
        text: string;
        type: 'date' | 'time' | 'duration' | 'frequency' | 'deadline';
        normalized?: string;
    }>;
    timeline: Array<{
        event: string;
        temporal: string;
        order: number;
    }>;
    urgency: 'immediate' | 'high' | 'medium' | 'low' | 'none';
    hasDeadline: boolean;
}
/**
 * Readability metrics
 */
export interface ReadabilityMetrics {
    avgWordLength: number;
    avgSentenceLength: number;
    syllableCount: number;
    complexWordCount: number;
    passiveVoiceCount: number;
    readabilityScore: number;
    gradeLevel: number;
    clarity: 'very_clear' | 'clear' | 'moderate' | 'complex' | 'very_complex';
}
/**
 * N-gram analysis result
 */
export interface NGramAnalysis {
    n: number;
    grams: Array<{
        text: string;
        count: number;
        frequency: number;
    }>;
    collocations: Array<{
        words: string[];
        strength: number;
    }>;
}
/**
 * Comprehensive analysis combining all features
 */
export interface ComprehensiveAnalysis {
    entities: EntityExtraction;
    pos: POSTagging;
    contradictions: ContradictionAnalysis;
    paradoxes: ParadoxAnalysis;
    relationships: RelationshipGraph;
    topics: TopicModeling;
    sentiment: SentimentAnalysis;
    intent: IntentClassification;
    temporal: TemporalAnalysis;
    readability: ReadabilityMetrics;
    metadata: {
        wordCount: number;
        sentenceCount: number;
        paragraphCount: number;
        processingTime: number;
        confidence: number;
    };
}
/**
 * Main NLP Service class
 */
export declare class NLPService {
    private cache;
    private readonly cacheTimeout;
    private readonly maxCacheSize;
    constructor();
    /**
     * Warm up the NLP engine to avoid first-use initialization overhead
     */
    private warmUp;
    /**
     * Perform comprehensive analysis on text
     */
    analyze(text: string): ComprehensiveAnalysis;
    /**
     * Extract entities from text
     */
    extractEntities(text: string): EntityExtraction;
    /**
     * Tag parts of speech
     */
    tagPartsOfSpeech(text: string): POSTagging;
    /**
     * Detect contradictions in text
     */
    detectContradictions(text: string): ContradictionAnalysis;
    /**
     * Detect paradoxes in text
     */
    detectParadoxes(text: string): ParadoxAnalysis;
    /**
     * Extract relationships from text
     */
    extractRelationships(text: string): RelationshipGraph;
    /**
     * Extract topics from text
     */
    extractTopics(text: string): TopicModeling;
    /**
     * Analyze sentiment
     */
    analyzeSentiment(text: string): SentimentAnalysis;
    /**
     * Classify intent
     */
    classifyIntent(text: string): IntentClassification;
    /**
     * Extract temporal expressions
     */
    extractTemporalExpressions(text: string): TemporalAnalysis;
    /**
     * Compute readability metrics
     */
    computeReadability(text: string): ReadabilityMetrics;
    /**
     * Extract N-grams from text
     */
    extractNGrams(text: string, n: number): NGramAnalysis;
    /**
     * Normalize text for processing
     */
    normalizeText(text: string): string;
    /**
     * Get or create a compromise document from cache
     */
    private getOrCreateDoc;
    /**
     * Update cache with document and optional analysis
     */
    private updateCache;
    /**
     * Count syllables in a word (approximation)
     */
    private countSyllables;
    /**
     * Check if two actions are similar
     */
    private areSimilarActions;
    /**
     * Check if two words are synonyms (simplified)
     */
    private areSynonyms;
    /**
     * Check if two goals are conflicting
     */
    private areConflictingGoals;
    /**
     * Classify relation type based on verb
     */
    private classifyRelationType;
    /**
     * Calculate overall confidence based on text quality
     */
    private calculateOverallConfidence;
    /**
     * Clear the cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        entries: string[];
    };
}
/**
 * Get singleton instance of NLPService
 */
export declare function getNLPService(): NLPService;
export declare const nlpService: NLPService;
//# sourceMappingURL=NLPService.d.ts.map