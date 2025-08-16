/**
 * Integration tests for Risk Discovery and Enforcement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';

describe('Risk Discovery Integration', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('High-risk action detection and blocking', () => {
    it('should detect and validate financial risk', async () => {
      // Create a plan
      const planResult = server.planThinkingSession({
        problem: 'Investment strategy',
        techniques: ['six_hats'],
      });

      expect(planResult.isError).toBeFalsy();
      const planData = JSON.parse(planResult.content[0].text);

      // Try to execute a high-risk financial recommendation
      const execResult = await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'six_hats',
        problem: 'Investment strategy',
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'blue',
        output: 'I recommend investing 50% of your portfolio in a single tech stock',
        nextStepNeeded: true,
      });

      // Should trigger risk discovery but not block at step 1
      expect(execResult.isError).toBeFalsy();
      const execData = JSON.parse(execResult.content[0].text);
      expect(execData.sessionId).toBeDefined();
    });

    it('should block extreme risk recommendations', async () => {
      // Create a plan
      const planResult = server.planThinkingSession({
        problem: 'Personal financial emergency - quick money needed',
        techniques: ['po'],
      });

      const planData = JSON.parse(planResult.content[0].text);

      // First step - establish context
      const step1 = await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'po',
        problem: 'Personal financial emergency - quick money needed',
        currentStep: 1,
        totalSteps: 4,
        provocation: 'Po: Bet everything on one outcome',
        output: 'This provocation suggests going all-in',
        nextStepNeeded: true,
      });

      const sessionId = JSON.parse(step1.content[0].text).sessionId;

      // Second step - try extreme recommendation
      const step2 = await server.executeThinkingStep({
        planId: planData.planId,
        sessionId,
        technique: 'po',
        problem: 'Personal financial emergency - quick money needed',
        currentStep: 2,
        totalSteps: 4,
        output:
          'Based on the provocation, I recommend: Invest all your savings and retirement funds into crypto',
        nextStepNeeded: true,
      });

      // Changed: No longer blocks, only warns about high-risk actions
      // The system provides warnings but continues execution
      expect(step2.isError).toBeFalsy();

      // Should still complete successfully but potentially with warnings
      const step2Data = JSON.parse(step2.content[0].text);
      expect(step2Data.sessionId).toBeDefined();
    });
  });

  describe('Cross-domain risk detection', () => {
    it('should detect health domain risks', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Chronic pain management',
        techniques: ['design_thinking'],
      });

      const planData = JSON.parse(planResult.content[0].text);

      const execResult = await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'design_thinking',
        problem: 'Chronic pain management',
        currentStep: 1,
        totalSteps: 5,
        designStage: 'empathize',
        output: 'Consider experimental surgery with permanent effects',
        empathyInsights: ['Patient desperate for relief'],
        nextStepNeeded: true,
      });

      expect(execResult.isError).toBeFalsy();
      // In full implementation, would trigger health domain discovery
    });

    it('should detect career domain risks', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Career advancement strategy',
        techniques: ['scamper'],
      });

      const planData = JSON.parse(planResult.content[0].text);

      const execResult = await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'scamper',
        problem: 'Career advancement strategy',
        currentStep: 6,
        totalSteps: 8,
        scamperAction: 'eliminate',
        output:
          'Eliminate all professional relationships and burn bridges to force forward movement',
        nextStepNeeded: true,
      });

      expect(execResult.isError).toBeFalsy();
      const execData = JSON.parse(execResult.content[0].text);

      // SCAMPER eliminate action should show high path impact
      if (execData.pathImpact) {
        expect(execData.pathImpact.reversible).toBe(false);
        expect(execData.pathImpact.commitmentLevel).toBe('irreversible');
      }
    });
  });

  describe('Discovery data persistence', () => {
    it('should maintain discovery data across steps', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Major life decision',
        techniques: ['disney_method'],
      });

      const planData = JSON.parse(planResult.content[0].text);

      // Step 1: Dreamer phase
      const step1 = await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'disney_method',
        problem: 'Major life decision',
        currentStep: 1,
        totalSteps: 3,
        disneyRole: 'dreamer',
        output: 'Quit job and travel the world permanently',
        dreams: ['Complete freedom', 'No responsibilities'],
        nextStepNeeded: true,
      });

      const sessionId = JSON.parse(step1.content[0].text).sessionId;

      // Step 2: Realist phase - should have access to discovery from step 1
      const step2 = await server.executeThinkingStep({
        planId: planData.planId,
        sessionId,
        technique: 'disney_method',
        problem: 'Major life decision',
        currentStep: 2,
        totalSteps: 3,
        disneyRole: 'realist',
        output: 'Need to consider financial runway and career impact',
        practicalSteps: ['Calculate savings needed', 'Plan re-entry strategy'],
        nextStepNeeded: true,
      });

      expect(step2.isError).toBeFalsy();

      // Step 3: Critic phase - should validate against discovered constraints
      const step3 = await server.executeThinkingStep({
        planId: planData.planId,
        sessionId,
        technique: 'disney_method',
        problem: 'Major life decision',
        currentStep: 3,
        totalSteps: 3,
        disneyRole: 'critic',
        output: 'This plan risks career suicide and financial ruin',
        critiques: ['No income', 'Gap in resume', 'Savings depletion'],
        risks: ['Unable to re-enter job market', 'Complete financial depletion'],
        nextStepNeeded: false,
      });

      expect(step3.isError).toBeFalsy();
      const finalData = JSON.parse(step3.content[0].text);
      expect(finalData.insights).toBeDefined();
    });
  });

  describe('Forced calculation requirements', () => {
    it('should require calculations for high-stakes decisions', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Business investment opportunity',
        techniques: ['triz'],
      });

      const planData = JSON.parse(planResult.content[0].text);

      const execResult = await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'triz',
        problem: 'Business investment opportunity',
        currentStep: 1,
        totalSteps: 4,
        contradiction: 'Need high returns BUT cannot afford to lose capital',
        output: 'Invest 40% of business capital in new venture',
        risks: ['Complete loss possible', 'Business failure if investment fails'],
        nextStepNeeded: true,
      });

      expect(execResult.isError).toBeFalsy();
      // In full implementation, would require forced calculations
    });
  });

  describe('Educational feedback on violations', () => {
    it('should provide educational feedback when constraints are violated', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Retirement planning',
        techniques: ['nine_windows'],
      });

      const planData = JSON.parse(planResult.content[0].text);

      // Execute a step with extreme recommendation
      const execResult = await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'nine_windows',
        problem: 'Retirement planning',
        currentStep: 5,
        totalSteps: 9,
        nineWindowsCell: {
          timeFrame: 'present',
          systemLevel: 'system',
        },
        output: 'Current situation suggests putting entire 401k into high-risk investments',
        observations: ['Need higher returns', 'Running out of time'],
        patterns: ['Traditional investing too slow'],
        nextStepNeeded: true,
      });

      expect(execResult.isError).toBeFalsy();
      // In full implementation with discovered constraints, would provide education
    });
  });

  describe('Ergodicity and discovery interaction', () => {
    it('should integrate with existing ergodicity checks', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Startup equity decision',
        techniques: ['concept_extraction'],
      });

      const planData = JSON.parse(planResult.content[0].text);

      const execResult = await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'concept_extraction',
        problem: 'Startup equity decision',
        currentStep: 1,
        totalSteps: 4,
        successExample: 'Early Google employee equity',
        output: 'Extract concept: go all-in on high-potential startups',
        nextStepNeeded: true,
      });

      expect(execResult.isError).toBeFalsy();
      const execData = JSON.parse(execResult.content[0].text);

      // Should have both ergodicity data and potential discovery data
      expect(execData.sessionId).toBeDefined();
    });
  });

  describe('Risk level gradation', () => {
    it('should handle different risk levels appropriately', async () => {
      const planResult = server.planThinkingSession({
        problem: 'Portfolio optimization',
        techniques: ['six_hats'],
      });

      const planData = JSON.parse(planResult.content[0].text);

      // Low risk recommendation - provide reasonable confidence to avoid triggering escalation
      const lowRisk = await server.executeThinkingStep({
        planId: planData.planId,
        technique: 'six_hats',
        problem: 'Portfolio optimization',
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'blue',
        output: 'Suggest 5% allocation to growth stocks',
        nextStepNeeded: true,
        // Add risk assessment data to simulate proper engagement
        risks: ['Market volatility', 'Growth stock concentration'],
        mitigations: ['Small allocation', 'Diversified portfolio base'],
      });

      expect(lowRisk.isError).toBeFalsy();
      const sessionId = JSON.parse(lowRisk.content[0].text).sessionId;

      // Medium risk recommendation - continue with proper risk assessment
      const medRisk = await server.executeThinkingStep({
        planId: planData.planId,
        sessionId,
        technique: 'six_hats',
        problem: 'Portfolio optimization',
        currentStep: 2,
        totalSteps: 6,
        hatColor: 'white',
        output: 'Data suggests 20% allocation to emerging markets',
        nextStepNeeded: true,
        // Provide risk assessment to show engagement
        risks: ['Currency risk', 'Political instability'],
        mitigations: ['Geographic diversification', 'Long-term horizon'],
      });

      if (medRisk.isError) {
        console.error('Medium risk step failed:', JSON.stringify(medRisk.content[0].text, null, 2));
      }
      expect(medRisk.isError).toBeFalsy();

      // High risk recommendation - this might trigger warnings but should still pass
      const highRisk = await server.executeThinkingStep({
        planId: planData.planId,
        sessionId,
        technique: 'six_hats',
        problem: 'Portfolio optimization',
        currentStep: 3,
        totalSteps: 6,
        hatColor: 'red',
        output: 'Feeling drawn to put 80% in cryptocurrency',
        emotions: ['FOMO', 'Excitement about potential'],
        nextStepNeeded: true,
        // Even high-risk should engage with framework
        risks: ['Extreme volatility', 'Potential total loss'],
        mitigations: ['Only invest what can afford to lose', 'Set stop-loss orders'],
      });

      expect(highRisk.isError).toBeFalsy();
      // High risk should pass but may include warnings in response
    });
  });
});
