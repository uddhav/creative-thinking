/**
 * Neuro-Computational Synthesis for Enhanced Creativity technique handler
 *
 * Combines neuroscience-inspired cognitive processes with computational creativity methods
 * to generate enhanced creative solutions through hybrid neural-computational approaches.
 *
 * Different from existing techniques:
 * - neural_state: Focuses on DMN/ECN balance, not computational synthesis
 * - meta_learning: Learns from patterns, doesn't create new computational models
 * - neuro_computational: Creates novel solutions through neural-computational hybrid models
 *
 * This technique implements neural network-inspired creativity generation with
 * explicit computational models for enhanced creative problem solving.
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class NeuroComputationalHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Neural Mapping',
            focus: 'Map problem to neural representations',
            emoji: '🧠',
            description: 'Transform problem space into neural network representations, identifying key cognitive components and their interconnections',
        },
        {
            name: 'Pattern Generation',
            focus: 'Generate diverse solution patterns',
            emoji: '🌊',
            description: 'Use parallel distributed processing to generate multiple solution patterns across different neural pathways',
        },
        {
            name: 'Interference Analysis',
            focus: 'Analyze pattern interactions',
            emoji: '⚡',
            description: 'Identify constructive and destructive interference between solution patterns to optimize creative output',
        },
        {
            name: 'Computational Synthesis',
            focus: 'Synthesize patterns computationally',
            emoji: '🔬',
            description: 'Apply computational models to synthesize neural patterns into coherent creative solutions',
        },
        {
            name: 'Optimization Cycles',
            focus: 'Iterate and refine solutions',
            emoji: '🔄',
            description: 'Run iterative optimization cycles to enhance solution coherence, novelty, and utility',
        },
        {
            name: 'Convergence',
            focus: 'Converge to optimal solution',
            emoji: '🎯',
            description: 'Converge neural-computational processes to produce optimal creative solution with preserved insights',
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Neuro-Computational Synthesis',
            emoji: '⚛️',
            totalSteps: 6,
            description: 'Synthesize creative solutions through hybrid neural-computational models combining cognitive neuroscience with computational creativity',
            focus: 'Neural network-inspired computational creativity generation',
            enhancedFocus: 'Implements parallel distributed processing, interference analysis, and iterative optimization to generate novel solutions through computational synthesis of neural patterns',
            parallelSteps: {
                canParallelize: false,
                description: 'Steps build sequentially from neural mapping to convergence',
            },
        };
    }
    getStepInfo(step) {
        const stepInfo = this.steps[step - 1];
        if (!stepInfo) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Neuro-Computational Synthesis. Valid steps are 1-${this.steps.length}`, 'step', { providedStep: step, validRange: `1-${this.steps.length}` });
        }
        return stepInfo;
    }
    getStepGuidance(step, problem) {
        const guidanceMap = {
            1: `Map "${problem}" to neural representations. Identify cognitive components: perception, memory, attention, executive control. Map connections between components. Define activation patterns and thresholds. Consider both serial and parallel processing pathways. What neural architectures best represent this problem space?`,
            2: `Generate diverse solution patterns for: "${problem}". Activate multiple neural pathways simultaneously. Create variations through: random initialization, different connection weights, varied activation functions, alternative architectures. Generate at least 5-10 distinct patterns. Allow emergent properties to arise from interactions.`,
            3: `Analyze interference between solution patterns for: "${problem}". Identify constructive interference (patterns that reinforce each other) and destructive interference (patterns that cancel out). Map synergies and conflicts. Calculate interference coefficients. Which combinations produce the most creative emergence?`,
            4: `Synthesize patterns computationally for: "${problem}". Apply computational models: neural networks, genetic algorithms, evolutionary computation, swarm intelligence. Combine biological inspiration with computational efficiency. Create hybrid models that leverage both approaches. Generate novel combinations through computational synthesis.`,
            5: `Run optimization cycles for: "${problem}". Iterate through: feedforward passes, backpropagation, weight adjustment, architecture evolution. Measure convergence metrics: coherence (internal consistency), novelty (creative distance from existing solutions), utility (practical value). Refine for optimal balance between exploration and exploitation.`,
            6: `Converge to optimal creative solution for: "${problem}". Synthesize all neural-computational processes. Preserve key insights from each pattern. Ensure solution maintains: cognitive plausibility, computational efficiency, creative novelty, practical applicability. Document the emergence path for future learning.`,
        };
        return guidanceMap[step] || `Continue neuro-computational synthesis for: "${problem}"`;
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Add specific validation for neuro-computational fields
        if (typeof data === 'object' && data !== null) {
            const stepData = data;
            switch (step) {
                case 1:
                    // Validate neural mapping
                    if (!stepData.neuralMappings) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 1 requires neural mappings of problem components', 'neuralMappings', { step, technique: 'neuro_computational' });
                    }
                    break;
                case 2:
                    // Validate pattern generation
                    if (!stepData.patternGenerations) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 2 requires generated solution patterns', 'patternGenerations', { step, technique: 'neuro_computational' });
                    }
                    break;
                case 3: {
                    // Validate interference analysis - require both constructive and destructive
                    if (!stepData.interferenceAnalysis) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 3 requires interference analysis with constructive and destructive patterns', 'interferenceAnalysis', { step, technique: 'neuro_computational' });
                    }
                    const analysis = stepData.interferenceAnalysis;
                    if (!analysis.constructive || !analysis.destructive) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 3 requires both constructive AND destructive interference analysis', 'interferenceAnalysis', { step, technique: 'neuro_computational' });
                    }
                    break;
                }
                case 4:
                    // Validate computational synthesis
                    if (!stepData.computationalModels) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 4 requires computational models for synthesis', 'computationalModels', { step, technique: 'neuro_computational' });
                    }
                    break;
                case 5:
                    // Validate optimization cycles - require both cycles and metrics
                    if (!stepData.optimizationCycles || !stepData.convergenceMetrics) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 5 requires both optimization cycles AND convergence metrics', 'optimizationCycles', { step, technique: 'neuro_computational' });
                    }
                    break;
                case 6:
                    // Validate convergence - require synthesis and final metrics
                    if (!stepData.finalSynthesis || !stepData.convergenceMetrics) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 6 requires both final synthesis AND convergence metrics', 'finalSynthesis', { step, technique: 'neuro_computational' });
                    }
                    break;
            }
        }
        return true;
    }
    getPromptContext(step) {
        const stepInfo = this.getStepInfo(step);
        return {
            technique: 'neuro_computational',
            step,
            stepName: stepInfo.name,
            focus: stepInfo.focus,
            emoji: stepInfo.emoji,
            capabilities: {
                neuralMapping: 'Transform problems into neural network representations',
                patternGeneration: 'Generate diverse solutions through parallel processing',
                interferenceAnalysis: 'Analyze constructive and destructive pattern interactions',
                computationalSynthesis: 'Synthesize patterns using computational models',
                optimizationCycles: 'Iteratively refine for coherence, novelty, and utility',
                convergence: 'Converge to optimal creative solutions',
            },
        };
    }
}
//# sourceMappingURL=NeuroComputationalHandler.js.map