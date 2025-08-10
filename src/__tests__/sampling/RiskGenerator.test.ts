/**
 * Tests for RiskGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RiskGenerator } from '../../sampling/features/RiskGenerator.js';
import { SamplingManager } from '../../sampling/SamplingManager.js';
import type { SamplingResult, RiskAssessment } from '../../sampling/types.js';

describe('RiskGenerator', () => {
  let generator: RiskGenerator;
  let mockManager: SamplingManager;

  beforeEach(() => {
    mockManager = new SamplingManager();
    generator = new RiskGenerator(mockManager);
    vi.clearAllMocks();
  });

  describe('generateRisks', () => {
    it('should generate risks when sampling is available', async () => {
      mockManager.setCapability({ supported: true });

      const mockResponse: SamplingResult = {
        content: `RISKS IDENTIFIED:

1. Technical complexity risk
- Severity: 4/5
- Likelihood: 3/5
- Mitigations:
  • Use proven technologies
  • Start with MVP

2. Market adoption risk
- Severity: 3/5
- Likelihood: 4/5
- Mitigations:
  • Conduct market research
  • Beta testing

OVERALL RISK LEVEL: MEDIUM`,
      };

      vi.spyOn(mockManager, 'requestSampling').mockResolvedValue(mockResponse);

      const result = await generator.generateRisks(
        'New product launch',
        'six_hats',
        'Technology sector'
      );

      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.risks[0].description).toContain('complexity');
      expect(result.risks[0].severity).toBeGreaterThanOrEqual(1);
      expect(result.risks[0].severity).toBeLessThanOrEqual(5);
      expect(result.risks[0].likelihood).toBeGreaterThanOrEqual(1);
      expect(result.risks[0].likelihood).toBeLessThanOrEqual(5);
      expect(result.overallRisk).toBe('medium');
    });

    it('should use fallback when sampling is not available', async () => {
      mockManager.setCapability({ supported: false });

      const result = await generator.generateRisks('Product idea', 'scamper');

      expect(result.risks).toBeDefined();
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.overallRisk).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(result.overallRisk);
    });

    it('should handle parsing errors gracefully', async () => {
      mockManager.setCapability({ supported: true });

      const mockResponse: SamplingResult = {
        content: 'Not valid JSON - plain text risk assessment',
      };

      vi.spyOn(mockManager, 'requestSampling').mockResolvedValue(mockResponse);

      const result = await generator.generateRisks('Solution', 'po');

      expect(result.risks).toBeDefined();
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.overallRisk).toBeDefined();
    });

    it('should handle API errors', async () => {
      mockManager.setCapability({ supported: true });

      vi.spyOn(mockManager, 'requestSampling').mockRejectedValue({
        code: 'server_error',
        message: 'Server error',
      });

      const result = await generator.generateRisks('Solution', 'random_entry');

      expect(result.risks).toBeDefined();
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.overallRisk).toBeDefined();
    });
  });

  describe('generateBatchRisks', () => {
    it('should assess multiple solutions', async () => {
      mockManager.setCapability({ supported: true });

      const mockResponses = [
        {
          content: `RISKS IDENTIFIED:
          
1. Risk 1
- Severity: 3/5
- Likelihood: 2/5

OVERALL RISK LEVEL: LOW`,
        },
        {
          content: `RISKS IDENTIFIED:
          
1. Risk 2
- Severity: 4/5
- Likelihood: 4/5

OVERALL RISK LEVEL: HIGH`,
        },
      ];

      let callCount = 0;
      vi.spyOn(mockManager, 'requestSampling').mockImplementation(() => {
        return Promise.resolve(mockResponses[callCount++]);
      });

      const solutions = [
        { solution: 'Solution 1', technique: 'six_hats' },
        { solution: 'Solution 2', technique: 'scamper' },
      ];

      const results = await generator.generateBatchRisks(solutions, 'Context');

      expect(results).toHaveLength(2);
      expect(results[0].overallRisk).toBe('low');
      expect(results[1].overallRisk).toBe('high');
    });

    it('should handle partial failures in batch assessment', async () => {
      mockManager.setCapability({ supported: true });

      vi.spyOn(mockManager, 'requestSampling')
        .mockResolvedValueOnce({
          content: `RISKS IDENTIFIED:
          
1. Risk 1
- Severity: 2/5
- Likelihood: 2/5

OVERALL RISK LEVEL: LOW`,
        })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          content: `RISKS IDENTIFIED:
          
1. Risk 3
- Severity: 3/5
- Likelihood: 3/5

OVERALL RISK LEVEL: MEDIUM`,
        });

      const solutions = [
        { solution: 'Solution 1', technique: 'six_hats' },
        { solution: 'Solution 2', technique: 'scamper' },
        { solution: 'Solution 3', technique: 'po' },
      ];

      const results = await generator.generateBatchRisks(solutions);

      expect(results).toHaveLength(3);
      expect(results[0].overallRisk).toBe('low');
      expect(results[1].risks).toBeDefined(); // Fallback
      expect(results[2].overallRisk).toBe('medium');
    });
  });

  describe('overall risk calculation', () => {
    it('should calculate overall risk from individual risks', () => {
      const risks: RiskAssessment['risks'] = [
        { description: 'Risk A', severity: 2, likelihood: 2 },
        { description: 'Risk B', severity: 3, likelihood: 3 },
      ];

      const overallRisk = generator.calculateOverallRisk(risks);
      expect(['low', 'medium', 'high', 'critical']).toContain(overallRisk);
    });

    it('should handle empty risk array', () => {
      const risks: RiskAssessment['risks'] = [];
      const overallRisk = generator.calculateOverallRisk(risks);
      expect(overallRisk).toBe('low');
    });

    it('should identify critical risk level', () => {
      const risks: RiskAssessment['risks'] = [
        { description: 'Risk A', severity: 5, likelihood: 5 },
        { description: 'Risk B', severity: 5, likelihood: 4 },
      ];

      const overallRisk = generator.calculateOverallRisk(risks);
      expect(overallRisk).toBe('critical');
    });
  });

  describe('response parsing', () => {
    it('should parse well-structured risk response', async () => {
      mockManager.setCapability({ supported: true });

      const mockResponse: SamplingResult = {
        content: `
          RISKS IDENTIFIED:
          
          1. Technical Implementation Risk
          - Description: Complex technical requirements
          - Severity: 4/5
          - Likelihood: 3/5
          - Mitigations:
            • Use proven frameworks
            • Hire experienced developers
          
          2. Market Timing Risk
          - Description: Market may not be ready
          - Severity: 3/5
          - Likelihood: 4/5
          - Mitigations:
            • Conduct market research
            • Start with pilot program
          
          OVERALL RISK LEVEL: MEDIUM
        `,
      };

      vi.spyOn(mockManager, 'requestSampling').mockResolvedValue(mockResponse);

      const result = await generator.generateRisks('Solution', 'design_thinking');

      expect(result.risks).toBeDefined();
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.overallRisk).toBeDefined();
    });

    it('should extract risk level correctly', async () => {
      mockManager.setCapability({ supported: true });

      const testCases = [
        { input: 'OVERALL RISK LEVEL: LOW', expected: 'low' },
        { input: 'OVERALL RISK LEVEL: MEDIUM', expected: 'medium' },
        { input: 'OVERALL RISK LEVEL: HIGH', expected: 'high' },
        { input: 'OVERALL RISK LEVEL: CRITICAL', expected: 'critical' },
      ];

      for (const testCase of testCases) {
        vi.spyOn(mockManager, 'requestSampling').mockResolvedValueOnce({
          content: testCase.input,
        });

        const result = await generator.generateRisks('Solution', 'triz');
        expect(result.overallRisk).toBe(testCase.expected);
      }
    });

    it('should normalize severity and likelihood scores', async () => {
      mockManager.setCapability({ supported: true });

      const mockResponse: SamplingResult = {
        content: `
          Risk: Test risk
          Severity: 8/10
          Likelihood: 60%
        `,
      };

      vi.spyOn(mockManager, 'requestSampling').mockResolvedValue(mockResponse);

      const result = await generator.generateRisks('Solution', 'neural_state');

      expect(result.risks[0].severity).toBeGreaterThanOrEqual(1);
      expect(result.risks[0].severity).toBeLessThanOrEqual(5);
      expect(result.risks[0].likelihood).toBeGreaterThanOrEqual(1);
      expect(result.risks[0].likelihood).toBeLessThanOrEqual(5);
    });
  });

  describe('technique-specific risk assessment', () => {
    it('should provide technique-specific risk context', async () => {
      mockManager.setCapability({ supported: true });

      const techniques = ['six_hats', 'scamper', 'triz', 'design_thinking'];

      for (const technique of techniques) {
        vi.spyOn(mockManager, 'requestSampling').mockResolvedValueOnce({
          content: `CRITICAL RISKS:
• Risk for ${technique}
- Severity: 3/5
- Likelihood: 3/5

OVERALL RISK LEVEL: MEDIUM`,
        });

        const result = await generator.generateRisks('Solution', technique);

        expect(result.risks).toBeDefined();
        expect(result.risks.length).toBeGreaterThan(0);
      }
    });
  });

  describe('risk prioritization', () => {
    it('should limit risks to maximum of 10', async () => {
      mockManager.setCapability({ supported: true });

      let riskList = '';
      for (let i = 1; i <= 15; i++) {
        riskList += `${i}. Risk ${i}\n- Severity: 3/5\n- Likelihood: 3/5\n\n`;
      }

      const mockResponse: SamplingResult = {
        content: `CRITICAL RISKS:
${riskList}
OVERALL RISK LEVEL: HIGH`,
      };

      vi.spyOn(mockManager, 'requestSampling').mockResolvedValue(mockResponse);

      const result = await generator.generateRisks('Solution', 'collective_intel');

      expect(result.risks.length).toBeLessThanOrEqual(10);
    });
  });
});
