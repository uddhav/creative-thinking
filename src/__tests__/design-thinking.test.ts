import { describe, it, expect } from 'vitest';
import type { LateralTechnique, DesignThinkingStage, LateralThinkingData } from '../index.js';

describe('Design Thinking Type Definitions', () => {
  it('should include design_thinking in LateralTechnique type', () => {
    const techniques: LateralTechnique[] = [
      'six_hats',
      'po',
      'random_entry',
      'scamper',
      'concept_extraction',
      'yes_and',
      'design_thinking',
    ];
    expect(techniques).toContain('design_thinking');
  });

  it('should have correct design thinking stages', () => {
    const stages: DesignThinkingStage[] = ['empathize', 'define', 'ideate', 'prototype', 'test'];
    expect(stages).toHaveLength(5);
    expect(stages[0]).toBe('empathize');
    expect(stages[1]).toBe('define');
    expect(stages[2]).toBe('ideate');
    expect(stages[3]).toBe('prototype');
    expect(stages[4]).toBe('test');
  });

  it('should have correct design thinking specific fields in LateralThinkingData', () => {
    const designThinkingData: Partial<LateralThinkingData> = {
      technique: 'design_thinking',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 5,
      output: 'Test output',
      nextStepNeeded: true,
      designStage: 'empathize',
      empathyInsights: ['insight1', 'insight2'],
      problemStatement: 'How might we...',
      failureModesPredicted: ['failure1', 'failure2'],
      ideaList: ['idea1', 'idea2'],
      prototypeDescription: 'MVP description',
      stressTestResults: ['test1', 'test2'],
      userFeedback: ['feedback1', 'feedback2'],
      failureInsights: ['learning1', 'learning2'],
    };

    expect(designThinkingData.technique).toBe('design_thinking');
    expect(designThinkingData.designStage).toBe('empathize');
    expect(designThinkingData.empathyInsights).toHaveLength(2);
    expect(designThinkingData.failureModesPredicted).toHaveLength(2);
  });

  it('should structure design thinking data for each stage correctly', () => {
    // Stage 1: Empathize
    const empathizeData: Partial<LateralThinkingData> = {
      technique: 'design_thinking',
      currentStep: 1,
      designStage: 'empathize',
      empathyInsights: ['User needs X', 'User struggles with Y'],
      risks: ['Potential misuse', 'Privacy concerns'],
    };
    expect(empathizeData.designStage).toBe('empathize');
    expect(empathizeData.empathyInsights).toBeDefined();

    // Stage 2: Define
    const defineData: Partial<LateralThinkingData> = {
      technique: 'design_thinking',
      currentStep: 2,
      designStage: 'define',
      problemStatement: 'How might we solve X while avoiding Y?',
      failureModesPredicted: ['Could fail if...', 'Might not work when...'],
    };
    expect(defineData.designStage).toBe('define');
    expect(defineData.problemStatement).toBeDefined();
    expect(defineData.failureModesPredicted).toBeDefined();

    // Stage 3: Ideate
    const ideateData: Partial<LateralThinkingData> = {
      technique: 'design_thinking',
      currentStep: 3,
      designStage: 'ideate',
      ideaList: ['Solution 1 (Risk: X)', 'Solution 2 (Risk: Y)'],
      risks: ['Implementation challenges', 'User adoption'],
    };
    expect(ideateData.designStage).toBe('ideate');
    expect(ideateData.ideaList).toBeDefined();

    // Stage 4: Prototype
    const prototypeData: Partial<LateralThinkingData> = {
      technique: 'design_thinking',
      currentStep: 4,
      designStage: 'prototype',
      prototypeDescription: 'MVP with features A, B, C',
      stressTestResults: ['Failed under load X', 'Edge case Y not handled'],
      mitigations: ['Add caching', 'Implement fallback'],
    };
    expect(prototypeData.designStage).toBe('prototype');
    expect(prototypeData.prototypeDescription).toBeDefined();
    expect(prototypeData.stressTestResults).toBeDefined();

    // Stage 5: Test
    const testData: Partial<LateralThinkingData> = {
      technique: 'design_thinking',
      currentStep: 5,
      designStage: 'test',
      userFeedback: ['Users love X', 'Users confused by Y'],
      failureInsights: ['Feature Z not used', 'Assumption A was wrong'],
      antifragileProperties: ['System improved from user feedback', 'Failures led to better UX'],
    };
    expect(testData.designStage).toBe('test');
    expect(testData.userFeedback).toBeDefined();
    expect(testData.failureInsights).toBeDefined();
    expect(testData.antifragileProperties).toBeDefined();
  });
});
