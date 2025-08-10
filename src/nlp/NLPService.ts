/**
 * Centralized NLP Service
 * Provides consistent and comprehensive natural language processing capabilities
 * using the Compromise library more effectively
 */

import nlp from 'compromise';

type NlpDoc = ReturnType<typeof nlp>;

/**
 * Semantic analysis result with rich linguistic features
 */
export interface SemanticAnalysis {
  // Core metrics
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;

  // Extracted entities and concepts
  entities: string[];
  topics: string[];
  people: string[];
  places: string[];
  organizations: string[];

  // Grammatical analysis
  verbs: string[];
  nouns: string[];
  adjectives: string[];
  adverbs: string[];

  // Semantic patterns
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

  // Temporal analysis
  temporalExpressions: string[];
  dates: string[];
  durations: string[];

  // Sentiment and tone
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  emotionalTone: string[];

  // Relationships
  relationships: Array<{
    subject: string;
    verb: string;
    object: string;
  }>;

  // Contradiction indicators
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
export class NLPService {
  private static instance: NLPService;
  private cache: Map<string, { doc: NlpDoc; analysis: SemanticAnalysis; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MAX_TEXT_LENGTH = 10000;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NLPService {
    if (!NLPService.instance) {
      NLPService.instance = new NLPService();
    }
    return NLPService.instance;
  }

  /**
   * Perform comprehensive semantic analysis on text
   */
  analyzeText(text: string, options: AnalysisOptions = {}): SemanticAnalysis {
    // Validate input
    const cleanText = this.validateAndCleanText(text, options.maxTextLength);

    // Check cache
    if (options.cacheResults !== false) {
      const cached = this.getCached(cleanText);
      if (cached) return cached.analysis;
    }

    // Parse with NLP
    const doc = nlp(cleanText);

    // Perform comprehensive analysis
    const analysis: SemanticAnalysis = {
      // Core metrics
      wordCount: doc.wordCount() || 0,
      sentenceCount: doc.sentences().length || 0,
      avgSentenceLength: this.calculateAvgSentenceLength(doc),

      // Entities and concepts
      entities: this.extractEntities(doc),
      topics: this.extractTopics(doc),
      people: this.extractPeople(doc),
      places: this.extractPlaces(doc),
      organizations: this.extractOrganizations(doc),

      // Grammatical analysis
      verbs: this.extractVerbs(doc),
      nouns: this.extractNouns(doc),
      adjectives: this.extractAdjectives(doc),
      adverbs: this.extractAdverbs(doc),

      // Semantic patterns
      negations: this.extractNegations(doc),
      conditionals: this.extractConditionals(doc),
      comparisons: this.extractComparisons(doc),
      questions: this.extractQuestions(doc),

      // Temporal analysis
      temporalExpressions: this.extractTemporalExpressions(doc),
      dates: this.extractDates(doc),
      durations: this.extractDurations(doc),

      // Sentiment
      sentiment: options.includeSentiment !== false ? this.analyzeSentiment(doc) : 'neutral',
      emotionalTone: options.includeSentiment !== false ? this.extractEmotionalTone(doc) : [],

      // Relationships
      relationships: options.includeRelationships !== false ? this.extractRelationships(doc) : [],

      // Contradictions
      contradictionPatterns: this.detectContradictionPatterns(doc, cleanText),
    };

    // Cache result
    if (options.cacheResults !== false) {
      this.cacheResult(cleanText, doc, analysis);
    }

    return analysis;
  }

  /**
   * Check if text contains paradoxical or contradictory patterns
   */
  detectParadox(text: string): {
    hasParadox: boolean;
    patterns: Array<{ type: string; pattern: string; confidence: number }>;
  } {
    const analysis = this.analyzeText(text);

    // Check for contradiction patterns
    const hasContradictions = analysis.contradictionPatterns.length > 0;

    // Check for specific paradox indicators
    const paradoxPatterns: Array<{ type: string; pattern: string; confidence: number }> = [];

    // Strong negation patterns
    if (analysis.negations.length > 1) {
      const negationConflicts = this.findNegationConflicts(analysis.negations);
      paradoxPatterns.push(...negationConflicts);
    }

    // Opposing adjectives or verbs
    const oppositions = this.findOppositions(analysis);
    paradoxPatterns.push(...oppositions);

    // Conditional contradictions
    if (analysis.conditionals.length > 1) {
      const conditionalConflicts = this.findConditionalConflicts(analysis.conditionals);
      paradoxPatterns.push(...conditionalConflicts);
    }

    // Add contradiction patterns
    paradoxPatterns.push(...analysis.contradictionPatterns);

    return {
      hasParadox: hasContradictions || paradoxPatterns.length > 0,
      patterns: paradoxPatterns,
    };
  }

  /**
   * Detect complexity indicators in text
   */
  detectComplexity(text: string): {
    isComplex: boolean;
    factors: string[];
    score: number;
  } {
    const analysis = this.analyzeText(text);
    const factors: string[] = [];
    let score = 0;

    // Multiple interacting entities
    if (analysis.entities.length > 3) {
      factors.push('multiple interacting elements');
      score += 0.2;
    }

    // Long sentences indicate complexity
    if (analysis.avgSentenceLength > 20) {
      factors.push('complex sentence structure');
      score += 0.15;
    }

    // Multiple relationships
    if (analysis.relationships.length > 5) {
      factors.push('multiple relationships');
      score += 0.2;
    }

    // Conditionals add complexity
    if (analysis.conditionals.length > 2) {
      factors.push('multiple conditions');
      score += 0.15;
    }

    // Negations add cognitive load
    if (analysis.negations.length > 2) {
      factors.push('multiple negations');
      score += 0.1;
    }

    // Questions indicate uncertainty
    if (analysis.questions.length > 0) {
      factors.push('uncertainty/questions');
      score += 0.1;
    }

    // Comparisons indicate trade-offs
    if (analysis.comparisons.length > 0) {
      factors.push('comparisons/trade-offs');
      score += 0.1;
    }

    return {
      isComplex: score > 0.3,
      factors,
      score: Math.min(score, 1.0),
    };
  }

  // Private helper methods

  private validateAndCleanText(text: string, maxLength?: number): string {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    const limit = maxLength || this.MAX_TEXT_LENGTH;
    const cleaned = text.trim().slice(0, limit);

    if (cleaned.length === 0) {
      throw new Error('Empty text after cleaning');
    }

    return cleaned;
  }

  private getCached(text: string): { doc: NlpDoc; analysis: SemanticAnalysis } | null {
    const cached = this.cache.get(text);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }
    return null;
  }

