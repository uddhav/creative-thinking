/**
 * TRIZ technique handler
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class TRIZHandler extends BaseTechniqueHandler {
    getTechniqueInfo() {
        return {
            name: 'TRIZ',
            emoji: '⚡',
            totalSteps: 4,
            description: 'Systematic innovation through contradiction resolution',
            focus: 'Resolve contradictions using inventive principles',
            parallelSteps: {
                canParallelize: false,
                dependencies: [
                    [1, 2],
                    [2, 3],
                    [3, 4],
                ], // Identify → Remove → Apply → Minimize
                description: 'Must be executed sequentially: each step builds on the contradiction analysis',
            },
        };
    }
    getStepInfo(step) {
        const steps = [
            {
                name: 'Identify Contradiction',
                focus: 'Find the core technical or physical contradiction',
                emoji: '⚔️',
            },
            {
                name: 'Remove Compromise',
                focus: 'Challenge the need for trade-offs',
                emoji: '🚫',
            },
            {
                name: 'Apply Inventive Principles',
                focus: 'Use TRIZ principles to resolve contradiction',
                emoji: '🔧',
            },
            {
                name: 'Minimize Complexity',
                focus: 'Simplify solution to essential elements',
                emoji: '✂️',
            },
        ];
        if (step < 1 || step > steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for TRIZ technique. Valid steps are 1-${steps.length}`, 'step', { providedStep: step, validRange: [1, steps.length] });
        }
        return steps[step - 1];
    }
    getStepGuidance(step, problem) {
        // Handle out of bounds gracefully
        if (step < 1 || step > 4) {
            return `Complete the TRIZ process for "${problem}"`;
        }
        switch (step) {
            case 1:
                return `⚔️ Identify the contradiction in "${problem}". What improves when something else gets worse?`;
            case 2:
                return `🚫 Challenge the compromise. Why must we accept this trade-off? What assumptions create it?`;
            case 3:
                return `🔧 Apply inventive principles: Separation, Asymmetry, Dynamics, etc. How can both requirements be satisfied?`;
            case 4:
                return `✂️ Minimize the solution. What can be removed while maintaining functionality?`;
            default:
                return `Apply TRIZ step ${step} to "${problem}"`;
        }
    }
    extractInsights(history) {
        const insights = [];
        history.forEach(entry => {
            if (entry.currentStep === 1 && entry.contradiction) {
                insights.push(`Contradiction identified: ${entry.contradiction}`);
            }
            if (entry.currentStep === 3 &&
                entry.inventivePrinciples &&
                entry.inventivePrinciples.length > 0) {
                insights.push(`Principle applied: ${entry.inventivePrinciples[0]}`);
            }
            if (entry.currentStep === 4 && entry.minimalSolution) {
                insights.push(`Minimal solution: ${entry.minimalSolution}`);
            }
        });
        return insights;
    }
}
//# sourceMappingURL=TRIZHandler.js.map