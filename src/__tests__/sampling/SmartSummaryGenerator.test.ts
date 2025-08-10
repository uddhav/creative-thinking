/**
 * Tests for SmartSummaryGenerator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SmartSummaryGenerator,
  type SessionData,
} from '../../sampling/features/SmartSummaryGenerator.js';
import { SamplingManager } from '../../sampling/SamplingManager.js';

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
      const requestSamplingSpy = vi
        .spyOn(mockSamplingManager, 'requestSampling')
        .mockResolvedValue({
          content: `KEY INSIGHTS:
• Creative breakthrough in using biomimicry
• Risk of technical complexity identified
• Strong team collaboration patterns emerged

BEST IDEAS:
• Bio-inspired adaptive structure (biomimicry) - Mimics natural systems for efficiency
• User-centered feedback loops (design_thinking) - Continuous improvement through user input
• Modular component design (biomimicry) - Allows flexible reconfiguration

RISKS:
• Technical implementation complexity
• Higher initial costs
• Learning curve for users

PATTERNS:
• Nature-inspired solutions consistently emerged
• User needs aligned with sustainable practices
• Iterative refinement improved quality

RECOMMENDED NEXT STEPS:
1. Prototype the bio-inspired design
2. Conduct user testing sessions
3. Refine based on feedback
4. Develop sustainability metrics
5. Create implementation roadmap

ACTION ITEMS:
• [HIGH] Create initial prototype - by next week
• [MEDIUM] Set up user testing framework
• [LOW] Document design decisions`,
          requestId: 'req_123',
        });

      const sessionHistory: SessionData = {
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
        duration: 3600000,
        completionStatus: 'completed' as const,
      };

      const summary = await generator.generateSummary(sessionHistory);

      expect(summary.insights).toHaveLength(3);
      expect(summary.insights[0]).toContain('biomimicry');
      expect(summary.bestIdeas).toBeDefined();
      expect(summary.bestIdeas.length).toBeGreaterThan(0);
      expect(summary.nextSteps.length).toBeGreaterThan(0);
      expect(summary.patterns).toBeDefined();
      expect(requestSamplingSpy).toHaveBeenCalledTimes(1);
    });

    it('should use fallback when sampling is not available', async () => {
      // Mock sampling not available
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(false);

      const sessionHistory: SessionData = {
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
        duration: 1800000,
        completionStatus: 'completed' as const,
      };

      const summary = await generator.generateSummary(sessionHistory);

      expect(summary.insights).toBeDefined();
      expect(summary.insights.length).toBeGreaterThan(0);
      expect(summary.bestIdeas).toBeDefined();
      expect(summary.nextSteps).toBeDefined();
      expect(summary.nextSteps.length).toBeGreaterThan(0);
      expect(vi.spyOn(mockSamplingManager, 'requestSampling').mock.calls).toHaveLength(0);
    });

    it('should handle AI parsing errors gracefully', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(true);

      // Mock malformed AI response
      vi.spyOn(mockSamplingManager, 'requestSampling').mockResolvedValue({
        content: 'This is not the expected format',
        requestId: 'req_789',
      });

      const sessionHistory: SessionData = {
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
        duration: 600000,
        completionStatus: 'in-progress' as const,
      };

      const summary = await generator.generateSummary(sessionHistory);

      // Should still return a valid summary structure
      expect(summary.insights).toBeDefined();
      expect(Array.isArray(summary.insights)).toBe(true);
      expect(summary.bestIdeas).toBeDefined();
      expect(summary.nextSteps).toBeDefined();
      expect(summary.nextSteps.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle sampling errors by falling back', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(true);

      // Mock sampling error
      vi.spyOn(mockSamplingManager, 'requestSampling').mockRejectedValue(
        new Error('Sampling failed')
      );

      const sessionHistory: SessionData = {
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
        duration: 900000,
        completionStatus: 'completed' as const,
      };

      const summary = await generator.generateSummary(sessionHistory);

      // Should fall back to template-based summary
      expect(summary.insights).toBeDefined();
      expect(summary.nextSteps).toBeDefined();
    });
  });

  describe('generateBatchSummaries', () => {
    it('should process multiple sessions in batch', async () => {
      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(false);

      const sessions: SessionData[] = [
        {
          sessionId: 'batch_1',
          problem: 'Problem 1',
          techniques: ['six_hats'],
          steps: [
            {
              technique: 'six_hats',
              currentStep: 1,
              output: 'Blue hat',
              hatColor: 'blue',
            },
          ],
          duration: 1000000,
          completionStatus: 'completed' as const,
        },
        {
          sessionId: 'batch_2',
          problem: 'Problem 2',
          techniques: ['scamper'],
          steps: [
            {
              technique: 'scamper',
              currentStep: 1,
              output: 'Substitute',
              scamperAction: 'substitute',
            },
          ],
          duration: 2000000,
          completionStatus: 'completed' as const,
        },
      ];

      const summaries = await generator.generateBatchSummaries(sessions);

      expect(summaries).toHaveLength(2);
      expect(summaries[0].insights).toBeDefined();
      expect(summaries[1].insights).toBeDefined();
      expect(summaries[0].nextSteps).toBeDefined();
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

      const sessions: SessionData[] = [
        {
          sessionId: 'partial_1',
          problem: 'Success case',
          techniques: ['triz'],
          steps: [{ technique: 'triz', currentStep: 1, output: 'Identify' }],
          duration: 500000,
          completionStatus: 'completed' as const,
        },
        {
          sessionId: 'partial_2',
          problem: 'Failure case',
          techniques: ['disney_method'],
          steps: [{ technique: 'disney_method', currentStep: 1, output: 'Dreamer' }],
          duration: 600000,
          completionStatus: 'completed' as const,
        },
      ];

      const summaries = await generator.generateBatchSummaries(sessions);

      expect(summaries).toHaveLength(2);
      expect(summaries[0].insights).toBeDefined();
      expect(summaries[1].insights).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty session history', async () => {
      const emptySession: SessionData = {
        sessionId: 'empty',
        problem: '',
        techniques: [],
        steps: [],
        duration: 0,
        completionStatus: 'abandoned' as const,
      };

      const summary = await generator.generateSummary(emptySession);

      expect(summary.insights).toBeDefined();
      expect(summary.insights.length).toBeGreaterThanOrEqual(0);
      expect(summary.nextSteps).toBeDefined();
    });

    it('should handle very long sessions', async () => {
      const longSession: SessionData = {
        sessionId: 'long',
        problem: 'Complex multi-faceted problem requiring extensive analysis',
        techniques: ['six_hats', 'scamper', 'triz', 'design_thinking', 'nine_windows'],
        steps: Array.from({ length: 50 }, (_, i) => ({
          technique: 'six_hats',
          currentStep: i + 1,
          output: `Step ${i + 1} output with lots of content`,
          hatColor: ['blue', 'white', 'red', 'yellow', 'black', 'green'][i % 6],
        })),
        duration: 7200000,
        completionStatus: 'completed' as const,
      };

      vi.spyOn(mockSamplingManager, 'isAvailable').mockReturnValue(false);

      const summary = await generator.generateSummary(longSession);

      expect(summary.insights.length).toBeGreaterThanOrEqual(0);
      expect(summary.bestIdeas).toBeDefined();
      expect(summary.nextSteps.length).toBeGreaterThan(0);
      expect(summary.patterns).toBeDefined();
    });
  });
});
