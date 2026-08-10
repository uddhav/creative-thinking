/**
 * TRIZ technique handler
 */
import { BaseTechniqueHandler, firstSentence } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class TRIZHandler extends BaseTechniqueHandler {
    getTechniqueInfo() {
        return {
            name: 'TRIZ',
            emoji: '⚡',
            totalSteps: 4,
            description: 'Systematic innovation through contradiction ELIMINATION using 40 inventive principles',
            focus: 'Permanently remove contradictions to simplify systems',
            parallelSteps: {
                canParallelize: false,
                dependencies: [
                    [1, 2],
                    [2, 3],
                    [3, 4],
                ], // Identify → Remove → Apply → Minimize
                description: 'Must be executed sequentially: each step builds on the contradiction analysis',
            },
            reflexivityProfile: {
                primaryCommitmentType: 'structural',
                overallReversibility: 'low',
                riskLevel: 'high',
            },
        };
    }
    getStepInfo(step) {
        const steps = [
            {
                name: 'Identify Contradiction',
                focus: 'Find the core technical or physical contradiction',
                emoji: '⚔️',
                type: 'thinking',
            },
            {
                name: 'Remove Compromise',
                focus: 'Challenge the need for trade-offs',
                emoji: '🚫',
                type: 'thinking',
            },
            {
                name: 'Apply Inventive Principles',
                focus: 'Use TRIZ principles to resolve contradiction',
                emoji: '🔧',
                type: 'action',
                reflexiveEffects: {
                    triggers: ['Eliminating contradiction', 'Implementing TRIZ principle'],
                    realityChanges: [
                        'System architecture permanently altered',
                        'Technical dependencies created',
                        'Previous compromise no longer available',
                    ],
                    futureConstraints: [
                        'Must maintain new structural arrangement',
                        'Cannot reintroduce eliminated contradiction',
                        'Technical solution requires ongoing support',
                    ],
                    reversibility: 'low',
                },
            },
            {
                name: 'Minimize Complexity',
                focus: 'Simplify solution to essential elements',
                emoji: '✂️',
                type: 'action',
                reflexiveEffects: {
                    triggers: ['Removing components', 'Simplifying structure'],
                    realityChanges: [
                        'Components permanently removed',
                        'Functionality consolidated',
                        'Maintenance requirements reduced',
                    ],
                    futureConstraints: [
                        'Cannot add back removed complexity',
                        'Must work within simplified framework',
                        'Future additions constrained by minimal design',
                    ],
                    reversibility: 'low',
                },
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
            return `Complete the TRIZ process for: "${problem}"`;
        }
        switch (step) {
            case 1:
                return `⚔️ Identify the contradiction in "${problem}". What improves when something else gets worse?`;
            case 2:
                return `🚫 Challenge the compromise. Why must "${problem}" accept this trade-off? What assumptions create it?`;
            case 3:
                return `🔧 Apply inventive principles: Separation, Asymmetry, Dynamics, etc. How can both sides of the contradiction in "${problem}" be satisfied at once?`;
            case 4:
                return `✂️ Minimize the solution. What can be removed while still resolving "${problem}"?`;
            default:
                return `Complete the TRIZ process for: "${problem}"`;
        }
    }
    /**
     * Report what each step recorded, keyed on `entry.currentStep`.
     *
     * Step 2 — Remove Compromise — had no branch at all, so `viaNegativaRemovals`
     * was declared, whitelisted by ObjectFieldValidator and reported nowhere;
     * only the first inventive principle of however many were applied survived;
     * and `entry.output` was read for no step.
     */
    extractInsights(history) {
        const totalSteps = this.getTechniqueInfo().totalSteps;
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
            const stepName = this.getStepInfo(step).name;
            const output = entry.output?.trim();
            if (output) {
                const summary = firstSentence(output);
                if (summary.length > 0) {
                    insights.push(`${stepName}: ${summary}`);
                }
            }
            switch (step) {
                case 1:
                    if (entry.contradiction?.trim()) {
                        insights.push(`Contradiction identified: ${entry.contradiction.trim()}`);
                    }
                    break;
                case 2:
                    pushEach('Removed', entry.viaNegativaRemovals);
                    break;
                case 3:
                    pushEach('Principle applied', entry.inventivePrinciples);
                    break;
                case 4:
                    if (entry.minimalSolution?.trim()) {
                        insights.push(`Minimal solution: ${entry.minimalSolution.trim()}`);
                    }
                    break;
            }
        }
        return insights;
    }
}
//# sourceMappingURL=TRIZHandler.js.map