/**
 * Tests for CollectiveIntelHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CollectiveIntelHandler } from '../../techniques/CollectiveIntelHandler.js';
import { ValidationError } from '../../errors/types.js';

describe('CollectiveIntelHandler', () => {
  let handler: CollectiveIntelHandler;

  beforeEach(() => {
    handler = new CollectiveIntelHandler();
  });

  describe('getTechniqueInfo', () => {
    it('returns correct technique info', () => {
      const info = handler.getTechniqueInfo();
      expect(info.name).toBe('Collective Intelligence Synthesis');
      expect(info.emoji).toBe('🧬');
      expect(info.totalSteps).toBe(5);
      expect(info.description).toBe('Harness collective wisdom from multiple sources');
      expect(info.parallelSteps?.canParallelize).toBe(false);
    });
  });

  describe('getStepInfo', () => {
    it('names the five steps in order', () => {
      expect(handler.getStepInfo(1).name).toBe('Identify Sources');
      expect(handler.getStepInfo(2).name).toBe('Gather Wisdom');
      expect(handler.getStepInfo(3).name).toBe('Find Patterns');
      expect(handler.getStepInfo(4).name).toBe('Create Synergy');
      expect(handler.getStepInfo(5).name).toBe('Synthesize Insight');
    });

    it('marks steps 1-3 as thinking and steps 4-5 as action with reflexive effects', () => {
      for (let s = 1; s <= 3; s++) {
        expect(handler.getStepInfo(s).type).toBe('thinking');
      }
      expect(handler.getStepInfo(4).type).toBe('action');
      expect(handler.getStepInfo(4).reflexiveEffects?.reversibility).toBe('medium');
      expect(handler.getStepInfo(5).type).toBe('action');
      expect(handler.getStepInfo(5).reflexiveEffects?.reversibility).toBe('low');
    });

    it('returns a focus and emoji for every step', () => {
      for (let s = 1; s <= 5; s++) {
        const info = handler.getStepInfo(s);
        expect(info.focus.length).toBeGreaterThan(0);
        expect(info.emoji.length).toBeGreaterThan(0);
      }
    });

    it('throws ValidationError for out-of-range steps', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(-1)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(6)).toThrow('Valid steps are 1-5');
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'reduce onboarding drop-off';

    it('interpolates the problem into every step', () => {
      for (let s = 1; s <= 5; s++) {
        expect(handler.getStepGuidance(s, problem)).toContain(problem);
      }
    });

    it('gives each step its own distinct instruction', () => {
      expect(handler.getStepGuidance(1, problem)).toContain('Identify wisdom sources');
      expect(handler.getStepGuidance(2, problem)).toContain(
        "Gather each source's specific insight"
      );
      expect(handler.getStepGuidance(3, problem)).toContain('Find patterns across the sources');
      expect(handler.getStepGuidance(4, problem)).toContain('Create synergistic combinations');
      expect(handler.getStepGuidance(5, problem)).toContain('Synthesize collective intelligence');
    });

    it('falls back to a generic instruction out of bounds', () => {
      expect(handler.getStepGuidance(0, problem)).toContain(
        'Complete the Collective Intelligence Synthesis process'
      );
      expect(handler.getStepGuidance(0, problem)).toContain(problem);
      expect(handler.getStepGuidance(6, problem)).toContain(
        'Complete the Collective Intelligence Synthesis process'
      );
      expect(handler.getStepGuidance(6, problem)).toContain(problem);
    });
  });

  describe('extractInsights', () => {
    it('reports one labelled insight per substantive step output', () => {
      const history = [
        { output: 'Support tickets, sales calls, and the churn survey are the live sources.' },
        { output: 'Support says the import step is where people give up.' },
        { output: 'Every source converges on the CSV import as the choke point.' },
        { output: 'Pair a guided importer with the sales onboarding call.' },
        { output: 'Fix the importer first; the call is a stopgap, not the cure.' },
      ];

      const insights = handler.extractInsights(history);

      expect(insights).toHaveLength(5);
      expect(insights[0]).toBe(
        'Identify Sources: Support tickets, sales calls, and the churn survey are the live sources.'
      );
      expect(insights[1]).toBe(
        'Gather Wisdom: Support says the import step is where people give up.'
      );
      expect(insights[2]).toBe(
        'Find Patterns: Every source converges on the CSV import as the choke point.'
      );
      expect(insights[3]).toBe(
        'Create Synergy: Pair a guided importer with the sales onboarding call.'
      );
      expect(insights[4]).toBe(
        'Synthesize Insight: Fix the importer first; the call is a stopgap, not the cure.'
      );
    });

    it("labels step 3's insight 'Find Patterns', not 'Synergy'", () => {
      const history = [
        { output: 'Sources listed.' },
        { output: 'Wisdom gathered.' },
        { output: 'Both sources point at the same import failure.' },
      ];

      const insights = handler.extractInsights(history);

      expect(insights[2]).toBe('Find Patterns: Both sources point at the same import failure.');
      expect(insights[2]).toContain('Find Patterns');
      expect(insights[2]).not.toContain('Synergy');
      expect(insights.some(i => i.startsWith('Synergy:'))).toBe(false);
    });

    it('emits no fixed completion banner for a finished session', () => {
      const history = [
        { currentStep: 1, output: 'Sources listed.', nextStepNeeded: true },
        { currentStep: 2, output: 'Wisdom gathered.', nextStepNeeded: true },
        { currentStep: 3, output: 'Patterns found.', nextStepNeeded: true },
        { currentStep: 4, output: 'Combinations built.', nextStepNeeded: true },
        { currentStep: 5, output: 'Unified direction agreed.', nextStepNeeded: false },
      ];

      const insights = handler.extractInsights(history);

      expect(insights).toEqual([
        'Identify Sources: Sources listed.',
        'Gather Wisdom: Wisdom gathered.',
        'Find Patterns: Patterns found.',
        'Create Synergy: Combinations built.',
        'Synthesize Insight: Unified direction agreed.',
      ]);
      expect(
        insights.some(
          i => i === 'Collective Intelligence synthesis completed - wisdom of many integrated'
        )
      ).toBe(false);
      expect(insights.some(i => /completed/i.test(i))).toBe(false);
    });

    it('reports structured fields alongside the output, labelled by step', () => {
      const history = [
        {
          currentStep: 1,
          output: 'Three sources worth listening to.',
          wisdomSources: ['Support tickets', 'Churn survey'],
        },
        {
          currentStep: 2,
          output: 'Each source told a different half of the story.',
        },
        {
          currentStep: 3,
          output: 'They converge.',
          emergentPatterns: ['CSV import is the choke point'],
        },
      ];

      const insights = handler.extractInsights(history);

      expect(insights).toEqual([
        'Identify Sources: Three sources worth listening to.',
        'Identify Sources recorded: Support tickets, Churn survey',
        'Gather Wisdom: Each source told a different half of the story.',
        'Find Patterns: They converge.',
        'Find Patterns recorded: CSV import is the choke point',
      ]);
    });

    it('summarises a multi-sentence output to its first sentence', () => {
      const insights = handler.extractInsights([
        { output: 'The crowd beats the expert here. Ten tickets say so, and the survey agrees.' },
      ]);

      expect(insights).toEqual(['Identify Sources: The crowd beats the expert here.']);
    });

    it('derives insights from the output rather than emitting canned text', () => {
      const first = handler.extractInsights([{ output: 'Scale is the binding constraint.' }]);
      const second = handler.extractInsights([
        { output: 'Incentives are the binding constraint.' },
      ]);

      expect(first[0]).not.toEqual(second[0]);
      expect(first[0]).toContain('Scale is the binding constraint.');
      expect(second[0]).toContain('Incentives are the binding constraint.');
    });

    it('skips steps with no recorded output and handles empty history', () => {
      expect(handler.extractInsights([])).toEqual([]);
      expect(handler.extractInsights([{ output: '' }, { output: '  ' }, {}])).toEqual([]);
    });

    it('ignores history entries beyond the five defined steps', () => {
      const history = [
        { output: 'Step one.' },
        { output: 'Step two.' },
        { output: 'Step three.' },
        { output: 'Step four.' },
        { output: 'Step five.' },
        { output: 'Stray sixth entry.' },
      ];

      const insights = handler.extractInsights(history);

      expect(insights).toHaveLength(5);
      expect(insights.some(i => i.includes('Stray sixth entry'))).toBe(false);
    });
  });
});
