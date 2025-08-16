/**
 * Biomimetic Path Management technique handler
 * Applies biological solutions and evolutionary strategies to innovation challenges
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class BiomimeticPathHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Immune Response',
            focus: 'Threat detection and adaptive response generation',
            emoji: '🦠',
            description: 'Apply immune system principles to identify threats and generate diverse antibody-like solutions with memory patterns',
        },
        {
            name: 'Evolutionary Variation',
            focus: 'Mutation and selection pressure simulation',
            emoji: '🧬',
            description: 'Generate solution mutations and apply selection pressures to evolve optimal traits through fitness testing',
        },
        {
            name: 'Ecosystem Dynamics',
            focus: 'Symbiotic relationships and resource competition',
            emoji: '🌿',
            description: 'Map symbiotic relationships between components and balance resource flows for ecological stability',
        },
        {
            name: 'Swarm Intelligence',
            focus: 'Emergent collective behavior patterns',
            emoji: '🐜',
            description: 'Design simple rules that lead to complex emergent behaviors through collective decision-making',
        },
        {
            name: 'Resilience Patterns',
            focus: 'Redundancy and modularity application',
            emoji: '🔄',
            description: 'Build resilience through redundancy, modularity, and adaptive cycles for antifragile systems',
        },
        {
            name: 'Natural Synthesis',
            focus: 'Integration of biological solutions',
            emoji: '🌱',
            description: 'Synthesize the best biological strategies into a unified, practical solution inspired by nature',
        },
    ];
    stepsWithReflexivity = [
        {
            name: 'Immune Response',
            focus: 'Threat detection and adaptive response generation',
            emoji: '🦠',
            type: 'thinking', // Analysis and pattern recognition
        },
        {
            name: 'Evolutionary Variation',
            focus: 'Mutation and selection pressure simulation',
            emoji: '🧬',
            type: 'action',
            reflexiveEffects: {
                triggers: ['Implementing mutations', 'Applying selection pressures', 'Evolving traits'],
                realityChanges: [
                    'Solution variants created',
                    'Fitness landscape established',
                    'Selection criteria locked in',
                ],
                futureConstraints: [
                    'Must work within evolved traits',
                    'Cannot undo selection pressures',
                    'Fitness criteria become permanent',
                ],
                reversibility: 'low',
            },
        },
        {
            name: 'Ecosystem Dynamics',
            focus: 'Symbiotic relationships and resource competition',
            emoji: '🌿',
            type: 'action',
            reflexiveEffects: {
                triggers: [
                    'Creating symbiotic relationships',
                    'Establishing resource flows',
                    'Building ecological balance',
                ],
                realityChanges: [
                    'Dependencies established',
                    'Resource allocations fixed',
                    'Ecosystem structure defined',
                ],
                futureConstraints: [
                    'Must maintain ecosystem balance',
                    'Cannot break symbiotic relationships',
                    'Resource flows become interdependent',
                ],
                reversibility: 'low',
            },
        },
        {
            name: 'Swarm Intelligence',
            focus: 'Emergent collective behavior patterns',
            emoji: '🐜',
            type: 'action',
            reflexiveEffects: {
                triggers: [
                    'Implementing swarm rules',
                    'Creating emergent behaviors',
                    'Establishing collective patterns',
                ],
                realityChanges: [
                    'Collective behaviors emerge',
                    'Swarm dynamics established',
                    'Distributed decision-making active',
                ],
                futureConstraints: [
                    'Cannot easily change emergent patterns',
                    'Swarm behaviors self-reinforce',
                    'Individual rules affect whole system',
                ],
                reversibility: 'medium',
            },
        },
        {
            name: 'Resilience Patterns',
            focus: 'Redundancy and modularity application',
            emoji: '🔄',
            type: 'action',
            reflexiveEffects: {
                triggers: [
                    'Building redundancy',
                    'Creating modular structures',
                    'Implementing adaptive cycles',
                ],
                realityChanges: [
                    'Redundant systems in place',
                    'Modular architecture established',
                    'Resilience mechanisms active',
                ],
                futureConstraints: [
                    'Must maintain redundancy costs',
                    'Modular boundaries become fixed',
                    'Adaptive cycles continue',
                ],
                reversibility: 'medium',
            },
        },
        {
            name: 'Natural Synthesis',
            focus: 'Integration of biological solutions',
            emoji: '🌱',
            type: 'action',
            reflexiveEffects: {
                triggers: [
                    'Synthesizing biological strategies',
                    'Creating unified solution',
                    'Implementing nature-inspired design',
                ],
                realityChanges: [
                    'Biological solution implemented',
                    'Natural patterns embedded',
                    'Evolutionary design locked in',
                ],
                futureConstraints: [
                    'Must work within biological constraints',
                    'Natural patterns self-perpetuate',
                    'Evolution continues autonomously',
                ],
                reversibility: 'low',
            },
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Biomimetic Path Management',
            emoji: '🦠',
            totalSteps: 6,
            description: 'Apply biological solutions and evolutionary strategies to innovation challenges',
            focus: 'Nature-inspired problem solving through evolutionary patterns',
            enhancedFocus: 'Leverages billions of years of evolutionary problem-solving to find robust, adaptive solutions that have survived the test of time',
            parallelSteps: {
                canParallelize: false,
                description: 'Steps build sequentially from detection to synthesis',
            },
        };
    }
    getStepInfo(step) {
        const stepInfo = this.stepsWithReflexivity[step - 1];
        if (!stepInfo) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Biomimetic Path Management. Valid steps are 1-${this.stepsWithReflexivity.length}`, 'step', { providedStep: step, validRange: `1-${this.stepsWithReflexivity.length}` });
        }
        return stepInfo;
    }
    getStepGuidance(step, problem) {
        const guidanceMap = {
            1: `Apply immune system thinking to: "${problem}". What are the threats or challenges (antigens)? How can you develop diverse antibodies (solution variants)? Create memory cells for successful patterns. Build in rapid response mechanisms for known challenges. Consider: pattern recognition, adaptive immunity, memory formation, and threat neutralization strategies.`,
            2: `Apply evolutionary variation to: "${problem}". Generate multiple solution mutations with different traits. Apply selection pressures to test fitness. Allow successful traits to propagate. Create genetic algorithms for optimization. Consider: mutation rates, selection criteria, crossover mechanisms, and fitness landscapes. What survives and thrives?`,
            3: `Examine ecosystem dynamics for: "${problem}". Identify symbiotic relationships between solution components. Map resource flows and competition. Find ecological niches for specialized solutions. Build resilient networks. Consider: mutualism, commensalism, parasitism, predator-prey dynamics, and succession patterns. How do solutions coexist and support each other?`,
            4: `Apply swarm intelligence to: "${problem}". Design simple rules that lead to complex emergent behaviors. Use stigmergic coordination (indirect communication through environment). Enable collective decision-making. Implement distributed problem-solving. Consider: ant colony optimization, bee waggle dances, bird flocking, and termite construction patterns.`,
            5: `Build resilience patterns for: "${problem}". Apply redundancy at critical points. Create modular components that can be recombined. Design hierarchical organization with fallback levels. Implement adaptive cycles (growth, conservation, release, reorganization). Consider: fault tolerance, graceful degradation, self-healing, and antifragility.`,
            6: `Synthesize natural solutions for: "${problem}". Integrate the best biological strategies from previous steps. Create a hybrid solution that combines immune adaptability, evolutionary fitness, ecosystem balance, swarm coordination, and resilience patterns. Ensure the solution is biomimetic yet practical for implementation. What would nature's ultimate solution look like?`,
        };
        return guidanceMap[step] || `Continue biomimetic analysis for: "${problem}"`;
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Add specific validation for biomimetic fields
        if (typeof data === 'object' && data !== null) {
            const stepData = data;
            switch (step) {
                case 1:
                    // Validate immune response
                    if (!stepData.immuneResponse && !stepData.antibodies) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 1 (Immune Response Detection) requires identifying defensive biological patterns. ' +
                            'Provide either "immuneResponse" (array of threat responses) or "antibodies" (array of defense mechanisms). ' +
                            'Example: { "immuneResponse": ["Pattern recognition", "Adaptive immunity", "Memory formation"], "output": "..." }', 'immuneResponse', {
                            step,
                            technique: 'biomimetic_path',
                            acceptedFields: ['immuneResponse', 'antibodies'],
                            example: {
                                immuneResponse: ['threat detection', 'antibody production', 'immune memory'],
                            },
                        });
                    }
                    break;
                case 2:
                    // Validate evolutionary variation
                    if (!stepData.mutations && !stepData.selectionPressure) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 2 (Evolutionary Variation) requires generating solution mutations and selection criteria. ' +
                            'Provide either "mutations" (array of variations) or "selectionPressure" (string describing criteria). ' +
                            'Example: { "mutations": ["variant A", "variant B", "variant C"], "output": "..." }', 'mutations', {
                            step,
                            technique: 'biomimetic_path',
                            acceptedFields: ['mutations', 'selectionPressure'],
                            example: {
                                mutations: ['speed optimization', 'resilience enhancement', 'efficiency variant'],
                            },
                        });
                    }
                    break;
                case 3:
                    // Validate ecosystem dynamics
                    if (!stepData.symbioticRelationships && !stepData.ecosystemBalance) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 3 (Ecosystem Dynamics) requires mapping symbiotic relationships and resource flows. ' +
                            'Provide either "symbioticRelationships" (array) or "ecosystemBalance" (string). ' +
                            'Example: { "symbioticRelationships": ["mutualism between A and B", "commensalism with C"], "output": "..." }', 'symbioticRelationships', {
                            step,
                            technique: 'biomimetic_path',
                            acceptedFields: ['symbioticRelationships', 'ecosystemBalance'],
                            example: {
                                symbioticRelationships: [
                                    'component synergy',
                                    'resource sharing',
                                    'mutual support',
                                ],
                            },
                        });
                    }
                    break;
                case 4:
                    // Validate swarm intelligence
                    if (!stepData.swarmBehavior && !stepData.emergentPatterns) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 4 (Swarm Intelligence) requires designing collective behavior patterns. ' +
                            'Provide either "swarmBehavior" (array) or "emergentPatterns" (array). ' +
                            'Example: { "swarmBehavior": ["simple rule 1", "local interaction 2", "collective decision 3"], "output": "..." }', 'swarmBehavior', {
                            step,
                            technique: 'biomimetic_path',
                            acceptedFields: ['swarmBehavior', 'emergentPatterns'],
                            example: {
                                swarmBehavior: [
                                    'decentralized coordination',
                                    'stigmergic communication',
                                    'collective problem-solving',
                                ],
                            },
                        });
                    }
                    break;
                case 5:
                    // Validate resilience patterns
                    if (!stepData.resiliencePatterns && !stepData.redundancy) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 5 (Resilience Patterns) requires building antifragile systems. ' +
                            'Provide either "resiliencePatterns" (array) or "redundancy" (array). ' +
                            'Example: { "resiliencePatterns": ["modular design", "adaptive cycles", "fault tolerance"], "output": "..." }', 'resiliencePatterns', {
                            step,
                            technique: 'biomimetic_path',
                            acceptedFields: ['resiliencePatterns', 'redundancy'],
                            example: {
                                resiliencePatterns: [
                                    'graceful degradation',
                                    'self-healing',
                                    'distributed backup',
                                ],
                            },
                        });
                    }
                    break;
                case 6:
                    // Validate natural synthesis
                    if (!stepData.naturalSynthesis &&
                        !stepData.integratedSolution &&
                        !stepData.biologicalStrategies) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 6 (Natural Synthesis) requires integrating biological solutions into a unified approach. ' +
                            'Provide "naturalSynthesis" (string), "integratedSolution" (string), or "biologicalStrategies" (array). ' +
                            'Example: { "naturalSynthesis": "Integrated bio-inspired solution combining immune response with swarm intelligence", "output": "..." }', 'naturalSynthesis', {
                            step,
                            technique: 'biomimetic_path',
                            acceptedFields: ['naturalSynthesis', 'integratedSolution', 'biologicalStrategies'],
                            example: { naturalSynthesis: 'Unified biological solution inspired by nature' },
                        });
                    }
                    break;
            }
        }
        return true;
    }
    getPromptContext(step) {
        const stepInfo = this.getStepInfo(step);
        return {
            technique: 'biomimetic_path',
            step,
            stepName: stepInfo.name,
            focus: stepInfo.focus,
            emoji: stepInfo.emoji,
            capabilities: {
                immuneResponse: 'Pattern recognition and adaptive immunity',
                evolutionaryVariation: 'Mutation and selection strategies',
                ecosystemDynamics: 'Symbiotic relationships and balance',
                swarmIntelligence: 'Collective behavior and emergence',
                resiliencePatterns: 'Redundancy and adaptive cycles',
                naturalSynthesis: 'Integrated biological solutions',
            },
        };
    }
}
//# sourceMappingURL=BiomimeticPathHandler.js.map