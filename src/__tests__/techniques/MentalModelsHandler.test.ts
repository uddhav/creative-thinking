/**
 * Tests for MentalModelsHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MentalModelsHandler } from '../../techniques/MentalModelsHandler.js';
import { ValidationError } from '../../errors/types.js';

describe('MentalModelsHandler', () => {
  let handler: MentalModelsHandler;

  beforeEach(() => {
    handler = new MentalModelsHandler();
  });

  describe('getTechniqueInfo', () => {
    it('returns correct technique info', () => {
      const info = handler.getTechniqueInfo();
      expect(info.name).toBe('Latticework of Mental Models');
      expect(info.emoji).toBe('🧰');
      expect(info.totalSteps).toBe(7);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('strategic');
      expect(info.parallelSteps?.canParallelize).toBe(true);
    });
  });

  describe('getStepInfo', () => {
    it('marks steps 1-6 as thinking and step 7 as the only action step', () => {
      for (let s = 1; s <= 6; s++) {
        expect(handler.getStepInfo(s).type).toBe('thinking');
      }
      const step7 = handler.getStepInfo(7);
      expect(step7.type).toBe('action');
      expect(step7.reflexiveEffects?.reversibility).toBe('medium');
    });

    it('returns a name and emoji for every step', () => {
      for (let s = 1; s <= 7; s++) {
        const info = handler.getStepInfo(s);
        expect(info.name.length).toBeGreaterThan(0);
        expect(info.emoji.length).toBeGreaterThan(0);
      }
    });

    it('throws ValidationError for out-of-range steps', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(8)).toThrow('Valid steps are 1-7');
    });
  });

  describe('getStepGuidance', () => {
    it('echoes the problem and names the one-hammer trap in step 1', () => {
      const guidance = handler.getStepGuidance(1, 'Should we rewrite this service?');
      expect(guidance).toContain('Should we rewrite this service?');
      expect(guidance).toContain('hammer');
    });

    it('appends the data-driven model checklist on each lens step', () => {
      for (let s = 2; s <= 5; s++) {
        expect(handler.getStepGuidance(s, 'p')).toContain('Models in this lens');
      }
    });

    it('covers the four disciplinary lenses with distinct models', () => {
      expect(handler.getStepGuidance(2, 'p')).toContain('Common-mode failure');
      expect(handler.getStepGuidance(3, 'p')).toContain('Carrying capacity');
      expect(handler.getStepGuidance(4, 'p')).toContain('Incentive super-response');
      expect(handler.getStepGuidance(5, 'p')).toContain('Inversion');
    });

    it('demands synthesis in step 6 and a margin of safety in step 7', () => {
      expect(handler.getStepGuidance(6, 'p')).toContain('synthesis');
      expect(handler.getStepGuidance(7, 'p')).toContain('margin of safety');
    });
  });

  describe('extractInsights', () => {
    it('surfaces lens application, synthesis, and the final decision', () => {
      const history = Array.from({ length: 7 }, (_, i) => ({ output: `step ${i + 1} output` }));
      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.toLowerCase().includes('lens'))).toBe(true);
      expect(insights.some(i => i.toLowerCase().includes('synthesis'))).toBe(true);
      expect(insights.some(i => i.toLowerCase().includes('margin of safety'))).toBe(true);
    });
  });
});
