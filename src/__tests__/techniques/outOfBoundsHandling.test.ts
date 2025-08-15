import { describe, it, expect } from 'vitest';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';

describe('Out-of-bounds step handling', () => {
  const registry = TechniqueRegistry.getInstance();
  const techniques = [
    'six_hats',
    'scamper',
    'design_thinking',
    'concept_extraction',
    'po',
    'random_entry',
    'yes_and',
    'disney_method',
    'nine_windows',
    'triz',
    'neural_state',
    'temporal_work',
    'cultural_integration',
    'collective_intel',
  ];

  techniques.forEach(technique => {
    describe(`${technique} handler`, () => {
      const handler = registry.getHandler(technique);
      const info = handler.getTechniqueInfo();

      it('should handle step 0 gracefully', () => {
        const guidance = handler.getStepGuidance(0, 'test problem');
        expect(guidance).toContain('Complete');
        expect(guidance).toContain(info.name);
        expect(guidance).toContain('test problem');
      });

      it('should handle step 9999 gracefully', () => {
        const guidance = handler.getStepGuidance(9999, 'test problem');
        expect(guidance).toContain('Complete');
        expect(guidance).toContain(info.name);
        expect(guidance).toContain('test problem');
      });

      it('should handle negative step gracefully', () => {
        const guidance = handler.getStepGuidance(-1, 'test problem');
        expect(guidance).toContain('Complete');
        expect(guidance).toContain(info.name);
        expect(guidance).toContain('test problem');
      });

      it('should handle step beyond totalSteps gracefully', () => {
        const guidance = handler.getStepGuidance(info.totalSteps + 1, 'test problem');
        expect(guidance).toContain('Complete');
        expect(guidance).toContain(info.name);
        expect(guidance).toContain('test problem');
      });

      it('should provide proper guidance for valid steps', () => {
        // Test first and last valid steps
        const firstStepGuidance = handler.getStepGuidance(1, 'test problem');
        expect(firstStepGuidance).toBeTruthy();
        expect(firstStepGuidance).not.toContain('Complete the');

        const lastStepGuidance = handler.getStepGuidance(info.totalSteps, 'test problem');
        expect(lastStepGuidance).toBeTruthy();
        expect(lastStepGuidance).not.toContain('Complete the');
      });
    });
  });

  it('should throw helpful error for unknown technique', () => {
    expect(() => registry.getHandler('unknown_technique')).toThrow();

    try {
      registry.getHandler('unknown_technique');
    } catch (error: any) {
      expect(error.message).toContain("Invalid technique: 'unknown_technique'");
      expect(error.message).toContain('Valid techniques are:');
      expect(error.message).toContain('six_hats');
      expect(error.message).toContain('discover_techniques');
    }
  });
});
