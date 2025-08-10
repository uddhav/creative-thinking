/**
 * Tests for IdeaEnhancer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdeaEnhancer } from '../../sampling/features/IdeaEnhancer.js';
import { SamplingManager } from '../../sampling/SamplingManager.js';
import type { SamplingResult } from '../../sampling/types.js';

describe('IdeaEnhancer', () => {
  let enhancer: IdeaEnhancer;
  let mockManager: SamplingManager;

  beforeEach(() => {
    mockManager = new SamplingManager();
    enhancer = new IdeaEnhancer(mockManager);
    vi.clearAllMocks();
  });

  describe('enhance', () => {
    it('should enhance idea when sampling is available', async () => {
      mockManager.setCapability({ supported: true });

      const mockResponse: SamplingResult = {
        content: `ENHANCED IDEA: Enhanced version of the idea with more details

ADDITIONAL FEATURES:
• Feature 1 with enough detail
• Feature 2 with enough detail
• Feature 3 with enough detail

IMPLEMENTATION CONSIDERATIONS:
• Step 1 with enough detail
• Step 2 with enough detail

UNIQUE VALUE PROPOSITIONS:
• Value 1 with enough detail
• Value 2 with enough detail`,
      };

      vi.spyOn(mockManager, 'requestSampling').mockResolvedValue(mockResponse);

      const result = await enhancer.enhance('Original idea', 'six_hats', 'Problem context');

      expect(result.original).toBe('Original idea');
      expect(result.enhanced).toContain('Enhanced version');
      expect(result.features).toBeDefined();
      expect(result.features?.length).toBeGreaterThan(0);
      expect(result.implementation).toBeDefined();
      expect(result.implementation?.length).toBeGreaterThan(0);
      expect(result.valueProps).toBeDefined();
      expect(result.valueProps?.length).toBeGreaterThan(0);
    });

    it('should use fallback when sampling is not available', async () => {
      mockManager.setCapability({ supported: false });

      const result = await enhancer.enhance('Original idea', 'scamper');

      expect(result.original).toBe('Original idea');
      expect(result.enhanced).toContain('Original idea');
      expect(result.enhanced).toContain('Consider adding');
      expect(result.features).toContain('User feedback and rating system');
      expect(result.implementation).toContain('Start with MVP to validate core concept');
      expect(result.valueProps).toContain('Solves a specific user pain point');
    });

    it('should handle parsing errors gracefully', async () => {
      mockManager.setCapability({ supported: true });

      const mockResponse: SamplingResult = {
        content: 'Not valid JSON - just plain text response',
      };

      vi.spyOn(mockManager, 'requestSampling').mockResolvedValue(mockResponse);

      const result = await enhancer.enhance('Original idea', 'po');

      expect(result.original).toBe('Original idea');
      expect(result.enhanced).toBeTruthy();
      expect(result.features).toBeDefined();
    });

    it('should handle rate limit errors', async () => {
      mockManager.setCapability({ supported: true });

      vi.spyOn(mockManager, 'requestSampling').mockRejectedValue({
        code: 'rate_limit_exceeded',
        message: 'Rate limit exceeded',
      });

      const result = await enhancer.enhance('Original idea', 'random_entry');

      expect(result.original).toBe('Original idea');
      expect(result.enhanced).toContain('Enhancement temporarily limited');
      expect(result.features).toContain('Contact support for enhanced features');
    });

    it('should handle timeout errors', async () => {
      mockManager.setCapability({ supported: true });

      vi.spyOn(mockManager, 'requestSampling').mockRejectedValue({
        code: 'timeout',
        message: 'Request timed out',
      });

      const result = await enhancer.enhance('Original idea', 'triz');

      expect(result.original).toBe('Original idea');
      expect(result.enhanced).toContain('Quick enhancement');
      expect(result.features).toContain('User-centric design');
    });

    it('should handle generic errors', async () => {
      mockManager.setCapability({ supported: true });

      vi.spyOn(mockManager, 'requestSampling').mockRejectedValue({
        code: 'server_error',
        message: 'Server error',
      });

      const result = await enhancer.enhance('Original idea', 'design_thinking');

      expect(result.original).toBe('Original idea');
      expect(result.enhanced).toContain('Consider adding');
      expect(result.features).toBeDefined();
      expect(result.implementation).toBeDefined();
      expect(result.valueProps).toBeDefined();
    });
  });

  describe('enhanceBatch', () => {
    it('should enhance multiple ideas', async () => {
      mockManager.setCapability({ supported: true });

      const mockResponses = [
        {
          content: `ENHANCED IDEA: Enhanced idea 1
          
ADDITIONAL FEATURES:
- Feature A`,
        },
        {
          content: `ENHANCED IDEA: Enhanced idea 2
          
ADDITIONAL FEATURES:
- Feature B`,
        },
      ];

      let callCount = 0;
      vi.spyOn(mockManager, 'requestSampling').mockImplementation(() => {
        return Promise.resolve(mockResponses[callCount++]);
      });

      const ideas = [
        { idea: 'Idea 1', technique: 'six_hats' },
        { idea: 'Idea 2', technique: 'scamper' },
      ];

      const results = await enhancer.enhanceBatch(ideas, 'Context');

      expect(results).toHaveLength(2);
      expect(results[0].enhanced).toBe('Enhanced idea 1');
      expect(results[1].enhanced).toBe('Enhanced idea 2');
    });

    it('should handle partial failures in batch', async () => {
      mockManager.setCapability({ supported: true });

      vi.spyOn(mockManager, 'requestSampling')
        .mockResolvedValueOnce({
          content: 'ENHANCED IDEA: Enhanced idea 1',
        })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          content: 'ENHANCED IDEA: Enhanced idea 3',
        });

      const ideas = [
        { idea: 'Idea 1', technique: 'six_hats' },
        { idea: 'Idea 2', technique: 'scamper' },
        { idea: 'Idea 3', technique: 'po' },
      ];

      const results = await enhancer.enhanceBatch(ideas);

      expect(results).toHaveLength(3);
      expect(results[0].enhanced).toBe('Enhanced idea 1');
      expect(results[1].enhanced).toContain('Idea 2'); // Fallback
      expect(results[2].enhanced).toBe('Enhanced idea 3');
    });
  });

  describe('technique-specific prompts', () => {
    it('should provide technique-specific guidance', () => {
      const techniques = [
        'six_hats',
        'scamper',
        'po',
        'random_entry',
        'concept_extraction',
        'yes_and',
        'design_thinking',
        'triz',
        'quantum_superposition',
        'temporal_creativity',
        'paradoxical_problem',
      ];

      techniques.forEach(technique => {
        const prompt = enhancer.getTechniqueSpecificPrompt(technique);
        expect(prompt).toBeTruthy();
        expect(prompt.length).toBeGreaterThan(10);
      });
    });

    it('should provide default prompt for unknown technique', () => {
      const prompt = enhancer.getTechniqueSpecificPrompt('unknown_technique');
      expect(prompt).toBe('Enhance with creativity and practicality');
    });
  });

  describe('response parsing', () => {
    it('should parse well-structured JSON response', async () => {
      mockManager.setCapability({ supported: true });

      const mockResponse: SamplingResult = {
        content: `
          ENHANCED IDEA: This is the enhanced version
          
          ADDITIONAL FEATURES:
          - Feature one with details
          - Feature two with more info
          - Feature three
          
          IMPLEMENTATION CONSIDERATIONS:
          - Technical consideration 1
          - Technical consideration 2
          
          UNIQUE VALUE PROPOSITIONS:
          - Value prop 1
          - Value prop 2
        `,
      };

      vi.spyOn(mockManager, 'requestSampling').mockResolvedValue(mockResponse);

      const result = await enhancer.enhance('Original', 'six_hats');

      expect(result.enhanced).toBeTruthy();
      expect(result.features?.length).toBeGreaterThan(0);
      expect(result.implementation?.length).toBeGreaterThan(0);
      expect(result.valueProps?.length).toBeGreaterThan(0);
    });

    it('should handle partial response gracefully', async () => {
      mockManager.setCapability({ supported: true });

      const mockResponse: SamplingResult = {
        content: 'Just a simple enhanced idea without structure',
      };

      vi.spyOn(mockManager, 'requestSampling').mockResolvedValue(mockResponse);

      const result = await enhancer.enhance('Original', 'po');

      expect(result.original).toBe('Original');
      expect(result.enhanced).toContain('Just a simple enhanced idea');
    });

    it('should extract bullet points correctly', async () => {
      mockManager.setCapability({ supported: true });

      const mockResponse: SamplingResult = {
        content: `
          ADDITIONAL FEATURES:
          • Bullet with dot
          - Bullet with dash
          * Bullet with asterisk
          1. Numbered item
          2) Another numbered item
          Plain text item that is long enough
        `,
      };

      vi.spyOn(mockManager, 'requestSampling').mockResolvedValue(mockResponse);

      const result = await enhancer.enhance('Original', 'scamper');

      expect(result.features).toBeDefined();
      expect(result.features?.some(f => f.includes('Bullet with dot'))).toBe(true);
      expect(result.features?.some(f => f.includes('Bullet with dash'))).toBe(true);
      expect(result.features?.some(f => f.includes('Numbered item'))).toBe(true);
    });
  });
});
