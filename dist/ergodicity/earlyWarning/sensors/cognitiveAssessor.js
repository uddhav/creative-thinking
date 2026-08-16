/**
 * Cognitive Assessor - Monitors mental flexibility and detects cognitive lock-in
 */
import { Sensor } from './base.js';
import { LOW_REVERSIBILITY_COST } from '../../pathMemory.js';
/** Trailing window for "can this session still change direction now". */
const RECENT_WINDOW = 10;
/** Trailing window for the graded assumption-challenge reading. */
const CHALLENGE_WINDOW = 15;
export class CognitiveAssessor extends Sensor {
    constructor(calibration) {
        // Cognitive sensor should be less sensitive in early stages
        const cognitiveCalibration = {
            sensitivity: 0.6, // Less sensitive than default
            warningThresholds: {
                caution: 0.45, // Only caution when less than 45% diverse
                warning: 0.25, // Warning at 25% diversity
                critical: 0.1, // Critical at 10% diversity
            },
            ...calibration,
        };
        super('cognitive', cognitiveCalibration);
    }
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
    getRawReading(pathMemory, _sessionData) {
        const metrics = this.calculateCognitiveMetrics(pathMemory);
        // Weighted combination of cognitive factors
        const weights = {
            recentReversibility: 0.4,
            sustainedReversibility: 0.25,
            assumptionChallenge: 0.35,
        };
        // Calculate rigidity scores (0 = flexible, 1 = rigid)
        const recentRigidity = 1 - metrics.recentReversibility;
        const sustainedRigidity = 1 - metrics.sustainedReversibility;
        const assumptionRigidity = 1 - metrics.assumptionChallengeRate;
        // Weighted average
        const overallRigidity = recentRigidity * weights.recentReversibility +
            sustainedRigidity * weights.sustainedReversibility +
            assumptionRigidity * weights.assumptionChallenge;
        // No pattern multipliers. There were three, and none survives its own
        // evidence: `detectTechniqueFixation` (x1.2) fired whenever the last eight
        // steps used two or fewer techniques, which is the shape of any two-
        // technique plan; `detectCircularReasoning` (x1.15) fired whenever a
        // decision string repeated three or four steps apart, which is true of
        // every session recorded in a consistent voice; and
        // `detectConfirmationBias` (x1.1) needed more than seven of the last ten
        // steps to both commit above 0.8 and close more options than they opened,
        // and SCAMPER — the only technique that reports options at all — peaks at
        // three and two over any window. Two measured shape and the third could not
        // fire.
        return Promise.resolve(Math.min(1, Math.max(0, overallRigidity)));
    }
    /**
     * Detect specific cognitive rigidity indicators
     */
    detectIndicators(pathMemory, _sessionData) {
        const indicators = [];
        const metrics = this.calculateCognitiveMetrics(pathMemory);
        // Recent room to change direction
        if (metrics.recentReversibility < 0.3) {
            indicators.push('Most recent steps declared themselves hard to undo');
        }
        // Session-long binding
        if (metrics.sustainedReversibility < 0.3) {
            indicators.push('Most of the session has been spent on steps that cannot be walked back');
        }
        // Assumption challenging indicators
        if (metrics.assumptionChallengeRate < 0.2) {
            indicators.push('Rarely questioning assumptions');
        }
        if (this.detectAssumptionHardening(pathMemory)) {
            indicators.push('Assumptions becoming rigid');
        }
        return Promise.resolve(indicators);
    }
    /**
     * Gather cognitive-specific context
     */
    gatherContext(pathMemory, _sessionData) {
        const metrics = this.calculateCognitiveMetrics(pathMemory);
        return Promise.resolve({
            cognitiveMetrics: metrics,
            uniqueTechniquesUsed: this.countUniqueTechniques(pathMemory),
            perspectiveShifts: this.countPerspectiveShifts(pathMemory),
            assumptionsChallenged: this.identifyChallengedAssumptions(pathMemory),
            dominantTechnique: this.identifyDominantTechnique(pathMemory),
            cognitiveLoad: this.estimateCognitiveLoad(pathMemory),
        });
    }
    /**
     * Calculate comprehensive cognitive metrics
     */
    calculateCognitiveMetrics(pathMemory) {
        return {
            recentReversibility: this.calculateReversibleShare(pathMemory, RECENT_WINDOW),
            sustainedReversibility: this.calculateReversibleShare(pathMemory),
            assumptionChallengeRate: this.calculateAssumptionChallengeRate(pathMemory),
        };
    }
    /**
     * Share of steps that declared they could be walked back.
     *
     * `window` bounds it to the most recent steps; omitted, it reads the whole
     * session. Same cut as `cognitive_lock_in` and as `recordPathEvent`'s
     * critical-decision test, so all three agree on what an irreversible step is.
     * A session with no history has bound nothing, and reads 1.
     */
    calculateReversibleShare(pathMemory, window) {
        const events = window === undefined ? pathMemory.pathHistory : pathMemory.pathHistory.slice(-window);
        if (events.length === 0) {
            return 1.0;
        }
        const reversible = events.filter(e => e.reversibilityCost <= LOW_REVERSIBILITY_COST).length;
        return reversible / events.length;
    }
    /**
     * Calculate how often assumptions are challenged.
     *
     * Kept as it was: every one of its three terms already reads the path record
     * rather than the transcript, and it is the only input that sees the middle
     * of the reversibility ladder — a step declared `medium` is neither counted
     * as free by the shares above nor as binding, but it moves this.
     */
    calculateAssumptionChallengeRate(pathMemory) {
        if (pathMemory.pathHistory.length === 0) {
            return 0.5; // Neutral starting point
        }
        const recentHistory = pathMemory.pathHistory.slice(-CHALLENGE_WINDOW);
        // Look for indicators of assumption challenging
        let challengeIndicators = 0;
        // High reversibility decisions indicate willingness to question
        const reversibleDecisions = recentHistory.filter(e => e.reversibilityCost < 0.3);
        challengeIndicators += reversibleDecisions.length / recentHistory.length;
        // Option creation indicates exploring alternatives
        const avgOptionsCreated = recentHistory.map(e => e.optionsOpened.length).reduce((a, b) => a + b, 0) /
            recentHistory.length;
        challengeIndicators += Math.min(avgOptionsCreated / 3, 0.5);
        // Low commitment indicates questioning
        const avgCommitment = recentHistory.map(e => e.commitmentLevel).reduce((a, b) => a + b, 0) / recentHistory.length;
        challengeIndicators += (1 - avgCommitment) * 0.5;
        return Math.min(challengeIndicators, 1);
    }
    /**
     * Detect hardening of assumptions
     */
    detectAssumptionHardening(pathMemory) {
        if (pathMemory.pathHistory.length < 15) {
            return false;
        }
        const recent = pathMemory.pathHistory.slice(-10);
        const highCommitment = recent.filter(e => e.commitmentLevel > 0.7).length;
        const lowReversibility = recent.filter(e => e.reversibilityCost > 0.7).length;
        return highCommitment > 6 && lowReversibility > 5;
    }
    /**
     * Count unique techniques used
     */
    countUniqueTechniques(pathMemory) {
        return new Set(pathMemory.pathHistory.map(e => e.technique)).size;
    }
    /**
     * Count perspective shifts
     */
    countPerspectiveShifts(pathMemory) {
        let shifts = 0;
        for (let i = 1; i < pathMemory.pathHistory.length; i++) {
            if (pathMemory.pathHistory[i].technique !== pathMemory.pathHistory[i - 1].technique) {
                shifts++;
            }
        }
        return shifts;
    }
    /**
     * Identify challenged assumptions
     */
    identifyChallengedAssumptions(pathMemory) {
        return pathMemory.pathHistory
            .filter(e => e.reversibilityCost < 0.3 && e.optionsOpened.length > 1)
            .map(e => e.decision)
            .slice(-5);
    }
    /**
     * Identify dominant technique
     */
    identifyDominantTechnique(pathMemory) {
        if (pathMemory.pathHistory.length === 0)
            return null;
        const techniques = pathMemory.pathHistory.map(e => e.technique);
        return this.findMostCommon(techniques);
    }
    /**
     * Estimate cognitive load
     */
    estimateCognitiveLoad(pathMemory) {
        const constraints = pathMemory.constraints.length;
        const options = pathMemory.availableOptions.length + pathMemory.foreclosedOptions.length;
        const decisions = pathMemory.pathHistory.length;
        // Simple heuristic: more constraints and options = higher load
        const load = (constraints * 0.3 + options * 0.1 + decisions * 0.05) / 10;
        return Math.min(load, 1);
    }
    /**
     * Find most common element in array
     */
    findMostCommon(arr) {
        if (arr.length === 0)
            return null;
        const counts = new Map();
        for (const item of arr) {
            counts.set(item, (counts.get(item) || 0) + 1);
        }
        let maxCount = 0;
        let mostCommon = null;
        for (const [item, count] of counts) {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = item;
            }
        }
        return mostCommon;
    }
    /**
     * Get barriers monitored by this sensor
     */
    getMonitoredBarriers() {
        return [
            {
                id: 'cognitive_lock_in_barrier',
                type: 'creative',
                subtype: 'cognitive_lock_in',
                name: 'Cognitive Lock-in',
                description: 'Inability to see beyond current framework',
                proximity: 0,
                impact: 'irreversible',
                warningThreshold: 0.3,
                indicators: [
                    'Repeated use of same solution patterns',
                    'Dismissing alternatives without consideration',
                    'Decreasing idea diversity',
                    'Resistance to perspective changes',
                ],
                avoidanceStrategies: [
                    'Force perspective shift using Random Entry',
                    'Explicitly challenge core assumptions',
                    'Seek contradictory viewpoints',
                    'Take break to reset mental state',
                ],
            },
            {
                id: 'analysis_paralysis_barrier',
                type: 'critical',
                subtype: 'analysis_paralysis',
                name: 'Analysis Paralysis',
                description: 'Overthinking preventing any action',
                proximity: 0,
                impact: 'irreversible',
                warningThreshold: 0.3,
                indicators: [
                    'Endless refinement without progress',
                    'Fear of making any decision',
                    'Excessive data gathering',
                    'Circular reasoning patterns',
                ],
                avoidanceStrategies: [
                    'Set decision deadlines',
                    'Use "good enough" criteria',
                    'Prototype instead of plan',
                    'Focus on reversible decisions',
                ],
            },
        ];
    }
}
//# sourceMappingURL=cognitiveAssessor.js.map