/**
 * AugmentedNLPService
 * Enhances the existing NLPService with MCP Sampling capabilities
 * Provides AI-powered NLP features beyond what compromise.js can offer
 */

import { getNLPService } from '../../nlp/NLPService.js';
import type { NLPService, ComprehensiveAnalysis } from '../../nlp/NLPService.js';
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

export class AugmentedNLPService {
  private nlpService: NLPService;

  constructor(private samplingManager: SamplingManager) {
    this.nlpService = getNLPService();
  }

  /**
   * Perform augmented analysis combining local NLP and AI
   */
  async analyzeWithAI(
    text: string,
    options?: {
      includeReasoning?: boolean;
      includeSemantic?: boolean;
      includeQuestions?: boolean;
      domain?: string;
    }
  ): Promise<AugmentedAnalysis> {
    // First, get basic NLP analysis
    const basicAnalysis = this.nlpService.analyze(text);

    // Check if sampling is available
    if (!this.samplingManager.isAvailable()) {
      return this.createFallbackAnalysis(basicAnalysis);
    }

    try {
      // Perform enhanced analysis in parallel
      const [sentiment, intent, semantic, reasoning] = await Promise.allSettled([
        this.enhanceSentiment(text, basicAnalysis),
        this.enhanceIntent(text, basicAnalysis, options?.domain),
        options?.includeSemantic !== false ? this.analyzeSemantics(text) : null,
        options?.includeReasoning ? this.analyzeReasoning(text) : null,
      ]);

      // Generate insights and suggestions
      const insights = await this.generateInsights(text, basicAnalysis);
      const questions = options?.includeQuestions ? await this.generateQuestions(text) : [];

      return {
        ...basicAnalysis,
        enhanced: {
          sentiment: this.resolvePromise(sentiment, this.fallbackSentiment()),
          intent: this.resolvePromise(intent, this.fallbackIntent()),
          semantic: this.resolvePromise(semantic, this.fallbackSemantic()),
          reasoning: this.resolvePromise(reasoning, this.fallbackReasoning()),
          summary: await this.generateSummary(text),
          keyInsights: insights,
          questions,
          suggestions: await this.generateSuggestions(text, basicAnalysis),
        },
      };
    } catch (error) {
      console.error('[AugmentedNLPService] AI analysis failed:', error);
      return this.createFallbackAnalysis(basicAnalysis);
    }
  }

  /**
   * Enhance sentiment analysis with AI
   */
  private async enhanceSentiment(
    text: string,
    basicAnalysis: ComprehensiveAnalysis
  ): Promise<EnhancedSentiment> {
    const result = await this.samplingManager.requestSampling(
      {
        messages: [
          {
            role: 'system',
            content: `You are an expert in emotional analysis and sentiment detection.
Analyze the emotional content and tone of the text.`,
          },
          {
            role: 'user',
            content: `Analyze the sentiment and emotions in this text:
"${text}"

Provide:
1. Overall sentiment (positive/negative/neutral/mixed) with score (-1 to 1)
2. Emotion scores (0-1): joy, sadness, anger, fear, surprise, disgust, trust, anticipation
3. Tone scores (0-1): formal, casual, professional, academic, creative
4. Confidence score (0-1)

Format as JSON.`,
          },
        ],
        temperature: 0.3,
        maxTokens: 400,
      },
      'sentiment_enhancement'
    );

    return this.parseSentimentResponse(result.content, basicAnalysis);
  }

  /**
   * Enhance intent classification with AI
   */
  private async enhanceIntent(
    text: string,
    basicAnalysis: ComprehensiveAnalysis,
    domain?: string
  ): Promise<EnhancedIntent> {
    const result = await this.samplingManager.requestSampling(
      {
        messages: [
          {
            role: 'system',
            content: `You are an expert in understanding user intent and context.
${domain ? `Domain context: ${domain}` : ''}`,
          },
          {
            role: 'user',
            content: `Analyze the intent of this text:
"${text}"

Identify:
1. Primary intent
2. Secondary intents (if any)
3. Urgency level
4. Formality level
5. Emotional state
6. 2-3 suggested responses

Be specific and actionable.`,
          },
        ],
        temperature: 0.4,
        maxTokens: 500,
      },
      'intent_enhancement'
    );

    return this.parseIntentResponse(result.content, basicAnalysis);
  }

