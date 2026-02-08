import { describe, it, expect } from 'vitest';
import { DebateOrchestrator } from '../../personas/DebateOrchestrator.js';
import { BUILTIN_PERSONAS } from '../../personas/catalog.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';

describe('DebateOrchestrator', () => {
  const orchestrator = new DebateOrchestrator();
  const registry = TechniqueRegistry.getInstance();

  describe('createDebateStructure()', () => {
    it('should create debate structure with 2 personas', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = orchestrator.createDebateStructure(
        'Should we rewrite in Rust?',
        personas,
        registry
      );

      expect(result.personaPlans).toHaveLength(2);
      expect(result.synthesisPlan).toBeDefined();
      expect(result.coordinationStrategy).toBeDefined();
    });

    it('should create debate structure with 3 personas', () => {
      const personas = [
        BUILTIN_PERSONAS.rich_hickey,
        BUILTIN_PERSONAS.joe_armstrong,
        BUILTIN_PERSONAS.nassim_taleb,
      ];
      const result = orchestrator.createDebateStructure(
        'How to handle system failures',
        personas,
        registry
      );

      expect(result.personaPlans).toHaveLength(3);
      expect(result.synthesisPlan).toBeDefined();
    });

    it('should select persona-specific techniques based on bias', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.rory_sutherland];
      const result = orchestrator.createDebateStructure(
        'How to improve user experience',
        personas,
        registry
      );

      // Rich Hickey should have first_principles or related technique
      const hickeyPlan = result.personaPlans[0];
      const hickeyTechniques = hickeyPlan.techniques;
      // Rory should have perception_optimization or related technique
      const roryPlan = result.personaPlans[1];
      const roryTechniques = roryPlan.techniques;

      // Each should have 1-2 techniques
      expect(hickeyTechniques.length).toBeGreaterThanOrEqual(1);
      expect(hickeyTechniques.length).toBeLessThanOrEqual(2);
      expect(roryTechniques.length).toBeGreaterThanOrEqual(1);
      expect(roryTechniques.length).toBeLessThanOrEqual(2);
    });

    it('should create unique plan IDs for each persona plan', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = orchestrator.createDebateStructure('Test', personas, registry);

      const planIds = result.personaPlans.map(p => p.planId);
      planIds.push(result.synthesisPlan.planId);
      const uniqueIds = new Set(planIds);
      expect(uniqueIds.size).toBe(planIds.length);
    });

    it('should mark persona plans as independently executable', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = orchestrator.createDebateStructure('Test', personas, registry);

      for (const plan of result.personaPlans) {
        expect(plan.canExecuteIndependently).toBe(true);
      }
    });

    it('should mark synthesis plan as dependent on persona plans', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = orchestrator.createDebateStructure('Test', personas, registry);

      expect(result.synthesisPlan.canExecuteIndependently).toBe(false);
      expect(result.synthesisPlan.dependencies).toBeDefined();
      const deps = result.synthesisPlan.dependencies ?? [];
      expect(deps.length).toBe(2);
    });

    it('should use competing_hypotheses for synthesis', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = orchestrator.createDebateStructure('Test', personas, registry);

      expect(result.synthesisPlan.techniques).toContain('competing_hypotheses');
    });

    it('should inject persona guidance into persona plan steps', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey];
      const result = orchestrator.createDebateStructure('Test problem', personas, registry);

      const firstStep = result.personaPlans[0].workflow[0].steps[0];
      expect(firstStep.description).toContain('Thinking as Rich Hickey');
    });

    it('should include debate synthesis header in synthesis plan steps', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = orchestrator.createDebateStructure('Test', personas, registry);

      const firstSynthesisStep = result.synthesisPlan.workflow[0].steps[0];
      expect(firstSynthesisStep.description).toContain('Debate Synthesis');
      expect(firstSynthesisStep.description).toContain('Rich Hickey');
      expect(firstSynthesisStep.description).toContain('Joe Armstrong');
    });

    it('should include metadata in each plan', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = orchestrator.createDebateStructure('Test', personas, registry);

      for (const plan of result.personaPlans) {
        expect(plan.metadata).toBeDefined();
        const meta = plan.metadata ?? {};
        expect(meta.techniqueCount).toBeGreaterThanOrEqual(1);
        expect(meta.totalSteps).toBeGreaterThan(0);
        expect(['low', 'medium', 'high']).toContain(meta.complexity);
      }
    });
  });

  describe('coordination strategy', () => {
    it('should create merge_context sync point for structured format', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = orchestrator.createDebateStructure('Test', personas, registry, 'structured');

      const strategy = result.coordinationStrategy;
      expect(strategy.syncPoints).toBeDefined();
      const syncPoints = strategy.syncPoints ?? [];
      expect(syncPoints.some(sp => sp.action === 'merge_context')).toBe(true);
    });

    it('should add checkpoint sync points for adversarial format', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = orchestrator.createDebateStructure('Test', personas, registry, 'adversarial');

      const strategy = result.coordinationStrategy;
      const syncPoints = strategy.syncPoints ?? [];
      const checkpoints = syncPoints.filter(sp => sp.action === 'checkpoint');
      expect(checkpoints.length).toBe(2); // One per persona
    });

    it('should use immediate shared context for collaborative format', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = orchestrator.createDebateStructure(
        'Test',
        personas,
        registry,
        'collaborative'
      );

      const strategy = result.coordinationStrategy;
      const sharedContext = strategy.sharedContext ?? { updateStrategy: '' };
      expect(sharedContext.updateStrategy).toBe('immediate');
    });

    it('should use partial_results error handling', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = orchestrator.createDebateStructure('Test', personas, registry);

      expect(result.coordinationStrategy.errorHandling).toBe('partial_results');
    });
  });

  describe('available technique filtering', () => {
    it('should filter persona techniques to available techniques when specified', () => {
      const personas = [BUILTIN_PERSONAS.rich_hickey];
      // Rich Hickey biases: first_principles, paradoxical_problem, triz, concept_extraction
      // Only provide triz as available
      const result = orchestrator.createDebateStructure('Test', personas, registry, 'structured', [
        'triz',
      ]);

      const techniques = result.personaPlans[0].techniques;
      expect(techniques).toContain('triz');
      expect(techniques).not.toContain('first_principles');
    });
  });
});
