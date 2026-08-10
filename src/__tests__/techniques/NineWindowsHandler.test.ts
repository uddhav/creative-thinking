/**
 * NineWindowsHandler unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NineWindowsHandler } from '../../techniques/NineWindowsHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('NineWindowsHandler', () => {
  let handler: NineWindowsHandler;

  beforeEach(() => {
    handler = new NineWindowsHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique information', () => {
      const info = handler.getTechniqueInfo();

      expect(info).toMatchObject({
        name: 'Nine Windows',
        emoji: '🪟',
        totalSteps: 9,
        description: 'Explore problems across time and system levels',
        focus: 'Systematic analysis through space-time matrix',
      });
      // Check parallelSteps exists
      expect(info.parallelSteps).toBeDefined();
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for past steps (1-3)', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1).toMatchObject({
        name: 'Past Sub-system',
        focus: 'Component history',
        emoji: '🔧',
      });

      const step2 = handler.getStepInfo(2);
      expect(step2).toMatchObject({
        name: 'Past System',
        focus: 'System evolution',
        emoji: '⚙️',
      });

      const step3 = handler.getStepInfo(3);
      expect(step3).toMatchObject({
        name: 'Past Super-system',
        focus: 'Environmental history',
        emoji: '🌍',
      });
    });

    it('should return correct info for present steps (4-6)', () => {
      const step4 = handler.getStepInfo(4);
      expect(step4).toMatchObject({
        name: 'Present Sub-system',
        focus: 'Current components',
        emoji: '🔩',
      });

      const step5 = handler.getStepInfo(5);
      expect(step5).toMatchObject({
        name: 'Present System',
        focus: 'Current state',
        emoji: '🎯',
      });

      const step6 = handler.getStepInfo(6);
      expect(step6).toMatchObject({
        name: 'Present Super-system',
        focus: 'Current environment',
        emoji: '🏞️',
      });
    });

    it('should return correct info for future steps (7-9)', () => {
      const step7 = handler.getStepInfo(7);
      expect(step7).toMatchObject({
        name: 'Future Sub-system',
        focus: 'Component evolution',
        emoji: '🚀',
      });
      expect(step7.type).toBe('action');
      expect(step7.reflexiveEffects).toBeDefined();

      const step8 = handler.getStepInfo(8);
      expect(step8).toMatchObject({
        name: 'Future System',
        focus: 'System possibilities',
        emoji: '🎪',
      });
      expect(step8.type).toBe('action');
      expect(step8.reflexiveEffects).toBeDefined();

      const step9 = handler.getStepInfo(9);
      expect(step9).toMatchObject({
        name: 'Future Super-system',
        focus: 'Environmental changes',
        emoji: '🌅',
      });
      expect(step9.type).toBe('action');
      expect(step9.reflexiveEffects).toBeDefined();
    });

    it('should throw validation error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(10)).toThrow(ValidationError);

      try {
        handler.getStepInfo(11);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.code).toBe(ErrorCode.INVALID_STEP);
          expect(error.message).toContain('Invalid step 11 for Nine Windows');
          expect(error.field).toBe('step');
          expect(error.details).toEqual({ providedStep: 11, validRange: [1, 9] });
        }
      }
    });
  });

  describe('getStepGuidance', () => {
    it('should return specific guidance for each time frame', () => {
      const problem = 'reduce carbon emissions';

      // Past
      const guidance1 = handler.getStepGuidance(1, problem);
      expect(guidance1).toContain('Past Sub-system');
      expect(guidance1).toContain('component decisions');
      expect(guidance1).toContain(problem);

      // Present
      const guidance5 = handler.getStepGuidance(5, problem);
      expect(guidance5).toContain('Present System');
      expect(guidance5).toContain('current system state');

      // Future
      const guidance9 = handler.getStepGuidance(9, problem);
      expect(guidance9).toContain('Future Super-system');
      expect(guidance9).toContain('environment change');
    });

    it('should handle out of bounds gracefully', () => {
      const problem = 'test problem';
      const guidance0 = handler.getStepGuidance(0, problem);
      expect(guidance0).toContain('Complete the Nine Windows process');

      const guidance10 = handler.getStepGuidance(10, problem);
      expect(guidance10).toContain('Complete the Nine Windows process');
    });

    it('should mention path dependencies in future steps', () => {
      const problem = 'technology adoption';

      const guidance7 = handler.getStepGuidance(7, problem);
      expect(guidance7).toContain('path dependencies');

      const guidance8 = handler.getStepGuidance(8, problem);
      expect(guidance8).toContain('irreversible');
    });
  });

  describe('validateStep', () => {
    it('should validate all 9 steps correctly', () => {
      for (let i = 1; i <= 9; i++) {
        expect(handler.validateStep(i, {})).toBe(true);
      }
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(10, {})).toBe(false);
    });
  });

  describe('getCellByCoordinates', () => {
    it('should map coordinates to correct step numbers', () => {
      // Past row
      expect(handler.getCellByCoordinates('past', 'sub-system')).toBe(1);
      expect(handler.getCellByCoordinates('past', 'system')).toBe(2);
      expect(handler.getCellByCoordinates('past', 'super-system')).toBe(3);

      // Present row
      expect(handler.getCellByCoordinates('present', 'sub-system')).toBe(4);
      expect(handler.getCellByCoordinates('present', 'system')).toBe(5);
      expect(handler.getCellByCoordinates('present', 'super-system')).toBe(6);

      // Future row
      expect(handler.getCellByCoordinates('future', 'sub-system')).toBe(7);
      expect(handler.getCellByCoordinates('future', 'system')).toBe(8);
      expect(handler.getCellByCoordinates('future', 'super-system')).toBe(9);
    });
  });

  describe('extractInsights', () => {
    it('should label each window with its own cell name, keeping the full first sentence', () => {
      // Replaces the assertions for 'Historical pattern: …', 'Current reality: …'
      // and 'Future possibility: …'. Those three labels named the middle column
      // only, and were built with output.split('.')[0], which drops the
      // terminating period and cuts inside abbreviations.
      const history = [
        {
          currentStep: 2,
          output:
            'Manual processes evolved into semi-automated systems. This created technical debt.',
        },
        {
          currentStep: 5,
          output: 'System is at 70% capacity. Performance degradation visible.',
        },
        {
          currentStep: 8,
          output:
            'Quantum computing could revolutionize our approach. But requires significant investment.',
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain(
        'Past System: Manual processes evolved into semi-automated systems.'
      );
      expect(insights).toContain('Present System: System is at 70% capacity.');
      expect(insights).toContain(
        'Future System: Quantum computing could revolutionize our approach.'
      );

      // The old labels are gone, and so is the truncation they were built with.
      expect(insights.some(i => i.startsWith('Historical pattern:'))).toBe(false);
      expect(insights.some(i => i.startsWith('Current reality:'))).toBe(false);
      expect(insights.some(i => i.startsWith('Future possibility:'))).toBe(false);
    });

    it('should report every window, not only the middle column', () => {
      // The six sub-system and super-system cells produced nothing before,
      // however much was written in them.
      const history = [
        { currentStep: 1, output: 'Components began as three hand-rolled scripts.' },
        { currentStep: 3, output: 'The market tolerated hour-long batch latency.' },
        { currentStep: 4, output: 'Four services share one database connection pool.' },
        { currentStep: 6, output: 'Customers now expect sub-second responses.' },
        { currentStep: 7, output: 'The pool becomes the first component to be replaced.' },
        { currentStep: 9, output: 'Regulation will constrain where the data may live.' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Past Sub-system: Components began as three hand-rolled scripts.');
      expect(insights).toContain(
        'Past Super-system: The market tolerated hour-long batch latency.'
      );
      expect(insights).toContain(
        'Present Sub-system: Four services share one database connection pool.'
      );
      expect(insights).toContain(
        'Present Super-system: Customers now expect sub-second responses.'
      );
      expect(insights).toContain(
        'Future Sub-system: The pool becomes the first component to be replaced.'
      );
      expect(insights).toContain(
        'Future Super-system: Regulation will constrain where the data may live.'
      );
    });

    it('should report every interdependency, labelled by its window', () => {
      // Replaces the assertion for the bare 'Key dependency: <first element>'.
      const history = [
        {
          currentStep: 5,
          interdependencies: ['System A depends on System B', 'External API dependency'],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Present System: Key dependency: System A depends on System B');
      expect(insights).toContain('Present System: Key dependency: External API dependency');

      // The second dependency is no longer discarded, and the label now says
      // which window the dependency was found in.
      expect(insights).not.toContain('Key dependency: System A depends on System B');
    });

    it('should report the nine windows matrix cells the caller supplied', () => {
      const history = [
        {
          currentStep: 9,
          nineWindowsMatrix: [
            {
              timeFrame: 'past' as const,
              systemLevel: 'sub-system' as const,
              content: 'Single-threaded parser',
            },
            {
              timeFrame: 'future' as const,
              systemLevel: 'system' as const,
              content: 'Event-driven pipeline',
              pathDependencies: ['Schema registry must land first'],
              irreversible: true,
            },
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Matrix past sub-system: Single-threaded parser');
      expect(insights).toContain(
        'Matrix future system: Event-driven pipeline (path dependencies: Schema registry must land first; irreversible)'
      );
    });

    it('should report what the last steps recorded, never a canned completion banner', () => {
      // Replaces the assertion that the fixed string 'Nine Windows completed -
      // systemic understanding achieved across time and scale' was appended
      // whenever step 9 ran with nextStepNeeded false. It asserted a finding the
      // session never made; reaching step 9 is visible from the step count.
      const history = [
        {
          currentStep: 8,
          output: 'Some analysis',
          nextStepNeeded: true,
        },
        {
          currentStep: 9,
          output: 'Final cell analysis',
          nextStepNeeded: false,
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Future System: Some analysis',
        'Future Super-system: Final cell analysis',
      ]);
      expect(insights.some(i => i.includes('Nine Windows completed'))).toBe(false);
    });

    it('should handle empty history', () => {
      const insights = handler.extractInsights([]);
      expect(insights).toEqual([]);
    });

    it('should report nothing for a step that recorded nothing', () => {
      const history = [{ currentStep: 1 }, { currentStep: 3, output: '   ' }];

      const insights = handler.extractInsights(history);
      expect(insights).toHaveLength(0);
    });

    it('should key on currentStep so a revision supersedes what it revises', () => {
      const history = [
        { currentStep: 1, output: 'The first reading of the component history.' },
        { currentStep: 2, output: 'System evolution as first told.' },
        { currentStep: 1, output: 'The corrected reading of the component history.' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Past Sub-system: The corrected reading of the component history.',
        'Past System: System evolution as first told.',
      ]);
    });
  });
});
