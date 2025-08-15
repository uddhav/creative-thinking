/**
 * Concept Extraction technique handler with reflexivity
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class ConceptExtractionHandler extends BaseTechniqueHandler {
    getTechniqueInfo() {
        return {
            name: 'Concept Extraction',
            emoji: '🔍',
            totalSteps: 4,
            description: 'Extract underlying principles from successful examples',
            focus: 'Learn from success patterns to create new solutions',
            parallelSteps: {
                canParallelize: false,
                description: 'Concepts must be extracted before abstraction and application',
            },
        };
    }
    getStepInfo(step) {
        const steps = [
            {
                name: 'Identify Success',
                focus: 'Find successful examples in any domain',
                emoji: '🏆',
                type: 'thinking',
            },
            {
                name: 'Extract Concepts',
                focus: 'Identify the underlying principles',
                emoji: '🔍',
                type: 'thinking',
            },
            {
                name: 'Abstract Patterns',
                focus: 'Generalize concepts to broader patterns',
                emoji: '🔄',
                type: 'thinking',
            },
            {
                name: 'Apply to Problem',
                focus: 'Transfer patterns to your specific context',
                emoji: '🎯',
                type: 'action',
                reflexiveEffects: {
                    triggers: [
                        'Applying extracted patterns',
                        'Implementing abstracted concepts',
                        'Transferring principles to context',
                    ],
                    realityChanges: [
                        'Patterns implemented in new context',
                        'Solution approach committed',
                        'Principles embedded in solution',
                    ],
                    futureConstraints: [
                        'Must work within applied patterns',
                        'Solution constrained by extracted principles',
                        'Context adapted to transferred concepts',
                    ],
                    reversibility: 'medium',
                },
            },
        ];
        if (step < 1 || step > steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Concept Extraction technique. Valid steps are 1-${steps.length}`, 'step', { providedStep: step, validRange: [1, steps.length] });
        }
        return steps[step - 1];
    }
    getStepGuidance(step, problem) {
        // Handle out of bounds gracefully
        if (step < 1 || step > 4) {
            return `Complete the Concept Extraction process for "${problem}"`;
        }
        switch (step) {
            case 1:
                return `🏆 Identify a successful example from any domain - what works brilliantly? (doesn't need to relate to "${problem}" yet)`;
            case 2:
                return `🔍 Extract the key concepts that make this example successful. What are the underlying principles?`;
            case 3:
                return `🔄 Abstract these concepts into general patterns. Remove domain-specific details`;
            case 4:
                return `🎯 Apply these abstracted patterns to "${problem}". How can these principles solve your challenge?`;
            default:
                return `Apply Concept Extraction step ${step} to "${problem}"`;
        }
    }
    extractInsights(history) {
        const insights = [];
        history.forEach(entry => {
            if (entry.currentStep === 1 && entry.successExample) {
                insights.push(`Success example analyzed: ${entry.successExample}`);
            }
            if (entry.currentStep === 2 &&
                entry.extractedConcepts &&
                entry.extractedConcepts.length > 0) {
                insights.push(`Key concept: ${entry.extractedConcepts[0]}`);
            }
            if (entry.currentStep === 3 &&
                entry.abstractedPatterns &&
                entry.abstractedPatterns.length > 0) {
                insights.push(`Pattern identified: ${entry.abstractedPatterns[0]}`);
            }
            if (entry.currentStep === 4 && entry.applications && entry.applications.length > 0) {
                insights.push(`Application: ${entry.applications[0]}`);
            }
        });
        return insights;
    }
}
//# sourceMappingURL=ConceptExtractionHandler.js.map