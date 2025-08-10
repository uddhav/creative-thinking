/**
 * AugmentedNLPService
 * Enhances the existing NLPService with MCP Sampling capabilities
 * Provides AI-powered NLP features beyond what compromise.js can offer
 */
import { getNLPService } from '../../nlp/NLPService.js';
export class AugmentedNLPService {
    samplingManager;
    nlpService;
    constructor(samplingManager) {
        this.samplingManager = samplingManager;
        this.nlpService = getNLPService();
    }
    /**
     * Perform augmented analysis combining local NLP and AI
     */
    async analyzeWithAI(text, options) {
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
        }
        catch (error) {
            console.error('[AugmentedNLPService] AI analysis failed:', error);
            return this.createFallbackAnalysis(basicAnalysis);
        }
    }
    /**
     * Enhance sentiment analysis with AI
     */
    async enhanceSentiment(text, basicAnalysis) {
        const result = await this.samplingManager.requestSampling({
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
        }, 'sentiment_enhancement');
        return this.parseSentimentResponse(result.content, basicAnalysis);
    }
    /**
     * Enhance intent classification with AI
     */
    async enhanceIntent(text, basicAnalysis, domain) {
        const result = await this.samplingManager.requestSampling({
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
        }, 'intent_enhancement');
        return this.parseIntentResponse(result.content, basicAnalysis);
    }
    /**
     * Analyze semantic meaning with AI
     */
    async analyzeSemantics(text) {
        const result = await this.samplingManager.requestSampling({
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
        }, 'semantic_analysis');
        return this.parseSemanticResponse(result.content);
    }
    /**
     * Analyze reasoning structure with AI
     */
    async analyzeReasoning(text) {
        const result = await this.samplingManager.requestSampling({
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
        }, 'reasoning_analysis');
        return this.parseReasoningResponse(result.content);
    }
    /**
     * Generate insights from analysis
     */
    async generateInsights(text, basicAnalysis) {
        // Use basic analysis to guide insight generation
        const context = {
            entities: basicAnalysis.entities.people.length + basicAnalysis.entities.organizations.length,
            sentiment: basicAnalysis.sentiment.score,
            hasContradictions: basicAnalysis.contradictions.hasContradiction,
            hasParadoxes: basicAnalysis.paradoxes.hasParadox,
        };
        try {
            const result = await this.samplingManager.requestSampling({
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
            }, 'insight_generation');
            return this.parseInsights(result.content);
        }
        catch {
            return ['Text contains complex ideas requiring further analysis'];
        }
    }
    /**
     * Generate clarifying questions
     */
    async generateQuestions(text) {
        try {
            const result = await this.samplingManager.requestSampling({
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
            }, 'question_generation');
            return this.parseQuestions(result.content);
        }
        catch {
            return [];
        }
    }
    /**
     * Generate summary
     */
    async generateSummary(text) {
        if (text.length < 100) {
            return text; // Too short to summarize
        }
        try {
            const result = await this.samplingManager.requestSampling({
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
            }, 'summary_generation');
            return result.content.trim();
        }
        catch {
            return text.substring(0, 200) + '...';
        }
    }
    /**
     * Generate suggestions based on analysis
     */
    async generateSuggestions(text, basicAnalysis) {
        // Generate context-aware suggestions
        const hasNegativeSentiment = basicAnalysis.sentiment.score < -0.3;
        const hasContradictions = basicAnalysis.contradictions.hasContradiction;
        if (!hasNegativeSentiment && !hasContradictions) {
            return []; // No suggestions needed
        }
        try {
            const result = await this.samplingManager.requestSampling({
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
            }, 'suggestion_generation');
            return this.parseSuggestions(result.content);
        }
        catch {
            return [];
        }
    }
    // Parsing helper methods...
    parseSentimentResponse(response, basicAnalysis) {
        // Try to parse JSON response
        try {
            const parsed = JSON.parse(response);
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
        }
        catch {
            // Fallback parsing
            return this.fallbackSentiment();
        }
    }
    parseIntentResponse(response, basicAnalysis) {
        // Extract structured data from response
        const lines = response.split('\n');
        const intent = {
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
    parseSemanticResponse(response) {
        // Parse semantic analysis
        return {
            mainTheme: this.extractField(response, 'main theme') || 'general topic',
            subThemes: this.extractList(response, 'sub-theme'),
            implicitMeanings: this.extractList(response, 'implicit'),
            culturalReferences: this.extractList(response, 'cultural'),
            metaphors: [],
            ironySarcasm: {
                detected: response.toLowerCase().includes('sarcasm') || response.toLowerCase().includes('irony'),
                instances: [],
                confidence: 0.6,
            },
        };
    }
    parseReasoningResponse(response) {
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
    parseInsights(response) {
        return response
            .split('\n')
            .filter(line => line.trim().length > 20)
            .map(line => line.replace(/^[-•*\d.)]\s+/, '').trim())
            .slice(0, 5);
    }
    parseQuestions(response) {
        return response
            .split('\n')
            .filter(line => line.includes('?'))
            .map(line => line.trim())
            .slice(0, 3);
    }
    parseSuggestions(response) {
        return response
            .split('\n')
            .filter(line => line.trim().length > 20)
            .map(line => line.replace(/^[-•*\d.)]\s+/, '').trim())
            .slice(0, 3);
    }
    // Helper methods...
    extractField(text, field) {
        const regex = new RegExp(`${field}[:\\s]+([^\\n]+)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    }
    extractList(text, keyword) {
        const lines = text.split('\n');
        return lines
            .filter(line => line.toLowerCase().includes(keyword))
            .map(line => line.replace(/^[-•*\d.)]\s+/, '').trim())
            .slice(0, 5);
    }
    resolvePromise(result, fallback) {
        if (result.status === 'fulfilled' && result.value) {
            return result.value;
        }
        return fallback;
    }
    // Fallback methods...
    createFallbackAnalysis(basicAnalysis) {
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
    fallbackSentiment() {
        return {
            basicSentiment: { polarity: 'neutral', score: 0 },
            emotions: this.defaultEmotions(),
            tone: this.defaultTone(),
            confidence: 0.5,
        };
    }
    fallbackIntent() {
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
    fallbackSemantic() {
        return {
            mainTheme: 'general',
            subThemes: [],
            implicitMeanings: [],
            culturalReferences: [],
            metaphors: [],
            ironySarcasm: { detected: false, instances: [], confidence: 0 },
        };
    }
    fallbackReasoning() {
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
    defaultEmotions() {
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
    defaultTone() {
        return {
            formal: 0.5,
            casual: 0.5,
            professional: 0.5,
            academic: 0,
            creative: 0,
        };
    }
}
//# sourceMappingURL=AugmentedNLPService.js.map