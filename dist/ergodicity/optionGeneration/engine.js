/**
 * Main Option Generation Engine
 */
import { DecompositionStrategy } from './strategies/decomposition.js';
import { TemporalStrategy } from './strategies/temporal.js';
import { AbstractionStrategy } from './strategies/abstraction.js';
import { InversionStrategy } from './strategies/inversion.js';
import { StakeholderStrategy } from './strategies/stakeholder.js';
import { ResourceStrategy } from './strategies/resource.js';
import { CapabilityStrategy } from './strategies/capability.js';
import { RecombinationStrategy } from './strategies/recombination.js';
import { OptionEvaluator } from './evaluator.js';
/**
 * Option Generation Engine that systematically creates new possibilities
 */
export class OptionGenerationEngine {
    strategies;
    evaluator;
    constructor() {
        this.strategies = new Map();
        this.strategies.set('decomposition', new DecompositionStrategy());
        this.strategies.set('temporal', new TemporalStrategy());
        this.strategies.set('abstraction', new AbstractionStrategy());
        this.strategies.set('inversion', new InversionStrategy());
        this.strategies.set('stakeholder', new StakeholderStrategy());
        this.strategies.set('resource', new ResourceStrategy());
        this.strategies.set('capability', new CapabilityStrategy());
        this.strategies.set('recombination', new RecombinationStrategy());
        this.evaluator = new OptionEvaluator();
    }
    /**
     * Generate options to increase flexibility
     */
    generateOptions(context, targetCount = 10) {
        const startTime = Date.now();
        const options = [];
        const strategiesUsed = [];
        // Get applicable strategies sorted by priority
        const applicableStrategies = this.getApplicableStrategies(context);
        // Generate options from each strategy until target reached
        for (const [strategyName, strategy] of applicableStrategies) {
            if (options.length >= targetCount)
                break;
            try {
                const strategyOptions = strategy.generate(context);
                if (strategyOptions.length > 0) {
                    options.push(...strategyOptions);
                    strategiesUsed.push(strategyName);
                }
            }
            catch (error) {
                console.error(`Error in ${strategyName} strategy:`, error);
            }
        }
        // Evaluate all options
        const evaluations = this.evaluator.evaluateOptions(options, context);
        // Find top recommendation
        const topRecommendation = evaluations.length > 0 ? options.find(o => o.id === evaluations[0].optionId) || null : null;
        // Calculate projected flexibility
        const projectedFlexibility = this.calculateProjectedFlexibility(context.currentFlexibility.flexibilityScore, evaluations);
        // Identify critical constraints being addressed
        const criticalConstraints = this.identifyCriticalConstraints(options, context);
        const generationTime = Date.now() - startTime;
        return {
            options,
            evaluations,
            topRecommendation,
            strategiesUsed,
            generationTime,
            context: {
                initialFlexibility: context.currentFlexibility.flexibilityScore,
                projectedFlexibility,
                criticalConstraints,
            },
        };
    }
    /**
     * Generate options using specific strategies
     */
    generateWithStrategies(context, strategies, targetCount = 10) {
        // Filter context to use only specified strategies
        const filteredContext = {
            ...context,
            preferredStrategies: strategies,
        };
        return this.generateOptions(filteredContext, targetCount);
    }
    /**
     * Check if option generation is recommended
     */
    shouldGenerateOptions(context) {
        const flexibility = context.currentFlexibility.flexibilityScore;
        // Recommend when flexibility is low
        if (flexibility < 0.4)
            return true;
        // Also recommend when options are being closed faster than opened
        if (context.currentFlexibility.optionVelocity < 0)
            return true;
        // Recommend when approaching barriers
        const approachingBarrier = context.currentFlexibility.barrierProximity.some(bp => bp.distance < 0.3);
        return approachingBarrier;
    }
    /**
     * Get a quick option without full generation
     */
    getQuickOption(context) {
        // Find the highest priority applicable strategy
        const applicableStrategies = this.getApplicableStrategies(context);
        if (applicableStrategies.length === 0)
            return null;
        const [strategyName, strategy] = applicableStrategies[0];
        try {
            const options = strategy.generate(context);
            return options[0] || null;
        }
        catch (error) {
            console.error(`Error generating quick option with ${strategyName} strategy:`, error);
            return null;
        }
    }
    /**
     * Get available strategies
     */
    getAvailableStrategies() {
        return Array.from(this.strategies.entries()).map(([name, strategy]) => ({
            name,
            description: strategy.description,
            typicalGain: strategy.typicalFlexibilityGain,
        }));
    }
    /**
     * Get strategy details
     */
    getStrategyDetails(strategyName) {
        const strategy = this.strategies.get(strategyName);
        if (!strategy)
            return null;
        return {
            name: strategyName,
            description: strategy.description,
            applicableCategories: strategy.applicableCategories,
            typicalGain: strategy.typicalFlexibilityGain,
        };
    }
    // Private helper methods
    getApplicableStrategies(context) {
        const applicable = [];
        // Check each strategy
        for (const [name, strategy] of this.strategies.entries()) {
            // Skip if not in preferred strategies (if specified)
            if (context.preferredStrategies && !context.preferredStrategies.includes(name)) {
                continue;
            }
            // Check if strategy is applicable
            if (strategy.isApplicable(context)) {
                applicable.push([name, strategy]);
            }
        }
        // Sort by priority
        applicable.sort(([, a], [, b]) => b.getPriority(context) - a.getPriority(context));
        return applicable;
    }
    calculateProjectedFlexibility(currentFlexibility, evaluations) {
        // Calculate potential flexibility if all highly recommended options are implemented
        const highlyRecommended = evaluations.filter(e => e.recommendation === 'highly_recommended');
        const recommended = evaluations.filter(e => e.recommendation === 'recommended');
        let projectedGain = 0;
        // Assume 80% of highly recommended options might be implemented
        highlyRecommended.forEach(evaluation => {
            projectedGain += evaluation.flexibilityGain * 0.8;
        });
        // Assume 50% of recommended options might be implemented
        recommended.slice(0, 3).forEach(evaluation => {
            projectedGain += evaluation.flexibilityGain * 0.5;
        });
        // Account for diminishing returns
        projectedGain *= 0.8;
        return Math.min(1.0, currentFlexibility + projectedGain);
    }
    identifyCriticalConstraints(options, context) {
        const criticalConstraints = new Set();
        // Find constraints with high strength
        const strongConstraints = context.pathMemory.constraints
            .filter(c => c.strength > 0.6)
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 3);
        strongConstraints.forEach(constraint => {
            // Check if any option addresses this constraint
            const addressed = options.some(option => option.description.toLowerCase().includes(constraint.type) ||
                option.actions.some(action => action.toLowerCase().includes(constraint.description.toLowerCase())));
            if (addressed) {
                criticalConstraints.add(constraint.description);
            }
        });
        return Array.from(criticalConstraints);
    }
}
//# sourceMappingURL=engine.js.map