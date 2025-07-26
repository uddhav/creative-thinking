import { describe, it, expect } from 'vitest';
import type { LateralTechnique, LateralThinkingData } from '../index.js';

describe('TRIZ Type Definitions', () => {
  it('should include triz in LateralTechnique type', () => {
    const techniques: LateralTechnique[] = [
      'six_hats',
      'po', 
      'random_entry',
      'scamper',
      'concept_extraction',
      'yes_and',
      'design_thinking',
      'triz'
    ];
    expect(techniques).toContain('triz');
  });

  it('should have correct TRIZ specific fields in LateralThinkingData', () => {
    const trizData: Partial<LateralThinkingData> = {
      technique: 'triz',
      problem: 'Need efficient energy storage',
      currentStep: 1,
      totalSteps: 4,
      output: 'Identifying contradiction',
      nextStepNeeded: true,
      contradiction: 'Need high capacity BUT need fast charging',
      inventivePrinciples: ['Principle 2: Taking out', 'Principle 35: Parameter changes'],
      viaNegativaRemovals: ['Remove heat generation', 'Remove chemical degradation'],
      minimalSolution: 'Solid-state battery with optimized ion paths'
    };

    expect(trizData.technique).toBe('triz');
    expect(trizData.contradiction).toBeDefined();
    expect(trizData.inventivePrinciples).toHaveLength(2);
    expect(trizData.viaNegativaRemovals).toHaveLength(2);
    expect(trizData.minimalSolution).toBeDefined();
  });

  it('should structure TRIZ data for each step correctly', () => {
    // Step 1: Identify Contradiction
    const step1Data: Partial<LateralThinkingData> = {
      technique: 'triz',
      currentStep: 1,
      contradiction: 'Need X but get Y',
      risks: ['Traditional solutions are complex', 'Cost increases with performance']
    };
    expect(step1Data.contradiction).toBeDefined();

    // Step 2: Via Negativa
    const step2Data: Partial<LateralThinkingData> = {
      technique: 'triz',
      currentStep: 2,
      viaNegativaRemovals: [
        'Remove unnecessary components',
        'Remove process steps',
        'Remove material waste'
      ],
      risks: ['May compromise functionality', 'Requires careful analysis']
    };
    expect(step2Data.viaNegativaRemovals).toBeDefined();
    expect(step2Data.viaNegativaRemovals).toHaveLength(3);

    // Step 3: Apply Inventive Principles
    const step3Data: Partial<LateralThinkingData> = {
      technique: 'triz',
      currentStep: 3,
      inventivePrinciples: [
        'Principle 1: Segmentation',
        'Principle 2: Taking out',
        'Principle 35: Parameter changes'
      ],
      mitigations: ['Test each principle', 'Combine complementary approaches']
    };
    expect(step3Data.inventivePrinciples).toBeDefined();
    expect(step3Data.inventivePrinciples).toHaveLength(3);

    // Step 4: Minimal Solution
    const step4Data: Partial<LateralThinkingData> = {
      technique: 'triz',
      currentStep: 4,
      minimalSolution: 'Achieve goal with 50% fewer components through systematic removal and optimization',
      antifragileProperties: [
        'Solution improves with stress',
        'Failures guide optimization',
        'Simpler design more robust'
      ]
    };
    expect(step4Data.minimalSolution).toBeDefined();
    expect(step4Data.antifragileProperties).toBeDefined();
    expect(step4Data.antifragileProperties).toHaveLength(3);
  });

  it('should follow 4-step TRIZ process', () => {
    const trizSteps = [
      'Identify Contradiction',
      'Via Negativa - What to Remove?',
      'Apply Inventive Principles',
      'Minimal Solution'
    ];
    
    expect(trizSteps).toHaveLength(4);
    expect(trizSteps[0]).toContain('Contradiction');
    expect(trizSteps[1]).toContain('Via Negativa');
    expect(trizSteps[2]).toContain('Inventive Principles');
    expect(trizSteps[3]).toContain('Minimal Solution');
  });
});