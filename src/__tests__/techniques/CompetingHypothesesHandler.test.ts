/**
 * Tests for CompetingHypothesesHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CompetingHypothesesHandler } from '../../techniques/CompetingHypothesesHandler.js';
import type { EvidenceHypothesisMatrix } from '../../techniques/CompetingHypothesesHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('CompetingHypothesesHandler', () => {
  let handler: CompetingHypothesesHandler;

  beforeEach(() => {
    handler = new CompetingHypothesesHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Competing Hypotheses Analysis');
      expect(info.emoji).toBe('⚖️');
      expect(info.totalSteps).toBe(8);
      expect(info.description).toContain('Systematic evaluation');
      expect(info.focus).toContain('Rigorous hypothesis testing');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('structural');
      expect(info.reflexivityProfile?.riskLevel).toBe('medium');
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Hypothesis Generation');
      expect(step1.emoji).toBe('💡');
      expect(step1.type).toBe('thinking');

      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Evidence Mapping');
      expect(step2.emoji).toBe('📊');
      expect(step2.type).toBe('thinking');

      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Matrix Construction');
      expect(step3.emoji).toBe('🔳');
      expect(step3.type).toBe('action');
      expect(step3.reflexiveEffects?.reversibility).toBe('medium');

      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Diagnostic Value Assessment');
      expect(step4.emoji).toBe('🎯');
      expect(step4.type).toBe('thinking');
      expect(step4.reflexiveEffects?.reversibility).toBe('medium');

      const step5 = handler.getStepInfo(5);
      expect(step5.name).toBe('Deception Scenario Modeling');
      expect(step5.emoji).toBe('🎭');
      expect(step5.type).toBe('action');
      expect(step5.reflexiveEffects?.reversibility).toBe('low');

      const step6 = handler.getStepInfo(6);
      expect(step6.name).toBe('Bayesian Update');
      expect(step6.emoji).toBe('📈');
      expect(step6.type).toBe('action');
      expect(step6.reflexiveEffects?.reversibility).toBe('low');

      const step7 = handler.getStepInfo(7);
      expect(step7.name).toBe('Sensitivity Analysis');
      expect(step7.emoji).toBe('🔄');
      expect(step7.type).toBe('thinking');
      expect(step7.reflexiveEffects?.reversibility).toBe('medium');

      const step8 = handler.getStepInfo(8);
      expect(step8.name).toBe('Decision Synthesis');
      expect(step8.emoji).toBe('✅');
      expect(step8.type).toBe('action');
      expect(step8.reflexiveEffects?.reversibility).toBe('low');
    });

    it('should throw error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(9)).toThrow(ValidationError);

      try {
        handler.getStepInfo(9);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_STEP);
        expect((error as ValidationError).message).toContain('Valid steps are 1-8');
      }
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'Determine the cause of product defects';

    it('should provide guidance for step 1 - Hypothesis Generation', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Hypothesis Generation');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('competing explanations');
      expect(guidance).toContain('null hypothesis');
      expect(guidance.toLowerCase()).toContain('deception');
    });

    it('should provide guidance for step 2 - Evidence Mapping', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Evidence Mapping');
      expect(guidance).toContain('evidence');
      expect(guidance).toContain('quality');
      expect(guidance).toContain('reliability');
    });

    it('should provide guidance for step 3 - Matrix Construction', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('Matrix Construction');
      expect(guidance).toContain('compatibility');
      expect(guidance).toContain('ratings');
      expect(guidance).toContain('diagnostic');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('should provide guidance for step 4 - Diagnostic Value', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('Diagnostic Value Assessment');
      expect(guidance).toContain('discriminat');
      expect(guidance).toContain('evidence gaps');
      expect(guidance).toContain('Medium Reflexivity');
    });

    it('should provide guidance for step 5 - Deception Modeling', () => {
      const guidance = handler.getStepGuidance(5, problem);
      expect(guidance).toContain('Deception Scenario Modeling');
      expect(guidance).toContain('manipulation');
      expect(guidance.toLowerCase()).toContain('adversar');
      expect(guidance).toContain('High Reflexivity');
    });

    it('should provide guidance for step 6 - Bayesian Update', () => {
      const guidance = handler.getStepGuidance(6, problem);
      expect(guidance).toContain('Bayesian Update');
      expect(guidance).toContain('probabilities');
      expect(guidance.toLowerCase()).toContain('evidence');
      expect(guidance).toContain('High Reflexivity');
    });

    it('should provide guidance for step 7 - Sensitivity Analysis', () => {
      const guidance = handler.getStepGuidance(7, problem);
      expect(guidance).toContain('Sensitivity Analysis');
      expect(guidance.toLowerCase()).toContain('evidence');
      expect(guidance).toContain('Robustness');
      expect(guidance.toLowerCase()).toContain('critical');
    });

    it('should provide guidance for step 8 - Decision Synthesis', () => {
      const guidance = handler.getStepGuidance(8, problem);
      expect(guidance).toContain('Decision Synthesis');
      expect(guidance).toContain('conclusion');
      expect(guidance).toContain('confidence');
      expect(guidance).toContain('monitoring');
      expect(guidance).toContain('High Reflexivity');
    });
  });

  describe('validateStep', () => {
    it('should validate step number bounds', () => {
      expect(handler.validateStep(1, {})).toBe(true);
      expect(handler.validateStep(8, {})).toBe(true);
      expect(handler.validateStep(0, {})).toBe(false);
      expect(handler.validateStep(9, {})).toBe(false);
    });

    it('should validate matrix structure for step 3', () => {
      const validMatrix = {
        matrix: {
          hypotheses: ['H1', 'H2'],
          evidence: ['E1', 'E2'],
          ratings: { E1_H1: 1, E1_H2: -1, E2_H1: 0, E2_H2: 2 },
        },
      };
      expect(handler.validateStep(3, validMatrix)).toBe(true);

      const invalidMatrix1 = {
        matrix: {
          hypotheses: 'not an array',
          evidence: ['E1'],
          ratings: {},
        },
      };
      expect(handler.validateStep(3, invalidMatrix1)).toBe(false);

      const invalidMatrix2 = {
        matrix: {
          hypotheses: ['H1'],
          evidence: ['E1'],
          ratings: { E1_H1: 3 }, // rating out of range
        },
      };
      expect(handler.validateStep(3, invalidMatrix2)).toBe(false);

      const invalidMatrix3 = {
        matrix: {
          hypotheses: ['H1'],
          evidence: ['E1'],
          ratings: 'not an object',
        },
      };
      expect(handler.validateStep(3, invalidMatrix3)).toBe(false);

      expect(handler.validateStep(3, { matrix: null })).toBe(false);
    });

    it('should validate probabilities sum for step 6', () => {
      expect(handler.validateStep(6, { probabilities: { H1: 0.5, H2: 0.5 } })).toBe(true);
      expect(handler.validateStep(6, { probabilities: { H1: 0.33, H2: 0.33, H3: 0.34 } })).toBe(
        true
      );
      expect(handler.validateStep(6, { probabilities: { H1: 0.999, H2: 0.001 } })).toBe(true); // within tolerance

      expect(handler.validateStep(6, { probabilities: { H1: 0.5, H2: 0.4 } })).toBe(false); // sum = 0.9
      expect(handler.validateStep(6, { probabilities: { H1: 0.6, H2: 0.6 } })).toBe(false); // sum = 1.2
      expect(handler.validateStep(6, { probabilities: 'not an object' })).toBe(false);
      expect(handler.validateStep(6, { probabilities: null })).toBe(false);
    });

    it('should validate ratings are within correct range', () => {
      const matrixWithValidRatings = {
        matrix: {
          hypotheses: ['H1'],
          evidence: ['E1', 'E2'],
          ratings: { E1_H1: -2, E2_H1: 2 }, // min and max valid values
        },
      };
      expect(handler.validateStep(3, matrixWithValidRatings)).toBe(true);

      const matrixWithInvalidRatings = {
        matrix: {
          hypotheses: ['H1'],
          evidence: ['E1'],
          ratings: { E1_H1: -3 }, // below min
        },
      };
      expect(handler.validateStep(3, matrixWithInvalidRatings)).toBe(false);
    });
  });

  describe('extractInsights', () => {
    it('should extract insights from history with matrix', () => {
      const matrix: EvidenceHypothesisMatrix = {
        hypotheses: ['Equipment failure', 'Human error', 'Material defect'],
        evidence: ['Error logs', 'Witness reports', 'Quality tests'],
        ratings: {
          'Error logs_Equipment failure': 2,
          'Error logs_Human error': -1,
          'Error logs_Material defect': 0,
        },
        diagnosticValue: {
          'Error logs': 0.8,
          'Witness reports': 0.6,
          'Quality tests': 0.9,
        },
        probabilities: {
          'Equipment failure': 0.6,
          'Human error': 0.25,
          'Material defect': 0.15,
        },
      };

      const history = [
        { output: 'Generated 3 hypotheses' },
        { output: 'Mapped 3 evidence items' },
        { output: 'Constructed evidence matrix', matrix },
        { output: 'Assessed diagnostic value' },
        { output: 'Modeled deception scenarios' },
        { output: 'Updated probabilities', probabilities: matrix.probabilities },
        { output: 'Conducted sensitivity analysis' },
        { output: 'Final decision reached' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('3 competing hypotheses'))).toBe(true);
      expect(insights).toContain('Leading hypothesis: Equipment failure (60.0%)');
    });

    it('should handle high probability hypotheses', () => {
      const history = [
        { output: 'Single dominant hypothesis' },
        { output: 'Strong evidence convergence' },
        { output: 'Matrix shows clear pattern' },
        { output: 'High diagnostic evidence' },
        { output: 'No deception indicators' },
        {
          output: 'High confidence result',
          probabilities: { 'Primary hypothesis': 0.85, Alternative: 0.15 },
        },
        { output: 'Robust to changes' },
        { output: 'Clear decision' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Leading hypothesis: Primary hypothesis (85.0%)');
    });

    it('should handle competing hypotheses with similar probabilities', () => {
      const history = [
        { output: 'Multiple viable hypotheses' },
        { output: 'Conflicting evidence' },
        { output: 'Matrix shows ambiguity' },
        { output: 'Limited diagnostic power' },
        { output: 'Possible deception' },
        {
          output: 'Uncertain outcome',
          probabilities: { H1: 0.35, H2: 0.33, H3: 0.32 },
        },
        { output: 'Sensitive to evidence changes' },
        { output: 'Requires more investigation' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Leading hypothesis: H1 (35.0%)');
    });

    it('should detect evidence matrix insights', () => {
      const matrix: EvidenceHypothesisMatrix = {
        hypotheses: ['H1', 'H2'],
        evidence: ['E1', 'E2', 'E3', 'E4'],
        ratings: {
          E1_H1: 2,
          E1_H2: -2,
          E2_H1: 1,
          E2_H2: 1,
        },
        diagnosticValue: {
          E1: 0.95,
          E2: 0.3,
          E3: 0.7,
          E4: 0.85,
        },
        probabilities: { H1: 0.7, H2: 0.3 },
      };

      const history = [
        { output: 'Generated hypotheses' },
        { output: 'Evidence collected' },
        { output: 'Matrix built', matrix },
        { output: 'Diagnostic assessment complete' },
        { output: 'No deception' },
        { output: 'Probabilities updated', probabilities: matrix.probabilities },
        { output: 'Analysis stable' },
        { output: 'Decision made' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights.some(i => i.includes('2 competing hypotheses'))).toBe(true);
      expect(insights).toContain('Leading hypothesis: H1 (70.0%)');
    });

    it('should handle missing data gracefully', () => {
      const history = [
        { output: 'Basic hypothesis generation' },
        { output: 'Limited evidence available' },
        { output: 'Partial matrix construction' },
        { output: 'Weak diagnostic power' },
        { output: 'Cannot rule out deception' },
        { output: 'Low confidence probabilities' },
        { output: 'High sensitivity to new evidence' },
        { output: 'Provisional conclusion only' },
      ];

      const insights = handler.extractInsights(history);
      // Even with no specific data, should return empty array gracefully
      expect(Array.isArray(insights)).toBe(true);
    });
  });

  describe('matrix validation', () => {
    it('should validate complete matrix structures', () => {
      const completeMatrix = {
        matrix: {
          hypotheses: ['H1', 'H2', 'H3'],
          evidence: ['E1', 'E2', 'E3', 'E4'],
          ratings: {
            E1_H1: 2,
            E1_H2: -1,
            E1_H3: 0,
            E2_H1: 1,
            E2_H2: 1,
            E2_H3: -2,
            E3_H1: 0,
            E3_H2: 2,
            E3_H3: 1,
            E4_H1: -1,
            E4_H2: 0,
            E4_H3: 2,
          },
        },
      };
      expect(handler.validateStep(3, completeMatrix)).toBe(true);
    });

    it('should reject matrices with missing components', () => {
      expect(handler.validateStep(3, { matrix: {} })).toBe(false);
      expect(handler.validateStep(3, { matrix: { hypotheses: [] } })).toBe(false);
      expect(handler.validateStep(3, { matrix: { evidence: [] } })).toBe(false);
    });

    it('should validate rating values are numbers in range', () => {
      const matrixWithStrings = {
        matrix: {
          hypotheses: ['H1'],
          evidence: ['E1'],
          ratings: { E1_H1: 'high' }, // string instead of number
        },
      };
      expect(handler.validateStep(3, matrixWithStrings)).toBe(false);
    });
  });
});
