/**
 * MCP Client Parallel Tool Calls Test
 * Tests parallel execution of tools and validates response format
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

describe('MCP Client Parallel Tool Calls', () => {
  let client: MCPClientTestHelper;

  beforeEach(() => {
    client = new MCPClientTestHelper();
  });

  afterEach(async () => {
    await client.disconnect();
  });

  describe('Parallel Execution', () => {
    it('should execute techniques from a multi-technique plan', async () => {
      await client.connect();

      // First discover techniques
      await client.discoverTechniques('Complex problem requiring multiple perspectives');

      // Then create a plan with multiple techniques
      const planResult = await client.planThinkingSession(
        'Complex problem requiring multiple perspectives',
        ['six_hats', 'scamper', 'triz']
      );

      expect(planResult.planId).toBeDefined();

      // Instead of parallel execution (which MCP doesn't support directly),
      // we'll test sequential execution of the first step of the first technique
      const executeParams = {
        planId: planResult.planId,
        technique: 'six_hats',
        problem: 'Complex problem requiring multiple perspectives',
        currentStep: 1,
        totalSteps: planResult.workflow.filter((s: any) => s.technique === 'six_hats').length,
        output: 'Blue hat: Setting up the process',
        nextStepNeeded: true,
        hatColor: 'blue',
      };

      const result = await client.executeThinkingStep(executeParams);

      // Verify the response
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('technique');
      expect(result.technique).toBe('six_hats');
      expect(result.currentStep).toBe(1);

      // Verify it's NOT in tool_result format
      expect(result).not.toHaveProperty('type');
      expect(result).not.toHaveProperty('tool_use_id');
    });

    it('should maintain order of responses', async () => {
      await client.connect();

      // First discover techniques
      await client.discoverTechniques('Test problem');

      // Create a plan
      const planResult = await client.planThinkingSession('Test problem', ['random_entry']);

      // Create multiple calls with identifiable outputs
      const calls = [
        {
          name: 'execute_thinking_step',
          arguments: {
            planId: planResult.planId,
            technique: 'random_entry',
            problem: 'Test problem',
            currentStep: 1,
            totalSteps: 3,
            output: 'FIRST: Random stimulus bicycle',
            nextStepNeeded: true,
            randomStimulus: 'bicycle',
          },
        },
        {
          name: 'execute_thinking_step',
          arguments: {
            planId: planResult.planId,
            technique: 'random_entry',
            problem: 'Test problem',
            currentStep: 2,
            totalSteps: 3,
            output: 'SECOND: Making connections',
            nextStepNeeded: true,
            connections: ['wheels', 'movement'],
          },
        },
        {
          name: 'execute_thinking_step',
          arguments: {
            planId: planResult.planId,
            technique: 'random_entry',
            problem: 'Test problem',
            currentStep: 3,
            totalSteps: 3,
            output: 'THIRD: Validating ideas',
            nextStepNeeded: false,
            evaluations: ['feasible', 'innovative'],
          },
        },
      ];

      // Execute in parallel
      const results = await client.callToolsInParallel(calls);

      expect(results).toHaveLength(3);

      // Verify order is maintained
      const parsedResults = results.map(
        r =>
          JSON.parse(MCPClientTestHelper.extractTextContent(r)) as {
            currentStep: number;
            nextStepNeeded: boolean;
          }
      );

      expect(parsedResults[0].currentStep).toBe(1);
      expect(parsedResults[1].currentStep).toBe(2);
      expect(parsedResults[2].currentStep).toBe(3);
      expect(parsedResults[2].nextStepNeeded).toBe(false);
    });

    it('should handle errors in parallel execution', async () => {
      await client.connect();

      // Can't mix execute_thinking_step with discover_techniques in parallel
      // This should return a workflow violation error
      const calls = [
        {
          name: 'execute_thinking_step',
          arguments: {
            planId: 'invalid_plan_id', // This should fail
            technique: 'six_hats',
            problem: 'Test problem',
            currentStep: 1,
            totalSteps: 6,
            output: 'This will fail',
            nextStepNeeded: true,
          },
        },
        {
          name: 'discover_techniques', // Can't run in parallel with execute
          arguments: {
            problem: 'Valid problem',
          },
        },
      ];

      // Execute in parallel - workflow violation returns as error in response
      const results = await client.callToolsInParallel(calls);

      // At least one should be an error response
      const errorResults = results.filter(r => {
        const text = MCPClientTestHelper.extractTextContent(r);
        return text.includes('ERROR') || text.includes('error');
      });

      expect(errorResults.length).toBeGreaterThan(0);

      // Check that the error is about workflow or invalid plan
      const errorText = MCPClientTestHelper.extractTextContent(errorResults[0]);
      const hasWorkflowError =
        errorText.includes('workflow') ||
        errorText.includes('E207') ||
        errorText.includes('invalid');
      expect(hasWorkflowError).toBe(true);
    });
  });

  describe('Response Format Compliance', () => {
    it('should never return tool_result format', async () => {
      await client.connect();

      // First discover techniques
      await client.discoverTechniques('Test problem');

      // Create a plan with multiple techniques
      const planResult = await client.planThinkingSession('Test problem', [
        'disney_method',
        'nine_windows',
      ]);

      // Execute steps for both techniques
      const calls = [
        {
          name: 'execute_thinking_step',
          arguments: {
            planId: planResult.planId,
            technique: 'disney_method',
            problem: 'Test problem',
            currentStep: 1,
            totalSteps: 3,
            output: 'Dreamer vision',
            nextStepNeeded: true,
            disneyRole: 'dreamer',
            dreamerVision: ['Big ideas'],
          },
        },
        {
          name: 'execute_thinking_step',
          arguments: {
            planId: planResult.planId,
            technique: 'nine_windows',
            problem: 'Test problem',
            currentStep: 4, // After disney_method
            totalSteps: 9,
            output: 'Present system view',
            nextStepNeeded: true,
            currentCell: { timeFrame: 'present', systemLevel: 'system' },
          },
        },
      ];

      const results = await client.callToolsInParallel(calls);

      results.forEach(result => {
        const content = result.content[0];
        expect(content.type).toBe('text');

        const text = content.text;

        // Check that the text doesn't contain tool_result structure
        expect(text).not.toContain('"type":"tool_result"');
        expect(text).not.toContain('"tool_use_id"');
        expect(text).not.toContain('toolu_');

        // Verify it contains the expected MCP response structure
        expect(text).toContain('"sessionId"');
        expect(text).toContain('"technique"');
        expect(text).toContain('"currentStep"');
      });
    });

    it('should handle discover and plan tools correctly', async () => {
      await client.connect();

      // These tools cannot be run in parallel with others, but we can test them
      const discoverResult = await client.discoverTechniques('Innovation problem');
      expect(discoverResult).toHaveProperty('recommendations');
      expect(discoverResult).toHaveProperty('availableTechniques');

      const planResult = await client.planThinkingSession('Innovation problem', [
        'concept_extraction',
        'yes_and',
      ]);
      expect(planResult).toHaveProperty('planId');
      expect(planResult).toHaveProperty('workflow');

      // Verify these also don't return tool_result format
      expect(discoverResult).not.toHaveProperty('type');
      expect(discoverResult).not.toHaveProperty('tool_use_id');
      expect(planResult).not.toHaveProperty('type');
      expect(planResult).not.toHaveProperty('tool_use_id');
    });
  });
});
