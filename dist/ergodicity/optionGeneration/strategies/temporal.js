/**
 * Temporal Strategy - Create options by changing time parameters
 */
import { BaseOptionStrategy } from './base.js';
export class TemporalStrategy extends BaseOptionStrategy {
    strategyName = 'temporal';
    description = 'Create flexibility by changing time parameters - delay, accelerate, or sequence differently';
    typicalFlexibilityGain = { min: 0.1, max: 0.3 };
    applicableCategories = ['temporal', 'process'];
    isApplicable(context) {
        // Look for time-sensitive decisions or sequential dependencies
        const hasTimeConstraints = context.pathMemory.constraints.some(c => c.description.toLowerCase().includes('deadline') ||
            c.description.toLowerCase().includes('schedule') ||
            c.description.toLowerCase().includes('time'));
        const hasSequentialCommitments = context.pathMemory.pathHistory.length > 3 &&
            context.pathMemory.pathHistory.some(e => e.commitmentLevel > 0.4);
        return hasTimeConstraints || hasSequentialCommitments;
    }
    generate(context) {
        const options = [];
        const opportunities = this.identifyTemporalOpportunities(context);
        // Generate delay options
        const delayableDecisions = opportunities.filter(o => o.canDelay);
        delayableDecisions.slice(0, 2).forEach(opportunity => {
            const option = this.createDelayOption(opportunity, context);
            if (option && this.isCategoryAllowed(option.category, context)) {
                options.push(option);
            }
        });
        // Generate acceleration options
        const acceleratableOptions = opportunities.filter(o => o.canAccelerate);
        acceleratableOptions.slice(0, 2).forEach(opportunity => {
            const option = this.createAccelerationOption(opportunity, context);
            if (option && this.isCategoryAllowed(option.category, context)) {
                options.push(option);
            }
        });
        // Add sequence reordering option if applicable
        if (this.hasReorderingPotential(context) && this.isCategoryAllowed('process', context)) {
            const reorderOption = this.createReorderingOption(context);
            if (reorderOption) {
                options.push(reorderOption);
            }
        }
        return options;
    }
    estimateEffort(option) {
        // Temporal changes are usually low to medium effort
        if (option.name.includes('Delay'))
            return 'low';
        if (option.name.includes('Accelerate'))
            return 'medium';
        return 'medium'; // Reordering
    }
    identifyTemporalOpportunities(context) {
        const opportunities = [];
        // Analyze recent decisions for delay potential
        const recentDecisions = context.pathMemory.pathHistory.slice(-10);
        recentDecisions.forEach((event, index) => {
            if (event.commitmentLevel > 0.3 && event.reversibilityCost > 0.4) {
                opportunities.push({
                    id: `decision_${index}`,
                    description: event.decision,
                    currentDeadline: 'Immediate',
                    canDelay: true,
                    delayBenefit: 'Gather more information and preserve options',
                    canAccelerate: false,
                    accelerationBenefit: '',
                    flexibilityImpact: 0.2,
                });
            }
        });
        // Look for options that might expire
        const expiringOptions = context.pathMemory.availableOptions.filter(opt => opt.includes('time') || opt.includes('now') || opt.includes('soon'));
        expiringOptions.forEach((option, index) => {
            opportunities.push({
                id: `expiring_${index}`,
                description: option,
                currentDeadline: 'Soon',
                canDelay: false,
                delayBenefit: '',
                canAccelerate: true,
                accelerationBenefit: 'Capture opportunity before it expires',
                flexibilityImpact: 0.15,
            });
        });
        // Identify sequential dependencies that could be parallelized
        if (context.sessionState.currentStep > 3) {
            opportunities.push({
                id: 'parallel_execution',
                description: 'Sequential process steps',
                currentDeadline: 'As planned',
                canDelay: false,
                delayBenefit: '',
                canAccelerate: true,
                accelerationBenefit: 'Complete faster through parallelization',
                flexibilityImpact: 0.25,
            });
        }
        return opportunities;
    }
    createDelayOption(opportunity, context) {
        const minReversibility = this.getMinReversibility(context);
        // Delays are highly reversible
        if (minReversibility > 0.9) {
            return null;
        }
        const delayPeriod = this.calculateOptimalDelay(opportunity, context);
        const actions = [
            `Document current state and assumptions`,
            `Set review date for ${delayPeriod}`,
            `Identify information to gather during delay`,
            `Create triggers for early decision if needed`,
            `Communicate delay to stakeholders`,
        ];
        const prerequisites = [
            'Ensure no critical dependencies',
            'Confirm delay is acceptable to stakeholders',
        ];
        return this.createOption(`Delay ${this.extractDecisionName(opportunity.description)}`, `Postpone ${opportunity.description} for ${delayPeriod}. ${opportunity.delayBenefit}. This preserves flexibility to adapt as new information emerges.`, 'temporal', actions, prerequisites);
    }
    createAccelerationOption(opportunity, context) {
        // Check past acceleration attempts and resource constraints
        const pastAccelerations = context.pathMemory.pathHistory.filter(e => e.decision.toLowerCase().includes('accelerate') ||
            e.decision.toLowerCase().includes('fast-track')).length;
        const hasResourceConstraints = context.pathMemory.constraints.some(c => c.type === 'resource' || c.description.toLowerCase().includes('limited'));
        // Adjust acceleration strategy based on context
        const accelerationMode = pastAccelerations > 2 ? 'selective' : hasResourceConstraints ? 'lean' : 'intensive';
        const actions = [
            `Identify ${accelerationMode === 'lean' ? 'absolute' : ''} minimum viable version`,
            `Allocate ${accelerationMode === 'selective' ? 'specialized' : 'focused'} resources`,
            `Clear schedule for ${accelerationMode === 'intensive' ? 'full-speed' : 'efficient'} execution`,
            `Set up ${accelerationMode === 'lean' ? 'lightweight' : 'fast'} feedback loops`,
            `Execute with ${accelerationMode === 'selective' ? 'strategic' : 'daily'} progress checks`,
        ];
        const prerequisites = accelerationMode === 'lean'
            ? ['Bare minimum resources identified', 'Lean success criteria', 'Quick pivot plan']
            : accelerationMode === 'selective'
                ? [
                    'Critical path analysis',
                    'Specialized team available',
                    'Clear differentiation from past attempts',
                ]
                : [
                    'Resource availability confirmed',
                    'Success criteria defined',
                    'Rollback plan prepared',
                ];
        const modeNote = accelerationMode === 'lean'
            ? ' Do more with less through focused execution.'
            : accelerationMode === 'selective'
                ? ' Target unique acceleration opportunities others missed.'
                : ' Full-speed execution with all available resources.';
        return this.createOption(`Accelerate ${this.extractDecisionName(opportunity.description)}`, `Fast-track ${opportunity.description} to capture time-sensitive value. ${opportunity.accelerationBenefit}. Rapid execution prevents option expiry.${modeNote}`, 'temporal', actions, prerequisites);
    }
    createReorderingOption(context) {
        const dependencies = this.analyzeDependencies(context);
        if (dependencies.reorderablePairs.length === 0) {
            return null;
        }
        const actions = [
            'Map current process sequence',
            'Identify true dependencies vs. conventions',
            `Reorder ${dependencies.reorderablePairs[0].join(' and ')}`,
            'Update process documentation',
            'Test new sequence with small batch',
        ];
        return this.createOption('Resequence Process Steps', `Reorder process steps to increase flexibility. ${dependencies.reorderablePairs.length} pairs of steps can be reordered without breaking dependencies. This creates options for parallel execution and faster adaptation.`, 'process', actions, ['Dependency analysis complete', 'Team briefed on changes']);
    }
    calculateOptimalDelay(opportunity, context) {
        const flexibilityScore = context.currentFlexibility.flexibilityScore;
        if (flexibilityScore < 0.2) {
            return '1 week'; // Short delay in critical situations
        }
        else if (flexibilityScore < 0.4) {
            return '2 weeks'; // Moderate delay
        }
        else {
            return '1 month'; // Longer delay when flexibility is higher
        }
    }
    extractDecisionName(description) {
        // Extract key decision name from description
        const words = description.split(/\s+/);
        // Look for action verbs
        const actionVerbs = ['implement', 'choose', 'select', 'commit', 'decide', 'adopt'];
        const verbIndex = words.findIndex(word => actionVerbs.some(verb => word.toLowerCase().includes(verb)));
        if (verbIndex >= 0 && verbIndex < words.length - 1) {
            return words.slice(verbIndex, verbIndex + 3).join(' ');
        }
        // Fallback: use first few meaningful words
        return words.slice(0, 3).join(' ');
    }
    hasReorderingPotential(context) {
        // Check if there are enough steps to reorder
        if (context.pathMemory.pathHistory.length < 4) {
            return false;
        }
        // Check if recent steps show sequential pattern
        const recentSteps = context.pathMemory.pathHistory.slice(-5);
        const hasSequentialPattern = recentSteps.every((step, index) => index === 0 || step.timestamp > recentSteps[index - 1].timestamp);
        return hasSequentialPattern;
    }
    analyzeDependencies(context) {
        const reorderablePairs = [];
        const recentSteps = context.pathMemory.pathHistory.slice(-6);
        // Simple heuristic: steps with low commitment can be reordered
        for (let i = 0; i < recentSteps.length - 1; i++) {
            for (let j = i + 1; j < recentSteps.length; j++) {
                const step1 = recentSteps[i];
                const step2 = recentSteps[j];
                if (step1.commitmentLevel < 0.5 && step2.commitmentLevel < 0.5) {
                    // Check if they don't have explicit dependencies
                    const step1ClosesOptionsForStep2 = step1.optionsClosed.some(opt => step2.decision.toLowerCase().includes(opt.toLowerCase()));
                    if (!step1ClosesOptionsForStep2) {
                        reorderablePairs.push([
                            this.extractDecisionName(step1.decision),
                            this.extractDecisionName(step2.decision),
                        ]);
                    }
                }
            }
        }
        return { reorderablePairs: reorderablePairs.slice(0, 3) };
    }
}
//# sourceMappingURL=temporal.js.map