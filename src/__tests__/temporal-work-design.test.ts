/**
 * Tests for Temporal Work Design technique implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type {
  ExecuteThinkingStepInput,
  PlanThinkingSessionInput,
  DiscoverTechniquesInput,
  LateralTechnique,
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
  recommendations: Array<{
    technique: string;
    effectiveness: number;
    reasoning: string;
  }>;
  reasoning: string;
  suggestedWorkflow?: string;
  problemCategory: string;
  warnings?: string[];
  contextAnalysis?: {
    complexity: 'low' | 'medium' | 'high';
    timeConstraint: boolean;
    collaborationNeeded: boolean;
    flexibilityScore?: number;
  };
}

describe('Temporal Work Design', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  // Helper function to create a plan
  function createPlan(problem: string, techniques: string[]): string {
    const input: PlanThinkingSessionInput = {
      problem,
      techniques: techniques as LateralTechnique[],
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

  describe('Discovery Phase', () => {
    it('should recommend Temporal Work for deadline and time management problems', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'How to manage creative work under tight deadlines',
        context: 'Multiple projects with conflicting deadlines and limited time',
      };

      const result = server.discoverTechniques(input) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const response = JSON.parse(result.content[0]?.text || '{}') as DiscoveryResponse;

      const temporalRec = response.recommendations.find(r => r.technique === 'temporal_work');
      expect(temporalRec).toBeDefined();
      expect(temporalRec?.effectiveness).toBeGreaterThan(0.8);
      expect(temporalRec?.reasoning).toContain('kairos-chronos integration');
    });

    it('should recommend Temporal Work for schedule optimization', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'Managing creative work with time pressure and circadian rhythms',
        context: 'Need to balance deadline pressure with kairos opportunities',
      };

      const result = server.discoverTechniques(input) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const response = JSON.parse(result.content[0]?.text || '{}') as DiscoveryResponse;

      const temporalRec = response.recommendations.find(r => r.technique === 'temporal_work');
      expect(temporalRec).toBeDefined();
      expect(temporalRec?.effectiveness).toBeGreaterThan(0.7);
    });
  });

  describe('Planning Phase', () => {
    it('should create a proper workflow for Temporal Work technique', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Transform time pressure into creative catalyst',
        techniques: ['temporal_work'] as LateralTechnique[],
      };

      const result = server.planThinkingSession(input) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const planData = JSON.parse(result.content[0]?.text || '{}') as PlanResponse;

      expect(planData.workflow).toHaveLength(5);
      expect(planData.workflow[0].description).toContain('Map the temporal landscape');
      expect(planData.workflow[1].description).toContain('circadian rhythms');
      expect(planData.workflow[2].description).toContain('Transform time pressure');
      expect(planData.workflow[3].description).toContain('async and sync');
      expect(planData.workflow[4].description).toContain('temporal escape routes');

      // Check risk considerations
      expect(planData.workflow[0].riskConsiderations).toContain(
        'Over-optimization can reduce adaptability'
      );
      expect(planData.workflow[4].riskConsiderations).toContain(
        'Early rushing creates quality ceiling'
      );
    });
  });

  describe('Execution Phase', () => {
    it('should execute all five Temporal Work steps', async () => {
      const planId = createPlan('Optimize creative project timeline', ['temporal_work']);

      // Step 1: Map temporal landscape
      const step1 = await executeStep(planId, {
        technique: 'temporal_work',
        problem: 'Optimize creative project timeline',
        currentStep: 1,
        totalSteps: 5,
        output: 'Identified 3 fixed deadlines and 2 flexible windows',
        temporalLandscape: {
          fixedDeadlines: ['MVP launch', 'investor demo', 'conference presentation'],
          flexibleWindows: ['design iteration phase', 'user testing period'],
          pressurePoints: ['week before launch', 'demo preparation'],
          deadZones: ['Friday afternoons', 'post-lunch slump'],
          kairosOpportunities: ['early morning flow', 'late night insights'],
        },
        nextStepNeeded: true,
      });

      expect(step1.technique).toBe('temporal_work');
      expect(step1.currentStep).toBe(1);
      expect(step1.nextStepGuidance).toContain('circadian rhythms');
      expect(step1.contextualInsight).toContain('3 fixed constraints, 2 kairos opportunities');

      // Step 2: Circadian alignment
      const step2 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'temporal_work',
        problem: 'Optimize creative project timeline',
        currentStep: 2,
        totalSteps: 5,
        output: 'Mapped team energy patterns and peak hours',
        circadianAlignment: [
          'Morning: analytical tasks',
          'Afternoon: collaborative work',
          'Evening: creative exploration',
          'Off-peak: insight incubation',
        ],
        nextStepNeeded: true,
      });

      expect(step2.currentStep).toBe(2);

      // Step 3: Pressure transformation
      const step3 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'temporal_work',
        problem: 'Optimize creative project timeline',
        currentStep: 3,
        totalSteps: 5,
        output: 'Converted deadline stress into creative sprints',
        pressureTransformation: [
          'Pre-deadline energy surge protocol',
          'Creative crunch sessions',
          'Recovery periods scheduled',
          'Stress-to-focus techniques',
        ],
        nextStepNeeded: true,
      });

      expect(step3.currentStep).toBe(3);
      expect(step3.contextualInsight).toContain('4 catalytic techniques applied');

      // Step 4: Async-sync balance
      const step4 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'temporal_work',
        problem: 'Optimize creative project timeline',
        currentStep: 4,
        totalSteps: 5,
        output: 'Balanced solo and collaborative time',
        asyncSyncBalance: [
          'Solo morning exploration',
          'Afternoon integration sessions',
          'Asynchronous feedback loops',
          'Synchronized decision points',
        ],
        nextStepNeeded: true,
      });

      expect(step4.currentStep).toBe(4);

      // Step 5: Temporal escape routes
      const step5 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'temporal_work',
        problem: 'Optimize creative project timeline',
        currentStep: 5,
        totalSteps: 5,
        output: 'Created buffers and graceful degradation plans',
        temporalEscapeRoutes: [
          '20% buffer on all estimates',
          'Time loan between phases',
          'Quality threshold checkpoints',
          'Scope reduction options',
        ],
        nextStepNeeded: false,
      });

      expect(step5.currentStep).toBe(5);
      expect(step5.completed).toBe(true);
      expect(step5.insights).toBeDefined();
      expect(step5.insights?.length).toBeGreaterThan(0);
      expect(step5.insights?.some(i => i.includes('Temporal Work Design completed'))).toBe(true);
    });

    it('should handle complex temporal landscapes', async () => {
      const planId = createPlan('Managing multiple project deadlines', ['temporal_work']);

      const step1 = await executeStep(planId, {
        technique: 'temporal_work',
        problem: 'Managing multiple project deadlines',
        currentStep: 1,
        totalSteps: 5,
        output: 'Complex landscape with multiple constraints',
        temporalLandscape: {
          fixedDeadlines: ['Q1 release', 'Q2 milestone', 'Annual review'],
          flexibleWindows: ['Research phase', 'Polish period'],
          pressurePoints: ['End of sprint', 'Demo days'],
          deadZones: ['Meeting-heavy Mondays', 'Context-switching times'],
          kairosOpportunities: ['Flow state mornings', 'Weekend insights'],
        },
        nextStepNeeded: true,
      });

      expect(step1.contextualInsight).toContain('fixed constraints');
      expect(step1.contextualInsight).toContain('kairos opportunities');
    });

    it('should track path impact for temporal commitments', async () => {
      const planId = createPlan('Restructure work schedule', ['temporal_work']);

      const step3 = await executeStep(planId, {
        technique: 'temporal_work',
        problem: 'Restructure work schedule',
        currentStep: 3,
        totalSteps: 5,
        output: 'Implementing new time structures',
        pressureTransformation: ['Pomodoro variations', 'Sprint cycles', 'Recovery protocols'],
        nextStepNeeded: true,
      });

      // Path impact should be moderate as temporal structures create dependencies
      expect(step3.sessionId).toBeDefined();
    });

    it('should generate memory-suggestive outputs for temporal sessions', async () => {
      const planId = createPlan('Optimize team creative schedule', ['temporal_work']);

      // Complete a full session
      await executeStep(planId, {
        technique: 'temporal_work',
        problem: 'Optimize team creative schedule',
        currentStep: 1,
        totalSteps: 5,
        output: 'Landscape mapped',
        temporalLandscape: {
          fixedDeadlines: ['Sprint ends'],
          flexibleWindows: ['Creative time'],
          pressurePoints: ['Reviews'],
          deadZones: ['Post-lunch'],
          kairosOpportunities: ['Morning flow'],
        },
        nextStepNeeded: true,
      });

      const step1 = await executeStep(planId, {
        technique: 'temporal_work',
        problem: 'Optimize team creative schedule',
        currentStep: 1,
        totalSteps: 5,
        output: 'Landscape mapped',
        temporalLandscape: {
          fixedDeadlines: ['Sprint ends'],
          flexibleWindows: ['Creative time'],
          pressurePoints: ['Reviews'],
          deadZones: ['Post-lunch'],
          kairosOpportunities: ['Morning flow'],
        },
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'temporal_work',
        problem: 'Optimize team creative schedule',
        currentStep: 2,
        totalSteps: 5,
        output: 'Rhythms aligned',
        circadianAlignment: ['Morning focus', 'Afternoon collaboration'],
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'temporal_work',
        problem: 'Optimize team creative schedule',
        currentStep: 3,
        totalSteps: 5,
        output: 'Pressure transformed',
        pressureTransformation: ['Sprint energy', 'Deadline catalysts'],
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'temporal_work',
        problem: 'Optimize team creative schedule',
        currentStep: 4,
        totalSteps: 5,
        output: 'Balance achieved',
        asyncSyncBalance: ['Solo mornings', 'Team afternoons'],
        nextStepNeeded: true,
      });

      const finalStep = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'temporal_work',
        problem: 'Optimize team creative schedule',
        currentStep: 5,
        totalSteps: 5,
        output: 'Escape routes designed',
        temporalEscapeRoutes: ['Buffer zones', 'Scope flexibility'],
        nextStepNeeded: false,
      });

      expect(finalStep.sessionFingerprint).toBeDefined();
      expect(finalStep.sessionFingerprint?.solutionPattern).toBeDefined();
    });
  });

  describe('Integration with Other Techniques', () => {
    it('should work well in combination with Neural State', async () => {
      const planId = createPlan('Optimize cognitive performance within time constraints', [
        'temporal_work',
        'neural_state',
      ]);

      // First design temporal structure
      const temporalStep = await executeStep(planId, {
        technique: 'temporal_work',
        problem: 'Optimize cognitive performance within time constraints',
        currentStep: 1,
        totalSteps: 1,
        output: 'Temporal structure optimized for cognitive rhythms',
        temporalLandscape: {
          fixedDeadlines: ['Project milestones'],
          kairosOpportunities: ['Flow state windows'],
        },
        circadianAlignment: ['DMN morning windows', 'ECN afternoon focus'],
        nextStepNeeded: false,
      });

      expect(temporalStep.completed).toBe(true);

      // Then optimize neural state within that structure
      const neuralStep = await executeStep(planId, {
        sessionId: temporalStep.sessionId,
        technique: 'neural_state',
        problem: 'Optimize cognitive performance within time constraints',
        currentStep: 1,
        totalSteps: 1,
        output: 'Neural state aligned with temporal design',
        dominantNetwork: 'dmn',
        switchingRhythm: ['Aligned with circadian peaks'],
        nextStepNeeded: false,
      });

      expect(neuralStep.sessionId).toBe(temporalStep.sessionId);
    });
  });

  describe('Error Handling', () => {
    it('should validate temporal landscape structure', async () => {
      const planId = createPlan('Test temporal validation', ['temporal_work']);

      // Test with valid nested structure
      const result = await executeStep(planId, {
        technique: 'temporal_work',
        problem: 'Test temporal validation',
        currentStep: 1,
        totalSteps: 5,
        output: 'Testing temporal landscape',
        temporalLandscape: {
          fixedDeadlines: ['deadline1', 'deadline2'],
          flexibleWindows: ['window1'],
        },
        nextStepNeeded: true,
      });

      expect(result.technique).toBe('temporal_work');
    });

    it('should handle missing temporal fields gracefully', async () => {
      const planId = createPlan('Test missing fields', ['temporal_work']);

      // Execute without specific temporal fields
      const result = await executeStep(planId, {
        technique: 'temporal_work',
        problem: 'Test missing fields',
        currentStep: 1,
        totalSteps: 5,
        output: 'Mapping temporal landscape without specific data',
        nextStepNeeded: true,
      });

      expect(result.technique).toBe('temporal_work');
      // Should not have contextual insight without temporal landscape data
      expect(result.contextualInsight).toBeUndefined();
    });

    it('should provide contextual guidance based on previous steps', async () => {
      const planId = createPlan('Test contextual guidance', ['temporal_work']);

      // Step 1: Map landscape with specific dead zones
      const step1 = await executeStep(planId, {
        technique: 'temporal_work',
        problem: 'Test contextual guidance',
        currentStep: 1,
        totalSteps: 5,
        output: 'Mapped landscape',
        temporalLandscape: {
          fixedDeadlines: ['Project launch'],
          deadZones: ['Post-lunch slump', 'Monday meetings'],
          pressurePoints: ['Week before launch'],
        },
        nextStepNeeded: true,
      });

      expect(step1.currentStep).toBe(1);

      // Step 2: Check guidance includes reference to dead zones from step 1
      const step2 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'temporal_work',
        problem: 'Test contextual guidance',
        currentStep: 2,
        totalSteps: 5,
        output: 'Analyzing rhythms',
        circadianAlignment: ['Morning focus', 'Afternoon collaboration'],
        nextStepNeeded: true,
      });

      // Step 3 guidance should reference pressure points from step 1
      expect(step2.nextStepGuidance).toContain('Week before launch');
      expect(step2.nextStepGuidance).toContain('creative catalysts');
    });
  });
});