  private cacheResult(text: string, doc: NlpDoc, analysis: SemanticAnalysis): void {
    // Clean old cache entries if needed
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(text, { doc, analysis, timestamp: Date.now() });
  }

  private calculateAvgSentenceLength(doc: NlpDoc): number {
    const sentences = doc.sentences();
    const sentenceCount = sentences.length || 1;
    const wordCount = doc.wordCount() || 0;
    return wordCount / sentenceCount;
  }

  private extractEntities(doc: NlpDoc): string[] {
    const topics = (doc.topics().out('array') || []) as string[];
    const people = (doc.people().out('array') || []) as string[];
    const places = (doc.places().out('array') || []) as string[];
    const orgs = (doc.organizations?.().out('array') || []) as string[];
    return [...new Set([...topics, ...people, ...places, ...orgs])];
  }

  private extractTopics(doc: NlpDoc): string[] {
    return (doc.topics().out('array') || []) as string[];
  }

  private extractPeople(doc: NlpDoc): string[] {
    return (doc.people().out('array') || []) as string[];
  }

  private extractPlaces(doc: NlpDoc): string[] {
    return (doc.places().out('array') || []) as string[];
  }

  private extractOrganizations(doc: NlpDoc): string[] {
    return (doc.organizations?.().out('array') || []) as string[];
  }

  private extractVerbs(doc: NlpDoc): string[] {
    return (doc.verbs().out('array') || []) as string[];
  }

  private extractNouns(doc: NlpDoc): string[] {
    return (doc.nouns().out('array') || []) as string[];
  }

  private extractAdjectives(doc: NlpDoc): string[] {
    return (doc.adjectives().out('array') || []) as string[];
  }

  private extractAdverbs(doc: NlpDoc): string[] {
    return (doc.adverbs().out('array') || []) as string[];
  }

  private extractNegations(doc: NlpDoc): Array<{ phrase: string; scope: string }> {
    const negations: Array<{ phrase: string; scope: string }> = [];

    // Find sentences with negation words
    const negativeWords = ['not', 'no', 'never', 'neither', 'nor', 'cannot', "can't", "won't"];
    doc.sentences().forEach(sentence => {
      const sentText = sentence.text();
      negativeWords.forEach(neg => {
        if (sentText.toLowerCase().includes(neg)) {
          negations.push({
            phrase: neg,
            scope: sentText,
          });
        }
      });
    });

    return negations;
  }

