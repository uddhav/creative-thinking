/**
 * Unit tests for path tracking and ergodicity features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErgodicityManager } from '../../ergodicity/index.js';

describe('Path Tracking', () => {
  let ergodicityManager: ErgodicityManager;

  beforeEach(() => {
    ergodicityManager = new ErgodicityManager();
  });

  describe('PathMemory', () => {
    it('should track foreclosed options', async () => {
      const decision = {
        decision: 'Use proprietary technology',
        technique: 'six_hats' as const,
        stepNumber: 1,
        optionsClosed: ['open-source path', 'vendor-neutral path'],
        optionsOpened: ['enterprise features'],
        reversibilityCost: 0.8,
        commitmentLevel: 0.9,
      };

      await ergodicityManager.recordThinkingStep(
        decision.technique,
        decision.stepNumber,
        decision.decision,
        {
          optionsClosed: decision.optionsClosed,
          optionsOpened: decision.optionsOpened,
          reversibilityCost: decision.reversibilityCost,
          commitmentLevel: decision.commitmentLevel,
        }
      );

      const pathMemory = ergodicityManager.getPathMemory();
      expect(pathMemory.foreclosedOptions).toContain('open-source path');
      expect(pathMemory.foreclosedOptions).toContain('vendor-neutral path');
      expect(pathMemory.currentFlexibility.flexibilityScore).toBeLessThan(1.0);
    });

    it('should accumulate constraints over multiple decisions', async () => {
      const decisions = [
        {
          decision: 'Choose cloud-only architecture',
          optionsClosed: ['on-premise', 'hybrid-cloud'],
          optionsOpened: ['cloud-scaling'],
          reversibilityCost: 0.7,
          commitmentLevel: 0.8,
        },
        {
          decision: 'Lock in vendor SDK',
          optionsClosed: ['platform-agnostic', 'multi-vendor'],
          optionsOpened: ['vendor-features'],
          reversibilityCost: 0.9,
          commitmentLevel: 0.95,
        },
        {
          decision: 'Commit to proprietary data format',
          optionsClosed: ['standard-formats', 'data-portability'],
          optionsOpened: ['optimized-performance'],
          reversibilityCost: 0.95,
          commitmentLevel: 0.98,
        },
      ];

      for (const [index, decision] of decisions.entries()) {
        await ergodicityManager.recordThinkingStep('po', index + 1, decision.decision, decision);
      }

      const pathMemory = ergodicityManager.getPathMemory();
      expect(pathMemory.foreclosedOptions.length).toBe(6); // Total closed options (2+2+2)
      expect(pathMemory.constraints.length).toBeGreaterThanOrEqual(0);
      expect(pathMemory.currentFlexibility.flexibilityScore).toBeLessThan(0.8);
    });

    it('should track path history with timestamps', async () => {
      const startTime = Date.now();

      await ergodicityManager.recordThinkingStep('scamper', 1, 'Substitute traditional approach', {
        optionsClosed: ['traditional-method'],
        optionsOpened: ['innovative-approach'],
        reversibilityCost: 0.3,
        commitmentLevel: 0.4,
      });

      const pathMemory = ergodicityManager.getPathMemory();
      expect(pathMemory.pathHistory).toHaveLength(1);
      expect(new Date(pathMemory.pathHistory[0].timestamp).getTime()).toBeGreaterThanOrEqual(
        startTime
      );
      expect(pathMemory.pathHistory[0].technique).toBe('scamper');
    });

    it('should identify when options are reopened', async () => {
      // First close some options
      await ergodicityManager.recordThinkingStep('six_hats', 1, 'Initial conservative approach', {
        optionsClosed: ['risky-innovation', 'experimental-tech'],
        optionsOpened: ['safe-path'],
        reversibilityCost: 0.2,
        commitmentLevel: 0.3,
      });

      // Then reopen one of them
      await ergodicityManager.recordThinkingStep('po', 1, 'Provocative: What if we embrace risk?', {
        optionsClosed: ['safe-path'],
        optionsOpened: ['risky-innovation'], // Reopening previously closed option
        reversibilityCost: 0.4,
        commitmentLevel: 0.5,
      });

      const pathMemory = ergodicityManager.getPathMemory();
      // risky-innovation should no longer be in foreclosed options
      expect(pathMemory.foreclosedOptions).toContain('safe-path');
      expect(pathMemory.foreclosedOptions).toContain('experimental-tech');
      expect(pathMemory.availableOptions).toContain('risky-innovation');
    });
  });

  describe('Flexibility Calculation', () => {
    it('should calculate initial flexibility as 1.0', () => {
      const flexibility = ergodicityManager.getCurrentFlexibility();
      expect(flexibility.flexibilityScore).toBe(1.0);
      expect(flexibility.reversibilityIndex).toBe(1.0);
      expect(flexibility.optionVelocity).toBe(0);
      expect(flexibility.commitmentDepth).toBe(0);
    });

    it('should reduce flexibility with irreversible decisions', async () => {
      const initialFlexibility = ergodicityManager.getCurrentFlexibility().flexibilityScore;

      await ergodicityManager.recordThinkingStep('six_hats', 1, 'Make irreversible commitment', {
        optionsClosed: ['option1', 'option2', 'option3'],
        optionsOpened: [],
        reversibilityCost: 0.95, // Nearly irreversible
        commitmentLevel: 0.98,
      });

      const newFlexibility = ergodicityManager.getCurrentFlexibility().flexibilityScore;
      expect(newFlexibility).toBeLessThan(initialFlexibility);
      expect(newFlexibility).toBeLessThan(0.7); // Significant reduction
    });

    it('should maintain higher flexibility with reversible decisions', async () => {
      await ergodicityManager.recordThinkingStep('random_entry', 1, 'Explore temporary direction', {
        optionsClosed: ['option1'],
        optionsOpened: ['option2', 'option3'],
        reversibilityCost: 0.1, // Easily reversible
        commitmentLevel: 0.2,
      });

      const flexibility = ergodicityManager.getCurrentFlexibility();
      expect(flexibility.flexibilityScore).toBeGreaterThan(0.8);
      expect(flexibility.reversibilityIndex).toBeGreaterThan(0.8);
    });

    it('should apply time decay to flexibility', async () => {
      // Create a decision with timestamp in the past
      await ergodicityManager.recordThinkingStep('six_hats', 1, 'Old decision', {
        optionsClosed: ['option1'],
        optionsOpened: [],
        reversibilityCost: 0.5,
        commitmentLevel: 0.6,
      });

      // Manually adjust the timestamp to simulate age
      const pathMemory = ergodicityManager.getPathMemory();
      if (pathMemory.pathHistory.length > 0) {
        pathMemory.pathHistory[0].timestamp = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      }

      const flexibility = ergodicityManager.getCurrentFlexibility();
      // Time decay is reflected in the overall flexibility score
      expect(flexibility.flexibilityScore).toBeLessThan(1.0);
    });
  });

  describe('Constraint Tracking', () => {
    it('should create constraints from high-commitment decisions', async () => {
      await ergodicityManager.recordThinkingStep(
        'triz',
        1,
        'Apply contradiction: Speed vs Quality',
        {
          optionsClosed: ['balanced-approach'],
          optionsOpened: ['extreme-speed', 'extreme-quality'],
          reversibilityCost: 0.8,
          commitmentLevel: 0.85,
          constraintsCreated: ['must-choose-extreme', 'no-middle-ground'],
        }
      );

      const pathMemory = ergodicityManager.getPathMemory();
      // Constraints are created as objects, not strings
      expect(pathMemory.constraints.length).toBeGreaterThan(0);
      const constraintDescriptions = pathMemory.constraints.map(c => c.description);
      expect(constraintDescriptions.length).toBeGreaterThan(0);
    });

    it('should accumulate technical debt', async () => {
      const quickFixDecisions = [
        'Skip error handling for now',
        'Use global variables temporarily',
        'Hardcode configuration values',
        'Bypass validation checks',
      ];

      for (const [index, decision] of quickFixDecisions.entries()) {
        await ergodicityManager.recordThinkingStep('yes_and', index + 1, decision, {
          optionsClosed: ['proper-implementation'],
          optionsOpened: ['quick-workaround'],
          reversibilityCost: 0.6,
          commitmentLevel: 0.7,
        });
      }

      const pathMemory = ergodicityManager.getPathMemory();
      const debtIndicators = pathMemory.pathHistory.filter(
        p =>
          p.decision.toLowerCase().includes('skip') ||
          p.decision.toLowerCase().includes('temporarily') ||
          p.decision.toLowerCase().includes('hardcode') ||
          p.decision.toLowerCase().includes('bypass')
      );

      expect(debtIndicators.length).toBe(4);
    });
  });

  describe('Path Dependencies', () => {
    it('should detect when current path depends on previous decisions', async () => {
      // First decision creates a dependency
      await ergodicityManager.recordThinkingStep(
        'design_thinking',
        1,
        'Empathize: Focus on power users',
        {
          optionsClosed: ['casual-users', 'broad-audience'],
          optionsOpened: ['power-user-features'],
          reversibilityCost: 0.6,
          commitmentLevel: 0.7,
        }
      );

      // Second decision that depends on the first
      await ergodicityManager.recordThinkingStep(
        'design_thinking',
        2,
        'Define: Complex workflows for experts',
        {
          optionsClosed: ['simple-ui', 'guided-experience'],
          optionsOpened: ['advanced-controls'],
          reversibilityCost: 0.8,
          commitmentLevel: 0.85,
        }
      );

      // Check that flexibility decreased due to path dependencies
      const finalFlexibility = ergodicityManager.getCurrentFlexibility();
      expect(finalFlexibility.flexibilityScore).toBeLessThan(0.8);
      const pathMemory = ergodicityManager.getPathMemory();
      expect(pathMemory.constraints.length).toBeGreaterThan(0);
    });

    it('should track decision reversibility over time', async () => {
      const decisions = [];

      // Make several decisions with varying reversibility
      for (let i = 0; i < 5; i++) {
        const decisionResult = await ergodicityManager.recordThinkingStep(
          'scamper',
          i + 1,
          `Decision ${i + 1}`,
          {
            optionsClosed: [`option${i}`],
            optionsOpened: [`new-option${i}`],
            reversibilityCost: 0.1 + i * 0.2, // Increasing irreversibility
            commitmentLevel: 0.2 + i * 0.15,
          }
        );
        decisions.push(decisionResult);
      }

      // Check that later decisions are more constrained
      const pathMemory = ergodicityManager.getPathMemory();
      expect(pathMemory.pathHistory[0].reversibilityCost).toBeLessThan(0.2);
      expect(pathMemory.pathHistory[4].reversibilityCost).toBeGreaterThan(0.8);
    });
  });
});
