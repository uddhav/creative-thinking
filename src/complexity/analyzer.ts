/**
 * Hybrid Complexity Analyzer using NLP and MCP Sampling
 */

import { ComplexityCache } from './cache.js';
import { COMPLEXITY_THRESHOLDS, NLP_THRESHOLDS } from './constants.js';
import type { ComplexityAssessment, NLPAnalysisResult } from './types.js';
import { NLPService } from '../nlp/NLPService.js';

export class HybridComplexityAnalyzer {
  private cache = new ComplexityCache();
  private nlpService: NLPService;

  constructor() {
    this.nlpService = NLPService.getInstance();
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
   * Perform local NLP analysis using centralized NLP Service
   */
  private localNLPAnalysis(text: string): NLPAnalysisResult {
    // Use the centralized NLP service for analysis
    const semanticAnalysis = this.nlpService.analyzeText(text);
    const complexityResult = this.nlpService.detectComplexity(text);

    // Map semantic analysis to our expected format
    const detectedPatterns = {
      multipleInteractingElements:
        semanticAnalysis.entities.length >= 2 && semanticAnalysis.relationships.length > 0,
      conflictingRequirements: semanticAnalysis.contradictionPatterns.length > 0,
      highUncertainty:
        semanticAnalysis.questions.length > 0 ||
        complexityResult.factors.includes('uncertainty/questions'),
      multipleStakeholders:
        semanticAnalysis.people.length > 1 || semanticAnalysis.organizations.length > 1,
      systemComplexity:
        complexityResult.factors.includes('complex sentence structure') ||
        complexityResult.factors.includes('multiple relationships'),
      timePressure:
        semanticAnalysis.temporalExpressions.length > 0 &&
        semanticAnalysis.emotionalTone.includes('urgent'),
    };

    // Calculate confidence based on complexity score and semantic richness
    let confidence = complexityResult.score > 0 ? 0.5 + complexityResult.score * 0.5 : 0.5;

    // Boost confidence if we have rich semantic data
    if (semanticAnalysis.entities.length > 3 && semanticAnalysis.relationships.length > 2) {
      confidence = Math.min(confidence * 1.2, 1.0);
    }

    return {
      entities: semanticAnalysis.entities,
      sentenceCount: semanticAnalysis.sentenceCount,
      avgSentenceLength: semanticAnalysis.avgSentenceLength,
      wordCount: semanticAnalysis.wordCount,
      detectedPatterns,
      confidence,
    };
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
