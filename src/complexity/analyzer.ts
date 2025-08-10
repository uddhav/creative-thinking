/**
 * Hybrid Complexity Analyzer using NLP and MCP Sampling
 * Enhanced with comprehensive NLP analysis via NLPService
 */

import { getNLPService, type NLPService } from '../nlp/NLPService.js';
import type { CompromiseDoc } from '../core/nlp-types.js';
import { ComplexityCache } from './cache.js';
import { COMPLEXITY_PATTERNS, COMPLEXITY_THRESHOLDS, NLP_THRESHOLDS } from './constants.js';
import type { ComplexityAssessment, NLPAnalysisResult } from './types.js';

export class HybridComplexityAnalyzer {
  private cache = new ComplexityCache();
  private nlpService: NLPService;

  constructor() {
    this.nlpService = getNLPService();
  }

  /**
   * Analyze text complexity using hybrid approach
   */
  analyze(text: string, useCache = true): ComplexityAssessment {
    // Input validation
    if (!text || text.trim().length === 0) {
      return { level: 'low', factors: [] };
    }

    // Check cache first
    if (useCache) {
      const cached = this.cache.get(text);
      if (cached) {
        return cached;
      }
    }

    // Truncate if too long
    const truncatedText = text.slice(0, NLP_THRESHOLDS.WORD_COUNT.MAX * 6); // ~6 chars per word

    // Try local NLP analysis first
    const localResult = this.localNLPAnalysis(truncatedText);

    // Use local NLP result
    const assessment = this.nlpResultToAssessment(localResult);

    // Only cache if caching is enabled
    if (useCache) {
      this.cache.set(text, assessment, 'local-nlp');
    }

    return assessment;
  }

  /**
   * Perform local NLP analysis using NLPService
   */
  private localNLPAnalysis(text: string): NLPAnalysisResult {
    // Use comprehensive NLP analysis
    const analysis = this.nlpService.analyze(text);

    // Extract entities and basic metrics
    const entities = analysis.entities.topics;
    const sentenceCount = analysis.metadata.sentenceCount || 1;
    const wordCount = analysis.metadata.wordCount;
    const avgSentenceLength = wordCount / sentenceCount;

    // Detect patterns using NLP analysis
    const detectedPatterns = {
      multipleInteractingElements: this.detectInteractingElementsNLP(analysis),
      conflictingRequirements: this.detectConflictsNLP(analysis),
      highUncertainty: this.detectUncertaintyNLP(analysis),
      multipleStakeholders: this.detectMultipleStakeholdersNLP(analysis),
      systemComplexity: this.detectSystemComplexityNLP(analysis),
      timePressure: this.detectTimePressureNLP(analysis),
    };

    // Calculate confidence based on text characteristics
    let confidence = 1.0;

    // Reduce confidence for very short text
    if (wordCount < NLP_THRESHOLDS.WORD_COUNT.MIN) {
      confidence *= 0.6;
    }

    // Reduce confidence for very long sentences (harder to parse)
    if (avgSentenceLength > NLP_THRESHOLDS.SENTENCE_LENGTH.COMPLEX) {
      confidence *= 0.8;
    }

    // Reduce confidence if no clear patterns detected
    const patternCount = Object.values(detectedPatterns).filter(Boolean).length;
    if (patternCount === 0 && wordCount > 20) {
      confidence *= 0.7;
    }

    // Boost confidence if multiple patterns detected clearly
    if (patternCount >= 3) {
      confidence = Math.min(confidence * 1.2, 1.0);
    }

    return {
      entities,
      sentenceCount,
      avgSentenceLength,
      wordCount,
      detectedPatterns,
      confidence,
    };
  }

