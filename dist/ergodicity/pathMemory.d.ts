/**
 * Path Memory System - Tracks historical constraints and path dependencies
 */
import type { PathMemory, PathEvent, EscapeRoute } from './types.js';
import type { LateralTechnique } from '../index.js';
export declare class PathMemoryManager {
    private pathMemory;
    constructor(restored?: PathMemory);
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
    /**
     * The share of remaining freedom a step consumes, 0-1.
     *
     * A step costs freedom when it is both hard to undo and binding, so the
     * product of the two is the measure; the cap stops any one step consuming
     * more than a fifth of what remains, which is what puts all thirty-two
     * techniques on one scale a threshold can be set against.
     *
     * It lives here rather than in the execution layer because
     * `flexibilityImpact` is the sole determinant of the flexibility score, and
     * deriving it one layer up meant every caller except that one recorded steps
     * that cost nothing — `ErgodicityManager.recordThinkingStep` could be handed
     * a maximally irreversible, maximally binding decision and still report
     * flexibility 1.0, forever.
     *
     * Options closed and opened enter through the same per-step channel rather
     * than as a separate factor. As a global available-option ratio they were a
     * surcharge only SCAMPER paid, since it is the only technique that reports
     * them — it cost SCAMPER two steps of timing against an equally committal
     * six_hats run, and made the score non-monotone, because a step that opened
     * more than it closed raised a ratio the rest of the model only lowered.
     * Netted per step they are one signal among two: reopening what was closed
     * returns freedom, which is the whole point of an escape.
     *
     * The constants are a starting point to be measured, not tuned.
     */
    static deriveFlexibilityImpact(reversibilityCost: number, commitmentLevel: number, optionsClosed?: number, optionsOpened?: number): number;
    recordPathEvent(technique: LateralTechnique, step: number, decision: string, impact: {
        optionsOpened?: string[];
        optionsClosed?: string[];
        reversibilityCost?: number;
        commitmentLevel?: number;
        flexibilityImpact?: number;
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
     * Proximity to a barrier, on the scale its thresholds are written against.
     *
     * Each branch used to multiply its input by 0.7 or 0.8, which put a floor
     * under the distance (`1 - proximity`) that no session could get below:
     * cognitive_lock_in 0.280, resource_depletion 0.300, analysis_paralysis
     * 0.200, perfectionism 0.300. Every consumer compares distance against a
     * `warningThreshold` of 0.3 and a CRITICAL cut of `< 0.2`, both strict — so
     * resource_depletion and perfectionism could never warn at all,
     * analysis_paralysis could never go critical, and the rest had their top
     * range clipped. The thresholds are the calibrated part; the multipliers
     * were not, and all but one are gone.
     *
     * The one that remains is perfectionism, and the reason is that its input is
     * still wrong rather than merely scaled. It reads
     * `1 - criticalDecisions/pathLength`, so a session that has committed to
     * nothing — which is every session at step 1, and the whole of a reflective
     * chain — reports maximal perfectionism. Unscaled it would be a constant
     * CRITICAL, which is the same defect as a threshold nothing can reach
     * wearing the opposite sign. What it wants to measure is revision without
     * progress: rework as a share of steps taken. That signal exists on the
     * session history as `isRevision`, but `PathEvent` does not carry it and
     * `recordPathEvent` is never handed it, so this function cannot see it.
     * Threading it through is a change to the path record, not to this formula,
     * and the multiplier stays until it lands. Anything else reachable from here
     * — repeated step numbers, say — would be a proxy for revision rather than
     * the thing itself.
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
    /**
     * Record a path event (public method for escape protocols)
     */
    recordEvent(event: PathEvent): void;
}
//# sourceMappingURL=pathMemory.d.ts.map