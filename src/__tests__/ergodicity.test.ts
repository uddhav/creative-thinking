import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import { ErgodicityManager } from '../ergodicity/index.js';
import { ErgodicityWarningLevel } from '../ergodicity/types.js';

// Type for the response from server methods
type ServerResponse = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};

describe('Ergodicity and Path Dependency Tracking', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('Purple Hat in Six Thinking Hats', () => {
    it('should include Purple Hat as the 7th hat', () => {
      const input = {
        problem: 'Test path dependencies',
        techniques: ['six_hats'] as const,
      };

      const planResult = server.planThinkingSession(input) as ServerResponse;
      expect(planResult.isError).toBeFalsy();

      const planText = planResult.content[0]?.text || '';
      const planData = JSON.parse(planText) as { planId: string; estimatedSteps: number };

      // Should have 7 steps now
      expect(planData.estimatedSteps).toBe(7);

      // Check that Purple Hat is included in workflow
      expect(planText).toContain('Purple Hat');
      expect(planText).toContain('path dependencies');
    });

    it('should track path dependencies with Purple Hat', async () => {
      // Create plan
      const planResult = server.planThinkingSession({
        problem: 'How to improve team collaboration',
        techniques: ['six_hats'] as const,
      }) as ServerResponse;

      const planData = JSON.parse(planResult.content[0]?.text || '{}') as { planId: string };

      // Execute first step to create session
      const firstResult = (await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'six_hats' as const,
        problem: 'How to improve team collaboration',
        currentStep: 1,
        totalSteps: 7,
        output: 'Setting up the thinking process',
        hatColor: 'blue' as const,
        nextStepNeeded: true,
      })) as ServerResponse;

      const sessionData = JSON.parse(firstResult.content[0]?.text || '{}') as {
        sessionId: string;
      };

      // Now execute Purple Hat step
      const result = (await server.executeThinkingStep({
        planId: planData.planId,
        sessionId: sessionData.sessionId,
        technique: 'six_hats' as const,
        problem: 'How to improve team collaboration',
        currentStep: 7,
        totalSteps: 7,
        output: 'Analyzing path dependencies and constraints created by previous decisions',
        hatColor: 'purple' as const,
        nextStepNeeded: false,
      })) as ServerResponse;

      if (result.isError) {
        console.error('Error response:', result.content[0]?.text);
      }
      expect(result.isError).toBeFalsy();
      const responseText = result.content[0]?.text || '';
      expect(responseText).toContain('completed');
    });
  });

  describe('Path Memory System', () => {
    it('should track path events and calculate metrics', async () => {
      const ergodicityManager = new ErgodicityManager();

      // Record a low-commitment decision
      const result1 = await ergodicityManager.recordThinkingStep(
        'random_entry',
        1,
        'Exploring random connections',
        {
          optionsOpened: ['New perspective A', 'Alternative approach B'],
          reversibilityCost: 0.1,
          commitmentLevel: 0.1,
        }
      );

      expect(result1.metrics.flexibilityScore).toBeGreaterThan(0.8);
      expect(result1.metrics.reversibilityIndex).toBe(1.0);

      // Record a high-commitment decision
      const result2 = await ergodicityManager.recordThinkingStep(
        'design_thinking',
        4,
        'Building prototype',
        {
          optionsClosed: ['Alternative design approach', 'Different technology stack'],
          reversibilityCost: 0.7,
          commitmentLevel: 0.8,
        }
      );

      expect(result2.metrics.flexibilityScore).toBeLessThan(result1.metrics.flexibilityScore);
      expect(result2.metrics.reversibilityIndex).toBeLessThan(1.0);
    });

    it('should generate warnings when flexibility is low', async () => {
      const ergodicityManager = new ErgodicityManager();

      // Make several high-commitment decisions
      for (let i = 0; i < 5; i++) {
        await ergodicityManager.recordThinkingStep('scamper', i + 1, `Eliminating option ${i}`, {
          optionsClosed: [`Option ${i}`],
          reversibilityCost: 0.8,
          commitmentLevel: 0.7,
        });
      }

      const warnings = ergodicityManager.getWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.level === ErgodicityWarningLevel.WARNING)).toBe(true);
    });
  });

  describe('Absorbing Barrier Detection', () => {
    it('should detect approaching cognitive lock-in', async () => {
      const ergodicityManager = new ErgodicityManager();

      // Simulate repeated use of same technique
      for (let i = 0; i < 10; i++) {
        await ergodicityManager.recordThinkingStep('six_hats', 1, 'Using same approach again', {
          commitmentLevel: 0.5,
          reversibilityCost: 0.3,
        });
      }

      const pathMemory = ergodicityManager.getPathMemory();
      const cognitiveBarrier = pathMemory.absorbingBarriers.find(
        b => b.subtype === 'cognitive_lock_in'
      );

      expect(cognitiveBarrier).toBeDefined();
      expect(cognitiveBarrier?.proximity).toBeGreaterThan(0.5);
    });

    it('should provide escape routes when flexibility is low', async () => {
      const ergodicityManager = new ErgodicityManager();

      // Close many options
      for (let i = 0; i < 8; i++) {
        await ergodicityManager.recordThinkingStep('yes_and', i + 1, `Adding constraint ${i}`, {
          optionsClosed: [`Alternative ${i}`],
          commitmentLevel: 0.6,
          reversibilityCost: 0.6,
        });
      }

      const escapeRoutes = ergodicityManager.getEscapeRoutes();
      expect(escapeRoutes.length).toBeGreaterThan(0);
      expect(
        escapeRoutes.some(r => r.name.includes('Pattern') || r.name.includes('Constraint'))
      ).toBe(true);
    });
  });

  describe('Integration with Session Management', () => {
    it('should include ergodicity status in visual output', async () => {
      // Create plan
      const planResult = server.planThinkingSession({
        problem: 'Complex decision with many constraints',
        techniques: ['scamper'] as const,
      }) as ServerResponse;

      const planData = JSON.parse(planResult.content[0]?.text || '{}') as { planId: string };

      // Execute several SCAMPER steps to create path dependencies

      // Step 1: Eliminate (high commitment)
      const step1Result = (await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'scamper' as const,
        problem: 'Complex decision with many constraints',
        currentStep: 6,
        totalSteps: 7,
        output: 'Eliminating legacy components',
        scamperAction: 'eliminate' as const,
        risks: ['Cannot restore eliminated components'],
        nextStepNeeded: true,
      })) as ServerResponse;

      const step1Data = JSON.parse(step1Result.content[0]?.text || '{}') as {
        sessionId: string;
      };
      const sessionIdFromStep1 = step1Data.sessionId;

      // Step 2: Combine (medium commitment)
      const step2Result = (await server.executeThinkingStep({
        planId: planData.planId,
        sessionId: sessionIdFromStep1,
        technique: 'scamper' as const,
        problem: 'Complex decision with many constraints',
        currentStep: 2,
        totalSteps: 7,
        output: 'Combining separate modules',
        scamperAction: 'combine' as const,
        nextStepNeeded: false,
      })) as ServerResponse;

      expect(step2Result.isError).toBeFalsy();

      // With the new enforcement system, early termination is blocked
      const step2Content = JSON.parse(step2Result.content[0]?.text || '{}');

      // Should be blocked because trying to terminate at 2/7 steps (28%)
      expect(step2Content.blocked).toBe(true);
      expect(step2Content.title).toBe('Early Termination Blocked');
      expect(step2Content.completionStatus.overallProgress).toBeLessThan(30);
    });
  });

  describe('Technique Impact Analysis', () => {
    it('should correctly assess technique path impacts', () => {
      const ergodicityManager = new ErgodicityManager();

      const sixHatsImpact = ergodicityManager.analyzeTechniqueImpact('six_hats');
      expect(sixHatsImpact.typicalReversibility).toBeGreaterThan(0.8);
      expect(sixHatsImpact.typicalCommitment).toBeLessThan(0.3);

      const designThinkingImpact = ergodicityManager.analyzeTechniqueImpact('design_thinking');
      expect(designThinkingImpact.typicalReversibility).toBeLessThan(0.5);
      expect(designThinkingImpact.typicalCommitment).toBeGreaterThan(0.6);
    });
  });
});
