/**
 * Cognitive Assessor - Monitors mental flexibility and detects cognitive lock-in
 */
import { Sensor } from './base.js';
import type { SensorCalibration } from '../types.js';
import type { PathMemory, Barrier } from '../../types.js';
import type { SessionData } from '../../../index.js';
export declare class CognitiveAssessor extends Sensor {
    constructor(calibration?: Partial<SensorCalibration>);
    /**
     * Cognitive rigidity, read from the path record rather than from the shape
     * of the transcript.
     *
     * Three of the five inputs used to count transcript shape and call it risk,
     * the same defect `cognitive_lock_in` carried: how many distinct techniques
     * appeared in the window, how many distinct decision strings appeared in it,
     * and how many insights the session had logged per step. A plan is a list of
     * techniques and a technique is a list of its own steps, so running exactly
     * as planned scored as narrow; a session whose steps are recorded in one
     * consistent voice scored as repetitive; and a scripted run that logs no
     * insights scored as not learning. A terse healthy session was
     * indistinguishable from a struggling one on all three, which is why the
     * thirteen-step reflective control — flexibility 0.937, committed to nothing
     * — reached `caution` at step 11.
     *
     * `perspectiveDiversity` also returned a hard-coded 0.8 while the history was
     * under ten events, so every chain in the catalogue showed the same step-10
     * cliff as the stub handed over to the real formula. That was not an early
     * -stage allowance; it was the measure declining to measure and the real
     * value arriving all at once.
     *
     * What the record does state, per event, is how hard the step declared itself
     * to undo and how much it committed. Those two are not independent here:
     * across all 171 steps of the catalogue, `commitmentLevel > 0.7` holds for
     * exactly the 38 steps where `reversibilityCost > 0.7` and for no others, so
     * a separate commitment axis would be the same 38 steps counted twice. The
     * three inputs below are therefore two scopes of the reversibility the steps
     * declared, plus the one graded reading that also sees the middle of the
     * ladder and the options a step opened.
     */
    protected getRawReading(pathMemory: PathMemory, _sessionData: SessionData): Promise<number>;
    /**
     * Detect specific cognitive rigidity indicators
     */
    protected detectIndicators(pathMemory: PathMemory, _sessionData: SessionData): Promise<string[]>;
    /**
     * Gather cognitive-specific context
     */
    protected gatherContext(pathMemory: PathMemory, _sessionData: SessionData): Promise<Record<string, unknown>>;
    /**
     * Calculate comprehensive cognitive metrics
     */
    private calculateCognitiveMetrics;
    /**
     * Share of steps that declared they could be walked back.
     *
     * `window` bounds it to the most recent steps; omitted, it reads the whole
     * session. Same cut as `cognitive_lock_in` and as `recordPathEvent`'s
     * critical-decision test, so all three agree on what an irreversible step is.
     * A session with no history has bound nothing, and reads 1.
     */
    private calculateReversibleShare;
    /**
     * Calculate how often assumptions are challenged.
     *
     * Kept as it was: every one of its three terms already reads the path record
     * rather than the transcript, and it is the only input that sees the middle
     * of the reversibility ladder — a step declared `medium` is neither counted
     * as free by the shares above nor as binding, but it moves this.
     */
    private calculateAssumptionChallengeRate;
    /**
     * Detect hardening of assumptions
     */
    private detectAssumptionHardening;
    /**
     * Count unique techniques used
     */
    private countUniqueTechniques;
    /**
     * Count perspective shifts
     */
    private countPerspectiveShifts;
    /**
     * Identify challenged assumptions
     */
    private identifyChallengedAssumptions;
    /**
     * Identify dominant technique
     */
    private identifyDominantTechnique;
    /**
     * Estimate cognitive load
     */
    private estimateCognitiveLoad;
    /**
     * Find most common element in array
     */
    private findMostCommon;
    /**
     * Get barriers monitored by this sensor
     */
    getMonitoredBarriers(): Barrier[];
}
//# sourceMappingURL=cognitiveAssessor.d.ts.map