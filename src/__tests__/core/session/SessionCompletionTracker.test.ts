/**
 * SessionCompletionTracker test suite
 * Tests for progress tracking and completion calculation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SessionCompletionTracker } from '../../../core/session/SessionCompletionTracker.js';
import type { SessionData, LateralTechnique } from '../../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../../types/planning.js';

describe('SessionCompletionTracker', () => {
  let tracker: SessionCompletionTracker;

  beforeEach(() => {
    tracker = new SessionCompletionTracker();
  });

  describe('calculateCompletionMetadata', () => {
    describe('single technique execution', () => {
      it('should calculate progress for single technique with no plan', () => {
        const session: SessionData = {
          technique: 'six_hats' as LateralTechnique,
          problem: 'test problem',
          history: [
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 1,
              totalSteps: 7,
              output: 'step 1',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 2,
              totalSteps: 7,
              output: 'step 2',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 3,
              totalSteps: 7,
              output: 'step 3',
              nextStepNeeded: true,
            },
          ],
          branches: {},
          insights: [],
          startTime: Date.now(),
          lastActivityTime: Date.now(),
        };

        const metadata = tracker.calculateCompletionMetadata(session);

        expect(metadata.completedSteps).toBe(3);
        expect(metadata.totalPlannedSteps).toBe(7); // Expected steps for six_hats
        expect(metadata.overallProgress).toBeCloseTo(3 / 7, 2);
        expect(metadata.techniqueStatuses).toHaveLength(1);
        expect(metadata.techniqueStatuses[0].technique).toBe('six_hats');
        expect(metadata.techniqueStatuses[0].completedSteps).toBe(3);
      });
    });

    describe('parallel execution', () => {
      it('should handle parallel execution with technique-local steps', () => {
        const session: SessionData = {
          technique: 'six_hats' as LateralTechnique,
          problem: 'test problem',
          history: [
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 1,
              totalSteps: 7,
              output: 'six_hats step 1',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 2,
              totalSteps: 7,
              output: 'six_hats step 2',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 3,
              totalSteps: 7,
              output: 'six_hats step 3',
              nextStepNeeded: true,
            },
            {
              technique: 'scamper',
              problem: 'test',
              currentStep: 1,
              totalSteps: 8,
              output: 'scamper step 1',
              nextStepNeeded: true,
            },
            {
              technique: 'scamper',
              problem: 'test',
              currentStep: 2,
              totalSteps: 8,
              output: 'scamper step 2',
              nextStepNeeded: true,
            },
          ],
          branches: {},
          insights: [],
          startTime: Date.now(),
          lastActivityTime: Date.now(),
        };

        const plan: PlanThinkingSessionOutput = {
          planId: 'test-plan',
          problem: 'test problem',
          techniques: ['six_hats', 'scamper'] as LateralTechnique[],
          totalSteps: 15,
          executionMode: 'parallel',
          workflow: [
            {
              technique: 'six_hats' as LateralTechnique,
              steps: [
                { name: 'Blue Hat', emoji: '🔵', focus: 'Process' },
                { name: 'White Hat', emoji: '⚪', focus: 'Facts' },
                { name: 'Red Hat', emoji: '🔴', focus: 'Emotions' },
                { name: 'Yellow Hat', emoji: '🟡', focus: 'Benefits' },
                { name: 'Black Hat', emoji: '⚫', focus: 'Risks' },
                { name: 'Green Hat', emoji: '🟢', focus: 'Creativity' },
                { name: 'Purple Hat', emoji: '🟣', focus: 'Integration' },
              ],
            },
            {
              technique: 'scamper' as LateralTechnique,
              steps: [
                { name: 'Substitute', emoji: '🔄', focus: 'Replace elements' },
                { name: 'Combine', emoji: '🔗', focus: 'Merge concepts' },
                { name: 'Adapt', emoji: '🔧', focus: 'Adjust for new use' },
                { name: 'Modify', emoji: '✏️', focus: 'Change attributes' },
                { name: 'Put to other use', emoji: '🎯', focus: 'New applications' },
                { name: 'Eliminate', emoji: '❌', focus: 'Remove elements' },
                { name: 'Reverse', emoji: '🔄', focus: 'Invert or rearrange' },
                { name: 'Parameterize', emoji: '📊', focus: 'Extract variables' },
              ],
            },
          ],
          metadata: {
            estimatedDuration: 'thorough',
            approach: 'comprehensive',
            focusAreas: ['innovation', 'risk assessment'],
          },
        };

        const metadata = tracker.calculateCompletionMetadata(session, plan);

        expect(metadata.completedSteps).toBe(5);
        expect(metadata.totalPlannedSteps).toBe(15);
        expect(metadata.overallProgress).toBeCloseTo(5 / 15, 2);

        const sixHatsStatus = metadata.techniqueStatuses.find(s => s.technique === 'six_hats');
        expect(sixHatsStatus?.completedSteps).toBe(3);
        expect(sixHatsStatus?.totalSteps).toBe(7);
        expect(sixHatsStatus?.completionPercentage).toBeCloseTo(3 / 7, 2);

        const scamperStatus = metadata.techniqueStatuses.find(s => s.technique === 'scamper');
        expect(scamperStatus?.completedSteps).toBe(2);
        expect(scamperStatus?.totalSteps).toBe(8);
        expect(scamperStatus?.completionPercentage).toBeCloseTo(2 / 8, 2);
      });

      it('should detect skipped steps in parallel execution', () => {
        const session: SessionData = {
          technique: 'six_hats' as LateralTechnique,
          problem: 'test problem',
          history: [
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 1,
              totalSteps: 7,
              output: 'step 1',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 3,
              totalSteps: 7,
              output: 'step 3',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 5,
              totalSteps: 7,
              output: 'step 5',
              nextStepNeeded: true,
            },
          ],
          branches: {},
          insights: [],
          startTime: Date.now(),
          lastActivityTime: Date.now(),
        };

        const plan: PlanThinkingSessionOutput = {
          planId: 'test-plan',
          problem: 'test problem',
          techniques: ['six_hats'] as LateralTechnique[],
          totalSteps: 7,
          executionMode: 'parallel',
          workflow: [
            {
              technique: 'six_hats' as LateralTechnique,
              steps: Array(7)
                .fill(null)
                .map((_, i) => ({
                  name: `Step ${i + 1}`,
                  emoji: '📝',
                  focus: 'Test',
                })),
            },
          ],
          metadata: {
            estimatedDuration: 'quick',
            approach: 'focused',
            focusAreas: [],
          },
        };

        const metadata = tracker.calculateCompletionMetadata(session, plan);

        const sixHatsStatus = metadata.techniqueStatuses.find(s => s.technique === 'six_hats');
        expect(sixHatsStatus?.skippedSteps).toEqual([2, 4, 6, 7]);
        expect(sixHatsStatus?.completedSteps).toBe(3);
      });
    });

    describe('sequential execution', () => {
      it('should handle sequential multi-technique execution with global steps', () => {
        const session: SessionData = {
          technique: 'po' as LateralTechnique,
          problem: 'test problem',
          history: [
            // Six hats steps (1-7)
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 1,
              totalSteps: 11,
              output: 'six_hats step 1',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 2,
              totalSteps: 11,
              output: 'six_hats step 2',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 3,
              totalSteps: 11,
              output: 'six_hats step 3',
              nextStepNeeded: true,
            },
            // PO steps (8-11)
            {
              technique: 'po',
              problem: 'test',
              currentStep: 8,
              totalSteps: 11,
              output: 'po step 1',
              nextStepNeeded: true,
            },
            {
              technique: 'po',
              problem: 'test',
              currentStep: 9,
              totalSteps: 11,
              output: 'po step 2',
              nextStepNeeded: true,
            },
          ],
          branches: {},
          insights: [],
          startTime: Date.now(),
          lastActivityTime: Date.now(),
        };

        const plan: PlanThinkingSessionOutput = {
          planId: 'test-plan',
          problem: 'test problem',
          techniques: ['six_hats', 'po'] as LateralTechnique[],
          totalSteps: 11,
          executionMode: 'sequential',
          workflow: [
            {
              technique: 'six_hats' as LateralTechnique,
              steps: Array(7)
                .fill(null)
                .map((_, i) => ({
                  name: `Six Hats Step ${i + 1}`,
                  emoji: '🎩',
                  focus: 'Perspective',
                })),
            },
            {
              technique: 'po' as LateralTechnique,
              steps: Array(4)
                .fill(null)
                .map((_, i) => ({
                  name: `PO Step ${i + 1}`,
                  emoji: '💡',
                  focus: 'Provocation',
                })),
            },
          ],
          metadata: {
            estimatedDuration: 'thorough',
            approach: 'sequential',
            focusAreas: [],
          },
        };

        const metadata = tracker.calculateCompletionMetadata(session, plan);

        expect(metadata.completedSteps).toBe(5);
        expect(metadata.totalPlannedSteps).toBe(11);

        const sixHatsStatus = metadata.techniqueStatuses.find(s => s.technique === 'six_hats');
        expect(sixHatsStatus?.completedSteps).toBe(3);
        expect(sixHatsStatus?.totalSteps).toBe(7);

        const poStatus = metadata.techniqueStatuses.find(s => s.technique === 'po');
        expect(poStatus?.completedSteps).toBe(2);
        expect(poStatus?.totalSteps).toBe(4);
      });
    });

    describe('edge cases', () => {
      it('should handle empty history', () => {
        const session: SessionData = {
          technique: 'six_hats' as LateralTechnique,
          problem: 'test problem',
          history: [],
          branches: {},
          insights: [],
          startTime: Date.now(),
          lastActivityTime: Date.now(),
        };

        const plan: PlanThinkingSessionOutput = {
          planId: 'test-plan',
          problem: 'test problem',
          techniques: ['six_hats'] as LateralTechnique[],
          totalSteps: 7,
          executionMode: 'sequential',
          workflow: [
            {
              technique: 'six_hats' as LateralTechnique,
              steps: Array(7)
                .fill(null)
                .map((_, i) => ({
                  name: `Step ${i + 1}`,
                  emoji: '📝',
                  focus: 'Test',
                })),
            },
          ],
          metadata: {
            estimatedDuration: 'quick',
            approach: 'focused',
            focusAreas: [],
          },
        };

        const metadata = tracker.calculateCompletionMetadata(session, plan);

        expect(metadata.completedSteps).toBe(0);
        expect(metadata.overallProgress).toBe(0);
        expect(metadata.skippedTechniques).toContain('six_hats');
      });

      it('should handle out-of-range step numbers gracefully', () => {
        const session: SessionData = {
          technique: 'six_hats' as LateralTechnique,
          problem: 'test problem',
          history: [
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 1,
              totalSteps: 7,
              output: 'valid step',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 999,
              totalSteps: 7,
              output: 'invalid step',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: -1,
              totalSteps: 7,
              output: 'negative step',
              nextStepNeeded: true,
            },
          ],
          branches: {},
          insights: [],
          startTime: Date.now(),
          lastActivityTime: Date.now(),
        };

        const plan: PlanThinkingSessionOutput = {
          planId: 'test-plan',
          problem: 'test problem',
          techniques: ['six_hats'] as LateralTechnique[],
          totalSteps: 7,
          executionMode: 'parallel',
          workflow: [
            {
              technique: 'six_hats' as LateralTechnique,
              steps: Array(7)
                .fill(null)
                .map((_, i) => ({
                  name: `Step ${i + 1}`,
                  emoji: '📝',
                  focus: 'Test',
                })),
            },
          ],
          metadata: {
            estimatedDuration: 'quick',
            approach: 'focused',
            focusAreas: [],
          },
        };

        const metadata = tracker.calculateCompletionMetadata(session, plan);

        // Should only count the valid step
        expect(metadata.completedSteps).toBe(1);
        const sixHatsStatus = metadata.techniqueStatuses.find(s => s.technique === 'six_hats');
        expect(sixHatsStatus?.completedSteps).toBe(1);
      });
    });

    describe('critical steps detection', () => {
      it('should identify critical Black Hat step as skipped', () => {
        const session: SessionData = {
          technique: 'six_hats' as LateralTechnique,
          problem: 'Risk assessment for new investment',
          history: [
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 1,
              totalSteps: 7,
              output: 'Blue',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 2,
              totalSteps: 7,
              output: 'White',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 3,
              totalSteps: 7,
              output: 'Red',
              nextStepNeeded: true,
            },
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 4,
              totalSteps: 7,
              output: 'Yellow',
              nextStepNeeded: true,
            },
            // Step 5 (Black Hat) is skipped
            {
              technique: 'six_hats',
              problem: 'test',
              currentStep: 6,
              totalSteps: 7,
              output: 'Green',
              nextStepNeeded: true,
            },
          ],
          branches: {},
          insights: [],
          startTime: Date.now(),
          lastActivityTime: Date.now(),
        };

        const plan: PlanThinkingSessionOutput = {
          planId: 'test-plan',
          problem: 'Risk assessment for new investment',
          techniques: ['six_hats'] as LateralTechnique[],
          totalSteps: 7,
          executionMode: 'parallel',
          workflow: [
            {
              technique: 'six_hats' as LateralTechnique,
              steps: [
                { name: 'Blue Hat', emoji: '🔵', focus: 'Process' },
                { name: 'White Hat', emoji: '⚪', focus: 'Facts' },
                { name: 'Red Hat', emoji: '🔴', focus: 'Emotions' },
                { name: 'Yellow Hat', emoji: '🟡', focus: 'Benefits' },
                { name: 'Black Hat', emoji: '⚫', focus: 'Risks' },
                { name: 'Green Hat', emoji: '🟢', focus: 'Creativity' },
                { name: 'Purple Hat', emoji: '🟣', focus: 'Integration' },
              ],
            },
          ],
          metadata: {
            estimatedDuration: 'thorough',
            approach: 'comprehensive',
            focusAreas: ['risk'],
          },
        };

        const metadata = tracker.calculateCompletionMetadata(session, plan);

        const sixHatsStatus = metadata.techniqueStatuses.find(s => s.technique === 'six_hats');
        expect(sixHatsStatus?.skippedSteps).toContain(5); // Black Hat is step 5
        expect(sixHatsStatus?.criticalStepsSkipped).toContain('Black Hat');
        expect(metadata.completionWarnings.some(w => w.includes('Black Hat'))).toBe(true);
      });
    });
  });

  describe('formatProgressDisplay', () => {
    it('should format progress display correctly', () => {
      const metadata = {
        overallProgress: 0.5,
        totalPlannedSteps: 10,
        completedSteps: 5,
        techniqueStatuses: [
          {
            technique: 'six_hats' as LateralTechnique,
            totalSteps: 7,
            completedSteps: 3,
            completionPercentage: 3 / 7,
            skippedSteps: [],
            criticalStepsSkipped: [],
          },
          {
            technique: 'scamper' as LateralTechnique,
            totalSteps: 3,
            completedSteps: 2,
            completionPercentage: 2 / 3,
            skippedSteps: [],
            criticalStepsSkipped: [],
          },
        ],
        skippedTechniques: [],
        missedPerspectives: [],
        criticalGapsIdentified: [],
        completionWarnings: [],
        minimumThresholdMet: false,
      };

      const display = tracker.formatProgressDisplay(metadata);

      expect(display).toContain('50%');
      expect(display).toContain('5/10 steps');
      expect(display).toContain('[◐ six_hats]');
      expect(display).toContain('[◐ scamper]');
    });
  });

  describe('canProceedToSynthesis', () => {
    it('should block synthesis when below minimum threshold', () => {
      const metadata = {
        overallProgress: 0.3,
        totalPlannedSteps: 10,
        completedSteps: 3,
        techniqueStatuses: [],
        skippedTechniques: [],
        missedPerspectives: [],
        criticalGapsIdentified: [],
        completionWarnings: [],
        minimumThresholdMet: false,
      };

      const result = tracker.canProceedToSynthesis(metadata);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('30%');
      expect(result.requiredActions).toBeDefined();
    });

    it('should allow synthesis when threshold is met', () => {
      const metadata = {
        overallProgress: 0.85,
        totalPlannedSteps: 10,
        completedSteps: 8,
        techniqueStatuses: [],
        skippedTechniques: [],
        missedPerspectives: [],
        criticalGapsIdentified: [],
        completionWarnings: [],
        minimumThresholdMet: true,
      };

      const result = tracker.canProceedToSynthesis(metadata);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });
});
