/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */
/**
 * Integration tests for complete technique workflows
 * Tests end-to-end execution of various creative thinking techniques
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import type {
  ExecuteThinkingStepInput,
  PlanThinkingSessionInput,
  SixHatsColor,
  ScamperAction,
} from '../../index.js';
import { safeJsonParse } from '../helpers/types.js';

describe('Complete Technique Workflows', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  describe('Six Hats Complete Flow', () => {
    it('should complete full six hats workflow', async () => {
      const problem = 'How to improve customer retention';

      // Plan the session
      const planInput: PlanThinkingSessionInput = {
        problem,
        techniques: ['six_hats'],
        objectives: ['Analyze retention holistically', 'Generate actionable solutions'],
      };

      const planResult = await server.planThinkingSession(planInput);
      const plan = safeJsonParse(planResult.content[0].text);
      expect(plan.planId).toBeDefined();

      let sessionId: string | undefined;
      const hatColors: SixHatsColor[] = ['blue', 'white', 'red', 'yellow', 'black', 'green'];

      // Execute all 6 hats
      for (let i = 0; i < 6; i++) {
        const stepInput: ExecuteThinkingStepInput = {
          planId: plan.planId,
          technique: 'six_hats',
          problem,
          currentStep: i + 1,
          totalSteps: 6,
          hatColor: hatColors[i],
          output: getHatOutput(hatColors[i]),
          nextStepNeeded: i < 5,
          sessionId,
        };

        const result = await server.executeThinkingStep(stepInput);
        const stepData = safeJsonParse(result.content[0].text);

        expect(stepData.technique).toBe('six_hats');
        expect(stepData.currentStep).toBe(i + 1);

        if (i === 0) {
          sessionId = stepData.sessionId;
          expect(sessionId).toBeDefined();
        }

        if (i === 5) {
          // Final step
          expect(stepData.nextStepNeeded).toBe(false);
          expect(stepData.insights).toBeDefined();
          expect(stepData.insights.length).toBeGreaterThan(0);
          expect(stepData.summary).toBeDefined();
        }
      }
    });

    it('should handle revision workflow', async () => {
      const problem = 'Improve team productivity';

      // Create plan
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['six_hats'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Execute first 3 steps
      let sessionId: string | undefined;
      const hatColors: SixHatsColor[] = ['blue', 'white', 'red'];

      for (let i = 0; i < 3; i++) {
        const result = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'six_hats',
          problem,
          currentStep: i + 1,
          totalSteps: 6,
          hatColor: hatColors[i],
          output: `Original ${hatColors[i]} hat thinking`,
          nextStepNeeded: true,
          sessionId,
        });

        if (i === 0) {
          sessionId = safeJsonParse(result.content[0].text).sessionId;
        }
      }

      // Revise step 2 (white hat)
      const revisionResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem,
        currentStep: 2,
        totalSteps: 6,
        hatColor: 'white',
        output: 'Revised: Actually productivity is 85% not 72% based on new data',
        nextStepNeeded: true,
        sessionId,
        isRevision: true,
        revisesStep: 2,
      });

      const revisionData = safeJsonParse(revisionResult.content[0].text);
      expect(revisionData.technique).toBe('six_hats');
      expect(revisionData.currentStep).toBe(2);

      // Continue with step 4
      const continueResult = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem,
        currentStep: 4,
        totalSteps: 6,
        hatColor: 'yellow',
        output: 'Building on revised data: 85% productivity shows strong foundation',
        nextStepNeeded: true,
        sessionId,
      });

      expect(safeJsonParse(continueResult.content[0].text).currentStep).toBe(4);
    });
  });

  describe('SCAMPER Complete Flow', () => {
    it('should complete all 8 SCAMPER actions', async () => {
      const problem = 'Improve coffee mug design';
      const actions: ScamperAction[] = [
        'substitute',
        'combine',
        'adapt',
        'modify',
        'put_to_other_use',
        'eliminate',
        'reverse',
        'parameterize',
      ];

      // Plan session
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['scamper'],
        timeframe: 'thorough',
      });
      const plan = safeJsonParse(planResult.content[0].text);

      let sessionId: string | undefined;

      for (let i = 0; i < actions.length; i++) {
        const result = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'scamper',
          problem,
          currentStep: i + 1,
          totalSteps: 8,
          scamperAction: actions[i],
          output: getScamperOutput(actions[i]),
          nextStepNeeded: i < actions.length - 1,
          sessionId,
        });

        const stepData = safeJsonParse(result.content[0].text);

        expect(stepData.technique).toBe('scamper');
        expect(stepData.currentStep).toBe(i + 1);

        if (i === 0) {
          sessionId = stepData.sessionId;
        }

        // Check PDA-SCAMPER fields
        if (stepData.pathImpact) {
          expect(stepData.pathImpact.commitmentLevel).toBeDefined();
          expect(stepData.flexibilityScore).toBeDefined();
        }

        if (i === actions.length - 1) {
          expect(stepData.nextStepNeeded).toBe(false);
          expect(stepData.summary).toBeDefined();
          expect(stepData.insights).toBeDefined();
        }
      }
    });
  });

  describe('Multi-Step Techniques', () => {
    it('should complete PO technique workflow', async () => {
      const problem = 'Reduce email overload';

      // Plan and execute PO technique
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['po'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Step 1: Provocation
      const step1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'po',
        problem,
        currentStep: 1,
        totalSteps: 4,
        provocation: 'Po: All emails self-destruct after 24 hours',
        output: 'Forces immediate action and prevents email hoarding',
        nextStepNeeded: true,
      });
      const sessionId = safeJsonParse(step1.content[0].text).sessionId;

      // Step 2: Principles
      const step2 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'po',
        problem,
        currentStep: 2,
        totalSteps: 4,
        principles: ['Urgency creation', 'Forced prioritization', 'Clean inbox'],
        output: 'This could lead to better email management and reduced clutter',
        nextStepNeeded: true,
        sessionId,
      });

      // Verify step 2 completed successfully
      expect(step2.isError).toBeFalsy();
      expect(safeJsonParse(step2.content[0].text).currentStep).toBe(2);

      // Step 3: Ideas
      const step3 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'po',
        problem,
        currentStep: 3,
        totalSteps: 4,
        ideaList: [
          'Email priority tags with expiration',
          'Auto-archive after custom time periods',
          'Daily email budget system',
        ],
        output: 'Generated practical ideas from principles',
        nextStepNeeded: true,
        sessionId,
      });

      // Verify step 3 completed successfully
      expect(step3.isError).toBeFalsy();
      expect(safeJsonParse(step3.content[0].text).currentStep).toBe(3);

      // Step 4: Validation
      const step4 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'po',
        problem,
        currentStep: 4,
        totalSteps: 4,
        viaNegativaRemovals: ['Complex rules', 'Manual sorting'],
        minimalSolution: 'Simple time-based priority system',
        output:
          'Time-based priority system. Auto-archive after 7 days. Visual indicators for urgency.',
        nextStepNeeded: false,
        sessionId,
      });

      const finalData = safeJsonParse(step4.content[0].text);
      expect(finalData.nextStepNeeded).toBe(false);
      expect(finalData.insights).toBeDefined();
      expect(finalData.summary).toBeDefined();
      expect(finalData.summary.technique).toBe('po');
    });

    it('should complete Design Thinking workflow', async () => {
      const problem = 'Design better remote work experience';
      const stages = ['empathize', 'define', 'ideate', 'prototype', 'test'];

      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['design_thinking'],
        objectives: ['User-centered approach', 'Rapid prototyping'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      let sessionId: string | undefined;

      for (let i = 0; i < 5; i++) {
        const stageInput = getDesignThinkingInput(stages[i], problem);

        const result = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'design_thinking',
          problem,
          currentStep: i + 1,
          totalSteps: 5,
          designStage: stages[i] as any,
          output: stageInput.output,
          nextStepNeeded: i < 4,
          sessionId,
          ...stageInput.fields,
        });

        const stepData = safeJsonParse(result.content[0].text);

        if (i === 0) {
          sessionId = stepData.sessionId;
        }

        expect(stepData.currentStep).toBe(i + 1);

        if (i === 4) {
          expect(stepData.nextStepNeeded).toBe(false);
          expect(
            stepData.insights.some(
              (i: string) => i.toLowerCase().includes('user') || i.includes('need')
            )
          ).toBe(true);
        }
      }
    });
  });

  describe('Branching and Complex Workflows', () => {
    it('should handle technique with branching paths', async () => {
      const problem = 'Increase innovation in organization';

      // Plan session
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['concept_extraction'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Execute with branch
      const step1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'concept_extraction',
        problem,
        currentStep: 1,
        totalSteps: 4,
        successExample: 'Google 20% time policy',
        output: 'Analyzing successful innovation policy',
        nextStepNeeded: true,
      });
      const sessionId = safeJsonParse(step1.content[0].text).sessionId;

      // Branch to explore alternative
      const branch1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'concept_extraction',
        problem,
        currentStep: 2,
        totalSteps: 4,
        extractedConcepts: ['Dedicated time', 'Freedom to explore', 'No immediate ROI pressure'],
        output: 'Extracted core concepts',
        nextStepNeeded: true,
        sessionId,
        branchFromStep: 1,
        branchId: 'alternative-analysis',
      });

      const branchData = safeJsonParse(branch1.content[0].text);
      expect(branchData.sessionId).toBeDefined();
    });
  });
});

// Helper functions for generating realistic outputs
function getHatOutput(color: SixHatsColor): string {
  const outputs: Record<SixHatsColor, string> = {
    blue: 'Setting process: analyze retention systematically through each perspective',
    white: 'Facts: Current retention 65%, need to know why customers leave after 18 months',
    red: 'Feelings: Customers are concerned about slow support response times',
    yellow: 'Benefits: Strong product-market fit, high satisfaction when engaged',
    black: 'Risks: Competitor offering better onboarding experience',
    green: 'Ideas: AI chatbot for instant support, gamified onboarding process',
  };
  return outputs[color];
}

function getScamperOutput(action: ScamperAction): string {
  const outputs: Record<ScamperAction, string> = {
    substitute: 'Replace ceramic with sustainable bamboo composite',
    combine: 'Integrate wireless charging coaster into mug base',
    adapt: 'Add modular grip sleeves for different hand sizes',
    modify: 'Increase capacity to 16oz for fewer refills',
    put_to_other_use: 'Design doubles as desk organizer when empty',
    eliminate: 'Remove handle for minimalist aesthetic',
    reverse: 'Flip design - wider base, narrower top for stability',
    parameterize: 'Identify key variables: material density, thermal conductivity, grip diameter',
  };
  return outputs[action];
}

function getDesignThinkingInput(stage: string, problem: string): any {
  const inputs: Record<string, any> = {
    empathize: {
      output: `Interviewed 10 remote workers about pain points related to: ${problem}`,
      fields: {
        empathyInsights: [
          'Isolation from colleagues',
          'Difficulty separating work/life',
          'Zoom fatigue',
        ],
      },
    },
    define: {
      output: `Core problem identified for ${problem}: Lack of spontaneous collaboration`,
      fields: {
        problemStatement: 'Remote workers need better ways to collaborate spontaneously',
      },
    },
    ideate: {
      output: 'Generated 20+ ideas for virtual collaboration',
      fields: {
        ideaList: ['Virtual office spaces', 'Random coffee chat bot', 'Collaborative playlists'],
      },
    },
    prototype: {
      output: 'Built MVP of virtual office space',
      fields: {
        prototypeDescription: 'Browser-based virtual office with proximity voice chat',
      },
    },
    test: {
      output: 'Tested with 5 teams for 1 week',
      fields: {
        userFeedback: [
          'Love the spontaneous conversations',
          'Needs better audio quality',
          'Want customizable spaces',
        ],
      },
    },
  };
  return inputs[stage];
}
