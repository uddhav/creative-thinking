/**
 * Complexity analysis for execution layer
 * Analyzes problem complexity and suggests approaches
 */
import type { ExecuteThinkingStepInput } from '../../types/index.js';
import type { ComplexitySuggestion } from './types.js';
export declare class ComplexityChecker {
    /**
     * Check if complexity analysis has been disabled
     */
    static isDisabled(): boolean;
    /**
     * Analyze problem complexity
     */
    static analyzeComplexity(input: ExecuteThinkingStepInput): ComplexitySuggestion | null;
    /**
     * Get risk level based on complexity
     */
    static getRiskLevel(complexity: ComplexitySuggestion | null): 'low' | 'medium' | 'high';
}
//# sourceMappingURL=complexityChecker.d.ts.map