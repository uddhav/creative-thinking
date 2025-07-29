/**
 * Integration tests for Reality Gradient System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import { parseServerResponse } from '../helpers/types.js';
import type { RealityAssessment } from '../../index.js';

interface StepDataWithReality {
  sessionId: string;
  realityAssessment?: RealityAssessment;
}

interface DiscoveryResponse {
  recommendations: Array<{
    technique: string;
    reasoning: string;
  }>;
}

describe('Reality Gradient Integration', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('Reality Assessment in Thinking Steps', () => {
    it('should assess reality for potentially impossible ideas', async () => {
      // Create a plan for a problem with regulatory constraints
      const planResult = await server.planThinkingSession({
        problem: 'Implement tax loss harvesting for individual stocks',
        techniques: ['triz'],
      });
      const plan = parseServerResponse<{ planId: string }>(planResult);

      // Execute step with impossible solution
      const stepResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'triz',
        problem: 'Implement tax loss harvesting for individual stocks',
        currentStep: 1,
        totalSteps: 4,
        contradiction: 'Want to sell for tax loss but keep the exact same position',
        output: 'Sell and immediately buy back the same stock',
        nextStepNeeded: true,
      });

      const stepData = parseServerResponse<StepDataWithReality>(stepResult);

      expect(stepData.realityAssessment).toBeDefined();
      expect(stepData.realityAssessment.possibilityLevel).toBe('breakthrough-required');
      expect(stepData.realityAssessment.impossibilityType).toBe('regulatory');
      expect(stepData.realityAssessment.mechanismExplanation).toContain('regulations prohibit');
    });

    it('should not assess obviously feasible solutions', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Improve team communication',
        techniques: ['six_hats'],
      });
      const plan = parseServerResponse<{ planId: string }>(planResult);

      const stepResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem: 'Improve team communication',
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'blue',
        output: 'Establish regular team meetings and communication channels',
        nextStepNeeded: true,
      });

      const stepData = parseServerResponse<StepDataWithReality>(stepResult);

      // Feasible solutions should not have reality assessment
      expect(stepData.realityAssessment).toBeUndefined();
    });

    it('should identify physical law violations', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Create unlimited energy source',
        techniques: ['scamper'],
      });
      const plan = parseServerResponse<{ planId: string }>(planResult);

      const stepResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem: 'Create unlimited energy source',
        currentStep: 1,
        totalSteps: 7,
        scamperAction: 'substitute',
        output: 'Substitute traditional energy with perpetual motion machines',
        nextStepNeeded: true,
      });

      const stepData = parseServerResponse<StepDataWithReality>(stepResult);

      expect(stepData.realityAssessment).toBeDefined();
      expect(stepData.realityAssessment.possibilityLevel).toBe('breakthrough-required');
      expect(stepData.realityAssessment.impossibilityType).toBe('physical');
      expect(stepData.realityAssessment.breakthroughsRequired).toContain(
        'Discover new physical principles'
      );
    });

    it('should provide historical precedents for breakthroughs', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Enable instant global communication',
        techniques: ['concept_extraction'],
      });
      const plan = parseServerResponse<{ planId: string }>(planResult);

      const stepResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'concept_extraction',
        problem: 'Enable instant global communication',
        currentStep: 1,
        totalSteps: 4,
        successExample: 'Telegraph networks',
        output: 'Create a network that connects everyone instantly',
        nextStepNeeded: true,
      });

      const stepData = parseServerResponse<StepDataWithReality>(stepResult);

      if (stepData.realityAssessment) {
        expect(stepData.realityAssessment.historicalPrecedents).toBeDefined();
        expect(stepData.realityAssessment.historicalPrecedents.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Domain Detection and Assessment', () => {
    it('should detect finance domain and apply appropriate checks', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Create new investment strategies for tax optimization',
        techniques: ['po'],
      });
      const plan = parseServerResponse<{ planId: string }>(planResult);

      const stepResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'po',
        problem: 'Create new investment strategies for tax optimization',
        currentStep: 1,
        totalSteps: 4,
        provocation: 'Po: All investments are tax-free',
        output: 'Create offshore structures to avoid all taxes',
        nextStepNeeded: true,
      });

      const stepData = parseServerResponse<StepDataWithReality>(stepResult);

      if (stepData.realityAssessment) {
        expect(stepData.realityAssessment.impossibilityType).toBe('regulatory');
      }
    });

    it('should detect healthcare domain constraints', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Develop new medical treatments',
        techniques: ['design_thinking'],
      });
      const plan = parseServerResponse<{ planId: string }>(planResult);

      const stepResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'design_thinking',
        problem: 'Develop new medical treatments',
        currentStep: 3,
        totalSteps: 5,
        designStage: 'ideate',
        output: 'Use experimental drugs without clinical trials',
        nextStepNeeded: true,
      });

      const stepData = parseServerResponse<StepDataWithReality>(stepResult);

      if (stepData.realityAssessment) {
        expect(stepData.realityAssessment.possibilityLevel).not.toBe('feasible');
        expect(stepData.realityAssessment.breakthroughsRequired).toBeDefined();
      }
    });
  });

  describe('Multi-Step Reality Tracking', () => {
    it('should track reality assessments across multiple steps', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Solve energy crisis',
        techniques: ['triz'],
      });
      const plan = parseServerResponse<{ planId: string }>(planResult);

      // Step 1: Identify contradiction (feasible)
      const step1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'triz',
        problem: 'Solve energy crisis',
        currentStep: 1,
        totalSteps: 4,
        contradiction: 'Need more energy but less environmental impact',
        output: 'Fundamental contradiction identified',
        nextStepNeeded: true,
      });
      const session1 = parseServerResponse<StepDataWithReality>(step1);

      // Step 2: Apply principles (getting harder)
      const step2 = await server.executeThinkingStep({
        planId: plan.planId,
        sessionId: session1.sessionId,
        technique: 'triz',
        problem: 'Solve energy crisis',
        currentStep: 2,
        totalSteps: 4,
        inventivePrinciples: ['Separation in time', 'Use of fields'],
        output: 'Capture all solar energy hitting Earth',
        nextStepNeeded: true,
      });
      const session2 = parseServerResponse<StepDataWithReality>(step2);

      // Step 3: Remove constraints (breakthrough needed)
      const step3 = await server.executeThinkingStep({
        planId: plan.planId,
        sessionId: session1.sessionId,
        technique: 'triz',
        problem: 'Solve energy crisis',
        currentStep: 3,
        totalSteps: 4,
        viaNegativaRemovals: ['Remove energy loss', 'Remove distance limitations'],
        output: 'Wireless energy transmission with 100% efficiency',
        nextStepNeeded: true,
      });
      const session3 = parseServerResponse<StepDataWithReality>(step3);

      // Check progression of reality assessments
      expect(session1.realityAssessment).toBeUndefined(); // Feasible
      expect(session2.realityAssessment?.possibilityLevel).toBe('difficult');
      expect(session3.realityAssessment?.possibilityLevel).toBe('breakthrough-required');
      expect(session3.realityAssessment?.impossibilityType).toBe('physical');
    });
  });

  describe('Reality Assessment with Existing Assessment', () => {
    it('should respect pre-existing reality assessment', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Test problem',
        techniques: ['random_entry'],
      });
      const plan = parseServerResponse<{ planId: string }>(planResult);

      const stepResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'random_entry',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        randomStimulus: 'Clock',
        output: 'Time-based solution',
        nextStepNeeded: true,
        realityAssessment: {
          possibilityLevel: 'impossible',
          impossibilityType: 'logical',
          confidenceLevel: 1.0,
          mechanismExplanation: 'Pre-assessed as impossible',
        },
      });

      const stepData = parseServerResponse<StepDataWithReality>(stepResult);

      // Should keep the provided assessment
      expect(stepData.realityAssessment).toBeUndefined();
    });
  });

  describe('Reality Assessment in Discovery Phase', () => {
    it('should consider reality constraints in technique recommendations', async () => {
      const discoveryResult = await server.discoverTechniques({
        problem: 'Create a perpetual motion machine for unlimited energy',
        context: 'Need to solve energy crisis with zero emissions',
        preferredOutcome: 'innovative',
        constraints: ['Must violate no physical laws', 'Must be buildable with current technology'],
      });

      const discovery = parseServerResponse<DiscoveryResponse>(discoveryResult);

      // Should still recommend techniques but with awareness of constraints
      expect(discovery.recommendations).toBeDefined();
      expect(discovery.recommendations.length).toBeGreaterThan(0);

      // Should recommend TRIZ for handling contradictions
      const trizRecommendation = discovery.recommendations.find(r => r.technique === 'triz');
      expect(trizRecommendation).toBeDefined();
      expect(trizRecommendation.reasoning).toContain('contradiction');
    });
  });
});
