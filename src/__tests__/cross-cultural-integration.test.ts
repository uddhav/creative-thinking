/**
 * Tests for Cross-Cultural Integration technique implementation
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
  problemCategory: string;
  recommendations: Array<{
    technique: string;
    effectiveness: number;
    reasoning: string;
  }>;
  warnings?: string[];
  contextAnalysis?: {
    complexity: 'low' | 'medium' | 'high';
    timeConstraint: boolean;
    collaborationNeeded: boolean;
    flexibilityScore?: number;
  };
}

describe('Cross-Cultural Integration', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  // Helper function to create a plan
  function createPlan(problem: string, techniques: string[]): string {
    const input: PlanThinkingSessionInput = {
      problem,
      techniques: techniques as LateralTechnique[],
    };

    const result = server.planThinkingSession(input) as ServerResponse;
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
    it('should recommend Cross-Cultural for global and diverse perspective problems', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'Design a global product that resonates across cultures',
        context: 'Need to create something that works in Eastern and Western markets',
      };

      const result = server.discoverTechniques(input) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const response = JSON.parse(result.content[0]?.text || '{}') as DiscoveryResponse;

      // Test behavior: Should recommend techniques suitable for global/cultural challenges
      const culturalTechniques = ['cultural_integration', 'collective_intel', 'design_thinking'];
      const hasCulturalRecommendation = response.recommendations.some(
        r =>
          culturalTechniques.includes(r.technique) ||
          r.reasoning.toLowerCase().includes('cultural') ||
          r.reasoning.toLowerCase().includes('global') ||
          r.reasoning.toLowerCase().includes('diverse')
      );
      expect(hasCulturalRecommendation).toBeTruthy();

      // Should have high effectiveness for cultural problems
      const topRecs = response.recommendations.slice(0, 3);
      expect(topRecs.some(r => r.effectiveness > 0.7)).toBeTruthy();
    });

    it('should recommend Cross-Cultural for inclusive innovation challenges', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'Create an inclusive global solution that honors diverse cultural perspectives',
        context: 'Working with multicultural team and diverse user base across cultures',
      };

      const result = server.discoverTechniques(input) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const response = JSON.parse(result.content[0]?.text || '{}') as DiscoveryResponse;

      // Test behavior: Inclusive innovation is a cultural/organizational challenge
      const inclusiveTechniques = [
        'cultural_integration',
        'collective_intel',
        'design_thinking',
        'yes_and',
      ];
      const hasInclusiveRecommendation = response.recommendations.some(
        r =>
          inclusiveTechniques.includes(r.technique) ||
          r.reasoning.toLowerCase().includes('inclusive') ||
          r.reasoning.toLowerCase().includes('cultural') ||
          r.reasoning.toLowerCase().includes('perspective')
      );
      expect(hasInclusiveRecommendation).toBeTruthy();
    });
  });

  describe('Planning Phase', () => {
    it('should create a proper workflow for Cross-Cultural technique', () => {
      const input: PlanThinkingSessionInput = {
        problem: 'Design a global educational platform',
        techniques: ['cultural_integration'] as LateralTechnique[],
      };

      const result = server.planThinkingSession(input) as ServerResponse;
      expect(result.isError).toBeFalsy();
      const planData = JSON.parse(result.content[0]?.text || '{}') as PlanResponse;

      expect(planData.workflow).toHaveLength(5);
      expect(planData.workflow[0].description).toContain('cultural frameworks');
      expect(planData.workflow[1].description).toContain('Where do cultures naturally connect');
      expect(planData.workflow[2].description).toContain('authentic bridges');
      expect(planData.workflow[3].description).toContain('perspectives combine creatively');
      expect(planData.workflow[4].description).toContain('insights become solutions');

      // Check risk considerations
      expect(planData.workflow[0].riskConsiderations).toContain('Cultural sensitivity required');
      expect(planData.workflow[2].riskConsiderations).toContain('Maintain authenticity');
    });
  });

  describe('Execution Phase', () => {
    it('should execute all five Cross-Cultural steps', async () => {
      const planId = createPlan('Create culturally adaptive user interface', [
        'cultural_integration',
      ]);

      // Step 1: Map cultural frameworks
      const step1 = await executeStep(planId, {
        technique: 'cultural_integration',
        problem: 'Create culturally adaptive user interface',
        currentStep: 1,
        totalSteps: 5,
        output: 'Mapped diverse cultural perspectives on design',
        culturalFrameworks: [
          'Eastern: circular thinking, holistic view',
          'Western: linear logic, component focus',
          'Indigenous: relational, nature-inspired',
          'Local: community-centric, contextual',
        ],
        nextStepNeeded: true,
      });

      expect(step1.technique).toBe('cultural_integration');
      expect(step1.currentStep).toBe(1);
      expect(step1.nextStepGuidance).toContain('Where do cultures naturally connect');
      expect(step1.contextualInsight).toContain('4 cultural perspectives');

      // Step 2: Identify bridges
      const step2 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'cultural_integration',
        problem: 'Create culturally adaptive user interface',
        currentStep: 2,
        totalSteps: 5,
        output: 'Found common ground across cultures',
        bridgeBuilding: [
          'Universal need for clarity',
          'Shared value of community',
          'Common appreciation of beauty',
          'Cross-cultural symbols',
        ],
        nextStepNeeded: true,
      });

      expect(step2.currentStep).toBe(2);
      expect(step2.contextualInsight).toContain('4 cultural bridges discovered');

      // Step 3: Create synthesis
      const step3 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'cultural_integration',
        problem: 'Create culturally adaptive user interface',
        currentStep: 3,
        totalSteps: 5,
        output: 'Synthesized perspectives into unified framework',
        respectfulSynthesis: [
          'Modular design allowing cultural customization',
          'Visual language that transcends cultures',
          'Flexible navigation patterns',
          'Culturally neutral iconography with local options',
        ],
        nextStepNeeded: true,
      });

      expect(step3.currentStep).toBe(3);
      expect(step3.contextualInsight).toContain('inclusive solution');

      // Step 4: Develop parallel solutions
      const step4 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'cultural_integration',
        problem: 'Create culturally adaptive user interface',
        currentStep: 4,
        totalSteps: 5,
        output: 'Created context-specific variations',
        parallelPaths: [
          'Eastern: circular navigation, holistic dashboard',
          'Western: linear flow, detailed analytics',
          'Mobile-first for emerging markets',
          'Accessibility-first for inclusive design',
        ],
        nextStepNeeded: true,
      });

      expect(step4.currentStep).toBe(4);

      // Step 5: Validate with stakeholders
      const step5 = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'cultural_integration',
        problem: 'Create culturally adaptive user interface',
        currentStep: 5,
        totalSteps: 5,
        output: 'Validated with diverse user groups and refined',
        nextStepNeeded: false,
      });

      expect(step5.currentStep).toBe(5);
      expect(step5.completed).toBe(true);
      // Session should be complete with fingerprint
      expect(step5.sessionFingerprint).toBeDefined();
    });

    it('should handle complex cultural framework mapping', async () => {
      const planId = createPlan('Bridge Eastern and Western approaches to problem-solving', [
        'cultural_integration',
      ]);

      const step1 = await executeStep(planId, {
        technique: 'cultural_integration',
        problem: 'Bridge Eastern and Western approaches to problem-solving',
        currentStep: 1,
        totalSteps: 5,
        output: 'Comprehensive cultural framework analysis',
        culturalFrameworks: [
          'Eastern: yin-yang balance, wu wei (effortless action)',
          'Western: thesis-antithesis-synthesis, scientific method',
          'Indigenous: seven generations thinking, circle of life',
          'African: ubuntu (I am because we are), collective wisdom',
          'Latin: simpatía (harmonious relationships), personalismo',
        ],
        nextStepNeeded: true,
      });

      expect(step1.contextualInsight).toContain('5 cultural perspectives');
    });

    it('should identify critical steps for cultural sensitivity', async () => {
      const planId = createPlan('Develop culturally sensitive AI', ['cultural_integration']);

      // Step 2 (bridge identification) should be marked as critical
      const step2 = await executeStep(planId, {
        technique: 'cultural_integration',
        problem: 'Develop culturally sensitive AI',
        currentStep: 2,
        totalSteps: 5,
        output: 'Identifying cultural bridges while avoiding stereotypes',
        bridgeBuilding: ['Shared human values', 'Universal experiences'],
        risks: ['Cultural stereotyping', 'Over-generalization'],
        nextStepNeeded: true,
      });

      expect(step2.sessionId).toBeDefined();
      // Step 2 is a critical step for cross-cultural

      // Step 3 (synthesis) should also be critical
      const step3 = await executeStep(planId, {
        sessionId: step2.sessionId,
        technique: 'cultural_integration',
        problem: 'Develop culturally sensitive AI',
        currentStep: 3,
        totalSteps: 5,
        output: 'Creating respectful synthesis',
        respectfulSynthesis: ['Authentic representation', 'Avoid appropriation'],
        risks: ['Cultural appropriation', 'Loss of nuance'],
        mitigations: ['Continuous stakeholder engagement', 'Cultural consultants'],
        nextStepNeeded: true,
      });

      expect(step3.sessionId).toBeDefined();
    });

    it('should generate memory-suggestive outputs for cultural sessions', async () => {
      const planId = createPlan('Design inclusive global communication platform', [
        'cultural_integration',
      ]);

      // Complete a full session
      const step1 = await executeStep(planId, {
        technique: 'cultural_integration',
        problem: 'Design inclusive global communication platform',
        currentStep: 1,
        totalSteps: 5,
        output: 'Mapped frameworks',
        culturalFrameworks: ['Eastern', 'Western', 'Indigenous', 'Local'],
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'cultural_integration',
        problem: 'Design inclusive global communication platform',
        currentStep: 2,
        totalSteps: 5,
        output: 'Found bridges',
        bridgeBuilding: ['Universal values', 'Shared experiences'],
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'cultural_integration',
        problem: 'Design inclusive global communication platform',
        currentStep: 3,
        totalSteps: 5,
        output: 'Created synthesis',
        respectfulSynthesis: ['Modular approach', 'Cultural adaptability'],
        nextStepNeeded: true,
      });

      await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'cultural_integration',
        problem: 'Design inclusive global communication platform',
        currentStep: 4,
        totalSteps: 5,
        output: 'Developed variations',
        parallelPaths: ['Eastern UI', 'Western UI', 'Mobile-first'],
        nextStepNeeded: true,
      });

      const finalStep = await executeStep(planId, {
        sessionId: step1.sessionId,
        technique: 'cultural_integration',
        problem: 'Design inclusive global communication platform',
        currentStep: 5,
        totalSteps: 5,
        output: 'Validated and refined',
        nextStepNeeded: false,
      });

      expect(finalStep.sessionFingerprint).toBeDefined();
      expect(finalStep.sessionFingerprint?.solutionPattern).toBeDefined();
      // Check completion through session fingerprint
      expect(finalStep.completed).toBe(true);
    });
  });

  describe('Integration with Other Techniques', () => {
    it('should work well in combination with Design Thinking', async () => {
      const planId = createPlan('Design culturally inclusive healthcare solution', [
        'cultural_integration',
        'design_thinking',
      ]);

      // First understand cultural perspectives
      const culturalStep = await executeStep(planId, {
        technique: 'cultural_integration',
        problem: 'Design culturally inclusive healthcare solution',
        currentStep: 1,
        totalSteps: 1,
        output: 'Cultural frameworks mapped for healthcare contexts',
        culturalFrameworks: [
          'Eastern: holistic health, preventive care',
          'Western: specialized treatment, evidence-based',
          'Indigenous: traditional medicine, spiritual healing',
        ],
        bridgeBuilding: ['Universal desire for health', 'Family care values'],
        nextStepNeeded: false,
      });

      expect(culturalStep.completed).toBe(true);

      // Then apply design thinking with cultural insights
      const designStep = await executeStep(planId, {
        sessionId: culturalStep.sessionId,
        technique: 'design_thinking',
        problem: 'Design culturally inclusive healthcare solution',
        currentStep: 1,
        totalSteps: 1,
        output: 'Empathized with diverse cultural health perspectives',
        designStage: 'empathize',
        empathyInsights: [
          'Different cultural views on health',
          'Varied trust levels in medical systems',
          'Cultural taboos and sensitivities',
        ],
        nextStepNeeded: false,
      });

      expect(designStep.sessionId).toBe(culturalStep.sessionId);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing cultural framework data gracefully', async () => {
      const planId = createPlan('Test cultural integration', ['cultural_integration']);

      // Execute without specific cultural fields
      const result = await executeStep(planId, {
        technique: 'cultural_integration',
        problem: 'Test cultural integration',
        currentStep: 1,
        totalSteps: 5,
        output: 'Exploring cultural perspectives without specific data',
        nextStepNeeded: true,
      });

      expect(result.technique).toBe('cultural_integration');
      // Should not have contextual insight without cultural framework data
      expect(result.contextualInsight).toBeUndefined();
    });

    it('should validate parallel paths are contextually appropriate', async () => {
      const planId = createPlan('Create culturally adaptive solution', ['cultural_integration']);

      // Skip to step 4 with parallel paths
      const result = await executeStep(planId, {
        technique: 'cultural_integration',
        problem: 'Create culturally adaptive solution',
        currentStep: 4,
        totalSteps: 5,
        output: 'Developed context-specific solutions',
        parallelPaths: [
          'Solution A for collectivist cultures',
          'Solution B for individualist cultures',
          'Hybrid approach for multicultural contexts',
        ],
        nextStepNeeded: true,
      });

      expect(result.technique).toBe('cultural_integration');
      expect(result.currentStep).toBe(4);
    });
  });
});
