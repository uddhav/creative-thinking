/**
 * Path Memory System - Tracks historical constraints and path dependencies
 */
import type { PathMemory, PathEvent, EscapeRoute } from './types.js';
import type { LateralTechnique } from '../index.js';
/**
 * The `reversibilityCost` above which a step declared itself hard to undo.
 *
 * Every step declares a reversibility level and the execution layer records it
 * on one rung: `high` → 0.10, `medium` → 0.50, `low` → 0.90, `very_low` →
 * 0.95. Any cut between 0.50 and 0.90 separates "can be walked back" from
 * "cannot", and 0.7 is the cut `recordPathEvent` already uses to call a step a
 * critical decision, so the two agree on what an irreversible step is.
 *
 * Exported because the cognitive sensor reads the same cut: a sensor and the
 * barrier it monitors disagreeing on what "irreversible" means would be a
 * second definition wearing the same word.
 */
export declare const LOW_REVERSIBILITY_COST = 0.7;
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
        isRevision?: boolean;
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
     * The last multiplier is gone with perfectionism's input. It read
     * `(1 - criticalDecisions/pathLength) * 0.7`, so a session that had committed
     * to nothing — every session at step 1, and the whole of a reflective chain —
     * reported proximity 0.700, the maximum the scale allowed, for the absence of
     * commitment. The scale was the only thing keeping a constant CRITICAL off
     * the screen, which is a threshold nothing can reach wearing the opposite
     * sign. It now reads what the barrier is named for: revisions as a share of
     * the steps taken, a session reworking the same ground instead of advancing.
     * `isRevision` reaches the path record as of this change, so no session has
     * to be inferred from a proxy — no revisions is proximity 0, not 1, and the
     * multiplier is not needed to hide anything.
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