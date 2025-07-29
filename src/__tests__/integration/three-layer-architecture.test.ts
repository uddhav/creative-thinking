/**
 * Integration tests for the three-layer architecture
 * Tests the complete flow: Discovery -> Planning -> Execution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import type {
  DiscoverTechniquesInput,
  PlanThinkingSessionInput,
  ExecuteThinkingStepInput,
  LateralTechnique,
} from '../../index.js';

describe('Three-Layer Architecture Integration', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('Complete Three-Layer Flow', () => {
    it('should execute full discovery -> planning -> execution workflow', async () => {
      // Layer 1: Discovery
      const discoveryInput: DiscoverTechniquesInput = {
        problem: 'How to improve team collaboration in remote settings',
        context: 'Team of 15 people across 3 time zones, using Slack and Zoom',
        preferredOutcome: 'collaborative',
        constraints: ['Limited budget', 'Different time zones', 'Varying tech skills'],
      };

      const discoveryResult = await server.discoverTechniques(discoveryInput);
      expect(discoveryResult.isError).toBe(false);

      const discovery = JSON.parse(discoveryResult.content[0].text);
      expect(discovery.recommendedTechniques).toBeDefined();
      expect(discovery.recommendedTechniques.length).toBeGreaterThan(0);
      expect(discovery.reasoning).toBeDefined();
      expect(discovery.alternativeApproaches).toBeDefined();

      // Should recommend collaborative techniques
      const recommendedTechniques = discovery.recommendedTechniques;
      expect(recommendedTechniques).toContain('yes_and');

      // Layer 2: Planning
      const planInput: PlanThinkingSessionInput = {
        problem: discoveryInput.problem,
        techniques: recommendedTechniques.slice(0, 2), // Use first 2 recommended
        objectives: ['Build team cohesion', 'Improve async communication'],
        constraints: discoveryInput.constraints,
        timeframe: 'thorough',
      };

      const planResult = await server.planThinkingSession(planInput);
      expect(planResult.isError).toBe(false);

      const plan = JSON.parse(planResult.content[0].text);
      expect(plan.planId).toBeDefined();
      expect(plan.workflow).toBeDefined();
      expect(plan.workflow.length).toBeGreaterThan(0);
      expect(plan.estimatedDuration).toBeDefined();
      expect(plan.successCriteria).toBeDefined();

      // Layer 3: Execution
      let sessionId: string | undefined;
      const firstTechnique = plan.workflow[0];

      // Execute first step
      const execInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        technique: firstTechnique.technique,
        problem: planInput.problem,
        currentStep: 1,
        totalSteps: firstTechnique.totalSteps,
        output: 'Starting collaborative problem-solving process',
        nextStepNeeded: true,
      };

      // Add technique-specific fields
      if (firstTechnique.technique === 'yes_and') {
        execInput.initialIdea = 'Create virtual coffee breaks for spontaneous conversations';
      } else if (firstTechnique.technique === 'six_hats') {
        execInput.hatColor = 'blue';
      }

      const execResult = await server.executeThinkingStep(execInput);
      expect(execResult.isError).toBe(false);

      const execution = JSON.parse(execResult.content[0].text);
      expect(execution.sessionId).toBeDefined();
      expect(execution.technique).toBe(firstTechnique.technique);
      expect(execution.currentStep).toBe(1);
      expect(execution.guidance).toBeDefined();

      sessionId = execution.sessionId;

      // Continue execution
      const exec2Input: ExecuteThinkingStepInput = {
        planId: plan.planId,
        technique: firstTechnique.technique,
        problem: planInput.problem,
        currentStep: 2,
        totalSteps: firstTechnique.totalSteps,
        output: 'Building on initial ideas with team input',
        nextStepNeeded: firstTechnique.totalSteps > 2,
        sessionId,
      };

      if (firstTechnique.technique === 'yes_and') {
        exec2Input.additions = [
          'Add timezone-friendly scheduling',
          'Include non-verbal communication options',
          'Create shared virtual spaces',
        ];
      } else if (firstTechnique.technique === 'six_hats') {
        exec2Input.hatColor = 'white';
      }

      const exec2Result = await server.executeThinkingStep(exec2Input);
      const execution2 = JSON.parse(exec2Result.content[0].text);
      expect(execution2.currentStep).toBe(2);
    });

    it('should handle option generation when flexibility is low', async () => {
      // Discovery with constraints
      const discoveryResult = await server.discoverTechniques({
        problem: 'Reduce manufacturing costs by 50%',
        constraints: [
          'Cannot change suppliers',
          'Cannot reduce quality',
          'Cannot lay off workers',
          'Cannot increase prices',
        ],
        preferredOutcome: 'systematic',
      });

      const discovery = JSON.parse(discoveryResult.content[0].text);

      // Should detect low flexibility and suggest option generation
      expect(discovery.flexibilityScore).toBeDefined();
      expect(discovery.optionGenerationRecommended).toBe(true);

      // Plan with option generation
      const planResult = await server.planThinkingSession({
        problem: 'Reduce manufacturing costs by 50%',
        techniques: discovery.recommendedTechniques,
        includeOptions: true,
      });

      const plan = JSON.parse(planResult.content[0].text);

      // Should include option generation phase
      const workflow = plan.workflow;
      expect(workflow.some((w: any) => w.description.includes('option generation'))).toBe(true);
    });

    it('should enforce workflow order', async () => {
      // Try to execute without planning (should fail)
      const directExecResult = await server.executeThinkingStep({
        planId: 'non-existent-plan',
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'blue',
        output: 'Test output',
        nextStepNeeded: true,
      });

      expect(directExecResult.isError).toBe(true);
      expect(directExecResult.content[0].text).toContain('Plan not found');
    });
  });

  describe('Cross-Technique Integration', () => {
    it('should handle workflow with multiple techniques', async () => {
      // Discovery for complex problem
      const discoveryResult = await server.discoverTechniques({
        problem: 'Design innovative product for elderly care',
        context: 'Aging population, technology adoption challenges',
        preferredOutcome: 'innovative',
      });

      const discovery = JSON.parse(discoveryResult.content[0].text);

      // Plan multi-technique session
      const techniques: LateralTechnique[] = ['design_thinking', 'scamper', 'triz'];
      const planResult = await server.planThinkingSession({
        problem: 'Design innovative product for elderly care',
        techniques,
        objectives: [
          'Understand user needs deeply',
          'Generate innovative solutions',
          'Resolve technical contradictions',
        ],
        timeframe: 'comprehensive',
      });

      const plan = JSON.parse(planResult.content[0].text);

      // Verify workflow includes all techniques
      const workflowTechniques = plan.workflow.map((w: any) => w.technique);
      expect(workflowTechniques).toContain('design_thinking');
      expect(workflowTechniques).toContain('scamper');
      expect(workflowTechniques).toContain('triz');

      // Execute first technique (design thinking - empathize)
      const dt1Result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'design_thinking',
        problem: plan.problem,
        currentStep: 1,
        totalSteps: 5,
        designStage: 'empathize',
        empathyInsights: [
          'Fear of complex technology',
          'Need for social connection',
          'Desire for independence',
        ],
        output: 'Conducted interviews with 20 elderly users',
        nextStepNeeded: true,
      });

      const dt1 = JSON.parse(dt1Result.content[0].text);
      const sessionId = dt1.sessionId;

      // Continue through design thinking
      await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'design_thinking',
        problem: plan.problem,
        currentStep: 2,
        totalSteps: 5,
        designStage: 'define',
        problemStatement:
          'Elderly users need simple tech that enhances connection without complexity',
        output: 'Defined core problem statement',
        nextStepNeeded: true,
        sessionId,
      });

      // Transition to SCAMPER
      const scamperResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem: plan.problem,
        currentStep: 1,
        totalSteps: 7,
        scamperAction: 'substitute',
        output: 'Replace complex interfaces with voice control',
        nextStepNeeded: true,
        sessionId,
      });

      const scamper = JSON.parse(scamperResult.content[0].text);
      expect(scamper.technique).toBe('scamper');
      expect(scamper.sessionId).toBe(sessionId); // Same session continues

      // Verify context carries forward
      expect(scamper.contextFromPreviousTechniques).toBeDefined();
    });
  });

  describe('Error Recovery and Validation', () => {
    it('should validate technique compatibility in planning', async () => {
      // Try to plan incompatible techniques
      const planResult = await server.planThinkingSession({
        problem: 'Test problem',
        techniques: ['six_hats', 'invalid_technique'] as any,
      });

      expect(planResult.isError).toBe(true);
      expect(planResult.content[0].text).toContain('Unknown technique');
    });

    it('should handle session recovery after error', async () => {
      // Create session
      const planResult = await server.planThinkingSession({
        problem: 'Error recovery test',
        techniques: ['po'],
      });
      const plan = JSON.parse(planResult.content[0].text);

      // Execute first step
      const step1Result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'po',
        problem: plan.problem,
        currentStep: 1,
        totalSteps: 4,
        provocation: 'Po: All errors are features',
        output: 'Exploring error as feature concept',
        nextStepNeeded: true,
      });
      const sessionId = JSON.parse(step1Result.content[0].text).sessionId;

      // Try invalid step (skip step 2)
      const invalidResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'po',
        problem: plan.problem,
        currentStep: 3, // Skipping step 2
        totalSteps: 4,
        ideaList: ['Error tracking as feature showcase'],
        output: 'Generating ideas',
        nextStepNeeded: true,
        sessionId,
      });

      // Should handle gracefully
      expect(invalidResult.isError).toBe(false);
      const invalid = JSON.parse(invalidResult.content[0].text);
      expect(invalid.warning).toBeDefined(); // Should warn about skipped step
    });
  });

  describe('Advanced Features Integration', () => {
    it('should integrate with ergodicity tracking', async () => {
      // Plan session
      const planResult = await server.planThinkingSession({
        problem: 'Navigate complex regulatory environment',
        techniques: ['scamper'],
      });
      const plan = JSON.parse(planResult.content[0].text);

      // Execute high-commitment actions
      const step1Result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem: plan.problem,
        currentStep: 1,
        totalSteps: 7,
        scamperAction: 'eliminate',
        output: 'Remove non-essential compliance steps',
        nextStepNeeded: true,
      });
      const sessionId = JSON.parse(step1Result.content[0].text).sessionId;

      // Check path dependency tracking
      expect(step1Result.content[0].text).toContain('pathImpact');
      const step1 = JSON.parse(step1Result.content[0].text);
      expect(step1.pathImpact).toBeDefined();
      expect(step1.pathImpact.commitmentLevel).toBe('irreversible');
      expect(step1.flexibilityScore).toBeDefined();

      // Continue with another high-commitment action
      const step2Result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem: plan.problem,
        currentStep: 2,
        totalSteps: 7,
        scamperAction: 'combine',
        output: 'Merge compliance processes',
        nextStepNeeded: true,
        sessionId,
      });

      const step2 = JSON.parse(step2Result.content[0].text);
      expect(step2.flexibilityScore).toBeLessThan(step1.flexibilityScore);

      // Should trigger warnings or alternatives
      if (step2.flexibilityScore < 0.3) {
        expect(step2.alternativeSuggestions).toBeDefined();
        expect(step2.alternativeSuggestions).toContain('Critical flexibility warning');
      }
    });

    it('should provide contextual guidance based on progress', async () => {
      // Plan design thinking session
      const planResult = await server.planThinkingSession({
        problem: 'Improve hospital patient experience',
        techniques: ['design_thinking'],
        objectives: ['Reduce wait times', 'Improve communication'],
      });
      const plan = JSON.parse(planResult.content[0].text);

      let sessionId: string | undefined;
      const stages = ['empathize', 'define', 'ideate', 'prototype', 'test'];

      // Execute through all stages
      for (let i = 0; i < 5; i++) {
        const result = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'design_thinking',
          problem: plan.problem,
          currentStep: i + 1,
          totalSteps: 5,
          designStage: stages[i] as any,
          output: `Completed ${stages[i]} stage`,
          nextStepNeeded: i < 4,
          sessionId,
          ...(i === 0 ? { empathyInsights: ['Long waits cause anxiety'] } : {}),
          ...(i === 1
            ? { problemStatement: 'Patients need clear communication during waits' }
            : {}),
          ...(i === 2 ? { ideaList: ['Real-time updates', 'Comfort amenities'] } : {}),
          ...(i === 3 ? { prototypeDescription: 'Mobile app for wait time updates' } : {}),
          ...(i === 4 ? { userFeedback: ['Love the updates', 'Want more detail'] } : {}),
        });

        if (i === 0) {
          sessionId = JSON.parse(result.content[0].text).sessionId;
        }

        const step = JSON.parse(result.content[0].text);

        // Guidance should be contextual
        expect(step.guidance).toBeDefined();
        if (i < 4) {
          expect(step.guidance).toContain(stages[i + 1]); // Next stage
        }

        // Final step should have comprehensive summary
        if (i === 4) {
          expect(step.summary).toBeDefined();
          expect(step.insights).toBeDefined();
          expect(step.insights.length).toBeGreaterThan(3);
          expect(step.nextSteps).toBeDefined();
        }
      }
    });
  });
});
