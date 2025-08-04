/**
 * ConvergenceHandler - Special technique for synthesizing results from parallel creative thinking sessions
 * Analyzes outputs from different approaches, identifies patterns and conflicts, and produces unified recommendations
 */
import { BaseTechniqueHandler } from './types.js';
export class ConvergenceHandler extends BaseTechniqueHandler {
    getTechniqueInfo() {
        return {
            name: 'convergence',
            emoji: '🔀',
            description: 'Synthesize results from parallel creative thinking sessions',
            totalSteps: 3,
        };
    }
    getStepInfo(step) {
        switch (step) {
            case 1:
                return {
                    name: 'Analysis',
                    focus: 'Categorize and extract insights from parallel results',
                    emoji: '📊',
                };
            case 2:
                return {
                    name: 'Pattern Detection',
                    focus: 'Identify synergies, conflicts, and emergent patterns',
                    emoji: '🔀',
                };
            case 3:
                return {
                    name: 'Synthesis',
                    focus: 'Create unified recommendations and action plan',
                    emoji: '🎯',
                };
            default:
                throw new Error(`Invalid step number: ${step}`);
        }
    }
    getStepGuidance(step, problem) {
        switch (step) {
            case 1:
                return `📊 Analyze and categorize results from all parallel techniques for: "${problem}"`;
            case 2:
                return `🔀 Identify patterns, synergies, and conflicts across different approaches`;
            case 3:
                return `🎯 Synthesize unified recommendations and create action plan`;
            default:
                throw new Error(`Invalid step number: ${step}`);
        }
    }
    validateStep(step, data) {
        // First check basic step validation
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Check for required parallelResults field
        if (typeof data === 'object' && data !== null && 'parallelResults' in data) {
            const typedData = data;
            return Array.isArray(typedData.parallelResults) && typedData.parallelResults.length > 0;
        }
        return false;
    }
    extractInsights(history) {
        const insights = [];
        // Extract convergence-specific insights
        history.forEach((entry, index) => {
            if (entry.output) {
                if (index === 0 && entry.output.includes('common themes')) {
                    insights.push('Common themes identified across parallel techniques');
                }
                if (entry.output.includes('synergistic')) {
                    insights.push('Synergistic combinations discovered between techniques');
                }
                if (entry.output.includes('conflicts')) {
                    insights.push('Conflicts resolved through contextual analysis');
                }
                if (entry.output.includes('recommendations')) {
                    insights.push('Unified recommendations synthesized from multiple perspectives');
                }
            }
        });
        // Fall back to generic extraction if no specific insights
        if (insights.length === 0) {
            return super.extractInsights(history);
        }
        return insights;
    }
}
//# sourceMappingURL=ConvergenceHandler.js.map