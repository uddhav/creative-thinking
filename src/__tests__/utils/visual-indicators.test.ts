/**
 * Tests for technique-specific visual indicators
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import type { ThinkingOperationData } from '../../types/index.js';

describe('Visual Indicators', () => {
  let originalEnv: string | undefined;
  let formatter: VisualFormatter;

  beforeEach(() => {
    // Save original env
    originalEnv = process.env.SHOW_TECHNIQUE_INDICATORS;
    // Enable indicators for tests
    process.env.SHOW_TECHNIQUE_INDICATORS = 'true';
    formatter = new VisualFormatter();
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.SHOW_TECHNIQUE_INDICATORS = originalEnv;
    } else {
      delete process.env.SHOW_TECHNIQUE_INDICATORS;
    }
  });

  describe('Technique State Indicators', () => {
    it('should show current hat color for Six Hats', () => {
      const input: ThinkingOperationData = {
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 3,
        totalSteps: 7,
        output: 'Test output',
        nextStepNeeded: true,
      };

      const output = formatter.formatOutput(
        'six_hats',
        'Test problem',
        3,
        7,
        { name: 'Red Hat', focus: 'Emotions', emoji: '🔴' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      expect(output).toContain('[🔴 Red Hat]');
    });

    it('should show current SCAMPER action', () => {
      const input: ThinkingOperationData = {
        technique: 'scamper',
        problem: 'Test problem',
        currentStep: 2,
        totalSteps: 8,
        output: 'Test output',
        nextStepNeeded: true,
        scamperAction: 'combine',
      };

      const output = formatter.formatOutput(
        'scamper',
        'Test problem',
        2,
        8,
        { name: 'Combine', focus: 'Merge elements', emoji: '🔗' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      expect(output).toContain('[🔗 COMBINE]');
    });

    it('should show current Design Thinking stage', () => {
      const input: ThinkingOperationData = {
        technique: 'design_thinking',
        problem: 'Test problem',
        currentStep: 3,
        totalSteps: 5,
        output: 'Test output',
        nextStepNeeded: true,
        designStage: 'ideate',
      };

      const output = formatter.formatOutput(
        'design_thinking',
        'Test problem',
        3,
        5,
        { name: 'Ideate', focus: 'Generate ideas', emoji: '💡' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      expect(output).toContain('[💡 Ideate]');
    });

    it('should show current Disney role', () => {
      const input: ThinkingOperationData = {
        technique: 'disney_method',
        problem: 'Test problem',
        currentStep: 2,
        totalSteps: 3,
        output: 'Test output',
        nextStepNeeded: true,
        disneyRole: 'realist',
      };

      const output = formatter.formatOutput(
        'disney_method',
        'Test problem',
        2,
        3,
        { name: 'Realist', focus: 'Implementation', emoji: '🔨' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      expect(output).toContain('[🔨 Realist]');
    });

    it('should show dominant neural network', () => {
      const input: ThinkingOperationData = {
        technique: 'neural_state',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 4,
        output: 'Test output',
        nextStepNeeded: true,
        dominantNetwork: 'ecn',
      };

      const output = formatter.formatOutput(
        'neural_state',
        'Test problem',
        1,
        4,
        { name: 'Assess State', focus: 'Network analysis', emoji: '🧠' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      expect(output).toContain('[⚡ ECN]');
    });

    it('should show Nine Windows position', () => {
      const input: ThinkingOperationData = {
        technique: 'nine_windows',
        problem: 'Test problem',
        currentStep: 5,
        totalSteps: 9,
        output: 'Test output',
        nextStepNeeded: true,
        currentCell: {
          timeFrame: 'present',
          systemLevel: 'system',
        },
      };

      const output = formatter.formatOutput(
        'nine_windows',
        'Test problem',
        5,
        9,
        { name: 'Present System', focus: 'Current state', emoji: '⚙️' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      expect(output).toContain('[▶️⚙️]');
    });
  });

  describe('Risk Level Indicators', () => {
    it('should show low risk indicator', () => {
      const input: ThinkingOperationData = {
        technique: 'po',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 4,
        output: 'Test output',
        nextStepNeeded: true,
        risks: [],
      };

      const output = formatter.formatOutput(
        'po',
        'Test problem',
        1,
        4,
        { name: 'Provocation', focus: 'Create PO', emoji: '💥' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      expect(output).toContain('[🟢 Low Risk]');
    });

    it('should show medium risk indicator', () => {
      const input: ThinkingOperationData = {
        technique: 'po',
        problem: 'Test problem',
        currentStep: 2,
        totalSteps: 4,
        output: 'Test output',
        nextStepNeeded: true,
        risks: ['Risk 1', 'Risk 2'],
      };

      const output = formatter.formatOutput(
        'po',
        'Test problem',
        2,
        4,
        { name: 'Movement', focus: 'Extract ideas', emoji: '➡️' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      expect(output).toContain('[🟡 Medium Risk]');
    });

    it('should show high risk indicator', () => {
      const input: ThinkingOperationData = {
        technique: 'po',
        problem: 'Test problem',
        currentStep: 3,
        totalSteps: 4,
        output: 'Test output',
        nextStepNeeded: true,
        risks: ['Risk 1', 'Risk 2', 'Risk 3', 'Risk 4'],
      };

      const output = formatter.formatOutput(
        'po',
        'Test problem',
        3,
        4,
        { name: 'Verification', focus: 'Check feasibility', emoji: '✅' },
        { color: (s: string) => s, symbol: '⚠️' },
        input
      );

      expect(output).toContain('[🔴 High Risk]');
    });

    it('should show ruin risk indicator', () => {
      const input: ThinkingOperationData = {
        technique: 'po',
        problem: 'Test problem',
        currentStep: 3,
        totalSteps: 4,
        output: 'Test output',
        nextStepNeeded: true,
        risks: ['Risk 1', 'Risk 2', 'Risk 3', 'Risk 4', 'Risk 5'],
      };

      const output = formatter.formatOutput(
        'po',
        'Test problem',
        3,
        4,
        { name: 'Verification', focus: 'Check feasibility', emoji: '✅' },
        { color: (s: string) => s, symbol: '⚠️' },
        input
      );

      expect(output).toContain('[⚫ Ruin Risk]');
    });
  });

  describe('Flexibility Score Indicators', () => {
    it('should not show flexibility when above 0.4', () => {
      const input: ThinkingOperationData = {
        technique: 'scamper',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 8,
        output: 'Test output',
        nextStepNeeded: true,
        flexibilityScore: 0.7,
      };

      const output = formatter.formatOutput(
        'scamper',
        'Test problem',
        1,
        8,
        { name: 'Substitute', focus: 'Replace elements', emoji: '🔄' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      expect(output).not.toContain('Flexibility:');
    });

    it('should show caution indicator for flexibility 0.3-0.4', () => {
      const input: ThinkingOperationData = {
        technique: 'scamper',
        problem: 'Test problem',
        currentStep: 4,
        totalSteps: 8,
        output: 'Test output',
        nextStepNeeded: true,
        flexibilityScore: 0.35,
      };

      const output = formatter.formatOutput(
        'scamper',
        'Test problem',
        4,
        8,
        { name: 'Modify', focus: 'Change attributes', emoji: '✏️' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      expect(output).toContain('[🔶 Flexibility: 35%]');
    });

    it('should show warning indicator for flexibility 0.2-0.3', () => {
      const input: ThinkingOperationData = {
        technique: 'scamper',
        problem: 'Test problem',
        currentStep: 6,
        totalSteps: 8,
        output: 'Test output',
        nextStepNeeded: true,
        flexibilityScore: 0.25,
      };

      const output = formatter.formatOutput(
        'scamper',
        'Test problem',
        6,
        8,
        { name: 'Eliminate', focus: 'Remove elements', emoji: '❌' },
        { color: (s: string) => s, symbol: '⚠️' },
        input
      );

      expect(output).toContain('[⚠️  Flexibility: 25%]');
    });

    it('should show critical indicator for flexibility below 0.2', () => {
      const input: ThinkingOperationData = {
        technique: 'scamper',
        problem: 'Test problem',
        currentStep: 7,
        totalSteps: 8,
        output: 'Test output',
        nextStepNeeded: true,
        flexibilityScore: 0.15,
      };

      const output = formatter.formatOutput(
        'scamper',
        'Test problem',
        7,
        8,
        { name: 'Reverse', focus: 'Invert elements', emoji: '↩️' },
        { color: (s: string) => s, symbol: '⚠️' },
        input
      );

      expect(output).toContain('[⛔ Flexibility: 15%]');
    });
  });

  describe('Multiple Indicators', () => {
    it('should show all applicable indicators together', () => {
      const input: ThinkingOperationData = {
        technique: 'scamper',
        problem: 'Test problem',
        currentStep: 6,
        totalSteps: 8,
        output: 'Test output',
        nextStepNeeded: true,
        scamperAction: 'eliminate',
        flexibilityScore: 0.25,
        risks: ['Risk 1', 'Risk 2', 'Risk 3'],
      };

      const output = formatter.formatOutput(
        'scamper',
        'Test problem',
        6,
        8,
        { name: 'Eliminate', focus: 'Remove elements', emoji: '❌' },
        { color: (s: string) => s, symbol: '⚠️' },
        input
      );

      // Should show all three indicators
      expect(output).toContain('[❌ ELIMINATE]');
      expect(output).toContain('[🔴 High Risk]');
      expect(output).toContain('[⚠️  Flexibility: 25%]');
    });
  });

  describe('Environment Variable Control', () => {
    it('should not show indicators when disabled', () => {
      // Create formatter with indicators disabled
      process.env.SHOW_TECHNIQUE_INDICATORS = 'false';
      const disabledFormatter = new VisualFormatter();

      const input: ThinkingOperationData = {
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 3,
        totalSteps: 7,
        output: 'Test output',
        nextStepNeeded: true,
        flexibilityScore: 0.2,
        risks: ['Risk 1', 'Risk 2'],
      };

      const output = disabledFormatter.formatOutput(
        'six_hats',
        'Test problem',
        3,
        7,
        { name: 'Red Hat', focus: 'Emotions', emoji: '🔴' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      // Should not contain any indicators
      expect(output).not.toContain('[🔴 Red Hat]');
      expect(output).not.toContain('[🟡 Medium Risk]');
      expect(output).not.toContain('Flexibility:');
    });
  });

  describe('Complete Output Integration', () => {
    it('should display all elements in correct positions with proper formatting', () => {
      const input: ThinkingOperationData = {
        technique: 'scamper',
        problem: 'Improve user onboarding process',
        currentStep: 6,
        totalSteps: 8,
        output: 'Eliminating unnecessary steps from the onboarding flow',
        nextStepNeeded: true,
        scamperAction: 'eliminate',
        flexibilityScore: 0.25,
        risks: [
          'May confuse existing users',
          'Could reduce data collection',
          'Might skip important features',
        ],
      };

      const output = formatter.formatOutput(
        'scamper',
        'Improve user onboarding process',
        6,
        8,
        { name: 'Eliminate', focus: 'Remove unnecessary elements', emoji: '❌' },
        { color: (s: string) => s, symbol: '⚠️' },
        input
      );

      // Verify the complete structure
      const lines = output.split('\n');

      // Header border
      expect(lines[0]).toBe('┌' + '─'.repeat(78) + '┐');

      // Title line with technique and step
      expect(lines[1]).toContain('⚠️ 🔧 SCAMPER - Step 6/8');

      // Indicators line
      expect(lines[2]).toContain('[❌ ELIMINATE] [🔴 High Risk] [⚠️  Flexibility: 25%]');

      // Separator
      expect(lines[3]).toBe('├' + '─'.repeat(78) + '┤');

      // Problem line
      expect(lines[4]).toContain('Problem: Improve user onboarding process');

      // Another separator
      expect(lines[5]).toBe('├' + '─'.repeat(78) + '┤');

      // Step info
      expect(lines[6]).toContain('❌ Eliminate: Remove unnecessary elements');

      // Progress section separator
      expect(lines[7]).toBe('├' + '─'.repeat(78) + '┤');

      // Progress bar
      expect(lines[8]).toContain('Progress:');
      expect(lines[8]).toContain('75%'); // 6/8 = 75%

      // Verify risks section exists
      expect(output).toContain('⚠️  Risks Identified:');
      expect(output).toContain('1. May confuse existing users');
      expect(output).toContain('2. Could reduce data collection');
      expect(output).toContain('3. Might skip important features');

      // Footer
      expect(lines[lines.length - 1]).toBe('└' + '─'.repeat(78) + '┘');
    });

    it('should handle edge case with minimal indicators', () => {
      const input: ThinkingOperationData = {
        technique: 'po',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 4,
        output: 'Creating provocative statement',
        nextStepNeeded: true,
        risks: [],
      };

      const output = formatter.formatOutput(
        'po',
        'Test problem',
        1,
        4,
        { name: 'Provocation', focus: 'Create PO statement', emoji: '💥' },
        { color: (s: string) => s, symbol: '✨' },
        input
      );

      // Should only show risk indicator (no technique state for PO, no flexibility)
      expect(output).toContain('[🟢 Low Risk]');
      expect(output).not.toContain('[💥');
      expect(output).not.toContain('Flexibility:');
    });

    it('should handle all indicators for Disney Method', () => {
      const input: ThinkingOperationData = {
        technique: 'disney_method',
        problem: 'Design new product feature',
        currentStep: 3,
        totalSteps: 3,
        output: 'Critically evaluating the proposed feature',
        nextStepNeeded: false,
        disneyRole: 'critic',
        flexibilityScore: 0.15,
        risks: [
          'Technical complexity',
          'Budget constraints',
          'Timeline pressure',
          'User adoption',
          'Market competition',
        ],
        mitigations: ['Phased rollout', 'MVP approach', 'User testing'],
      };

      const output = formatter.formatOutput(
        'disney_method',
        'Design new product feature',
        3,
        3,
        { name: 'Critic', focus: 'Identify risks and gaps', emoji: '🔍' },
        { color: (s: string) => s, symbol: '⚠️' },
        input
      );

      // Verify all indicators are present
      expect(output).toContain('[🔍 Critic]');
      expect(output).toContain('[⚫ Ruin Risk]'); // 5 risks
      expect(output).toContain('[⛔ Flexibility: 15%]');

      // Verify risks and mitigations sections
      expect(output).toContain('⚠️  Risks Identified:');
      expect(output).toContain('✅ Mitigations:');
    });
  });
});
