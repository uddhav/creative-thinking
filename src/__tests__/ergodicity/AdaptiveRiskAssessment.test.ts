/**
 * Tests for AdaptiveRiskAssessment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveRiskAssessment } from '../../ergodicity/AdaptiveRiskAssessment.js';
import { CONFIDENCE_THRESHOLDS } from '../../ergodicity/constants.js';

describe('AdaptiveRiskAssessment', () => {
  let assessment: AdaptiveRiskAssessment;

  beforeEach(() => {
    assessment = new AdaptiveRiskAssessment();
    assessment.clearCache();
  });

  describe('Context Analysis', () => {
    it('should detect personal finance context', () => {
      const context = assessment.analyzeContext(
        'How should I invest my retirement savings?',
        'Put all my savings into cryptocurrency'
      );

      expect(context.hasPersonalFinance).toBe(true);
      expect(context.hasBusinessContext).toBe(false);
      expect(context.resourceType).toBe('personal savings');
      expect(context.stakeholders).toContain('you');
    });

    it('should detect business context', () => {
      const context = assessment.analyzeContext(
        'Selecting a vendor for our company platform',
        'We should migrate all company systems to the new vendor'
      );

      expect(context.hasBusinessContext).toBe(true);
      expect(context.hasPersonalFinance).toBe(false);
      expect(context.resourceType).toBe('company resources');
      expect(context.stakeholders).toContain('organization stakeholders');
    });

    it('should handle mixed business and personal finance context', () => {
      const context = assessment.analyzeContext(
        'As a business owner, should I invest my personal savings into my company?',
        'I could put my retirement fund into the business for expansion'
      );

      expect(context.hasBusinessContext).toBe(true);
      expect(context.hasPersonalFinance).toBe(true);
      expect(context.hasHighStakes).toBe(false); // 'all' or 'entire' not present
      expect(context.stakeholders.length).toBeGreaterThan(0);
    });

    it('should detect high stakes indicators', () => {
      const context = assessment.analyzeContext(
        'Should I commit everything to this opportunity?',
        'Invest all resources permanently with no way back'
      );

      expect(context.hasHighStakes).toBe(true);
      expect(context.recoveryTimeframe).toBe('permanent - cannot recover');
    });

    it('should handle creative exploration context', () => {
      const context = assessment.analyzeContext(
        'Brainstorming ideas for our product',
        'What if we imagine a completely different approach?'
      );

      expect(context.hasCreativeExploration).toBe(true);
      expect(context.hasHighStakes).toBe(false);
    });

    it('should handle technical migration context', () => {
      const context = assessment.analyzeContext(
        'Planning database migration',
        'Migrate our entire infrastructure to cloud platform'
      );

      expect(context.hasTechnicalMigration).toBe(true);
      expect(context.hasHighStakes).toBe(true); // 'entire' triggers high stakes
    });

    it('should handle health and safety context', () => {
      const context = assessment.analyzeContext(
        'Considering medical treatment options',
        'The surgery is irreversible and requires hospital stay'
      );

      expect(context.hasHealthSafety).toBe(true);
      expect(context.hasHighStakes).toBe(true); // 'irreversible' triggers high stakes
      expect(context.resourceType).toBe('health and wellbeing');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input gracefully', () => {
      const context = assessment.analyzeContext('', '');

      expect(context).toBeDefined();
      expect(context.hasPersonalFinance).toBe(false);
      expect(context.hasBusinessContext).toBe(false);
      expect(context.stakeholders).toContain('affected parties');
      expect(context.resourceType).toBe('resources');
    });

    it('should handle very long input', () => {
      const longText = 'business '.repeat(1000);
      const context = assessment.analyzeContext(longText, longText);

      expect(context).toBeDefined();
      expect(context.hasBusinessContext).toBe(true);
    });

    it('should handle non-English text gracefully', () => {
      const context = assessment.analyzeContext('这是一个测试', 'Это тест');

      expect(context).toBeDefined();
      expect(context.hasPersonalFinance).toBe(false);
      expect(context.hasBusinessContext).toBe(false);
      expect(context.resourceType).toBe('resources');
    });

    it('should handle special characters in input', () => {
      const context = assessment.analyzeContext(
        'Should I invest $50,000 @ 5% APR?',
        'Put 100% of funds into high-risk venture!'
      );

      expect(context).toBeDefined();
      expect(context.hasPersonalFinance).toBe(false); // No 'my savings' etc
      expect(context.hasHighStakes).toBe(false); // Doesn't contain 'all' or 'entire'
    });

    it('should handle mixed case consistently', () => {
      const context1 = assessment.analyzeContext('MY SAVINGS ACCOUNT', 'INVEST EVERYTHING');

      const context2 = assessment.analyzeContext('my savings account', 'invest everything');

      expect(context1.hasPersonalFinance).toBe(context2.hasPersonalFinance);
      expect(context1.hasHighStakes).toBe(context2.hasHighStakes);
    });
  });

  describe('Context Caching', () => {
    it('should cache context analysis results', () => {
      const problem = 'Investment decision';
      const output = 'Invest in stocks';

      // First call
      const context1 = assessment.analyzeContext(problem, output);

      // Second call with same input
      const context2 = assessment.analyzeContext(problem, output);

      expect(context1).toEqual(context2);
      // Note: We can't directly test cache hits without exposing internals,
      // but equal results suggest caching is working
    });

    it('should generate different results for different inputs', () => {
      const context1 = assessment.analyzeContext('Personal investment', 'My savings');

      const context2 = assessment.analyzeContext('Business decision', 'Company budget');

      expect(context1.hasPersonalFinance).toBe(true);
      expect(context2.hasBusinessContext).toBe(true);
      expect(context1).not.toEqual(context2);
    });

    it('should clear cache when requested', () => {
      const problem = 'Test problem';
      const output = 'Test output';

      assessment.analyzeContext(problem, output);
      assessment.clearCache();

      // After clearing, we should get fresh analysis
      // (though result will be same, internal cache is cleared)
      const context = assessment.analyzeContext(problem, output);
      expect(context).toBeDefined();
    });
  });

  describe('Adaptive Prompt Generation', () => {
    it('should generate business-appropriate language', () => {
      const context = assessment.analyzeContext(
        'Vendor selection for company',
        'Choose cloud provider'
      );

      const prompt = assessment.generateAdaptivePrompt(
        'Vendor selection for company',
        'Choose cloud provider',
        context
      );

      expect(prompt).toContain('BUSINESS DECISION ASSESSMENT');
      expect(prompt).toContain('Business Impact');
      expect(prompt).toContain('Stakeholder Impact');
    });

    it('should generate personal finance language', () => {
      const context = assessment.analyzeContext('My retirement planning', 'Invest my savings');

      const prompt = assessment.generateAdaptivePrompt(
        'My retirement planning',
        'Invest my savings',
        context
      );

      expect(prompt).toContain('FINANCIAL DECISION ASSESSMENT');
      expect(prompt).toContain('Personal Impact');
      expect(prompt).toContain('financial security');
    });

    it('should handle high-stakes escalation', () => {
      const context = assessment.analyzeContext(
        'Critical decision',
        'Commit all resources permanently'
      );

      const escalation = assessment.generateAdaptiveEscalation(
        4,
        ['total loss', 'bankruptcy'],
        context
      );

      expect(escalation).toContain('CRITICAL: HIGH-STAKES DECISION DETECTED');
      expect(escalation).toContain(`exceed ${CONFIDENCE_THRESHOLDS.HIGH_STAKES}`);
      expect(escalation).toContain('YOU MUST address');
    });

    it('should generate appropriate language for mixed contexts', () => {
      const context = assessment.analyzeContext(
        'As a business owner with personal investment',
        'Put my savings into company expansion'
      );

      const prompt = assessment.generateAdaptivePrompt(
        'As a business owner with personal investment',
        'Put my savings into company expansion',
        context
      );

      // Should contain elements relevant to both contexts
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(100);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle rapid repeated calls efficiently', () => {
      const start = Date.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        assessment.analyzeContext(
          `Problem ${i % 10}`, // Only 10 unique problems
          `Output ${i % 10}`
        );
      }

      const duration = Date.now() - start;
      // With caching, 100 calls should be very fast
      expect(duration).toBeLessThan(100); // Less than 100ms for 100 calls
    });

    it('should handle cache size limits', () => {
      // Create more than MAX_CACHE_SIZE unique inputs
      for (let i = 0; i < 150; i++) {
        assessment.analyzeContext(`Unique problem ${i}`, `Unique output ${i}`);
      }

      // Should still work without errors
      const context = assessment.analyzeContext('Final test', 'Final output');
      expect(context).toBeDefined();
    });
  });

  describe('Stakeholder Identification', () => {
    it('should identify business stakeholders correctly', () => {
      const context = assessment.analyzeContext(
        'Company decision affecting employees and customers',
        'This will impact our partners and investors'
      );

      expect(context.stakeholders).toContain('employees');
      expect(context.stakeholders).toContain('customers');
      expect(context.stakeholders).toContain('partners');
      expect(context.stakeholders).toContain('investors');
    });

    it('should identify personal stakeholders correctly', () => {
      const context = assessment.analyzeContext(
        'My savings and family financial planning',
        'This affects my dependents'
      );

      expect(context.stakeholders).toContain('you');
      expect(context.stakeholders).toContain('your family');
      expect(context.stakeholders).toContain('your dependents');
    });

    it('should default to generic stakeholders when unclear', () => {
      const context = assessment.analyzeContext('General decision', 'Some action');

      expect(context.stakeholders).toContain('affected parties');
    });
  });

  describe('Recovery Timeframe Estimation', () => {
    it('should detect permanent/irreversible timeframes', () => {
      const context = assessment.analyzeContext('Permanent decision', 'This is irreversible');

      expect(context.recoveryTimeframe).toBe('permanent - cannot recover');
    });

    it('should detect bankruptcy/ruin scenarios', () => {
      const context = assessment.analyzeContext('Financial decision', 'Could lead to bankruptcy');

      expect(context.recoveryTimeframe).toBe('may not be able to recover');
    });

    it('should detect specific timeframes', () => {
      const context1 = assessment.analyzeContext('', 'Recovery takes years');
      expect(context1.recoveryTimeframe).toBe('years');

      const context2 = assessment.analyzeContext('', 'Takes months to recover');
      expect(context2.recoveryTimeframe).toBe('months');

      const context3 = assessment.analyzeContext('', 'Few weeks to bounce back');
      expect(context3.recoveryTimeframe).toBe('weeks');
    });

    it('should default to unknown timeframe', () => {
      const context = assessment.analyzeContext('Simple decision', 'Do something');

      expect(context.recoveryTimeframe).toBe('unknown timeframe');
    });
  });
});
