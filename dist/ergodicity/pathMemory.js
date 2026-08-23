/**
 * Path Memory System - Tracks historical constraints and path dependencies
 */
import { COMMITMENT_WINDOW } from './metrics.js';
import { randomUUID } from 'crypto';
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
export const LOW_REVERSIBILITY_COST = 0.7;
/**
 * Steps of unbroken deliberation before it counts as paralysis rather than
 * thoroughness.
 *
 * Chosen from the separation it gives, not from taste. Distance is
 * `1 − steps/horizon` for a session that commits to nothing, so the warning
 * band (0.3) and the critical band (0.2) land at 0.7 and 0.8 of the horizon.
 * At 20 those are steps 15 and 16 — one step of warning before critical, which
 * is no warning at all. At 25 they are 18 and 21, so a session has three steps
 * to change course. A thirteen-step reflective chain sits at 0.48, well clear.
 */
const PARALYSIS_HORIZON = 25;
export class PathMemoryManager {
    pathMemory;
    constructor(restored) {
        this.pathMemory = restored ?? this.initializePathMemory();
    }
    /**
     * Initialize a new path memory
     */
    initializePathMemory() {
        return {
            constraints: [],
            pathHistory: [],
            foreclosedOptions: [],
            availableOptions: this.getInitialOptions(),
            currentFlexibility: {
                flexibilityScore: 1.0,
                reversibilityIndex: 1.0,
                pathDivergence: 0.0,
                barrierProximity: [],
                optionVelocity: 0.0,
                commitmentDepth: 0.0,
            },
            absorbingBarriers: this.initializeBarriers(),
            criticalDecisions: [],
            escapeRoutes: [],
        };
    }
    /**
     * Get initial available options for a thinking session
     */
    getInitialOptions() {
        return [
            'Change perspective completely',
            'Reverse current approach',
            'Combine with other methods',
            'Abstract to higher level',
            'Decompose into smaller parts',
            'Pivot to different domain',
            'Reset assumptions',
            'Seek external input',
            'Change time horizon',
            'Modify success criteria',
        ];
    }
    /**
     * Initialize standard absorbing barriers
     */
    initializeBarriers() {
        const creativeBarriers = [
            {
                subtype: 'cognitive_lock_in',
                name: 'Cognitive Lock-in',
                description: 'Inability to see beyond current framework',
                indicators: [
                    'Repeated use of same solution patterns',
                    'Dismissing alternatives without consideration',
                    'Decreasing idea diversity',
                    'Resistance to perspective changes',
                ],
            },
            {
                subtype: 'resource_depletion',
                name: 'Resource Depletion',
                description: 'Exhaustion of time, energy, or material resources',
                indicators: [
                    'Increasing time per decision',
                    'Declining quality of outputs',
                    'Skipping important steps',
                    'Rushed conclusions',
                ],
            },
        ];
        const criticalBarriers = [
            {
                subtype: 'analysis_paralysis',
                name: 'Analysis Paralysis',
                description: 'Overthinking preventing any action',
                indicators: [
                    'Endless refinement without progress',
                    'Fear of making any decision',
                    'Excessive data gathering',
                    'Circular reasoning patterns',
                ],
            },
            {
                subtype: 'perfectionism',
                name: 'Perfectionism Trap',
                description: 'Standards so high that nothing is ever complete',
                indicators: [
                    'Rejecting all solutions as inadequate',
                    'Endless iteration without shipping',
                    'Focus on flaws over progress',
                    'Inability to accept "good enough"',
                ],
            },
            // No cynicism barrier is monitored. Its proximity was
            // `min(negativeIndicators/10, 1)` where an indicator is a step that
            // closed more than twice as many options as it opened — and SCAMPER is
            // the only one of the thirty-two techniques that ever reports an option
            // as opened or closed at all. For the other thirty-one both arrays are
            // empty, `0 > 0` is false, and the count stays at zero; measured, the
            // proximity was 0.000 on every step of every chain. Like the retired
            // option-velocity warning it drew on, the barrier asserted something
            // nothing in the system could observe. The `cynicism` subtype and its
            // avoidance strategies stay in the vocabulary, so a restored session
            // that recorded one still reads back; it is simply no longer watched.
        ];
        const barriers = [];
        // Add creative barriers
        creativeBarriers.forEach(b => {
            barriers.push({
                id: randomUUID(),
                type: 'creative',
                subtype: b.subtype,
                name: b.name,
                description: b.description,
                proximity: 0.0,
                impact: 'irreversible',
                warningThreshold: 0.3,
                indicators: b.indicators,
                avoidanceStrategies: this.getAvoidanceStrategies(b.subtype),
            });
        });
        // Add critical barriers
        criticalBarriers.forEach(b => {
            barriers.push({
                id: randomUUID(),
                type: 'critical',
                subtype: b.subtype,
                name: b.name,
                description: b.description,
                proximity: 0.0,
                impact: 'irreversible',
                warningThreshold: 0.3,
                indicators: b.indicators,
                avoidanceStrategies: this.getAvoidanceStrategies(b.subtype),
            });
        });
        return barriers;
    }
    /**
     * Get avoidance strategies for specific barrier types
     */
    getAvoidanceStrategies(barrierType) {
        const strategies = {
            cognitive_lock_in: [
                'Force perspective shift using Random Entry',
                'Explicitly challenge core assumptions',
                'Seek contradictory viewpoints',
                'Take break to reset mental state',
            ],
            resource_depletion: [
                'Set strict time boxes',
                'Prioritize high-impact decisions',
                'Delegate or defer non-critical items',
                'Build in recovery periods',
            ],
            analysis_paralysis: [
                'Set decision deadlines',
                'Use "good enough" criteria',
                'Prototype instead of plan',
                'Focus on reversible decisions',
            ],
            perfectionism: [
                'Define "done" criteria upfront',
                'Celebrate progress over perfection',
                'Time-box refinement phases',
                'Focus on learning over outcomes',
            ],
            cynicism: [
                'Revisit past successes',
                'Start with tiny wins',
                'Change environment or team',
                'Focus on learning value',
            ],
            reputational_ruin: [
                'Test ideas privately first',
                'Build reputation buffer',
                'Have backup communication plan',
                'Focus on learning narrative',
            ],
            relationship_loss: [
                'Maintain open communication',
                'Set clear expectations',
                'Build redundant relationships',
                'Practice empathy actively',
            ],
            market_foreclosure: [
                'Maintain market awareness',
                'Build flexible positioning',
                'Keep multiple market options',
                'Monitor timing windows',
            ],
            technical_debt: [
                'Regular refactoring sprints',
                'Document decisions clearly',
                'Build modular architecture',
                'Maintain upgrade paths',
            ],
            brand_association: [
                'Diversify brand touchpoints',
                'Build sub-brands if needed',
                'Maintain brand flexibility',
                'Monitor brand perception',
            ],
            over_optimization: [
                'Set optimization limits',
                'Value flexibility over efficiency',
                'Build in slack/buffer',
                'Regular system resets',
            ],
            trust_destruction: [
                'Transparent communication',
                'Under-promise, over-deliver',
                'Address issues immediately',
                'Build trust systematically',
            ],
            risk_aversion: [
                'Start with tiny experiments',
                'Celebrate learning from failure',
                'Build psychological safety',
                'Focus on reversible risks',
            ],
            defensive_rigidity: [
                'Practice active listening',
                'Seek feedback actively',
                'Celebrate being wrong',
                'Build learning culture',
            ],
        };
        return strategies[barrierType] || ['Seek external perspective', 'Take strategic pause'];
    }
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
    static deriveFlexibilityImpact(reversibilityCost, commitmentLevel, optionsClosed = 0, optionsOpened = 0) {
        const SCALE = 0.25;
        const OPTION_WEIGHT = 0.05;
        const MAX_PER_STEP = 0.5;
        const binding = reversibilityCost * commitmentLevel * SCALE;
        const netClosed = (optionsClosed - optionsOpened) * OPTION_WEIGHT;
        // Negative is a credit: a step that reopens more than it forecloses gives
        // freedom back. The cap is symmetric so no single step can take, or
        // return, more than half of what remains.
        return Math.max(-MAX_PER_STEP, Math.min(MAX_PER_STEP, binding + netClosed));
    }
    /**
     * The session flexibility score for a given event prefix: a running product
     * of (1 − impact), clamped per event and with non-finite impacts skipped.
     *
     * This is THE recurrence — exposed so consumers that need "flexibility as
     * of step N" (e.g. the option-generation crossing gate) recompute it with
     * identical clamping. A per-event clamp matters: an escape records a
     * negative impact (a credit), so an unclamped product can exceed 1 and
     * bank the excess, where eight escapes once hid a true reading of 8.2; a
     * single NaN would otherwise poison every later reading.
     */
    static computeFlexibilityScore(events) {
        let flexibilityScore = 1;
        for (const event of events) {
            const impact = event.flexibilityImpact;
            if (impact === undefined || !Number.isFinite(impact))
                continue;
            flexibilityScore = Math.min(1, Math.max(0, flexibilityScore * (1 - impact)));
        }
        return flexibilityScore;
    }
    recordPathEvent(technique, step, decision, impact) {
        const event = {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            technique,
            step,
            decision,
            optionsOpened: impact.optionsOpened || [],
            optionsClosed: impact.optionsClosed || [],
            reversibilityCost: impact.reversibilityCost || 0.1,
            commitmentLevel: impact.commitmentLevel || 0.1,
            isRevision: impact.isRevision === true,
            constraintsCreated: [],
            flexibilityImpact: impact.flexibilityImpact ??
                PathMemoryManager.deriveFlexibilityImpact(impact.reversibilityCost || 0.1, impact.commitmentLevel || 0.1, impact.optionsClosed?.length ?? 0, impact.optionsOpened?.length ?? 0),
        };
        // Add to history
        this.pathMemory.pathHistory.push(event);
        // Update available/foreclosed options
        if (impact.optionsClosed) {
            this.pathMemory.foreclosedOptions.push(...impact.optionsClosed);
            this.pathMemory.availableOptions = this.pathMemory.availableOptions.filter(opt => !impact.optionsClosed?.includes(opt));
        }
        if (impact.optionsOpened) {
            this.pathMemory.availableOptions.push(...impact.optionsOpened);
        }
        // Check if this is a critical decision
        if (event.reversibilityCost > 0.7 || event.commitmentLevel > 0.7) {
            this.pathMemory.criticalDecisions.push(event);
        }
        // Create constraints if high commitment
        if (event.commitmentLevel > 0.5) {
            const constraint = this.createConstraint(event);
            this.pathMemory.constraints.push(constraint);
            event.constraintsCreated.push(constraint.id);
        }
        // Update metrics
        this.updateFlexibilityMetrics();
        return event;
    }
    /**
     * Create a constraint from a path event
     */
    createConstraint(event) {
        return {
            id: randomUUID(),
            type: this.inferConstraintType(event),
            description: `Constraint from ${event.technique} decision: ${event.decision}`,
            createdAt: event.timestamp,
            createdBy: event,
            strength: event.commitmentLevel,
            affectedOptions: event.optionsClosed,
            reversibilityCost: event.reversibilityCost,
        };
    }
    /**
     * Infer constraint type from the path event
     */
    inferConstraintType(event) {
        // Simple heuristic based on technique
        const techniqueConstraintMap = {
            six_hats: 'cognitive',
            po: 'creative',
            random_entry: 'creative',
            scamper: 'technical',
            concept_extraction: 'cognitive',
            yes_and: 'relational',
            design_thinking: 'market',
            triz: 'technical',
            neural_state: 'cognitive',
            temporal_work: 'resource',
            cultural_integration: 'relational',
            collective_intel: 'cognitive',
            disney_method: 'creative',
            nine_windows: 'technical',
            quantum_superposition: 'creative',
            temporal_creativity: 'resource',
            paradoxical_problem: 'cognitive',
            meta_learning: 'cognitive',
            biomimetic_path: 'technical',
            first_principles: 'cognitive',
            neuro_computational: 'cognitive',
            criteria_based_analysis: 'cognitive',
            linguistic_forensics: 'relational',
            competing_hypotheses: 'cognitive',
            reverse_benchmarking: 'strategic',
            context_reframing: 'behavioral',
            perception_optimization: 'perceptual',
            anecdotal_signal: 'observational',
            cognitive_bias_audit: 'cognitive',
            latticework: 'cognitive',
            keeper_test: 'strategic',
            steelman_red_team: 'relational',
        };
        return techniqueConstraintMap[event.technique] || 'creative';
    }
    /**
     * Update flexibility metrics based on current path state
     */
    updateFlexibilityMetrics() {
        // What the path has spent, and nothing else.
        //
        // This used to be scaled by the ratio of still-available options to every
        // option ever named. Only SCAMPER reports optionsClosed and optionsOpened,
        // so that ratio sat at exactly 1.0 for thirty-one techniques and floated
        // around 0.78-0.87 for the thirty-second — a surcharge SCAMPER alone paid,
        // on top of a per-step cost that already prices how binding the step was.
        // Measured, it cost SCAMPER two steps of timing against an equally
        // committal six_hats run, and tripped the 0.4 gate on a four-step session.
        //
        // It also made the score non-monotonic: a step that opens more options
        // than it closes raises the ratio, so flexibility could be spent and then
        // reappear. The option lists are still kept and still feed the
        // option-generation engine; they no longer charge the measure twice.
        this.pathMemory.currentFlexibility.flexibilityScore = PathMemoryManager.computeFlexibilityScore(this.pathMemory.pathHistory);
        // Calculate reversibility index
        const reversibleDecisions = this.pathMemory.pathHistory.filter(e => e.reversibilityCost < 0.5).length;
        const totalDecisions = Math.max(this.pathMemory.pathHistory.length, 1);
        this.pathMemory.currentFlexibility.reversibilityIndex = reversibleDecisions / totalDecisions;
        // Calculate path divergence
        this.pathMemory.currentFlexibility.pathDivergence = this.pathMemory.pathHistory.length * 0.1;
        // Commitment depth over the same trailing window `MetricsCalculator`
        // uses, and for the same reason: as a mean over every step the session had
        // ever taken it could not reach the 0.7 that `generateEscapeRoutes` below
        // compares it against, because 107 of the catalogue's 171 steps are 0.20
        // thinking steps that never leave the mean. Two computations of one field
        // name existed; they now agree, and share `COMMITMENT_WINDOW` so they
        // cannot drift apart again.
        const recentCommitment = this.pathMemory.pathHistory.slice(-COMMITMENT_WINDOW);
        this.pathMemory.currentFlexibility.commitmentDepth =
            recentCommitment.length === 0
                ? 0
                : recentCommitment.reduce((sum, e) => sum + e.commitmentLevel, 0) / recentCommitment.length;
        // Calculate option velocity
        const recentEvents = this.pathMemory.pathHistory.slice(-5);
        const recentOpened = recentEvents.reduce((sum, e) => sum + e.optionsOpened.length, 0);
        const recentClosed = recentEvents.reduce((sum, e) => sum + e.optionsClosed.length, 0);
        this.pathMemory.currentFlexibility.optionVelocity = (recentOpened - recentClosed) / 5;
        // Update barrier proximity
        this.updateBarrierProximity();
    }
    /**
     * Update proximity to absorbing barriers
     */
    updateBarrierProximity() {
        const proximities = [];
        for (const barrier of this.pathMemory.absorbingBarriers) {
            const proximity = this.calculateBarrierProximity(barrier);
            proximities.push({
                barrier,
                distance: 1 - proximity, // Convert to distance (1 = far, 0 = at barrier)
                approachRate: this.calculateApproachRate(barrier),
                estimatedTimeToImpact: this.estimateTimeToImpact(barrier, proximity),
            });
            // Update barrier proximity
            barrier.proximity = proximity;
        }
        this.pathMemory.currentFlexibility.barrierProximity = proximities;
    }
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
    calculateBarrierProximity(barrier) {
        // Different calculation methods based on barrier type
        switch (barrier.subtype) {
            case 'cognitive_lock_in': {
                // Lock-in is being unable to change direction, and the path record
                // says that directly: every step declares how hard it is to undo, and
                // that declaration is stored as `reversibilityCost`. This is the share
                // of the last ten steps that declared `low` or `very_low`.
                //
                // It used to be `1 - uniqueTechniques/window` over the same ten, which
                // read repetition of a technique as lock-in. But a plan is a list of
                // techniques and a technique is a list of its own steps — six_hats is
                // seven consecutive steps of six_hats — so a session scored proximity
                // 0.857 for running exactly as planned, and the healthy thirteen-step
                // control went CRITICAL at step 13 for doing what it was asked.
                // Repetition there is the shape of the workflow, not a symptom, which
                // is why the branch needed a 0.8 multiplier to stay quiet. Reading the
                // reversibility the steps declared needs no multiplier: a session of
                // reversible steps scores exactly 0, however few techniques it used.
                const recent = this.pathMemory.pathHistory.slice(-10);
                if (recent.length === 0)
                    return 0;
                const irreversible = recent.filter(e => e.reversibilityCost > LOW_REVERSIBILITY_COST).length;
                return irreversible / recent.length;
            }
            case 'resource_depletion': {
                // Simplified: based on number of steps taken
                return Math.min(this.pathMemory.pathHistory.length / 50, 1);
            }
            case 'analysis_paralysis': {
                // Deliberating at length without ever committing.
                //
                // This counted six_hats steps by name — one technique, hardcoded — so a
                // plan that spent its steps there warned for running as planned, and a
                // session that deliberated endlessly in any other technique was
                // invisible. The path record says it without naming anyone: how much of
                // the session bound nothing, and how long the session has gone on.
                //
                // Both terms are needed. The share alone is 1.0 on step one of every
                // session, which is the saturated-by-default trap two other barriers
                // were just rescued from; length alone would call any long session
                // paralysed however much it committed to.
                const events = this.pathMemory.pathHistory;
                if (events.length === 0)
                    return 0;
                const committing = events.filter(e => e.commitmentLevel > 0.5).length;
                const deliberationShare = 1 - committing / events.length;
                return deliberationShare * Math.min(events.length / PARALYSIS_HORIZON, 1);
            }
            case 'perfectionism': {
                // Revision without progress: how much of the session went back over
                // ground it had already covered. A session that has advanced on every
                // step has reworked nothing, and reads 0.
                if (this.pathMemory.pathHistory.length === 0)
                    return 0;
                const revisions = this.pathMemory.pathHistory.filter(e => e.isRevision === true).length;
                return revisions / this.pathMemory.pathHistory.length;
            }
            default:
                return 0.1; // Low default proximity
        }
    }
    /**
     * Calculate rate of approach to barrier
     */
    calculateApproachRate(barrier) {
        // Simplified: look at recent trend
        const recentProximity = this.calculateBarrierProximity(barrier);
        return recentProximity > 0.5 ? 0.1 : 0.05;
    }
    /**
     * Estimate time to impact for a barrier
     */
    estimateTimeToImpact(barrier, currentProximity) {
        if (currentProximity < 0.3)
            return undefined; // Too far to estimate
        const approachRate = this.calculateApproachRate(barrier);
        if (approachRate <= 0)
            return undefined;
        return Math.round((1 - currentProximity) / approachRate);
    }
    /**
     * Generate escape routes based on current constraints
     */
    generateEscapeRoutes() {
        const routes = [];
        // Pattern interruption escape
        if (this.pathMemory.currentFlexibility.flexibilityScore < 0.4) {
            routes.push({
                id: randomUUID(),
                name: 'Pattern Interruption',
                description: 'Break current thinking patterns with random stimulus',
                feasibility: 0.9,
                cost: 0.2,
                flexibilityGain: 0.3,
                requiredActions: [
                    'Use Random Entry technique',
                    'Challenge all current assumptions',
                    'Seek opposite perspectives',
                ],
                risks: ['May feel disorienting initially'],
            });
        }
        // Constraint relaxation escape
        if (this.pathMemory.constraints.length > 3) {
            routes.push({
                id: randomUUID(),
                name: 'Constraint Relaxation',
                description: 'Systematically relax non-critical constraints',
                feasibility: 0.7,
                cost: 0.4,
                flexibilityGain: 0.4,
                requiredActions: [
                    'Identify least critical constraints',
                    'Negotiate relaxation with stakeholders',
                    'Document rationale for changes',
                ],
                risks: ['May require stakeholder buy-in', 'Some quality trade-offs'],
            });
        }
        // Strategic pivot escape
        if (this.pathMemory.currentFlexibility.commitmentDepth > 0.7) {
            routes.push({
                id: randomUUID(),
                name: 'Strategic Pivot',
                description: 'Fundamental change in approach or direction',
                feasibility: 0.5,
                cost: 0.7,
                flexibilityGain: 0.6,
                requiredActions: [
                    'Re-evaluate core objectives',
                    'Consider alternative problem framings',
                    'Build new coalition of support',
                ],
                risks: ['High switching costs', 'Stakeholder resistance', 'Time investment'],
            });
        }
        this.pathMemory.escapeRoutes = routes;
        return routes;
    }
    /**
     * Get current path memory state
     */
    getPathMemory() {
        return this.pathMemory;
    }
    /**
     * Get warnings based on current metrics
     */
    getWarnings() {
        const warnings = [];
        if (this.pathMemory.currentFlexibility.flexibilityScore < 0.3) {
            warnings.push('⚠️ Critical: Flexibility dangerously low. Consider escape routes.');
        }
        for (const proximity of this.pathMemory.currentFlexibility.barrierProximity) {
            if (proximity.distance < 0.3) {
                warnings.push(`🚨 Approaching ${proximity.barrier.name} barrier (${Math.round(proximity.distance * 100)}% distance remaining)`);
            }
        }
        if (this.pathMemory.currentFlexibility.optionVelocity < -1) {
            warnings.push('📉 Options closing faster than opening. Seek new perspectives.');
        }
        return warnings;
    }
    /**
     * Record a path event (public method for escape protocols)
     */
    recordEvent(event) {
        // Generate ID if not provided
        if (!event.id) {
            event.id = `event_${randomUUID()}`;
        }
        // Add to path history
        this.pathMemory.pathHistory.push(event);
        // Update options based on event
        this.pathMemory.availableOptions = this.pathMemory.availableOptions.filter(opt => !event.optionsClosed.includes(opt));
        this.pathMemory.availableOptions.push(...event.optionsOpened);
        this.pathMemory.foreclosedOptions.push(...event.optionsClosed);
        // Create constraints if specified
        event.constraintsCreated.forEach(constraintId => {
            const constraint = {
                id: constraintId,
                type: 'creative',
                description: `Created by ${event.decision}`,
                createdAt: event.timestamp,
                createdBy: event,
                strength: event.commitmentLevel,
                affectedOptions: event.optionsClosed,
                reversibilityCost: event.reversibilityCost,
            };
            this.pathMemory.constraints.push(constraint);
        });
        // Update flexibility metrics
        this.updateBarrierProximity();
        // Recompute, as recordPathEvent does. Without this the score did not move
        // at escape time: an escape protocol reported a gain, the condition that
        // triggered it was still true immediately afterwards, and the credit only
        // appeared on the next ordinary step.
        this.updateFlexibilityMetrics();
    }
}
//# sourceMappingURL=pathMemory.js.map