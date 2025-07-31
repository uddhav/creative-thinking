/**
 * Common types and interfaces for technique handlers
 */
export class BaseTechniqueHandler {
    validateStep(step, _data) {
        const info = this.getTechniqueInfo();
        return step >= 1 && step <= info.totalSteps;
    }
    extractInsights(history) {
        const insights = [];
        // Generic insight extraction - can be overridden by specific handlers
        history.forEach(entry => {
            if (entry.output && entry.output.length > 50) {
                // Extract key phrases or patterns
                const sentences = entry.output.split(/[.!?]+/);
                if (sentences.length > 0) {
                    const firstSentence = sentences[0]?.trim();
                    if (firstSentence) {
                        insights.push(firstSentence);
                    }
                }
            }
        });
        return insights;
    }
}
//# sourceMappingURL=types.js.map