  private extractConditionals(doc: NlpDoc): Array<{ condition: string; consequence: string }> {
    const conditionals: Array<{ condition: string; consequence: string }> = [];

    // Look for if-then patterns
    doc.sentences().forEach(sentence => {
      const text = sentence.text();
      const ifMatch = text.match(/if\s+(.+?),?\s+then\s+(.+)/i);
      if (ifMatch) {
        conditionals.push({
          condition: ifMatch[1].trim(),
          consequence: ifMatch[2].trim(),
        });
      }

      // Also check for "when X, Y" patterns
      const whenMatch = text.match(/when\s+(.+?),\s+(.+)/i);
      if (whenMatch) {
        conditionals.push({
          condition: whenMatch[1].trim(),
          consequence: whenMatch[2].trim(),
        });
      }
    });

    return conditionals;
  }

  private extractComparisons(doc: NlpDoc): string[] {
    const comparisons: string[] = [];

    // Look for comparative words
    const comparativePatterns = [
      'more than',
      'less than',
      'better',
      'worse',
      'versus',
      'vs',
      'compared to',
    ];

    doc.sentences().forEach(sentence => {
      const text = sentence.text().toLowerCase();
      comparativePatterns.forEach(pattern => {
        if (text.includes(pattern)) {
          comparisons.push(sentence.text());
        }
      });
    });

    return comparisons;
  }

  private extractQuestions(doc: NlpDoc): string[] {
    return (doc.questions().out('array') || []) as string[];
  }

  private extractTemporalExpressions(doc: NlpDoc): string[] {
    const temporal: string[] = [];

    // Extract dates using our custom method
    const dates = this.extractDates(doc);
    temporal.push(...dates);

    // Look for time-related words
    const timeWords = ['deadline', 'urgent', 'soon', 'later', 'now', 'tomorrow', 'yesterday'];
    doc.sentences().forEach(sentence => {
      const text = sentence.text().toLowerCase();
      timeWords.forEach(word => {
        if (text.includes(word)) {
          temporal.push(word);
        }
      });
    });

    return [...new Set(temporal)];
  }

  private extractDates(doc: NlpDoc): string[] {
    // Compromise doesn't have a dates() method, extract manually
    const dates: string[] = [];
    const datePatterns =
      /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|january|february|march|april|may|june|july|august|september|october|november|december)\b/gi;
    const text = doc.text();
    const matches = text.match(datePatterns);
    if (matches) {
      dates.push(...matches);
    }
    return dates;
  }

  private extractDurations(doc: NlpDoc): string[] {
    const durations: string[] = [];

    // Look for duration patterns
    const durationPatterns = /\d+\s*(hours?|days?|weeks?|months?|years?|minutes?)/gi;
    const text = doc.text();
    const matches = text.match(durationPatterns);
    if (matches) {
      durations.push(...matches);
    }

    return durations;
  }

  private analyzeSentiment(doc: NlpDoc): 'positive' | 'negative' | 'neutral' | 'mixed' {
    // Simple sentiment analysis based on word patterns
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'achieve'];
    const negativeWords = ['bad', 'poor', 'fail', 'problem', 'issue', 'conflict', 'difficult'];

    let positiveCount = 0;
    let negativeCount = 0;

