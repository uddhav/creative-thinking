/**
 * Complexity analysis for execution layer
 * Analyzes problem complexity and suggests approaches
 */
export class ComplexityChecker {
    /**
     * Check if complexity analysis has been disabled
     */
    static isDisabled() {
        return process.env.DISABLE_COMPLEXITY_ANALYSIS === 'true';
    }
    /**
     * Analyze problem complexity
     */
    static analyzeComplexity(input) {
        if (this.isDisabled()) {
            return null;
        }
        // Check problem length
        const problemLength = input.problem.length;
        if (problemLength < 50) {
            return {
                complexityNote: 'Simple problem detected',
                suggestedApproach: {
                    focus: 'Direct solution',
                    depth: 'Light exploration',
                },
            };
        }
        // Check for multiple objectives
        const hasMultipleObjectives = input.problem.includes(' and ') ||
            input.problem.includes(', ');
        // Check for constraints
        const hasConstraints = input.problem.includes('must') ||
            input.problem.includes('should') ||
            input.problem.includes('constraint');
        // Check for uncertainty
        const hasUncertainty = input.problem.includes('might') ||
            input.problem.includes('could') ||
            input.problem.includes('unclear');
        // Calculate complexity score
        let complexityScore = 0;
        if (problemLength > 200)
            complexityScore += 2;
        else if (problemLength > 100)
            complexityScore += 1;
        if (hasMultipleObjectives)
            complexityScore += 2;
        if (hasConstraints)
            complexityScore += 1;
        if (hasUncertainty)
            complexityScore += 1;
        // Generate suggestion based on score
        if (complexityScore >= 4) {
            return {
                complexityNote: 'High complexity detected',
                suggestedApproach: {
                    focus: 'Systematic decomposition',
                    depth: 'Thorough exploration',
                    techniques: 'Consider multiple techniques or iterations',
                },
            };
        }
        else if (complexityScore >= 2) {
            return {
                complexityNote: 'Moderate complexity detected',
                suggestedApproach: {
                    focus: 'Structured approach',
                    depth: 'Balanced exploration',
                },
            };
        }
        return {
            complexityNote: 'Standard complexity',
            suggestedApproach: {
                focus: 'Clear progression',
                depth: 'Focused exploration',
            },
        };
    }
    /**
     * Get risk level based on complexity
     */
    static getRiskLevel(complexity) {
        if (!complexity)
            return 'low';
        if (complexity.complexityNote.includes('High'))
            return 'high';
        if (complexity.complexityNote.includes('Moderate'))
            return 'medium';
        return 'low';
    }
}
//# sourceMappingURL=complexityChecker.js.map