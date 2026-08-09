/**
 * Tests for SteelmanRedTeamHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SteelmanRedTeamHandler } from '../../techniques/SteelmanRedTeamHandler.js';

describe('SteelmanRedTeamHandler', () => {
  let handler: SteelmanRedTeamHandler;

  beforeEach(() => {
    handler = new SteelmanRedTeamHandler();
  });

  describe('getTechniqueInfo', () => {
    it('returns correct technique info', () => {
      const info = handler.getTechniqueInfo();
      expect(info.name).toBe('Steelman & Red Team');
      expect(info.emoji).toBe('🥊');
      expect(info.totalSteps).toBe(7);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('relationship');
      expect(info.reflexivityProfile?.overallReversibility).toBe('medium');
    });

    it('refuses to parallelize, because both gates judge earlier work', () => {
      const info = handler.getTechniqueInfo();
      expect(info.parallelSteps?.canParallelize).toBe(false);
      // Fully sequential. The Turing test judges step 2 and the consequence
      // check judges step 5, so neither can be reached early.
      expect(info.parallelSteps?.dependencies).toEqual([
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
        [6, 7],
      ]);
    });
  });

  describe('getStepInfo', () => {
    it('marks steps 1-6 thinking and step 7 as the only action step', () => {
      for (let s = 1; s <= 6; s++) {
        expect(handler.getStepInfo(s).type, `step ${s}`).toBe('thinking');
      }
      const last = handler.getStepInfo(7);
      expect(last.type).toBe('action');
      expect(last.reflexiveEffects?.reversibility).toBe('medium');
    });

    it('returns a name and emoji for every step', () => {
      for (let s = 1; s <= 7; s++) {
        const info = handler.getStepInfo(s);
        expect(info.name.length).toBeGreaterThan(0);
        expect(info.emoji.length).toBeGreaterThan(0);
      }
    });

    it('returns the out-of-sequence shape rather than throwing', () => {
      const info = handler.getStepInfo(8);
      expect(info.name).toBe('Step 8');
      expect(info.focus).toBe('Outside the defined sequence');
    });
  });

  describe('getStepGuidance', () => {
    it('interpolates the problem into every step', () => {
      // The aggregate ratchet sits at 1.0, so a single non-interpolating step
      // fails the build. Pin it here too, where the failure is legible.
      for (let s = 1; s <= 7; s++) {
        expect(handler.getStepGuidance(s, 'SENTINEL'), `step ${s}`).toContain('SENTINEL');
      }
    });

    it('builds the opposing case to the standard its own holders would accept', () => {
      const guidance = handler.getStepGuidance(2, 'Should we consolidate onto one vendor?');
      expect(guidance.toLowerCase()).toContain('yes, that is what i think');
      // Strengthening, not merely restating — the move that separates a
      // steelman from a charitable reading.
      expect(guidance.toLowerCase()).toContain('easy to refute');
      expect(guidance.toLowerCase()).toContain('have not made but should');
    });

    it('gates on the Turing test and names both caricature failures', () => {
      const guidance = handler.getStepGuidance(3, 'p').toLowerCase();
      expect(guidance).toContain('gate');
      expect(guidance).toContain('tinman');
      expect(guidance).toContain('weakman');
      expect(guidance).toContain('go back to step 2');
    });

    it('demands a concrete adversary rather than generic risk', () => {
      const guidance = handler.getStepGuidance(4, 'p').toLowerCase();
      expect(guidance).toContain('what could go wrong');
      expect(guidance).toContain('budget');
    });

    it('runs a pre-mortem and requires an earliest observable per finding', () => {
      const guidance = handler.getStepGuidance(5, 'p').toLowerCase();
      expect(guidance).toContain('twelve months on');
      expect(guidance).toContain('earliest observable');
    });

    it('gates on independence and on findings being able to change the decision', () => {
      const guidance = handler.getStepGuidance(6, 'p').toLowerCase();
      expect(guidance).toContain('independence');
      expect(guidance).toContain('changes the decision');
      expect(guidance).toContain('theatre');
    });

    it('ends in a disposition plus the objections knowingly accepted', () => {
      const guidance = handler.getStepGuidance(7, 'p');
      expect(guidance).toContain('proceed, proceed with changes, hold, or abandon');
      expect(guidance.toLowerCase()).toContain('choosing to accept');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('falls back to the shared out-of-range contract', () => {
      for (const step of [0, 8, -1, 99]) {
        expect(handler.getStepGuidance(step, 'p')).toBe(
          'Complete the Steelman & Red Team process for: "p"'
        );
      }
    });
  });

  describe('extractInsights', () => {
    it('reports the final commitment whole, not truncated to its first sentence', () => {
      // Step 7 carries the disposition, the amendments and the objections
      // knowingly accepted. Truncating would keep only the first of the three,
      // and the accepted-objection list is the durable part of the record.
      const history = [
        { output: 'Consolidating observability onto one vendor. Three-year term.' },
        { output: 'Multi-vendor keeps pricing honest. Renewal leverage survives.' },
        { output: 'Yes — Priya holds this view and would sign it.' },
        { output: 'The account team at renewal. They know our switching cost.' },
        { output: 'Year-four uplift we cannot refuse. Observable: no price cap in the draft.' },
        { output: 'Not independent — I wrote the proposal. The cap finding changes it.' },
        {
          output:
            'Proceed with changes. Amendment: price cap plus export SLA, owner Dev, by 14 Oct. Accepted knowingly: single-vendor outage blast radius.',
        },
      ];

      const insights = handler.extractInsights(history);

      expect(insights).toHaveLength(7);
      expect(insights[0]).toBe(
        'Name the Target and the Stake: Consolidating observability onto one vendor.'
      );
      expect(insights[6]).toContain('owner Dev');
      expect(insights[6]).toContain('Accepted knowingly: single-vendor outage blast radius.');
    });

    it('derives insights from the output rather than emitting canned text', () => {
      const first = handler.extractInsights([{ output: 'The rewrite is the target.' }]);
      const second = handler.extractInsights([{ output: 'The hiring freeze is the target.' }]);

      expect(first[0]).not.toEqual(second[0]);
      expect(first[0]).toContain('The rewrite is the target.');
      expect(second[0]).toContain('The hiring freeze is the target.');
    });

    it('skips steps with no recorded output', () => {
      expect(handler.extractInsights([{ output: '' }, { output: '   ' }, {}])).toEqual([]);
    });
  });
});
