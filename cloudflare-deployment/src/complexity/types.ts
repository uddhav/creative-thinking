/**
 * Types for complexity analysis
 */

export interface ComplexityAssessment {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  suggestion?: string;
}

export interface ComplexityAssessmentWithConfidence extends ComplexityAssessment {
  confidence: number; // 0.0 to 1.0
  analysisMethod: 'local-nlp' | 'mcp-sampling' | 'fallback';
}

export interface NLPAnalysisResult {
  entities: string[];
  sentenceCount: number;
  avgSentenceLength: number;
  wordCount: number;
  detectedPatterns: {
    multipleInteractingElements: boolean;
    conflictingRequirements: boolean;
    highUncertainty: boolean;
    multipleStakeholders: boolean;
    systemComplexity: boolean;
    timePressure: boolean;
  };
  confidence: number;
}

export interface LLMComplexityResponse {
  multipleInteractingElements: {
    present: boolean;
    elements?: string[];
  };
  conflictingRequirements: {
    present: boolean;
    conflicts?: string[];
  };
  uncertaintyLevel: 'low' | 'medium' | 'high';
  systemComplexityIndicators: string[];
  overallComplexity: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface CacheEntry {
  assessment: ComplexityAssessment;
  timestamp: number;
  analysisMethod: 'local-nlp' | 'mcp-sampling' | 'fallback';
}
