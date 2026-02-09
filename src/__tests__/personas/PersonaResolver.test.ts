import { describe, it, expect, beforeEach } from 'vitest';
import { PersonaResolver } from '../../personas/PersonaResolver.js';
import { invalidateCatalogCache } from '../../personas/catalog.js';

describe('PersonaResolver', () => {
  beforeEach(() => {
    invalidateCatalogCache();
  });

  const resolver = new PersonaResolver();

  describe('resolve()', () => {
    it('should resolve built-in persona by exact ID', () => {
      const persona = resolver.resolve('rich_hickey');
      expect(persona).not.toBeNull();
      expect(persona?.id).toBe('rich_hickey');
      expect(persona?.name).toBe('Rich Hickey');
    });

    it('should resolve persona with hyphens', () => {
      const persona = resolver.resolve('rich-hickey');
      expect(persona).not.toBeNull();
      expect(persona?.id).toBe('rich_hickey');
    });

    it('should resolve persona case-insensitively', () => {
      const persona = resolver.resolve('Rich_Hickey');
      expect(persona).not.toBeNull();
      expect(persona?.id).toBe('rich_hickey');
    });

    it('should resolve all 8 built-in personas', () => {
      const ids = [
        'rory_sutherland',
        'rich_hickey',
        'joe_armstrong',
        'tarantino',
        'security_engineer',
        'veritasium',
        'design_thinker',
        'nassim_taleb',
      ];
      for (const id of ids) {
        const persona = resolver.resolve(id);
        expect(persona).not.toBeNull();
        expect(persona?.id).toBe(id);
      }
    });

    it('should return null for unknown persona', () => {
      const persona = resolver.resolve('nonexistent_persona');
      expect(persona).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(resolver.resolve('')).toBeNull();
    });

    it('should return null for non-string input', () => {
      expect(resolver.resolve(null as unknown as string)).toBeNull();
      expect(resolver.resolve(undefined as unknown as string)).toBeNull();
    });

    describe('custom personas', () => {
      it('should resolve custom: prefix to a generated PersonaDefinition', () => {
        const persona = resolver.resolve('custom:Security-minded Rust engineer');
        expect(persona).not.toBeNull();
        expect(persona?.name).toBe('Security-minded Rust engineer');
        expect(persona?.id).toMatch(/^custom_/);
      });

      it('should include hash suffix in custom persona ID for uniqueness', () => {
        const persona = resolver.resolve('custom:Test persona');
        expect(persona).not.toBeNull();
        // ID should end with an 8-char hex hash
        expect(persona?.id).toMatch(/^custom_.*_[a-f0-9]{8}$/);
      });

      it('should generate different IDs for descriptions with same normalized form', () => {
        const persona1 = resolver.resolve('custom:Security Engineer!!!');
        const persona2 = resolver.resolve('custom:Security Engineer???');
        expect(persona1?.id).not.toBe(persona2?.id);
      });

      it('should truncate extremely long descriptions', () => {
        const longDescription = 'A'.repeat(5000);
        const persona = resolver.resolve(`custom:${longDescription}`);
        expect(persona).not.toBeNull();
        // Name should be truncated to 1000 chars
        if (persona) {
          expect(persona.name.length).toBeLessThanOrEqual(1000);
        }
      });

      it('should infer risk-aware outcome from security keywords', () => {
        const persona = resolver.resolve('custom:Security analyst');
        expect(persona).not.toBeNull();
        expect(persona?.preferredOutcome).toBe('risk-aware');
      });

      it('should infer innovative outcome from creative keywords', () => {
        const persona = resolver.resolve('custom:Creative director');
        expect(persona).not.toBeNull();
        expect(persona?.preferredOutcome).toBe('innovative');
      });

      it('should infer collaborative outcome from team keywords', () => {
        const persona = resolver.resolve('custom:Team leader and collaborator');
        expect(persona).not.toBeNull();
        expect(persona?.preferredOutcome).toBe('collaborative');
      });

      it('should infer analytical outcome from data keywords', () => {
        const persona = resolver.resolve('custom:Data analyst');
        expect(persona).not.toBeNull();
        expect(persona?.preferredOutcome).toBe('analytical');
      });

      it('should default to systematic for unrecognized descriptions', () => {
        const persona = resolver.resolve('custom:generic person');
        expect(persona).not.toBeNull();
        expect(persona?.preferredOutcome).toBe('systematic');
      });

      it('should infer technique biases from domain keywords', () => {
        const persona = resolver.resolve('custom:First principles thinker');
        expect(persona).not.toBeNull();
        expect(persona?.techniqueBias.first_principles).toBeDefined();
        expect(persona?.techniqueBias.first_principles).toBeGreaterThan(0.5);
      });

      it('should infer design_thinking bias from design keywords', () => {
        const persona = resolver.resolve('custom:UX designer');
        expect(persona).not.toBeNull();
        expect(persona?.techniqueBias.design_thinking).toBeDefined();
      });

      it('should infer biomimetic_path bias from biological keywords', () => {
        const persona = resolver.resolve('custom:Biological systems researcher');
        expect(persona).not.toBeNull();
        expect(persona?.techniqueBias.biomimetic_path).toBeDefined();
      });

      it('should infer behavioral technique bias from psychology keywords', () => {
        const persona = resolver.resolve('custom:Behavioral psychologist');
        expect(persona).not.toBeNull();
        expect(persona?.techniqueBias.perception_optimization).toBeDefined();
        expect(persona?.techniqueBias.context_reframing).toBeDefined();
      });

      it('should infer system-related biases from architect keywords', () => {
        const persona = resolver.resolve('custom:Systems architect');
        expect(persona).not.toBeNull();
        expect(persona?.techniqueBias.triz).toBeDefined();
        expect(persona?.techniqueBias.nine_windows).toBeDefined();
      });

      it('should accumulate multiple biases from multiple keyword matches', () => {
        const persona = resolver.resolve(
          'custom:Creative security architect with biology background'
        );
        expect(persona).not.toBeNull();
        // Should have biases from creative, security, architect, and biology
        if (persona) {
          expect(Object.keys(persona.techniqueBias).length).toBeGreaterThanOrEqual(3);
        }
      });

      it('should produce empty techniqueBias for descriptions with no matching keywords', () => {
        const persona = resolver.resolve('custom:Philosopher');
        expect(persona).not.toBeNull();
        if (persona) {
          expect(Object.keys(persona.techniqueBias).length).toBe(0);
        }
      });

      it('should have required PersonaDefinition fields', () => {
        const persona = resolver.resolve('custom:Test persona');
        expect(persona).not.toBeNull();
        expect(persona?.tagline).toBeDefined();
        expect(persona?.perspective).toBeDefined();
        if (persona) {
          expect(persona.keyPrinciples.length).toBeGreaterThan(0);
          expect(persona.evaluationCriteria.length).toBeGreaterThan(0);
          expect(persona.challengeQuestions.length).toBeGreaterThan(0);
        }
        expect(persona?.thinkingStyle).toBeDefined();
      });
    });
  });

  describe('listAvailable()', () => {
    it('should return all built-in persona IDs', () => {
      const ids = resolver.listAvailable();
      expect(ids).toContain('rich_hickey');
      expect(ids).toContain('rory_sutherland');
      expect(ids).toContain('nassim_taleb');
      expect(ids.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('getSummaries()', () => {
    it('should return summaries with id, name, tagline, preferredOutcome', () => {
      const summaries = resolver.getSummaries();
      expect(summaries.length).toBeGreaterThanOrEqual(8);
      for (const summary of summaries) {
        expect(summary.id).toBeDefined();
        expect(summary.name).toBeDefined();
        expect(summary.tagline).toBeDefined();
        expect(summary.preferredOutcome).toBeDefined();
      }
    });
  });
});
