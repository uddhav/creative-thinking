/**
 * Simple tests for Absorbing Barrier Early Warning System
 * Focus on basic functionality and integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AbsorbingBarrierEarlyWarning } from '../../../ergodicity/earlyWarning/warningSystem.js';
import { BarrierWarningLevel } from '../../../ergodicity/earlyWarning/types.js';
import type { PathMemory } from '../../../ergodicity/types.js';
import type { SessionData } from '../../../types/index.js';

describe('AbsorbingBarrierEarlyWarning - Basic Tests', () => {
  let warningSystem: AbsorbingBarrierEarlyWarning;
  let mockPathMemory: PathMemory;
  let mockSession: SessionData;

  beforeEach(() => {
    warningSystem = new AbsorbingBarrierEarlyWarning();

    mockPathMemory = {
      pathHistory: [],
      constraints: [],
      foreclosedOptions: [],
      availableOptions: [],
      currentFlexibility: {
        flexibilityScore: 0.7,
        reversibilityIndex: 0.7,
        pathDivergence: 0.3,
        barrierProximity: [],
        optionVelocity: 0.5,
        commitmentDepth: 0.3,
      },
      absorbingBarriers: [],
      criticalDecisions: [],
      escapeRoutes: [],
    };

    mockSession = {
      id: 'test-session',
      technique: 'six_hats',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 6,
      history: [],
      branches: {},
      insights: [],
      lastActivityTime: Date.now(),
    };
  });

  describe('Basic functionality', () => {
    it('should create warning system instance', () => {
      expect(warningSystem).toBeDefined();
      expect(warningSystem).toBeInstanceOf(AbsorbingBarrierEarlyWarning);
    });

    it('should run continuous monitoring', async () => {
      const result = await warningSystem.continuousMonitoring(mockPathMemory, mockSession);

      expect(result).toBeDefined();
      expect(result.overallRisk).toBeDefined();
      expect(result.activeWarnings).toBeInstanceOf(Array);
      expect(result.sensorReadings).toBeInstanceOf(Map);
    });

    it('should return SAFE risk level when no barriers present', async () => {
      const result = await warningSystem.continuousMonitoring(mockPathMemory, mockSession);

      expect(result.overallRisk).toBe(BarrierWarningLevel.SAFE);
      expect(result.activeWarnings).toHaveLength(0);
      expect(result.compoundRisk).toBe(false);
    });

    it('should handle barriers with different types', async () => {
      mockPathMemory.absorbingBarriers = [
        {
          id: 'resource-barrier',
          type: 'creative',
          subtype: 'resource_depletion',
          name: 'Budget Limit',
          description: 'Budget limit',
          proximity: 0.6,
          impact: 'difficult',
          warningThreshold: 0.5,
          avoidanceStrategies: ['Reduce scope', 'Find funding'],
          indicators: ['High burn rate'],
        },
        {
          id: 'time-barrier',
          type: 'critical',
          subtype: 'analysis_paralysis',
          name: 'Deadline',
          description: 'Time limit approaching',
          proximity: 0.4,
          impact: 'irreversible',
          warningThreshold: 0.3,
          avoidanceStrategies: ['Accelerate', 'Simplify'],
          indicators: ['Time running out'],
        },
      ];

      const result = await warningSystem.continuousMonitoring(mockPathMemory, mockSession);

      expect(result).toBeDefined();
      expect(result.sensorReadings.size).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should accept configuration options', () => {
      const configuredSystem = new AbsorbingBarrierEarlyWarning({
        maxHistorySize: 50,
        historyTTL: 3600000,
        measurementThrottleMs: 5000,
      });

      expect(configuredSystem).toBeDefined();
    });

    it('should handle error callback configuration', async () => {
      const errorHandler = vi.fn();
      const systemWithErrorHandler = new AbsorbingBarrierEarlyWarning({
        onError: errorHandler,
      });

      // Run monitoring (errors might occur internally)
      await systemWithErrorHandler.continuousMonitoring(mockPathMemory, mockSession);

      // Error handler exists and can be called
      expect(systemWithErrorHandler).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty path memory', async () => {
      const emptyMemory: PathMemory = {
        pathHistory: [],
        constraints: [],
        foreclosedOptions: [],
        availableOptions: [],
        currentFlexibility: {
          flexibilityScore: 0,
          reversibilityIndex: 0,
          pathDivergence: 0,
          barrierProximity: [],
          optionVelocity: 0,
          commitmentDepth: 1,
        },
        absorbingBarriers: [],
        criticalDecisions: [],
        escapeRoutes: [],
      };

      const result = await warningSystem.continuousMonitoring(emptyMemory, mockSession);

      expect(result).toBeDefined();
      expect(result.overallRisk).toBe(BarrierWarningLevel.SAFE);
    });

    it('should handle session with no history', async () => {
      const minimalSession: SessionData = {
        id: 'minimal',
        technique: 'po',
        problem: 'Test',
        currentStep: 0,
        totalSteps: 4,
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
      };

      const result = await warningSystem.continuousMonitoring(mockPathMemory, minimalSession);

      expect(result).toBeDefined();
    });
  });
});
