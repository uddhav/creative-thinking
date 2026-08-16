/**
 * YesAndHandler insight-extraction tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { YesAndHandler } from '../../techniques/YesAndHandler.js';

describe('YesAndHandler', () => {
  let handler: YesAndHandler;

  beforeEach(() => {
    handler = new YesAndHandler();
  });

  describe('extractInsights', () => {
    it('should report negative and neutral evaluations, not only "good" and "strong" ones', () => {
      // Step 3 used to filter evaluations on the literal substrings "good" and
      // "strong", so every judgement that an addition did not work was dropped
      // by construction — the one thing this step can usefully say.
      const history = [
        {
          currentStep: 3,
          evaluations: [
            'The kiosk addition costs more than the problem',
            'Pairing the two ideas is neutral at best',
            'The referral loop is a strong fit',
          ],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Evaluation: The kiosk addition costs more than the problem',
        'Evaluation: Pairing the two ideas is neutral at best',
        'Evaluation: The referral loop is a strong fit',
      ]);
      expect(insights.some(i => i.startsWith('Positive aspect:'))).toBe(false);
    });

    it('should report every addition, not just the first', () => {
      const history = [
        {
          currentStep: 2,
          additions: ['Add a referral loop', 'Add a kiosk', 'Add a weekend slot'],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Addition: Add a referral loop');
      expect(insights).toContain('Addition: Add a kiosk');
      expect(insights).toContain('Addition: Add a weekend slot');
    });

    it('should report the synthesis whole rather than cutting it at 100 characters', () => {
      const synthesis =
        'Keep the referral loop and the weekend slot, drop the kiosk, and let the weekend slot ' +
        'feed the referral loop so each new customer arrives already introduced by someone.';
      const history = [{ currentStep: 4, synthesis }];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([`Synthesis achieved: ${synthesis}`]);
      expect(insights.some(i => i.endsWith('...'))).toBe(false);
    });

    it("should report each step's output, which was read by no step before", () => {
      const history = [
        { currentStep: 1, output: 'Start with the referral idea, imperfect as it is.' },
        { currentStep: 2, output: 'Yes, and the weekend slot makes it reachable.' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Accept Initial Idea: Start with the referral idea, imperfect as it is.',
        'Add and Build: Yes, and the weekend slot makes it reachable.',
      ]);
    });

    it('should report nothing for a step that recorded nothing', () => {
      expect(handler.extractInsights([])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 3, output: '  ' }])).toEqual([]);
    });

    it('should key on currentStep so a revision supersedes what it revises', () => {
      const history = [
        { currentStep: 1, initialIdea: 'The first idea' },
        { currentStep: 2, additions: ['An addition'] },
        { currentStep: 1, initialIdea: 'The corrected idea' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual(['Initial idea: The corrected idea', 'Addition: An addition']);
    });
  });
});
