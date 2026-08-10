/**
 * FirstPrinciplesHandler had no test file at all, which is how it kept an
 * `extractInsights` that reported none of the four fields `validateStep`
 * forces every session to supply.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FirstPrinciplesHandler } from '../../techniques/FirstPrinciplesHandler.js';

describe('FirstPrinciplesHandler', () => {
  let handler: FirstPrinciplesHandler;

  beforeEach(() => {
    handler = new FirstPrinciplesHandler();
  });

  describe('getStepInfo', () => {
    it('names all five steps and marks the two action steps', () => {
      expect(handler.getStepInfo(1).name).toBe('Deconstruction');
      expect(handler.getStepInfo(2).name).toBe('Foundation Identification');
      expect(handler.getStepInfo(3).name).toBe('Assumption Challenging');
      expect(handler.getStepInfo(4).name).toBe('Reconstruction');
      expect(handler.getStepInfo(5).name).toBe('Solution Synthesis');

      expect(handler.getStepInfo(3).type).toBe('thinking');
      expect(handler.getStepInfo(4).type).toBe('action');
      expect(handler.getStepInfo(4).reflexiveEffects?.reversibility).toBe('low');
    });

    it('rejects a step outside 1-5', () => {
      expect(() => handler.getStepInfo(0)).toThrow();
      expect(() => handler.getStepInfo(6)).toThrow();
    });
  });

  describe('validateStep', () => {
    it('accepts each step with its own required field', () => {
      expect(handler.validateStep(1, { output: 'x', components: ['a'] })).toBe(true);
      expect(handler.validateStep(2, { output: 'x', fundamentalTruths: ['a'] })).toBe(true);
      expect(handler.validateStep(3, { output: 'x', assumptions: ['a'] })).toBe(true);
      expect(handler.validateStep(4, { output: 'x', reconstruction: 'a' })).toBe(true);
      expect(handler.validateStep(5, { output: 'x', solution: 'a' })).toBe(true);
    });

    it('rejects a step that omits its required field', () => {
      expect(() => handler.validateStep(1, { output: 'x' })).toThrow();
      expect(() => handler.validateStep(5, { output: 'x' })).toThrow();
    });
  });

  describe('extractInsights', () => {
    it('reports every required field under its own step name', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'The pipeline is four parts, not one.',
          components: ['ingest', 'transform', 'store', 'serve'],
        },
        { currentStep: 2, fundamentalTruths: ['a byte written must be a byte read'] },
        { currentStep: 3, assumptions: ['we assumed nightly batches were required'] },
        { currentStep: 4, reconstruction: 'Stream on write, drop the batch window entirely' },
        { currentStep: 5, solution: 'Append-only log with a materialized read view' },
      ]);

      expect(insights).toContain('Deconstruction: ingest, transform, store, serve');
      expect(insights).toContain('Foundation Identification: a byte written must be a byte read');
      expect(insights).toContain(
        'Assumption Challenging: we assumed nightly batches were required'
      );
      expect(insights).toContain('Reconstruction: Stream on write, drop the batch window entirely');
      expect(insights).toContain(
        'Solution Synthesis: Append-only log with a materialized read view'
      );
      expect(insights).toContain('Deconstruction: The pipeline is four parts, not one.');
      // No banner: reaching step 5 is not itself a finding.
      expect(insights.some(i => /breakthrough|first principles complete/i.test(i))).toBe(false);
    });

    it('reports the alias fields identically to the primary names', () => {
      const primary = handler.extractInsights([
        { currentStep: 1, components: ['a'] },
        { currentStep: 2, fundamentalTruths: ['b'] },
        { currentStep: 3, assumptions: ['c'] },
        { currentStep: 4, reconstruction: 'd' },
        { currentStep: 5, solution: 'e' },
      ]);
      const aliases = handler.extractInsights([
        { currentStep: 1, breakdown: ['a'] },
        { currentStep: 2, foundations: ['b'] },
        { currentStep: 3, challenges: ['c'] },
        { currentStep: 4, rebuilding: 'd' },
        { currentStep: 5, synthesis: 'e' },
      ]);

      expect(aliases).toEqual(primary);
      expect(aliases).toContain('Deconstruction: a');
      expect(aliases).toContain('Solution Synthesis: e');
    });

    it('reports the third alias of step 2 as well', () => {
      expect(
        handler.extractInsights([{ currentStep: 2, principles: ['conservation holds'] }])
      ).toEqual(['Foundation Identification: conservation holds']);
    });

    it('lets a revision supersede the step it revises', () => {
      const insights = handler.extractInsights([
        { currentStep: 1, components: ['the first reading'] },
        { currentStep: 2, fundamentalTruths: ['a later step'] },
        { currentStep: 1, components: ['the corrected reading'] },
      ]);

      expect(insights).toContain('Deconstruction: the corrected reading');
      expect(insights).not.toContain('Deconstruction: the first reading');
      expect(insights).toContain('Foundation Identification: a later step');
      expect(insights.some(i => i.startsWith('Assumption Challenging'))).toBe(false);
    });

    it('reports nothing for a step that recorded nothing', () => {
      expect(handler.extractInsights([])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 1, output: '   ' }])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 3, assumptions: [] }])).toEqual([]);
    });

    it('does not cut the output summary at an abbreviation', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'Cost is $4 vs. $40 per run. The batch window is the whole expense.',
        },
      ]);

      expect(insights[0]).toContain('vs. $40 per run.');
    });
  });
});
