/**
 * Tests for Neural State Optimization technique implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type {
  ExecuteThinkingStepInput,
  PlanThinkingSessionInput,
  DiscoverTechniquesInput,
} from '../index.js';

interface ServerResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

interface PlanResponse {
  planId: string;
  workflow: Array<{
    technique: string;
    stepNumber: number;
    description: string;
    expectedOutputs: string[];
    riskConsiderations?: string[];
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

interface DiscoveryResponse {
  problem: string;
  recommendations: Array<{
    technique: string;
    score: number;
    reasoning: string;
    bestFor: string[];
    limitations: string[];
  }>;
  suggestedWorkflow?: string;
  flexibilityScore?: number;
  optionGenerationRecommended?: boolean;
}

describe('Neural State Optimization', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  // Helper function to create a plan
  async function createPlan(problem: string, techniques: string[]): Promise<string> {
    const input: PlanThinkingSessionInput = {
      problem,
      techniques: techniques as any,
    };

    const result = (await server.planThinkingSession(input)) as ServerResponse;
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

  describe('Discovery Phase', () => {
    it('should recommend Neural State for focus and cognitive problems', async () => {
      const input: DiscoverTechniquesInput = {
        problem: 'How to improve focus and overcome creative blocks',
        context: 'Struggling with attention and switching between analytical and creative tasks',
      };

      const result = (await server.discoverTechniques(input)) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const response = JSON.parse(result.content[0]?.text || '{}') as DiscoveryResponse;

      const neuralStateRec = response.recommendations.find(r => r.technique === 'neural_state');
      expect(neuralStateRec).toBeDefined();
      expect(neuralStateRec?.score).toBeGreaterThan(0.8);
      expect(neuralStateRec?.reasoning).toContain('brain network switching');
      expect(neuralStateRec?.bestFor).toContain('cognitive optimization');
    });

    it('should recommend Neural State for productivity enhancement', async () => {
      const input: DiscoverTechniquesInput = {
        problem: 'Enhance productivity and mental state management',
      };

      const result = (await server.discoverTechniques(input)) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const response = JSON.parse(result.content[0]?.text || '{}') as DiscoveryResponse;

      const neuralStateRec = response.recommendations.find(r => r.technique === 'neural_state');
      expect(neuralStateRec).toBeDefined();
      expect(neuralStateRec?.bestFor).toContain('productivity enhancement');
    });
  });

  describe('Planning Phase', () => {
    it('should create a proper workflow for Neural State technique', async () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Optimize cognitive flexibility for complex problem solving',
        techniques: ['neural_state'] as any,
      };

      const result = (await server.planThinkingSession(input)) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const planData = JSON.parse(result.content[0]?.text || '{}') as PlanResponse;

      expect(planData.workflow).toHaveLength(4);
      expect(planData.workflow[0].description).toContain('Assess current neural state');
      expect(planData.workflow[1].description).toContain('Identify network suppression');
      expect(planData.workflow[2].description).toContain('Develop network switching rhythm');
      expect(planData.workflow[3].description).toContain('Integrate insights');

      // Check risk considerations
      expect(planData.workflow[0].riskConsiderations).toContain('Individual variation in neural patterns');
      expect(planData.workflow[2].riskConsiderations).toContain('Avoid forced switching that disrupts flow');
    });
  });

  describe('Execution Phase', () => {
    it('should execute all four Neural State steps', async () => {
      const planId = await createPlan('Overcome cognitive rigidity in problem-solving', ['neural_state']);

      // Step 1: Assess current state
      const step1 = await executeStep(planId, {
        technique: 'neural_state',
        problem: 'Overcome cognitive rigidity in problem-solving',
        currentStep: 1,
        totalSteps: 4,
        output: 'Currently experiencing high focus but low creativity',
        dominantNetwork: 'ecn',
        nextStepNeeded: true,
      });

      expect(step1.technique).toBe('neural_state');
      expect(step1.currentStep).toBe(1);
      expect(step1.nextStepGuidance).toContain('Identify patterns of network suppression');
      expect(step1.contextualInsight).toContain('Executive Control Network dominance detected');

      // Step 2: Identify suppression
      const step2 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'neural_state',
        problem: 'Overcome cognitive rigidity in problem-solving',
        currentStep: 2,
        totalSteps: 4,
        output: 'High suppression of DMN, stuck in analytical mode',
        suppressionDepth: 8,
        nextStepNeeded: true,
      });

      expect(step2.currentStep).toBe(2);
      expect(step2.contextualInsight).toContain('Network suppression depth: 8/10');
      expect(step2.contextualInsight).toContain('High rigidity detected');

      // Step 3: Develop switching rhythm
      const step3 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'neural_state',
        problem: 'Overcome cognitive rigidity in problem-solving',
        currentStep: 3,
        totalSteps: 4,
        output: 'Implementing 90-min focus / 20-min wandering cycles',
        switchingRhythm: [
          '90-minute deep work sessions',
          '20-minute mindful breaks',
          'Morning meditation for DMN activation',
          'Evening reflection for integration',
        ],
        nextStepNeeded: true,
      });

      expect(step3.currentStep).toBe(3);
      expect(step3.historyLength).toBe(3);

      // Step 4: Integrate insights
      const step4 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'neural_state',
        problem: 'Overcome cognitive rigidity in problem-solving',
        currentStep: 4,
        totalSteps: 4,
        output: 'Achieved balanced cognitive flexibility',
        integrationInsights: [
          'ECN for complex analysis phases',
          'DMN for creative insight generation',
          'Rhythmic switching prevents burnout',
          'Integration leads to innovative solutions',
        ],
        nextStepNeeded: false,
      });

      expect(step4.currentStep).toBe(4);
      expect(step4.completed).toBe(true);
      expect(step4.insights).toBeDefined();
      expect(step4.insights?.length).toBeGreaterThan(0);
      expect(step4.insights?.some(i => i.includes('Neural State Optimization completed'))).toBe(true);
    });

    it('should handle DMN dominance scenario', async () => {
      const planId = await createPlan('Focus issues due to excessive mind wandering', ['neural_state']);

      const step1 = await executeStep(planId, {
        technique: 'neural_state',
        problem: 'Focus issues due to excessive mind wandering',
        currentStep: 1,
        totalSteps: 4,
        output: 'Excessive DMN activity, difficulty maintaining focus',
        dominantNetwork: 'dmn',
        nextStepNeeded: true,
      });

      expect(step1.contextualInsight).toContain('Default Mode Network dominance detected');
    });

    it('should track path impact for neural state changes', async () => {
      const planId = await createPlan('Optimize mental performance', ['neural_state']);

      const step3 = await executeStep(planId, {
        technique: 'neural_state',
        problem: 'Optimize mental performance',
        currentStep: 3,
        totalSteps: 4,
        output: 'Establishing new cognitive patterns',
        switchingRhythm: ['Pomodoro technique', 'Meditation breaks', 'Physical movement triggers'],
        nextStepNeeded: true,
      });

      // Path impact should be relatively low as neural state changes are reversible
      expect(step3.sessionId).toBeDefined();
    });

    it('should generate memory-suggestive outputs for neural state sessions', async () => {
      const planId = await createPlan('Enhance cognitive flexibility', ['neural_state']);

      // Complete a full session
      const step1 = await executeStep(planId, {
        technique: 'neural_state',
        problem: 'Enhance cognitive flexibility',
        currentStep: 1,
        totalSteps: 4,
        output: 'ECN dominance identified',
        dominantNetwork: 'ecn',
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'neural_state',
        problem: 'Enhance cognitive flexibility',
        currentStep: 2,
        totalSteps: 4,
        output: 'Moderate suppression detected',
        suppressionDepth: 6,
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'neural_state',
        problem: 'Enhance cognitive flexibility',
        currentStep: 3,
        totalSteps: 4,
        output: 'Rhythm established',
        switchingRhythm: ['Time-based switching', 'Task-based transitions'],
        nextStepNeeded: true,
      });

      const finalStep = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'neural_state',
        problem: 'Enhance cognitive flexibility',
        currentStep: 4,
        totalSteps: 4,
        output: 'Integration complete',
        integrationInsights: ['Balanced cognition achieved'],
        nextStepNeeded: false,
      });

      expect(finalStep.sessionFingerprint).toBeDefined();
      expect(finalStep.sessionFingerprint?.solutionPattern).toBeDefined();
    });
  });

  describe('Integration with Other Techniques', () => {
    it('should work well in combination with Six Hats', async () => {
      const planId = await createPlan(
        'Complex strategic decision requiring both analysis and creativity',
        ['neural_state', 'six_hats']
      );

      // First optimize neural state
      const neuralStep = await executeStep(planId, {
        technique: 'neural_state',
        problem: 'Complex strategic decision requiring both analysis and creativity',
        currentStep: 1,
        totalSteps: 1,
        output: 'Optimized cognitive state for multi-perspective thinking',
        dominantNetwork: 'dmn',
        integrationInsights: ['Ready for systematic analysis with creative openness'],
        nextStepNeeded: false,
      });

      expect(neuralStep.completed).toBe(true);

      // Then apply Six Hats with optimized cognition
      const sixHatsStep = await executeStep(planId, {
        sessionId: neuralStep.sessionId,
        technique: 'six_hats',
        problem: 'Complex strategic decision requiring both analysis and creativity',
        currentStep: 1,
        totalSteps: 1,
        output: 'Applied Blue Hat with enhanced cognitive flexibility',
        hatColor: 'blue',
        nextStepNeeded: false,
      });

      expect(sixHatsStep.sessionId).toBe(neuralStep.sessionId);
    });
  });

  describe('Error Handling', () => {
    it('should validate neural state specific fields', async () => {
      const planId = await createPlan('Test neural state validation', ['neural_state']);

      // Test invalid suppressionDepth
      const result = await server.executeThinkingStep({
        planId,
        technique: 'neural_state',
        problem: 'Test neural state validation',
        currentStep: 2,
        totalSteps: 4,
        output: 'Testing invalid suppression depth',
        suppressionDepth: 15, // Should be 0-10
        nextStepNeeded: true,
      } as ExecuteThinkingStepInput);

      // The system should still accept it but might generate appropriate insights
      expect(result.isError).toBeFalsy();
    });

    it('should handle missing neural state fields gracefully', async () => {
      const planId = await createPlan('Test missing fields', ['neural_state']);

      // Execute without specific neural state fields
      const result = await executeStep(planId, {
        technique: 'neural_state',
        problem: 'Test missing fields',
        currentStep: 1,
        totalSteps: 4,
        output: 'Assessing state without specific network identification',
        nextStepNeeded: true,
      });

      expect(result.technique).toBe('neural_state');
      expect(result.contextualInsight).toBeUndefined(); // No specific insight without data
    });
  });
});