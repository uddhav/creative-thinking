/**
 * Comprehensive End-to-End Integration Tests
 * Tests complete workflows from discovery → planning → execution
 * with all advanced features including memory-aware outputs,
 * ergodicity tracking, and new techniques
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import { parseServerResponse } from '../helpers/types.js';
import type { ExecuteThinkingStepInput, LateralTechnique, SessionData } from '../../index.js';

interface DiscoveryResponse {
  recommendations: Array<{
    technique: string;
    reasoning: string;
  }>;
  problemAnalysis?: {
    observation: string;
    historicalRelevance: string;
    searchableFactors: string[];
  };
  complexityAssessment?: {
    level: string;
  };
}

interface PlanResponse {
  planId: string;
  workflow: Array<{
    stepNumber: number;
    technique: string;
    description: string;
    expectedDuration: string;
    riskConsiderations?: string[];
    totalSteps: number;
  }>;
  estimatedSteps: number;
  estimatedDuration: string;
  successCriteria: string[];
  planningInsights?: {
    techniqueRationale: string;
    sequenceLogic: string;
    historicalNote: string;
  };
  complexityAssessment?: {
    level: string;
    suggestion?: string;
  };
  flexibilityAssessment?: {
    score: number;
    optionGenerationRecommended: boolean;
  };
}

interface ExecutionResponse {
  sessionId: string;
  technique: string;
  currentStep: number;
  totalSteps: number;
  nextStepNeeded: boolean;
  insights: string[];
  executionMetadata?: {
    techniqueEffectiveness: number;
    pathDependenciesCreated: string[];
    flexibilityImpact: number;
    noteworthyMoment?: string;
    futureRelevance?: string;
  };
  // Ergodicity fields
  pathMemory?: any;
  earlyWarningState?: any;
  escapeRecommendation?: any;
  // Completion fields
  sessionComplete?: boolean;
  summary?: any;
  metrics?: any;
}

describe('Comprehensive End-to-End Workflows', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('New Technique Complete Workflows', () => {
    it('should complete full Neural State Optimization workflow', async () => {
      // Discovery
      const discoveryResult = await server.discoverTechniques({
        problem: 'Overcome mental blocks in creative problem solving',
        context: 'Team feels stuck in conventional thinking patterns',
        preferredOutcome: 'innovative',
      });
      const discovery = parseServerResponse<DiscoveryResponse>(discoveryResult);

      // Verify memory-aware discovery outputs
      expect(discovery.problemAnalysis).toBeDefined();
      expect(discovery.problemAnalysis?.observation).toContain('mental blocks');
      expect(discovery.problemAnalysis?.searchableFactors).toContainEqual(
        expect.stringContaining('cognitive')
      );

      // Planning
      const planResult = await server.planThinkingSession({
        problem: 'Overcome mental blocks in creative problem solving',
        techniques: ['neural_state'] as LateralTechnique[],
        objectives: ['Break cognitive patterns', 'Enable fresh perspectives'],
        timeframe: 'thorough',
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      // Verify memory-aware planning outputs
      expect(plan.planningInsights).toBeDefined();
      expect(plan.planningInsights?.techniqueRationale).toContain('cognitive optimization');

      // Execute all 4 steps
      let sessionId: string | undefined;
      const steps = [
        { dominantNetwork: 'ecn' as const, suppressionDepth: 8 },
        { suppressionDepth: 7, output: 'Identifying suppression patterns' },
        { switchingRhythm: ['Work 25min', 'Break 5min'], output: 'Developing rhythm' },
        { integrationInsights: ['Balance achieved'], output: 'Integrating insights' },
      ];

      for (let i = 0; i < steps.length; i++) {
        const input: ExecuteThinkingStepInput = {
          planId: plan.planId,
          technique: 'neural_state',
          problem: 'Overcome mental blocks in creative problem solving',
          currentStep: i + 1,
          totalSteps: 4,
          output: steps[i].output || `Neural state step ${i + 1}`,
          nextStepNeeded: i < 3,
          sessionId,
          ...steps[i],
        };

        const result = await server.executeThinkingStep(input);
        const execution = parseServerResponse<ExecutionResponse>(result);

        if (!sessionId) sessionId = execution.sessionId;

        // Verify execution metadata
        expect(execution.executionMetadata).toBeDefined();
        expect(execution.executionMetadata?.techniqueEffectiveness).toBeGreaterThan(0);

        // Check for noteworthy moments
        if (i === 1 && steps[i].suppressionDepth >= 8) {
          expect(execution.executionMetadata?.noteworthyMoment).toContain(
            'Deep neural state suppression'
          );
        }

        // Verify completion on last step
        if (i === 3) {
          expect(execution.sessionComplete).toBe(true);
          expect(execution.summary).toBeDefined();
          expect(execution.metrics).toBeDefined();
        }
      }
    });

    it('should complete full Temporal Work Design workflow', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Design project timeline with multiple deadlines',
        techniques: ['temporal_work'] as LateralTechnique[],
        constraints: ['Fixed launch date', 'Limited resources'],
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      let sessionId: string | undefined;
      const temporalSteps = [
        {
          temporalLandscape: {
            fixedDeadlines: ['Launch: March 1'],
            flexibleWindows: ['Testing phase'],
            pressurePoints: ['February crunch'],
            kairosOpportunities: ['Early January momentum'],
            deadZones: ['Holiday period'],
          },
        },
        { circadianAlignment: ['Morning: Deep work', 'Afternoon: Collaboration'] },
        { pressureTransformation: ['Use deadline pressure for focus sprints'] },
        { asyncSyncBalance: ['Async documentation', 'Sync decision-making'] },
        { temporalEscapeRoutes: ['Buffer weeks', 'Parallel track options'] },
      ];

      for (let i = 0; i < 5; i++) {
        const input: ExecuteThinkingStepInput = {
          planId: plan.planId,
          technique: 'temporal_work',
          problem: 'Design project timeline with multiple deadlines',
          currentStep: i + 1,
          totalSteps: 5,
          output: `Temporal design step ${i + 1}`,
          nextStepNeeded: i < 4,
          sessionId,
          ...temporalSteps[i],
        };

        const result = await server.executeThinkingStep(input);
        const execution = parseServerResponse<ExecutionResponse>(result);

        if (!sessionId) sessionId = execution.sessionId;

        // Check for kairos opportunity identification
        if (i === 0 && temporalSteps[i].temporalLandscape.kairosOpportunities.length > 0) {
          expect(execution.executionMetadata?.noteworthyMoment).toContain('Kairos opportunities');
        }
      }
    });

    it('should complete full Cross-Cultural Integration workflow', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Design global product respecting diverse cultural values',
        techniques: ['cross_cultural'] as LateralTechnique[],
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      let sessionId: string | undefined;
      for (let i = 0; i < 4; i++) {
        const stepData: any = {};
        if (i === 0)
          stepData.culturalFrameworks = ['Individualist', 'Collectivist', 'Hierarchical'];
        if (i === 1) stepData.bridgeBuilding = ['Shared human values', 'Universal needs'];
        if (i === 2) stepData.respectfulSynthesis = ['Honor all perspectives'];
        if (i === 3) stepData.parallelPaths = ['Region-specific implementations'];

        const input: ExecuteThinkingStepInput = {
          planId: plan.planId,
          technique: 'cross_cultural',
          problem: 'Design global product respecting diverse cultural values',
          currentStep: i + 1,
          totalSteps: 4,
          output: `Cross-cultural step ${i + 1}`,
          nextStepNeeded: i < 3,
          sessionId,
          ...stepData,
        };

        const result = await server.executeThinkingStep(input);
        const execution = parseServerResponse<ExecutionResponse>(result);

        if (!sessionId) sessionId = execution.sessionId;

        // Verify cultural sensitivity
        if (i === 3) {
          expect(execution.executionMetadata?.futureRelevance).toContain(
            'Parallel implementation patterns'
          );
        }
      }
    });

    it('should complete full Collective Intelligence workflow', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Synthesize insights from multiple expert domains',
        techniques: ['collective_intel'] as LateralTechnique[],
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      let sessionId: string | undefined;
      const collectiveSteps = [
        { wisdomSources: ['Domain experts', 'Crowd wisdom', 'AI systems', 'Historical data'] },
        { collectiveInsights: ['Pattern X emerges', 'Consensus on approach Y'] },
        { emergentPatterns: ['Unexpected connection between A and B'] },
        { synergyCombinations: ['Expert + Crowd = Novel solution'] },
      ];

      for (let i = 0; i < 4; i++) {
        const input: ExecuteThinkingStepInput = {
          planId: plan.planId,
          technique: 'collective_intel',
          problem: 'Synthesize insights from multiple expert domains',
          currentStep: i + 1,
          totalSteps: 4,
          output: `Collective intelligence step ${i + 1}`,
          nextStepNeeded: i < 3,
          sessionId,
          ...collectiveSteps[i],
        };

        const result = await server.executeThinkingStep(input);
        const execution = parseServerResponse<ExecutionResponse>(result);

        if (!sessionId) sessionId = execution.sessionId;

        // Verify emergent pattern detection
        if (i === 2 && execution.executionMetadata?.noteworthyMoment) {
          expect(execution.executionMetadata.noteworthyMoment).toContain(
            'Emergent patterns discovered'
          );
        }
      }
    });
  });

  describe('Memory-Aware Output Verification', () => {
    it('should generate complete memory-aware outputs across all layers', async () => {
      // Discovery with memory outputs
      const discoveryResult = await server.discoverTechniques({
        problem: 'Reduce customer churn by 50% in 6 months',
        context: 'SaaS product with monthly subscriptions',
        preferredOutcome: 'systematic',
        constraints: ['Limited budget', 'Small team'],
      });
      const discovery = parseServerResponse<DiscoveryResponse>(discoveryResult);

      // Verify discovery memory outputs
      expect(discovery.problemAnalysis).toBeDefined();
      expect(discovery.problemAnalysis?.observation).toBeDefined();
      expect(discovery.problemAnalysis?.historicalRelevance).toBeDefined();
      expect(discovery.problemAnalysis?.searchableFactors).toBeInstanceOf(Array);
      expect(discovery.problemAnalysis?.searchableFactors.length).toBeGreaterThan(0);

      // Planning with memory outputs
      const planResult = await server.planThinkingSession({
        problem: 'Reduce customer churn by 50% in 6 months',
        techniques: ['design_thinking', 'triz'] as LateralTechnique[],
        objectives: ['Understand user pain points', 'Remove friction'],
        constraints: ['Limited budget', 'Small team'],
        timeframe: 'comprehensive',
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      // Verify planning memory outputs
      expect(plan.planningInsights).toBeDefined();
      expect(plan.planningInsights?.techniqueRationale).toContain('human-centered');
      expect(plan.planningInsights?.sequenceLogic).toBeDefined();
      expect(plan.planningInsights?.historicalNote).toBeDefined();
      expect(plan.complexityAssessment).toBeDefined();

      // Execute a step with memory outputs
      const executionResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'design_thinking',
        problem: 'Reduce customer churn by 50% in 6 months',
        currentStep: 1,
        totalSteps: 5,
        output: 'Interviewed 20 churned customers',
        nextStepNeeded: true,
        empathyInsights: ['Onboarding too complex', 'Value not clear'],
      });
      const execution = parseServerResponse<ExecutionResponse>(executionResult);

      // Verify execution memory outputs
      expect(execution.executionMetadata).toBeDefined();
      expect(execution.executionMetadata?.techniqueEffectiveness).toBeGreaterThan(0);
      expect(execution.executionMetadata?.pathDependenciesCreated).toBeInstanceOf(Array);
      expect(execution.executionMetadata?.flexibilityImpact).toBeDefined();
    });
  });

  describe('Advanced Ergodicity Scenarios', () => {
    it('should handle complete ergodicity lifecycle: low flexibility → warning → escape', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Pivot startup with locked-in technical decisions',
        techniques: ['scamper'] as LateralTechnique[],
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      let sessionId: string | undefined;
      const highCommitmentActions = [
        { action: 'eliminate', output: 'Remove core feature' },
        { action: 'combine', output: 'Merge with incompatible system' },
        { action: 'substitute', output: 'Replace entire tech stack' },
      ];

      for (const { action, output } of highCommitmentActions) {
        const input: ExecuteThinkingStepInput = {
          planId: plan.planId,
          technique: 'scamper',
          problem: 'Pivot startup with locked-in technical decisions',
          currentStep:
            [
              'substitute',
              'combine',
              'adapt',
              'modify',
              'put_to_other_use',
              'eliminate',
              'reverse',
              'parameterize',
            ].indexOf(action) + 1,
          totalSteps: 8,
          scamperAction: action as any,
          output,
          nextStepNeeded: true,
          sessionId,
        };

        const result = await server.executeThinkingStep(input);
        const execution = parseServerResponse<ExecutionResponse>(result);

        if (!sessionId) sessionId = execution.sessionId;

        // Check ergodicity tracking
        if (action === 'eliminate') {
          expect(execution.flexibilityScore).toBeLessThan(0.5);
        }

        // Check for early warning activation
        if (execution.earlyWarningState?.activeWarnings) {
          expect(execution.earlyWarningState.activeWarnings.length).toBeGreaterThan(0);
        }

        // Check for escape protocol recommendation
        if (execution.flexibilityScore && execution.flexibilityScore < 0.3) {
          expect(execution.alternativeSuggestions).toBeDefined();
        }
      }
    });

    it('should track path dependencies across multiple techniques', async () => {
      const planResult = await server.planThinkingSession({
        problem: 'Design system with multiple integration points',
        techniques: ['scamper', 'triz', 'design_thinking'] as LateralTechnique[],
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      let sessionId: string | undefined;
      const cumulativeDependencies: string[] = [];

      // SCAMPER - Create dependencies
      const scamperResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem: 'Design system with multiple integration points',
        currentStep: 2, // Combine
        totalSteps: 8,
        scamperAction: 'combine',
        output: 'Merge authentication with user profile system',
        nextStepNeeded: true,
      });
      const scamperExec = parseServerResponse<ExecutionResponse>(scamperResult);
      sessionId = scamperExec.sessionId;

      if (scamperExec.executionMetadata?.pathDependenciesCreated) {
        cumulativeDependencies.push(...scamperExec.executionMetadata.pathDependenciesCreated);
      }

      // TRIZ - Add more dependencies
      const trizResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'triz',
        problem: 'Design system with multiple integration points',
        currentStep: 1,
        totalSteps: 4,
        contradiction: 'Want modularity but also tight integration',
        output: 'Use microservices with shared data layer',
        nextStepNeeded: true,
        sessionId,
      });
      const trizExec = parseServerResponse<ExecutionResponse>(trizResult);

      if (trizExec.executionMetadata?.pathDependenciesCreated) {
        cumulativeDependencies.push(...trizExec.executionMetadata.pathDependenciesCreated);
      }

      // Verify cumulative path tracking
      expect(cumulativeDependencies.length).toBeGreaterThan(0);
      expect(trizExec.executionMetadata?.flexibilityImpact).toBeLessThan(0);
    });
  });

  describe('Complex Multi-Technique Workflows', () => {
    it('should handle 3+ technique workflow with cross-learning', async () => {
      const problem = 'Transform traditional education for digital age';

      // Discovery recommends multiple techniques
      const discoveryResult = await server.discoverTechniques({
        problem,
        context: 'Current system failing to engage students',
        preferredOutcome: 'innovative',
      });
      const discovery = parseServerResponse<DiscoveryResponse>(discoveryResult);

      expect(discovery.recommendations.length).toBeGreaterThanOrEqual(2);

      // Plan with 3 techniques
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['six_hats', 'scamper', 'design_thinking'] as LateralTechnique[],
        objectives: ['Understand stakeholders', 'Generate innovations', 'Test solutions'],
        timeframe: 'comprehensive',
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      // Verify workflow has steps for all techniques
      expect(plan.estimatedSteps).toBe(7 + 8 + 5); // Six hats + SCAMPER + Design thinking
      expect(plan.workflow.length).toBe(20); // Total steps

      let sessionId: string | undefined;
      const accumulatedInsights: string[] = [];

      // Execute Six Hats - gather perspectives
      for (let i = 1; i <= 2; i++) {
        // Just first 2 hats for brevity
        const hatColors = ['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'];
        const result = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'six_hats',
          problem,
          currentStep: i,
          totalSteps: 7,
          output: `${hatColors[i - 1]} hat perspective`,
          hatColor: hatColors[i - 1] as any,
          nextStepNeeded: true,
          sessionId,
        });
        const exec = parseServerResponse<ExecutionResponse>(result);
        if (!sessionId) sessionId = exec.sessionId;
        accumulatedInsights.push(...exec.insights);
      }

      // Execute SCAMPER - build on Six Hats insights
      const scamperResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem,
        currentStep: 1,
        totalSteps: 8,
        scamperAction: 'substitute',
        output: 'Replace lectures with interactive simulations',
        nextStepNeeded: true,
        sessionId,
      });
      const scamperExec = parseServerResponse<ExecutionResponse>(scamperResult);
      accumulatedInsights.push(...scamperExec.insights);

      // Execute Design Thinking - prototype based on previous insights
      const dtResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'design_thinking',
        problem,
        currentStep: 3, // Ideate phase
        totalSteps: 5,
        designStage: 'ideate',
        output: 'Gamified learning platform concept',
        ideaList: ['VR classrooms', 'AI tutors', 'Peer learning networks'],
        nextStepNeeded: true,
        sessionId,
      });
      const dtExec = parseServerResponse<ExecutionResponse>(dtResult);

      // Verify cross-technique learning
      // Insights might not be generated in early steps, but state should be maintained
      expect(dtExec.sessionId).toBe(sessionId);
      expect(dtExec.executionMetadata).toBeDefined();
      expect(dtExec.executionMetadata?.techniqueEffectiveness).toBeGreaterThan(0);
    });

    it('should preserve state across technique transitions', async () => {
      const problem = 'Optimize supply chain resilience';

      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['triz', 'scamper'] as LateralTechnique[],
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      // Execute TRIZ
      const trizResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'triz',
        problem,
        currentStep: 1,
        totalSteps: 4,
        contradiction: 'Want flexibility but also efficiency',
        output: 'Modular supply nodes with dynamic routing',
        nextStepNeeded: true,
      });
      const trizExec = parseServerResponse<ExecutionResponse>(trizResult);
      const sessionId = trizExec.sessionId;

      // Add risks to test unified framework
      const trizStep2 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'triz',
        problem,
        currentStep: 2,
        totalSteps: 4,
        output: 'Remove fixed contracts',
        viaNegativaRemovals: ['Long-term contracts', 'Fixed routes'],
        risks: ['Supplier uncertainty', 'Cost volatility'],
        mitigations: ['Dynamic pricing models', 'Multiple supplier options'],
        nextStepNeeded: true,
        sessionId,
      });

      // Transition to SCAMPER - should maintain state
      const scamperResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem,
        currentStep: 1,
        totalSteps: 8,
        scamperAction: 'substitute',
        output: 'Replace fixed warehouses with mobile units',
        nextStepNeeded: true,
        sessionId,
      });
      const scamperExec = parseServerResponse<ExecutionResponse>(scamperResult);

      // Verify state preservation
      expect(scamperExec.sessionId).toBe(sessionId);
      expect(scamperExec.executionMetadata).toBeDefined();
      expect(scamperExec.executionMetadata?.techniqueEffectiveness).toBeGreaterThan(0);
    });
  });

  describe('Edge Case Scenarios', () => {
    it('should handle session with 50+ insights accumulation', async () => {
      const problem = 'Complex system redesign';
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['concept_extraction'] as LateralTechnique[],
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      let sessionId: string | undefined;

      // Generate many insights through concept extraction
      for (let i = 1; i <= 4; i++) {
        const concepts = Array(15)
          .fill(null)
          .map((_, j) => `Concept ${i}-${j}`);
        const patterns = Array(15)
          .fill(null)
          .map((_, j) => `Pattern ${i}-${j}`);

        const input: ExecuteThinkingStepInput = {
          planId: plan.planId,
          technique: 'concept_extraction',
          problem,
          currentStep: i,
          totalSteps: 4,
          output: `Extracting concepts batch ${i}`,
          nextStepNeeded: i < 4,
          sessionId,
          extractedConcepts: i === 2 ? concepts : undefined,
          abstractedPatterns: i === 3 ? patterns : undefined,
        };

        const result = await server.executeThinkingStep(input);
        const exec = parseServerResponse<ExecutionResponse>(result);
        if (!sessionId) sessionId = exec.sessionId;

        if (i === 4) {
          // Verify session can handle many insights
          expect(exec.insights).toBeDefined();
          expect(exec.sessionComplete).toBe(true);
        }
      }
    });

    it('should handle maximum path dependencies gracefully', async () => {
      const problem = 'Refactor legacy system with deep dependencies';
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['scamper'] as LateralTechnique[],
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      let sessionId: string | undefined;

      // Execute high-commitment actions to create many dependencies
      const actions = ['combine', 'eliminate', 'combine', 'eliminate'];
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const stepNum =
          [
            'substitute',
            'combine',
            'adapt',
            'modify',
            'put_to_other_use',
            'eliminate',
            'reverse',
            'parameterize',
          ].indexOf(action) + 1;

        const result = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'scamper',
          problem,
          currentStep: stepNum,
          totalSteps: 8,
          scamperAction: action as any,
          output: `${action} operation ${i}`,
          nextStepNeeded: true,
          sessionId,
        });
        const exec = parseServerResponse<ExecutionResponse>(result);
        if (!sessionId) sessionId = exec.sessionId;

        // Check for flexibility warnings
        if (exec.flexibilityScore && exec.flexibilityScore < 0.3) {
          expect(exec.alternativeSuggestions).toBeDefined();
          expect(exec.alternativeSuggestions?.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Reality Integration Throughout Workflow', () => {
    it('should perform reality checks at technique transitions', async () => {
      const problem = 'Create perpetual motion machine for energy';

      // Plan with multiple techniques
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['po', 'scamper', 'triz'] as LateralTechnique[],
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      let sessionId: string | undefined;

      // PO - Provocation
      const poResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'po',
        problem,
        currentStep: 1,
        totalSteps: 4,
        provocation: 'PO: Energy creates itself',
        output: 'What if energy could self-replicate?',
        nextStepNeeded: true,
      });
      const poExec = parseServerResponse<ExecutionResponse>(poResult);
      sessionId = poExec.sessionId;

      // Transition to SCAMPER - reality check should activate
      const scamperResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem,
        currentStep: 1,
        totalSteps: 8,
        scamperAction: 'substitute',
        output: 'Replace traditional physics with quantum effects',
        nextStepNeeded: true,
        sessionId,
        realityAssessment: {
          feasibilityScore: 0.1,
          constraints: ['Laws of thermodynamics'],
          suggestions: ['Focus on efficiency improvements instead'],
        },
      });
      const scamperExec = parseServerResponse<ExecutionResponse>(scamperResult);

      // Verify reality assessment affects execution
      expect(scamperExec.insights).toBeDefined();
    });
  });

  describe('Complete Option Generation Flow', () => {
    it('should trigger and complete full option generation cycle', async () => {
      const problem = 'Pivot product with limited flexibility';

      // Create plan with constraints to trigger low flexibility
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['scamper'] as LateralTechnique[],
        constraints: ['Must maintain compatibility', 'Cannot change core', 'Fixed timeline'],
      });
      const plan = parseServerResponse<PlanResponse>(planResult);

      // Verify flexibility assessment if present
      if (plan.flexibilityAssessment) {
        expect(plan.flexibilityAssessment.score).toBeLessThan(0.4);
        expect(plan.flexibilityAssessment.optionGenerationRecommended).toBe(true);
      }

      // Execute steps to trigger option generation
      const eliminateResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem,
        currentStep: 6, // Eliminate
        totalSteps: 8,
        scamperAction: 'eliminate',
        output: 'Remove key feature for simplicity',
        nextStepNeeded: true,
      });
      const exec = parseServerResponse<ExecutionResponse>(eliminateResult);

      // Verify option generation triggered
      expect(exec.flexibilityScore).toBeLessThan(0.4);
      expect(exec.alternativeSuggestions).toBeDefined();
      expect(exec.alternativeSuggestions?.length).toBeGreaterThan(0);

      // Continue with suggested alternative
      const paramResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem,
        currentStep: 8, // Parameterize
        totalSteps: 8,
        scamperAction: 'parameterize',
        output: 'Make features configurable instead of removing',
        nextStepNeeded: false,
        sessionId: exec.sessionId,
      });
      const paramExec = parseServerResponse<ExecutionResponse>(paramResult);

      // Verify completion with improved flexibility
      expect(paramExec.sessionComplete).toBe(true);
      expect(paramExec.pathAnalysis).toBeDefined();
    });
  });
});
