/**
 * Neural State Optimization technique handler
 */
import { BaseTechniqueHandler, firstSentence } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class NeuralStateHandler extends BaseTechniqueHandler {
    // Assessment and suppression are one step, not two: naming the dominant
    // network fixes the answer to which one is suppressed — grinding means DMN,
    // wandering means ECN — so the second step had no question left to ask.
    steps = [
        {
            name: 'Assess Current State',
            focus: 'Identify the dominant neural network (DMN vs ECN) and the one it suppresses',
            emoji: '🔍',
            type: 'thinking',
            reversibility: 'high',
        },
        {
            name: 'Develop Switching',
            focus: 'Create rhythm between networks',
            emoji: '🔄',
            type: 'thinking',
            reversibility: 'high',
        },
        {
            name: 'Integrate Insights',
            focus: 'Combine outputs from both networks',
            emoji: '🔀',
            type: 'thinking',
            reversibility: 'high',
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Neural State Optimization',
            emoji: '🧠',
            totalSteps: 3,
            description: "Optimize YOUR BRAIN's cognitive states for creative thinking by managing biological neural networks",
            focus: 'Balance human Default Mode Network (DMN) and Executive Control Network (ECN) for peak creativity',
            parallelSteps: {
                canParallelize: false,
                description: 'Neural states transition sequentially through assessment and optimization',
            },
        };
    }
    getStepInfo(step) {
        if (step < 1 || step > this.steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Neural State technique. Valid steps are 1-${this.steps.length}`, 'step', { providedStep: step, validRange: [1, this.steps.length] });
        }
        return this.steps[step - 1];
    }
    getStepGuidance(step, problem) {
        // Handle out of bounds gracefully
        if (step < 1 || step > 3) {
            return `Complete the Neural State Optimization process for: "${problem}"`;
        }
        switch (step) {
            case 1:
                return `🔍 Assess your current neural state for "${problem}". Are you in focused analysis (ECN) or free association (DMN)? Whichever is running, the other is the one being suppressed — name it, and say how deeply.`;
            case 2:
                return `🔄 Develop a switching rhythm. Alternate between focused analysis and free exploration of "${problem}"`;
            case 3:
                return `🔀 Integrate insights from both states. What emerges for "${problem}" when analytical and creative insights combine?`;
            default:
                return `Complete the Neural State Optimization process for: "${problem}"`;
        }
    }
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
            // `entry.output` was declared on the parameter and read by nothing, so a
            // step whose findings were prose reported none of them.
            const output = entry.output?.trim();
            if (output) {
                const summary = firstSentence(output);
                if (summary.length > 0) {
                    insights.push(`${stepName}: ${summary}`);
                }
            }
            // Step 1 carries both halves of the assessment.
            if (step === 1) {
                if (entry.dominantNetwork) {
                    insights.push(`Dominant network: ${entry.dominantNetwork.toUpperCase()}`);
                }
                if (entry.suppressionDepth !== undefined) {
                    insights.push(`Suppression depth: ${entry.suppressionDepth}/10`);
                }
            }
            if (step === 2) {
                // The whole rhythm, not just its first element.
                pushEach('Switching pattern', entry.switchingRhythm);
            }
            if (step === 3) {
                pushEach('Integration', entry.integrationInsights);
            }
        }
        // No completion banner here. Pushing a fixed string because the last step
        // ran reports an insight the session never produced, which is what
        // CONTRIBUTING.md rules out; reaching the end is already visible from the
        // step count.
        return insights;
    }
}
//# sourceMappingURL=NeuralStateHandler.js.map