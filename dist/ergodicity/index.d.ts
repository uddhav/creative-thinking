/**
 * Ergodicity awareness and path dependency tracking for creative thinking
 */
export * from './types.js';
export * from './pathMemory.js';
export * from './metrics.js';
import type { PathMemory, FlexibilityMetrics, PathEvent, ErgodicityWarning } from './types.js';
import type { LateralTechnique } from '../index.js';
/**
 * Main ergodicity manager that coordinates path tracking and metrics
 */
export declare class ErgodicityManager {
    private pathMemoryManager;
    private metricsCalculator;
    constructor();
    /**
     * Record a thinking step and its path impacts
     */
    recordThinkingStep(technique: LateralTechnique, step: number, decision: string, impact: {
        optionsOpened?: string[];
        optionsClosed?: string[];
        reversibilityCost?: number;
        commitmentLevel?: number;
    }): {
        event: PathEvent;
        metrics: FlexibilityMetrics;
        warnings: ErgodicityWarning[];
    };
    /**
     * Get current path memory state
     */
    getPathMemory(): PathMemory;
    /**
     * Get current flexibility metrics
     */
    getMetrics(): FlexibilityMetrics;
    /**
     * Get current warnings
     */
    getWarnings(): ErgodicityWarning[];
    /**
     * Get escape routes for low flexibility situations
     */
    getEscapeRoutes(): import("./types.js").EscapeRoute[];
    /**
     * Get a formatted summary of ergodicity state
     */
    getErgodicityStatus(): string;
    /**
     * Analyze a specific technique for its path impact
     */
    analyzeTechniqueImpact(technique: LateralTechnique): {
        typicalReversibility: number;
        typicalCommitment: number;
        riskProfile: string;
    };
}
//# sourceMappingURL=index.d.ts.map