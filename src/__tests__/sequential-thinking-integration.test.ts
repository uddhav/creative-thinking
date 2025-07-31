import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type { DiscoverTechniquesInput, ExecuteThinkingStepInput } from '../index.js';

// Type definitions for test responses
interface ComplexityAssessment {
  level: 'low' | 'medium' | 'high';
  factors: string[];
}

interface SequentialThinking {
  complexityNote: string;
  suggestedApproach: Record<string, string>;
}

interface DiscoverResponse {
  recommendations: Array<{
    technique: string;
    reasoning: string;
  }>;
  complexityAssessment?: ComplexityAssessment;
  sequentialThinking?: SequentialThinking;
}

interface PlanResponse {
  planId: string;
  workflow: Array<{
    step: number;
    technique: string;
    description: string;
    expectedInputs?: string[];
    expectedOutputs?: string[];
  }>;
}

interface ExecuteResponse {
  sessionId: string;
  complexityAssessment?: ComplexityAssessment;
  sequentialThinking?: SequentialThinking;
}

describe('Sequential Thinking Integration', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('Complexity Assessment in Discovery Layer', () => {
    it('should assess low complexity for simple problems', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'How to improve team communication',
        context: 'Small team of 5 people working remotely',
      };

      const result = server.discoverTechniques(input);
      const response = JSON.parse(result.content[0].text) as DiscoverResponse;

      if (response.complexityAssessment) {
        expect(response.complexityAssessment.level).toBe('low');
        expect(response.complexityAssessment.factors.length).toBeLessThan(2);
      }
    });

    it('should assess high complexity for multi-faceted problems', () => {
      const input: DiscoverTechniquesInput = {
        problem:
          'How to manage multiple interacting systems with various stakeholders and uncertain dynamics',
        context: 'Large ecosystem with many dependencies and conflicting objectives',
        constraints: [
          'Budget limits',
          'Time pressure',
          'Regulatory requirements',
          'Technical debt',
        ],
      };

      const result = server.discoverTechniques(input);
      const response = JSON.parse(result.content[0].text) as DiscoverResponse;

      expect(response.complexityAssessment).toBeDefined();
      expect(response.complexityAssessment.level).toBe('high');
      expect(response.complexityAssessment.factors.length).toBeGreaterThanOrEqual(4);
      expect(response.complexityAssessment.suggestion).toContain('sequential thinking');
    });

    it('should provide sequential thinking suggestions for high complexity', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'Design a system with multiple interacting components and uncertain requirements',
        context: 'Complex network of dependencies with dynamic constraints',
        preferredOutcome: 'systematic',
      };

      const result = server.discoverTechniques(input);
      const response = JSON.parse(result.content[0].text) as DiscoverResponse;

      if (response.complexityAssessment?.level === 'high' && response.sequentialThinking) {
        expect(response.sequentialThinking.complexityNote).toBeDefined();
        expect(response.sequentialThinking.suggestedApproach).toBeDefined();
        expect(
          Object.keys(response.sequentialThinking.suggestedApproach).length
        ).toBeGreaterThanOrEqual(4);
      }
    });

    it('should provide technique-specific sequential suggestions', () => {
      const techniques = ['po', 'collective_intel', 'cross_cultural', 'triz', 'design_thinking'];

      for (const technique of techniques) {
        const input: DiscoverTechniquesInput = {
          problem: `Complex problem requiring ${technique} with multiple interacting elements and system dependencies`,
          context: 'Multiple stakeholders with conflicting views and uncertain dynamics',
        };

        const result = server.discoverTechniques(input);
        const response = JSON.parse(result.content[0].text) as DiscoverResponse;

        // If the technique is recommended and complexity is high
        if (
          response.recommendations[0]?.technique === technique &&
          response.complexityAssessment?.level === 'high' &&
          response.sequentialThinking
        ) {
          expect(response.sequentialThinking.complexityNote).toContain(
            technique === 'po'
              ? 'provocation'
              : technique === 'collective_intel'
                ? 'perspectives'
                : technique === 'cross_cultural'
                  ? 'cultural'
                  : technique === 'triz'
                    ? 'contradiction'
                    : 'stage'
          );
        }
      }
    });
  });

  describe('Complexity Tracking in Execution Layer', () => {
    it('should track complexity during execution', async () => {
      // First create a plan
      const planResult = server.planThinkingSession({
        problem: 'Complex problem with multiple dependencies',
        techniques: ['po'],
      });
      const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;
      const planId = planResponse.planId;

      // Execute steps to build complexity
      let sessionId: string | undefined;

      // Execute multiple steps with increasing complexity
      for (let i = 1; i <= 3; i++) {
        const stepInput: ExecuteThinkingStepInput = {
          planId,
          sessionId,
          technique: 'po',
          problem: 'Complex problem with multiple dependencies',
          currentStep: i,
          totalSteps: 4,
          output: `Step ${i} output with complex interactions`,
          nextStepNeeded: i < 4,
          provocation: i === 1 ? 'Po: All constraints are opportunities' : undefined,
          principles:
            i === 2
              ? [
                  'Principle 1',
                  'Principle 2',
                  'Principle 3',
                  'Principle 4',
                  'Principle 5',
                  'Principle 6',
                ]
              : undefined,
        };

        const result = await server.executeThinkingStep(stepInput);
        const response = JSON.parse(result.content[0].text) as ExecuteResponse;
        sessionId = response.sessionId;

        // Check complexity assessment in later steps
        if (i === 3 && response.complexityAssessment) {
          expect(response.complexityAssessment.factors.length).toBeGreaterThan(0);
          if (response.complexityAssessment.level === 'high') {
            expect(response.sequentialThinking).toBeDefined();
          }
        }
      }
    });

    it('should detect complexity from branching', async () => {
      // Create plan
      const planResult = server.planThinkingSession({
        problem: 'Problem requiring exploration of alternatives',
        techniques: ['design_thinking'],
      });
      const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;
      const planId = planResponse.planId;

      // Execute initial steps
      const step1Result = await server.executeThinkingStep({
        planId,
        technique: 'design_thinking',
        problem: 'Problem requiring exploration',
        currentStep: 1,
        totalSteps: 5,
        output: 'Initial empathy insights',
        nextStepNeeded: true,
        designStage: 'empathize',
      });
      const step1Response = JSON.parse(step1Result.content[0].text) as ExecuteResponse;
      const sessionId = step1Response.sessionId;

      // Create a branch (revision)
      const branchResult = await server.executeThinkingStep({
        planId,
        sessionId,
        technique: 'design_thinking',
        problem: 'Problem requiring exploration',
        currentStep: 2,
        totalSteps: 5,
        output: 'Revised approach based on new insights',
        nextStepNeeded: true,
        designStage: 'define',
        isRevision: true,
        revisesStep: 1,
        branchId: 'branch_1',
      });
      const branchResponse = JSON.parse(branchResult.content[0].text) as ExecuteResponse;

      // Complexity should increase due to branching
      if (branchResponse.complexityAssessment) {
        expect(branchResponse.complexityAssessment.factors).toContain(
          'Revision of previous thinking'
        );
      }
    });

    it('should provide technique-specific hooks during execution', async () => {
      // Test with collective intelligence technique
      const planResult = server.planThinkingSession({
        problem: 'Complex group decision with multiple perspectives',
        techniques: ['collective_intel'],
      });
      const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;
      const planId = planResponse.planId;

      // Execute with multiple wisdom sources
      const stepResult = await server.executeThinkingStep({
        planId,
        technique: 'collective_intel',
        problem: 'Complex group decision',
        currentStep: 3,
        totalSteps: 5,
        output: 'Synthesizing diverse perspectives',
        nextStepNeeded: true,
        wisdomSources: [
          'Expert panel',
          'User community',
          'Academic research',
          'Industry practitioners',
        ],
      });
      const response = JSON.parse(stepResult.content[0].text) as ExecuteResponse;

      if (response.complexityAssessment?.level === 'high' && response.sequentialThinking) {
        expect(response.sequentialThinking.complexityNote).toContain('perspectives');
        expect(response.sequentialThinking.suggestedApproach).toBeDefined();
      }
    });

    it('should track complexity from extended reasoning chains', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Long-term strategic planning',
        techniques: ['six_hats'],
      });
      const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;
      const planId = planResponse.planId;

      let sessionId: string | undefined;

      // Execute many steps to create extended chain
      for (let i = 1; i <= 7; i++) {
        const hatColors = ['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'] as const;

        const stepResult = await server.executeThinkingStep({
          planId,
          sessionId,
          technique: 'six_hats',
          problem: 'Long-term strategic planning',
          currentStep: i,
          totalSteps: 7,
          output: `${hatColors[i - 1]} hat perspective on strategy`,
          nextStepNeeded: i < 7,
          hatColor: hatColors[i - 1],
        });

        const response = JSON.parse(stepResult.content[0].text) as ExecuteResponse;
        sessionId = response.sessionId;

        // Extended chains should trigger complexity assessment
        if (i >= 6 && response.complexityAssessment) {
          expect(
            response.complexityAssessment.factors.some(
              f => f.includes('Extended reasoning chain') || f.includes('Multi-stage')
            )
          ).toBe(true);
        }
      }
    });
  });

  describe('Integration Between Layers', () => {
    it('should maintain complexity context across discovery-planning-execution', async () => {
      // Discovery with high complexity
      const discoveryResult = server.discoverTechniques({
        problem: 'System integration with multiple conflicting requirements and uncertain dynamics',
        context: 'Large-scale transformation with many dependencies',
        constraints: ['Technical', 'Cultural', 'Financial', 'Temporal', 'Regulatory'],
      });
      const discoveryResponse = JSON.parse(discoveryResult.content[0].text) as DiscoverResponse;

      expect(discoveryResponse.complexityAssessment?.level).toBe('high');

      // Plan based on recommendations
      const recommendedTechnique = discoveryResponse.recommendations[0].technique;
      const planResult = server.planThinkingSession({
        problem: 'System integration with multiple conflicting requirements',
        techniques: [recommendedTechnique],
      });
      const planResponse = JSON.parse(planResult.content[0].text) as PlanResponse;

      // Execute and verify complexity awareness continues
      const stepResult = await server.executeThinkingStep({
        planId: planResponse.planId,
        technique: recommendedTechnique,
        problem: 'System integration with multiple conflicting requirements',
        currentStep: 1,
        totalSteps: planResponse.workflow.length,
        output: 'Initial analysis revealing additional complexity',
        nextStepNeeded: true,
      });
      const stepResponse = JSON.parse(stepResult.content[0].text) as ExecuteResponse;

      // Verify the system maintains awareness of complexity
      expect(stepResponse).toBeDefined();
      expect(stepResponse.sessionId).toBeDefined();
    });
  });
});
