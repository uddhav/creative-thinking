/**
 * TRIZHandler insight-extraction tests
 *
 * The type-level tests for triz live in ../triz.test.ts; this file covers what
 * the handler reports back from a session.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TRIZHandler } from '../../techniques/TRIZHandler.js';

describe('TRIZHandler', () => {
  let handler: TRIZHandler;

  beforeEach(() => {
    handler = new TRIZHandler();
  });

  describe('extractInsights', () => {
    it('should report step 2 removals, which had no branch at all before', () => {
      // viaNegativaRemovals is declared in the tool schema and whitelisted for
      // triz by ObjectFieldValidator, and step 2 — Remove Compromise — reported
      // nothing, so everything the caller removed was discarded.
      const history = [
        {
          currentStep: 2,
          viaNegativaRemovals: [
            'Remove the nightly batch entirely',
            'Remove the second cache tier',
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Removed: Remove the nightly batch entirely',
        'Removed: Remove the second cache tier',
      ]);
    });

    it('should report every inventive principle applied, not just the first', () => {
      const history = [
        {
          currentStep: 3,
          inventivePrinciples: [
            'Principle 1: Segmentation',
            'Principle 2: Taking out',
            'Principle 35: Parameter changes',
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Principle applied: Principle 1: Segmentation');
      expect(insights).toContain('Principle applied: Principle 2: Taking out');
      expect(insights).toContain('Principle applied: Principle 35: Parameter changes');
    });

    it("should report each step's output, which was read by no step before", () => {
      const history = [
        { currentStep: 1, output: 'Throughput rises only as latency does.' },
        { currentStep: 4, output: 'Two components do the work of the previous five.' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Identify Contradiction: Throughput rises only as latency does.',
        'Minimize Complexity: Two components do the work of the previous five.',
      ]);
    });

    it('should report the contradiction and the minimal solution', () => {
      const history = [
        { currentStep: 1, contradiction: 'Need high capacity BUT need fast charging' },
        { currentStep: 4, minimalSolution: 'Solid-state cell with optimized ion paths' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Contradiction identified: Need high capacity BUT need fast charging',
        'Minimal solution: Solid-state cell with optimized ion paths',
      ]);
    });

    it('should report nothing for a step that recorded nothing', () => {
      expect(handler.extractInsights([])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 3, output: '  ' }])).toEqual([]);
    });

    it('should key on currentStep so a revision supersedes what it revises', () => {
      const history = [
        { currentStep: 1, contradiction: 'The first contradiction' },
        { currentStep: 2, viaNegativaRemovals: ['A removal'] },
        { currentStep: 1, contradiction: 'The corrected contradiction' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Contradiction identified: The corrected contradiction',
        'Removed: A removal',
      ]);
    });
  });
});
