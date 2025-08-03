/**
 * Parallelism Detection System
 * Analyzes user input to detect intent for parallel execution
 */
import type { ExecutionMode, ConvergenceMethod } from '../../types/planning.js';
/**
 * Result of execution mode detection
 */
export interface ExecutionModeDetection {
    executionMode: ExecutionMode;
    confidence: number;
    detectedKeywords: string[];
}
/**
 * Result of convergence intent detection
 */
export interface ConvergenceIntentDetection {
    method: ConvergenceMethod;
    confidence: number;
    detectedKeywords: string[];
}
/**
 * Detects user intent for parallel execution through natural language analysis
 */
export declare class ParallelismDetector {
    /**
     * Keywords indicating parallel execution intent
     */
    private static readonly PARALLEL_KEYWORDS;
    /**
     * Keywords indicating convergence intent
     */
    private static readonly CONVERGENCE_KEYWORDS;
    /**
     * Keywords indicating LLM handoff for convergence
     */
    private static readonly LLM_HANDOFF_KEYWORDS;
    /**
     * Find matching keywords in text
     */
    private findKeywordMatches;
    /**
     * Calculate confidence score based on keyword matches
     */
    private calculateConfidence;
    /**
     * Detect execution mode from problem text
     */
    detectExecutionMode(problem: string, context?: string): ExecutionModeDetection;
    /**
     * Detect convergence intent from problem text
     */
    detectConvergenceIntent(problem: string, context?: string): ConvergenceIntentDetection;
    /**
     * Check if text suggests automatic mode selection
     */
    detectAutoMode(problem: string, context?: string): boolean;
}
//# sourceMappingURL=ParallelismDetector.d.ts.map