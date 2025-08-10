/**
 * Tests for SmartSummaryGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmartSummaryGenerator } from '../../sampling/features/SmartSummaryGenerator.js';
import { SamplingManager } from '../../sampling/SamplingManager.js';
import type { SessionHistory } from '../../sampling/types.js';

describe('SmartSummaryGenerator', () => {
  let generator: SmartSummaryGenerator;
  let mockSamplingManager: SamplingManager;

  beforeEach(() => {
    mockSamplingManager = new SamplingManager();
    generator = new SmartSummaryGenerator(mockSamplingManager);
  });

  describe('generateSummary', () => {
    it('should generate AI summary when sampling is available', async () => {
      // Mock sampling availability
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(true);

      // Mock sampling request
      vi.spyOn(mockSamplingManager, 'requestSampling').mockResolvedValue({
        content: `KEY INSIGHTS:
• Creative breakthrough in using biomimicry
• Risk of technical complexity identified
• Strong team collaboration patterns emerged

CRITICAL DECISIONS:
• Chose iterative approach over waterfall
• Prioritized user experience over features
• Committed to sustainability metrics

NEXT STEPS:
1. Prototype the bio-inspired design
2. Conduct user testing sessions
3. Refine based on feedback

EFFECTIVENESS: 85%`,
        requestId: 'req_123',
      });

      const sessionHistory: SessionHistory = {
        sessionId: 'session_123',
        problem: 'Design a sustainable product',
        techniques: ['biomimicry', 'design_thinking'],
        steps: [
          {
            technique: 'biomimicry',
            stepNumber: 1,
            output: 'Exploring nature patterns',
            timestamp: Date.now(),
          },
          {
            technique: 'design_thinking',
            stepNumber: 1,
            output: 'Understanding user needs',
            timestamp: Date.now(),
          },
        ],
        insights: ['Nature provides elegant solutions', 'Users value sustainability'],
        risks: ['Technical complexity', 'Cost concerns'],
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
      };

      const summary = await generator.generateSummary(sessionHistory);

      expect(summary.keyInsights).toHaveLength(3);
      expect(summary.keyInsights[0]).toContain('biomimicry');
      expect(summary.criticalDecisions).toHaveLength(3);
      expect(summary.nextSteps).toHaveLength(3);
      expect(summary.effectiveness).toBe(0.85);
      expect(mockSamplingManager.requestSampling).toHaveBeenCalledTimes(1);
    });

    it('should use fallback when sampling is not available', async () => {
      // Mock sampling not available
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(false);

      const sessionHistory: SessionHistory = {
        sessionId: 'session_456',
        problem: 'Improve team communication',
        techniques: ['six_hats'],
        steps: [
          {
            technique: 'six_hats',
            stepNumber: 1,
            output: 'Process planning',
            timestamp: Date.now(),
          },
        ],
        insights: ['Need better tools', 'Async communication works'],
        risks: ['Time zone challenges'],
        startTime: Date.now() - 1800000,
        endTime: Date.now(),
      };

      const summary = await generator.generateSummary(sessionHistory);

      expect(summary.keyInsights).toHaveLength(2);
      expect(summary.keyInsights).toContain('Need better tools');
      expect(summary.criticalDecisions).toHaveLength(1);
      expect(summary.nextSteps).toHaveLength(3);
      expect(summary.effectiveness).toBeGreaterThanOrEqual(0);
      expect(summary.effectiveness).toBeLessThanOrEqual(1);
      expect(mockSamplingManager.requestSampling).not.toHaveBeenCalled();
    });

    it('should handle AI parsing errors gracefully', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(true);

      // Mock malformed AI response
      vi.spyOn(mockSamplingManager, 'requestSampling').mockResolvedValue({
        content: 'This is not the expected format',
        requestId: 'req_789',
      });

      const sessionHistory: SessionHistory = {
        sessionId: 'session_789',
        problem: 'Test problem',
        techniques: ['scamper'],
        steps: [
          {
            technique: 'scamper',
            stepNumber: 1,
            output: 'Substitute elements',
            timestamp: Date.now(),
          },
        ],
        insights: ['Basic insight'],
        risks: [],
        startTime: Date.now() - 600000,
        endTime: Date.now(),
      };

      const summary = await generator.generateSummary(sessionHistory);

      // Should still return a valid summary structure
      expect(summary.keyInsights).toBeDefined();
      expect(Array.isArray(summary.keyInsights)).toBe(true);
      expect(summary.criticalDecisions).toBeDefined();
      expect(summary.nextSteps).toBeDefined();
      expect(summary.effectiveness).toBeGreaterThanOrEqual(0);
    });

    it('should handle sampling errors by falling back', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(true);

      // Mock sampling error
      vi.spyOn(mockSamplingManager, 'requestSampling').mockRejectedValue(
        new Error('Sampling failed')
      );

      const sessionHistory: SessionHistory = {
        sessionId: 'session_error',
        problem: 'Error test',
        techniques: ['po'],
        steps: [
          {
            technique: 'po',
            stepNumber: 1,
            output: 'Provocation',
            timestamp: Date.now(),
          },
        ],
        insights: ['Test insight'],
        risks: ['Test risk'],
        startTime: Date.now() - 900000,
        endTime: Date.now(),
      };

      const summary = await generator.generateSummary(sessionHistory);

      // Should fall back to template-based summary
      expect(summary.keyInsights).toContain('Test insight');
      expect(summary.effectiveness).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateBatchSummaries', () => {
    it('should process multiple sessions in batch', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(false);

      const sessions: SessionHistory[] = [
        {
          sessionId: 'batch_1',
          problem: 'Problem 1',
          techniques: ['six_hats'],
          steps: [
            {
              technique: 'six_hats',
              stepNumber: 1,
              output: 'Blue hat',
              timestamp: Date.now(),
            },
          ],
          insights: ['Insight 1'],
          risks: [],
          startTime: Date.now() - 1000000,
          endTime: Date.now(),
        },
        {
          sessionId: 'batch_2',
          problem: 'Problem 2',
          techniques: ['scamper'],
          steps: [
            {
              technique: 'scamper',
              stepNumber: 1,
              output: 'Substitute',
              timestamp: Date.now(),
            },
          ],
          insights: ['Insight 2'],
          risks: ['Risk 2'],
          startTime: Date.now() - 2000000,
          endTime: Date.now(),
        },
      ];

      const summaries = await generator.generateBatchSummaries(sessions);

      expect(summaries).toHaveLength(2);
      expect(summaries[0].keyInsights).toContain('Insight 1');
      expect(summaries[1].keyInsights).toContain('Insight 2');
      expect(summaries[1].effectiveness).toBeDefined();
    });

    it('should handle partial batch failures', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(true);

      // Mock one success and one failure
      vi.spyOn(mockSamplingManager, 'requestSampling')
        .mockResolvedValueOnce({
          content: `KEY INSIGHTS:\n• Success insight\n\nEFFECTIVENESS: 75%`,
          requestId: 'req_success',
        })
        .mockRejectedValueOnce(new Error('Second request failed'));

      const sessions: SessionHistory[] = [
        {
          sessionId: 'partial_1',
          problem: 'Success case',
          techniques: ['triz'],
          steps: [{ technique: 'triz', stepNumber: 1, output: 'Identify', timestamp: Date.now() }],
          insights: [],
          risks: [],
          startTime: Date.now() - 500000,
          endTime: Date.now(),
        },
        {
          sessionId: 'partial_2',
          problem: 'Failure case',
          techniques: ['disney_method'],
          steps: [
            { technique: 'disney_method', stepNumber: 1, output: 'Dreamer', timestamp: Date.now() },
          ],
          insights: ['Fallback insight'],
          risks: [],
          startTime: Date.now() - 600000,
          endTime: Date.now(),
        },
      ];

      const summaries = await generator.generateBatchSummaries(sessions);

      expect(summaries).toHaveLength(2);
      expect(summaries[0].effectiveness).toBe(0.75);
      expect(summaries[1].keyInsights).toContain('Fallback insight');
    });
  });

  describe('edge cases', () => {
    it('should handle empty session history', async () => {
      const emptySession: SessionHistory = {
        sessionId: 'empty',
        problem: '',
        techniques: [],
        steps: [],
        insights: [],
        risks: [],
        startTime: Date.now(),
        endTime: Date.now(),
      };

      const summary = await generator.generateSummary(emptySession);

      expect(summary.keyInsights).toHaveLength(1);
      expect(summary.keyInsights[0]).toContain('No significant insights');
      expect(summary.effectiveness).toBe(0);
    });

    it('should handle very long sessions', async () => {
      const longSession: SessionHistory = {
        sessionId: 'long',
        problem: 'Complex multi-faceted problem requiring extensive analysis',
        techniques: ['six_hats', 'scamper', 'triz', 'design_thinking', 'nine_windows'],
        steps: Array.from({ length: 50 }, (_, i) => ({
          technique: 'six_hats',
          stepNumber: i + 1,
          output: `Step ${i + 1} output with lots of content`,
          timestamp: Date.now() - (50 - i) * 60000,
        })),
        insights: Array.from({ length: 20 }, (_, i) => `Insight number ${i + 1}`),
        risks: Array.from({ length: 15 }, (_, i) => `Risk number ${i + 1}`),
        startTime: Date.now() - 7200000,
        endTime: Date.now(),
      };

      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(false);

      const summary = await generator.generateSummary(longSession);

      expect(summary.keyInsights.length).toBeLessThanOrEqual(10);
      expect(summary.criticalDecisions.length).toBeGreaterThan(0);
      expect(summary.nextSteps.length).toBeGreaterThan(0);
      expect(summary.effectiveness).toBeGreaterThan(0);
    });
  });
});
