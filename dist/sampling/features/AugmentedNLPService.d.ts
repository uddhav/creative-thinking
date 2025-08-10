/**
 * AugmentedNLPService
 * Enhances the existing NLPService with MCP Sampling capabilities
 * Provides AI-powered NLP features beyond what compromise.js can offer
 */
import type { ComprehensiveAnalysis } from '../../nlp/NLPService.js';
import type { SamplingManager } from '../SamplingManager.js';
/**
 * Enhanced sentiment analysis with nuanced emotions
 */
export interface EnhancedSentiment {
    basicSentiment: {
        polarity: 'positive' | 'negative' | 'neutral' | 'mixed';
        score: number;
    };
    emotions: {
        joy: number;
        sadness: number;
        anger: number;
        fear: number;
        surprise: number;
        disgust: number;
        trust: number;
        anticipation: number;
    };
    tone: {
        formal: number;
        casual: number;
        professional: number;
        academic: number;
        creative: number;
    };
    confidence: number;
}
/**
 * Enhanced intent with context understanding
 */
export interface EnhancedIntent {
    primaryIntent: string;
    secondaryIntents: string[];
    contextualFactors: {
        urgency: 'low' | 'medium' | 'high';
        formality: 'informal' | 'neutral' | 'formal';
        emotionalState: string;
        domainContext: string;
    };
    suggestedResponses: string[];
    confidence: number;
}
/**
 * Deep semantic understanding
 */
export interface SemanticUnderstanding {
    mainTheme: string;
    subThemes: string[];
    implicitMeanings: string[];
    culturalReferences: string[];
    metaphors: Array<{
        expression: string;
        literalMeaning: string;
        intendedMeaning: string;
    }>;
    ironySarcasm: {
        detected: boolean;
        instances: string[];
        confidence: number;
    };
}
/**
 * Complex reasoning detection
 */
export interface ReasoningAnalysis {
    argumentStructure: {
        claims: string[];
        evidence: string[];
        conclusions: string[];
        assumptions: string[];
    };
    logicalFallacies: Array<{
        type: string;
        description: string;
        example: string;
    }>;
    reasoningType: 'deductive' | 'inductive' | 'abductive' | 'analogical' | 'mixed';
    strengthOfArgument: number;
}
/**
 * Augmented NLP analysis result
 */
export interface AugmentedAnalysis extends ComprehensiveAnalysis {
    enhanced: {
        sentiment: EnhancedSentiment;
        intent: EnhancedIntent;
        semantic: SemanticUnderstanding;
        reasoning: ReasoningAnalysis;
        summary: string;
        keyInsights: string[];
        questions: string[];
        suggestions: string[];
    };
}
export declare class AugmentedNLPService {
    private samplingManager;
    private nlpService;
    constructor(samplingManager: SamplingManager);
    /**
     * Perform augmented analysis combining local NLP and AI
     */
    analyzeWithAI(text: string, options?: {
        includeReasoning?: boolean;
        includeSemantic?: boolean;
        includeQuestions?: boolean;
        domain?: string;
    }): Promise<AugmentedAnalysis>;
    /**
     * Enhance sentiment analysis with AI
     */
    private enhanceSentiment;
    /**
     * Enhance intent classification with AI
     */
    private enhanceIntent;
    /**
     * Analyze semantic meaning with AI
     */
    private analyzeSemantics;
    /**
     * Analyze reasoning structure with AI
     */
    private analyzeReasoning;
    /**
     * Generate insights from analysis
     */
    private generateInsights;
    /**
     * Generate clarifying questions
     */
    private generateQuestions;
    /**
     * Generate summary
     */
    private generateSummary;
    /**
     * Generate suggestions based on analysis
     */
    private generateSuggestions;
    private parseSentimentResponse;
    private parseIntentResponse;
    private parseSemanticResponse;
    private parseReasoningResponse;
    private parseInsights;
    private parseQuestions;
    private parseSuggestions;
    private extractField;
    private extractList;
    private resolvePromise;
    private createFallbackAnalysis;
    private fallbackSentiment;
    private fallbackIntent;
    private fallbackSemantic;
    private fallbackReasoning;
    private defaultEmotions;
    private defaultTone;
}
//# sourceMappingURL=AugmentedNLPService.d.ts.map