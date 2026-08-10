/**
 * Yes, And... technique handler
 */
import { BaseTechniqueHandler, firstSentence } from './types.js';
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
            return `Complete the Yes, And... process for: "${problem}"`;
        }
        switch (step) {
            case 1:
                return `✅ Start with an initial idea for "${problem}" - any idea, even imperfect. Accept it fully without criticism`;
            case 2:
                return `➕ Say "Yes, and..." then add something that stretches the idea further into "${problem}". Keep adding constructive elements`;
            case 3:
                return `⚖️ Evaluate the enhanced ideas positively. Which combinations move "${problem}" furthest? Focus on strengths`;
            case 4:
                return `🔀 Synthesize the additions into a coherent solution for "${problem}". Integrate the best elements`;
            default:
                return `Complete the Yes, And... process for: "${problem}"`;
        }
    }
    /**
     * Report what each step recorded, keyed on `entry.currentStep`.
     *
     * Step 3 used to report an evaluation only when it contained the literal
     * substring "good" or "strong", so every negative or neutral judgement was
     * dropped by construction — the one place this technique can say an addition
     * did not work. The synthesis was also cut at 100 characters and marked with
     * an ellipsis, and `entry.output` was read for no step.
     */
    extractInsights(history) {
        const totalSteps = this.steps.length;
        const latestByStep = new Map();
        history.forEach((entry, index) => {
            // Fall back to position only when the caller sent no step number.
            const step = entry.currentStep ?? index + 1;
            if (step >= 1 && step <= totalSteps) {
                latestByStep.set(step, entry);
            }
        });
        const insights = [];
        const pushEach = (prefix, values) => {
            if (!Array.isArray(values)) {
                return;
            }
            values.forEach(value => {
                if (typeof value === 'string' && value.trim().length > 0) {
                    insights.push(`${prefix}: ${value.trim()}`);
                }
            });
        };
        for (let step = 1; step <= totalSteps; step++) {
            const entry = latestByStep.get(step);
            if (!entry) {
                continue;
            }
            const stepName = this.steps[step - 1].name;
            const output = entry.output?.trim();
            if (output) {
                const summary = firstSentence(output);
                if (summary.length > 0) {
                    insights.push(`${stepName}: ${summary}`);
                }
            }
            switch (step) {
                case 1:
                    if (entry.initialIdea?.trim()) {
                        insights.push(`Initial idea: ${entry.initialIdea.trim()}`);
                    }
                    break;
                case 2:
                    pushEach('Addition', entry.additions);
                    break;
                case 3:
                    // Every evaluation the caller made, not only those containing the
                    // word "good" or "strong". Step 3 asks which combination moves the
                    // problem furthest; the answer is often that one of them does not.
                    pushEach('Evaluation', entry.evaluations);
                    break;
                case 4:
                    if (entry.synthesis?.trim()) {
                        insights.push(`Synthesis achieved: ${entry.synthesis.trim()}`);
                    }
                    break;
            }
        }
        return insights;
    }
}
//# sourceMappingURL=YesAndHandler.js.map