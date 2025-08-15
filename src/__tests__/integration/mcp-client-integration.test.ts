/**
 * MCP Client Integration Test
 * Tests the MCP server using the official MCP Client from @modelcontextprotocol/sdk
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

describe('MCP Client Integration', () => {
  let client: MCPClientTestHelper;

  beforeEach(() => {
    client = new MCPClientTestHelper();
  });

  afterEach(async () => {
    await client.disconnect();
  });

  describe('Server Connection and Initialization', () => {
    it('should connect to the server successfully', async () => {
      await client.connect();

      const capabilities = client.getServerCapabilities();
      expect(capabilities).toBeDefined();
      expect(capabilities?.tools).toBeDefined();

      const version = client.getServerVersion();
      expect(version).toBeDefined();
      expect(version?.name).toBe('creative-thinking');
    });

    it('should list three tools', async () => {
      await client.connect();

      const result = await client.listTools();
      expect(result.tools).toHaveLength(3);

      const toolNames = result.tools.map(t => t.name);
      expect(toolNames).toContain('discover_techniques');
      expect(toolNames).toContain('plan_thinking_session');
      expect(toolNames).toContain('execute_thinking_step');
    });
  });

  describe('Three-Step Workflow', () => {
    it('should complete the full workflow: discover -> plan -> execute', async () => {
      await client.connect();

      // Step 1: Discover techniques
      const discoveryResult = await client.discoverTechniques('How to improve team communication');

      expect(discoveryResult).toHaveProperty('recommendations');
      expect(discoveryResult).toHaveProperty('availableTechniques');
      expect(Array.isArray(discoveryResult.recommendations)).toBe(true);

      // Step 2: Plan thinking session
      const planResult = await client.planThinkingSession('How to improve team communication', [
        'six_hats',
      ]);

      expect(planResult).toHaveProperty('planId');
      expect(planResult).toHaveProperty('workflow');
      expect(planResult.planId).toMatch(/^plan_/);
      expect(Array.isArray(planResult.workflow)).toBe(true);

      // Step 3: Execute thinking step
      const executeResult = await client.executeThinkingStep({
        planId: planResult.planId,
        technique: 'six_hats',
        problem: 'How to improve team communication',
        currentStep: 1,
        totalSteps: 6,
        output: 'Blue hat: Setting up the thinking process',
        nextStepNeeded: true,
        hatColor: 'blue',
      });

      expect(executeResult).toHaveProperty('sessionId');
      expect(executeResult).toHaveProperty('technique');
      expect(executeResult).toHaveProperty('currentStep');
      expect(executeResult).toHaveProperty('nextStepNeeded');

      // Verify response is NOT in tool_result format
      expect(executeResult).not.toHaveProperty('type');
      expect(executeResult).not.toHaveProperty('tool_use_id');
      expect(executeResult.technique).toBe('six_hats');
      expect(executeResult.currentStep).toBe(1);
    });
  });

  describe('Tool Parameter Validation', () => {
    it('should handle missing required parameters', async () => {
      await client.connect();

      // Test discover_techniques without problem
      try {
        await client.callTool('discover_techniques', {});
        throw new Error('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('ERROR');
      }

      // Test plan_thinking_session without required params
      try {
        await client.callTool('plan_thinking_session', {
          problem: 'Test problem',
          // missing techniques
        });
        throw new Error('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('techniques');
      }

      // Test execute_thinking_step without planId
      try {
        await client.callTool('execute_thinking_step', {
          technique: 'six_hats',
          problem: 'Test problem',
          currentStep: 1,
          totalSteps: 6,
          output: 'Test output',
          nextStepNeeded: true,
        });
        throw new Error('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('MANDATORY');
      }
    });

    it('should handle invalid technique names', async () => {
      await client.connect();

      // First discover techniques (required workflow)
      await client.discoverTechniques('Test problem');

      try {
        await client.planThinkingSession('Test problem', ['invalid_technique']);
        throw new Error('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Invalid technique');
      }
    });
  });

  describe('Multiple Techniques', () => {
    it('should handle planning with multiple techniques', async () => {
      await client.connect();

      const planResult = await client.planThinkingSession(
        'Complex problem requiring multiple perspectives',
        ['six_hats', 'scamper', 'triz']
      );

      expect(planResult.workflow.length).toBeGreaterThan(7); // More than just six_hats steps

      // Check that workflow contains steps from all techniques
      const techniques = (planResult.workflow as Array<{ technique: string }>).map(
        step => step.technique
      );
      expect(techniques).toContain('six_hats');
      expect(techniques).toContain('scamper');
      expect(techniques).toContain('triz');
    });
  });

  describe('Response Format Validation', () => {
    it('should return proper MCP format responses', async () => {
      await client.connect();

      // Call a tool and get the raw result
      const result = await client.callTool('discover_techniques', {
        problem: 'Test problem',
      });

      // Verify MCP response structure
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);

      const content = result.content[0];
      expect(content).toHaveProperty('type');
      expect(content.type).toBe('text');
      expect(content).toHaveProperty('text');
      expect(typeof content.text).toBe('string');

      // Verify the text is valid JSON
      const parsed = JSON.parse(content.text);
      expect(parsed).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      await client.connect();

      // Try to execute without a valid plan
      try {
        await client.executeThinkingStep({
          planId: 'invalid_plan_id',
          technique: 'six_hats',
          problem: 'Test problem',
          currentStep: 1,
          totalSteps: 6,
          output: 'Test output',
          nextStepNeeded: true,
          hatColor: 'blue',
        });
        throw new Error('Should have thrown');
      } catch (error: any) {
        // Should get an error about invalid plan
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('All 16 Techniques', () => {
    const techniques = [
      'six_hats',
      'po',
      'random_entry',
      'scamper',
      'concept_extraction',
      'yes_and',
      'design_thinking',
      'triz',
      'neural_state',
      'temporal_work',
      'cultural_integration',
      'collective_intel',
      'disney_method',
      'nine_windows',
      'quantum_superposition',
      'temporal_creativity',
    ];

    it.each(techniques)('should support %s technique', async technique => {
      await client.connect();

      // Create a plan with this technique
      const planResult = await client.planThinkingSession(`Testing ${technique} technique`, [
        technique,
      ]);

      expect(planResult.planId).toBeDefined();
      expect(planResult.workflow.length).toBeGreaterThan(0);

      // Verify workflow contains steps for this technique
      const workflowTechniques = planResult.workflow.map(
        (step: { technique: string }) => step.technique
      );
      expect(workflowTechniques).toContain(technique);
    });
  });
});
