/**
 * Yes, And... technique handler
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class YesAndHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Accept Initial Idea',
            focus: 'Start with any idea without judgment',
            emoji: '✅',
            type: 'thinking',
        },
        {
            name: 'Add and Build',
            focus: 'Add new elements to enhance the idea',
            emoji: '➕',
            type: 'action',
            reflexiveEffects: {
                triggers: ['Building on existing ideas', 'Adding new elements', 'Creating commitments'],
                realityChanges: [
                    'Idea expanded with additions',
                    'New commitments made',
                    'Collaborative momentum built',
                ],
                futureConstraints: [
                    'Must honor all additions made',
                    'Cannot remove prior contributions',
                    'Future additions must align with existing ones',
                ],
                reversibility: 'low',
            },
        },
        {
            name: 'Evaluate Combinations',
            focus: 'Assess the enhanced ideas constructively',
            emoji: '⚖️',
            type: 'thinking',
        },
        {
            name: 'Synthesize',
            focus: 'Integrate the best additions into a solution',
            emoji: '🔀',
            type: 'action',
            reflexiveEffects: {
                triggers: [
                    'Integrating additions',
                    'Creating final synthesis',
                    'Forming coherent solution',
                ],
                realityChanges: [
                    'Solution structure defined',
                    'Integration decisions made',
                    'Final form established',
                ],
                futureConstraints: [
                    'Must work within synthesized structure',
                    'All integrated elements must be honored',
                    'Future changes limited by synthesis',
                ],
                reversibility: 'medium',
            },
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Yes, And...',
            emoji: '➕',
            totalSteps: 4,
            description: 'Build on ideas through positive addition',
            focus: 'Collaborative idea development without criticism',
            parallelSteps: {
                canParallelize: false,
                description: 'Each addition builds on the previous one in a collaborative chain',
            },
        };
    }
    getStepInfo(step) {
        if (step < 1 || step > this.steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Yes, And... technique. Valid steps are 1-${this.steps.length}`, 'step', { providedStep: step, validRange: [1, this.steps.length] });
        }
        return this.steps[step - 1];
    }
    getStepGuidance(step, problem) {
        // Handle out of bounds gracefully
        if (step < 1 || step > 4) {
            return `Complete the Yes, And... process for "${problem}"`;
        }
        switch (step) {
            case 1:
                return `✅ Start with an initial idea for "${problem}" - any idea, even imperfect. Accept it fully without criticism`;
            case 2:
                return `➕ Say "Yes, and..." then add something to build on the idea. Keep adding constructive elements`;
            case 3:
                return `⚖️ Evaluate the enhanced ideas positively. What combinations work best? Focus on strengths`;
            case 4:
                return `🔀 Synthesize the additions into a coherent solution for "${problem}". Integrate the best elements`;
            default:
                return `Apply Yes, And... step ${step} to "${problem}"`;
        }
    }
    extractInsights(history) {
        const insights = [];
        history.forEach(entry => {
            if (entry.currentStep === 1 && entry.initialIdea) {
                insights.push(`Initial idea: ${entry.initialIdea}`);
            }
            if (entry.currentStep === 2 && entry.additions && entry.additions.length > 0) {
                insights.push(`Key addition: ${entry.additions[0]}`);
            }
            if (entry.currentStep === 3 && entry.evaluations && entry.evaluations.length > 0) {
                const positive = entry.evaluations.filter(e => e.toLowerCase().includes('good') || e.toLowerCase().includes('strong'));
                if (positive.length > 0) {
                    insights.push(`Positive aspect: ${positive[0]}`);
                }
            }
            if (entry.currentStep === 4 && entry.synthesis) {
                insights.push(`Synthesis achieved: ${entry.synthesis.slice(0, 100)}...`);
            }
        });
        return insights;
    }
}
//# sourceMappingURL=YesAndHandler.js.map