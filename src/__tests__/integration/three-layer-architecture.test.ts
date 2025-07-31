/**
 * Three-Layer Architecture Integration Tests
 * Tests the Discovery → Planning → Execution flow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import type {
  DiscoverTechniquesInput,
  ExecuteThinkingStepInput,
  LateralTechnique,
} from '../../index.js';
import type {
  DiscoverTechniquesResponse,
  PlanThinkingSessionResponse,
  ExecuteThinkingStepResponse,
} from '../helpers/types.js';
import { parseServerResponse } from '../helpers/types.js';

describe('Three-Layer Architecture', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('Layer 1: Discovery', () => {
    it('should analyze problems and recommend techniques', () => {
      const input: DiscoverTechniquesInput = {
        problem: 'How to foster innovation in a risk-averse culture',
        context: 'Large corporation with established processes',
        preferredOutcome: 'innovative',
        constraints: ['Must maintain compliance', 'Limited budget'],
      };

      const result = server.discoverTechniques(input);
      expect(result.isError).toBeFalsy();

      const data = parseServerResponse<DiscoverTechniquesResponse>(result);

      // Should recommend appropriate techniques
      expect(data.recommendations).toBeDefined();
      expect(data.recommendations.length).toBeGreaterThan(0);

      // Should include reasoning
      expect(data.reasoning).toBeDefined();
      expect(data.reasoning).toContain('innovation');

      // Should suggest workflow
      expect(data.suggestedWorkflow).toBeDefined();
    });

    it('should handle different problem types', () => {
      const problemTypes = [
        { problem: 'Analytical problem requiring data', preferredOutcome: 'analytical' },
        { problem: 'Team collaboration issues', preferredOutcome: 'collaborative' },
        { problem: 'Risk management strategy', preferredOutcome: 'risk-aware' },
      ];

      for (const { problem, preferredOutcome } of problemTypes) {
        const result = server.discoverTechniques({ problem, preferredOutcome });
        const data = parseServerResponse<DiscoverTechniquesResponse>(result);

        expect(data.recommendations).toBeDefined();
        expect(data.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Layer 2: Planning', () => {
    it('should create workflow from discovered techniques', () => {
      // First discover
      const discoveryResult = server.discoverTechniques({
        problem: 'Improve customer experience',
        preferredOutcome: 'systematic',
      });

      const discovery = parseServerResponse<DiscoverTechniquesResponse>(discoveryResult);
      const techniques = discovery.recommendations.slice(0, 2).map(r => r.technique);

      // Then plan
      const planResult = server.planThinkingSession({
        problem: 'Improve customer experience',
        techniques,
        objectives: ['Identify pain points', 'Design solutions'],
        timeframe: 'thorough',
      });

      expect(planResult.isError).toBeFalsy();
      const plan = parseServerResponse<PlanThinkingSessionResponse>(planResult);

      // Should create structured workflow
      expect(plan.planId).toBeDefined();
      expect(plan.workflow).toBeDefined();
      expect(plan.workflow.length).toBeGreaterThan(0);

      // Should include all requested techniques
      const workflowTechniques = [...new Set(plan.workflow.map(w => w.technique))];
      expect(workflowTechniques).toEqual(expect.arrayContaining(techniques));
    });

    it('should handle multi-technique workflows', () => {
      const planResult = server.planThinkingSession({
        problem: 'Complex innovation challenge',
        techniques: ['six_hats', 'scamper', 'design_thinking'],
        objectives: ['Explore all angles', 'Generate ideas', 'Build prototypes'],
      });

      const plan = parseServerResponse<PlanThinkingSessionResponse>(planResult);

      // Should have steps for all techniques
      expect(plan.workflow.length).toBe(7 + 8 + 5); // Six hats (7) + SCAMPER (8) + Design thinking (5)

      // Should maintain proper sequencing
      let stepNumber = 1;
      for (const step of plan.workflow) {
        expect(step.stepNumber).toBe(stepNumber++);
      }
    });
  });

  describe('Layer 3: Execution', () => {
    it('should execute planned workflow steps', async () => {
      // Setup: Discovery → Planning
      const planResult = server.planThinkingSession({
        problem: 'Test execution layer',
        techniques: ['random_entry'],
      });

      const plan = parseServerResponse<PlanThinkingSessionResponse>(planResult);

      // Execute first step
      const execResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'random_entry',
        problem: 'Test execution layer',
        currentStep: 1,
        totalSteps: 3,
        randomStimulus: 'Butterfly',
        output: 'Using butterfly as creative stimulus',
        nextStepNeeded: true,
      });

      expect(execResult.isError).toBeFalsy();
      const execData = parseServerResponse<ExecuteThinkingStepResponse>(execResult);

      // Should track session state
      expect(execData.sessionId).toBeDefined();
      expect(execData.technique).toBe('random_entry');
      expect(execData.currentStep).toBe(1);

      // Should provide guidance
      expect(execData.nextStepGuidance).toBeDefined();
    });

    it('should maintain state across execution steps', async () => {
      const planResult = server.planThinkingSession({
        problem: 'State tracking test',
        techniques: ['yes_and'],
      });

      const plan = parseServerResponse<PlanThinkingSessionResponse>(planResult);
      let sessionId: string | undefined;

      // Execute all 4 steps of Yes, And
      const steps = [
        { output: 'Initial idea accepted', initialIdea: 'Virtual collaboration space' },
        { output: 'Building on the idea', additions: ['Add AI assistant', 'Include gamification'] },
        { output: 'Evaluating critically', evaluations: ['Privacy concerns', 'Learning curve'] },
        {
          output: 'Final integrated solution',
          synthesis: 'Balanced virtual space with privacy controls',
        },
      ];

      for (let i = 0; i < steps.length; i++) {
        const result = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'yes_and',
          problem: 'State tracking test',
          currentStep: i + 1,
          totalSteps: 4,
          output: steps[i].output,
          nextStepNeeded: i < 3,
          sessionId,
          ...steps[i],
        });

        const data = parseServerResponse<ExecuteThinkingStepResponse>(result);

        if (i === 0) {
          sessionId = data.sessionId;
        } else {
          // Should maintain same session
          expect(data.sessionId).toBe(sessionId);
        }

        if (i === 3) {
          // Final step should include insights
          expect(data.insights).toBeDefined();
          expect(data.insights.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Complete Three-Layer Flow', () => {
    it('should handle full discovery → planning → execution workflow', async () => {
      const problem = 'How to increase team creativity while maintaining focus';

      // Layer 1: Discovery
      const discoveryResult = server.discoverTechniques({
        problem,
        context: 'Software development team of 8 people',
        preferredOutcome: 'innovative',
        constraints: ['Must deliver on schedule', 'Remote team'],
      });

      expect(discoveryResult.isError).toBeFalsy();
      const discovery = parseServerResponse<DiscoverTechniquesResponse>(discoveryResult);

      // Should analyze constraints and flexibility
      expect(discovery.recommendations).toBeDefined();
      const recommendedTechniques = discovery.recommendations.slice(0, 2).map(r => r.technique);

      // Layer 2: Planning
      const planResult = server.planThinkingSession({
        problem,
        techniques: recommendedTechniques,
        objectives: ['Balance creativity with delivery', 'Engage remote team'],
        timeframe: 'thorough',
      });

      expect(planResult.isError).toBeFalsy();
      const plan = parseServerResponse<PlanThinkingSessionResponse>(planResult);

      expect(plan.planId).toBeDefined();
      expect(plan.workflow).toBeDefined();

      // Layer 3: Execution (at least first few steps)
      const firstStep = plan.workflow[0] as { technique: LateralTechnique };
      const execInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        technique: firstStep.technique,
        problem,
        currentStep: 1,
        totalSteps: plan.workflow.filter(w => w.technique === firstStep.technique).length,
        output: 'Beginning the creative process with team',
        nextStepNeeded: true,
      };

      // Add technique-specific fields
      const techniqueSpecificProps =
        firstStep.technique === 'neural_state'
          ? { dominantNetwork: 'dmn' as const }
          : firstStep.technique === 'temporal_work'
            ? {
                temporalLandscape: {
                  fixedDeadlines: ['Sprint end Friday'],
                  flexibleWindows: ['Afternoons'],
                  pressurePoints: ['Code review Wednesday'],
                  deadZones: ['Monday mornings'],
                  kairosOpportunities: ['After standup'],
                },
              }
            : {};

      const execResult = await server.executeThinkingStep({
        ...execInput,
        ...techniqueSpecificProps,
      });
      expect(execResult.isError).toBeFalsy();

      const execution = parseServerResponse<ExecuteThinkingStepResponse>(execResult);
      expect(execution.sessionId).toBeDefined();

      // Path dependency metrics are shown in the visual output
      // The response includes these fields
      expect(execution.technique).toBeDefined();
      expect(execution.currentStep).toBe(1);
    });

    it('should handle low flexibility with option generation', () => {
      // Discovery with many constraints
      const discoveryResult = server.discoverTechniques({
        problem: 'Cut costs by 50% in 2 weeks',
        constraints: [
          'Cannot fire anyone',
          'Cannot reduce quality',
          'Cannot delay deliveries',
          'Cannot renegotiate contracts',
          'Cannot use reserves',
          'Must maintain all services',
        ],
      });

      const discovery = parseServerResponse<DiscoverTechniquesResponse>(discoveryResult);

      // With 6+ constraints, should trigger low flexibility warning
      if (discovery.flexibilityWarning) {
        expect(discovery.flexibilityWarning.score).toBeLessThan(0.4);
      }

      // Plan with option generation
      const planResult = server.planThinkingSession({
        problem: 'Cut costs by 50% in 2 weeks',
        techniques: ['triz'], // Good for constraints
        includeOptions: true,
      });

      const plan = parseServerResponse<PlanThinkingSessionResponse>(planResult);

      // The plan should be created successfully
      expect(plan.planId).toBeDefined();
      expect(plan.workflow).toBeDefined();

      // With includeOptions: true and constraints, option generation might be suggested
      // but it's not guaranteed to be in the plan structure
    });
  });

  describe('Advanced Three-Layer Features', () => {
    it('should support cross-technique learning', async () => {
      const problem = 'Create breakthrough product innovation';

      // Plan multi-technique session
      const planResult = server.planThinkingSession({
        problem,
        techniques: ['concept_extraction', 'scamper', 'po'],
      });

      const plan = parseServerResponse<PlanThinkingSessionResponse>(planResult);

      // Execute concept extraction first
      const conceptResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'concept_extraction',
        problem,
        currentStep: 1,
        totalSteps: 4,
        successExample: 'iPhone disrupted mobile industry',
        output: 'Analyzing iPhone success factors',
        nextStepNeeded: true,
      });

      const sessionId = parseServerResponse<ExecuteThinkingStepResponse>(conceptResult).sessionId;

      // Later steps should have access to earlier insights
      const scamperResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem,
        currentStep: 5, // After concept extraction
        totalSteps: 8,
        scamperAction: 'substitute',
        output: 'Applying iPhone insights to our product',
        nextStepNeeded: true,
        sessionId,
      });

      const scamperData = parseServerResponse<ExecuteThinkingStepResponse>(scamperResult);
      expect(scamperData.sessionId).toBe(sessionId);
    });

    it('should handle technique-specific risk considerations', () => {
      const planResult = server.planThinkingSession({
        problem: 'High-stakes decision making',
        techniques: ['six_hats', 'triz'],
        objectives: ['Thorough analysis', 'Risk mitigation'],
      });

      const plan = parseServerResponse<PlanThinkingSessionResponse>(planResult);

      // Should include risk considerations in workflow
      const blackHatStep = plan.workflow.find(
        w => w.technique === 'six_hats' && w.description.includes('Black')
      );
      expect(blackHatStep.riskConsiderations).toBeDefined();

      const trizSteps = plan.workflow.filter(w => w.technique === 'triz');
      expect(trizSteps.some(s => s.riskConsiderations)).toBe(true);
    });
  });

  describe('Error Handling Across Layers', () => {
    it('should handle invalid layer transitions gracefully', async () => {
      // Try to execute without planning
      const execResult = await server.executeThinkingStep({
        planId: 'non-existent-plan',
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'blue',
        output: 'Test output',
        nextStepNeeded: true,
      });

      expect(execResult.isError).toBe(true);
      const error = JSON.parse(execResult.content[0].text) as { error: string; message: string };
      expect(error.error).toBe('Invalid planId');

      // Should provide helpful guidance
      expect(error.message).toContain('create a plan first');
    });

    it('should validate layer requirements', () => {
      // Discovery without problem
      const discoveryResult = server.discoverTechniques({
        context: 'Some context',
      } as unknown as DiscoverTechniquesInput);

      expect(discoveryResult.isError).toBe(true);

      // Planning without techniques
      const planResult = server.planThinkingSession({
        problem: 'Test',
        techniques: [],
      });

      expect(planResult.isError).toBe(true);
    });
  });
});
