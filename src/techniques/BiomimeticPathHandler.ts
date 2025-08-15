/**
 * Biomimetic Path Management technique handler
 * Applies biological solutions and evolutionary strategies to innovation challenges
 */

import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface BiomimeticStep {
  name: string;
  focus: string;
  emoji: string;
  description?: string;
}

export class BiomimeticPathHandler extends BaseTechniqueHandler {
  private readonly steps: BiomimeticStep[] = [
    {
      name: 'Immune Response',
      focus: 'Threat detection and adaptive response generation',
      emoji: '🦠',
      description:
        'Apply immune system principles to identify threats and generate diverse antibody-like solutions with memory patterns',
    },
    {
      name: 'Evolutionary Variation',
      focus: 'Mutation and selection pressure simulation',
      emoji: '🧬',
      description:
        'Generate solution mutations and apply selection pressures to evolve optimal traits through fitness testing',
    },
    {
      name: 'Ecosystem Dynamics',
      focus: 'Symbiotic relationships and resource competition',
      emoji: '🌿',
      description:
        'Map symbiotic relationships between components and balance resource flows for ecological stability',
    },
    {
      name: 'Swarm Intelligence',
      focus: 'Emergent collective behavior patterns',
      emoji: '🐜',
      description:
        'Design simple rules that lead to complex emergent behaviors through collective decision-making',
    },
    {
      name: 'Resilience Patterns',
      focus: 'Redundancy and modularity application',
      emoji: '🔄',
      description:
        'Build resilience through redundancy, modularity, and adaptive cycles for antifragile systems',
    },
    {
      name: 'Natural Synthesis',
      focus: 'Integration of biological solutions',
      emoji: '🌱',
      description:
        'Synthesize the best biological strategies into a unified, practical solution inspired by nature',
    },
  ];

  private readonly stepsWithReflexivity: StepInfo[] = [
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

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Biomimetic Path Management',
      emoji: '🦠',
      totalSteps: 6,
      description:
        'Apply biological solutions and evolutionary strategies to innovation challenges',
      focus: 'Nature-inspired problem solving through evolutionary patterns',
      enhancedFocus:
        'Leverages billions of years of evolutionary problem-solving to find robust, adaptive solutions that have survived the test of time',
      parallelSteps: {
        canParallelize: false,
        description: 'Steps build sequentially from detection to synthesis',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    const stepInfo = this.stepsWithReflexivity[step - 1];
    if (!stepInfo) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Biomimetic Path Management. Valid steps are 1-${this.stepsWithReflexivity.length}`,
        'step',
        { providedStep: step, validRange: `1-${this.stepsWithReflexivity.length}` }
      );
    }
    return stepInfo;
  }

  getStepGuidance(step: number, problem: string): string {
    const guidanceMap: Record<number, string> = {
      1: `Apply immune system thinking to: "${problem}". What are the threats or challenges (antigens)? How can you develop diverse antibodies (solution variants)? Create memory cells for successful patterns. Build in rapid response mechanisms for known challenges. Consider: pattern recognition, adaptive immunity, memory formation, and threat neutralization strategies.`,
      2: `Apply evolutionary variation to: "${problem}". Generate multiple solution mutations with different traits. Apply selection pressures to test fitness. Allow successful traits to propagate. Create genetic algorithms for optimization. Consider: mutation rates, selection criteria, crossover mechanisms, and fitness landscapes. What survives and thrives?`,
      3: `Examine ecosystem dynamics for: "${problem}". Identify symbiotic relationships between solution components. Map resource flows and competition. Find ecological niches for specialized solutions. Build resilient networks. Consider: mutualism, commensalism, parasitism, predator-prey dynamics, and succession patterns. How do solutions coexist and support each other?`,
      4: `Apply swarm intelligence to: "${problem}". Design simple rules that lead to complex emergent behaviors. Use stigmergic coordination (indirect communication through environment). Enable collective decision-making. Implement distributed problem-solving. Consider: ant colony optimization, bee waggle dances, bird flocking, and termite construction patterns.`,
      5: `Build resilience patterns for: "${problem}". Apply redundancy at critical points. Create modular components that can be recombined. Design hierarchical organization with fallback levels. Implement adaptive cycles (growth, conservation, release, reorganization). Consider: fault tolerance, graceful degradation, self-healing, and antifragility.`,
      6: `Synthesize natural solutions for: "${problem}". Integrate the best biological strategies from previous steps. Create a hybrid solution that combines immune adaptability, evolutionary fitness, ecosystem balance, swarm coordination, and resilience patterns. Ensure the solution is biomimetic yet practical for implementation. What would nature's ultimate solution look like?`,
    };

    return guidanceMap[step] || `Continue biomimetic analysis for: "${problem}"`;
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Add specific validation for biomimetic fields
    if (typeof data === 'object' && data !== null) {
      const stepData = data as Record<string, unknown>;

      switch (step) {
        case 1:
          // Validate immune response
          if (!stepData.immuneResponse && !stepData.antibodies) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 1 requires immune response patterns or antibody generation',
              'immuneResponse',
              { step, technique: 'biomimetic_path' }
            );
          }
          break;
        case 2:
          // Validate evolutionary variation
          if (!stepData.mutations && !stepData.selectionPressure) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 2 requires mutations or selection pressure analysis',
              'mutations',
              { step, technique: 'biomimetic_path' }
            );
          }
          break;
        case 3:
          // Validate ecosystem dynamics
          if (!stepData.symbioticRelationships && !stepData.ecosystemBalance) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 3 requires symbiotic relationships or ecosystem analysis',
              'symbioticRelationships',
              { step, technique: 'biomimetic_path' }
            );
          }
          break;
        case 4:
          // Validate swarm intelligence
          if (!stepData.swarmBehavior && !stepData.emergentPatterns) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 4 requires swarm behavior or emergent patterns',
              'swarmBehavior',
              { step, technique: 'biomimetic_path' }
            );
          }
          break;
        case 5:
          // Validate resilience patterns
          if (!stepData.resiliencePatterns && !stepData.redundancy) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 5 requires resilience patterns or redundancy strategies',
              'resiliencePatterns',
              { step, technique: 'biomimetic_path' }
            );
          }
          break;
        case 6:
          // Validate natural synthesis
          if (!stepData.naturalSynthesis && !stepData.integratedSolution) {
            throw new ValidationError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              'Step 6 requires natural synthesis or integrated biological solution',
              'naturalSynthesis',
              { step, technique: 'biomimetic_path' }
            );
          }
          break;
      }
    }

    return true;
  }

  getPromptContext(step: number): Record<string, unknown> {
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
