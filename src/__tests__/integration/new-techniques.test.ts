/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/**
 * Integration tests for Disney Method and Nine Windows techniques
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import type {
  DiscoverTechniquesInput,
  PlanThinkingSessionInput,
  ExecuteThinkingStepInput,
  LateralThinkingResponse,
} from '../../types/index.js';

interface DiscoveryResponse {
  problem: string;
  recommendations: Array<{
    technique: string;
    reasoning: string;
    effectiveness: number;
  }>;
  flexibility: {
    score: number;
  };
}

interface PlanResponse {
  planId: string;
  workflow: Array<{
    stepNumber: number;
    technique: string;
    description: string;
    expectedDuration: string;
    totalSteps: number;
    expectedOutputs: string[];
  }>;
}

interface ExecutionResponse {
  sessionId: string;
  technique: string;
  currentStep: number;
  totalSteps: number;
  nextStepNeeded: boolean;
  historyLength: number;
  branches: string[];
  completed?: boolean;
  insights?: string[];
  summary?: string;
  nextStepGuidance?: string;
}

describe('Disney Method and Nine Windows Integration', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  const parseResponse = <T>(response: LateralThinkingResponse): T => {
    const content = response.content[0].text;
    return JSON.parse(content) as T;
  };

  describe('Disney Method', () => {
    it('should recommend Disney Method for implementation problems', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'Transform our vision for sustainable packaging into reality',
        preferredOutcome: 'systematic',
        context: 'Need to implement and execute our sustainable packaging ideas',
      };

      const response = server.discoverTechniques(input);
      const output = parseResponse<DiscoveryResponse>(response);

      const disneyRecommendation = output.recommendations.find(
        r => r.technique === 'disney_method'
      );
      expect(disneyRecommendation).toBeDefined();
      expect(disneyRecommendation?.reasoning).toContain('Sequential approach');
    });

    it('should create a plan with Disney Method', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Develop a new customer loyalty program',
        techniques: ['disney_method'],
      };

      const response = server.planThinkingSession(input);
      const output = parseResponse<PlanResponse>(response);

      expect(output.workflow).toHaveLength(3);
      expect(output.workflow[0].technique).toBe('disney_method');
      // Check for DREAMER/REALIST/CRITIC in uppercase (as shown in the error)
      expect(output.workflow[0].description.toUpperCase()).toContain('DREAMER');
      expect(output.workflow[1].description.toUpperCase()).toContain('REALIST');
      expect(output.workflow[2].description.toUpperCase()).toContain('CRITIC');
    });

    it('should execute Disney Method steps with proper role tracking', async () => {
      // Create plan
      const planInput: PlanThinkingSessionInput = {
        problem: 'Create an innovative employee wellness program',
        techniques: ['disney_method'],
      };
      const planResponse = server.planThinkingSession(planInput);
      const plan = parseResponse<PlanResponse>(planResponse);
      const problem = planInput.problem; // Extract to avoid ESLint issues

      // Execute Dreamer step
      const dreamerInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        technique: 'disney_method',
        problem,
        currentStep: 1,
        totalSteps: 3,
        output: 'Virtual reality meditation rooms, AI health coaches, gamified wellness challenges',
        nextStepNeeded: true,
        disneyRole: 'dreamer',
        dreamerVision: [
          'VR meditation spaces for stress relief',
          'AI-powered personal health coaches',
          'Gamified team wellness competitions',
        ],
      };

      const dreamerResponse = await server.executeThinkingStep(dreamerInput);
      const dreamerOutput = parseResponse<ExecutionResponse>(dreamerResponse);

      expect(dreamerOutput.technique).toBe('disney_method');
      expect(dreamerOutput.currentStep).toBe(1);
      expect(dreamerOutput.nextStepGuidance).toContain('REALIST');

      // Execute Realist step
      const realistInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId: dreamerOutput.sessionId,
        technique: 'disney_method',
        problem,
        currentStep: 2,
        totalSteps: 3,
        output:
          'Phase 1: Partner with VR vendor, pilot with 50 employees. Budget: $50k for 6 months.',
        nextStepNeeded: true,
        disneyRole: 'realist',
        realistPlan: [
          'Phase 1: VR meditation pilot with existing vendor',
          'Budget allocation: $50k for initial 6-month pilot',
          'Success metrics: stress reduction, usage rates',
        ],
      };

      const realistResponse = await server.executeThinkingStep(realistInput);
      const realistOutput = parseResponse<ExecutionResponse>(realistResponse);

      expect(realistOutput.currentStep).toBe(2);
      expect(realistOutput.nextStepGuidance).toContain('CRITIC');

      // Execute Critic step
      const criticInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId: dreamerOutput.sessionId,
        technique: 'disney_method',
        problem,
        currentStep: 3,
        totalSteps: 3,
        output:
          'Privacy concerns with health data. VR motion sickness for some users. High initial cost.',
        nextStepNeeded: false,
        disneyRole: 'critic',
        criticRisks: [
          'Employee privacy concerns with health data collection',
          'VR motion sickness affects 10-15% of users',
          'High upfront investment with uncertain ROI',
        ],
      };

      const criticResponse = await server.executeThinkingStep(criticInput);
      const criticOutput = parseResponse<ExecutionResponse>(criticResponse);

      expect(criticOutput.currentStep).toBe(3);
      expect(criticOutput.completed).toBe(true);
      expect(criticOutput.insights).toBeDefined();
      expect(criticOutput.insights).toBeDefined();
      expect(criticOutput.insights?.length).toBeGreaterThan(0);
      // Check for insights containing key elements
      const insightsText = criticOutput.insights?.join(' ') || '';
      expect(insightsText).toContain('VR meditation');
      expect(insightsText).toContain('Phase 1');
      expect(insightsText).toContain('privacy concerns');
    });
  });

  describe('Nine Windows', () => {
    it('should recommend Nine Windows for systemic problems', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'Understand the evolution and future of our supply chain',
        context: "Need to analyze how our logistics system developed and where it's heading",
        preferredOutcome: 'analytical',
      };

      const response = server.discoverTechniques(input);
      const output = parseResponse<DiscoveryResponse>(response);

      const nineWindowsRecommendation = output.recommendations.find(
        r => r.technique === 'nine_windows'
      );
      expect(nineWindowsRecommendation).toBeDefined();
      expect(nineWindowsRecommendation?.reasoning).toContain('Systematic');
    });

    it('should create a plan with Nine Windows', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Analyze the transformation of retail shopping',
        techniques: ['nine_windows'],
        timeframe: 'comprehensive',
      };

      const response = server.planThinkingSession(input);
      const output = parseResponse<PlanResponse>(response);

      expect(output.workflow).toHaveLength(9);

      // Check time progression
      expect(output.workflow[0].description).toContain('Past');
      expect(output.workflow[3].description).toContain('Present');
      expect(output.workflow[6].description).toContain('Future');

      // Check system levels
      expect(output.workflow[0].description).toContain('Sub-system');
      expect(output.workflow[1].description).toContain('System');
      expect(output.workflow[2].description).toContain('Super-system');
    });

    it('should execute Nine Windows analysis with matrix tracking', async () => {
      // Create plan
      const planInput: PlanThinkingSessionInput = {
        problem: 'Evolution of electric vehicles',
        techniques: ['nine_windows'],
      };
      const planResponse = server.planThinkingSession(planInput);
      const plan = parseResponse<PlanResponse>(planResponse);
      const problem = planInput.problem; // Extract to avoid ESLint issues

      // Execute step 5 (Present System - the center cell)
      const step5Input: ExecuteThinkingStepInput = {
        planId: plan.planId,
        technique: 'nine_windows',
        problem,
        currentStep: 5,
        totalSteps: 9,
        output:
          'EVs currently represent 15% of new car sales. Range anxiety still exists but charging infrastructure is rapidly expanding.',
        nextStepNeeded: true,
        currentCell: {
          timeFrame: 'present',
          systemLevel: 'system',
        },
        nineWindowsMatrix: [
          {
            timeFrame: 'present',
            systemLevel: 'system',
            content: 'Current EV market at 15% adoption',
            pathDependencies: ['Battery technology maturity', 'Government incentives'],
            irreversible: false,
          },
        ],
      };

      const response5 = await server.executeThinkingStep(step5Input);
      const output5 = parseResponse<ExecutionResponse>(response5);

      expect(output5.technique).toBe('nine_windows');
      expect(output5.currentStep).toBe(5);
      expect(output5.nextStepGuidance).toContain('Present Super-system');

      // Execute step 8 (Future System)
      const step8Input: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId: output5.sessionId,
        technique: 'nine_windows',
        problem,
        currentStep: 8,
        totalSteps: 9,
        output:
          'Autonomous EVs dominate transportation. Personal car ownership becomes rare in cities.',
        nextStepNeeded: true,
        currentCell: {
          timeFrame: 'future',
          systemLevel: 'system',
        },
        interdependencies: [
          'Requires 5G infrastructure',
          'Depends on regulatory framework for autonomous vehicles',
          'Linked to urban planning changes',
        ],
      };

      const response8 = await server.executeThinkingStep(step8Input);
      const output8 = parseResponse<ExecutionResponse>(response8);

      expect(output8.currentStep).toBe(8);

      // Complete the analysis
      const step9Input: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId: output5.sessionId,
        technique: 'nine_windows',
        problem,
        currentStep: 9,
        totalSteps: 9,
        output:
          'Climate regulations will mandate zero emissions. Cities redesigned for autonomous transport.',
        nextStepNeeded: false,
        currentCell: {
          timeFrame: 'future',
          systemLevel: 'super-system',
        },
      };

      const response9 = await server.executeThinkingStep(step9Input);
      const output9 = parseResponse<ExecutionResponse>(response9);

      expect(output9.completed).toBe(true);
      expect(output9.insights).toBeDefined();
      expect(output9.insights?.length).toBeGreaterThan(0);
      // Check for insights containing key elements
      const insightsText = output9.insights?.join(' ') || '';
      expect(insightsText).toContain('15%');
      expect(insightsText).toContain('Autonomous EVs');
      expect(insightsText).toContain('5G infrastructure');
    });
  });

  describe('Combined Workflow', () => {
    it('should support Disney Method followed by Nine Windows', async () => {
      // Plan with both techniques
      const planInput: PlanThinkingSessionInput = {
        problem: 'Transform our manufacturing process for sustainability',
        techniques: ['disney_method', 'nine_windows'],
        objectives: ['Generate innovative vision', 'Understand systemic implications'],
      };

      const planResponse = server.planThinkingSession(planInput);
      const plan = parseResponse<PlanResponse>(planResponse);
      const problem = planInput.problem; // Extract to avoid ESLint issues

      expect(plan.workflow).toHaveLength(12); // 3 Disney + 9 Windows
      expect(plan.workflow[0].technique).toBe('disney_method');
      expect(plan.workflow[3].technique).toBe('nine_windows');

      // Execute first Disney step
      const disneyInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        technique: 'disney_method',
        problem,
        currentStep: 1,
        totalSteps: 3,
        output: 'Zero-waste factory powered entirely by renewable energy',
        nextStepNeeded: true,
        disneyRole: 'dreamer',
        dreamerVision: ['Zero-waste manufacturing', '100% renewable energy'],
      };

      const disneyResponse = await server.executeThinkingStep(disneyInput);
      const disneyOutput = parseResponse<ExecutionResponse>(disneyResponse);

      expect(disneyOutput.sessionId).toBeDefined();
      expect(disneyOutput.technique).toBe('disney_method');
    });
  });
});
