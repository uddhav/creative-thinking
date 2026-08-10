import { describe, it, expect, beforeEach } from 'vitest';
import { CulturalIntegrationHandler } from '../../techniques/CulturalIntegrationHandler.js';

describe('CulturalIntegrationHandler', () => {
  let handler: CulturalIntegrationHandler;

  beforeEach(() => {
    handler = new CulturalIntegrationHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Cultural Integration');
      expect(info.emoji).toBe('🌍');
      expect(info.totalSteps).toBe(5);
      expect(info.description).toContain('diverse cultural perspectives');
      expect(info.focus).toContain('culturally-aware solutions');
      expect(info.parallelSteps?.canParallelize).toBe(false);
      expect(info.reflexivityProfile?.primaryCommitmentType).toBe('relationship');
      expect(info.reflexivityProfile?.overallReversibility).toBe('medium');
      expect(info.reflexivityProfile?.riskLevel).toBe('medium');
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const expectedSteps = [
        { name: 'Cultural Landscape Mapping', type: 'thinking' },
        { name: 'Touchpoint Discovery', type: 'thinking' },
        { name: 'Bridge Building', type: 'action' },
        { name: 'Perspective Weaving', type: 'thinking' },
        { name: 'Respectful Synthesis', type: 'action' },
      ];

      expectedSteps.forEach((expected, index) => {
        const stepInfo = handler.getStepInfo(index + 1);
        expect(stepInfo.name).toBe(expected.name);
        expect(stepInfo.type).toBe(expected.type);
        expect(stepInfo.emoji).toBeDefined();
        expect(stepInfo.focus).toBeDefined();
      });
    });

    it('should have reflexive effects for action steps', () => {
      const bridgeStep = handler.getStepInfo(3);
      const synthesisStep = handler.getStepInfo(5);

      expect(bridgeStep.reflexiveEffects).toBeDefined();
      expect(bridgeStep.reflexiveEffects?.reversibility).toBe('low');
      expect(bridgeStep.reflexiveEffects?.triggers).toContain('Building cultural bridges');

      expect(synthesisStep.reflexiveEffects).toBeDefined();
      expect(synthesisStep.reflexiveEffects?.reversibility).toBe('medium');
      expect(synthesisStep.reflexiveEffects?.triggers).toContain('Implementing synthesis');
    });

    it('should return fallback info for invalid step', () => {
      const invalidStep = handler.getStepInfo(0);
      expect(invalidStep.name).toBe('Unknown Step');
      expect(invalidStep.focus).toContain('Cultural Integration');

      const beyondStep = handler.getStepInfo(6);
      expect(beyondStep.name).toBe('Unknown Step');
      expect(beyondStep.focus).toContain('Cultural Integration');
    });
  });

  describe('getStepGuidance', () => {
    it('should provide comprehensive guidance for each step', () => {
      const problem = 'global product launch';

      for (let i = 1; i <= 5; i++) {
        const guidance = handler.getStepGuidance(i, problem);
        expect(guidance).toContain(problem);
        expect(guidance.length).toBeGreaterThan(100);
      }
    });

    it('should provide specific guidance for cultural landscape mapping', () => {
      const guidance = handler.getStepGuidance(1, 'test problem');
      expect(guidance).toContain('cultural frameworks');
      expect(guidance).toContain('power dynamics');
      expect(guidance).toContain('constraints');
      expect(guidance).toContain('taboos');
    });

    it('should provide specific guidance for bridge building', () => {
      const guidance = handler.getStepGuidance(3, 'test problem');
      expect(guidance).toContain('authentic bridges');
      expect(guidance).toContain('translation');
      expect(guidance).toContain('trust');
    });
  });

  describe('validateStep', () => {
    it('should validate that output field exists', () => {
      const validData = {
        output: 'test',
      };
      expect(handler.validateStep(1, validData)).toBe(true);
      expect(handler.validateStep(2, validData)).toBe(true);
      expect(handler.validateStep(3, validData)).toBe(true);
      expect(handler.validateStep(4, validData)).toBe(true);
      expect(handler.validateStep(5, validData)).toBe(true);

      const invalidData = {};
      expect(handler.validateStep(1, invalidData)).toBe(false);
    });

    it('should accept additional fields without validation', () => {
      const dataWithExtraFields = {
        output: 'test',
        culturalFactors: ['factor1'],
        touchpoints: ['point1'],
        bridgeStrategies: ['strategy1'],
        wovenPerspectives: ['perspective1'],
        culturalSynthesis: 'synthesis',
      };
      // All steps should accept data with any additional fields
      for (let step = 1; step <= 5; step++) {
        expect(handler.validateStep(step, dataWithExtraFields)).toBe(true);
      }
    });
  });

  describe('extractInsights', () => {
    it('reports which frameworks, bridges and paths — not how many', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'Three markets, three different consent norms.',
          culturalFrameworks: ['German data minimalism', 'Japanese group consent'],
        },
        { currentStep: 3, bridgeBuilding: ['local ombudsman in each market'] },
        { currentStep: 4, parallelPaths: ['opt-in first', 'notice first'] },
        {
          currentStep: 5,
          respectfulSynthesis: ['consent copy authored locally, reviewed jointly'],
        },
      ]);

      expect(insights).toContain(
        'Cultural Landscape Mapping: frameworks in play — German data minimalism, Japanese group consent'
      );
      expect(insights).toContain('Bridge Building: bridges built — local ombudsman in each market');
      expect(insights).toContain(
        'Perspective Weaving: parallel paths — opt-in first, notice first'
      );
      expect(insights).toContain(
        'Respectful Synthesis: synthesized approaches — consent copy authored locally, reviewed jointly'
      );
      expect(insights).toContain(
        'Cultural Landscape Mapping: Three markets, three different consent norms.'
      );

      // The old report was a bare count, which named none of them.
      expect(insights.some(i => i.includes('2 cultural perspectives identified'))).toBe(false);
      expect(insights.some(i => i.includes('1 cultural bridges discovered'))).toBe(false);
      expect(insights.some(i => i.includes('2 parallel paths designed'))).toBe(false);
      // No banner: reaching step 5 is not itself a finding.
      expect(insights.some(i => /culturally (respectful|aware) solution/i.test(i))).toBe(false);
    });

    it('reports a cultural field on whichever step carried it', () => {
      // The handler pins no field to a step, and the step names and
      // CrossCulturalInsightStrategy disagree about where bridgeBuilding
      // belongs, so the content must survive either ordering.
      const atStepTwo = handler.extractInsights([
        { currentStep: 2, bridgeBuilding: ['shared glossary'] },
      ]);
      const atStepThree = handler.extractInsights([
        { currentStep: 3, bridgeBuilding: ['shared glossary'] },
      ]);

      expect(atStepTwo).toEqual(['Touchpoint Discovery: bridges built — shared glossary']);
      expect(atStepThree).toEqual(['Bridge Building: bridges built — shared glossary']);
    });

    it('lets a revision supersede the step it revises', () => {
      const insights = handler.extractInsights([
        { currentStep: 1, culturalFrameworks: ['the first reading'] },
        { currentStep: 2, output: 'A later step recorded this.' },
        { currentStep: 1, culturalFrameworks: ['the corrected reading'] },
      ]);

      expect(insights).toContain(
        'Cultural Landscape Mapping: frameworks in play — the corrected reading'
      );
      expect(insights).not.toContain(
        'Cultural Landscape Mapping: frameworks in play — the first reading'
      );
      expect(insights).toContain('Touchpoint Discovery: A later step recorded this.');
      expect(insights.some(i => i.startsWith('Bridge Building'))).toBe(false);
    });

    it('reports nothing for a step that recorded nothing', () => {
      expect(handler.extractInsights([])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 1, output: '   ' }])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 1, culturalFrameworks: [] }])).toEqual([]);
    });

    it('does not cut the output summary at an abbreviation', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'Opt-in rates run 60% vs. 20% here. The default is what differs.',
        },
      ]);

      expect(insights[0]).toContain('vs. 20% here.');
    });
  });

  // getPromptContext is not implemented in BaseTechniqueHandler
  // Remove this test as it's not part of the interface
});
