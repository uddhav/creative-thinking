/**
 * Comprehensive tests for all technique implementations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type {
  ExecuteThinkingStepInput,
  PlanThinkingSessionInput,
  LateralTechnique,
  SixHatsColor,
  ScamperAction,
  DesignThinkingStage,
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
}

describe('Technique Implementations', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  // Helper function to create a plan
  async function createPlan(problem: string, techniques: LateralTechnique[]): Promise<string> {
    const input: PlanThinkingSessionInput = {
      problem,
      techniques,
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

  describe('Six Thinking Hats', () => {
    it('should execute all six hats in sequence', async () => {
      const planId = await createPlan('How to improve team productivity', ['six_hats']);

      const hats: Array<{ color: SixHatsColor; step: number; focus: string }> = [
        { color: 'blue', step: 1, focus: 'process' },
        { color: 'white', step: 2, focus: 'facts' },
        { color: 'red', step: 3, focus: 'emotions' },
        { color: 'yellow', step: 4, focus: 'benefits' },
        { color: 'black', step: 5, focus: 'caution' },
        { color: 'green', step: 6, focus: 'creativity' },
      ];

      let sessionId: string | undefined;

      for (const hat of hats) {
        const result = await executeStep(planId, {
          technique: 'six_hats',
          problem: 'How to improve team productivity',
          currentStep: hat.step,
          totalSteps: 6,
          output: `Analyzing with ${hat.color} hat: ${hat.focus}`,
          hatColor: hat.color,
          nextStepNeeded: hat.step < 6,
          sessionId,
        });

        expect(result.technique).toBe('six_hats');
        expect(result.currentStep).toBe(hat.step);
        expect(result.totalSteps).toBe(6);

        // Store sessionId for next steps
        if (!sessionId) {
          sessionId = result.sessionId;
        }
      }
    });

    it('should handle purple hat (ergodicity perspective)', async () => {
      const planId = await createPlan('Complex strategic decision', ['six_hats']);

      // Execute first few steps to create session
      const step1 = await executeStep(planId, {
        technique: 'six_hats',
        problem: 'Complex strategic decision',
        currentStep: 1,
        totalSteps: 7,
        output: 'Starting analysis',
        hatColor: 'blue',
        nextStepNeeded: true,
      });

      // Execute purple hat step
      const purpleResult = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'six_hats',
        problem: 'Complex strategic decision',
        currentStep: 7,
        totalSteps: 7,
        output: 'Analyzing path dependencies and flexibility',
        hatColor: 'purple',
        nextStepNeeded: false,
      });

      expect(purpleResult.currentStep).toBe(7);
      expect(purpleResult.totalSteps).toBe(7);
      expect(purpleResult.completed).toBe(true);
      expect(purpleResult.insights).toBeDefined();
    });
  });

  describe('PO (Provocative Operation)', () => {
    it('should execute all PO steps', async () => {
      const planId = await createPlan('How to reduce meeting time', ['po']);

      const steps = [
        {
          step: 1,
          description: 'Create provocation',
          field: 'provocation',
          value: 'PO: Meetings should last forever',
        },
        {
          step: 2,
          description: 'Extract principles',
          field: 'principles',
          value: ['Time awareness', 'Focus'],
        },
        {
          step: 3,
          description: 'Develop ideas',
          field: 'ideas',
          value: ['Time boxing', 'Standing meetings'],
        },
        {
          step: 4,
          description: 'Create solution',
          field: 'solution',
          value: 'Implement strict time limits',
        },
      ];

      let sessionId: string | undefined;

      for (const stepData of steps) {
        const input: Partial<ExecuteThinkingStepInput> = {
          technique: 'po',
          problem: 'How to reduce meeting time',
          currentStep: stepData.step,
          totalSteps: 4,
          output: stepData.description,
          nextStepNeeded: stepData.step < 4,
          sessionId,
        };

        // Add technique-specific field
        if (stepData.field === 'provocation' && typeof stepData.value === 'string') {
          Object.assign(input, { provocation: stepData.value });
        } else if (stepData.field === 'principles' && Array.isArray(stepData.value)) {
          Object.assign(input, { principles: stepData.value });
        }

        const result = await executeStep(planId, input);

        expect(result.technique).toBe('po');
        expect(result.currentStep).toBe(stepData.step);

        if (!sessionId) {
          sessionId = result.sessionId;
        }
      }
    });
  });

  describe('Random Entry', () => {
    it('should execute random entry technique', async () => {
      const planId = await createPlan('How to improve customer service', ['random_entry']);

      // Step 1: Random stimulus
      const step1 = await executeStep(planId, {
        technique: 'random_entry',
        problem: 'How to improve customer service',
        currentStep: 1,
        totalSteps: 3,
        output: 'Using random word: butterfly',
        randomStimulus: 'butterfly',
        nextStepNeeded: true,
      });

      expect(step1.technique).toBe('random_entry');

      // Step 2: Find connections
      const step2 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'random_entry',
        problem: 'How to improve customer service',
        currentStep: 2,
        totalSteps: 3,
        output: 'Connecting butterfly attributes to service',
        connections: ['Transformation', 'Delicate handling', 'Colorful experience'],
        nextStepNeeded: true,
      });

      expect(step2.currentStep).toBe(2);

      // Step 3: Apply insights
      const step3 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'random_entry',
        problem: 'How to improve customer service',
        currentStep: 3,
        totalSteps: 3,
        output: 'Transform service approach with delicate, personalized touch',
        applications: ['Personal transformation journey', 'Delicate issue handling'],
        nextStepNeeded: false,
      });

      expect(step3.currentStep).toBe(3);
      expect(step3.insights).toBeDefined();
    });
  });

  describe('SCAMPER', () => {
    it('should execute all SCAMPER actions', async () => {
      const planId = await createPlan('Improve product packaging', ['scamper']);

      const actions: Array<{ action: ScamperAction; step: number }> = [
        { action: 'substitute', step: 1 },
        { action: 'combine', step: 2 },
        { action: 'adapt', step: 3 },
        { action: 'modify', step: 4 },
        { action: 'put_to_other_use', step: 5 },
        { action: 'eliminate', step: 6 },
        { action: 'reverse', step: 7 },
      ];

      let sessionId: string | undefined;

      for (const { action, step } of actions) {
        const result = await executeStep(planId, {
          technique: 'scamper',
          problem: 'Improve product packaging',
          currentStep: step,
          totalSteps: 7,
          output: `Applying ${action} to packaging`,
          scamperAction: action,
          nextStepNeeded: step < 7,
          sessionId,
        });

        expect(result.technique).toBe('scamper');
        expect(result.currentStep).toBe(step);

        if (!sessionId) {
          sessionId = result.sessionId;
        }
      }
    });
  });

  describe('Concept Extraction', () => {
    it('should extract and apply concepts', async () => {
      const planId = await createPlan('Learn from successful startups', ['concept_extraction']);

      // Step 1: Identify success example
      const step1 = await executeStep(planId, {
        technique: 'concept_extraction',
        problem: 'Learn from successful startups',
        currentStep: 1,
        totalSteps: 4,
        output: 'Analyzing Airbnb success story',
        successExample: 'Airbnb marketplace model',
        nextStepNeeded: true,
      });

      // Step 2: Extract concepts
      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'concept_extraction',
        problem: 'Learn from successful startups',
        currentStep: 2,
        totalSteps: 4,
        output: 'Extracting key concepts',
        extractedConcepts: ['Trust building', 'Two-sided marketplace', 'User reviews'],
        nextStepNeeded: true,
      });

      // Step 3: Abstract patterns
      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'concept_extraction',
        problem: 'Learn from successful startups',
        currentStep: 3,
        totalSteps: 4,
        output: 'Finding abstract patterns',
        abstractedPatterns: ['Network effects', 'Trust mechanisms', 'Quality control'],
        nextStepNeeded: true,
      });

      // Step 4: Apply to new domain
      const step4 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'concept_extraction',
        problem: 'Learn from successful startups',
        currentStep: 4,
        totalSteps: 4,
        output: 'Applying patterns to new business',
        applications: ['Professional services marketplace', 'Skill sharing platform'],
        nextStepNeeded: false,
      });

      expect(step4.insights).toBeDefined();
      expect(step4.insights?.length).toBeGreaterThan(0);
    });
  });

  describe('Yes, And...', () => {
    it('should build on ideas collaboratively', async () => {
      const planId = await createPlan('Create innovative workshop format', ['yes_and']);

      // Step 1: Initial idea
      const step1 = await executeStep(planId, {
        technique: 'yes_and',
        problem: 'Create innovative workshop format',
        currentStep: 1,
        totalSteps: 4,
        output: 'Virtual reality workshop',
        initialIdea: 'Use VR for remote workshops',
        nextStepNeeded: true,
      });

      // Step 2: Build on idea
      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'yes_and',
        problem: 'Create innovative workshop format',
        currentStep: 2,
        totalSteps: 4,
        output: 'Yes, and participants can have avatars',
        additions: ['Custom avatars', 'Virtual whiteboards', 'Spatial audio'],
        nextStepNeeded: true,
      });

      // Step 3: Evaluate additions
      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'yes_and',
        problem: 'Create innovative workshop format',
        currentStep: 3,
        totalSteps: 4,
        output: 'Evaluating feasibility',
        evaluations: ['Avatars: High impact', 'VR equipment: Cost barrier'],
        nextStepNeeded: true,
      });

      // Step 4: Synthesize
      const step4 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'yes_and',
        problem: 'Create innovative workshop format',
        currentStep: 4,
        totalSteps: 4,
        output: 'Combined VR/AR hybrid approach',
        synthesis: 'Hybrid workshop with optional VR enhancement',
        nextStepNeeded: false,
      });

      expect(step4.technique).toBe('yes_and');
      expect(step4.insights).toBeDefined();
    });
  });

  describe('Design Thinking', () => {
    it('should execute all design thinking stages', async () => {
      const planId = await createPlan('Redesign onboarding experience', ['design_thinking']);

      const stages: Array<{ stage: DesignThinkingStage; step: number; focus: string }> = [
        { stage: 'empathize', step: 1, focus: 'User research and pain points' },
        { stage: 'define', step: 2, focus: 'Problem statement definition' },
        { stage: 'ideate', step: 3, focus: 'Solution brainstorming' },
        { stage: 'prototype', step: 4, focus: 'Quick mockup creation' },
        { stage: 'test', step: 5, focus: 'User feedback collection' },
      ];

      let sessionId: string | undefined;

      for (const { stage, step, focus } of stages) {
        const result = await executeStep(planId, {
          technique: 'design_thinking',
          problem: 'Redesign onboarding experience',
          currentStep: step,
          totalSteps: 5,
          output: focus,
          designStage: stage,
          nextStepNeeded: step < 5,
          sessionId,
        });

        expect(result.technique).toBe('design_thinking');
        expect(result.currentStep).toBe(step);

        if (!sessionId) {
          sessionId = result.sessionId;
        }
      }
    });

    it('should include risk considerations in design thinking', async () => {
      const planId = await createPlan('Design secure payment system', ['design_thinking']);

      const result = await executeStep(planId, {
        technique: 'design_thinking',
        problem: 'Design secure payment system',
        currentStep: 3,
        totalSteps: 5,
        output: 'Ideating secure solutions',
        designStage: 'ideate',
        risks: ['Data breach', 'Payment fraud', 'User friction'],
        mitigations: ['Encryption', 'Multi-factor auth', 'Smooth UX'],
        nextStepNeeded: true,
      });

      expect(result.technique).toBe('design_thinking');
      expect(result.currentStep).toBe(3);
    });
  });

  describe('TRIZ', () => {
    it('should execute TRIZ methodology', async () => {
      const planId = await createPlan('Reduce manufacturing defects', ['triz']);

      // Step 1: Identify contradiction
      const step1 = await executeStep(planId, {
        technique: 'triz',
        problem: 'Reduce manufacturing defects',
        currentStep: 1,
        totalSteps: 4,
        output: 'Speed vs Quality contradiction',
        contradiction: 'Faster production increases defects',
        nextStepNeeded: true,
      });

      // Step 2: Remove compromise
      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'triz',
        problem: 'Reduce manufacturing defects',
        currentStep: 2,
        totalSteps: 4,
        output: 'Eliminating the compromise',
        principles: ['Segmentation', 'Asymmetry', 'Prior action'],
        nextStepNeeded: true,
      });

      // Step 3: Apply inventive principles
      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'triz',
        problem: 'Reduce manufacturing defects',
        currentStep: 3,
        totalSteps: 4,
        output: 'Applying TRIZ principles',
        inventivePrinciples: ['Modular assembly', 'Pre-testing components'],
        nextStepNeeded: true,
      });

      // Step 4: Minimize resources
      const step4 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'triz',
        problem: 'Reduce manufacturing defects',
        currentStep: 4,
        totalSteps: 4,
        output: 'Optimal solution with minimal resources',
        minimalSolution: 'Automated quality checkpoints',
        nextStepNeeded: false,
      });

      expect(step4.technique).toBe('triz');
      expect(step4.insights).toBeDefined();
    });
  });

  describe('Cross-Technique Features', () => {
    it('should track flexibility across techniques', async () => {
      const planId = await createPlan('Complex problem solving', ['po', 'scamper']);

      // Execute PO technique
      const poResult = await executeStep(planId, {
        technique: 'po',
        problem: 'Complex problem solving',
        currentStep: 1,
        totalSteps: 4,
        output: 'Creating provocation',
        provocation: 'PO: Problems solve themselves',
        nextStepNeeded: false, // Complete PO
      });

      expect(poResult.completed).toBe(true);
      expect(poResult.insights).toBeDefined();

      // Note: In the actual system, switching techniques mid-session
      // would require proper workflow management
    });

    it('should maintain session state across steps', async () => {
      const planId = await createPlan('Test session persistence', ['six_hats']);

      // Execute multiple steps
      const step1 = await executeStep(planId, {
        technique: 'six_hats',
        problem: 'Test session persistence',
        currentStep: 1,
        totalSteps: 6,
        output: 'First step',
        hatColor: 'blue',
        nextStepNeeded: true,
      });

      const step2 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'six_hats',
        problem: 'Test session persistence',
        currentStep: 2,
        totalSteps: 6,
        output: 'Second step',
        hatColor: 'white',
        nextStepNeeded: true,
      });

      expect(step2.sessionId).toBe(step1.sessionId);
      expect(step2.historyLength).toBe(2); // Two steps executed
    });

    it('should complete session and extract insights', async () => {
      const planId = await createPlan('Quick ideation session', ['random_entry']);

      // Execute all steps quickly
      const step1 = await executeStep(planId, {
        technique: 'random_entry',
        problem: 'Quick ideation session',
        currentStep: 1,
        totalSteps: 3,
        output: 'Random word: Clock',
        randomStimulus: 'clock',
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'random_entry',
        problem: 'Quick ideation session',
        currentStep: 2,
        totalSteps: 3,
        output: 'Time-based connections',
        connections: ['Precision', 'Cycles', 'Synchronization'],
        nextStepNeeded: true,
      });

      const finalStep = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'random_entry',
        problem: 'Quick ideation session',
        currentStep: 3,
        totalSteps: 3,
        output: 'Applied time concepts to problem',
        applications: ['Scheduled updates', 'Cyclic reviews'],
        nextStepNeeded: false, // Complete session
      });

      expect(finalStep.insights).toBeDefined();
      expect(finalStep.insights?.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should validate technique-specific fields', async () => {
      const planId = await createPlan('Test validation', ['six_hats']);

      // Try to execute without required fields
      const result = await server.executeThinkingStep({
        planId,
        technique: 'six_hats',
        problem: 'Test validation',
        currentStep: 1,
        totalSteps: 6,
        // Missing required 'output' field
        nextStepNeeded: true,
      } as ExecuteThinkingStepInput);

      expect(result.isError).toBeTruthy();
      const errorData = JSON.parse(result.content[0]?.text || '{}') as {
        error: {
          code: string;
          message: string;
          layer: string;
          timestamp: string;
        };
        isError: boolean;
      };
      expect(errorData.error.message).toContain('Invalid output');
    });

    it('should require matching technique with plan', async () => {
      const planId = await createPlan('Test mismatch', ['po']);

      // Try to execute with different technique
      const result = await server.executeThinkingStep({
        planId,
        technique: 'scamper', // Wrong technique for this plan
        problem: 'Test mismatch',
        currentStep: 1,
        totalSteps: 7,
        output: 'Testing',
        scamperAction: 'substitute',
        nextStepNeeded: true,
      } as ExecuteThinkingStepInput);

      expect(result.isError).toBeTruthy();
    });
  });
});
