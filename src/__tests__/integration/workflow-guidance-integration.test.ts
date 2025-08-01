/**
 * Integration test for workflow guidance feature
 * Demonstrates the complete flow from discovery → planning → execution
 */

import { describe, it, expect } from 'vitest';
import { LateralThinkingServer } from '../../index.js';

describe('Workflow Guidance Integration', () => {
  it('should guide user through complete workflow from discovery to execution', async () => {
    const server = new LateralThinkingServer();

    // Step 1: Discovery
    console.error('\n=== Step 1: Discovery ===');
    const discoveryResult = server.discoverTechniques({
      problem: 'How to improve team collaboration and innovation',
    });

    expect(discoveryResult.isError).toBeFalsy();
    const discoveryResponse = JSON.parse(discoveryResult.content[0].text);

    console.error(
      'Recommendations:',
      discoveryResponse.recommendations.map((r: { technique: string }) => r.technique)
    );
    console.error('Next step guidance:', discoveryResponse.nextStepGuidance?.message);

    // Verify discovery provides workflow guidance
    expect(discoveryResponse.nextStepGuidance).toBeDefined();
    expect(discoveryResponse.nextStepGuidance.nextTool).toBe('plan_thinking_session');
    expect(discoveryResponse.nextStepGuidance.suggestedParameters).toBeDefined();

    // Step 2: Planning (following the guidance)
    console.error('\n=== Step 2: Planning (following guidance) ===');
    const planningParams = discoveryResponse.nextStepGuidance.suggestedParameters;
    const planningResult = server.planThinkingSession({
      problem: planningParams.problem,
      techniques: planningParams.techniques.slice(0, 1), // Use first recommended technique
      objectives: planningParams.objectives,
      timeframe: planningParams.timeframe,
    });

    expect(planningResult.isError).toBeFalsy();
    const planningResponse = JSON.parse(planningResult.content[0].text);

    console.error('Plan ID:', planningResponse.planId);
    console.error('Next steps provided:', !!planningResponse.nextSteps);
    console.error('First call parameters:', planningResponse.nextSteps?.firstCall?.parameters);

    // Verify planning provides execution guidance
    expect(planningResponse.nextSteps).toBeDefined();
    expect(planningResponse.nextSteps.instructions).toContain('execute_thinking_step');
    expect(planningResponse.nextSteps.firstCall).toBeDefined();

    // Step 3: Execution (following the planning guidance)
    console.error('\n=== Step 3: Execution (following planning guidance) ===');
    const executionParams = planningResponse.nextSteps.firstCall.parameters;
    const executionResult = await server.executeThinkingStep({
      planId: executionParams.planId,
      technique: executionParams.technique,
      problem: executionParams.problem,
      currentStep: executionParams.currentStep,
      totalSteps: executionParams.totalSteps,
      output: 'Initial analysis of team collaboration challenges',
      nextStepNeeded: true,
    });

    expect(executionResult.isError).toBeFalsy();
    const executionResponse = JSON.parse(executionResult.content[0].text);

    console.error('Session ID:', executionResponse.sessionId);
    console.error('Current step:', executionResponse.currentStep);
    console.error('Next step needed:', executionResponse.nextStepNeeded);

    // Verify execution works with the provided guidance
    expect(executionResponse.sessionId).toBeDefined();
    expect(executionResponse.currentStep).toBe(1);
    expect(executionResponse.nextStepNeeded).toBe(true);

    console.error('\n=== Workflow Complete ===');
    console.error('Successfully guided through: Discovery → Planning → Execution');
  });

  it('should handle alternative workflow with multiple techniques', () => {
    const server = new LateralThinkingServer();

    // Discovery with preference for systematic approach
    const discoveryResult = server.discoverTechniques({
      problem: 'Design a comprehensive system architecture',
      preferredOutcome: 'systematic',
    });

    const discoveryResponse = JSON.parse(discoveryResult.content[0].text);

    // Should recommend multiple techniques for systematic problems
    expect(discoveryResponse.recommendations.length).toBeGreaterThan(1);
    expect(discoveryResponse.nextStepGuidance?.alternativeApproach).toBeDefined();

    // Plan with multiple techniques
    const techniques = discoveryResponse.nextStepGuidance.suggestedParameters.techniques;
    if (techniques.length > 1) {
      const planningResult = server.planThinkingSession({
        problem: discoveryResponse.nextStepGuidance.suggestedParameters.problem,
        techniques: techniques, // Use all recommended techniques
        timeframe: 'comprehensive',
      });

      const planningResponse = JSON.parse(planningResult.content[0].text);

      // Verify integrated workflow for multiple techniques
      expect(planningResponse.workflow.length).toBeGreaterThan(1);
      const totalSteps = planningResponse.workflow.reduce(
        (sum: number, item: { totalSteps: number }) => sum + item.totalSteps,
        0
      );
      expect(totalSteps).toBeGreaterThan(5);
    }
  });
});
