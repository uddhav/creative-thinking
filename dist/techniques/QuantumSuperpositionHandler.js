/**
 * Quantum Superposition technique handler
 * Maintains multiple contradictory solution states simultaneously until optimal collapse
 */
import { BaseTechniqueHandler, firstSentence } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class QuantumSuperpositionHandler extends BaseTechniqueHandler {
    // Interference, entanglement and amplitude evolution were three steps asking
    // one question — how do these states relate, and which is winning — so they
    // are one step here. Generation, the decision rule, and the collapse are the
    // moves that actually differ.
    steps = [
        {
            name: 'State Generation',
            focus: 'Create multiple contradictory solution states',
            emoji: '⚛️',
            type: 'thinking',
        },
        {
            name: 'State Interaction',
            // Coupling and trajectory lead, reinforce/cancel trails. Run against
            // neuro_computational on one problem, reinforce/cancel is the half both
            // techniques produce; the coupling question — developing one state moves
            // another, and asymmetrically — is what only this one asks. Ordering the
            // shared half first buries the part that earns the step.
            focus: 'Map which states are coupled, which are gaining ground, and where they reinforce',
            emoji: '🌊',
            type: 'thinking',
        },
        {
            name: 'Measurement Context',
            focus: 'Define measurement context for collapse',
            emoji: '📏',
            type: 'thinking',
        },
        {
            name: 'State Collapse',
            focus: 'Collapse to optimal solution while preserving insights',
            emoji: '💫',
            type: 'action',
            reflexiveEffects: {
                triggers: [
                    'Choosing one state and standing down the others',
                    'Communicating the chosen path as the decision',
                ],
                realityChanges: [
                    'The chosen state becomes the plan of record',
                    'Work already done on the abandoned states stops',
                    'Whatever was salvaged from them now belongs to the chosen path',
                ],
                futureConstraints: [
                    'Re-opening a collapsed state costs more than holding it did, because the option was visibly given up',
                    'Salvaged elements carry assumptions from the state they came from',
                ],
                reversibility: 'low',
            },
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Quantum Superposition',
            emoji: '⚛️',
            totalSteps: 4,
            description: 'Maintain multiple contradictory solution states simultaneously until environmental conditions force optimal collapse',
            focus: 'Simultaneous exploration of mutually exclusive solutions',
            enhancedFocus: 'Leverages quantum principles to avoid premature commitment while preserving insights from all possible paths',
            parallelSteps: {
                canParallelize: false,
                description: 'Steps must be sequential as each builds on quantum state evolution',
            },
        };
    }
    getStepInfo(step) {
        const stepInfo = this.steps[step - 1];
        if (!stepInfo) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Quantum Superposition. Valid steps are 1-${this.steps.length}`, 'step', { providedStep: step, validRange: `1-${this.steps.length}` });
        }
        return stepInfo;
    }
    getStepGuidance(step, problem) {
        const guidanceMap = {
            1: `Generate 3-5 mutually exclusive solution states for: "${problem}". Each state should optimize for different criteria (efficiency, flexibility, robustness, cost, innovation). Maintain all states without choosing.`,
            2: `Map how your solution states for "${problem}" relate. Which aspects are inseparably linked, so that developing one state moves another — and is that coupling symmetric, or does one direction leave the others cheaper and the reverse leave them dearer? As constraints and opportunities emerge, which states are gaining ground, and which are weakening but still hold something worth keeping? Where do they reinforce each other, and where do they cancel out? What hybrids do those reinforcements make possible?`,
            3: `Define the measurement context that will force collapse for "${problem}": What are the actual constraints? What criteria matter most now? What future flexibility is needed?`,
            4: `Collapse to the optimal solution for "${problem}" while extracting and preserving insights from non-chosen states. How can elements from abandoned states enhance the chosen path?`,
        };
        return guidanceMap[step] || `Complete the Quantum Superposition process for: "${problem}"`;
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Add specific validation for quantum superposition fields
        if (typeof data === 'object' && data !== null) {
            const stepData = data;
            switch (step) {
                case 1: // State Generation
                    // Validate solutionStates array
                    if (stepData.solutionStates && !Array.isArray(stepData.solutionStates)) {
                        return false;
                    }
                    break;
                case 2: // State Interaction — carries the fields the three merged steps used
                    if (stepData.interferencePatterns && typeof stepData.interferencePatterns !== 'object') {
                        return false;
                    }
                    if (stepData.entanglements && !Array.isArray(stepData.entanglements)) {
                        return false;
                    }
                    if (stepData.amplitudes && typeof stepData.amplitudes !== 'object') {
                        return false;
                    }
                    break;
                case 3: // Measurement Context
                    // Validate measurementCriteria
                    if (stepData.measurementCriteria && !Array.isArray(stepData.measurementCriteria)) {
                        return false;
                    }
                    break;
                case 4: // State Collapse
                    // Validate chosenState and preservedInsights
                    if (stepData.chosenState && typeof stepData.chosenState !== 'string') {
                        return false;
                    }
                    if (stepData.preservedInsights && !Array.isArray(stepData.preservedInsights)) {
                        return false;
                    }
                    break;
            }
        }
        return true;
    }
    /**
     * Report what each step recorded, keyed on `entry.currentStep`.
     *
     * Step 2 is the step this technique exists for — the coupling question no
     * other technique asks — and all three of its fields were validated and then
     * read by nothing, as were the measurement criteria and the chosen state.
     * What survived was cut to ten without saying so.
     */
    extractInsights(history) {
        const totalSteps = this.steps.length;
        const latestByStep = new Map();
        history.forEach((entry, index) => {
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
            if (step === 1) {
                pushEach('Solution state', entry.solutionStates);
            }
            if (step === 2) {
                pushEach('Constructive interference', entry.interferencePatterns?.constructive);
                pushEach('Destructive interference', entry.interferencePatterns?.destructive);
                pushEach('Hybrid possibility', entry.interferencePatterns?.hybrid);
                if (Array.isArray(entry.entanglements)) {
                    entry.entanglements.forEach(entanglement => {
                        const states = Array.isArray(entanglement?.states) ? entanglement.states : [];
                        if (states.length === 0 || !entanglement?.dependency) {
                            return;
                        }
                        insights.push(`Entangled: ${states.join(' ↔ ')} — ${entanglement.dependency}`);
                    });
                }
                const amplitudes = Object.entries(entry.amplitudes ?? {});
                if (amplitudes.length > 0) {
                    const ranked = [...amplitudes].sort(([, a], [, b]) => b - a);
                    insights.push(`${stepName}: Amplitudes, strongest first — ${ranked
                        .map(([state, amplitude]) => `${state} ${amplitude}`)
                        .join(', ')}`);
                    insights.push(`Gaining ground: ${ranked[0][0]} (${ranked[0][1]})`);
                }
            }
            if (step === 3) {
                pushEach('Measurement criterion', entry.measurementCriteria);
            }
            if (step === 4) {
                if (entry.chosenState?.trim()) {
                    insights.push(`Collapsed to: ${entry.chosenState.trim()}`);
                }
                pushEach('Preserved', entry.preservedInsights);
            }
        }
        // Duplicates removed; nothing dropped for being the eleventh thing said.
        return [...new Set(insights)];
    }
}
//# sourceMappingURL=QuantumSuperpositionHandler.js.map