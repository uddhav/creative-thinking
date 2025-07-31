/**
 * PO (Provocative Operation) technique handler
 */
import { BaseTechniqueHandler } from './types.js';
export class POHandler extends BaseTechniqueHandler {
    getTechniqueInfo() {
        return {
            name: 'PO - Provocative Operation',
            emoji: '💭',
            totalSteps: 4,
            description: 'Challenge assumptions through deliberate provocations',
            focus: 'Break thinking patterns with provocative statements',
        };
    }
    getStepInfo(step) {
        const steps = [
            {
                name: 'Create Provocation',
                focus: 'Generate a deliberately unreasonable statement',
                emoji: '💥',
            },
            {
                name: 'Movement',
                focus: 'Extract useful ideas from the provocation',
                emoji: '➡️',
            },
            {
                name: 'Develop Concepts',
                focus: 'Transform extracted ideas into workable concepts',
                emoji: '🔨',
            },
            {
                name: 'Practical Solutions',
                focus: 'Convert concepts into implementable solutions',
                emoji: '✅',
            },
        ];
        if (step < 1 || step > steps.length) {
            throw new Error(`Invalid step ${step} for PO technique`);
        }
        return steps[step - 1];
    }
    getStepGuidance(step, problem) {
        switch (step) {
            case 1:
                return `💥 Create a provocative statement about "${problem}" - start with "Po:" followed by something deliberately unreasonable or impossible`;
            case 2:
                return `➡️ Movement: From your provocation, extract interesting aspects. What could this lead to? Don't judge - just explore`;
            case 3:
                return `🔨 Develop concepts from the movement ideas. How could these translate into practical approaches?`;
            case 4:
                return `✅ Shape your concepts into practical solutions for "${problem}". What's actually implementable?`;
            default:
                return `Apply PO step ${step} to "${problem}"`;
        }
    }
    extractInsights(history) {
        const insights = [];
        history.forEach(entry => {
            if (entry.currentStep === 1 && entry.provocation) {
                insights.push(`Provocation explored: ${entry.provocation}`);
            }
            if (entry.currentStep === 2 && entry.output && entry.output.includes('could')) {
                insights.push(`Movement insight: ${entry.output.slice(0, 100)}...`);
            }
            if (entry.currentStep === 4 && entry.output) {
                const solutions = entry.output.split(/[.!?]+/).filter(s => s.trim());
                if (solutions.length > 0) {
                    insights.push(`Practical solution: ${solutions[0].trim()}`);
                }
            }
        });
        return insights;
    }
}
//# sourceMappingURL=POHandler.js.map