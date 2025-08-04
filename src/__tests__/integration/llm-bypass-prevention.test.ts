/**
 * Integration tests for preventing LLM workflow bypass
 * Tests the various protections against LLMs skipping the required workflow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import type { ExecuteThinkingStepInput } from '../../types/index.js';
import { workflowGuard } from '../../core/WorkflowGuard.js';

describe('LLM Bypass Prevention', () => {
  let lateralServer: LateralThinkingServer;

  beforeEach(() => {
    // Initialize a fresh server instance
    lateralServer = new LateralThinkingServer();
    // Clear workflow guard history
    workflowGuard['recentCalls'] = [];
  });

  describe('WorkflowGuard Enforcement', () => {
    it('should prevent direct execution without discovery', async () => {
      // Simulate an LLM trying to skip directly to execute_thinking_step
      const args: ExecuteThinkingStepInput = {
        planId: 'fake-plan-123', // Fabricated planId
        technique: 'six_hats',
        problem: 'How to improve team morale',
        currentStep: 1,
        totalSteps: 6,
        output: 'Let me think about this...',
        nextStepNeeded: true,
      };

      // Record the tool call to simulate MCP request
      workflowGuard.recordCall('execute_thinking_step', args);

      // Check for violations
      const violation = workflowGuard.checkWorkflowViolation('execute_thinking_step', args);

      expect(violation).toBeDefined();
      expect(violation?.type).toBe('skipped_discovery');

      const violationResponse = workflowGuard.getViolationResponse(violation);
      expect(violationResponse.error).toBe('Workflow Violation');
      expect(violationResponse.message).toContain('must start with discover_techniques');
      expect(violationResponse.guidance).toBeDefined();
      expect(violationResponse.example).toBeDefined();

      // Also test the actual execution path
      const result = await lateralServer.executeThinkingStep(args);
      const responseText = result.content[0].text;
      const response = JSON.parse(responseText);

      expect(response.error).toBeDefined();
      expect(response.error.code).toBe('E202');
      expect(response.error.message).toContain('fake-plan-123');
      expect(response.error.message).toContain('not found');
      expect(response.error.recovery).toContain('Create a new plan with plan_thinking_session');
    });

    it('should prevent using invalid techniques', async () => {
      // First, properly go through discovery and planning
      workflowGuard.recordCall('discover_techniques', { problem: 'How to reduce stress' });

      // Call discover to set up workflow state
      lateralServer.discoverTechniques({
        problem: 'How to reduce stress',
      });

      const planResult = lateralServer.planThinkingSession({
        problem: 'How to reduce stress',
        techniques: ['six_hats'],
      });

      workflowGuard.recordCall('plan_thinking_session', {
        problem: 'How to reduce stress',
        techniques: ['six_hats'],
      });

      const planResponse = JSON.parse(planResult.content[0].text);
      const planId = planResponse.planId;

      // Now try to use an invalid technique (not in the plan)
      const executeArgs: ExecuteThinkingStepInput = {
        planId: planId,
        technique: 'random_entry', // Not in the plan - plan only has six_hats
        problem: 'How to reduce stress',
        currentStep: 1,
        totalSteps: 3,
        output: 'Random thinking...',
        nextStepNeeded: true,
      };

      const execResult = await lateralServer.executeThinkingStep(executeArgs);
      const execResponse = JSON.parse(execResult.content[0].text);

      expect(execResponse.error).toBeDefined();
      expect(execResponse.error.code).toBe('E003');
      expect(execResponse.error.message).toContain('Technique mismatch');
      expect(execResponse.error.message).toContain('random_entry');
      expect(execResponse.error.context.planTechnique).toBe('six_hats');
      expect(execResponse.error.recovery).toContain(
        "Use technique 'six_hats' as specified in the plan"
      );
    });

    it('should provide helpful guidance when skipping planning', () => {
      // Only do discovery, skip planning
      workflowGuard.recordCall('discover_techniques', { problem: 'How to innovate' });

      lateralServer.discoverTechniques({
        problem: 'How to innovate in product design',
      });

      // Try to skip to execution
      const executeArgs: ExecuteThinkingStepInput = {
        planId: 'made-up-plan',
        technique: 'scamper',
        problem: 'How to innovate in product design',
        currentStep: 1,
        totalSteps: 8,
        output: 'Starting SCAMPER...',
        nextStepNeeded: true,
      };

      // Check workflow guard
      workflowGuard.recordCall('execute_thinking_step', executeArgs);
      const violation = workflowGuard.checkWorkflowViolation('execute_thinking_step', executeArgs);

      expect(violation).toBeDefined();
      expect(violation?.type).toBe('skipped_planning');

      const violationResponse = workflowGuard.getViolationResponse(violation);
      expect(violationResponse.error).toBe('Workflow Violation');
      expect(violationResponse.message).toContain('must create a plan');
      expect(violationResponse.guidance[0]).toContain('already called discover_techniques');
    });
  });

  describe('Tool Description Clarity', () => {
    it('should have clear workflow indicators in tool descriptions', () => {
      // Tool descriptions are defined in index.ts
      const toolDescriptions = {
        discover_techniques:
          'STEP 1 of 3: Analyzes a problem and recommends appropriate lateral thinking techniques. This is the FIRST tool you must call when starting any creative thinking session. Returns recommendations and available techniques that can be used in the next step.',
        plan_thinking_session:
          'STEP 2 of 3: Creates a structured workflow for applying lateral thinking techniques. This tool MUST be called AFTER discover_techniques and BEFORE execute_thinking_step. Returns a planId that is REQUIRED for the execution step. Valid techniques: six_hats, po, random_entry, scamper, concept_extraction, yes_and, design_thinking, triz, neural_state, temporal_work, cross_cultural, collective_intel, disney_method, nine_windows',
        execute_thinking_step:
          'STEP 3 of 3: Executes a single step in the lateral thinking process. WARNING: This tool REQUIRES a valid planId from plan_thinking_session. DO NOT call this tool directly - you MUST first call discover_techniques, then plan_thinking_session to get a planId. Attempting to use this tool without following the proper workflow (discover → plan → execute) will result in an error.',
      };

      // Verify tool descriptions emphasize the workflow
      expect(toolDescriptions.discover_techniques).toContain('STEP 1 of 3');
      expect(toolDescriptions.discover_techniques).toContain('FIRST tool you must call');

      expect(toolDescriptions.plan_thinking_session).toContain('STEP 2 of 3');
      expect(toolDescriptions.plan_thinking_session).toContain(
        'MUST be called AFTER discover_techniques'
      );
      expect(toolDescriptions.plan_thinking_session).toContain('Returns a planId that is REQUIRED');

      expect(toolDescriptions.execute_thinking_step).toContain('STEP 3 of 3');
      expect(toolDescriptions.execute_thinking_step).toContain('WARNING');
      expect(toolDescriptions.execute_thinking_step).toContain('REQUIRES a valid planId');
      expect(toolDescriptions.execute_thinking_step).toContain('DO NOT call this tool directly');
    });
  });

  describe('Validation Error Messages', () => {
    it('should provide clear error when planId is missing entirely', async () => {
      const args = {
        // No planId provided
        technique: 'six_hats',
        problem: 'How to improve communication',
        currentStep: 1,
        totalSteps: 6,
        output: 'Blue hat thinking...',
        nextStepNeeded: true,
      } as ExecuteThinkingStepInput;

      const result = await lateralServer.executeThinkingStep(args);
      const responseText = result.content[0].text;
      const response = JSON.parse(responseText);

      expect(response.error).toContain('❌ MISSING REQUIRED FIELD');
      expect(response.error).toContain('planId is required');
      expect(response.workflow).toBe(
        'discover_techniques → plan_thinking_session → execute_thinking_step'
      );
    });

    it('should provide helpful error for completely invalid techniques', async () => {
      // Create a valid plan first
      workflowGuard.recordCall('discover_techniques', { problem: 'Test problem' });
      workflowGuard.recordCall('plan_thinking_session', {
        problem: 'Test problem',
        techniques: ['six_hats'],
      });

      const planResult = lateralServer.planThinkingSession({
        problem: 'Test problem',
        techniques: ['six_hats'],
      });
      const planResponse = JSON.parse(planResult.content[0].text);
      const planId = planResponse.planId;

      // Try to use a completely invalid technique with workflow guard check
      const executeArgs: ExecuteThinkingStepInput = {
        planId: planId,
        technique: 'magical_thinking' as any, // Invalid technique
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 5,
        output: 'Magic...',
        nextStepNeeded: true,
      };

      // Check workflow guard first
      const violation = workflowGuard.checkWorkflowViolation('execute_thinking_step', executeArgs);
      if (violation) {
        const violationResponse = workflowGuard.getViolationResponse(violation);
        expect(violationResponse.error).toBe('Workflow Violation');
        expect(violationResponse.message).toContain('Invalid technique');
        expect(violationResponse.validTechniques).toBeDefined();
        expect(violationResponse.validTechniques).toContain('six_hats');
      }

      // Also test server validation
      const result = await lateralServer.executeThinkingStep(executeArgs);
      const responseText = result.content[0].text;
      const response = JSON.parse(responseText);

      // Could be either validation error or technique mismatch
      expect(response.error).toBeDefined();
      const errorString =
        typeof response.error === 'string' ? response.error : JSON.stringify(response.error);

      if (errorString.includes('❌ INVALID TECHNIQUE')) {
        expect(errorString).toContain('magical_thinking');
        expect(errorString).toContain('Valid techniques are:');
      } else if (errorString.includes('❌ TECHNIQUE MISMATCH')) {
        expect(response.requestedTechnique).toBe('magical_thinking');
        expect(response.yourPlan.techniques).toContain('six_hats');
      }
    });
  });
});
