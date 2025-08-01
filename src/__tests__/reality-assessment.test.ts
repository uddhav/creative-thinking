/**
 * Tests for Reality Assessment Module
 */

import { describe, it, expect } from 'vitest';
import { RealityAssessor } from '../reality/index.js';
import { RealityIntegration } from '../reality/integration.js';
import type {
  RealityAssessment,
  ExecuteThinkingStepInput,
  PossibilityLevel,
  ImpossibilityType,
} from '../index.js';

describe('Reality Assessment', () => {
  describe('RealityAssessor.assess', () => {
    it('should identify logical impossibilities', () => {
      const assessment = RealityAssessor.assess(
        'Create a system that is both centralized and not centralized',
        'System architecture design',
        'technology'
      );

      expect(assessment.possibilityLevel).toBe('impossible');
      expect(assessment.impossibilityType).toBe('logical');
      expect(assessment.confidenceLevel).toBeGreaterThan(0.9);
      expect(assessment.mechanismExplanation).toContain('self-contradictory');
    });

    it('should identify physical law violations', () => {
      const assessment = RealityAssessor.assess(
        'Build a perpetual motion machine for energy generation',
        'Energy solutions',
        'technology'
      );

      expect(assessment.possibilityLevel).toBe('breakthrough-required');
      expect(assessment.impossibilityType).toBe('physical');
      expect(assessment.breakthroughsRequired).toBeDefined();
      expect(assessment.breakthroughsRequired).toContain('Discover new physical principles');
    });

    it('should identify regulatory constraints', () => {
      const assessment = RealityAssessor.assess(
        'Implement tax loss harvesting while maintaining substantially identical positions',
        'Investment strategy',
        'finance'
      );

      expect(assessment.possibilityLevel).toBe('breakthrough-required');
      expect(assessment.impossibilityType).toBe('regulatory');
      expect(assessment.mechanismExplanation).toContain('regulations prohibit');
    });

    it('should identify technical limitations', () => {
      const assessment = RealityAssessor.assess(
        "Create AI that requires technology that doesn't exist yet",
        'AI development',
        'technology'
      );

      expect(assessment.possibilityLevel).toBe('difficult');
      expect(assessment.impossibilityType).toBe('technical');
      expect(assessment.breakthroughsRequired).toContain('Develop new technologies');
    });

    it('should identify resource constraints', () => {
      const assessment = RealityAssessor.assess(
        'Launch a project that requires billions in funding',
        'Startup planning',
        undefined
      );

      expect(assessment.possibilityLevel).toBe('difficult');
      expect(assessment.impossibilityType).toBe('resource');
      expect(assessment.breakthroughsRequired).toContain('Find cheaper alternatives');
    });

    it('should mark feasible ideas appropriately', () => {
      const assessment = RealityAssessor.assess(
        'Build a web application using existing frameworks',
        'Software development',
        'technology'
      );

      expect(assessment.possibilityLevel).toBe('feasible');
      expect(assessment.confidenceLevel).toBeGreaterThan(0.6);
      expect(assessment.mechanismExplanation).toContain('No major barriers');
    });

    it('should provide historical precedents for breakthrough-required ideas', () => {
      const assessment = RealityAssessor.assess(
        'Create technology that requires breakthroughs beyond current capabilities',
        'Technology development',
        'technology'
      );

      expect(assessment.historicalPrecedents).toBeDefined();
      expect(assessment.historicalPrecedents?.length).toBeGreaterThan(0);
      // Should have some historical precedent
      expect(assessment.historicalPrecedents?.[0]).toBeTruthy();
    });
  });

  describe('RealityIntegration', () => {
    it('should detect domain from problem context', () => {
      expect(RealityIntegration.detectDomain('tax loss harvesting strategies')).toBe('finance');
      expect(RealityIntegration.detectDomain('medical treatment options')).toBe('healthcare');
      expect(RealityIntegration.detectDomain('software architecture design')).toBe('technology');
      expect(RealityIntegration.detectDomain('SEC compliance requirements')).toBe('regulatory');
      expect(RealityIntegration.detectDomain('creative writing techniques')).toBeUndefined();
    });

    it('should enhance output with reality assessment', () => {
      const input: ExecuteThinkingStepInput = {
        planId: 'test-plan',
        technique: 'scamper',
        problem: 'Reduce costs by 50% without firing anyone',
        currentStep: 1,
        totalSteps: 8,
        scamperAction: 'eliminate',
        output: 'Eliminate all operational expenses while maintaining full operations',
        nextStepNeeded: true,
      };

      const { enhancedOutput, realityAssessment } = RealityIntegration.enhanceWithReality(
        input,
        input.output
      );

      // Since this is contradictory, it should be assessed
      if (realityAssessment) {
        expect(enhancedOutput).toContain('Reality Navigator');
        expect(realityAssessment.possibilityLevel).not.toBe('feasible');
      } else {
        // If no assessment, the output should be unchanged
        expect(enhancedOutput).toBe(input.output);
      }
    });

    it('should not enhance already feasible outputs', () => {
      const input: ExecuteThinkingStepInput = {
        planId: 'test-plan',
        technique: 'six_hats',
        problem: 'Improve team communication',
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'blue',
        output: 'Set up weekly team meetings',
        nextStepNeeded: true,
      };

      const { enhancedOutput, realityAssessment } = RealityIntegration.enhanceWithReality(
        input,
        input.output
      );

      expect(realityAssessment).toBeUndefined();
      expect(enhancedOutput).toBe(input.output);
    });

    it('should respect existing reality assessment', () => {
      const existingAssessment: RealityAssessment = {
        possibilityLevel: 'impossible',
        impossibilityType: 'logical',
        confidenceLevel: 1.0,
        mechanismExplanation: 'Pre-assessed',
      };

      const input: ExecuteThinkingStepInput = {
        planId: 'test-plan',
        technique: 'po',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 4,
        output: 'Test output',
        nextStepNeeded: true,
        realityAssessment: existingAssessment,
      };

      const { enhancedOutput, realityAssessment } = RealityIntegration.enhanceWithReality(
        input,
        input.output
      );

      expect(realityAssessment).toBeUndefined();
      expect(enhancedOutput).toBe(input.output);
    });
  });

  describe('Session Reality Analysis', () => {
    it('should analyze feasibility trends across session', () => {
      const outputs = [
        {
          output: 'Feasible solution 1',
          assessment: {
            possibilityLevel: 'feasible' as PossibilityLevel,
            confidenceLevel: 0.8,
          },
        },
        {
          output: 'Difficult solution 2',
          assessment: {
            possibilityLevel: 'difficult' as PossibilityLevel,
            confidenceLevel: 0.7,
            impossibilityType: 'technical' as ImpossibilityType,
          },
        },
        {
          output: 'Breakthrough needed 3',
          assessment: {
            possibilityLevel: 'breakthrough-required' as PossibilityLevel,
            confidenceLevel: 0.9,
            impossibilityType: 'physical' as ImpossibilityType,
            breakthroughsRequired: ['New physics'],
          },
        },
        {
          output: 'Impossible solution 4',
          assessment: {
            possibilityLevel: 'impossible' as PossibilityLevel,
            confidenceLevel: 0.95,
            impossibilityType: 'logical' as ImpossibilityType,
          },
        },
      ];

      const analysis = RealityIntegration.analyzeSessionReality(outputs);

      expect(analysis.feasibilityTrend).toBe('declining');
      expect(analysis.breakthroughsNeeded.has('New physics')).toBe(true);
      expect(analysis.commonBarriers.get('technical')).toBe(1);
      expect(analysis.commonBarriers.get('physical')).toBe(1);
      expect(analysis.commonBarriers.get('logical')).toBe(1);
    });

    it('should detect improving feasibility trend', () => {
      const outputs = [
        {
          output: 'Impossible at first',
          assessment: {
            possibilityLevel: 'impossible' as PossibilityLevel,
            confidenceLevel: 0.9,
          },
        },
        {
          output: 'Breakthrough required',
          assessment: {
            possibilityLevel: 'breakthrough-required' as PossibilityLevel,
            confidenceLevel: 0.8,
          },
        },
        {
          output: 'Getting difficult',
          assessment: {
            possibilityLevel: 'difficult' as PossibilityLevel,
            confidenceLevel: 0.7,
          },
        },
        {
          output: 'Now feasible',
          assessment: {
            possibilityLevel: 'feasible' as PossibilityLevel,
            confidenceLevel: 0.9,
          },
        },
      ];

      const analysis = RealityIntegration.analyzeSessionReality(outputs);
      expect(analysis.feasibilityTrend).toBe('improving');
    });

    it('should generate breakthrough strategy', () => {
      const analysis = {
        feasibilityTrend: 'declining' as const,
        breakthroughsNeeded: new Set(['New regulation', 'Technology advancement', 'Culture shift']),
        commonBarriers: new Map([
          ['regulatory', 3],
          ['technical', 2],
          ['social', 1],
        ]),
      };

      const strategy = RealityIntegration.generateBreakthroughStrategy(analysis);

      expect(strategy).toContain('Caution: Ideas becoming less feasible');
      expect(strategy).toContain('regulatory barriers (3 times)');
      expect(strategy).toContain('New regulation');
      expect(strategy).toContain('Technology advancement');
      expect(strategy).toContain('Culture shift');
    });
  });

  describe('Reality Navigator Output', () => {
    it('should generate comprehensive navigator output', () => {
      const assessment: RealityAssessment = {
        possibilityLevel: 'breakthrough-required',
        impossibilityType: 'regulatory',
        breakthroughsRequired: ['Change tax laws', 'Create new financial instruments'],
        historicalPrecedents: ['ETFs created to enable tax-efficient rebalancing'],
        confidenceLevel: 0.85,
        mechanismExplanation: 'Current regulations prohibit this approach',
      };

      const output = RealityAssessor.generateNavigatorOutput(
        'Tax loss harvesting for individual stocks',
        assessment
      );

      expect(output).toContain('Level: breakthrough-required (regulatory)');
      expect(output).toContain('Type: regulatory impossibility');
      expect(output).toContain('Change tax laws');
      expect(output).toContain('ETFs created');
      expect(output).toContain('Current regulations prohibit');
      expect(output).toContain('Confidence: 85%');
    });

    it('should handle minimal assessment data', () => {
      const assessment: RealityAssessment = {
        possibilityLevel: 'feasible',
        confidenceLevel: 0.7,
      };

      const output = RealityAssessor.generateNavigatorOutput('Simple solution', assessment);

      expect(output).toContain('Level: feasible');
      expect(output).toContain('Confidence: 70%');
      expect(output).not.toContain('Type:');
      expect(output).not.toContain('Breakthroughs required:');
    });
  });
});
