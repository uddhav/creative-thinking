/**
 * Unit tests for flexibility scoring system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErgodicityManager } from '../../ergodicity/index.js';

describe('Flexibility Scoring', () => {
  let ergodicityManager: ErgodicityManager;

  beforeEach(() => {
    ergodicityManager = new ErgodicityManager();
  });

  describe('Basic Calculations', () => {
    it('should return 1.0 for initial state with no decisions', () => {
      const flexibility = ergodicityManager.getCurrentFlexibility();
      expect(flexibility.flexibilityScore).toBe(1.0);
    });

    it('should reduce score when options are foreclosed', async () => {
      await ergodicityManager.recordThinkingStep('six_hats', 1, 'Choose specialized path', {
        optionsClosed: ['general-path', 'hybrid-path'],
        optionsOpened: ['specialized-feature'],
        reversibilityCost: 0.7,
        commitmentLevel: 0.8,
      });

      const flexibility = ergodicityManager.getCurrentFlexibility();
      expect(flexibility.flexibilityScore).toBeLessThan(1.0);
      expect(flexibility.flexibilityScore).toBeGreaterThan(0.0);
    });

    it('should heavily penalize when many options are closed', async () => {
      await ergodicityManager.recordThinkingStep('triz', 1, 'Final irreversible choice', {
        optionsClosed: ['option1', 'option2', 'option3', 'option4', 'option5'],
        optionsOpened: [],
        reversibilityCost: 0.99,
        commitmentLevel: 0.99,
      });

      const flexibility = ergodicityManager.getCurrentFlexibility();
      expect(flexibility.flexibilityScore).toBeLessThan(0.6);
    });
  });

  describe('Reversibility Impact', () => {
    it('should maintain higher flexibility with reversible decisions', async () => {
      await ergodicityManager.recordThinkingStep('po', 1, 'Easily reversible exploration', {
        optionsClosed: ['option1'],
        optionsOpened: ['option2', 'option3'],
        reversibilityCost: 0.1,
        commitmentLevel: 0.2,
      });

      const flexibility = ergodicityManager.getCurrentFlexibility();
      expect(flexibility.flexibilityScore).toBeGreaterThan(0.8);
    });

    it('should reduce flexibility more with irreversible decisions', async () => {
      // First make a reversible decision
      await ergodicityManager.recordThinkingStep('random_entry', 1, 'Reversible exploration', {
        optionsClosed: ['option1'],
        optionsOpened: ['option2'],
        reversibilityCost: 0.2,
        commitmentLevel: 0.3,
      });

      const flexAfterReversible = ergodicityManager.getCurrentFlexibility().flexibilityScore;

      // Reset and make irreversible decision
      ergodicityManager = new ErgodicityManager();

      await ergodicityManager.recordThinkingStep('triz', 1, 'Irreversible commitment', {
        optionsClosed: ['option1'],
        optionsOpened: ['option2'],
        reversibilityCost: 0.9,
        commitmentLevel: 0.95,
      });

      const flexAfterIrreversible = ergodicityManager.getCurrentFlexibility().flexibilityScore;
      expect(flexAfterIrreversible).toBeLessThan(flexAfterReversible);
    });
  });

  describe('Cumulative Effects', () => {
    it('should accumulate flexibility loss over multiple decisions', async () => {
      const flexibilityScores: number[] = [];

      // Record initial flexibility
      flexibilityScores.push(ergodicityManager.getCurrentFlexibility().flexibilityScore);

      // Make several decisions that close options
      for (let i = 0; i < 5; i++) {
        await ergodicityManager.recordThinkingStep('scamper', i + 1, `Decision ${i + 1}`, {
          optionsClosed: [`option${i}1`, `option${i}2`],
          optionsOpened: i < 2 ? [`new${i}`] : [], // Stop creating new options after 2
          reversibilityCost: 0.5 + i * 0.1, // Increasing irreversibility
          commitmentLevel: 0.6 + i * 0.08,
        });
        flexibilityScores.push(ergodicityManager.getCurrentFlexibility().flexibilityScore);
      }

      // Flexibility should decrease over time
      for (let i = 1; i < flexibilityScores.length; i++) {
        expect(flexibilityScores[i]).toBeLessThan(flexibilityScores[i - 1]);
      }

      // Final flexibility should be significantly lower
      expect(flexibilityScores[flexibilityScores.length - 1]).toBeLessThan(0.5);
    });
  });

  describe('Option Balance', () => {
    it('should increase flexibility when opening more options than closing', async () => {
      await ergodicityManager.recordThinkingStep('po', 1, 'Provocative expansion', {
        optionsClosed: ['conventional-approach'],
        optionsOpened: ['radical-idea-1', 'radical-idea-2', 'radical-idea-3'],
        reversibilityCost: 0.2,
        commitmentLevel: 0.3,
      });

      const flexibility = ergodicityManager.getCurrentFlexibility();
      expect(flexibility.flexibilityScore).toBeGreaterThan(0.8);
    });

    it('should detect when reopening previously closed options', async () => {
      // Close an option
      await ergodicityManager.recordThinkingStep('six_hats', 1, 'Initial conservative choice', {
        optionsClosed: ['innovative-approach'],
        optionsOpened: ['safe-path'],
        reversibilityCost: 0.3,
        commitmentLevel: 0.4,
      });

      const flexAfterClosing = ergodicityManager.getCurrentFlexibility().flexibilityScore;

      // Reopen the closed option
      await ergodicityManager.recordThinkingStep('po', 1, 'Actually, lets reconsider innovation', {
        optionsClosed: [],
        optionsOpened: ['innovative-approach'], // Reopening
        reversibilityCost: 0.2,
        commitmentLevel: 0.3,
      });

      const flexAfterReopening = ergodicityManager.getCurrentFlexibility().flexibilityScore;
      expect(flexAfterReopening).toBeGreaterThan(flexAfterClosing);
    });
  });

  describe('Constraint Impact', () => {
    it('should reduce flexibility when constraints are added', async () => {
      await ergodicityManager.recordThinkingStep('triz', 1, 'Apply contradiction principle', {
        optionsClosed: ['middle-ground'],
        optionsOpened: ['extreme-a', 'extreme-b'],
        reversibilityCost: 0.7,
        commitmentLevel: 0.8,
        constraintsCreated: ['must-choose-extreme', 'no-compromise'],
      });

      const flexibility = ergodicityManager.getCurrentFlexibility();
      expect(flexibility.flexibilityScore).toBeLessThan(0.9);
    });
  });

  describe('Early Warning Integration', () => {
    it('should trigger warnings at low flexibility', async () => {
      // Make decisions that drastically reduce flexibility
      for (let i = 0; i < 3; i++) {
        await ergodicityManager.recordThinkingStep('six_hats', i + 1, `Lock-in decision ${i}`, {
          optionsClosed: [`opt${i}1`, `opt${i}2`, `opt${i}3`],
          optionsOpened: [],
          reversibilityCost: 0.9,
          commitmentLevel: 0.95,
        });
      }

      const flexibility = ergodicityManager.getCurrentFlexibility();
      expect(flexibility.flexibilityScore).toBeLessThan(0.3);

      // Check if escape velocity is needed
      const escapeNeeded = ergodicityManager.isEscapeVelocityNeeded();
      expect(escapeNeeded).toBe(true);
    });
  });

  describe('Time Effects', () => {
    it('should maintain flexibility for recent decisions', async () => {
      await ergodicityManager.recordThinkingStep('scamper', 1, 'Recent decision', {
        optionsClosed: ['option1'],
        optionsOpened: ['option2'],
        reversibilityCost: 0.5,
        commitmentLevel: 0.6,
      });

      const flexibility = ergodicityManager.getCurrentFlexibility();
      // Recent decisions should not have time decay affecting them significantly
      expect(flexibility.flexibilityScore).toBeGreaterThan(0.6);
    });
  });
});
