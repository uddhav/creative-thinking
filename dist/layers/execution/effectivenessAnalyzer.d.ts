/**
 * Effectiveness analysis for thinking techniques
 * Evaluates the quality and impact of outputs
 */
import type { ExecuteThinkingStepInput } from '../../types/index.js';
interface EffectivenessMetrics {
    novelty: number;
    actionability: number;
    riskAwareness: number;
    overall: number;
    feedback?: string;
}
export declare class EffectivenessAnalyzer {
    /**
     * Analyze the effectiveness of a thinking step
     */
    static analyzeEffectiveness(input: ExecuteThinkingStepInput): EffectivenessMetrics;
    /**
     * Get effectiveness level description
     */
    static getEffectivenessLevel(metrics: EffectivenessMetrics): string;
}
export {};
//# sourceMappingURL=effectivenessAnalyzer.d.ts.map