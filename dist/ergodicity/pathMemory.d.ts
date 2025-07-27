/**
 * Path Memory System - Tracks historical constraints and path dependencies
 */
import type { PathMemory, PathEvent, EscapeRoute } from './types.js';
import type { LateralTechnique } from '../index.js';
export declare class PathMemoryManager {
    private pathMemory;
    constructor();
    /**
     * Initialize a new path memory
     */
    private initializePathMemory;
    /**
     * Get initial available options for a thinking session
     */
    private getInitialOptions;
    /**
     * Initialize standard absorbing barriers
     */
    private initializeBarriers;
    /**
     * Get avoidance strategies for specific barrier types
     */
    private getAvoidanceStrategies;
    /**
     * Record a path event and update path memory
     */
    recordPathEvent(technique: LateralTechnique, step: number, decision: string, impact: {
        optionsOpened?: string[];
        optionsClosed?: string[];
        reversibilityCost?: number;
        commitmentLevel?: number;
    }): PathEvent;
    /**
     * Create a constraint from a path event
     */
    private createConstraint;
    /**
     * Infer constraint type from the path event
     */
    private inferConstraintType;
    /**
     * Update flexibility metrics based on current path state
     */
    private updateFlexibilityMetrics;
    /**
     * Update proximity to absorbing barriers
     */
    private updateBarrierProximity;
    /**
     * Calculate proximity to a specific barrier
     */
    private calculateBarrierProximity;
    /**
     * Calculate rate of approach to barrier
     */
    private calculateApproachRate;
    /**
     * Estimate time to impact for a barrier
     */
    private estimateTimeToImpact;
    /**
     * Generate escape routes based on current constraints
     */
    generateEscapeRoutes(): EscapeRoute[];
    /**
     * Get current path memory state
     */
    getPathMemory(): PathMemory;
    /**
     * Get warnings based on current metrics
     */
    getWarnings(): string[];
}
//# sourceMappingURL=pathMemory.d.ts.map