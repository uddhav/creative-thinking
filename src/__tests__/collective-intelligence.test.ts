/**
 * Tests for Collective Intelligence Orchestration technique implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type {
  ExecuteThinkingStepInput,
  PlanThinkingSessionInput,
  DiscoverTechniquesInput,
  LateralTechnique,
} from '../index.js';

interface ServerResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

interface PlanResponse {
  planId: string;
  workflow: Array<{
    technique: string;
    stepNumber: number;
    description: string;
    expectedOutputs: string[];
    riskConsiderations?: string[];
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
  metrics?: {
    duration: number;
    creativityScore: number;
    risksCaught?: number;
    antifragileFeatures?: number;
  };
  nextStepGuidance?: string;
  autoSaveError?: string;
  // Memory-suggestive fields
  contextualInsight?: string;
  historicalNote?: string;
  patternObserved?: string;
  sessionFingerprint?: {
    problemType: string;
    solutionPattern: string;
    breakthroughLevel: number;
    pathDependencies: string[];
  };
  noteworthyPatterns?: {
    observed: string;
    significance: string;
    applicability: string[];
  };
}

interface DiscoveryResponse {
  problem: string;
  recommendations: Array<{
    technique: string;
    score: number;
    reasoning: string;
    bestFor: string[];
    limitations: string[];
  }>;
  suggestedWorkflow?: string;
  flexibilityScore?: number;
  optionGenerationRecommended?: boolean;
}

describe('Collective Intelligence Orchestration', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  // Helper function to create a plan
  async function createPlan(problem: string, techniques: string[]): Promise<string> {
    const input: PlanThinkingSessionInput = {
      problem,
      techniques: techniques as LateralTechnique[],
    };

    const result = (await server.planThinkingSession(input)) as ServerResponse;
    expect(result.isError).toBeFalsy();
    const planData = JSON.parse(result.content[0]?.text || '{}') as PlanResponse;
    return planData.planId;
  }

  // Helper function to execute a step
  async function executeStep(
    planId: string,
    input: Partial<ExecuteThinkingStepInput>
  ): Promise<ExecutionResponse> {
    const result = (await server.executeThinkingStep({
      planId,
      ...input,
    } as ExecuteThinkingStepInput)) as ServerResponse;

    expect(result.isError).toBeFalsy();
    return JSON.parse(result.content[0]?.text || '{}') as ExecutionResponse;
  }

  describe('Discovery Phase', () => {
    it('should recommend Collective Intelligence for multi-stakeholder problems', async () => {
      const input: DiscoverTechniquesInput = {
        problem:
          'Bring together diverse stakeholder perspectives to solve urban planning challenge',
        context: 'Need to synthesize views from residents, businesses, government, and experts',
      };

      const result = (await server.discoverTechniques(input)) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const response = JSON.parse(result.content[0]?.text || '{}') as DiscoveryResponse;

      const collectiveRec = response.recommendations.find(r => r.technique === 'collective_intel');
      expect(collectiveRec).toBeDefined();
      expect(collectiveRec?.score).toBeGreaterThan(0.8);
      expect(collectiveRec?.reasoning).toContain('synthesize multiple perspectives');
      expect(collectiveRec?.bestFor).toContain('multi-stakeholder problems');
    });

    it('should recommend Collective Intelligence for knowledge synthesis problems', async () => {
      const input: DiscoverTechniquesInput = {
        problem: 'Synthesize collective wisdom from multiple research teams on climate solutions',
        context: 'Need to aggregate distributed knowledge and find emergent patterns',
      };

      const result = (await server.discoverTechniques(input)) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const response = JSON.parse(result.content[0]?.text || '{}') as DiscoveryResponse;

      const collectiveRec = response.recommendations.find(r => r.technique === 'collective_intel');
      expect(collectiveRec).toBeDefined();
      expect(collectiveRec?.bestFor).toContain('knowledge synthesis');
    });

    it('should recognize crowdsourcing and collaborative keywords', async () => {
      const keywords = [
        'wisdom of crowds',
        'bring together ideas',
        'multiple perspectives',
        'team collaboration',
        'consensus building',
        'emergent insights',
        'swarm intelligence',
      ];

      for (const keyword of keywords) {
        const input: DiscoverTechniquesInput = {
          problem: `How to ${keyword} for product innovation`,
        };

        const result = (await server.discoverTechniques(input)) as ServerResponse;
        expect(result.isError).toBeFalsy();
        const response = JSON.parse(result.content[0]?.text || '{}') as DiscoveryResponse;

        const collectiveRec = response.recommendations.find(
          r => r.technique === 'collective_intel'
        );
        expect(collectiveRec).toBeDefined();
      }
    });
  });

  describe('Planning Phase', () => {
    it('should create a proper workflow for Collective Intelligence technique', async () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Create innovation strategy using collective intelligence',
        techniques: ['collective_intel'] as LateralTechnique[],
      };

      const result = (await server.planThinkingSession(input)) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const planData = JSON.parse(result.content[0]?.text || '{}') as PlanResponse;

      expect(planData.workflow).toHaveLength(5);
      expect(planData.workflow[0].description).toContain('Gather wisdom sources');
      expect(planData.workflow[1].description).toContain('Map knowledge landscape');
      expect(planData.workflow[2].description).toContain('Identify emergent patterns');
      expect(planData.workflow[3].description).toContain('Create synergy combinations');
      expect(planData.workflow[4].description).toContain(
        'Synthesize into actionable collective intelligence'
      );

      // Check risk considerations
      expect(planData.workflow[0].riskConsiderations).toContain('Source bias awareness');
      expect(planData.workflow[2].riskConsiderations).toContain('Pattern projection bias');
    });
  });

  describe('Execution Phase', () => {
    it('should execute all five Collective Intelligence steps', async () => {
      const planId = await createPlan(
        'Develop smart city solutions through collective intelligence',
        ['collective_intel']
      );

      // Step 1: Gather wisdom sources
      const step1 = await executeStep(planId, {
        technique: 'collective_intel',
        problem: 'Develop smart city solutions through collective intelligence',
        currentStep: 1,
        totalSteps: 5,
        output: 'Gathered diverse wisdom sources for smart city innovation',
        wisdomSources: [
          'Urban planning experts',
          'Citizen crowdsourcing platforms',
          'IoT sensor data repositories',
          'Academic research databases',
          'Indigenous community knowledge',
        ],
        nextStepNeeded: true,
      });

      expect(step1.technique).toBe('collective_intel');
      expect(step1.currentStep).toBe(1);
      expect(step1.nextStepGuidance).toContain('Map knowledge landscape');
      expect(step1.contextualInsight).toContain('5 wisdom sources');

      // Step 2: Map knowledge landscape
      const step2 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'collective_intel',
        problem: 'Develop smart city solutions through collective intelligence',
        currentStep: 2,
        totalSteps: 5,
        output: 'Mapped connections and dependencies across knowledge sources',
        nextStepNeeded: true,
      });

      expect(step2.currentStep).toBe(2);

      // Step 3: Identify emergent patterns
      const step3 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'collective_intel',
        problem: 'Develop smart city solutions through collective intelligence',
        currentStep: 3,
        totalSteps: 5,
        output: 'Discovered emergent patterns from collective knowledge',
        emergentPatterns: [
          'Citizen engagement drives adoption',
          'Green infrastructure creates multiple benefits',
          'Data privacy concerns universal across demographics',
          'Local context critical for success',
        ],
        nextStepNeeded: true,
      });

      expect(step3.currentStep).toBe(3);
      expect(step3.contextualInsight).toContain('4 insights discovered');

      // Step 4: Create synergy combinations
      const step4 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'collective_intel',
        problem: 'Develop smart city solutions through collective intelligence',
        currentStep: 4,
        totalSteps: 5,
        output: 'Created synergistic combinations that amplify collective value',
        synergyCombinations: [
          'IoT + Citizen Science = Community-Driven Monitoring',
          'Green Infrastructure + Social Spaces = Resilient Communities',
          'Open Data + Local Knowledge = Context-Aware Solutions',
        ],
        nextStepNeeded: true,
      });

      expect(step4.currentStep).toBe(4);
      expect(step4.contextualInsight).toContain('3 knowledge combinations');

      // Step 5: Synthesize collective insights
      const step5 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'collective_intel',
        problem: 'Develop smart city solutions through collective intelligence',
        currentStep: 5,
        totalSteps: 5,
        output: 'Synthesized actionable collective intelligence framework',
        collectiveInsights: [
          'Human-centered technology adoption',
          'Multi-benefit infrastructure design',
          'Privacy-preserving data commons',
          'Adaptive governance models',
        ],
        nextStepNeeded: false,
      });

      expect(step5.currentStep).toBe(5);
      expect(step5.completed).toBe(true);
      expect(step5.insights).toBeDefined();
      expect(step5.insights?.length).toBeGreaterThan(0);
      expect(
        step5.insights?.some(i => i.includes('Collective Intelligence Orchestration completed'))
      ).toBe(true);
    });

    it('should handle complex wisdom source integration', async () => {
      const planId = await createPlan('Integrate global knowledge for pandemic preparedness', [
        'collective_intel',
      ]);

      const step1 = await executeStep(planId, {
        technique: 'collective_intel',
        problem: 'Integrate global knowledge for pandemic preparedness',
        currentStep: 1,
        totalSteps: 5,
        output: 'Comprehensive wisdom source integration',
        wisdomSources: [
          'WHO epidemiological data',
          'Traditional medicine practitioners',
          'Frontline healthcare workers',
          'Community health networks',
          'Behavioral science researchers',
          'Supply chain experts',
          'Public health historians',
        ],
        nextStepNeeded: true,
      });

      expect(step1.contextualInsight).toContain('7 wisdom sources');
    });

    it('should identify critical steps for pattern recognition and synergy', async () => {
      const planId = await createPlan('Create collective intelligence for education reform', [
        'collective_intel',
      ]);

      // Step 3 (emergent patterns) should be marked as critical
      const step3 = await executeStep(planId, {
        technique: 'collective_intel',
        problem: 'Create collective intelligence for education reform',
        currentStep: 3,
        totalSteps: 5,
        output: 'Identifying emergent patterns while avoiding bias',
        emergentPatterns: ['Learning style diversity', 'Technology access gaps'],
        risks: ['Pattern projection bias', 'Confirmation bias'],
        nextStepNeeded: true,
      });

      expect(step3.sessionId).toBeDefined();
      // Step 3 is a critical step for collective_intel

      // Step 4 (synergy) should also be critical
      const step4 = await executeStep(planId, {
        sessionId: step3.sessionId,
        technique: 'collective_intel',
        problem: 'Create collective intelligence for education reform',
        currentStep: 4,
        totalSteps: 5,
        output: 'Creating synergistic combinations',
        synergyCombinations: ['Peer learning + AI tutoring', 'Community + Digital resources'],
        risks: ['Forced synthesis', 'Oversimplification'],
        mitigations: ['Preserve nuance', 'Validate combinations'],
        nextStepNeeded: true,
      });

      expect(step4.sessionId).toBeDefined();
    });

    it('should generate memory-suggestive outputs for collective sessions', async () => {
      const planId = await createPlan('Build collective intelligence for sustainable innovation', [
        'collective_intel',
      ]);

      // Complete a full session
      const step1 = await executeStep(planId, {
        technique: 'collective_intel',
        problem: 'Build collective intelligence for sustainable innovation',
        currentStep: 1,
        totalSteps: 5,
        output: 'Gathered sources',
        wisdomSources: ['Scientists', 'Engineers', 'Communities', 'Policymakers'],
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'collective_intel',
        problem: 'Build collective intelligence for sustainable innovation',
        currentStep: 2,
        totalSteps: 5,
        output: 'Mapped landscape',
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'collective_intel',
        problem: 'Build collective intelligence for sustainable innovation',
        currentStep: 3,
        totalSteps: 5,
        output: 'Found patterns',
        emergentPatterns: ['Circular economy principles', 'Nature-based solutions'],
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'collective_intel',
        problem: 'Build collective intelligence for sustainable innovation',
        currentStep: 4,
        totalSteps: 5,
        output: 'Created synergies',
        synergyCombinations: ['Tech + Nature', 'Policy + Community'],
        nextStepNeeded: true,
      });

      const finalStep = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'collective_intel',
        problem: 'Build collective intelligence for sustainable innovation',
        currentStep: 5,
        totalSteps: 5,
        output: 'Synthesized intelligence',
        collectiveInsights: ['Regenerative design principles', 'Community-led innovation'],
        nextStepNeeded: false,
      });

      expect(finalStep.sessionFingerprint).toBeDefined();
      expect(finalStep.sessionFingerprint?.solutionPattern).toBeDefined();
      expect(finalStep.insights?.some(i => i.includes('Wisdom sources integrated'))).toBe(true);
    });
  });

  describe('Integration with Other Techniques', () => {
    it('should work well in combination with Cross-Cultural Integration', async () => {
      const planId = await createPlan('Create global collective intelligence for climate action', [
        'collective_intel',
        'cross_cultural',
      ]);

      // First gather collective intelligence
      const collectiveStep = await executeStep(planId, {
        technique: 'collective_intel',
        problem: 'Create global collective intelligence for climate action',
        currentStep: 1,
        totalSteps: 1,
        output: 'Collective intelligence gathered from diverse sources',
        wisdomSources: [
          'Scientific consensus',
          'Indigenous knowledge keepers',
          'Youth climate activists',
          'Industry innovators',
        ],
        emergentPatterns: ['Urgency + Hope', 'Local + Global action'],
        nextStepNeeded: false,
      });

      expect(collectiveStep.completed).toBe(true);

      // Then apply cross-cultural perspective
      const culturalStep = await executeStep(planId, {
        sessionId: collectiveStep.sessionId,
        technique: 'cross_cultural',
        problem: 'Create global collective intelligence for climate action',
        currentStep: 1,
        totalSteps: 1,
        output: 'Applied cultural frameworks to collective insights',
        culturalFrameworks: [
          'Western technological solutions',
          'Indigenous harmony with nature',
          'Eastern circular thinking',
        ],
        nextStepNeeded: false,
      });

      expect(culturalStep.sessionId).toBe(collectiveStep.sessionId);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing wisdom source data gracefully', async () => {
      const planId = await createPlan('Test collective intelligence', ['collective_intel']);

      // Execute without specific collective fields
      const result = await executeStep(planId, {
        technique: 'collective_intel',
        problem: 'Test collective intelligence',
        currentStep: 1,
        totalSteps: 5,
        output: 'Exploring collective intelligence without specific data',
        nextStepNeeded: true,
      });

      expect(result.technique).toBe('collective_intel');
      // Should not have contextual insight without wisdom source data
      expect(result.contextualInsight).toBeUndefined();
    });

    it('should validate synergy combinations are meaningful', async () => {
      const planId = await createPlan('Create collective solution', ['collective_intel']);

      // Skip to step 4 with synergy combinations
      const result = await executeStep(planId, {
        technique: 'collective_intel',
        problem: 'Create collective solution',
        currentStep: 4,
        totalSteps: 5,
        output: 'Created knowledge synergies',
        synergyCombinations: [
          'Expert analysis + Crowd validation',
          'Historical data + Real-time insights',
          'Quantitative metrics + Qualitative stories',
        ],
        nextStepNeeded: true,
      });

      expect(result.technique).toBe('collective_intel');
      expect(result.currentStep).toBe(4);
    });
  });
});
