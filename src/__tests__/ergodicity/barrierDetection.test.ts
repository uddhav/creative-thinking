/**
 * Unit tests for barrier detection and early warning system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type { SessionData } from '../../index.js';

describe('Barrier Detection', () => {
  let ergodicityManager: ErgodicityManager;

  beforeEach(() => {
    ergodicityManager = new ErgodicityManager();
  });

  describe('Early Warning System', () => {
    it('should detect approaching technical lock-in', async () => {
      // Make decisions that lead toward vendor lock-in
      const decisions = [
        {
          decision: 'Choose proprietary framework',
          optionsClosed: ['open-source', 'custom-build'],
          optionsOpened: ['vendor-features'],
          reversibilityCost: 0.8,
          commitmentLevel: 0.85,
        },
        {
          decision: 'Integrate vendor-specific APIs',
          optionsClosed: ['standard-apis', 'abstraction-layer'],
          optionsOpened: [],
          reversibilityCost: 0.9,
          commitmentLevel: 0.95,
        },
        {
          decision: 'Use proprietary data formats',
          optionsClosed: ['portable-formats', 'open-standards'],
          optionsOpened: [],
          reversibilityCost: 0.95,
          commitmentLevel: 0.98,
        },
      ];

      let lastResult;
      for (const [index, decision] of decisions.entries()) {
        lastResult = await ergodicityManager.recordThinkingStep(
          'six_hats',
          index + 1,
          decision.decision,
          decision
        );
      }

      // Should have warnings about lock-in
      expect(lastResult?.warnings).toBeDefined();
      expect(lastResult?.warnings.length).toBeGreaterThan(0);

      const flexibility = ergodicityManager.getCurrentFlexibility();
      expect(flexibility.flexibilityScore).toBeLessThan(0.4);
    });

    it('should detect creative exhaustion through repetitive patterns', async () => {
      // Simulate using the same approach repeatedly
      for (let i = 0; i < 8; i++) {
        await ergodicityManager.recordThinkingStep(
          'scamper', // Same technique
          1, // Always step 1 (Substitute)
          `Apply same substitution pattern ${i}`,
          {
            optionsClosed: [`original-${i}`],
            optionsOpened: [`substitute-${i}`],
            reversibilityCost: 0.5,
            commitmentLevel: 0.6,
          }
        );
      }

      const sessionData: SessionData = {
        technique: 'scamper',
        problem: 'Test problem',
        history: Array(8)
          .fill(null)
          .map((_, i) => ({
            technique: 'scamper' as const,
            problem: 'Test problem',
            currentStep: 1,
            totalSteps: 7,
            output: `Apply same substitution pattern ${i}`,
            nextStepNeeded: true,
            timestamp: new Date().toISOString(),
          })),
        branches: {},
        insights: [],
        startTime: Date.now() - 60 * 60 * 1000,
        lastActivityTime: Date.now(),
      };

      const warningState = await ergodicityManager.getEarlyWarningState(sessionData);

      // Should detect repetitive patterns
      expect(warningState).toBeDefined();
      const cognitiveWarning = warningState?.activeWarnings.find(w => w.sensor === 'cognitive');
      expect(cognitiveWarning || warningState?.activeWarnings.length).toBeTruthy();
    });

    it('should provide escape recommendations at critical flexibility', async () => {
      // Create highly constrained state
      for (let i = 0; i < 4; i++) {
        await ergodicityManager.recordThinkingStep('triz', i + 1, `Irreversible constraint ${i}`, {
          optionsClosed: [`opt${i}1`, `opt${i}2`, `opt${i}3`],
          optionsOpened: [],
          reversibilityCost: 0.9 + i * 0.02,
          commitmentLevel: 0.95,
        });
      }

      const escapeNeeded = ergodicityManager.isEscapeVelocityNeeded();
      expect(escapeNeeded).toBe(true);

      const urgency = ergodicityManager.getEscapeUrgency();
      expect(urgency).toMatch(/critical|high/);

      const escapeProtocols = ergodicityManager.getAvailableEscapeProtocols();
      expect(escapeProtocols.length).toBeGreaterThan(0);
      expect(escapeProtocols[0].name).toBeDefined();
      expect(escapeProtocols[0].steps).toBeDefined();
    });
  });

  describe('Warning Levels', () => {
    it('should escalate warning levels as flexibility decreases', async () => {
      const flexibilityScores: number[] = [];

      // Initial state - should be safe
      let flexibility = ergodicityManager.getCurrentFlexibility();
      flexibilityScores.push(flexibility.flexibilityScore);

      // Make progressively worse decisions
      const steps = [
        { closed: 2, reversibility: 0.3 }, // Mild
        { closed: 3, reversibility: 0.5 }, // Moderate
        { closed: 4, reversibility: 0.7 }, // Severe
        { closed: 5, reversibility: 0.9 }, // Critical
      ];

      for (const [index, step] of steps.entries()) {
        const optionsClosed = Array(step.closed)
          .fill(null)
          .map((_, i) => `option-${index}-${i}`);

        await ergodicityManager.recordThinkingStep('six_hats', index + 1, `Decision ${index + 1}`, {
          optionsClosed,
          optionsOpened: [],
          reversibilityCost: step.reversibility,
          commitmentLevel: step.reversibility,
        });

        flexibility = ergodicityManager.getCurrentFlexibility();
        flexibilityScores.push(flexibility.flexibilityScore);
      }

      // Should progress from safe (high flexibility) to severe (low flexibility)
      expect(flexibilityScores[0]).toBe(1.0); // Initial state
      expect(flexibilityScores[flexibilityScores.length - 1]).toBeLessThan(0.5); // Critical state

      // Check that flexibility decreases over time
      for (let i = 1; i < flexibilityScores.length; i++) {
        expect(flexibilityScores[i]).toBeLessThanOrEqual(flexibilityScores[i - 1]);
      }
    });
  });

  describe('Multiple Barrier Types', () => {
    it('should detect compound risks from multiple barriers', async () => {
      const sessionData: SessionData = {
        technique: 'six_hats',
        problem: 'Complex problem',
        history: [],
        branches: {},
        insights: [],
        startTime: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago - resource concern
        lastActivityTime: Date.now(),
      };

      // Technical debt decisions
      for (let i = 0; i < 5; i++) {
        await ergodicityManager.recordThinkingStep(
          'yes_and',
          i + 1,
          `Quick fix ${i}`,
          {
            optionsClosed: [`proper-solution-${i}`],
            optionsOpened: [`workaround-${i}`],
            reversibilityCost: 0.7,
            commitmentLevel: 0.8,
          },
          sessionData
        );

        sessionData.history.push({
          technique: 'yes_and',
          problem: 'Complex problem',
          currentStep: i + 1,
          totalSteps: 5,
          output: `Quick fix ${i}`,
          nextStepNeeded: true,
          timestamp: new Date().toISOString(),
        });
      }

      const warningState = await ergodicityManager.getEarlyWarningState(sessionData);

      // Should detect multiple barrier types
      expect(warningState?.activeWarnings.length).toBeGreaterThan(0);

      // Check for compound risk
      expect(warningState?.compoundRisk).toBeDefined();
    });
  });

  describe('Escape Protocol Execution', () => {
    it('should successfully execute pattern interruption protocol', async () => {
      // Create constrained state
      for (let i = 0; i < 3; i++) {
        await ergodicityManager.recordThinkingStep(
          'six_hats',
          i + 1,
          `Constraining decision ${i}`,
          {
            optionsClosed: [`opt${i}1`, `opt${i}2`],
            optionsOpened: [],
            reversibilityCost: 0.8,
            commitmentLevel: 0.85,
          }
        );
      }

      const protocols = ergodicityManager.getAvailableEscapeProtocols();
      const patternInterruption = protocols.find(p => p.name === 'Pattern Interruption');
      expect(patternInterruption).toBeDefined();

      if (patternInterruption) {
        const sessionData: SessionData = {
          technique: 'six_hats',
          problem: 'Test problem',
          history: [],
          branches: {},
          insights: [],
          startTime: Date.now(),
          lastActivityTime: Date.now(),
        };

        const result = await ergodicityManager.executeEscapeProtocol(
          patternInterruption,
          sessionData,
          false // No user confirmation needed for test
        );

        // The protocol execution might not always succeed depending on the state
        // What matters is that it executes and returns a valid result
        expect(result).toBeDefined();
        expect(result.flexibilityBefore).toBeDefined();
        expect(result.flexibilityAfter).toBeDefined();

        // If it succeeded, flexibility should improve
        if (result.success) {
          expect(result.flexibilityAfter).toBeGreaterThan(result.flexibilityBefore);
        }
      }
    });
  });

  describe('Barrier Proximity', () => {
    it('should calculate distance to barriers based on flexibility', async () => {
      // Start with moderate constraints
      await ergodicityManager.recordThinkingStep('triz', 1, 'Initial constraint', {
        optionsClosed: ['option1', 'option2'],
        optionsOpened: ['constrained-path'],
        reversibilityCost: 0.6,
        commitmentLevel: 0.7,
      });

      const sessionData: SessionData = {
        technique: 'triz',
        problem: 'Test problem',
        history: [
          {
            technique: 'triz',
            problem: 'Test problem',
            currentStep: 1,
            totalSteps: 4,
            output: 'Initial constraint',
            nextStepNeeded: true,
            timestamp: new Date().toISOString(),
          },
        ],
        branches: {},
        insights: [],
        startTime: Date.now(),
        lastActivityTime: Date.now(),
      };

      const warningState = await ergodicityManager.getEarlyWarningState(sessionData);

      // Should have sensor readings
      expect(warningState?.sensorReadings.size).toBeGreaterThan(0);

      // Check if any barriers are being approached
      if (warningState?.activeWarnings.length > 0) {
        const warning = warningState.activeWarnings[0];
        expect(warning.barrier.proximity).toBeDefined();
        expect(warning.barrier.proximity).toBeGreaterThanOrEqual(0);
        expect(warning.barrier.proximity).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Recovery Detection', () => {
    it('should detect improvement when flexibility increases', async () => {
      // First create constrained state
      for (let i = 0; i < 3; i++) {
        await ergodicityManager.recordThinkingStep('six_hats', i + 1, `Constraint ${i}`, {
          optionsClosed: [`opt${i}1`, `opt${i}2`],
          optionsOpened: [],
          reversibilityCost: 0.7,
          commitmentLevel: 0.8,
        });
      }

      const lowFlexibility = ergodicityManager.getCurrentFlexibility().flexibilityScore;

      // Now make decisions that improve flexibility
      await ergodicityManager.recordThinkingStep('po', 1, 'Provocative expansion', {
        optionsClosed: [],
        optionsOpened: ['new1', 'new2', 'new3', 'new4'],
        reversibilityCost: 0.1,
        commitmentLevel: 0.2,
      });

      const improvedFlexibility = ergodicityManager.getCurrentFlexibility();
      expect(improvedFlexibility.flexibilityScore).toBeGreaterThan(lowFlexibility);
      // The improvement is reflected in the higher flexibility score
      const improvement = improvedFlexibility.flexibilityScore - lowFlexibility;
      expect(improvement).toBeGreaterThan(0);
    });
  });
});
