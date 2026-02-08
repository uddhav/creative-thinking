import { describe, it, expect } from 'vitest';
import { DebateSynthesizer } from '../../personas/DebateSynthesizer.js';
import { BUILTIN_PERSONAS } from '../../personas/catalog.js';
import type { PersonaPosition } from '../../personas/DebateSynthesizer.js';

describe('DebateSynthesizer', () => {
  const synthesizer = new DebateSynthesizer();

  const makePosition = (
    personaId: string,
    personaName: string,
    overrides?: Partial<PersonaPosition>
  ): PersonaPosition => ({
    personaId,
    personaName,
    keyArguments: ['Systems should be simple and composable'],
    evidence: ['Evidence A'],
    proposedSolution: 'Default solution',
    ...overrides,
  });

  describe('synthesize()', () => {
    it('should create a debate outcome with all sections', () => {
      const positions: PersonaPosition[] = [
        makePosition('rich_hickey', 'Rich Hickey', {
          keyArguments: ['Simplicity is essential for system reliability'],
          proposedSolution: 'Decompose into simple, composable services',
        }),
        makePosition('joe_armstrong', 'Joe Armstrong', {
          keyArguments: ['Isolation is essential for system reliability'],
          proposedSolution: 'Use actor model with supervision trees',
        }),
      ];

      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = synthesizer.synthesize('System architecture', positions, personas);

      expect(result.topic).toBe('System architecture');
      expect(result.positions).toHaveLength(2);
      expect(result.agreements).toBeDefined();
      expect(result.disagreements).toBeDefined();
      expect(result.blindSpots).toBeDefined();
      expect(result.actionableSynthesis).toBeDefined();
    });

    it('should detect agreements when arguments share significant keywords', () => {
      const positions: PersonaPosition[] = [
        makePosition('a', 'Persona A', {
          keyArguments: ['Systems should handle failure gracefully through isolation'],
        }),
        makePosition('b', 'Persona B', {
          keyArguments: ['Failure handling through proper isolation is critical'],
        }),
      ];

      const result = synthesizer.synthesize('Topic', positions, [
        BUILTIN_PERSONAS.rich_hickey,
        BUILTIN_PERSONAS.joe_armstrong,
      ]);

      expect(result.agreements.length).toBeGreaterThan(0);
    });

    it('should detect disagreements when proposed solutions differ', () => {
      const positions: PersonaPosition[] = [
        makePosition('a', 'Persona A', {
          proposedSolution: 'Use microservices',
        }),
        makePosition('b', 'Persona B', {
          proposedSolution: 'Use monolith',
        }),
      ];

      const result = synthesizer.synthesize('Topic', positions, [
        BUILTIN_PERSONAS.rich_hickey,
        BUILTIN_PERSONAS.joe_armstrong,
      ]);

      expect(result.disagreements.length).toBeGreaterThan(0);
      expect(result.disagreements[0]).toContain('Persona A');
      expect(result.disagreements[0]).toContain('Persona B');
    });

    it('should identify blind spots from persona definitions', () => {
      const positions: PersonaPosition[] = [
        makePosition('rich_hickey', 'Rich Hickey'),
        makePosition('joe_armstrong', 'Joe Armstrong'),
      ];

      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = synthesizer.synthesize('Topic', positions, personas);

      expect(result.blindSpots.length).toBeGreaterThan(0);
      // Rich Hickey's blind spots should be included
      expect(result.blindSpots.some(b => b.includes('Rich Hickey'))).toBe(true);
      expect(result.blindSpots.some(b => b.includes('Joe Armstrong'))).toBe(true);
    });

    it('should generate actionable synthesis text', () => {
      const positions: PersonaPosition[] = [
        makePosition('a', 'Persona A', { proposedSolution: 'Solution A' }),
        makePosition('b', 'Persona B', { proposedSolution: 'Solution B' }),
      ];

      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = synthesizer.synthesize('Architecture', positions, personas);

      expect(result.actionableSynthesis).toContain('Debate Synthesis');
      expect(result.actionableSynthesis).toContain('Architecture');
      expect(result.actionableSynthesis).toContain('Recommended Action');
    });

    it('should handle single position gracefully', () => {
      const positions: PersonaPosition[] = [makePosition('a', 'Persona A')];

      const result = synthesizer.synthesize('Topic', positions, [BUILTIN_PERSONAS.rich_hickey]);

      expect(result.agreements).toHaveLength(0);
      expect(result.disagreements).toHaveLength(0);
    });

    it('should handle empty positions', () => {
      const result = synthesizer.synthesize('Topic', [], []);

      expect(result.positions).toHaveLength(0);
      expect(result.agreements).toHaveLength(0);
      expect(result.disagreements).toHaveLength(0);
      expect(result.blindSpots).toHaveLength(0);
    });

    it('should include agreement/disagreement counts in synthesis', () => {
      const positions: PersonaPosition[] = [
        makePosition('a', 'Persona A', { proposedSolution: 'A' }),
        makePosition('b', 'Persona B', { proposedSolution: 'B' }),
      ];

      const personas = [BUILTIN_PERSONAS.rich_hickey, BUILTIN_PERSONAS.joe_armstrong];
      const result = synthesizer.synthesize('Topic', positions, personas);

      expect(result.actionableSynthesis).toContain('disagreement');
      expect(result.actionableSynthesis).toContain('blind spot');
    });
  });

  describe('findOverlappingThemes edge cases', () => {
    it('should find no agreements when arguments have no overlapping words', () => {
      const positions: PersonaPosition[] = [
        makePosition('a', 'Persona A', {
          keyArguments: ['Alpha bravo charlie delta echo'],
        }),
        makePosition('b', 'Persona B', {
          keyArguments: ['Foxtrot golf hotel india juliet'],
        }),
      ];

      const result = synthesizer.synthesize('Topic', positions, [
        BUILTIN_PERSONAS.rich_hickey,
        BUILTIN_PERSONAS.joe_armstrong,
      ]);

      expect(result.agreements).toHaveLength(0);
    });

    it('should find no agreements when all words are short (< 5 chars)', () => {
      const positions: PersonaPosition[] = [
        makePosition('a', 'Persona A', {
          keyArguments: ['use the old code base here now'],
        }),
        makePosition('b', 'Persona B', {
          keyArguments: ['use the old code base here now'],
        }),
      ];

      const result = synthesizer.synthesize('Topic', positions, [
        BUILTIN_PERSONAS.rich_hickey,
        BUILTIN_PERSONAS.joe_armstrong,
      ]);

      expect(result.agreements).toHaveLength(0);
    });

    it('should find agreement when arguments share exactly 2 significant words', () => {
      const positions: PersonaPosition[] = [
        makePosition('a', 'Persona A', {
          keyArguments: ['Building robust systems requires testing'],
        }),
        makePosition('b', 'Persona B', {
          keyArguments: ['Robust architectures need proper testing'],
        }),
      ];

      const result = synthesizer.synthesize('Topic', positions, [
        BUILTIN_PERSONAS.rich_hickey,
        BUILTIN_PERSONAS.joe_armstrong,
      ]);

      // "robust" and "testing" are both >4 chars and shared
      expect(result.agreements.length).toBeGreaterThan(0);
    });

    it('should handle arguments with special characters and numbers', () => {
      const positions: PersonaPosition[] = [
        makePosition('a', 'Persona A', {
          keyArguments: ['System-level optimization @100% efficiency!'],
        }),
        makePosition('b', 'Persona B', {
          keyArguments: ['Optimization of system-level components'],
        }),
      ];

      const result = synthesizer.synthesize('Topic', positions, [
        BUILTIN_PERSONAS.rich_hickey,
        BUILTIN_PERSONAS.joe_armstrong,
      ]);

      // Should not crash on special characters
      expect(result).toBeDefined();
    });

    it('should handle empty argument lists', () => {
      const positions: PersonaPosition[] = [
        makePosition('a', 'Persona A', { keyArguments: [] }),
        makePosition('b', 'Persona B', { keyArguments: [] }),
      ];

      const result = synthesizer.synthesize('Topic', positions, [
        BUILTIN_PERSONAS.rich_hickey,
        BUILTIN_PERSONAS.joe_armstrong,
      ]);

      expect(result.agreements).toHaveLength(0);
    });
  });
});
