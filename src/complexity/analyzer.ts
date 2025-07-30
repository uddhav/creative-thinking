/**
 * Hybrid Complexity Analyzer using NLP and MCP Sampling
 */

import nlp from 'compromise';
import { ComplexityCache } from './cache.js';
import { COMPLEXITY_PATTERNS, COMPLEXITY_THRESHOLDS, NLP_THRESHOLDS } from './constants.js';
import type { ComplexityAssessment, NLPAnalysisResult } from './types.js';

// Type for compromise doc
type NlpDoc = ReturnType<typeof nlp>;

export class HybridComplexityAnalyzer {
  private cache = new ComplexityCache();

  constructor() {}

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
   * Perform local NLP analysis using Compromise
   */
  private localNLPAnalysis(text: string): NLPAnalysisResult {
    const doc = nlp(text);

    // Extract entities and basic metrics
    const entities = (doc.topics().out('array') || []) as string[];
    const sentences = doc.sentences();
    const sentenceArray = (sentences.out('array') || []) as string[];
    const wordCount = doc.wordCount();
    const sentenceCount = sentenceArray.length || 1;
    const avgSentenceLength = wordCount / sentenceCount;

    // Detect patterns
    const detectedPatterns = {
      multipleInteractingElements: this.detectInteractingElements(doc, entities),
      conflictingRequirements: this.detectConflicts(doc),
      highUncertainty: this.detectUncertainty(doc),
      multipleStakeholders: this.detectMultipleStakeholders(doc),
      systemComplexity: this.detectSystemComplexity(doc),
      timePressure: this.detectTimePressure(doc),
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
   * Detect interacting elements pattern
   */
  private detectInteractingElements(doc: NlpDoc, entities: string[]): boolean {
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
   * Detect conflicts pattern
   */
  private detectConflicts(doc: NlpDoc): boolean {
    return COMPLEXITY_PATTERNS.CONFLICT.keywords.some(k => doc.has(k));
  }

  /**
   * Detect uncertainty pattern
   */
  private detectUncertainty(doc: NlpDoc): boolean {
    return COMPLEXITY_PATTERNS.UNCERTAINTY.keywords.some(k => doc.has(k));
  }

  /**
   * Detect multiple stakeholders
   */
  private detectMultipleStakeholders(doc: NlpDoc): boolean {
    const hasStakeholderTerms = COMPLEXITY_PATTERNS.STAKEHOLDER.keywords.some(k => doc.has(k));

    const hasMultipleContext = COMPLEXITY_PATTERNS.STAKEHOLDER.requiresContext.some(k =>
      doc.has(k)
    );

    return hasStakeholderTerms && hasMultipleContext;
  }

  /**
   * Detect system complexity
   */
  private detectSystemComplexity(doc: NlpDoc): boolean {
    return COMPLEXITY_PATTERNS.SYSTEM.keywords.some(k => doc.has(k));
  }

  /**
   * Detect time pressure
   */
  private detectTimePressure(doc: NlpDoc): boolean {
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
