/**
 * Path dependency analysis for execution layer
 * Tracks how decisions affect future possibilities
 */
import type { ExecuteThinkingStepInput } from '../../types/index.js';
import type { ErgodicityResult } from './types.js';
interface PathAnalysis {
    currentFlexibility: number;
    pathConstraints: string[];
    futureOptions: string[];
    criticalDecisions: string[];
}
export declare class PathAnalyzer {
    /**
     * Analyze path dependencies based on current step
     */
    static analyzePath(input: ExecuteThinkingStepInput, ergodicityResult?: ErgodicityResult): PathAnalysis;
    /**
     * Get path flexibility description
     */
    static getFlexibilityDescription(flexibility: number): string;
}
export {};
//# sourceMappingURL=pathAnalyzer.d.ts.map