/**
 * Tests for memory-suggestive outputs implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type {
  ExecuteThinkingStepInput,
  PlanThinkingSessionInput,
  LateralTechnique,
} from '../index.js';

interface ServerResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

interface PlanResponse {
  planId: string;
  steps: Array<{
    technique: string;
    stepNumber: number;
    description: string;
  }>;
}

interface ExecutionResponse {
  sessionId: string;
  technique: string;
  currentStep: number;
  totalSteps: number;
  nextStepNeeded: boolean;
  historyLength: number;
  branches: string[];
  completed?: boolean;
  insights?: string[];
  summary?: string;
  metrics?: {
    duration: number;
    creativityScore: number;
    risksCaught?: number;
    antifragileFeatures?: number;
  };
  nextStepGuidance?: string;
  autoSaveError?: string;
  // Memory-suggestive fields
  contextualInsight?: string;
  historicalNote?: string;
  patternObserved?: string;
  sessionFingerprint?: {
    problemType: string;
    solutionPattern: string;
    breakthroughLevel: number;
    pathDependencies: string[];
  };
  noteworthyPatterns?: {
    observed: string;
    significance: string;
    applicability: string[];
  };
}

describe('Memory-Suggestive Outputs', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  // Helper function to create a plan
  function createPlan(problem: string, techniques: LateralTechnique[]): string {
    const input: PlanThinkingSessionInput = {
      problem,
      techniques,
    };

    const result = server.planThinkingSession(input) as ServerResponse;
    expect(result.isError).toBeFalsy();
    const planData = JSON.parse(result.content[0]?.text || '{}') as PlanResponse;
    return planData.planId;
  }

  // Helper function to execute a step
  async function executeStep(
    planId: string,
    input: Partial<ExecuteThinkingStepInput>
  ): Promise<ExecutionResponse> {
    const result = (await server.executeThinkingStep({
      planId,
      ...input,
    } as ExecuteThinkingStepInput)) as ServerResponse;

    expect(result.isError).toBeFalsy();
    return JSON.parse(result.content[0]?.text || '{}') as ExecutionResponse;
  }

  describe('Contextual Insights', () => {
    it('should generate contextual insight for risk identification', async () => {
      const planId = createPlan('Improve system security', ['six_hats']);

      const result = await executeStep(planId, {
        technique: 'six_hats',
        problem: 'Improve system security',
        currentStep: 5,
        totalSteps: 6,
        output: 'Critical analysis of security vulnerabilities',
        hatColor: 'black',
        risks: ['Data breach', 'Authentication bypass', 'SQL injection'],
        nextStepNeeded: true,
      });

      expect(result.contextualInsight).toBe(
        'Critical thinking revealed 3 risk factors that require mitigation'
      );
    });

    it('should generate insight for antifragile properties', async () => {
      const planId = createPlan('Build resilient system', ['triz']);

      const result = await executeStep(planId, {
        technique: 'triz',
        problem: 'Build resilient system',
        currentStep: 3,
        totalSteps: 4,
        output: 'Applying inventive principles',
        antifragileProperties: ['Self-healing', 'Adaptive capacity'],
        nextStepNeeded: true,
      });

      expect(result.contextualInsight).toBe(
        'Discovered 2 antifragile properties that strengthen under stress'
      );
    });

    it('should generate technique-specific insights', async () => {
      const planId = createPlan('Design new product', ['design_thinking']);

      const result = await executeStep(planId, {
        technique: 'design_thinking',
        problem: 'Design new product',
        currentStep: 1,
        totalSteps: 5,
        output: 'User research phase',
        designStage: 'empathize',
        empathyInsights: ['Long wait times', 'Complex interface', 'Poor mobile experience'],
        nextStepNeeded: true,
      });

      expect(result.contextualInsight).toBe('User research uncovered 3 key pain points');
    });
  });

  describe('Historical Notes', () => {
    it('should identify consistent risk awareness pattern', async () => {
      const planId = createPlan('Complex system design', ['six_hats']);

      // Build up history with risk awareness
      const step1 = await executeStep(planId, {
        technique: 'six_hats',
        problem: 'Complex system design',
        currentStep: 1,
        totalSteps: 6,
        output: 'Process overview',
        hatColor: 'blue',
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'six_hats',
        problem: 'Complex system design',
        currentStep: 2,
        totalSteps: 6,
        output: 'Facts and data',
        hatColor: 'white',
        risks: ['Technical debt'],
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'six_hats',
        problem: 'Complex system design',
        currentStep: 3,
        totalSteps: 6,
        output: 'Emotional perspective',
        hatColor: 'red',
        risks: ['Team burnout', 'Stakeholder anxiety'],
        nextStepNeeded: true,
      });

      const result = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'six_hats',
        problem: 'Complex system design',
        currentStep: 4,
        totalSteps: 6,
        output: 'Benefits analysis',
        hatColor: 'yellow',
        risks: ['Overconfidence in benefits'],
        nextStepNeeded: true,
      });

      expect(result.historicalNote).toBe(
        'This session demonstrates consistent risk awareness across multiple thinking steps'
      );
    });

    it('should detect iterative refinement through revisions', async () => {
      const planId = createPlan('Optimize workflow', ['po']);

      const step1 = await executeStep(planId, {
        technique: 'po',
        problem: 'Optimize workflow',
        currentStep: 1,
        totalSteps: 4,
        output: 'Initial provocation',
        provocation: 'PO: All workflows should be eliminated',
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'po',
        problem: 'Optimize workflow',
        currentStep: 2,
        totalSteps: 4,
        output: 'Exploring principles',
        principles: ['Automation', 'Self-service'],
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'po',
        problem: 'Optimize workflow',
        currentStep: 3,
        totalSteps: 4,
        output: 'Developing ideas',
        nextStepNeeded: true,
      });

      const result = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'po',
        problem: 'Optimize workflow',
        currentStep: 4,
        totalSteps: 4,
        output: 'Refined solution through iteration',
        isRevision: true,
        revisesStep: 3,
        nextStepNeeded: false,
      });

      expect(result.historicalNote).toBe(
        'Solution evolved through iterative refinement and exploration of alternatives'
      );
    });
  });

  describe('Pattern Observation', () => {
    it('should identify cross-domain pattern transfer', async () => {
      const planId = createPlan('Apply successful patterns', ['concept_extraction']);

      const result = await executeStep(planId, {
        technique: 'concept_extraction',
        problem: 'Apply successful patterns',
        currentStep: 3,
        totalSteps: 4,
        output: 'Abstracting patterns',
        abstractedPatterns: ['Network effects', 'Viral growth', 'Community building'],
        nextStepNeeded: true,
      });

      expect(result.patternObserved).toBe(
        'Cross-domain pattern transfer: Network effects, Viral growth, Community building'
      );
    });

    it('should detect collaborative building pattern', async () => {
      const planId = createPlan('Workshop facilitation', ['yes_and']);

      const step1 = await executeStep(planId, {
        technique: 'yes_and',
        problem: 'Workshop facilitation',
        currentStep: 1,
        totalSteps: 4,
        output: 'Initial idea',
        initialIdea: 'Virtual workshops',
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'yes_and',
        problem: 'Workshop facilitation',
        currentStep: 2,
        totalSteps: 4,
        output: 'Building on idea',
        additions: ['Interactive polls', 'Breakout rooms'],
        nextStepNeeded: true,
      });

      const result = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'yes_and',
        problem: 'Workshop facilitation',
        currentStep: 4,
        totalSteps: 4,
        output: 'Final synthesis',
        synthesis: 'Hybrid workshop model with engagement tools',
        nextStepNeeded: false,
      });

      expect(result.patternObserved).toBe(
        'Collaborative building pattern: initial idea → additions → synthesis'
      );
    });

    it('should identify constraint-driven innovation', async () => {
      const planId = createPlan('Design with constraints', ['scamper']);

      const result = await executeStep(planId, {
        technique: 'scamper',
        problem: 'Design with constraints',
        currentStep: 6,
        totalSteps: 8,
        output: 'Eliminating unnecessary features',
        scamperAction: 'eliminate',
        nextStepNeeded: false,
      });

      expect(result.patternObserved).toBe(
        'Constraint-driven innovation: limitations sparked creative solutions'
      );
    });
  });

  describe('Session Fingerprint', () => {
    it('should generate complete session fingerprint on completion', async () => {
      const planId = createPlan('Create innovative solution', ['random_entry']);

      const step1 = await executeStep(planId, {
        technique: 'random_entry',
        problem: 'Create innovative solution',
        currentStep: 1,
        totalSteps: 3,
        output: 'Random stimulus',
        randomStimulus: 'butterfly',
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'random_entry',
        problem: 'Create innovative solution',
        currentStep: 2,
        totalSteps: 3,
        output: 'Finding connections',
        connections: ['Transformation', 'Lightness', 'Color'],
        nextStepNeeded: true,
      });

      const result = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'random_entry',
        problem: 'Create innovative solution',
        currentStep: 3,
        totalSteps: 3,
        output: 'Applying insights',
        applications: ['Lightweight design', 'Transformative UX'],
        nextStepNeeded: false,
      });

      expect(result.sessionFingerprint).toBeDefined();
      expect(result.sessionFingerprint?.problemType).toBe('creation');
      expect(result.sessionFingerprint?.solutionPattern).toBe('linear progression');
      expect(result.sessionFingerprint?.breakthroughLevel).toBeGreaterThanOrEqual(0);
      expect(result.sessionFingerprint?.pathDependencies).toBeInstanceOf(Array);
    });

    it('should identify multi-technique synthesis pattern', async () => {
      const planId = createPlan('Complex problem solving', ['six_hats', 'scamper']);

      // Execute Six Hats first
      const step1 = await executeStep(planId, {
        technique: 'six_hats',
        problem: 'Complex problem solving',
        currentStep: 1,
        totalSteps: 1,
        output: 'Six hats analysis complete',
        hatColor: 'blue',
        nextStepNeeded: false,
      });

      // Then SCAMPER
      const result = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'scamper',
        problem: 'Complex problem solving',
        currentStep: 1,
        totalSteps: 1,
        output: 'SCAMPER modifications complete',
        scamperAction: 'substitute',
        nextStepNeeded: false,
      });

      expect(result.sessionFingerprint?.solutionPattern).toBe('multi-technique synthesis');
    });
  });

  describe('Noteworthy Patterns', () => {
    it('should identify Via Negativa success', async () => {
      const planId = createPlan('Simplify complex system', ['triz']);

      const result = await executeStep(planId, {
        technique: 'triz',
        problem: 'Simplify complex system',
        currentStep: 2,
        totalSteps: 4,
        output: 'Removing unnecessary components',
        viaNegativaRemovals: ['Legacy code', 'Redundant features', 'Complex workflows'],
        nextStepNeeded: true,
      });

      expect(result.noteworthyPatterns).toBeDefined();
      expect(result.noteworthyPatterns?.observed).toBe(
        'Successful application of Via Negativa principle'
      );
      expect(result.noteworthyPatterns?.significance).toBe(
        'Simplification through removal often more effective than addition'
      );
      expect(result.noteworthyPatterns?.applicability).toContain('complex systems');
    });

    it('should recognize multiple antifragile properties', async () => {
      const planId = createPlan('Build resilient architecture', ['design_thinking']);

      const result = await executeStep(planId, {
        technique: 'design_thinking',
        problem: 'Build resilient architecture',
        currentStep: 4,
        totalSteps: 5,
        output: 'Prototyping resilient features',
        designStage: 'prototype',
        antifragileProperties: ['Auto-scaling', 'Self-healing', 'Chaos engineering'],
        nextStepNeeded: true,
      });

      expect(result.noteworthyPatterns?.observed).toBe(
        'Multiple antifragile properties identified'
      );
      expect(result.noteworthyPatterns?.significance).toBe(
        'Solution gains strength from stressors'
      );
    });

    it('should detect effective multi-technique combination', async () => {
      const planId = createPlan('Strategic innovation', ['po', 'six_hats', 'triz']);

      // Build up a longer session with multiple techniques
      const step1 = await executeStep(planId, {
        technique: 'po',
        problem: 'Strategic innovation',
        currentStep: 1,
        totalSteps: 2,
        output: 'Provocation phase',
        provocation: 'PO: Innovation is unnecessary',
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'po',
        problem: 'Strategic innovation',
        currentStep: 2,
        totalSteps: 2,
        output: 'Principles extracted',
        principles: ['Focus on essentials'],
        nextStepNeeded: false,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'six_hats',
        problem: 'Strategic innovation',
        currentStep: 1,
        totalSteps: 2,
        output: 'Analytical phase',
        hatColor: 'white',
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'six_hats',
        problem: 'Strategic innovation',
        currentStep: 2,
        totalSteps: 2,
        output: 'Creative solutions',
        hatColor: 'green',
        nextStepNeeded: false,
      });

      const result = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'triz',
        problem: 'Strategic innovation',
        currentStep: 1,
        totalSteps: 1,
        output: 'TRIZ synthesis',
        contradiction: 'Innovation vs stability',
        nextStepNeeded: false,
      });

      expect(result.noteworthyPatterns?.observed).toBe('Effective multi-technique combination');
      expect(result.noteworthyPatterns?.applicability).toContain('complex problems');
    });
  });

  describe('Memory Output Integration', () => {
    it('should include memory outputs without disrupting normal response', async () => {
      const planId = createPlan('Test memory integration', ['six_hats']);

      const result = await executeStep(planId, {
        technique: 'six_hats',
        problem: 'Test memory integration',
        currentStep: 5,
        totalSteps: 6,
        output: 'Risk analysis',
        hatColor: 'black',
        risks: ['Budget overrun', 'Timeline delay'],
        nextStepNeeded: true,
      });

      // Normal response fields should still be present
      expect(result.sessionId).toBeDefined();
      expect(result.technique).toBe('six_hats');
      expect(result.currentStep).toBe(5);
      expect(result.nextStepNeeded).toBe(true);
      expect(result.nextStepGuidance).toBeDefined();

      // Memory fields should also be present
      expect(result.contextualInsight).toBeDefined();
    });

    it('should only generate relevant memory outputs', async () => {
      const planId = createPlan('Simple task', ['scamper']);

      const result = await executeStep(planId, {
        technique: 'scamper',
        problem: 'Simple task',
        currentStep: 1,
        totalSteps: 8,
        output: 'Substitution ideas',
        scamperAction: 'substitute',
        nextStepNeeded: true,
      });

      // Should not have all memory fields if not relevant
      expect(result.contextualInsight).toBeUndefined();
      expect(result.historicalNote).toBeUndefined();
      expect(result.sessionFingerprint).toBeUndefined(); // Only on completion
    });
  });
});
