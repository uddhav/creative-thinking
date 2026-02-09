import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  BUILTIN_PERSONAS,
  getMergedCatalog,
  loadExternalPersonas,
  invalidateCatalogCache,
} from '../../personas/catalog.js';
import type { PersonaDefinition } from '../../personas/types.js';

describe('Persona Catalog', () => {
  beforeEach(() => {
    invalidateCatalogCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    invalidateCatalogCache();
  });

  describe('BUILTIN_PERSONAS', () => {
    const requiredFields: (keyof PersonaDefinition)[] = [
      'id',
      'name',
      'tagline',
      'perspective',
      'techniqueBias',
      'preferredOutcome',
      'keyPrinciples',
      'evaluationCriteria',
      'challengeQuestions',
      'thinkingStyle',
    ];

    it('should have all 8 built-in personas', () => {
      const expectedIds = [
        'rory_sutherland',
        'rich_hickey',
        'joe_armstrong',
        'tarantino',
        'security_engineer',
        'veritasium',
        'design_thinker',
        'nassim_taleb',
      ];
      expect(Object.keys(BUILTIN_PERSONAS).sort()).toEqual(expectedIds.sort());
    });

    for (const [id, persona] of Object.entries(BUILTIN_PERSONAS)) {
      describe(`${id}`, () => {
        for (const field of requiredFields) {
          it(`should have required field: ${field}`, () => {
            expect(persona).toHaveProperty(field);
          });
        }

        it('should have id matching its key', () => {
          expect(persona.id).toBe(id);
        });

        it('should have non-empty keyPrinciples', () => {
          expect(persona.keyPrinciples.length).toBeGreaterThanOrEqual(1);
        });

        it('should have non-empty challengeQuestions', () => {
          expect(persona.challengeQuestions.length).toBeGreaterThanOrEqual(1);
        });

        it('should have non-empty evaluationCriteria', () => {
          expect(persona.evaluationCriteria.length).toBeGreaterThanOrEqual(1);
        });

        it('should have valid preferredOutcome', () => {
          expect([
            'innovative',
            'systematic',
            'risk-aware',
            'collaborative',
            'analytical',
          ]).toContain(persona.preferredOutcome);
        });

        it('should have thinkingStyle with approach, strengths, and blindSpots', () => {
          expect(typeof persona.thinkingStyle.approach).toBe('string');
          expect(persona.thinkingStyle.strengths.length).toBeGreaterThanOrEqual(1);
          expect(persona.thinkingStyle.blindSpots.length).toBeGreaterThanOrEqual(1);
        });

        it('should have technique bias values between 0 and 1', () => {
          for (const [, value] of Object.entries(persona.techniqueBias)) {
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);
          }
        });
      });
    }
  });

  describe('getMergedCatalog', () => {
    it('should return built-in personas when no PERSONA_CATALOG_PATH is set', () => {
      delete process.env.PERSONA_CATALOG_PATH;
      const catalog = getMergedCatalog();
      expect(Object.keys(catalog)).toEqual(Object.keys(BUILTIN_PERSONAS));
    });

    it('should cache the catalog after first call', () => {
      delete process.env.PERSONA_CATALOG_PATH;
      const catalog1 = getMergedCatalog();
      const catalog2 = getMergedCatalog();
      // Same reference means cache hit
      expect(catalog1).toBe(catalog2);
    });

    it('should invalidate cache when invalidateCatalogCache is called', () => {
      delete process.env.PERSONA_CATALOG_PATH;
      const catalog1 = getMergedCatalog();
      invalidateCatalogCache();
      const catalog2 = getMergedCatalog();
      expect(catalog1).not.toBe(catalog2);
      expect(Object.keys(catalog1)).toEqual(Object.keys(catalog2));
    });

    it('should handle non-existent external path gracefully', () => {
      vi.stubEnv('PERSONA_CATALOG_PATH', '/nonexistent/path.json');
      const catalog = getMergedCatalog();
      // Should fall back to built-in personas
      expect(Object.keys(catalog).length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('loadExternalPersonas', () => {
    const testDir = join(tmpdir(), 'creative-thinking-test-personas');

    beforeEach(() => {
      mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
      rmSync(testDir, { recursive: true, force: true });
    });

    it('should return empty object for non-existent file', () => {
      const result = loadExternalPersonas('/nonexistent/path.json');
      expect(result).toEqual({});
    });

    it('should return empty object for invalid JSON file', () => {
      const filePath = join(testDir, 'invalid.json');
      writeFileSync(filePath, 'not valid json{{{');
      const result = loadExternalPersonas(filePath);
      expect(result).toEqual({});
    });

    it('should load and parse a valid external persona file', () => {
      const validPersona = {
        test_persona: {
          id: 'test_persona',
          name: 'Test Persona',
          tagline: 'For Testing',
          perspective: 'A testing perspective',
          techniqueBias: { first_principles: 0.9 },
          preferredOutcome: 'systematic',
          keyPrinciples: ['Test principle'],
          evaluationCriteria: ['Test criterion'],
          challengeQuestions: ['Test question?'],
          thinkingStyle: {
            approach: 'Test approach',
            strengths: ['Testing'],
            blindSpots: ['None'],
          },
        },
      };
      const filePath = join(testDir, 'valid.json');
      writeFileSync(filePath, JSON.stringify(validPersona));
      const result = loadExternalPersonas(filePath);
      expect(Object.keys(result)).toEqual(['test_persona']);
      expect(result.test_persona.name).toBe('Test Persona');
    });

    it('should merge external personas with built-ins (external overrides)', () => {
      const override = {
        rich_hickey: {
          id: 'rich_hickey',
          name: 'Custom Rich Hickey',
          tagline: 'Overridden',
          perspective: 'Overridden perspective',
          techniqueBias: {},
          preferredOutcome: 'systematic',
          keyPrinciples: ['Custom principle'],
          evaluationCriteria: ['Custom criterion'],
          challengeQuestions: ['Custom question?'],
          thinkingStyle: {
            approach: 'Custom approach',
            strengths: ['Custom'],
            blindSpots: [],
          },
        },
      };
      const filePath = join(testDir, 'override.json');
      writeFileSync(filePath, JSON.stringify(override));
      vi.stubEnv('PERSONA_CATALOG_PATH', filePath);
      const catalog = getMergedCatalog();
      expect(catalog.rich_hickey.name).toBe('Custom Rich Hickey');
    });

    it('should skip invalid persona definitions in external file', () => {
      const mixed = {
        valid_one: {
          id: 'valid_one',
          name: 'Valid',
          tagline: 'Valid',
          perspective: 'Valid',
          techniqueBias: {},
          preferredOutcome: 'systematic',
          keyPrinciples: ['Principle'],
          evaluationCriteria: ['Criterion'],
          challengeQuestions: ['Question?'],
          thinkingStyle: { approach: 'A', strengths: ['S'], blindSpots: [] },
        },
        invalid_one: {
          id: 'invalid_one',
          name: 'Missing fields',
          // Missing most required fields
        },
      };
      const filePath = join(testDir, 'mixed.json');
      writeFileSync(filePath, JSON.stringify(mixed));
      const result = loadExternalPersonas(filePath);
      expect(Object.keys(result)).toEqual(['valid_one']);
    });

    it('should reject path traversal attempts', () => {
      const result = loadExternalPersonas('../../../etc/passwd');
      expect(result).toEqual({});
    });

    it('should reject null bytes in path', () => {
      const result = loadExternalPersonas('/tmp/test\0.json');
      expect(result).toEqual({});
    });

    it('should reject non-file paths', () => {
      // /tmp is a directory, not a file
      const result = loadExternalPersonas(testDir);
      expect(result).toEqual({});
    });

    it('should sanitize persona string fields from external file', () => {
      const nastyPersona = {
        evil: {
          id: 'evil',
          name: 'Evil\x00Persona\x07',
          tagline: 'Nasty',
          perspective: 'Perspective with \x00null bytes',
          techniqueBias: {},
          preferredOutcome: 'innovative',
          keyPrinciples: ['Principle with \x07 bell'],
          evaluationCriteria: ['Criterion'],
          challengeQuestions: ['Question?'],
          thinkingStyle: {
            approach: 'Approach\x00',
            strengths: ['Strength'],
            blindSpots: [],
          },
        },
      };
      const filePath = join(testDir, 'nasty.json');
      writeFileSync(filePath, JSON.stringify(nastyPersona));
      const result = loadExternalPersonas(filePath);
      expect(result.evil).toBeDefined();
      // Control characters should be stripped
      expect(result.evil.name).not.toContain('\x00');
      expect(result.evil.name).not.toContain('\x07');
    });

    it('should reject persona with invalid preferredOutcome', () => {
      const bad = {
        bad_outcome: {
          id: 'bad_outcome',
          name: 'Bad',
          tagline: 'Bad',
          perspective: 'Bad',
          techniqueBias: {},
          preferredOutcome: 'evil',
          keyPrinciples: ['P'],
          evaluationCriteria: ['C'],
          challengeQuestions: ['Q?'],
          thinkingStyle: { approach: 'A', strengths: ['S'], blindSpots: [] },
        },
      };
      const filePath = join(testDir, 'bad-outcome.json');
      writeFileSync(filePath, JSON.stringify(bad));
      const result = loadExternalPersonas(filePath);
      expect(result).toEqual({});
    });

    it('should reject persona with empty keyPrinciples', () => {
      const bad = {
        empty_principles: {
          id: 'empty',
          name: 'Empty',
          tagline: 'Empty',
          perspective: 'Empty',
          techniqueBias: {},
          preferredOutcome: 'systematic',
          keyPrinciples: [],
          evaluationCriteria: ['C'],
          challengeQuestions: ['Q?'],
          thinkingStyle: { approach: 'A', strengths: ['S'], blindSpots: [] },
        },
      };
      const filePath = join(testDir, 'empty-principles.json');
      writeFileSync(filePath, JSON.stringify(bad));
      const result = loadExternalPersonas(filePath);
      expect(result).toEqual({});
    });
  });
});
