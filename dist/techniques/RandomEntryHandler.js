/**
 * Random Entry technique handler
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class RandomEntryHandler extends BaseTechniqueHandler {
    getTechniqueInfo() {
        return {
            name: 'Random Entry',
            emoji: '🎲',
            totalSteps: 3,
            description: 'Use random stimuli to trigger new associations',
            focus: 'Generate fresh perspectives through unrelated concepts',
        };
    }
    getStepInfo(step) {
        const steps = [
            {
                name: 'Random Stimulus',
                focus: 'Select a random word or concept',
                emoji: '🎲',
            },
            {
                name: 'Force Connections',
                focus: 'Find links between stimulus and problem',
                emoji: '🔗',
            },
            {
                name: 'Develop Ideas',
                focus: 'Transform connections into solutions',
                emoji: '💡',
            },
        ];
        if (step < 1 || step > steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Random Entry technique. Valid steps are 1-${steps.length}`, 'step', { providedStep: step, validRange: `1-${steps.length}` });
        }
        return steps[step - 1];
    }
    getStepGuidance(step, problem) {
        switch (step) {
            case 1:
                return `🎲 Choose a random word/concept (from a book, dictionary, or random generator). Don't think about "${problem}" yet`;
            case 2:
                return `🔗 Force connections between your random stimulus and "${problem}". How do properties of the stimulus relate?`;
            case 3:
                return `💡 Develop the connections into practical ideas for "${problem}". Which associations lead to solutions?`;
            default:
                return `Apply Random Entry step ${step} to "${problem}"`;
        }
    }
    extractInsights(history) {
        const insights = [];
        history.forEach(entry => {
            if (entry.currentStep === 1 && entry.randomStimulus) {
                insights.push(`Random stimulus used: ${entry.randomStimulus}`);
            }
            if (entry.currentStep === 2 && entry.connections && entry.connections.length > 0) {
                insights.push(`Key connection: ${entry.connections[0]}`);
            }
            if (entry.currentStep === 3 && entry.output) {
                const ideas = entry.output.match(/could|might|perhaps/gi);
                if (ideas && ideas.length > 0) {
                    insights.push(`Generated ${ideas.length} potential ideas from random stimulus`);
                }
            }
        });
        return insights;
    }
}
//# sourceMappingURL=RandomEntryHandler.js.map