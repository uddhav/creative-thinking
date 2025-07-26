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
    it('should recommend techniques based on problem keywords', async () => {
      const input = {
        problem: 'How can we improve our product design to be more user-friendly?',
        preferredOutcome: 'systematic' as const,
      };

      const result = (await server.discoverTechniques(input)) as ServerResponse;

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);

      const text = result.content[0]?.text || '';
      expect(text).toContain('recommendations');
      // Should recommend SCAMPER for improvement and Design Thinking for user focus
      expect(text.toLowerCase()).toMatch(/scamper|design[_\s]thinking/);
    });

    it('should handle technical contradiction problems', async () => {
      const input = {
        problem:
          'Need to make the system faster but also more secure, which typically slows it down',
        context: 'Engineering challenge with conflicting requirements',
      };

      const result = (await server.discoverTechniques(input)) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      // Should recommend TRIZ for contradictions
      expect(text.toLowerCase()).toContain('triz');
    });

    it('should provide default recommendations when no specific match', async () => {
      const input = {
        problem: 'General problem that needs solving',
      };

      const result = (await server.discoverTechniques(input)) as ServerResponse;

      expect(result.isError).toBeFalsy();
      expect(result.content.length).toBeGreaterThan(0);
      // Should provide versatile techniques
      const text = result.content[0]?.text || '';
      expect(text).toContain('recommendations');
    });

    it('should consider preferred outcomes', async () => {
      const riskAwareResult = (await server.discoverTechniques({
        problem: 'How to launch a new product',
        preferredOutcome: 'risk-aware' as const,
      })) as ServerResponse;

      expect(riskAwareResult.isError).toBeFalsy();
      const riskText = riskAwareResult.content[0]?.text || '';
      // Should recommend Six Hats for risk awareness (Black Hat)
      expect(riskText.toLowerCase()).toContain('six_hats');

      const collaborativeResult = (await server.discoverTechniques({
        problem: 'Team brainstorming session needed',
        preferredOutcome: 'collaborative' as const,
      })) as ServerResponse;

      expect(collaborativeResult.isError).toBeFalsy();
      const collabText = collaborativeResult.content[0]?.text || '';
      // Should recommend Yes, And for collaboration
      expect(collabText.toLowerCase()).toContain('yes_and');
    });

    it('should limit recommendations to top 3', async () => {
      const input = {
        problem:
          'Complex problem that could match many techniques: improve user experience, reduce technical debt, innovate product features, optimize performance',
      };

      const result = (await server.discoverTechniques(input)) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      // Count technique occurrences in the recommendations
      const techniqueMatches = text.match(/"technique":\s*"[^"]+"/g) || [];
      expect(techniqueMatches.length).toBeLessThanOrEqual(3);
    });

    it('should handle invalid input', async () => {
      const result = (await server.discoverTechniques({
        // Missing required 'problem' field
        preferredOutcome: 'systematic' as const,
      })) as ServerResponse;

      expect(result.isError).toBeTruthy();
      const errorText = result.content[0]?.text || '';
      expect(errorText).toContain('Problem description is required');
    });
  });

  describe('Planning Layer - plan_thinking_session', () => {
    it('should create workflow for single technique', async () => {
      const input = {
        problem: 'How to improve team dynamics',
        techniques: ['six_hats'] as const,
        objectives: ['Better team communication'],
      };

      const result = (await server.planThinkingSession(input)) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      expect(text).toContain('workflow');
      // Should create 6 steps for Six Hats
      const stepMatches = text.match(/"stepNumber":\s*\d+/g) || [];
      expect(stepMatches.length).toBe(6);
    });

    it('should combine multiple techniques in workflow', async () => {
      const input = {
        problem: 'Redesign product for better user experience',
        techniques: ['design_thinking', 'scamper'] as const,
        objectives: ['Improve UX', 'Reduce complexity'],
      };

      const result = (await server.planThinkingSession(input)) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      // Design Thinking (5 steps) + SCAMPER (7 steps) = 12 total
      const stepMatches = text.match(/"stepNumber":\s*\d+/g) || [];
      expect(stepMatches.length).toBe(12);
    });

    it('should include risk considerations for appropriate steps', async () => {
      const input = {
        problem: 'Technical optimization requiring careful analysis',
        techniques: ['design_thinking'] as const,
        objectives: ['Optimize performance'],
      };

      const result = (await server.planThinkingSession(input)) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      // Should include risk considerations
      expect(text).toContain('riskConsiderations');
    });

    it('should handle thorough timeframe', async () => {
      const input = {
        problem: 'Complex strategic planning',
        techniques: ['six_hats', 'triz'] as const,
        objectives: ['Long-term strategy'],
        timeframe: 'thorough' as const,
      };

      const result = (await server.planThinkingSession(input)) as ServerResponse;

      expect(result.isError).toBeFalsy();
      const text = result.content[0]?.text || '';
      expect(text).toContain('successCriteria');
      expect(text).toContain('Thorough analysis from all angles');
    });

    it('should handle invalid techniques', async () => {
      const result = (await server.planThinkingSession({
        problem: 'Test problem',
        techniques: [], // Empty techniques array
        objectives: ['Test objective'],
      })) as ServerResponse;

      expect(result.isError).toBeTruthy();
      const errorText = result.content[0]?.text || '';
      expect(errorText).toContain('at least one technique');
    });
  });

  describe('Execution Layer - execute_thinking_step', () => {
    it('should execute first step of a technique', async () => {
      const input = {
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
      // First step
      const step1Result = (await server.executeThinkingStep({
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
      const result = (await server.executeThinkingStep({
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
      const result = (await server.executeThinkingStep({
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
  });

  describe('Integration - Full Workflow', () => {
    it('should complete a full discovery-planning-execution workflow', async () => {
      // Step 1: Discovery
      const discoveryResult = (await server.discoverTechniques({
        problem: 'How to reduce software bugs in production',
        preferredOutcome: 'systematic' as const,
      })) as ServerResponse;

      expect(discoveryResult.isError).toBeFalsy();

      // Step 2: Planning
      const planResult = (await server.planThinkingSession({
        problem: 'How to reduce software bugs in production',
        techniques: ['triz'] as const, // Based on discovery
        objectives: ['Identify root causes', 'Find systematic solutions'],
      })) as ServerResponse;

      expect(planResult.isError).toBeFalsy();

      // Step 3: Execution
      const execResult = (await server.executeThinkingStep({
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