  /**
   * Analyze semantic meaning with AI
   */
  private async analyzeSemantics(text: string): Promise<SemanticUnderstanding> {
    const result = await this.samplingManager.requestSampling(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert in semantic analysis and meaning extraction.',
          },
          {
            role: 'user',
            content: `Analyze the deep semantic meaning of:
"${text}"

Identify:
1. Main theme
2. Sub-themes
3. Implicit meanings
4. Cultural references
5. Metaphors (if any)
6. Irony or sarcasm (if any)

Focus on what is implied but not directly stated.`,
          },
        ],
        temperature: 0.5,
        maxTokens: 600,
      },
      'semantic_analysis'
    );

    return this.parseSemanticResponse(result.content);
  }

  /**
   * Analyze reasoning structure with AI
   */
  private async analyzeReasoning(text: string): Promise<ReasoningAnalysis> {
    const result = await this.samplingManager.requestSampling(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert in logical analysis and argumentation.',
          },
          {
            role: 'user',
            content: `Analyze the reasoning structure in:
"${text}"

Identify:
1. Main claims
2. Supporting evidence
3. Conclusions
4. Hidden assumptions
5. Any logical fallacies
6. Type of reasoning (deductive/inductive/abductive)
7. Strength of argument (0-1)`,
          },
        ],
        temperature: 0.3,
        maxTokens: 700,
      },
      'reasoning_analysis'
    );

    return this.parseReasoningResponse(result.content);
  }

  /**
   * Generate insights from analysis
   */
  private async generateInsights(
    text: string,
    basicAnalysis: ComprehensiveAnalysis
  ): Promise<string[]> {
    // Use basic analysis to guide insight generation
    const context = {
      entities: basicAnalysis.entities.people.length + basicAnalysis.entities.organizations.length,
      sentiment: basicAnalysis.sentiment.score,
      hasContradictions: basicAnalysis.contradictions.hasContradiction,
      hasParadoxes: basicAnalysis.paradoxes.hasParadox,
    };

    try {
      const result = await this.samplingManager.requestSampling(
        {
          messages: [
            {
              role: 'system',
              content: 'You generate actionable insights from text analysis.',
            },
            {
              role: 'user',
              content: `Generate 3-5 key insights from this text:
"${text.substring(0, 1000)}"

Context: ${JSON.stringify(context)}

Provide actionable, non-obvious insights.`,
            },
          ],
          temperature: 0.6,
          maxTokens: 400,
        },
        'insight_generation'
      );

      return this.parseInsights(result.content);
    } catch {
      return ['Text contains complex ideas requiring further analysis'];
    }
  }

  /**
   * Generate clarifying questions
   */
  private async generateQuestions(text: string): Promise<string[]> {
    try {
      const result = await this.samplingManager.requestSampling(
        {
          messages: [
            {
              role: 'system',
              content: 'You generate insightful clarifying questions.',
            },
            {
              role: 'user',
              content: `Generate 2-3 clarifying questions for:
"${text.substring(0, 800)}"

Questions should uncover assumptions or explore implications.`,
            },
          ],
          temperature: 0.7,
          maxTokens: 300,
        },
        'question_generation'
      );

      return this.parseQuestions(result.content);
    } catch {
      return [];
    }
  }

  /**
   * Generate summary
   */
  private async generateSummary(text: string): Promise<string> {
    if (text.length < 100) {
      return text; // Too short to summarize
    }

    try {
      const result = await this.samplingManager.requestSampling(
        {
          messages: [
            {
              role: 'system',
              content: 'You create concise, informative summaries.',
            },
            {
              role: 'user',
              content: `Summarize in 1-2 sentences:
"${text.substring(0, 2000)}"`,
            },
          ],
          temperature: 0.4,
          maxTokens: 150,
        },
        'summary_generation'
      );

      return result.content.trim();
    } catch {
      return text.substring(0, 200) + '...';
    }
  }

  /**
   * Generate suggestions based on analysis
   */
  private async generateSuggestions(
    text: string,
    basicAnalysis: ComprehensiveAnalysis
  ): Promise<string[]> {
    // Generate context-aware suggestions
    const hasNegativeSentiment = basicAnalysis.sentiment.score < -0.3;
    const hasContradictions = basicAnalysis.contradictions.hasContradiction;

    if (!hasNegativeSentiment && !hasContradictions) {
      return []; // No suggestions needed
    }

    try {
      const result = await this.samplingManager.requestSampling(
        {
          messages: [
            {
              role: 'system',
              content: 'You provide constructive suggestions for improvement.',
            },
            {
              role: 'user',
              content: `Suggest 2-3 improvements for this text:
"${text.substring(0, 800)}"

Issues detected: ${hasNegativeSentiment ? 'negative tone' : ''} ${hasContradictions ? 'contradictions' : ''}

Provide constructive, actionable suggestions.`,
            },
          ],
          temperature: 0.5,
          maxTokens: 300,
        },
        'suggestion_generation'
      );

      return this.parseSuggestions(result.content);
    } catch {
      return [];
    }
  }

  // Parsing helper methods...

  private parseSentimentResponse(
    response: string,
    basicAnalysis: ComprehensiveAnalysis
  ): EnhancedSentiment {
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(response) as {
        sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
        score?: number;
        emotions?: {
          joy?: number;
          sadness?: number;
          anger?: number;
          fear?: number;
          surprise?: number;
          disgust?: number;
          trust?: number;
          anticipation?: number;
        };
        tone?: {
          formal?: number;
          casual?: number;
          professional?: number;
          academic?: number;
          creative?: number;
        };
        confidence?: number;
      };
      return {
        basicSentiment: {
          polarity: parsed.sentiment || 'neutral',
          score: parsed.score || basicAnalysis.sentiment.score,
        },
        emotions: parsed.emotions
          ? {
              joy: parsed.emotions.joy ?? 0,
              sadness: parsed.emotions.sadness ?? 0,
              anger: parsed.emotions.anger ?? 0,
              fear: parsed.emotions.fear ?? 0,
              surprise: parsed.emotions.surprise ?? 0,
              disgust: parsed.emotions.disgust ?? 0,
              trust: parsed.emotions.trust ?? 0,
              anticipation: parsed.emotions.anticipation ?? 0,
            }
          : this.defaultEmotions(),
        tone: parsed.tone
          ? {
              formal: parsed.tone.formal ?? 0,
              casual: parsed.tone.casual ?? 0,
              professional: parsed.tone.professional ?? 0,
              academic: parsed.tone.academic ?? 0,
              creative: parsed.tone.creative ?? 0,
            }
          : this.defaultTone(),
        confidence: parsed.confidence || 0.7,
      };
    } catch {
      // Fallback parsing
      return this.fallbackSentiment();
    }
  }

  private parseIntentResponse(
    response: string,
    basicAnalysis: ComprehensiveAnalysis
  ): EnhancedIntent {
    // Extract structured data from response
    const lines = response.split('\n');
    const intent: EnhancedIntent = {
      primaryIntent: '',
      secondaryIntents: [],
      contextualFactors: {
        urgency: 'medium',
        formality: 'neutral',
        emotionalState: 'neutral',
        domainContext: 'general',
      },
      suggestedResponses: [],
      confidence: 0.7,
    };

    for (const line of lines) {
      if (line.includes('Primary') || line.includes('primary')) {
        intent.primaryIntent = line.split(':').pop()?.trim() || basicAnalysis.intent.primaryIntent;
      }
      // Parse other fields...
    }

    return intent;
  }

  private parseSemanticResponse(response: string): SemanticUnderstanding {
    // Parse semantic analysis
    return {
      mainTheme: this.extractField(response, 'main theme') || 'general topic',
      subThemes: this.extractList(response, 'sub-theme'),
      implicitMeanings: this.extractList(response, 'implicit'),
      culturalReferences: this.extractList(response, 'cultural'),
      metaphors: [],
      ironySarcasm: {
        detected:
          response.toLowerCase().includes('sarcasm') || response.toLowerCase().includes('irony'),
        instances: [],
        confidence: 0.6,
      },
    };
  }

  private parseReasoningResponse(response: string): ReasoningAnalysis {
    return {
      argumentStructure: {
        claims: this.extractList(response, 'claim'),
        evidence: this.extractList(response, 'evidence'),
        conclusions: this.extractList(response, 'conclusion'),
        assumptions: this.extractList(response, 'assumption'),
      },
      logicalFallacies: [],
      reasoningType: 'mixed',
      strengthOfArgument: 0.5,
    };
  }

  private parseInsights(response: string): string[] {
    return response
      .split('\n')
      .filter(line => line.trim().length > 20)
      .map(line => line.replace(/^[-•*\d.)]\s+/, '').trim())
      .slice(0, 5);
  }

  private parseQuestions(response: string): string[] {
    return response
      .split('\n')
      .filter(line => line.includes('?'))
      .map(line => line.trim())
      .slice(0, 3);
  }

  private parseSuggestions(response: string): string[] {
    return response
      .split('\n')
      .filter(line => line.trim().length > 20)
      .map(line => line.replace(/^[-•*\d.)]\s+/, '').trim())
      .slice(0, 3);
  }

  // Helper methods...

  private extractField(text: string, field: string): string | null {
    const regex = new RegExp(`${field}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractList(text: string, keyword: string): string[] {
    const lines = text.split('\n');
    return lines
      .filter(line => line.toLowerCase().includes(keyword))
      .map(line => line.replace(/^[-•*\d.)]\s+/, '').trim())
      .slice(0, 5);
  }

  private resolvePromise<T>(result: PromiseSettledResult<T | null>, fallback: T): T {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
    return fallback;
  }

  // Fallback methods...

  private createFallbackAnalysis(basicAnalysis: ComprehensiveAnalysis): AugmentedAnalysis {
    return {
      ...basicAnalysis,
      enhanced: {
        sentiment: this.fallbackSentiment(),
        intent: this.fallbackIntent(),
        semantic: this.fallbackSemantic(),
        reasoning: this.fallbackReasoning(),
        summary: 'AI enhancement unavailable',
        keyInsights: [],
        questions: [],
        suggestions: [],
      },
    };
  }

  private fallbackSentiment(): EnhancedSentiment {
    return {
      basicSentiment: { polarity: 'neutral', score: 0 },
      emotions: this.defaultEmotions(),
      tone: this.defaultTone(),
      confidence: 0.5,
    };
  }

  private fallbackIntent(): EnhancedIntent {
    return {
      primaryIntent: 'general',
      secondaryIntents: [],
      contextualFactors: {
        urgency: 'medium',
        formality: 'neutral',
        emotionalState: 'neutral',
        domainContext: 'general',
      },
      suggestedResponses: [],
      confidence: 0.5,
    };
  }

  private fallbackSemantic(): SemanticUnderstanding {
    return {
      mainTheme: 'general',
      subThemes: [],
      implicitMeanings: [],
      culturalReferences: [],
      metaphors: [],
      ironySarcasm: { detected: false, instances: [], confidence: 0 },
    };
  }

  private fallbackReasoning(): ReasoningAnalysis {
    return {
      argumentStructure: {
        claims: [],
        evidence: [],
        conclusions: [],
        assumptions: [],
      },
      logicalFallacies: [],
      reasoningType: 'mixed',
      strengthOfArgument: 0.5,
    };
  }

  private defaultEmotions() {
    return {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      trust: 0,
      anticipation: 0,
    };
  }

  private defaultTone() {
    return {
      formal: 0.5,
      casual: 0.5,
      professional: 0.5,
      academic: 0,
      creative: 0,
    };
  }
}
