/**
 * DebateOrchestrator - Creates debate execution structure for multi-persona sessions
 *
 * For each persona, selects 1-2 techniques matching their techniqueBias,
 * creates parallel plans per persona, and creates a synthesis plan.
 */

import { randomUUID } from 'crypto';
import type { PersonaDefinition, DebateFormat } from './types.js';
import type {
  ParallelPlan,
  CoordinationStrategy,
  TechniqueWorkflow,
  ThinkingStep,
} from '../types/planning.js';
import type { LateralTechnique } from '../types/index.js';
import type { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
import { PersonaGuidanceInjector } from './PersonaGuidanceInjector.js';

export interface DebateStructure {
  personaPlans: ParallelPlan[];
  synthesisPlan: ParallelPlan;
  coordinationStrategy: CoordinationStrategy;
}

/** Default fallback techniques when persona bias yields no matches */
const DEFAULT_DEBATE_TECHNIQUES: LateralTechnique[] = ['six_hats', 'first_principles'];

export class DebateOrchestrator {
  /**
   * Create a complete debate structure for the given personas
   */
  createDebateStructure(
    problem: string,
    personas: PersonaDefinition[],
    techniqueRegistry: TechniqueRegistry,
    format: DebateFormat = 'structured',
    availableTechniques?: LateralTechnique[]
  ): DebateStructure {
    // Create individual plans per persona
    const personaPlans = personas.map(persona =>
      this.createPersonaPlan(problem, persona, techniqueRegistry, availableTechniques)
    );

    // Create synthesis plan using competing_hypotheses
    const synthesisPlan = this.createSynthesisPlan(problem, personas, techniqueRegistry);

    // Create coordination strategy
    const coordinationStrategy = this.createCoordinationStrategy(
      personaPlans,
      synthesisPlan,
      format
    );

    return {
      personaPlans,
      synthesisPlan,
      coordinationStrategy,
    };
  }

  /**
   * Create a plan for a single persona, selecting their preferred techniques
   */
  private createPersonaPlan(
    problem: string,
    persona: PersonaDefinition,
    techniqueRegistry: TechniqueRegistry,
    availableTechniques?: LateralTechnique[]
  ): ParallelPlan {
    const planId = `debate_${persona.id}_${randomUUID().slice(0, 12)}`;

    // Select 1-2 techniques that match this persona's bias
    const selectedTechniques = this.selectPersonaTechniques(
      persona,
      techniqueRegistry,
      availableTechniques
    );

    // Build workflow for each technique
    const workflow: TechniqueWorkflow[] = selectedTechniques.map(technique => {
      const handler = techniqueRegistry.getHandler(technique);
      const info = handler.getTechniqueInfo();
      const steps = this.generatePersonaSteps(
        problem,
        persona,
        technique,
        info.totalSteps,
        handler
      );

      return {
        technique,
        steps,
        requiredInputs: [`Problem: ${problem}`, `Persona: ${persona.name}`],
        expectedOutputs: [`${persona.name}'s analysis and position`],
      };
    });

    const totalSteps = workflow.reduce((sum, w) => sum + w.steps.length, 0);

    return {
      planId,
      problem,
      techniques: selectedTechniques,
      workflow,
      canExecuteIndependently: true,
      metadata: {
        techniqueCount: selectedTechniques.length,
        totalSteps,
        complexity: totalSteps > 10 ? 'high' : totalSteps > 5 ? 'medium' : 'low',
      },
    };
  }

  /**
   * Select 1-2 techniques that best match a persona's biases
   */
  private selectPersonaTechniques(
    persona: PersonaDefinition,
    techniqueRegistry: TechniqueRegistry,
    availableTechniques?: LateralTechnique[]
  ): LateralTechnique[] {
    const biasEntries = Object.entries(persona.techniqueBias)
      .filter(([technique]) => {
        // Only select techniques that exist in the registry
        if (!techniqueRegistry.isValidTechnique(technique)) {
          return false;
        }
        // If available techniques specified, filter to those
        if (availableTechniques) {
          return availableTechniques.includes(technique);
        }
        return true;
      })
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));

    // Take top 1-2 techniques
    const count = biasEntries.length >= 2 ? 2 : 1;
    const selected = biasEntries
      .slice(0, count)
      .map(([technique]) => technique as LateralTechnique);

    // Fallback to defaults if no bias matches
    if (selected.length === 0) {
      const fallback = DEFAULT_DEBATE_TECHNIQUES.filter(
        t =>
          techniqueRegistry.isValidTechnique(t) &&
          (!availableTechniques || availableTechniques.includes(t))
      );
      return fallback.slice(0, 1);
    }

    return selected;
  }

  /**
   * Generate persona-injected steps for a technique
   */
  private generatePersonaSteps(
    problem: string,
    persona: PersonaDefinition,
    technique: LateralTechnique,
    totalSteps: number,
    handler: { getStepGuidance: (step: number, problem: string) => string }
  ): ThinkingStep[] {
    const steps: ThinkingStep[] = [];

    for (let i = 1; i <= totalSteps; i++) {
      const originalGuidance = handler.getStepGuidance(i, problem);
      const injectedGuidance = PersonaGuidanceInjector.injectGuidance(
        originalGuidance,
        persona,
        i,
        totalSteps
      );

      steps.push({
        stepNumber: i,
        description: injectedGuidance,
        expectedOutput: `${persona.name}'s perspective on step ${i}`,
      });
    }

    return steps;
  }

  /**
   * Create synthesis plan using competing_hypotheses technique
   */
  private createSynthesisPlan(
    problem: string,
    personas: PersonaDefinition[],
    techniqueRegistry: TechniqueRegistry
  ): ParallelPlan {
    const planId = `debate_synthesis_${randomUUID().slice(0, 12)}`;
    const technique: LateralTechnique = 'competing_hypotheses';

    let handler: {
      getTechniqueInfo: () => { totalSteps: number };
      getStepGuidance: (step: number, problem: string) => string;
    } | null = null;
    let totalSteps: number;

    if (techniqueRegistry.isValidTechnique(technique)) {
      handler = techniqueRegistry.getHandler(technique);
      totalSteps = handler.getTechniqueInfo().totalSteps;
    } else {
      // Fallback if competing_hypotheses handler isn't available
      totalSteps = 8;
    }

    const synthesisHeader = PersonaGuidanceInjector.createDebateSynthesisHeader(personas);

    const steps: ThinkingStep[] = [];
    for (let i = 1; i <= totalSteps; i++) {
      const guidance = handler
        ? handler.getStepGuidance(i, problem)
        : `Synthesis step ${i}: Integrate and compare persona positions`;

      steps.push({
        stepNumber: i,
        description: `${synthesisHeader}\n${guidance}`,
        expectedOutput:
          i === totalSteps
            ? 'Final debate synthesis with actionable recommendations'
            : `Synthesis step ${i} output`,
      });
    }

    return {
      planId,
      problem,
      techniques: [technique],
      workflow: [{ technique, steps }],
      canExecuteIndependently: false,
      dependencies: [], // Will be populated by coordination strategy
      metadata: {
        techniqueCount: 1,
        totalSteps,
        complexity: 'medium',
      },
    };
  }

  /**
   * Create coordination strategy for debate execution
   */
  private createCoordinationStrategy(
    personaPlans: ParallelPlan[],
    synthesisPlan: ParallelPlan,
    format: DebateFormat
  ): CoordinationStrategy {
    // Synthesis depends on all persona plans completing
    synthesisPlan.dependencies = personaPlans.map(p => p.planId);

    const syncPoints: Array<{
      afterPlanIds: string[];
      action: 'wait' | 'checkpoint' | 'merge_context';
    }> = [
      {
        afterPlanIds: personaPlans.map(p => p.planId),
        action: 'merge_context',
      },
    ];

    // For adversarial format, add a checkpoint after each persona
    if (format === 'adversarial') {
      for (const plan of personaPlans) {
        syncPoints.push({
          afterPlanIds: [plan.planId],
          action: 'checkpoint' as const,
        });
      }
    }

    return {
      syncPoints,
      sharedContext: {
        enabled: true,
        updateStrategy: format === 'collaborative' ? 'immediate' : 'checkpoint',
      },
      errorHandling: 'partial_results',
    };
  }
}
