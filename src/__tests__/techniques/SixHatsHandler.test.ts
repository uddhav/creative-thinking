/**
 * Six Thinking Hats handler.
 *
 * The catalogue's most-referenced technique had no handler test, which is how
 * `extractInsights` came to drop findings that did not happen to contain a
 * particular English word — a full session of substantive hat outputs returned
 * an empty array, silently. The extractInsights block below is that regression.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SixHatsHandler } from '../../techniques/SixHatsHandler.js';
import { ValidationError } from '../../errors/types.js';

describe('SixHatsHandler', () => {
  let handler: SixHatsHandler;

  beforeEach(() => {
    handler = new SixHatsHandler();
  });

  describe('getTechniqueInfo', () => {
    it('reports seven hats including Purple', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Six Thinking Hats');
      expect(info.totalSteps).toBe(7);
      expect(info.parallelSteps?.canParallelize).toBe(true);
    });
  });

  describe('getStepInfo', () => {
    it('walks the hats in order', () => {
      const names = [1, 2, 3, 4, 5, 6, 7].map(step => handler.getStepInfo(step).name);

      expect(names).toEqual([
        'Blue Hat',
        'White Hat',
        'Red Hat',
        'Yellow Hat',
        'Black Hat',
        'Green Hat',
        'Purple Hat',
      ]);
    });

    it('rejects a step outside the hat order', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(8)).toThrow(ValidationError);
    });
  });

  describe('getStepGuidance', () => {
    it('interpolates the problem into every step', () => {
      for (let step = 1; step <= 7; step++) {
        expect(handler.getStepGuidance(step, 'the deploy pipeline')).toContain(
          'the deploy pipeline'
        );
      }
    });

    it('degrades to a generic prompt out of bounds rather than throwing', () => {
      expect(handler.getStepGuidance(99, 'x')).toContain('Six Thinking Hats');
    });
  });

  describe('validateStep', () => {
    it('accepts a hat colour matching the step', () => {
      expect(handler.validateStep(5, { output: 'risks', hatColor: 'black' })).toBe(true);
    });

    it('rejects a hat colour belonging to another step', () => {
      expect(handler.validateStep(5, { output: 'risks', hatColor: 'green' })).toBe(false);
    });
  });

  describe('extractInsights', () => {
    it('reports what each hat recorded, labelled by the hat', () => {
      const insights = handler.extractInsights([
        { hatColor: 'white', output: 'Deploys take 40 minutes. Six teams share one Postgres.' },
        { hatColor: 'green', output: 'Replace the nightly batch with an event stream.' },
      ]);

      expect(insights).toHaveLength(2);
      expect(insights[0]).toContain('White Hat');
      expect(insights[0]).toContain('Deploys take 40 minutes.');
      expect(insights[1]).toContain('Green Hat');
      expect(insights[1]).toContain('Replace the nightly batch with an event stream.');
    });

    it('does not require a keyword to report a finding', () => {
      // Each of these is a real finding phrased without the word the handler
      // once gated on: green without "could"/"might", red without
      // "concern"/"worry", white without "missing", purple without
      // "irreversible"/"lock". All four used to be discarded in silence.
      const insights = handler.extractInsights([
        { hatColor: 'green', output: 'Replace the nightly batch with an event stream.' },
        { hatColor: 'red', output: 'The team is exhausted and resents the on-call rota.' },
        { hatColor: 'white', output: 'Deploys take 40 minutes.' },
        {
          hatColor: 'purple',
          output: 'Sharding the customer table cannot be undone once exports depend on it.',
        },
      ]);

      expect(insights).toHaveLength(4);
      expect(insights.map(i => i.split(':')[0])).toEqual([
        'Green Hat',
        'Red Hat',
        'White Hat',
        'Purple Hat',
      ]);
    });

    it('derives insights from the output rather than emitting canned text', () => {
      const first = handler.extractInsights([{ hatColor: 'red', output: 'Scale worries me.' }]);
      const second = handler.extractInsights([{ hatColor: 'red', output: 'Incentives worry me.' }]);

      expect(first[0]).not.toEqual(second[0]);
      expect(first[0]).toContain('Scale worries me.');
      expect(second[0]).toContain('Incentives worry me.');
    });

    it('reports the Black Hat narrative and its enumerated risks separately', () => {
      const insights = handler.extractInsights([
        {
          hatColor: 'black',
          output: 'The rollback path is untested.',
          risks: ['no rollback drill', 'single maintainer'],
        },
      ]);

      expect(insights).toHaveLength(2);
      expect(insights[0]).toContain('Black Hat');
      expect(insights[0]).toContain('The rollback path is untested.');
      expect(insights[1]).toContain('no rollback drill');
      expect(insights[1]).toContain('single maintainer');
    });

    it('skips entries with no output and unknown hat colours', () => {
      expect(
        handler.extractInsights([
          { hatColor: 'white', output: '' },
          { hatColor: 'white', output: '   ' },
          { hatColor: 'orange', output: 'not a hat' },
          { output: 'no hat colour' },
        ])
      ).toEqual([]);
    });
  });
});
