/**
 * Collective Intelligence technique handler with reflexivity tracking
 */
import { BaseTechniqueHandler, firstSentence } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class CollectiveIntelHandler extends BaseTechniqueHandler {
    getTechniqueInfo() {
        return {
            name: 'Collective Intelligence Synthesis',
            emoji: '🧬',
            totalSteps: 5,
            description: 'Harness collective wisdom from multiple sources',
            focus: 'Synthesize insights from diverse intelligence sources',
            parallelSteps: {
                canParallelize: false,
                description: 'Collective insights emerge from sequential synthesis of sources',
            },
        };
    }
    getStepInfo(step) {
        const steps = [
            {
                name: 'Identify Sources',
                focus: 'Map diverse knowledge sources',
                emoji: '📚',
                type: 'thinking',
            },
            {
                name: 'Gather Wisdom',
                focus: 'Collect insights from each source',
                emoji: '🎯',
                type: 'thinking',
            },
            {
                name: 'Find Patterns',
                focus: 'Identify emergent patterns',
                emoji: '🔍',
                type: 'thinking',
            },
            {
                name: 'Create Synergy',
                focus: 'Combine for amplified value',
                emoji: '✨',
                type: 'action',
                reflexiveEffects: {
                    triggers: [
                        'Combining insights',
                        'Creating synergistic solutions',
                        'Amplifying collective wisdom',
                    ],
                    realityChanges: [
                        'New hybrid solutions created',
                        'Collective decision formed',
                        'Synergistic value generated',
                    ],
                    futureConstraints: [
                        'Must honor collective synthesis',
                        'Combined approach locks in direction',
                        'Stakeholder expectations aligned to synthesis',
                    ],
                    reversibility: 'medium',
                },
            },
            {
                name: 'Synthesize Insight',
                focus: 'Form unified understanding',
                emoji: '💫',
                type: 'action',
                reflexiveEffects: {
                    triggers: [
                        'Forming unified understanding',
                        'Committing to collective decision',
                        'Creating consensus reality',
                    ],
                    realityChanges: [
                        'Collective intelligence crystallized',
                        'Unified direction established',
                        'Shared understanding created',
                    ],
                    futureConstraints: [
                        'Must work within collective consensus',
                        'Individual perspectives subordinated',
                        'Group commitment created',
                    ],
                    reversibility: 'low',
                },
            },
        ];
        if (step < 1 || step > steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Collective Intelligence technique. Valid steps are 1-${steps.length}`, 'step', { providedStep: step, validRange: [1, steps.length] });
        }
        return steps[step - 1];
    }
    getStepGuidance(step, problem) {
        // Handle out of bounds gracefully
        if (step < 1 || step > 5) {
            return `Complete the Collective Intelligence Synthesis process for: "${problem}"`;
        }
        switch (step) {
            case 1:
                return `📚 Identify wisdom sources for "${problem}": experts, crowds, databases, cultural knowledge`;
            case 2:
                return `🎯 Gather each source's specific insight on "${problem}". What does that perspective contribute?`;
            case 3:
                return `🔍 Find patterns across the sources on "${problem}". Look for convergence, divergence, and emergence`;
            case 4:
                return `✨ Create synergistic combinations for "${problem}". How do different insights amplify each other?`;
            case 5:
                return `💫 Synthesize collective intelligence into unified, actionable insights for "${problem}"`;
            default:
                return `Complete the Collective Intelligence Synthesis process for: "${problem}"`;
        }
    }
    /**
     * Report what each step actually recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array. Position looks
     * equivalent and is not: `execute` appends a history entry for every call
     * including revisions, so one revision shifts every later entry and the last
     * step falls off the end — a session reporting `completed: true` silently
     * loses its final output. Keying on the step also means a revision supersedes
     * the entry it revises rather than reporting twice.
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
            // Each field belongs to one step. Selecting by whichever happened to be
            // present reported the wrong one when an entry carried two.
            const structured = step === 1
                ? entry.wisdomSources
                : step === 3
                    ? entry.emergentPatterns
                    : step === 4
                        ? entry.synergyCombinations
                        : step === 5
                            ? entry.collectiveInsights
                            : undefined;
            if (structured && structured.length > 0) {
                insights.push(`${stepName} recorded: ${structured.join(', ')}`);
            }
        }
        return insights;
    }
}
//# sourceMappingURL=CollectiveIntelHandler.js.map