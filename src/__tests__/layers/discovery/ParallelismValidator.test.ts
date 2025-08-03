/**
 * Tests for ParallelismValidator
 */

import { describe, it, expect } from 'vitest';
import { ParallelismValidator } from '../../../layers/discovery/ParallelismValidator.js';
import type { LateralTechnique } from '../../../types/index.js';

describe('ParallelismValidator', () => {
  const validator = new ParallelismValidator();

  describe('validateParallelRequest', () => {
    it('should reject requests with less than 2 techniques', () => {
      const result = validator.validateParallelRequest(['six_hats']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parallel execution requires at least 2 techniques');
    });

    it('should accept valid parallel requests', () => {
      const result = validator.validateParallelRequest(['six_hats', 'po', 'random_entry']);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should enforce max parallelism limit', () => {
      const techniques: LateralTechnique[] = [
        'six_hats',
        'po',
        'random_entry',
        'scamper',
        'concept_extraction',
        'yes_and',
      ];

      const result = validator.validateParallelRequest(techniques, 5);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum of 5');
    });

    it('should warn about duplicate techniques', () => {
      const result = validator.validateParallelRequest(['six_hats', 'po', 'six_hats']);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Duplicate techniques detected in parallel request');
    });

    it('should detect dependent techniques', () => {
      const result = validator.validateParallelRequest(['design_thinking', 'triz']);
      expect(result.isValid).toBe(true);
      expect(result.warnings[0]).toContain('Techniques have dependencies');
      expect(result.warnings[0]).toContain('design_thinking → triz');
    });

    it('should warn about high resource usage', () => {
      const result = validator.validateParallelRequest([
        'design_thinking',
        'triz',
        'nine_windows',
        'collective_intel',
      ]);
      expect(result.warnings.some(w => w.includes('High memory usage'))).toBe(true);
      expect(result.warnings.some(w => w.includes('High complexity'))).toBe(true);
    });

    it('should provide convergence recommendation for many techniques', () => {
      const result = validator.validateParallelRequest([
        'six_hats',
        'po',
        'random_entry',
        'scamper',
      ]);
      expect(result.recommendations).toContain(
        'Use convergence technique to synthesize results effectively'
      );
    });
  });

  describe('canTechniquesRunInParallel', () => {
    it('should identify independent techniques', () => {
      expect(validator.canTechniquesRunInParallel('six_hats', 'po')).toBe(true);
      expect(validator.canTechniquesRunInParallel('random_entry', 'scamper')).toBe(true);
    });

    it('should identify dependent techniques', () => {
      expect(validator.canTechniquesRunInParallel('design_thinking', 'triz')).toBe(false);
      expect(validator.canTechniquesRunInParallel('concept_extraction', 'yes_and')).toBe(false);
    });

    it('should be commutative', () => {
      expect(validator.canTechniquesRunInParallel('design_thinking', 'triz')).toBe(
        validator.canTechniquesRunInParallel('triz', 'design_thinking')
      );
    });
  });

  describe('estimateResourceUsage', () => {
    it('should estimate resources for simple techniques', () => {
      const result = validator.estimateResourceUsage(['six_hats', 'po']);
      expect(result.complexity).toBe('low');
      expect(result.memoryMB).toBeLessThan(50);
    });

    it('should estimate higher resources for complex techniques', () => {
      const result = validator.estimateResourceUsage(['design_thinking', 'triz']);
      expect(result.complexity).toBe('high');
      expect(result.memoryMB).toBeGreaterThan(50);
    });

    it('should reduce time estimate for parallel execution', () => {
      const single = validator.estimateResourceUsage(['design_thinking']);
      const parallel = validator.estimateResourceUsage(['design_thinking', 'triz']);

      // Parallel time should be less than sum of individual times
      expect(parallel.estimatedTimeMs).toBeLessThan(single.estimatedTimeMs * 2);
    });
  });

  describe('getOptimalGrouping', () => {
    it('should group independent techniques together', () => {
      const techniques: LateralTechnique[] = ['six_hats', 'po', 'random_entry', 'scamper'];

      const groups = validator.getOptimalGrouping(techniques, 3);
      expect(groups.length).toBeGreaterThanOrEqual(2);
      expect(groups[0].length).toBeLessThanOrEqual(3);
    });

    it('should separate dependent techniques', () => {
      const techniques: LateralTechnique[] = [
        'design_thinking',
        'triz',
        'six_hats',
        'concept_extraction',
        'yes_and',
      ];

      const groups = validator.getOptimalGrouping(techniques, 5);

      // Design thinking and TRIZ should be in different groups
      const designGroup = groups.find(g => g.includes('design_thinking'));
      const trizGroup = groups.find(g => g.includes('triz'));
      expect(designGroup).not.toBe(trizGroup);

      // Concept extraction and yes_and should be in different groups
      const conceptGroup = groups.find(g => g.includes('concept_extraction'));
      const yesAndGroup = groups.find(g => g.includes('yes_and'));
      expect(conceptGroup).not.toBe(yesAndGroup);
    });

    it('should respect max parallelism', () => {
      const techniques: LateralTechnique[] = Array(10).fill('six_hats');
      const groups = validator.getOptimalGrouping(techniques, 3);

      for (const group of groups) {
        expect(group.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('recommendations', () => {
    it('should provide specific recommendations for design thinking dependencies', () => {
      const result = validator.validateParallelRequest(['design_thinking', 'triz', 'six_hats']);
      expect(
        result.recommendations.some(r => r.includes('Consider running design_thinking first'))
      ).toBe(true);
    });

    it('should recommend hybrid parallelization for complex sets', () => {
      const result = validator.validateParallelRequest([
        'design_thinking',
        'triz',
        'nine_windows',
        'collective_intel',
      ]);
      expect(result.recommendations.some(r => r.includes('hybrid parallelization'))).toBe(true);
    });

    it('should note synergies between compatible techniques', () => {
      const result = validator.validateParallelRequest(['collective_intel', 'cross_cultural']);
      expect(result.recommendations.some(r => r.includes('combine well'))).toBe(true);
    });
  });
});
