/**
 * Types for the execution layer
 */
import type { PathMemory } from '../../ergodicity/types.js';
/**
 * Type for the result from ErgodicityManager.recordThinkingStep
 */
export interface ErgodicityResult {
    event: unknown;
    metrics: unknown;
    warnings: unknown[];
    earlyWarningState?: unknown;
    escapeRecommendation?: unknown;
    escapeVelocityNeeded?: boolean;
    pathMemory?: PathMemory;
}
/**
 * Type guard for ErgodicityResult
 */
export declare function isErgodicityResult(value: unknown): value is ErgodicityResult;
/**
 * Type for complexity analysis suggestions
 */
export interface ComplexitySuggestion {
    complexityNote: string;
    suggestedApproach: Record<string, string>;
}
//# sourceMappingURL=types.d.ts.map