/**
 * Quantum Superposition technique handler
 * Maintains multiple contradictory solution states simultaneously until optimal collapse
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class QuantumSuperpositionHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'State Generation',
            focus: 'Create multiple contradictory solution states',
            emoji: '⚛️',
        },
        {
            name: 'Interference Mapping',
            focus: 'Map constructive and destructive interference patterns',
            emoji: '🌊',
        },
        {
            name: 'Entanglement Analysis',
            focus: 'Identify entangled dependencies between states',
            emoji: '🔗',
        },
        {
            name: 'Amplitude Evolution',
            focus: 'Evolve probability amplitudes based on context',
            emoji: '📈',
        },
        {
            name: 'Measurement Context',
            focus: 'Define measurement context for collapse',
            emoji: '📏',
        },
        {
            name: 'State Collapse',
            focus: 'Collapse to optimal solution while preserving insights',
            emoji: '💫',
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Quantum Superposition',
            emoji: '⚛️',
            totalSteps: 6,
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
            2: `Map interference patterns between your solution states. Where do they reinforce each other (constructive interference)? Where do they cancel out (destructive interference)? Identify hybrid possibilities.`,
            3: `Analyze entanglements: Which aspects of different states are inseparably linked? What dependencies exist between states? How does developing one state affect others?`,
            4: `Evolve probability amplitudes: Based on emerging constraints and opportunities, how does the likelihood of each state change? Which states gain strength? Which weaken but retain valuable insights?`,
            5: `Define the measurement context that will force collapse: What are the actual constraints? What criteria matter most now? What future flexibility is needed?`,
            6: `Collapse to the optimal solution while extracting and preserving insights from non-chosen states. How can elements from abandoned states enhance the chosen path?`,
        };
        return guidanceMap[step] || `Continue exploring quantum superposition for: "${problem}"`;
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
                case 2: // Interference Mapping
                    // Validate interferencePatterns
                    if (stepData.interferencePatterns && typeof stepData.interferencePatterns !== 'object') {
                        return false;
                    }
                    break;
                case 3: // Entanglement Analysis
                    // Validate entanglements
                    if (stepData.entanglements && !Array.isArray(stepData.entanglements)) {
                        return false;
                    }
                    break;
                case 4: // Amplitude Evolution
                    // Validate amplitudes
                    if (stepData.amplitudes && typeof stepData.amplitudes !== 'object') {
                        return false;
                    }
                    break;
                case 5: // Measurement Context
                    // Validate measurementCriteria
                    if (stepData.measurementCriteria && !Array.isArray(stepData.measurementCriteria)) {
                        return false;
                    }
                    break;
                case 6: // State Collapse
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
            // Extract preserved insights from step 6
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