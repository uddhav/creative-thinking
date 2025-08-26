/**
 * Tests for LinguisticForensicsHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LinguisticForensicsHandler } from '../../techniques/LinguisticForensicsHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('LinguisticForensicsHandler', () => {
  let handler: LinguisticForensicsHandler;

  beforeEach(() => {
    handler = new LinguisticForensicsHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Linguistic Forensics');
      expect(info.emoji).toBe('🔤');
      expect(info.totalSteps).toBe(6);
      expect(info.description).toContain('Systematic analysis of communication patterns');
      expect(info.focus).toContain('Deep linguistic analysis');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('relationship');
      expect(info.reflexivityProfile?.riskLevel).toBe('medium');
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Content Mapping');
      expect(step1.emoji).toBe('📝');
      expect(step1.type).toBe('thinking');

      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Pattern Recognition');
      expect(step2.emoji).toBe('🔍');
      expect(step2.type).toBe('thinking');

      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Pronoun Analysis');
      expect(step3.emoji).toBe('👤');
      expect(step3.type).toBe('thinking');
      expect(step3.reflexiveEffects?.reversibility).toBe('medium');

      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Complexity Assessment');
      expect(step4.emoji).toBe('🧩');
      expect(step4.type).toBe('action');
      expect(step4.reflexiveEffects?.reversibility).toBe('medium');

      const step5 = handler.getStepInfo(5);
      expect(step5.name).toBe('Emotional Profiling');
      expect(step5.emoji).toBe('💬');
      expect(step5.type).toBe('action');
      expect(step5.reflexiveEffects?.reversibility).toBe('low');

      const step6 = handler.getStepInfo(6);
      expect(step6.name).toBe('Coherence Verification');
      expect(step6.emoji).toBe('✅');
      expect(step6.type).toBe('action');
      expect(step6.reflexiveEffects?.reversibility).toBe('low');
    });

    it('should throw error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(7)).toThrow(ValidationError);

      try {
        handler.getStepInfo(7);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_STEP);
        expect((error as ValidationError).message).toContain('Valid steps are 1-6');
      }
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'Analyze communication patterns in customer feedback';

    it('should provide guidance for step 1 - Content Mapping', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Content Mapping');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('claims');
      expect(guidance).toContain('assertions');
      expect(guidance.toLowerCase()).toContain('omission');
    });

    it('should provide guidance for step 2 - Pattern Recognition', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Pattern Recognition');
      expect(guidance.toLowerCase()).toContain('linguistic');
      expect(guidance).toContain('anomalies');
      expect(guidance).toContain('deviation');
    });

    it('should provide guidance for step 3 - Pronoun Analysis', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('Pronoun Analysis');
      expect(guidance.toLowerCase()).toContain('ratio');
      expect(guidance).toContain('ownership');
      expect(guidance).toContain('Distancing');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('should provide guidance for step 4 - Complexity Assessment', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('Complexity Assessment');
      expect(guidance).toContain('cognitive load');
      expect(guidance.toLowerCase()).toContain('lexical');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('should provide guidance for step 5 - Emotional Profiling', () => {
      const guidance = handler.getStepGuidance(5, problem);
      expect(guidance).toContain('Emotional Profiling');
      expect(guidance).toContain('sentiment');
      expect(guidance).toContain('affect');
      expect(guidance).toContain('emotional leakage');
      expect(guidance).toContain('High Reflexivity');
    });

    it('should provide guidance for step 6 - Coherence Verification', () => {
      const guidance = handler.getStepGuidance(6, problem);
      expect(guidance).toContain('Coherence Verification');
      expect(guidance).toContain('consistency');
      expect(guidance).toContain('confidence level');
      expect(guidance).toContain('High Reflexivity');
    });
  });

  describe('validateStep', () => {
    it('should validate step number bounds', () => {
      expect(handler.validateStep(1, {})).toBe(true);
      expect(handler.validateStep(6, {})).toBe(true);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(7, {})).toBe(false);
    });

    it('should validate pronoun ratios for step 3', () => {
      expect(handler.validateStep(3, { pronounRatios: { iWe: 0.5, theyThem: 0.3 } })).toBe(true);
      expect(handler.validateStep(3, { pronounRatios: { iWe: 0, theyThem: 1 } })).toBe(true);
      expect(handler.validateStep(3, { pronounRatios: { iWe: 1.5 } })).toBe(false); // > 1
      expect(handler.validateStep(3, { pronounRatios: { iWe: -0.1 } })).toBe(false); // < 0
      expect(handler.validateStep(3, { pronounRatios: 'invalid' })).toBe(false);
      expect(handler.validateStep(3, { pronounRatios: null })).toBe(false);
    });

    it('should validate coherence score for step 6', () => {
      expect(handler.validateStep(6, { coherenceScore: 75 })).toBe(true);
      expect(handler.validateStep(6, { coherenceScore: 0 })).toBe(true);
      expect(handler.validateStep(6, { coherenceScore: 100 })).toBe(true);
      expect(handler.validateStep(6, { coherenceScore: -10 })).toBe(false);
      expect(handler.validateStep(6, { coherenceScore: 110 })).toBe(false);
      expect(handler.validateStep(6, { coherenceScore: 'not a number' })).toBe(false);
    });
  });

  describe('extractInsights', () => {
    it('should extract insights from history', () => {
      const history = [
        { output: 'Identified main claims and supporting statements' },
        { output: 'Detected pattern deviations and anomalies' },
        { output: 'Pronoun analysis shows distancing language', pronounRatios: { iWe: 0.3 } },
        { output: 'High cognitive load detected in responses' },
        { output: 'Emotional leakage suggests underlying stress' },
        { output: 'Final coherence assessment', coherenceScore: 65 },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('Psychological distancing detected'))).toBe(true);
      expect(insights).toContain('Coherence Score: 65%');
      expect(insights.some(i => i.includes('coherence'))).toBe(true);
    });

    it('should handle high coherence scores', () => {
      const history = [
        { output: 'Clear and consistent messaging' },
        { output: 'No significant anomalies' },
        { output: 'Balanced pronoun usage', pronounRatios: { iWe: 1.5 } },
        { output: 'Appropriate complexity' },
        { output: 'Emotionally congruent' },
        { output: 'High coherence', coherenceScore: 92 },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Coherence Score: 92%');
      expect(insights).toContain('High coherence - Consistent and authentic communication');
    });

    it('should handle low coherence scores', () => {
      const history = [
        { output: 'Contradictory statements found' },
        { output: 'Multiple pattern anomalies' },
        { output: 'Excessive distancing', pronounRatios: { iWe: 0.2 } },
        { output: 'Cognitive overload indicators' },
        { output: 'Emotional incongruence' },
        { output: 'Low coherence', coherenceScore: 25 },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Coherence Score: 25%');
    });

    it('should handle pronoun ownership patterns', () => {
      const history = [
        { output: 'Strong ownership language' },
        { output: 'Consistent patterns' },
        { output: 'High I/we ratio', pronounRatios: { iWe: 2.5 } },
        { output: 'Normal complexity' },
        { output: 'Confident affect' },
        { output: 'Good coherence', coherenceScore: 80 },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('High individual focus (I/We ratio > 0.7)');
    });
  });

  describe('linguistic markers', () => {
    it('should have comprehensive linguistic marker categories', () => {
      // Verify technique has all required steps

      // Content mapping step should have main markers
      const step1 = handler.getStepInfo(1);
      expect(step1).toBeDefined();

      // Pattern recognition should identify deviations
      const step2 = handler.getStepInfo(2);
      expect(step2).toBeDefined();

      // Pronoun analysis should track psychological distance
      const step3 = handler.getStepInfo(3);
      expect(step3.reflexiveEffects?.triggers).toContain('Identifying relationship dynamics');

      // Complexity assessment should evaluate cognitive load
      const step4 = handler.getStepInfo(4);
      expect(step4.reflexiveEffects?.triggers).toContain('Measuring cognitive engagement');

      // Emotional profiling should detect affect patterns
      const step5 = handler.getStepInfo(5);
      expect(step5.reflexiveEffects?.triggers).toContain('Emotional pattern identification');

      // Coherence verification should provide final assessment
      const step6 = handler.getStepInfo(6);
      expect(step6.reflexiveEffects).toBeDefined();
    });
  });
});
