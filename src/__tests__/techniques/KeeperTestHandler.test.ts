/**
 * Tests for KeeperTestHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KeeperTestHandler } from '../../techniques/KeeperTestHandler.js';

describe('KeeperTestHandler', () => {
  let handler: KeeperTestHandler;

  beforeEach(() => {
    handler = new KeeperTestHandler();
  });

  describe('getTechniqueInfo', () => {
    it('returns correct technique info', () => {
      const info = handler.getTechniqueInfo();
      expect(info.name).toBe('Keeper Test');
      expect(info.emoji).toBe('🛒');
      expect(info.totalSteps).toBe(5);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('strategic');
      expect(info.reflexivityProfile?.overallReversibility).toBe('low');
    });
  });

  describe('getStepInfo', () => {
    it('marks steps 1-4 thinking and step 5 as the only action step', () => {
      for (let s = 1; s <= 4; s++) {
        expect(handler.getStepInfo(s).type).toBe('thinking');
      }
      const last = handler.getStepInfo(5);
      expect(last.type).toBe('action');
      expect(last.reflexiveEffects?.reversibility).toBe('low');
    });

    it('returns a name and emoji for every step', () => {
      for (let s = 1; s <= 5; s++) {
        const info = handler.getStepInfo(s);
        expect(info.name.length).toBeGreaterThan(0);
        expect(info.emoji.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getStepGuidance', () => {
    it('interpolates the problem into every step', () => {
      // The aggregate ratchet sits at 1.0, so a single non-interpolating step
      // fails the build. Pin it here too, where the failure is legible.
      for (let s = 1; s <= 5; s++) {
        expect(handler.getStepGuidance(s, 'SENTINEL'), `step ${s}`).toContain('SENTINEL');
      }
    });

    it('asks the acquisition question rather than the elimination question', () => {
      const guidance = handler.getStepGuidance(3, 'Should we keep the analytics tool?');
      expect(guidance).toContain('would you take it on');
      expect(guidance.toLowerCase()).toContain('burden of proof');
    });

    it('reconstructs the fence before judging it', () => {
      const guidance = handler.getStepGuidance(2, 'p');
      expect(guidance.toLowerCase()).toContain('why it was put there');
    });

    it('separates the three costs and strikes out sunk cost', () => {
      const guidance = handler.getStepGuidance(4, 'p');
      expect(guidance).toContain('Carrying cost');
      expect(guidance).toContain('Switching cost');
      expect(guidance).toContain('Opportunity cost');
      expect(guidance).toContain('already spent');
    });

    it('ends in a verdict plus a tripwire, not a review date', () => {
      const guidance = handler.getStepGuidance(5, 'p');
      expect(guidance).toContain('tripwire');
      expect(guidance).toContain('keep, trim, replace, drop');
    });

    it('falls back to the shared out-of-range contract', () => {
      for (const step of [0, 6, -1, 99]) {
        expect(handler.getStepGuidance(step, 'p')).toBe(
          'Complete the Keeper Test process for: "p"'
        );
      }
    });
  });

  describe('extractInsights', () => {
    it('reports the final verdict whole, not truncated to its first sentence', () => {
      // The last step carries verdict, owner and tripwire in separate sentences.
      // Truncating it would discard the two things that make the decision hold.
      const history = [
        { output: 'The Growth plan tier at $2.4k a month. Owner left last year.' },
        { output: 'Adopted for the 2023 activation push.' },
        { output: 'No. We would buy the cheap tier today.' },
        { output: 'Carrying $28.8k a year. Switching loses three years of history.' },
        { output: 'Trim to the cheap tier. Owner: Priya, by 30 Nov. Tripwire: any price rise.' },
      ];

      const insights = handler.extractInsights(history);

      expect(insights).toHaveLength(5);
      expect(insights[0]).toBe('Name the Incumbent: The Growth plan tier at $2.4k a month.');
      expect(insights[4]).toContain('Owner: Priya');
      expect(insights[4]).toContain('Tripwire: any price rise.');
    });

    it('derives insights from the output rather than emitting canned text', () => {
      const first = handler.extractInsights([{ output: 'Nobody has opened it since March.' }]);
      const second = handler.extractInsights([{ output: 'Three teams depend on it daily.' }]);

      expect(first[0]).not.toEqual(second[0]);
      expect(first[0]).toContain('Nobody has opened it since March.');
      expect(second[0]).toContain('Three teams depend on it daily.');
    });

    it('skips steps with no recorded output', () => {
      expect(handler.extractInsights([{ output: '' }, { output: '   ' }, {}])).toEqual([]);
    });
  });
});
