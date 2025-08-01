/**
 * Generic Technique Handler
 * Provides fallback handling for unknown techniques
 */
export class GenericHandler {
    techniqueName;
    constructor(techniqueName) {
        this.techniqueName = techniqueName;
    }
    getTechniqueInfo() {
        return {
            name: this.techniqueName,
            emoji: '🔍',
            totalSteps: 5, // Default to 5 steps as per test expectation
            description: `Generic handler for ${this.techniqueName}`,
        };
    }
    getStepInfo(step) {
        return {
            name: `Step ${step}`,
            focus: `Apply ${this.techniqueName} thinking`,
            emoji: '📝',
        };
    }
    getStepGuidance(step, problem) {
        // Handle out of bounds gracefully
        if (step < 1 || step > 5) {
            return `Complete the ${this.techniqueName} process for "${problem}"`;
        }
        return `Apply ${this.techniqueName} step ${step} to "${problem}"`;
    }
    validateStep(step, _data) {
        return step >= 1 && step <= 5;
    }
    extractInsights(history) {
        return history
            .filter(entry => entry.output && entry.output.length > 50)
            .map(entry => `Insight from ${this.techniqueName}: ${entry.output?.substring(0, 100) || ''}...`);
    }
}
//# sourceMappingURL=GenericHandler.js.map