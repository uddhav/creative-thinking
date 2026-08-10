/**
 * Tests for ParadoxicalProblemHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParadoxicalProblemHandler } from '../../techniques/ParadoxicalProblemHandler.js';
import { ValidationError, ErrorCode } from '../../errors/types.js';

describe('ParadoxicalProblemHandler', () => {
  let handler: ParadoxicalProblemHandler;

  beforeEach(() => {
    handler = new ParadoxicalProblemHandler();
  });

  describe('getTechniqueInfo', () => {
    it('should return correct technique info', () => {
      const info = handler.getTechniqueInfo();

      expect(info.name).toBe('Paradoxical Problem Solving');
      expect(info.emoji).toBe('⚖️');
      expect(info.totalSteps).toBe(4);
      expect(info.description).toContain('contradictions');
      expect(info.focus).toContain('paradoxes');
      expect(info.parallelSteps?.canParallelize).toBe(false);
    });
  });

  describe('getStepInfo', () => {
    it('should return correct info for each step', () => {
      const step1 = handler.getStepInfo(1);
      expect(step1.name).toBe('Paradox Identification');
      expect(step1.emoji).toBe('⚖️');

      const step2 = handler.getStepInfo(2);
      expect(step2.name).toBe('Parallel Path Development');
      expect(step2.emoji).toBe('🔀');

      const step3 = handler.getStepInfo(3);
      expect(step3.name).toBe('Transcendent Synthesis');
      expect(step3.emoji).toBe('🌉');

      const step4 = handler.getStepInfo(4);
      expect(step4.name).toBe('Non-Ergodic Validation');
      expect(step4.emoji).toBe('✨');
    });

    it('should throw error for invalid step', () => {
      expect(() => handler.getStepInfo(0)).toThrow(ValidationError);
      expect(() => handler.getStepInfo(5)).toThrow(ValidationError);

      try {
        handler.getStepInfo(5);
      } catch (error) {
        expect((error as ValidationError).code).toBe(ErrorCode.INVALID_STEP);
      }
    });
  });

  describe('getStepGuidance', () => {
    const problem = 'How to achieve both privacy and personalization';

    it('should provide guidance for step 1 - Paradox Identification', () => {
      const guidance = handler.getStepGuidance(1, problem);
      expect(guidance).toContain('Identify the core paradox');
      expect(guidance).toContain(problem);
      expect(guidance).toContain('contradictory requirements');
      expect(guidance).toContain('stakeholder journeys');
    });

    it('should provide guidance for step 2 - Parallel Path Development', () => {
      const guidance = handler.getStepGuidance(2, problem);
      expect(guidance).toContain('Solution A');
      expect(guidance).toContain('Solution B');
      expect(guidance).toContain('independently');
      expect(guidance).toContain('natural completion');
    });

    it('should provide guidance for step 3 - Transcendent Synthesis', () => {
      const guidance = handler.getStepGuidance(3, problem);
      expect(guidance).toContain('transcendent synthesis');
      expect(guidance).toContain('meta-path');
      expect(guidance).toContain('bridges');
      expect(guidance).toContain('contextual adaptation');
    });

    it('should provide guidance for step 4 - Non-Ergodic Validation', () => {
      const guidance = handler.getStepGuidance(4, problem);
      expect(guidance).toContain('Validate');
      expect(guidance).toContain('multiple path contexts');
      expect(guidance).toContain('starting conditions');
      expect(guidance).toContain('stakeholder paths');
    });
  });

  describe('validateStep', () => {
    it('should validate step 1 data correctly', () => {
      const validData = {
        paradox: 'Privacy vs Personalization',
        contradictions: ['user wants privacy', 'user wants recommendations'],
        pathOrigins: ['regulatory requirements', 'business model'],
      };

      expect(handler.validateStep(1, validData)).toBe(true);
    });

    it('should reject step 1 without paradox identification', () => {
      const invalidData = {
        something: 'else',
      };

      expect(() => handler.validateStep(1, invalidData)).toThrow(ValidationError);
    });

    it('should validate step 2 data correctly', () => {
      const validData = {
        solutionA: 'Full privacy mode with no tracking',
        solutionB: 'Full personalization with all data',
        parallelPaths: ['privacy-first path', 'personalization-first path'],
      };

      expect(handler.validateStep(2, validData)).toBe(true);
    });

    it('should validate step 3 data correctly', () => {
      const validData = {
        synthesis: 'Dynamic privacy levels based on trust',
        metaPath: 'Trust-based adaptation',
        bridge: 'Progressive disclosure mechanism',
      };

      expect(handler.validateStep(3, validData)).toBe(true);
    });

    it('should validate step 4 data correctly', () => {
      const validData = {
        validation: 'Tested across 5 user scenarios',
        pathContexts: ['new user', 'trusted user', 'privacy-conscious'],
        resolutionVerified: true,
      };

      expect(handler.validateStep(4, validData)).toBe(true);
    });

    it('should handle output as string', () => {
      expect(handler.validateStep(1, 'Identified privacy-personalization paradox')).toBe(true);
    });

    it('should reject invalid step numbers', () => {
      // Step 0 returns false from base validation
      expect(handler.validateStep(0, {})).toBe(false);
      // Step 5 returns false from base validation
      expect(handler.validateStep(5, {})).toBe(false);
    });
  });

  describe('getStepPrompt', () => {
    const problem = 'How to be both fast and thorough';

    it('should generate formatted prompt for each step', () => {
      const prompt1 = handler.getStepPrompt(1, problem);
      expect(prompt1).toContain('⚖️');
      expect(prompt1).toContain('**Paradox Identification**');
      expect(prompt1).toContain('Surface contradictions');

      const prompt2 = handler.getStepPrompt(2, problem);
      expect(prompt2).toContain('🔀');
      expect(prompt2).toContain('**Parallel Path Development**');

      const prompt3 = handler.getStepPrompt(3, problem);
      expect(prompt3).toContain('🌉');
      expect(prompt3).toContain('**Transcendent Synthesis**');

      const prompt4 = handler.getStepPrompt(4, problem);
      expect(prompt4).toContain('✨');
      expect(prompt4).toContain('**Non-Ergodic Validation**');
    });
  });

  describe('getRiskAssessmentPrompt', () => {
    it('should provide risk prompts for each step', () => {
      const risk1 = handler.getRiskAssessmentPrompt(1);
      expect(risk1).toContain('fundamental');
      expect(risk1).toContain('deeper contradictions');

      const risk2 = handler.getRiskAssessmentPrompt(2);
      expect(risk2).toContain('incompatible architectures');

      const risk3 = handler.getRiskAssessmentPrompt(3);
      expect(risk3).toContain('truly transcendent');
      expect(risk3).toContain('new paradoxes');

      const risk4 = handler.getRiskAssessmentPrompt(4);
      expect(risk4).toContain('edge cases');
    });

    it('should provide default risk prompt for invalid step', () => {
      const risk = handler.getRiskAssessmentPrompt(99);
      expect(risk).toContain('What risks');
    });
  });

  describe('extractInsights', () => {
    it('reports every required field under its own step name', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'Speed and auditability pull opposite ways.',
          paradox: 'Every audit hook costs the latency budget it protects',
        },
        {
          currentStep: 2,
          solutionA: 'Synchronous audit on the write path',
          solutionB: 'Asynchronous audit from the change log',
        },
        { currentStep: 3, synthesis: 'Route by tenant risk tier at admission' },
        {
          currentStep: 4,
          validation: 'Held across three replay histories',
          pathContexts: ['cold start', 'backfill', 'steady state'],
          resolutionVerified: true,
        },
      ]);

      expect(insights).toContain(
        'Paradox Identification: Every audit hook costs the latency budget it protects'
      );
      expect(insights).toContain(
        'Parallel Path Development: path A — Synchronous audit on the write path'
      );
      expect(insights).toContain(
        'Parallel Path Development: path B — Asynchronous audit from the change log'
      );
      expect(insights).toContain('Transcendent Synthesis: Route by tenant risk tier at admission');
      expect(insights).toContain('Non-Ergodic Validation: Held across three replay histories');
      expect(insights).toContain(
        'Non-Ergodic Validation: tested against cold start, backfill, steady state'
      );
      expect(insights).toContain('Non-Ergodic Validation: resolution verified');
      // No banner: reaching step 4 is not itself a finding.
      expect(insights.some(i => /paradox transcended|successfully resolved/i.test(i))).toBe(false);
    });

    it('reports a failed validation instead of dropping it', () => {
      const insights = handler.extractInsights([
        { currentStep: 4, validation: 'Broke under backfill', resolutionVerified: false },
      ]);

      expect(insights).toContain(
        'Non-Ergodic Validation: resolution NOT verified — the paradox is hidden, not resolved'
      );
      expect(insights).not.toContain('Non-Ergodic Validation: resolution verified');
    });

    it('reports the alias fields identically to the primary names', () => {
      const primary = handler.extractInsights([
        { currentStep: 1, paradox: 'a' },
        { currentStep: 3, synthesis: 'c' },
        { currentStep: 4, validation: 'd' },
      ]);
      const aliases = handler.extractInsights([
        { currentStep: 1, contradictions: ['a'] },
        { currentStep: 3, metaPath: 'c' },
        { currentStep: 4, finalSynthesis: 'd' },
      ]);

      expect(aliases).toEqual(primary);
      expect(aliases).toContain('Paradox Identification: a');
      expect(aliases).toContain('Non-Ergodic Validation: d');
    });

    it('reports parallelPaths when the caller sent the array form', () => {
      expect(
        handler.extractInsights([{ currentStep: 2, parallelPaths: ['fast path', 'safe path'] }])
      ).toEqual(['Parallel Path Development: fast path, safe path']);
    });

    it('lets a revision supersede the step it revises', () => {
      const insights = handler.extractInsights([
        { currentStep: 1, paradox: 'the first reading' },
        { currentStep: 3, synthesis: 'a later step' },
        { currentStep: 1, paradox: 'the corrected reading' },
      ]);

      expect(insights).toContain('Paradox Identification: the corrected reading');
      expect(insights).not.toContain('Paradox Identification: the first reading');
      expect(insights).toContain('Transcendent Synthesis: a later step');
      expect(insights.some(i => i.startsWith('Parallel Path Development'))).toBe(false);
    });

    it('reports nothing for a step that recorded nothing', () => {
      expect(handler.extractInsights([])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 1, output: '   ' }])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 2, parallelPaths: [] }])).toEqual([]);
    });

    it('does not cut the output summary at an abbreviation', () => {
      const insights = handler.extractInsights([
        {
          currentStep: 1,
          output: 'Audit adds 12ms vs. 2ms budget. That gap is the whole paradox.',
        },
      ]);

      expect(insights[0]).toContain('vs. 2ms budget.');
    });
  });

  describe('getPathDependencyPrompt', () => {
    it('should provide path dependency prompts for each step', () => {
      const path1 = handler.getPathDependencyPrompt(1);
      expect(path1).toContain('historical paths');
      expect(path1).toContain('decisions led here');

      const path2 = handler.getPathDependencyPrompt(2);
      expect(path2).toContain('path commitments');
      expect(path2).toContain('futures');

      const path3 = handler.getPathDependencyPrompt(3);
      expect(path3).toContain('preserve path flexibility');

      const path4 = handler.getPathDependencyPrompt(4);
      expect(path4).toContain('sensitive');
      expect(path4).toContain('path histories');
    });

    it('should provide default path prompt for invalid step', () => {
      const path = handler.getPathDependencyPrompt(99);
      expect(path).toContain('path dependencies');
    });
  });
});
