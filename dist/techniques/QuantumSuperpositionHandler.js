/**
 * Quantum Superposition technique handler
 * Maintains multiple contradictory solution states simultaneously until optimal collapse
 */
import { BaseTechniqueHandler } from './types.js';
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
            focus: 'Map how the states reinforce, cancel, depend on each other, and gain or lose ground',
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
            2: `Map how your solution states for "${problem}" relate. Where do they reinforce each other, and where do they cancel out? Which aspects are inseparably linked, so that developing one state moves another? And as constraints emerge, which states are gaining ground and which are weakening but still hold something worth keeping?`,
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
    extractInsights(history) {
        const insights = [];
        history.forEach(entry => {
            // Extract solution states from step 1
            if (entry.solutionStates && Array.isArray(entry.solutionStates)) {
                entry.solutionStates.forEach(state => {
                    if (state && state.length > 0) {
                        insights.push(`Solution state: ${state}`);
                    }
                });
            }
            // Extract preserved insights from the collapse step
            if (entry.preservedInsights && Array.isArray(entry.preservedInsights)) {
                entry.preservedInsights.forEach(insight => {
                    if (insight && insight.length > 0) {
                        insights.push(`Preserved: ${insight}`);
                    }
                });
            }
            // Also use base extraction
            if (entry.output) {
                const baseInsights = super.extractInsights([{ output: entry.output }]);
                insights.push(...baseInsights);
            }
        });
        // Remove duplicates and limit to meaningful insights
        return [...new Set(insights)].slice(0, 10);
    }
}
//# sourceMappingURL=QuantumSuperpositionHandler.js.map