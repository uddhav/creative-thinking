import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';

// Type for the response from server methods
type ServerResponse = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};

describe('Layered Tools Architecture', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('Discovery Layer - discover_techniques', () => {
    it('should recommend techniques based on problem keywords', () => {
      const input = {
        problem: 'How can we improve our product design to be more user-friendly?',
        preferredOutcome: 'systematic' as const,
      };

      const result = server.discoverTechniques(input) as ServerResponse;

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);

      const text = result.content[0]?.text || '';
      expect(text).toContain('recommendations');
      // Should recommend SCAMPER for improvement and Design Thinking for user focus
      expect(text.toLowerCase()).toMatch(/scamper|design[_\s]thinking/);
    });

    it('should handle technical contradiction problems', () => {
      const input = {
        problem:
          'Need to make the system faster but also more secure, which typically slows it down',
        context: 'Engineering challenge with conflicting requirements',
      };

      const result = server.discoverTechniques(input) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      // Should recommend TRIZ for contradictions
      expect(text.toLowerCase()).toContain('triz');
    });

    it('should provide default recommendations when no specific match', () => {
      const input = {
        problem: 'General problem that needs solving',
      };

      const result = server.discoverTechniques(input) as ServerResponse;

      expect(result.isError).toBeFalsy();
      expect(result.content.length).toBeGreaterThan(0);
      // Should provide versatile techniques
      const text = result.content[0]?.text || '';
      expect(text).toContain('recommendations');
    });

    it('should consider preferred outcomes', () => {
      const riskAwareResult = server.discoverTechniques({
        problem: 'How to launch a new product',
        preferredOutcome: 'risk-aware' as const,
      }) as ServerResponse;

      expect(riskAwareResult.isError).toBeFalsy();
      const riskText = riskAwareResult.content[0]?.text || '';
      // Should recommend Six Hats for risk awareness (Black Hat)
      expect(riskText.toLowerCase()).toContain('six_hats');

      const collaborativeResult = server.discoverTechniques({
        problem: 'Team brainstorming session needed',
        preferredOutcome: 'collaborative' as const,
      }) as ServerResponse;

      expect(collaborativeResult.isError).toBeFalsy();
      const collabText = collaborativeResult.content[0]?.text || '';
      // Should recommend Yes, And for collaboration
      expect(collabText.toLowerCase()).toContain('yes_and');
    });

    it('should limit recommendations to top 3', () => {
      const input = {
        problem:
          'Complex problem that could match many techniques: improve user experience, reduce technical debt, innovate product features, optimize performance',
      };

      const result = server.discoverTechniques(input) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      // Count technique occurrences in the recommendations
      const techniqueMatches = text.match(/"technique":\s*"[^"]+"/g) || [];
      expect(techniqueMatches.length).toBeLessThanOrEqual(3);
    });

    it('should handle invalid input', () => {
      const result = server.discoverTechniques({
        // Missing required 'problem' field
        preferredOutcome: 'systematic' as const,
      }) as ServerResponse;

      expect(result.isError).toBeTruthy();
      const errorText = result.content[0]?.text || '';
      expect(errorText).toContain('Problem description is required');
    });
  });

  describe('Planning Layer - plan_thinking_session', () => {
    it('should create workflow for single technique', () => {
      const input = {
        problem: 'How to improve team dynamics',
        techniques: ['six_hats'] as const,
        objectives: ['Better team communication'],
      };

      const result = server.planThinkingSession(input) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      expect(text).toContain('workflow');
      // Should create 7 steps for Six Hats (now includes Purple Hat)
      const stepMatches = text.match(/"stepNumber":\s*\d+/g) || [];
      expect(stepMatches.length).toBe(7);
    });

    it('should combine multiple techniques in workflow', () => {
      const input = {
        problem: 'Redesign product for better user experience',
        techniques: ['design_thinking', 'scamper'] as const,
        objectives: ['Improve UX', 'Reduce complexity'],
      };

      const result = server.planThinkingSession(input) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      // Design Thinking (5 steps) + SCAMPER (8 steps) = 13 total
      const stepMatches = text.match(/"stepNumber":\s*\d+/g) || [];
      expect(stepMatches.length).toBe(13);
    });

    it('should include risk considerations for appropriate steps', () => {
      const input = {
        problem: 'Technical optimization requiring careful analysis',
        techniques: ['design_thinking'] as const,
        objectives: ['Optimize performance'],
      };

      const result = server.planThinkingSession(input) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      // Should include risk considerations
      expect(text).toContain('riskConsiderations');
    });

    it('should handle thorough timeframe', () => {
      const input = {
        problem: 'Complex strategic planning',
        techniques: ['six_hats', 'triz'] as const,
        objectives: ['Long-term strategy'],
        timeframe: 'thorough' as const,
      };

      const result = server.planThinkingSession(input) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      expect(text).toContain('successCriteria');
      expect(text).toContain('Thorough analysis from all angles');
    });

    it('should handle invalid techniques', () => {
      const result = server.planThinkingSession({
        problem: 'Test problem',
        techniques: [], // Empty techniques array
        objectives: ['Test objective'],
      }) as ServerResponse;

      expect(result.isError).toBeTruthy();
      const errorText = result.content[0]?.text || '';
      expect(errorText).toContain('at least one technique');
    });
  });

  describe('Execution Layer - execute_thinking_step', () => {
    // Helper function to create a plan for testing
    function createTestPlan(
      problem: string,
      techniques: (
        | 'six_hats'
        | 'po'
        | 'random_entry'
        | 'scamper'
        | 'concept_extraction'
        | 'yes_and'
        | 'design_thinking'
        | 'triz'
      )[]
    ): string {
      const planResult = server.planThinkingSession({
        problem,
        techniques,
      }) as ServerResponse;

      const planData = JSON.parse(planResult.content[0]?.text || '{}') as { planId: string };
      return planData.planId;
    }

    it('should execute first step of a technique', async () => {
      // First create a plan
      const planId = createTestPlan('How to reduce operational costs', ['six_hats']);

      const input = {
        planId,
        technique: 'six_hats' as const,
        problem: 'How to reduce operational costs',
        currentStep: 1,
        totalSteps: 6,
        output: 'Analyzing the problem systematically',
        hatColor: 'blue' as const,
        nextStepNeeded: true,
      };

      const result = (await server.executeThinkingStep(input)) as ServerResponse;

      expect(result.isError).toBeFalsy();
      expect(result.content.length).toBeGreaterThan(0);
      const text = result.content[0]?.text || '';
      expect(text).toContain('sessionId');
    });

    it('should maintain session state across steps', async () => {
      // Create a plan first
      const planId = createTestPlan('How to make meetings more productive', ['po']);

      // First step
      const step1Result = (await server.executeThinkingStep({
        planId,
        technique: 'po' as const,
        problem: 'How to make meetings more productive',
        currentStep: 1,
        totalSteps: 4,
        output: 'PO: Meetings should have no agenda',
        provocation: 'Meetings should have no agenda',
        nextStepNeeded: true,
      })) as ServerResponse;

      expect(step1Result.isError).toBeFalsy();
      const step1Text = step1Result.content[0]?.text || '';
      const sessionIdMatch = step1Text.match(/"sessionId":\s*"([^"]+)"/);
      const sessionId = sessionIdMatch?.[1];
      expect(sessionId).toBeDefined();

      // Second step using session ID
      const step2Result = (await server.executeThinkingStep({
        planId,
        technique: 'po' as const,
        problem: 'How to make meetings more productive',
        currentStep: 2,
        totalSteps: 4,
        sessionId,
        output: 'This challenges the assumption that structure is necessary',
        principles: ['Flexibility over rigidity', 'Emergence over planning'],
        nextStepNeeded: true,
      })) as ServerResponse;

      expect(step2Result.isError).toBeFalsy();
      const step2Text = step2Result.content[0]?.text || '';
      expect(step2Text).toContain('historyLength');
      expect(step2Text).toContain('"historyLength": 2');
    });

    it('should complete a session when nextStepNeeded is false', async () => {
      const planId = createTestPlan('How to improve office productivity', ['random_entry']);

      const result = (await server.executeThinkingStep({
        planId,
        technique: 'random_entry' as const,
        problem: 'How to improve office productivity',
        currentStep: 3,
        totalSteps: 3,
        output: 'Final solution combining all insights',
        randomStimulus: 'Clock',
        connections: ['Time management', 'Scheduling', 'Deadlines'],
        nextStepNeeded: false,
      })) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      expect(text).toContain('Lateral thinking session completed');
      expect(text).toContain('insights');
    });

    it('should handle technique-specific fields correctly', async () => {
      const planId = createTestPlan('Improve customer onboarding', ['design_thinking']);

      const result = (await server.executeThinkingStep({
        planId,
        technique: 'design_thinking' as const,
        problem: 'Improve customer onboarding',
        currentStep: 1,
        totalSteps: 5,
        designStage: 'empathize' as const,
        output: 'Conducted user interviews',
        empathyInsights: [
          'Users find current process confusing',
          'Too many steps required',
          'Lack of guidance',
        ],
        risks: ['Selection bias in interviews'],
        nextStepNeeded: true,
      })) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      expect(text).toContain('sessionId');
      // Verify the step was processed
      expect(text).toContain('historyLength');
    });

    it('should require planId', async () => {
      const result = (await server.executeThinkingStep({
        // Missing planId - intentionally omitted for test
        technique: 'six_hats' as const,
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        output: 'Test output',
        nextStepNeeded: true,
      } as unknown)) as ServerResponse;

      expect(result.isError).toBeTruthy();
      const errorText = result.content[0]?.text || '';
      const errorData = JSON.parse(errorText) as { error: string; workflow: string };
      expect(errorData.error).toBe('planId is required');
      expect(errorData.workflow).toContain(
        'discover_techniques → plan_thinking_session → execute_thinking_step'
      );
    });

    it('should validate planId exists', async () => {
      const result = (await server.executeThinkingStep({
        planId: 'invalid_plan_id',
        technique: 'six_hats' as const,
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        output: 'Test output',
        nextStepNeeded: true,
      })) as ServerResponse;

      expect(result.isError).toBeTruthy();
      const errorText = result.content[0]?.text || '';
      const errorData = JSON.parse(errorText) as { error: string; message: string };
      expect(errorData.error).toBe('Invalid planId');
      expect(errorData.message).toContain('not found');
    });

    it('should validate technique matches plan', async () => {
      // Create a plan for six_hats
      const planId = createTestPlan('Test problem', ['six_hats']);

      // Try to execute with different technique
      const result = (await server.executeThinkingStep({
        planId,
        technique: 'po' as const, // Wrong technique
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 4,
        output: 'Test output',
        nextStepNeeded: true,
      })) as ServerResponse;

      expect(result.isError).toBeTruthy();
      const errorText = result.content[0]?.text || '';
      const errorData = JSON.parse(errorText) as {
        error: string;
        plannedTechniques: string[];
      };
      expect(errorData.error).toBe('Technique mismatch');
      expect(errorData.plannedTechniques).toContain('six_hats');
    });
  });

  describe('Integration - Full Workflow', () => {
    it('should complete a full discovery-planning-execution workflow', async () => {
      // Step 1: Discovery
      const discoveryResult = server.discoverTechniques({
        problem: 'How to reduce software bugs in production',
        preferredOutcome: 'systematic' as const,
      }) as ServerResponse;

      expect(discoveryResult.isError).toBeFalsy();

      // Step 2: Planning
      const planResult = server.planThinkingSession({
        problem: 'How to reduce software bugs in production',
        techniques: ['triz'] as const, // Based on discovery
        objectives: ['Identify root causes', 'Find systematic solutions'],
      }) as ServerResponse;

      expect(planResult.isError).toBeFalsy();

      // Extract planId from the plan result
      const planText = planResult.content[0]?.text || '';
      const planData = JSON.parse(planText) as { planId: string };
      expect(planData.planId).toBeDefined();

      // Step 3: Execution
      const execResult = (await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'triz' as const,
        problem: 'How to reduce software bugs in production',
        currentStep: 1,
        totalSteps: 4,
        output: 'Identifying the core contradiction',
        contradiction: 'Need thorough testing BUT need fast deployment',
        risks: ['Testing takes time', 'Fast deployment may skip tests'],
        nextStepNeeded: true,
      })) as ServerResponse;

      expect(execResult.isError).toBeFalsy();
      const text = execResult.content[0]?.text || '';
      expect(text).toContain('sessionId');
    });
  });
});
