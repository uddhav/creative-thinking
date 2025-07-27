/**
 * Base class for option generation strategies
 */
/**
 * Abstract base class for all option generation strategies
 */
export class BaseOptionStrategy {
    /**
     * Get priority score for this strategy (0-1)
     * Higher scores mean strategy should be tried first
     */
    getPriority(context) {
        // Default implementation - can be overridden
        const flexibilityScore = context.currentFlexibility.flexibilityScore;
        // Different strategies work better at different flexibility levels
        if (flexibilityScore < 0.2) {
            // Critical - prefer drastic strategies
            return this.typicalFlexibilityGain.max;
        }
        else if (flexibilityScore < 0.4) {
            // Low - prefer moderate strategies
            return (this.typicalFlexibilityGain.min + this.typicalFlexibilityGain.max) / 2;
        }
        else {
            // Moderate - prefer gentle strategies
            return this.typicalFlexibilityGain.min;
        }
    }
    /**
     * Create a unique ID for an option
     */
    createOptionId() {
        return `opt_${this.strategyName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Helper to create base option structure
     */
    createOption(name, description, category, actions, prerequisites = []) {
        return {
            id: this.createOptionId(),
            name,
            description,
            strategy: this.strategyName,
            category,
            actions,
            prerequisites,
            generatedAt: new Date().toISOString(),
        };
    }
    /**
     * Extract relevant constraints from context
     */
    getRelevantConstraints(context) {
        const constraints = [];
        // From path memory
        if (context.pathMemory.constraints.length > 0) {
            constraints.push(...context.pathMemory.constraints.filter(c => c.strength > 0.5).map(c => c.description));
        }
        // From generation constraints
        if (context.constraints) {
            constraints.push(...context.constraints.map(c => `${c.type}: ${c.value}`));
        }
        return constraints;
    }
    /**
     * Check if option category is allowed
     */
    isCategoryAllowed(category, context) {
        if (!context.constraints)
            return true;
        const excludeConstraints = context.constraints.filter(c => c.type === 'exclude_category' && c.value === category);
        return excludeConstraints.length === 0;
    }
    /**
     * Get minimum reversibility requirement
     */
    getMinReversibility(context) {
        if (!context.constraints)
            return 0;
        const reversibilityConstraints = context.constraints
            .filter(c => c.type === 'min_reversibility')
            .map(c => c.value);
        return reversibilityConstraints.length > 0 ? Math.max(...reversibilityConstraints) : 0;
    }
}
//# sourceMappingURL=base.js.map