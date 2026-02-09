import { describe, it, expect } from 'vitest';
import { PersonaGuidanceInjector } from '../../personas/PersonaGuidanceInjector.js';
import { BUILTIN_PERSONAS } from '../../personas/catalog.js';

describe('PersonaGuidanceInjector', () => {
  const richHickey = BUILTIN_PERSONAS.rich_hickey;
  const rorySutherland = BUILTIN_PERSONAS.rory_sutherland;

  describe('createStepContext()', () => {
    it('should create a step context with persona details', () => {
      const context = PersonaGuidanceInjector.createStepContext(richHickey, 1, 5);
      expect(context.personaId).toBe('rich_hickey');
      expect(context.personaName).toBe('Rich Hickey');
      expect(context.voiceGuidance).toContain('Rich Hickey');
      expect(context.principlesReminder).toBeDefined();
      expect(context.challengeQuestion).toBeDefined();
    });

    it('should rotate through principles based on step number', () => {
      const context1 = PersonaGuidanceInjector.createStepContext(richHickey, 1, 5);
      const context2 = PersonaGuidanceInjector.createStepContext(richHickey, 2, 5);
      expect(context1.principlesReminder).not.toBe(context2.principlesReminder);
    });

    it('should rotate through challenge questions based on step number', () => {
      const context1 = PersonaGuidanceInjector.createStepContext(richHickey, 1, 5);
      const context2 = PersonaGuidanceInjector.createStepContext(richHickey, 2, 5);
      expect(context1.challengeQuestion).not.toBe(context2.challengeQuestion);
    });

    it('should wrap around principles when step exceeds array length', () => {
      const totalPrinciples = richHickey.keyPrinciples.length;
      const context1 = PersonaGuidanceInjector.createStepContext(richHickey, 1, 10);
      const contextWrapped = PersonaGuidanceInjector.createStepContext(
        richHickey,
        totalPrinciples + 1,
        10
      );
      expect(context1.principlesReminder).toBe(contextWrapped.principlesReminder);
    });
  });

  describe('injectGuidance()', () => {
    it('should prepend persona header to original guidance', () => {
      const original = 'Analyze the problem from multiple angles.';
      const result = PersonaGuidanceInjector.injectGuidance(original, richHickey, 1, 5);
      expect(result).toContain('**[Thinking as Rich Hickey]**');
      expect(result).toContain('Simple Made Easy');
      expect(result).toContain('Core principle:');
      expect(result).toContain('Challenge:');
      expect(result).toContain(original);
    });

    it('should preserve original guidance completely', () => {
      const original = 'Step 1: Do this specific thing.\nStep 2: Then do that.';
      const result = PersonaGuidanceInjector.injectGuidance(original, rorySutherland, 1, 5);
      expect(result).toContain(original);
    });

    it('should add evaluation criteria on the final step', () => {
      const original = 'Final synthesis step.';
      const result = PersonaGuidanceInjector.injectGuidance(original, richHickey, 5, 5);
      expect(result).toContain("Rich Hickey's Evaluation Criteria");
      expect(result).toContain('Is this simple or just familiar?');
    });

    it('should NOT add evaluation criteria on non-final steps', () => {
      const original = 'Middle step.';
      const result = PersonaGuidanceInjector.injectGuidance(original, richHickey, 3, 5);
      expect(result).not.toContain('Evaluation Criteria');
    });

    it('should work with all built-in personas', () => {
      for (const [_id, persona] of Object.entries(BUILTIN_PERSONAS)) {
        const result = PersonaGuidanceInjector.injectGuidance('Test guidance', persona, 1, 5);
        expect(result).toContain(`**[Thinking as ${persona.name}]**`);
        expect(result).toContain(persona.tagline);
        expect(result).toContain('Test guidance');
      }
    });
  });

  describe('createDebateSynthesisHeader()', () => {
    it('should create header listing all personas', () => {
      const personas = [richHickey, rorySutherland];
      const header = PersonaGuidanceInjector.createDebateSynthesisHeader(personas);
      expect(header).toContain('**[Debate Synthesis]**');
      expect(header).toContain('Rich Hickey');
      expect(header).toContain('Rory Sutherland');
      expect(header).toContain('2 thinkers');
    });

    it('should mention what to look for', () => {
      const personas = [richHickey, BUILTIN_PERSONAS.joe_armstrong];
      const header = PersonaGuidanceInjector.createDebateSynthesisHeader(personas);
      expect(header).toContain('agreements');
      expect(header).toContain('disagreements');
      expect(header).toContain('blind spots');
    });

    it('should include persona taglines', () => {
      const personas = [richHickey, BUILTIN_PERSONAS.nassim_taleb];
      const header = PersonaGuidanceInjector.createDebateSynthesisHeader(personas);
      expect(header).toContain('Simple Made Easy');
      expect(header).toContain('Antifragile');
    });
  });
});
