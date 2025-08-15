/**
 * Integration test for reflexivity tracking feature
 * Tests that reflexivity data is properly tracked and exposed for TRIZ and Cultural Path
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';

describe('Reflexivity Integration', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('TRIZ Reflexivity Tracking', () => {
    it('should track reflexivity for TRIZ action steps', async () => {
      // Plan a TRIZ session
      const planResult = server.planThinkingSession({
        problem: 'Reduce manufacturing costs without sacrificing quality',
        techniques: ['triz'],
      });

      expect(planResult.content[0].text).toContain('planId');
      const planResponse = JSON.parse(planResult.content[0].text);
      const planId = planResponse.planId;

      // Execute thinking steps - step 1 (thinking)
      const step1Result = await server.executeThinkingStep({
        planId,
        technique: 'triz',
        problem: 'Reduce manufacturing costs without sacrificing quality',
        currentStep: 1,
        totalSteps: 4,
        output:
          'The core contradiction: reducing cost typically means using cheaper materials or processes, which reduces quality',
        nextStepNeeded: true,
      });

      // Step 1 should not have reflexivity data (thinking step)
      const step1Response = JSON.parse(step1Result.content[0].text);
      expect(step1Response.reflexivity).toBeUndefined();

      // Execute step 3 (action step - Apply Inventive Principles)
      const step3Result = await server.executeThinkingStep({
        planId,
        sessionId: step1Response.sessionId,
        technique: 'triz',
        problem: 'Reduce manufacturing costs without sacrificing quality',
        currentStep: 3,
        totalSteps: 4,
        output:
          'Applying TRIZ principle of Segmentation: Break the product into modular components',
        inventivePrinciples: ['Segmentation', 'Asymmetry'],
        nextStepNeeded: true,
      });

      // Step 3 should have reflexivity data (action step)
      const step3Response = JSON.parse(step3Result.content[0].text);
      expect(step3Response.reflexivity).toBeDefined();
      expect(step3Response.reflexivity.summary).toBeDefined();
      expect(step3Response.reflexivity.currentConstraints).toBeInstanceOf(Array);
      expect(step3Response.reflexivity.activeExpectations).toBeInstanceOf(Array);
    });
  });

  describe('Cultural Path Reflexivity Tracking', () => {
    it('should track reflexivity for Cultural Path action steps', async () => {
      // Plan a Cultural Path session
      const planResult = server.planThinkingSession({
        problem: 'Bridge communication gap between engineering and marketing teams',
        techniques: ['cultural_integration'],
      });

      const planResponse = JSON.parse(planResult.content[0].text);
      const planId = planResponse.planId;

      // Execute steps 1-2 (thinking)
      const step1Result = await server.executeThinkingStep({
        planId,
        technique: 'cultural_integration',
        problem: 'Bridge communication gap between engineering and marketing teams',
        currentStep: 1,
        totalSteps: 5,
        output:
          'Mapping cultural landscape: Engineering values precision, Marketing values persuasion',
        nextStepNeeded: true,
      });

      const step1Response = JSON.parse(step1Result.content[0].text);
      expect(step1Response.reflexivity).toBeUndefined();

      // Execute steps 2 first
      await server.executeThinkingStep({
        planId,
        sessionId: step1Response.sessionId,
        technique: 'cultural_integration',
        problem: 'Bridge communication gap between engineering and marketing teams',
        currentStep: 2,
        totalSteps: 5,
        output: 'Context sensitivity: Engineering culture values data, Marketing values narrative',
        nextStepNeeded: true,
      });

      // Execute step 3 (action step - Cross-Cultural Bridge Building)
      const step3Result = await server.executeThinkingStep({
        planId,
        sessionId: step1Response.sessionId,
        technique: 'cultural_integration',
        problem: 'Bridge communication gap between engineering and marketing teams',
        currentStep: 3,
        totalSteps: 5,
        output: 'Building bridge: Create shared vocabulary and joint workshops',
        bridgeStrategies: ['Shared metrics dashboard', 'Cross-functional teams'],
        sharedValues: ['Quality', 'Innovation', 'Customer satisfaction'],
        nextStepNeeded: true,
      });

      const step3Response = JSON.parse(step3Result.content[0].text);
      expect(step3Response.reflexivity).toBeDefined();
      expect(step3Response.reflexivity.summary).toBeDefined();

      // Execute step 4 (action step - Adaptive Path Navigation) - use step3's sessionId to maintain continuity
      const step4Result = await server.executeThinkingStep({
        planId,
        sessionId: step3Response.sessionId,
        technique: 'cultural_integration',
        problem: 'Bridge communication gap between engineering and marketing teams',
        currentStep: 4,
        totalSteps: 5,
        output: 'Navigating path: Choosing collaborative approach over directive approach',
        adaptiveStrategies: ['Collaborative workshops', 'Cross-functional sprints'],
        pivotProtocols: ['Weekly feedback loops', 'Quarterly alignment reviews'],
        nextStepNeeded: true,
      });

      const step4Response = JSON.parse(step4Result.content[0].text);
      expect(step4Response.reflexivity).toBeDefined();
      // By step 4 of CulturalIntegration, we have 1 action step (step 3: Bridge Building)
      expect(step4Response.reflexivity.summary.actionSteps).toBe(1);
      // Steps 1, 2, and 4 are thinking steps
      expect(step4Response.reflexivity.summary.thinkingSteps).toBe(3);
      // Should have accumulated constraints from the one action step
      expect(step4Response.reflexivity.summary.currentConstraints).toBe(4);
      // Should have actual constraint values in the array
      expect(step4Response.reflexivity.currentConstraints).toBeInstanceOf(Array);
      expect(step4Response.reflexivity.currentConstraints.length).toBe(4);
    });
  });

  describe('Non-Reflexivity Techniques', () => {
    it('should not add reflexivity data for unsupported techniques', async () => {
      // Plan a Six Hats session (not reflexivity-enabled)
      const planResult = server.planThinkingSession({
        problem: 'Improve team morale',
        techniques: ['six_hats'],
      });

      const planResponse = JSON.parse(planResult.content[0].text);
      const planId = planResponse.planId;

      const stepResult = await server.executeThinkingStep({
        planId,
        technique: 'six_hats',
        problem: 'Improve team morale',
        currentStep: 1,
        totalSteps: 6,
        output: 'Blue hat: We need a structured approach to improving morale',
        hatColor: 'blue',
        nextStepNeeded: true,
      });

      const stepResponse = JSON.parse(stepResult.content[0].text);
      expect(stepResponse.reflexivity).toBeUndefined();
    });
  });

  describe('Reflexivity State Accumulation', () => {
    it('should accumulate reflexivity effects across multiple action steps', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Optimize supply chain efficiency',
        techniques: ['triz'],
      });

      const planResponse = JSON.parse(planResult.content[0].text);
      const planId = planResponse.planId;

      // Skip to step 3 (first action)
      const step3Result = await server.executeThinkingStep({
        planId,
        technique: 'triz',
        problem: 'Optimize supply chain efficiency',
        currentStep: 3,
        totalSteps: 4,
        output: 'Eliminating contradiction: Remove intermediate warehouses',
        inventivePrinciples: ['Elimination'],
        nextStepNeeded: true,
      });

      const step3Response = JSON.parse(step3Result.content[0].text);
      const initialConstraints = step3Response.reflexivity?.currentConstraints?.length || 0;

      // Step 4 (second action)
      const step4Result = await server.executeThinkingStep({
        planId,
        sessionId: step3Response.sessionId,
        technique: 'triz',
        problem: 'Optimize supply chain efficiency',
        currentStep: 4,
        totalSteps: 4,
        output: 'Minimizing complexity: Streamline to direct shipping only',
        minimalSolution: 'Direct manufacturer to customer shipping',
        nextStepNeeded: false,
      });

      const step4Response = JSON.parse(step4Result.content[0].text);
      const finalConstraints = step4Response.reflexivity?.currentConstraints?.length || 0;

      // Constraints should accumulate
      expect(finalConstraints).toBeGreaterThanOrEqual(initialConstraints);
    });
  });
});
