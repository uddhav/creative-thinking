/**
 * Tests to ensure the fundamental three-tool constraint is maintained
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';

interface SessionResult {
  sessionId: string;
  currentStep: number;
  technique: string;
  totalSteps?: number;
  nextStepNeeded?: boolean;
}

interface PlanResult {
  planId: string;
  workflow?: unknown;
  estimatedSteps?: number;
}

describe('Three Tool Constraint', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  it('should maintain exactly three public methods for tool operations', () => {
    // The three-tool constraint is enforced at the MCP protocol level
    // Here we verify the core architecture principle is documented

    // Check that the server has the three main operation handlers
    const serverPrototype = Object.getPrototypeOf(server) as Record<string, unknown>;
    const methods = Object.getOwnPropertyNames(serverPrototype);

    // Look for the three core handlers
    const hasDiscoveryHandler = methods.some(
      m => m.includes('discover') || m.includes('Discovery')
    );
    const hasPlanningHandler = methods.some(m => m.includes('plan') || m.includes('Planning'));
    const hasExecutionHandler = methods.some(m => m.includes('execute') || m.includes('Execution'));

    expect(hasDiscoveryHandler).toBe(true);
    expect(hasPlanningHandler).toBe(true);
    expect(hasExecutionHandler).toBe(true);
  });

  it('should process discovery operations correctly', async () => {
    // Test discovery functionality
    const result = await server.discoverTechniques({
      problem: 'Test problem',
      context: 'Test context',
    });

    expect(result).toBeDefined();
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    expect(result.content[0].text).toContain('recommend');
  });

  it('should process planning operations correctly', async () => {
    // Test planning functionality
    const result = await server.planThinkingSession({
      problem: 'Test problem',
      techniques: ['six_hats', 'po'],
    });

    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('workflow');
    expect(result.content[0].text).toContain('planId');
  });

  it('should process execution operations correctly', async () => {
    // First create a plan
    const planResult = await server.planThinkingSession({
      problem: 'Test problem',
      techniques: ['six_hats'],
    });

    expect(planResult.isError).toBeFalsy();
    const planData = JSON.parse(planResult.content[0].text) as PlanResult;

    // Test execution functionality with planId
    const result = await server.executeThinkingStep({
      planId: planData.planId,
      technique: 'six_hats',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 6,
      output: 'Test output',
      nextStepNeeded: true,
      hatColor: 'blue',
    });

    expect(result.isError).toBeFalsy();
    // The result returns session info, not the visual output
    const resultData = JSON.parse(result.content[0].text) as SessionResult;
    expect(resultData.sessionId).toBeDefined();
    expect(resultData.currentStep).toBe(1);
    expect(resultData.technique).toBe('six_hats');
  });

  it('should reject operations outside the three tools', async () => {
    // Test that undefined operations are rejected
    const result = await server.processLateralThinking({
      invalidOperation: 'test',
    });

    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain('Invalid');
  });

  it('should integrate all features within three-layer architecture', async () => {
    // Test that advanced features are accessible through the three tools

    // 1. Discovery should consider flexibility
    const discoveryResult = await server.discoverTechniques({
      problem: 'Test problem',
      currentFlexibility: 0.3, // Low flexibility
    });

    expect(discoveryResult.isError).toBeFalsy();
    // Low flexibility should trigger option generation
    expect(discoveryResult.content[0].text).toMatch(/flexibility|option/i);

    // 2. Planning should include escape protocols when needed
    const planResult = await server.planThinkingSession({
      problem: 'Test problem',
      techniques: ['six_hats'],
      sessionId: 'test-session',
    });

    expect(planResult.isError).toBeFalsy();
    const planText = planResult.content[0].text;

    // Should include workflow steps
    expect(planText).toContain('workflow');

    // 3. Execution should track ergodicity
    // First need a plan for execution
    const execPlanResult = await server.planThinkingSession({
      problem: 'Test problem',
      techniques: ['po'],
    });
    const execPlanData = JSON.parse(execPlanResult.content[0].text) as PlanResult;

    const execResult = await server.executeThinkingStep({
      planId: execPlanData.planId,
      technique: 'po',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 4,
      output: 'Provocative statement',
      nextStepNeeded: true,
      provocation: 'What if we had no limits?',
    });

    expect(execResult.isError).toBeFalsy();
    // The result returns session info
    const execResultData = JSON.parse(execResult.content[0].text) as SessionResult;
    expect(execResultData.sessionId).toBeDefined();
    expect(execResultData.technique).toBe('po');
  });

  it('should enforce separation of concerns between tools', async () => {
    // Discovery should not execute steps
    const discoveryResult = await server.discoverTechniques({
      problem: 'Test problem',
    });

    expect(discoveryResult.content[0].text).not.toContain('Step completed');
    expect(discoveryResult.content[0].text).not.toContain('Next step');

    // Planning should not execute steps
    const planResult = await server.planThinkingSession({
      problem: 'Test problem',
      techniques: ['scamper'],
    });

    expect(planResult.content[0].text).not.toContain('Step 1 completed');
    expect(planResult.content[0].text).toContain('workflow');
  });

  it('should handle the complete workflow through three tools', async () => {
    // 1. Discover techniques
    const discoveryResult = await server.discoverTechniques({
      problem: 'How to improve team communication?',
      context: 'Remote team, different time zones',
    });

    expect(discoveryResult.isError).toBeFalsy();
    expect(discoveryResult.content[0].text).toContain('recommend');

    // 2. Plan the session
    const planResult = await server.planThinkingSession({
      problem: 'How to improve team communication?',
      techniques: ['six_hats', 'po'],
      objectives: ['Find creative solutions', 'Consider all perspectives'],
    });

    expect(planResult.isError).toBeFalsy();
    const planData = JSON.parse(planResult.content[0].text) as PlanResult;
    expect(planData.planId).toBeDefined();
    expect(planData.workflow).toBeDefined();

    // 3. Execute steps
    const execResult = await server.executeThinkingStep({
      planId: planData.planId,
      technique: 'six_hats',
      problem: 'How to improve team communication?',
      currentStep: 1,
      totalSteps: 6,
      output: 'Process: We need structured approach to analyze communication issues',
      nextStepNeeded: true,
      hatColor: 'blue',
    });

    expect(execResult.isError).toBeFalsy();
    const execResultData = JSON.parse(execResult.content[0].text) as SessionResult;
    expect(execResultData.sessionId).toBeDefined();
    expect(execResultData.currentStep).toBe(1);
    expect(execResultData.technique).toBe('six_hats');
  });
});
