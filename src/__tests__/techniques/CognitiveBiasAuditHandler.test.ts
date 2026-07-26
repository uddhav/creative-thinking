/**
 * Tests for CognitiveBiasAuditHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CognitiveBiasAuditHandler } from '../../techniques/CognitiveBiasAuditHandler.js';
import { ValidationError } from '../../errors/types.js';

describe('CognitiveBiasAuditHandler', () => {
  let handler: CognitiveBiasAuditHandler;

  beforeEach(() => {
    handler = new CognitiveBiasAuditHandler();
  });

  describe('getTechniqueInfo', () => {
    it('returns correct technique info', () => {
      const info = handler.getTechniqueInfo();
      expect(info.name).toBe('Cognitive Bias Audit');
      expect(info.emoji).toBe('🪞');
      expect(info.totalSteps).toBe(9);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('behavioral');
      expect(info.reflexivityProfile?.riskLevel).toBe('low');
    });
  });

  describe('getStepInfo', () => {
    it('marks steps 1-8 as thinking and step 9 as the only action step', () => {
      for (let s = 1; s <= 8; s++) {
        expect(handler.getStepInfo(s).type).toBe('thinking');
      }
      const step9 = handler.getStepInfo(9);
      expect(step9.type).toBe('action');
      expect(step9.reflexiveEffects?.reversibility).toBe('medium');
    });

    it('returns a name and emoji for every step', () => {
      for (let s = 1; s <= 9; s++) {
        const info = handler.getStepInfo(s);
        expect(info.name.length).toBeGreaterThan(0);
        expect(info.emoji.length).toBeGreaterThan(0);
      }
    });

    it('throws ValidationError for out-of-range steps', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(10)).toThrow('Valid steps are 1-9');
    });
  });

  describe('getStepGuidance', () => {
    it('echoes the problem in step 1', () => {
      const guidance = handler.getStepGuidance(1, 'Should we acquire X?');
      expect(guidance).toContain('Should we acquire X?');
    });

    it('mentions the lollapalooza confluence in step 7', () => {
      expect(handler.getStepGuidance(7, 'p')).toContain('Lollapalooza');
    });

    it('appends the data-driven tendency checklist on scan steps', () => {
      const guidance = handler.getStepGuidance(2, 'p');
      expect(guidance).toContain('windage factor');
      expect(guidance).toContain('Run the checklist for this lens');
    });
  });

  describe('extractInsights', () => {
    it('reports what the session actually recorded, labelled by step', () => {
      const history = [
        { output: 'The board wants this acquisition closed by Q3.' },
        { output: 'My bonus is tied to deal volume, not deal quality.' },
      ];

      const insights = handler.extractInsights(history);

      expect(insights).toHaveLength(2);
      expect(insights[0]).toContain('Frame the Judgment');
      expect(insights[0]).toContain('The board wants this acquisition closed by Q3.');
      expect(insights[1]).toContain('Follow the Incentives');
      expect(insights[1]).toContain('My bonus is tied to deal volume');
    });

    it('derives insights from the output rather than emitting canned text', () => {
      // The regression guard that matters: identical step positions with
      // different content must produce different insights. Fixed strings keyed
      // by step index would report findings the session never contained.
      const first = handler.extractInsights([{ output: 'Incentives point at closing fast.' }]);
      const second = handler.extractInsights([{ output: 'Nobody here gains from saying no.' }]);

      expect(first[0]).not.toEqual(second[0]);
      expect(first[0]).toContain('Incentives point at closing fast.');
      expect(second[0]).toContain('Nobody here gains from saying no.');
    });

    it('skips steps with no recorded output', () => {
      expect(handler.extractInsights([{ output: '' }, { output: '   ' }, {}])).toEqual([]);
    });
  });
});
