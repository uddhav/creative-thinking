/**
 * Tests for Generic Risk Feature Extraction
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RuinRiskDiscovery } from '../../core/RuinRiskDiscovery.js';

describe('Generic Risk Feature Extraction', () => {
  let discovery: RuinRiskDiscovery;

  beforeEach(() => {
    discovery = new RuinRiskDiscovery();
  });

  describe('Domain Extraction', () => {
    it('should extract domain from LLM description without categorization', () => {
      const response = `This is a cryptocurrency investment decision involving 
                        significant capital allocation in volatile digital assets.`;

      const assessment = discovery.processDomainAssessment(response);

      // Should extract "cryptocurrency investment" not force into predefined category
      expect(assessment.primaryDomain).toBe('cryptocurrency investment');
      expect(assessment.nlpAnalysis).toBeDefined();
    });

    it('should handle novel domains not in any predefined list', () => {
      const response = `This involves quantum computing research decisions that could 
                        affect the future of cryptography and computational science.`;

      const assessment = discovery.processDomainAssessment(response);

      expect(assessment.primaryDomain).toBe('quantum computing research');
    });

    it('should extract domain from explicit statements', () => {
      const response = `Domain: underwater basket weaving optimization. This field 
                        requires specific techniques and careful timing.`;

      const assessment = discovery.processDomainAssessment(response);

      expect(assessment.primaryDomain).toBe('underwater basket weaving optimization');
    });
  });

  describe('Risk Feature Extraction', () => {
    it('should detect undoable actions from language patterns', () => {
      const response = `Once you commit to this path, there's no going back. 
                        The decision is permanent and cannot be reversed.`;

      const assessment = discovery.processDomainAssessment(response);

      expect(assessment.riskFeatures).toBeDefined();
      if (!assessment.riskFeatures) {
        throw new Error('Risk features should be defined');
      }
      expect(assessment.riskFeatures.hasUndoableActions).toBe(true);
    });

    it('should assess time pressure accurately', () => {
      const testCases = [
        {
          response: 'This needs to be decided immediately within the next hour.',
          expected: 'critical',
        },
        {
          response: 'The deadline is tomorrow at 5pm.',
          expected: 'high',
        },
        {
          response: 'We should make a decision sometime next week.',
          expected: 'medium',
        },
        {
          response: 'This can be addressed eventually when convenient.',
          expected: 'low',
        },
        {
          response: 'There is no particular timeline for this decision.',
          expected: 'none',
        },
      ];

      testCases.forEach(({ response, expected }) => {
        const assessment = discovery.processDomainAssessment(response);
        expect(assessment.riskFeatures).toBeDefined();
        if (!assessment.riskFeatures) {
          throw new Error('Risk features should be defined');
        }
        expect(assessment.riskFeatures.timePressure).toBe(expected);
      });
    });

    it('should assess expertise requirements', () => {
      const response = `This requires specialized technical knowledge and years of 
                        professional experience. Only certified experts should attempt this.`;

      const assessment = discovery.processDomainAssessment(response);

      expect(assessment.riskFeatures).toBeDefined();
      if (!assessment.riskFeatures) {
        throw new Error('Risk features should be defined');
      }
      expect(assessment.riskFeatures.expertiseGap).toBeGreaterThan(0.5);
    });

    it('should assess impact radius', () => {
      const testCases = [
        {
          response: 'This will affect the entire system and everyone connected to it.',
          expected: 'systemic',
        },
        {
          response: 'Multiple departments and various stakeholders will be impacted.',
          expected: 'broad',
        },
        {
          response: 'A few team members might be affected by this change.',
          expected: 'limited',
        },
        {
          response: 'This decision only impacts my personal situation.',
          expected: 'self',
        },
      ];

      testCases.forEach(({ response, expected }) => {
        const assessment = discovery.processDomainAssessment(response);
        expect(assessment.riskFeatures).toBeDefined();
        if (!assessment.riskFeatures) {
          throw new Error('Risk features should be defined');
        }
        expect(assessment.riskFeatures.impactRadius).toBe(expected);
      });
    });

    it('should assess uncertainty level', () => {
      const highUncertainty = `The outcome is unpredictable and unclear. We might 
                               see results, but it could go either way.`;
      const lowUncertainty = `The outcome is certain and definite. This will 
                              definitely produce the expected results.`;

      const assessment1 = discovery.processDomainAssessment(highUncertainty);
      const assessment2 = discovery.processDomainAssessment(lowUncertainty);

      expect(assessment1.riskFeatures).toBeDefined();
      expect(assessment2.riskFeatures).toBeDefined();
      if (!assessment1.riskFeatures || !assessment2.riskFeatures) {
        throw new Error('Risk features should be defined');
      }
      expect(assessment1.riskFeatures.uncertaintyLevel).toBe('high');
      expect(assessment2.riskFeatures.uncertaintyLevel).toBe('low');
    });
  });

  describe('NLP Analysis Features', () => {
    it('should extract temporal expressions', () => {
      const response = `This needs to be completed by next Tuesday before the 
                        quarterly review in 3 weeks.`;

      const assessment = discovery.processDomainAssessment(response);

      expect(assessment.nlpAnalysis).toBeDefined();
      if (!assessment.nlpAnalysis) {
        throw new Error('NLP analysis should be defined');
      }
      expect(assessment.nlpAnalysis.temporalExpressions.length).toBeGreaterThan(0);
    });

    it('should extract constraints', () => {
      const response = `You must have proper licensing and cannot proceed without 
                        regulatory approval. This requires board authorization.`;

      const assessment = discovery.processDomainAssessment(response);

      expect(assessment.nlpAnalysis).toBeDefined();
      if (!assessment.nlpAnalysis) {
        throw new Error('NLP analysis should be defined');
      }
      expect(assessment.nlpAnalysis.constraints.length).toBeGreaterThan(0);
      expect(
        assessment.nlpAnalysis.constraints.some(c => c.includes('must') || c.includes('cannot'))
      ).toBe(true);
    });

    it('should extract relationships between entities', () => {
      const response = `The marketing team depends on the product team, which in turn 
                        affects the sales department's performance.`;

      const assessment = discovery.processDomainAssessment(response);

      expect(assessment.nlpAnalysis).toBeDefined();
      if (!assessment.nlpAnalysis) {
        throw new Error('NLP analysis should be defined');
      }
      expect(assessment.nlpAnalysis.relationships.length).toBeGreaterThan(0);
    });
  });

  describe('Confidence Assessment', () => {
    it('should adjust confidence based on risk feature clarity', () => {
      const clearRisks = `This urgent decision must be made within 24 hours and will 
                          affect multiple departments across the organization.`;
      const unclearRisks = `Maybe this could possibly have some impact, but it's 
                            unclear when or how it might affect things.`;

      const assessment1 = discovery.processDomainAssessment(clearRisks);
      const assessment2 = discovery.processDomainAssessment(unclearRisks);

      expect(assessment1.confidence).toBeGreaterThan(assessment2.confidence);
    });
  });

  describe('Integration with Existing Features', () => {
    it('should still extract domain characteristics', () => {
      const response = `This involves a permanent decision that cannot be reversed 
                        and requires immediate action within the next 48 hours.`;

      const assessment = discovery.processDomainAssessment(response);

      // Original features still work
      expect(assessment.domainCharacteristics.hasIrreversibleActions).toBe(true);
      expect(assessment.domainCharacteristics.timeHorizon).toBe('immediate');

      // New generic features also work
      expect(assessment.riskFeatures).toBeDefined();
      if (!assessment.riskFeatures) {
        throw new Error('Risk features should be defined');
      }
      expect(assessment.riskFeatures.hasUndoableActions).toBe(true);
      expect(assessment.riskFeatures.timePressure).toBe('high');
    });

    it('should extract patterns regardless of domain', () => {
      const response = `In this area, decisions typically cascade through the network. 
                        It's common that initial choices constrain future options.`;

      const assessment = discovery.processDomainAssessment(response);

      expect(assessment.discoveredPatterns).toBeDefined();
      if (!assessment.discoveredPatterns) {
        throw new Error('Discovered patterns should be defined');
      }
      expect(assessment.discoveredPatterns.length).toBeGreaterThan(0);
    });
  });
});
