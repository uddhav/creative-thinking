/**
 * Basic tests for the Absorbing Barrier Early Warning System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErgodicityManager } from '../src/ergodicity/index.js';
import { BarrierWarningLevel } from '../src/ergodicity/earlyWarning/types.js';
import type { SessionData, LateralTechnique } from '../src/index.js';

describe('Early Warning System', () => {
  let ergodicityManager: ErgodicityManager;
  let sessionData: SessionData;

  beforeEach(() => {
    ergodicityManager = new ErgodicityManager();
    // Add some initial history to avoid "limited perspective" warnings
    const initialHistory = [];
    for (let i = 0; i < 5; i++) {
      initialHistory.push({
        technique: ['six_hats', 'po', 'random_entry'][i % 3] as LateralTechnique,
        problem: 'Test problem',
        currentStep: i + 1,
        totalSteps: 10,
        output: `Initial step ${i + 1} with varied approach`,
        nextStepNeeded: true,
        timestamp: new Date(Date.now() - (5 - i) * 60000).toISOString(),
        hatColor: i % 2 === 0 ? 'blue' : 'white',
      });
    }

    sessionData = {
      technique: 'six_hats',
      problem: 'Test problem',
      history: initialHistory,
      branches: {},
      insights: ['Initial insight 1', 'Initial insight 2'],
      startTime: Date.now() - 5 * 60000, // 5 minutes ago
    };
  });

  describe('Basic functionality', () => {
    it('should initialize without warnings', async () => {
      // First, record some initial steps to populate path memory
      for (let i = 0; i < 5; i++) {
        await ergodicityManager.recordThinkingStep(
          sessionData.history[i].technique,
          i + 1,
          sessionData.history[i].output,
          {
            optionsOpened: ['opt1', 'opt2'],
            optionsClosed: [],
            reversibilityCost: 0.2,
            commitmentLevel: 0.3,
          }
        );
      }

      const result = await ergodicityManager.recordThinkingStep(
        'six_hats',
        6,
        'New test step with good flexibility',
        {
          optionsOpened: ['option1', 'option2', 'option3'],
          optionsClosed: [],
          reversibilityCost: 0.1,
          commitmentLevel: 0.2,
        },
        sessionData
      );

      expect(result.earlyWarningState).toBeDefined();
      expect(result.earlyWarningState?.overallRisk).toBe(BarrierWarningLevel.SAFE);
      expect(result.earlyWarningState?.activeWarnings).toHaveLength(0);
    });

    it('should detect resource depletion with long sessions', async () => {
      // Simulate a long session
      sessionData.startTime = Date.now() - 4 * 60 * 60 * 1000; // 4 hours ago

      // Add many steps to history
      for (let i = 0; i < 60; i++) {
        sessionData.history.push({
          technique: 'six_hats',
          problem: 'Test problem',
          currentStep: i + 1,
          totalSteps: 100,
          output: `Step ${i + 1} output`,
          nextStepNeeded: true,
          timestamp: new Date(Date.now() - (60 - i) * 60000).toISOString(),
        });
      }

      // Record many high-commitment steps to simulate fatigue
      for (let i = 0; i < 10; i++) {
        await ergodicityManager.recordThinkingStep(
          'six_hats',
          51 + i,
          'Fatigued decision making',
          {
            optionsOpened: [], // No new options - sign of fatigue
            optionsClosed: ['opt1', 'opt2'], // Closing options
            reversibilityCost: 0.8, // High commitment when tired
            commitmentLevel: 0.9,
          },
          sessionData
        );
      }

      const result = await ergodicityManager.recordThinkingStep(
        'six_hats',
        61,
        'Long session step',
        {
          optionsOpened: [],
          optionsClosed: ['option1'],
          reversibilityCost: 0.3,
          commitmentLevel: 0.8,
        },
        sessionData
      );

      expect(result.earlyWarningState).toBeDefined();
      expect(result.earlyWarningState?.activeWarnings.length).toBeGreaterThan(0);

      const resourceWarning = result.earlyWarningState?.activeWarnings.find(
        w => w.sensor === 'resource'
      );
      expect(resourceWarning).toBeDefined();
    });

    it('should detect cognitive lock-in patterns', async () => {
      // Simulate repetitive thinking patterns
      for (let i = 0; i < 15; i++) {
        await ergodicityManager.recordThinkingStep(
          'six_hats',
          i + 1,
          'Same approach again', // Repetitive output
          {
            optionsOpened: [],
            optionsClosed: ['option1', 'option2'],
            reversibilityCost: 0.8,
            commitmentLevel: 0.9,
          },
          sessionData
        );

        sessionData.history.push({
          technique: 'six_hats',
          problem: 'Test problem',
          currentStep: i + 1,
          totalSteps: 20,
          output: 'Same approach again',
          nextStepNeeded: true,
          timestamp: new Date().toISOString(),
        });
      }

      const result = await ergodicityManager.getEarlyWarningState(sessionData);

      expect(result).toBeDefined();
      const cognitiveWarning = result?.activeWarnings.find(w => w.sensor === 'cognitive');
      expect(cognitiveWarning).toBeDefined();
      expect(cognitiveWarning?.reading.indicators).toContain('Repetitive thinking patterns');
    });

    it('should recommend escape protocols for critical warnings', async () => {
      // Create conditions for critical warning
      for (let i = 0; i < 20; i++) {
        await ergodicityManager.recordThinkingStep(
          'scamper',
          i + 1,
          `High commitment decision ${i}`,
          {
            optionsOpened: [],
            optionsClosed: ['opt1', 'opt2', 'opt3'],
            reversibilityCost: 0.9,
            commitmentLevel: 0.95,
          },
          sessionData
        );
      }

      const result = await ergodicityManager.recordThinkingStep(
        'scamper',
        21,
        'Another high commitment',
        {
          optionsOpened: [],
          optionsClosed: ['final_option'],
          reversibilityCost: 0.95,
          commitmentLevel: 0.98,
        },
        sessionData
      );

      expect(result.escapeRecommendation).toBeDefined();
      expect(result.escapeRecommendation?.name).toBe('Pattern Interruption');
      expect(result.earlyWarningState?.recommendedAction).toBe('escape');
    });
  });

  describe('Sensor integration', () => {
    it('should track technical debt accumulation', async () => {
      // Simulate quick fixes and high coupling
      for (let i = 0; i < 10; i++) {
        await ergodicityManager.recordThinkingStep(
          'yes_and',
          i + 1,
          `Quick fix for issue ${i}`,
          {
            optionsOpened: [],
            optionsClosed: ['opt1', 'opt2', 'opt3', 'opt4'], // High coupling
            reversibilityCost: 0.7,
            commitmentLevel: 0.8,
          },
          sessionData
        );
      }

      const result = await ergodicityManager.getEarlyWarningState(sessionData);
      const debtWarning = result?.activeWarnings.find(w => w.sensor === 'technical_debt');

      expect(debtWarning).toBeDefined();
      expect(debtWarning?.reading.indicators).toContain('High interdependency detected');
    });
  });

  describe('Response protocols', () => {
    it('should provide available escape protocols', () => {
      const protocols = ergodicityManager.getAvailableEscapeProtocols();

      expect(protocols).toHaveLength(5);
      expect(protocols[0].name).toBe('Pattern Interruption');
      expect(protocols[4].name).toBe('Strategic Pivot');
    });

    it('should execute escape protocol', async () => {
      const protocols = ergodicityManager.getAvailableEscapeProtocols();
      const patternInterruption = protocols[0];

      const response = await ergodicityManager.executeEscapeProtocol(
        patternInterruption,
        sessionData,
        false // No user confirmation needed for test
      );

      expect(response.protocol.name).toBe('Pattern Interruption');
      expect(response.flexibilityBefore).toBeDefined();
      expect(response.flexibilityAfter).toBeDefined();
    });
  });

  describe('Warning history', () => {
    it('should track warning history across session', async () => {
      sessionData.history[0] = {
        technique: 'six_hats',
        problem: 'Test',
        currentStep: 1,
        totalSteps: 10,
        output: 'Initial',
        nextStepNeeded: true,
        timestamp: new Date().toISOString(),
        sessionId: 'test-session-123',
      };

      // Generate some warnings
      for (let i = 0; i < 5; i++) {
        await ergodicityManager.recordThinkingStep(
          'six_hats',
          i + 1,
          'Test step',
          {
            optionsOpened: [],
            optionsClosed: ['opt1'],
            reversibilityCost: 0.7,
            commitmentLevel: 0.8,
          },
          sessionData
        );
      }

      const history = ergodicityManager.getWarningHistory('test-session-123');
      expect(history).toBeDefined();
      expect(history.length).toBeGreaterThan(0);
    });
  });
});
