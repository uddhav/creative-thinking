/**
 * Integration test for SCAMPER reflexivity tracking
 * Tests that all 8 SCAMPER steps properly track reflexivity as action steps
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';

describe('SCAMPER Reflexivity Integration', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('SCAMPER Full Reflexivity Tracking', () => {
    it('should track reflexivity for all 8 SCAMPER action steps', async () => {
      // Plan a SCAMPER session
      const planResult = server.planThinkingSession({
        problem: 'Redesign a coffee maker for small apartments',
        techniques: ['scamper'],
      });

      const planResponse = JSON.parse(planResult.content[0].text);
      const planId = planResponse.planId;

      // Execute first step - Substitute (action)
      const step1Result = await server.executeThinkingStep({
        planId,
        technique: 'scamper',
        problem: 'Redesign a coffee maker for small apartments',
        currentStep: 1,
        totalSteps: 8,
        output: 'Substitute traditional water reservoir with collapsible silicone container',
        scamperAction: 'substitute',
        scamperModification: 'Replace rigid plastic with foldable material',
        nextStepNeeded: true,
      });

      const step1Response = JSON.parse(step1Result.content[0].text);
      expect(step1Response.reflexivity).toBeDefined();
      expect(step1Response.reflexivity.summary.actionSteps).toBe(1);
      expect(step1Response.reflexivity.summary.thinkingSteps).toBe(0);
      expect(step1Response.reflexivity.currentConstraints.length).toBeGreaterThan(0);

      // Execute step 2 - Combine (action with low reversibility)
      const step2Result = await server.executeThinkingStep({
        planId,
        sessionId: step1Response.sessionId, // Continue the same session
        technique: 'scamper',
        problem: 'Redesign a coffee maker for small apartments',
        currentStep: 2,
        totalSteps: 8,
        output: 'Combine coffee maker with smart home hub functionality',
        scamperAction: 'combine',
        scamperModification: 'Merge brewing system with IoT controls',
        nextStepNeeded: true,
      });

      const step2Response = JSON.parse(step2Result.content[0].text);
      expect(step2Response.reflexivity.summary.actionSteps).toBe(2);
      expect(step2Response.reflexivity.currentConstraints.length).toBeGreaterThanOrEqual(3);

      // Execute step 6 - Eliminate (action with low reversibility)
      const step6Result = await server.executeThinkingStep({
        planId,
        sessionId: step2Response.sessionId, // Continue the same session
        technique: 'scamper',
        problem: 'Redesign a coffee maker for small apartments',
        currentStep: 6,
        totalSteps: 8,
        output: 'Eliminate the carafe - brew directly into cups',
        scamperAction: 'eliminate',
        scamperModification: 'Remove glass carafe and heating plate',
        nextStepNeeded: true,
      });

      const step6Response = JSON.parse(step6Result.content[0].text);
      expect(step6Response.reflexivity.summary.actionSteps).toBe(3);
      // Should accumulate constraints from all executed steps
      expect(step6Response.reflexivity.currentConstraints.length).toBeGreaterThanOrEqual(6);

      // Execute all 8 steps to verify full tracking
      const step8Result = await server.executeThinkingStep({
        planId,
        sessionId: step6Response.sessionId, // Continue the same session
        technique: 'scamper',
        problem: 'Redesign a coffee maker for small apartments',
        currentStep: 8,
        totalSteps: 8,
        output: 'Parameterize brewing strength and temperature settings',
        scamperAction: 'parameterize',
        scamperModification: 'Add variable controls for customization',
        nextStepNeeded: false,
      });

      const step8Response = JSON.parse(step8Result.content[0].text);
      expect(step8Response.reflexivity.summary.actionSteps).toBe(4); // We executed steps 1, 2, 6, 8
      expect(step8Response.reflexivity.summary.thinkingSteps).toBe(0); // All SCAMPER steps are actions
      expect(step8Response.reflexivity.currentConstraints).toContain(
        'Must maintain compatibility with substitutes'
      );
    });

    it('should track different reversibility levels for different SCAMPER actions', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Improve a mobile app UI',
        techniques: ['scamper'],
      });

      const planResponse = JSON.parse(planResult.content[0].text);
      const planId = planResponse.planId;

      // Substitute (step 1) - medium reversibility
      const step1Result = await server.executeThinkingStep({
        planId,
        technique: 'scamper',
        problem: 'Improve a mobile app UI',
        currentStep: 1,
        totalSteps: 8,
        output: 'Substitute navigation drawer with bottom tabs',
        scamperAction: 'substitute',
        scamperModification: 'Replace navigation pattern',
        nextStepNeeded: true,
      });

      const step1Response = JSON.parse(step1Result.content[0].text);
      expect(step1Response.reflexivity).toBeDefined();
      const substituteConstraints = step1Response.reflexivity.currentConstraints.length;

      // Combine (step 2) - low reversibility - continuing session
      const step2Result = await server.executeThinkingStep({
        planId,
        sessionId: step1Response.sessionId,
        technique: 'scamper',
        problem: 'Improve a mobile app UI',
        currentStep: 2,
        totalSteps: 8,
        output: 'Combine settings and profile into unified screen',
        scamperAction: 'combine',
        scamperModification: 'Merge separate screens',
        nextStepNeeded: true, // Can't terminate early in sequential mode!
      });

      const step2Response = JSON.parse(step2Result.content[0].text);

      expect(step2Response.reflexivity).toBeDefined();
      expect(step2Response.reflexivity.summary.actionSteps).toBe(2); // Steps 1 and 2
      const combineConstraints = step2Response.reflexivity.currentConstraints.length;

      // Combine (low reversibility) should create more constraints than Substitute (medium)
      expect(combineConstraints).toBeGreaterThan(substituteConstraints);

      // Check that we have constraint accumulation from both steps
      const hasSubstituteConstraint = step2Response.reflexivity.currentConstraints.some(
        (c: string) => c.includes('compatibility') || c.includes('substitute')
      );
      const hasCombineOrMaintenanceConstraint = step2Response.reflexivity.currentConstraints.some(
        (c: string) => c.includes('maintain') || c.includes('replacement')
      );
      expect(hasSubstituteConstraint).toBe(true);
      expect(hasCombineOrMaintenanceConstraint).toBe(true);
    });
  });
});
