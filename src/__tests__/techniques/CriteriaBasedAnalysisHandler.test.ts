/**
 * Tests for CriteriaBasedAnalysisHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CriteriaBasedAnalysisHandler } from '../../techniques/CriteriaBasedAnalysisHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('CriteriaBasedAnalysisHandler', () => {
  let handler: CriteriaBasedAnalysisHandler;

  beforeEach(() => {
    handler = new CriteriaBasedAnalysisHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Criteria-Based Analysis');
      expect(info.emoji).toBe('🔬');
      expect(info.totalSteps).toBe(5);
      expect(info.description).toContain('Systematic evaluation');
      expect(info.focus).toContain('Truth verification');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('structural');
      expect(info.reflexivityProfile?.riskLevel).toBe('low');
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Baseline Assessment');
      expect(step1.emoji).toBe('🎯');
      expect(step1.type).toBe('thinking');

      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Cognitive Criteria Analysis');
      expect(step2.emoji).toBe('🧠');
      expect(step2.type).toBe('thinking');

      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Motivational Analysis');
      expect(step3.emoji).toBe('💭');
      expect(step3.type).toBe('thinking');
      expect(step3.reflexiveEffects?.reversibility).toBe('medium');

      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Reality Monitoring');
      expect(step4.emoji).toBe('🔍');
      expect(step4.type).toBe('action');
      expect(step4.reflexiveEffects?.reversibility).toBe('low');

      const step5 = handler.getStepInfo(5);
      expect(step5.name).toBe('Validity Synthesis');
      expect(step5.emoji).toBe('✅');
      expect(step5.type).toBe('action');
      expect(step5.reflexiveEffects?.reversibility).toBe('low');
    });

    it('should throw error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(6)).toThrow(ValidationError);

      try {
        handler.getStepInfo(6);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_STEP);
        expect((error as ValidationError).message).toContain('Valid steps are 1-5');
      }
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'How to verify the authenticity of a proposed solution';

    it('should provide guidance for step 1 - Baseline Assessment', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Baseline Assessment');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('truth');
      expect(guidance).toContain('validity');
      expect(guidance).toContain('normal patterns');
    });

    it('should provide guidance for step 2 - Cognitive Criteria', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Cognitive Criteria Analysis');
      expect(guidance).toContain('logical consistency');
      expect(guidance).toContain('Detail richness');
      expect(guidance).toContain('unexpected complications');
    });

    it('should provide guidance for step 3 - Motivational Analysis', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('Motivational Analysis');
      expect(guidance).toContain('incentive');
      expect(guidance).toContain('bias');
      expect(guidance).toContain('stakeholder');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('should provide guidance for step 4 - Reality Monitoring', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('Reality Monitoring');
      expect(guidance).toContain('verification');
      expect(guidance).toContain('external sources');
      expect(guidance).toContain('High Reflexivity');
      expect(guidance).toContain('trust');
    });

    it('should provide guidance for step 5 - Validity Synthesis', () => {
      const guidance = handler.getStepGuidance(5, problem);
      expect(guidance).toContain('Validity Synthesis');
      expect(guidance).toContain('validity score');
      expect(guidance).toContain('confidence');
      expect(guidance).toContain('recommendations');
      expect(guidance).toContain('High Reflexivity');
    });
  });

  describe('validateStep', () => {
    it('should validate step number bounds', () => {
      expect(handler.validateStep(1, {})).toBe(true);
      expect(handler.validateStep(5, {})).toBe(true);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(6, {})).toBe(false);
    });

    it('should validate validity score for step 5', () => {
      expect(handler.validateStep(5, { validityScore: 75 })).toBe(true);
      expect(handler.validateStep(5, { validityScore: 0 })).toBe(true);
      expect(handler.validateStep(5, { validityScore: 100 })).toBe(true);
      expect(handler.validateStep(5, { validityScore: -10 })).toBe(false);
      expect(handler.validateStep(5, { validityScore: 110 })).toBe(false);
      expect(handler.validateStep(5, { validityScore: 'not a number' })).toBe(false);
    });
  });

  describe('extractInsights', () => {
    it('should extract insights from history', () => {
      const history = [
        { output: 'Initial assessment shows consistency in the data' },
        { output: 'Analysis reveals some contradictions in claims' },
        { output: 'Stakeholder motivations appear aligned' },
        { output: 'External verification confirmed most claims' },
        { output: 'Final assessment complete', validityScore: 75 },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Inconsistencies detected'))).toBe(true);
      expect(insights).toContain('Validity Score: 75%');
      expect(insights).toContain('Moderate validity - Proceed with appropriate caution');
    });

    it('should handle high validity scores', () => {
      const history = [
        { output: 'All checks passed' },
        { output: 'No issues found' },
        { output: 'Everything verified' },
        { output: 'All consistent' },
        { output: 'High confidence', validityScore: 92 },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Validity Score: 92%');
      expect(insights).toContain('High validity - Strong confidence in findings');
    });

    it('should handle low validity scores', () => {
      const history = [
        { output: 'Problems detected' },
        { output: 'Inconsistent data' },
        { output: 'Questionable sources' },
        { output: 'Major contradictions' },
        { output: 'Low confidence', validityScore: 25 },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Validity Score: 25%');
      expect(insights).toContain('Very low validity - Major red flags present');
    });
  });
});