  /**
   * Detect interacting elements pattern using NLP analysis
   */
  private detectInteractingElementsNLP(analysis: ReturnType<NLPService['analyze']>): boolean {
    const entities = [
      ...analysis.entities.topics,
      ...analysis.entities.people,
      ...analysis.entities.organizations,
    ];

    // Multiple entities suggest interaction
    if (entities.length >= 3) {
      return true;
    }

    // Check relationships for interactions
    const relationships = analysis.relationships;
    if (relationships.relationships.length >= 2) {
      return true;
    }

    // Check for dependency relationships
    if (relationships.dependencies.length >= 2) {
      return true;
    }

    // Check for "multiple" keyword in topics or keywords (word boundary check)
    // Need to ensure we don't match "multiples"
    const hasMultiple = analysis.topics.keywords.some(k => {
      const lower = k.toLowerCase();
      // Check for exact word or as part of a phrase
      return (
        lower === 'multiple' ||
        lower.includes('multiple ') || // "multiple systems"
        lower.includes(' multiple') || // "has multiple"
        (lower.includes('multiple') && !lower.includes('multiples'))
      ); // multiple but not multiples
    });

    // Check for interaction keywords in text
    const hasInteractionKeywords = analysis.topics.keywords.some(k => {
      const lower = k.toLowerCase();
      return (
        lower.includes('interact') ||
        lower.includes('connect') ||
        lower.includes('integrate') ||
        lower.includes('communicat') ||
        lower.includes('coordinat') ||
        lower.includes('collaborat') ||
        lower.includes('depend')
      );
    });

    // Check for interaction verbs in relationships
    const hasInteractionVerbs = relationships.relationships.some(r =>
      ['interact', 'connect', 'integrate', 'communicate', 'coordinate', 'collaborate'].includes(
        r.verb.toLowerCase()
      )
    );

    if (
      hasMultiple &&
      (hasInteractionKeywords || hasInteractionVerbs || relationships.relationships.length > 0)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Legacy method for backward compatibility
   */
  private detectInteractingElements(doc: CompromiseDoc, entities: string[]): boolean {
    const hasMultipleEntities = entities.length >= 2;

    // Check for interaction keywords
    const hasInteractionVerbs = COMPLEXITY_PATTERNS.INTERACTION.keywords.some(k => doc.has(k));

    // Check for 'multiple' as a whole word
    const hasMultipleContext = doc.has('multiple');

    // More flexible: require either entities + interactions OR multiple + interactions
    return (
      (hasMultipleEntities && hasInteractionVerbs) || (hasMultipleContext && hasInteractionVerbs)
    );
  }

  /**
   * Detect conflicts pattern using NLP analysis
   */
  private detectConflictsNLP(analysis: ReturnType<NLPService['analyze']>): boolean {
    // Check for contradictions and paradoxes
    if (analysis.contradictions.hasContradiction || analysis.paradoxes.hasParadox) {
      return true;
    }

    // Check for conflicting goals in paradox analysis
    if (analysis.paradoxes.conflictingGoals.length > 0) {
      return true;
    }

    // Check sentiment for mixed emotions (potential conflicts)
    if (analysis.sentiment.overall === 'mixed') {
      return true;
    }

    // Check for conflict-related keywords in topics
    const conflictKeywords = ['conflict', 'opposing', 'contradiction', 'incompatible'];
    if (
      analysis.topics.keywords.some(k => conflictKeywords.some(ck => k.toLowerCase().includes(ck)))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Legacy method for backward compatibility
   */
  private detectConflicts(doc: CompromiseDoc): boolean {
    return COMPLEXITY_PATTERNS.CONFLICT.keywords.some(k => doc.has(k));
  }

  /**
   * Detect uncertainty pattern using NLP analysis
   */
  private detectUncertaintyNLP(analysis: ReturnType<NLPService['analyze']>): boolean {
    // Check readability - complex text often indicates uncertainty
    if (
      analysis.readability.clarity === 'complex' ||
      analysis.readability.clarity === 'very_complex'
    ) {
      return true;
    }

    // Check for questions indicating uncertainty
    if (analysis.intent.questionType && analysis.intent.questionType !== 'yes_no') {
      return true;
    }

    // Low confidence in NLP analysis itself suggests uncertainty
    if (analysis.metadata.confidence < 0.5) {
      return true;
    }

    // Check sentiment subjectivity - high subjectivity can indicate uncertainty
    if (analysis.sentiment.subjectivity > 0.7) {
      return true;
    }

    return false;
  }

  /**
   * Legacy method for backward compatibility
   */
  private detectUncertainty(doc: CompromiseDoc): boolean {
    return COMPLEXITY_PATTERNS.UNCERTAINTY.keywords.some(k => doc.has(k));
  }

  /**
   * Detect multiple stakeholders using NLP analysis
   */
  private detectMultipleStakeholdersNLP(analysis: ReturnType<NLPService['analyze']>): boolean {
    // Check for multiple people entities
    if (analysis.entities.people.length >= 2) {
      return true;
    }

    // Check for multiple organizations
    if (analysis.entities.organizations.length >= 2) {
      return true;
    }

    // Check if topics include people category
    if (analysis.topics.categories.includes('people')) {
      return true;
    }

    // Check for stakeholder-related keywords
    const stakeholderKeywords = ['stakeholder', 'diverse', 'multiple', 'different needs'];
    if (
      analysis.topics.keywords.some(k =>
        stakeholderKeywords.some(sk => k.toLowerCase().includes(sk))
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * Legacy method for backward compatibility
   */
  private detectMultipleStakeholders(doc: CompromiseDoc): boolean {
    const hasStakeholderTerms = COMPLEXITY_PATTERNS.STAKEHOLDER.keywords.some(k => doc.has(k));

    const hasMultipleContext = COMPLEXITY_PATTERNS.STAKEHOLDER.requiresContext.some(k =>
      doc.has(k)
    );

    return hasStakeholderTerms && hasMultipleContext;
  }

  /**
   * Detect system complexity using NLP analysis
   */
  private detectSystemComplexityNLP(analysis: ReturnType<NLPService['analyze']>): boolean {
    // Complex relationships indicate system complexity
    if (analysis.relationships.relationships.length >= 3) {
      return true;
    }

    // Multiple dependencies suggest complex system
    if (analysis.relationships.dependencies.length >= 3) {
      return true;
    }

    // High word count and sentence complexity
    if (analysis.metadata.wordCount > 100 && analysis.readability.avgSentenceLength > 20) {
      return true;
    }

    // Many different types of entities
    const entityTypes = [
      analysis.entities.people.length > 0,
      analysis.entities.places.length > 0,
      analysis.entities.organizations.length > 0,
      analysis.entities.dates.length > 0,
      analysis.entities.money.length > 0,
    ].filter(Boolean).length;

    if (entityTypes >= 3) {
      return true;
    }

    return false;
  }

  /**
   * Legacy method for backward compatibility
   */
  private detectSystemComplexity(doc: CompromiseDoc): boolean {
    return COMPLEXITY_PATTERNS.SYSTEM.keywords.some(k => doc.has(k));
  }

  /**
   * Detect time pressure using NLP analysis
   */
  private detectTimePressureNLP(analysis: ReturnType<NLPService['analyze']>): boolean {
    // Check temporal analysis for urgency
    if (analysis.temporal.urgency === 'immediate' || analysis.temporal.urgency === 'high') {
      return true;
    }

    // Check for deadlines
    if (analysis.temporal.hasDeadline) {
      return true;
    }

    // Multiple temporal expressions suggest time constraints
    if (analysis.temporal.expressions.length >= 2) {
      return true;
    }

    return false;
  }

  /**
   * Legacy method for backward compatibility
   */
  private detectTimePressure(doc: CompromiseDoc): boolean {
    return COMPLEXITY_PATTERNS.TIME_PRESSURE.keywords.some(k => doc.has(k));
  }

  /**
   * Convert NLP result to complexity assessment
   */
  private nlpResultToAssessment(result: NLPAnalysisResult): ComplexityAssessment {
    const factors: string[] = [];

    if (result.detectedPatterns.multipleInteractingElements) {
      factors.push('Multiple interacting elements');
    }
    if (result.detectedPatterns.conflictingRequirements) {
      factors.push('Conflicting requirements');
    }
    if (result.detectedPatterns.highUncertainty) {
      factors.push('High uncertainty or dynamic environment');
    }
    if (result.detectedPatterns.multipleStakeholders) {
      factors.push('Multiple diverse stakeholders');
    }
    if (result.detectedPatterns.systemComplexity) {
      factors.push('System-level complexity');
    }
    if (result.detectedPatterns.timePressure) {
      factors.push('Time pressure constraints');
    }

    // Add factors based on text structure
    if (result.avgSentenceLength > NLP_THRESHOLDS.SENTENCE_LENGTH.COMPLEX) {
      factors.push('Complex problem structure');
    }
    if (result.entities.length > NLP_THRESHOLDS.ENTITY_COUNT.MANY) {
      factors.push(`Multiple entities involved (${result.entities.length})`);
    }

    // Calculate complexity level
    const level = this.calculateComplexityLevel(factors.length, 'discovery');

    // Generate suggestion for high complexity
    let suggestion: string | undefined;
    if (level === 'high') {
      suggestion =
        'This problem exhibits high complexity with multiple interacting factors. Consider using sequential thinking to break down the problem systematically and track dependencies between components.';
    }

    return { level, factors, suggestion };
  }

  /**
   * Calculate complexity level based on factor count
   */
  private calculateComplexityLevel(
    factorCount: number,
    context: 'discovery' | 'execution'
  ): 'low' | 'medium' | 'high' {
    const thresholds = COMPLEXITY_THRESHOLDS[context.toUpperCase() as 'DISCOVERY' | 'EXECUTION'];

    if (factorCount >= thresholds.HIGH) {
      return 'high';
    } else if (factorCount >= thresholds.MEDIUM) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
}