    const text = doc.text().toLowerCase();
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });

    if (positiveCount > 0 && negativeCount > 0) return 'mixed';
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractEmotionalTone(doc: NlpDoc): string[] {
    const tones: string[] = [];
    const text = doc.text().toLowerCase();

    const emotionPatterns = {
      urgent: ['urgent', 'asap', 'immediately', 'critical'],
      frustrated: ['frustrated', 'annoying', 'difficult', 'stuck'],
      optimistic: ['hope', 'excited', 'looking forward', 'opportunity'],
      concerned: ['worried', 'concerned', 'afraid', 'risky'],
    };

    Object.entries(emotionPatterns).forEach(([tone, patterns]) => {
      if (patterns.some(p => text.includes(p))) {
        tones.push(tone);
      }
    });

    return tones;
  }

  private extractRelationships(
    doc: NlpDoc
  ): Array<{ subject: string; verb: string; object: string }> {
    const relationships: Array<{ subject: string; verb: string; object: string }> = [];

    // Extract all nouns and verbs from the document
    const allNouns = (doc.nouns().out('array') || []) as string[];
    const allVerbs = (doc.verbs().out('array') || []) as string[];

    // Create simple relationships by pairing nouns and verbs
    // This is a simplified approach since Compromise doesn't have full dependency parsing
    if (allNouns.length > 0 && allVerbs.length > 0) {
      for (let i = 0; i < Math.min(allVerbs.length, 5); i++) {
        const verb = allVerbs[i];
        const subject = allNouns[i] || allNouns[0];
        const object = allNouns[i + 1] || '';

        relationships.push({
          subject,
          verb,
          object,
        });
      }
    }

    return relationships;
  }

  private detectContradictionPatterns(
    doc: NlpDoc,
    text: string
  ): Array<{
    type: 'negation' | 'opposition' | 'conditional' | 'antonym';
    pattern: string;
    confidence: number;
  }> {
    const patterns: Array<{
      type: 'negation' | 'opposition' | 'conditional' | 'antonym';
      pattern: string;
      confidence: number;
    }> = [];

    // Check for "both...and" with negation
    if (doc.has('both') && (doc.has('not') || doc.has('no'))) {
      patterns.push({
        type: 'negation',
        pattern: 'both X and not Y',
        confidence: 0.8,
      });
    }

    // Check for "must...but" patterns
    if (text.includes('must') && text.includes('but')) {
      patterns.push({
        type: 'opposition',
        pattern: 'must X but Y',
        confidence: 0.7,
      });
    }

    // Check for explicit contradiction words
    const contradictionWords = ['paradox', 'contradict', 'conflict', 'incompatible', 'dilemma'];
    contradictionWords.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        patterns.push({
          type: 'opposition',
          pattern: word,
          confidence: 0.9,
        });
      }
    });

    return patterns;
  }

  private findNegationConflicts(
    negations: Array<{ phrase: string; scope: string }>
  ): Array<{ type: string; pattern: string; confidence: number }> {
    const conflicts: Array<{ type: string; pattern: string; confidence: number }> = [];

    // Look for conflicting negations in same context
    for (let i = 0; i < negations.length; i++) {
      for (let j = i + 1; j < negations.length; j++) {
        // Check if negations reference similar concepts
        const scope1 = negations[i].scope.toLowerCase();
        const scope2 = negations[j].scope.toLowerCase();

        // Find common words
        const words1 = scope1.split(/\s+/);
        const words2 = scope2.split(/\s+/);
        const commonWords = words1.filter(w => words2.includes(w) && w.length > 3);

        if (commonWords.length > 2) {
          conflicts.push({
            type: 'negation conflict',
            pattern: `conflicting negations about ${commonWords.slice(0, 2).join(', ')}`,
            confidence: 0.6,
          });
        }
      }
    }

    return conflicts;
  }

  private findOppositions(
    analysis: SemanticAnalysis
  ): Array<{ type: string; pattern: string; confidence: number }> {
    const oppositions: Array<{ type: string; pattern: string; confidence: number }> = [];

    // Check for antonym pairs
    const antonymPairs = [
      ['increase', 'decrease'],
      ['expand', 'contract'],
      ['open', 'close'],
      ['start', 'stop'],
      ['accept', 'reject'],
      ['include', 'exclude'],
      ['allow', 'prevent'],
    ];

    antonymPairs.forEach(([word1, word2]) => {
      const hasWord1 = analysis.verbs.includes(word1) || analysis.adjectives.includes(word1);
      const hasWord2 = analysis.verbs.includes(word2) || analysis.adjectives.includes(word2);

      if (hasWord1 && hasWord2) {
        oppositions.push({
          type: 'antonym',
          pattern: `${word1} vs ${word2}`,
          confidence: 0.8,
        });
      }
    });

    return oppositions;
  }

  private findConditionalConflicts(
    conditionals: Array<{ condition: string; consequence: string }>
  ): Array<{ type: string; pattern: string; confidence: number }> {
    const conflicts: Array<{ type: string; pattern: string; confidence: number }> = [];

    // Look for contradictory conditions
    for (let i = 0; i < conditionals.length; i++) {
      for (let j = i + 1; j < conditionals.length; j++) {
        const cond1 = conditionals[i];
        const cond2 = conditionals[j];

        // Check if conditions are opposite but consequences are same
        if (
          cond1.consequence.toLowerCase().includes(cond2.consequence.toLowerCase()) ||
          cond2.consequence.toLowerCase().includes(cond1.consequence.toLowerCase())
        ) {
          // Check if conditions seem contradictory
          if (
            (cond1.condition.includes('not') && !cond2.condition.includes('not')) ||
            (!cond1.condition.includes('not') && cond2.condition.includes('not'))
          ) {
            conflicts.push({
              type: 'conditional',
              pattern: 'contradictory conditions with same outcome',
              confidence: 0.7,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
