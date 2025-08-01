/**
 * Tests for Risk Discovery Prompts
 */

import { describe, it, expect } from 'vitest';
import {
  getDiscoveryPhasePrompt,
  isHighRiskDiscovery,
  extractHardConstraints,
  generateConstraintViolationFeedback,
  getMetaDiscoveryPrompt,
  type DiscoveryPhase,
} from '../../ergodicity/riskDiscoveryPrompts.js';

describe('Risk Discovery Prompts', () => {
  describe('getDiscoveryPhasePrompt', () => {
    it('should generate domain identification prompt', () => {
      const prompt = getDiscoveryPhasePrompt('domain_identification', {
        problem: 'Invest retirement savings in crypto',
      });

      expect(prompt).toContain('DOMAIN IDENTIFICATION');
      expect(prompt).toContain('Invest retirement savings in crypto');
      expect(prompt).toContain('Primary Domain');
      expect(prompt).toContain('Non-Ergodic Characteristics');
    });

    it('should generate risk discovery prompt with context', () => {
      const prompt = getDiscoveryPhasePrompt('risk_discovery', {
        problem: 'Career change',
        previousPhaseOutput: 'Domain: career, irreversible reputation impacts',
      });

      expect(prompt).toContain('RISK DISCOVERY');
      expect(prompt).toContain('Domain: career');
      expect(prompt).toContain('Irreversible Actions');
      expect(prompt).toContain('Hidden Risks');
    });

    it('should generate ruin scenario prompt', () => {
      const prompt = getDiscoveryPhasePrompt('ruin_scenarios', {
        problem: 'High leverage trading',
        previousPhaseOutput: 'Risks: total loss, margin call',
      });

      expect(prompt).toContain('RUIN SCENARIO ANALYSIS');
      expect(prompt).toContain('Complete Failure Scenarios');
      expect(prompt).toContain('Point of No Return');
      expect(prompt).toContain('Speed of Ruin');
    });

    it('should generate safety practices prompt', () => {
      const prompt = getDiscoveryPhasePrompt('safety_practices', {
        problem: 'Any problem',
        previousPhaseOutput: 'Financial domain with bankruptcy risk',
      });

      expect(prompt).toContain('SAFETY PRACTICES DISCOVERY');
      expect(prompt).toContain('Established Frameworks');
      expect(prompt).toContain('Risk Limits');
      expect(prompt).toContain('Recovery Mechanisms');
    });

    it('should generate forced calculations prompt', () => {
      const prompt = getDiscoveryPhasePrompt('forced_calculations', {
        problem: 'Any problem',
        proposedAction: 'Invest 60% in single stock',
        previousPhaseOutput: 'Never exceed 10% position size',
      });

      expect(prompt).toContain('FORCED CALCULATIONS');
      expect(prompt).toContain('Invest 60% in single stock');
      expect(prompt).toContain('Maximum Loss Calculation');
      expect(prompt).toContain('Recovery Analysis');
      expect(prompt).toContain('Show your calculations');
    });

    it('should generate validation prompt', () => {
      const prompt = getDiscoveryPhasePrompt('validation', {
        problem: 'Any problem',
        proposedAction: 'All-in bet',
        previousPhaseOutput: 'Calculations show 100% risk',
      });

      expect(prompt).toContain('VALIDATION CHECK');
      expect(prompt).toContain('All-in bet');
      expect(prompt).toContain('Constraint Violations');
      expect(prompt).toContain('Final Judgment');
    });
  });

  describe('isHighRiskDiscovery', () => {
    it('should identify high-risk language', () => {
      expect(isHighRiskDiscovery('This could lead to bankruptcy')).toBe(true);
      expect(isHighRiskDiscovery('Permanent damage possible')).toBe(true);
      expect(isHighRiskDiscovery('Irreversible decision')).toBe(true);
      expect(isHighRiskDiscovery('Total loss scenario')).toBe(true);
      expect(isHighRiskDiscovery('Cannot undo this action')).toBe(true);
    });

    it('should not flag low-risk language', () => {
      expect(isHighRiskDiscovery('This is a safe option')).toBe(false);
      expect(isHighRiskDiscovery('Easily reversible')).toBe(false);
      expect(isHighRiskDiscovery('Low impact decision')).toBe(false);
    });
  });

  describe('extractHardConstraints', () => {
    it('should extract numerical limits', () => {
      const responses = {
        domain_identification: 'Financial domain',
        risk_discovery: 'Never exceed 10% position size',
        safety_practices: 'Maximum of 25% in any sector. Never risk more than 5% on options.',
        validation: 'Limit to 15% maximum',
      };

      const constraints = extractHardConstraints(responses);

      expect(constraints).toContain('Never exceed 10%');
      expect(constraints).toContain('Maximum of 25%');
      expect(constraints).toContain('Never risk more than 5%');
      expect(constraints).toContain('Limit to 15%');
    });

    it('should extract absolute prohibitions', () => {
      const responses = {
        domain_identification: 'Never use leverage',
        risk_discovery: 'Absolutely avoid margin trading',
        safety_practices: 'Under no circumstances exceed risk limits',
        validation: 'Must not violate position sizing',
      };

      const constraints = extractHardConstraints(responses);

      expect(constraints).toContain('Never use leverage');
      expect(constraints).toContain('Absolutely avoid margin trading');
      expect(constraints).toContain('Under no circumstances exceed risk limits');
      expect(constraints).toContain('Must not violate position sizing');
    });

    it('should remove duplicate constraints', () => {
      const responses = {
        domain_identification: 'Never exceed 10%',
        risk_discovery: 'Never exceed 10%',
        safety_practices: 'Maximum 10%',
      };

      const constraints = extractHardConstraints(responses);
      const tenPercentConstraints = constraints.filter(c => c.includes('10%'));

      // Should have unique constraints only
      expect(tenPercentConstraints.length).toBeLessThanOrEqual(2);
    });
  });

  describe('generateConstraintViolationFeedback', () => {
    it('should generate educational feedback for violations', () => {
      const feedback = generateConstraintViolationFeedback(
        'Invest 75% in TSLA',
        ['Never exceed 10% position', 'Maximum 15% in single stock'],
        {
          domain: 'financial',
          risks: ['bankruptcy', 'total loss', 'margin call'],
          ruinScenarios: 3,
          worstCase: 'Complete financial ruin',
        }
      );

      expect(feedback).toContain('SAFETY VIOLATION DETECTED');
      expect(feedback).toContain('Invest 75% in TSLA');
      expect(feedback).toContain('Never exceed 10% position');
      expect(feedback).toContain('Domain: financial');
      expect(feedback).toContain('Complete financial ruin');
      expect(feedback).toContain('Please revise');
    });

    it('should handle missing context gracefully', () => {
      const feedback = generateConstraintViolationFeedback(
        'Risky action',
        ['Constraint 1', 'Constraint 2'],
        {}
      );

      expect(feedback).toContain('SAFETY VIOLATION DETECTED');
      expect(feedback).toContain('Constraint 1');
      expect(feedback).toContain('Constraint 2');
    });
  });

  describe('getMetaDiscoveryPrompt', () => {
    it('should provide discovery mindset guidance', () => {
      const prompt = getMetaDiscoveryPrompt();

      expect(prompt).toContain('DISCOVERY MINDSET');
      expect(prompt).toContain('Domain Expert');
      expect(prompt).toContain('Risk Manager');
      expect(prompt).toContain('deliberately pessimistic');
      expect(prompt).toContain('discovered constraints will be enforced');
    });
  });

  describe('Discovery phase coverage', () => {
    const phases: DiscoveryPhase[] = [
      'domain_identification',
      'risk_discovery',
      'ruin_scenarios',
      'safety_practices',
      'forced_calculations',
      'validation',
    ];

    it('should handle all discovery phases', () => {
      phases.forEach(phase => {
        const prompt = getDiscoveryPhasePrompt(phase, {
          problem: 'Test problem',
          proposedAction: 'Test action',
          previousPhaseOutput: 'Test output',
        });

        expect(prompt).toBeTruthy();
        expect(prompt.length).toBeGreaterThan(100);
      });
    });
  });

  describe('Prompt context handling', () => {
    it('should include technique when provided', () => {
      const prompt = getDiscoveryPhasePrompt('risk_discovery', {
        problem: 'Investment decision',
        technique: 'scamper',
        previousPhaseOutput: 'Financial domain',
      });

      expect(prompt).toContain('Financial domain');
    });

    it('should handle missing optional context', () => {
      const prompt = getDiscoveryPhasePrompt('domain_identification', {
        problem: 'Test problem',
        // No optional fields
      });

      expect(prompt).toContain('Test problem');
      expect(prompt).not.toContain('undefined');
    });
  });
});
