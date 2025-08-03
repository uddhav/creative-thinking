/**
 * Tests for ParallelismDetector
 */

import { describe, it, expect } from 'vitest';
import { ParallelismDetector } from '../../../layers/discovery/ParallelismDetector.js';

describe('ParallelismDetector', () => {
  const detector = new ParallelismDetector();

  describe('detectExecutionMode', () => {
    it('should detect parallel execution keywords', () => {
      const testCases = [
        {
          problem: 'I want to explore multiple approaches to solve this',
          expected: 'parallel',
        },
        {
          problem: "Let's use parallel creative thinking for this challenge",
          expected: 'parallel',
        },
        {
          problem: 'Fan out and try different perspectives',
          expected: 'parallel',
        },
        {
          problem: 'Use simultaneous techniques to analyze',
          expected: 'parallel',
        },
        {
          problem: 'I need a simple solution',
          expected: 'sequential',
        },
      ];

      for (const testCase of testCases) {
        const result = detector.detectExecutionMode(testCase.problem);
        expect(result.executionMode).toBe(testCase.expected);
        if (testCase.expected === 'parallel') {
          expect(result.confidence).toBeGreaterThanOrEqual(0.4);
          expect(result.detectedKeywords.length).toBeGreaterThan(0);
        }
      }
    });

    it('should detect parallel keywords in context', () => {
      const result = detector.detectExecutionMode(
        'Solve this problem',
        'using concurrent exploration methods'
      );
      expect(result.executionMode).toBe('parallel');
      expect(result.detectedKeywords).toContain('concurrent exploration');
    });

    it('should calculate higher confidence for multiple keywords', () => {
      const result1 = detector.detectExecutionMode('explore multiple approaches');
      const result2 = detector.detectExecutionMode(
        'explore multiple approaches using parallel creative thinking'
      );

      expect(result2.confidence).toBeGreaterThan(result1.confidence);
      expect(result2.detectedKeywords.length).toBeGreaterThan(result1.detectedKeywords.length);
    });

    it('should boost confidence for early keyword positions', () => {
      const result1 = detector.detectExecutionMode(
        'parallel creative thinking is what I need for this complex problem'
      );
      const result2 = detector.detectExecutionMode(
        'This complex problem might benefit from parallel creative thinking'
      );

      expect(result1.confidence).toBeGreaterThan(result2.confidence);
    });
  });

  describe('detectConvergenceIntent', () => {
    it('should detect convergence keywords', () => {
      const testCases = [
        {
          problem: 'Then converge all the results',
          expectedMethod: 'execute_thinking_step',
        },
        {
          problem: 'Synthesize the findings from all techniques',
          expectedMethod: 'execute_thinking_step',
        },
        {
          problem: 'Let LLM decide how to merge',
          expectedMethod: 'llm_handoff',
        },
        {
          problem: 'Hand off to LLM for intelligent synthesis',
          expectedMethod: 'llm_handoff',
        },
        {
          problem: 'Just explore the options',
          expectedMethod: 'execute_thinking_step',
        },
      ];

      for (const testCase of testCases) {
        const result = detector.detectConvergenceIntent(testCase.problem);
        expect(result.method).toBe(testCase.expectedMethod);
      }
    });

    it('should prioritize LLM handoff over general convergence', () => {
      const result = detector.detectConvergenceIntent(
        'Converge the results and let LLM decide the best approach'
      );
      expect(result.method).toBe('llm_handoff');
      expect(result.detectedKeywords).toContain('let llm decide');
    });

    it('should provide default convergence for parallel without explicit intent', () => {
      const result = detector.detectConvergenceIntent('Explore in parallel');
      expect(result.method).toBe('execute_thinking_step');
      expect(result.confidence).toBe(0.5);
      expect(result.detectedKeywords.length).toBe(0);
    });
  });

  describe('detectAutoMode', () => {
    it('should detect auto mode keywords', () => {
      const testCases = [
        { problem: 'Automatically decide the best approach', expected: true },
        { problem: 'Use smart mode for this', expected: true },
        { problem: 'Choose the optimal approach', expected: true },
        { problem: 'Just solve this problem', expected: false },
      ];

      for (const testCase of testCases) {
        const result = detector.detectAutoMode(testCase.problem);
        expect(result).toBe(testCase.expected);
      }
    });
  });

  describe('case sensitivity', () => {
    it('should be case insensitive', () => {
      const result1 = detector.detectExecutionMode('PARALLEL CREATIVE THINKING');
      const result2 = detector.detectExecutionMode('parallel creative thinking');
      const result3 = detector.detectExecutionMode('Parallel Creative Thinking');

      expect(result1.executionMode).toBe('parallel');
      expect(result2.executionMode).toBe('parallel');
      expect(result3.executionMode).toBe('parallel');
    });
  });
});
