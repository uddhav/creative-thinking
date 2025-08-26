/**
 * Path Memory System - Tracks historical constraints and path dependencies
 */
import { randomUUID } from 'crypto';
export class PathMemoryManager {
    pathMemory;
    constructor() {
        this.pathMemory = this.initializePathMemory();
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
            {
                subtype: 'cynicism',
                name: 'Cynicism Spiral',
                description: 'Belief that no solution will work',
                indicators: [
                    'Preemptive rejection of ideas',
                    'Focus only on why things will fail',
                    'Loss of creative energy',
                    'Spreading negativity to team',
                ],
            },
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
            constraintsCreated: [],
            flexibilityImpact: impact.flexibilityImpact,
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
        };
        return techniqueConstraintMap[event.technique] || 'creative';
    }
    /**
     * Update flexibility metrics based on current path state
     */
    updateFlexibilityMetrics() {
        const totalOptions = this.pathMemory.availableOptions.length + this.pathMemory.foreclosedOptions.length;
        const availableRatio = this.pathMemory.availableOptions.length / Math.max(totalOptions, 1);
        // Calculate flexibility score
        // Apply flexibility impacts from path events
        let flexibilityScore = availableRatio;
        for (const event of this.pathMemory.pathHistory) {
            if (event.flexibilityImpact !== undefined) {
                flexibilityScore *= 1 - event.flexibilityImpact;
            }
        }
        this.pathMemory.currentFlexibility.flexibilityScore = flexibilityScore;
        // Calculate reversibility index
        const reversibleDecisions = this.pathMemory.pathHistory.filter(e => e.reversibilityCost < 0.5).length;
        const totalDecisions = Math.max(this.pathMemory.pathHistory.length, 1);
        this.pathMemory.currentFlexibility.reversibilityIndex = reversibleDecisions / totalDecisions;
        // Calculate path divergence
        this.pathMemory.currentFlexibility.pathDivergence = this.pathMemory.pathHistory.length * 0.1;
        // Calculate commitment depth
        const avgCommitment = this.pathMemory.pathHistory.reduce((sum, e) => sum + e.commitmentLevel, 0) / totalDecisions;
        this.pathMemory.currentFlexibility.commitmentDepth = avgCommitment;
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
     * Calculate proximity to a specific barrier
     */
    calculateBarrierProximity(barrier) {
        // Different calculation methods based on barrier type
        switch (barrier.subtype) {
            case 'cognitive_lock_in': {
                // Check for repeated patterns
                const recentTechniques = this.pathMemory.pathHistory.slice(-10).map(e => e.technique);
                const uniqueTechniques = new Set(recentTechniques).size;
                const repetitionScore = 1 - uniqueTechniques / Math.max(recentTechniques.length, 1);
                return repetitionScore * 0.8;
            }
            case 'resource_depletion': {
                // Simplified: based on number of steps taken
                const stepsScore = Math.min(this.pathMemory.pathHistory.length / 50, 1);
                return stepsScore * 0.7;
            }
            case 'analysis_paralysis': {
                // Check for high analysis without decisions
                const analysisSteps = this.pathMemory.pathHistory.filter(e => e.technique === 'six_hats' && e.commitmentLevel < 0.3).length;
                return Math.min(analysisSteps / 15, 1) * 0.8;
            }
            case 'perfectionism': {
                // Check for excessive refinement
                const refinementRatio = this.pathMemory.criticalDecisions.length /
                    Math.max(this.pathMemory.pathHistory.length, 1);
                return (1 - refinementRatio) * 0.7;
            }
            case 'cynicism': {
                // Check for negative patterns (simplified)
                const negativeIndicators = this.pathMemory.pathHistory.filter(e => e.optionsClosed.length > e.optionsOpened.length * 2).length;
                return Math.min(negativeIndicators / 10, 1) * 0.8;
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
    }
}
//# sourceMappingURL=pathMemory.js.map