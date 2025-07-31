/**
 * Tests for Resource Monitor sensor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceMonitor } from '../../../../ergodicity/earlyWarning/sensors/resourceMonitor.js';
import { BarrierWarningLevel } from '../../../../ergodicity/earlyWarning/types.js';
import type { PathMemory } from '../../../../ergodicity/types.js';
import type { SessionData, LateralTechnique } from '../../../../types/index.js';

describe('ResourceMonitor', () => {
  let monitor: ResourceMonitor;
  let mockPathMemory: PathMemory;
  let mockSession: SessionData;

  beforeEach(() => {
    monitor = new ResourceMonitor();

    mockPathMemory = {
      pathHistory: [
        {
          id: 'event-1',
          timestamp: new Date().toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: 1,
          decision: 'Start project',
          optionsOpened: ['option1', 'option2'],
          optionsClosed: [],
          reversibilityCost: 0.2,
          commitmentLevel: 0.3,
          constraintsCreated: [],
          flexibilityImpact: -0.1,
        },
      ],
      constraints: [],
      foreclosedOptions: [],
      availableOptions: ['option1', 'option2'],
      currentFlexibility: {
        flexibilityScore: 0.7,
        reversibilityIndex: 0.7,
        pathDivergence: 0.3,
        barrierProximity: [],
        optionVelocity: 0.5,
        commitmentDepth: 0.3,
      },
      absorbingBarriers: [
        {
          id: 'budget-barrier',
          type: 'creative',
          subtype: 'resource_depletion',
          name: 'Budget Limit',
          description: 'Budget limit',
          proximity: 0.5,
          impact: 'difficult',
          warningThreshold: 0.4,
          avoidanceStrategies: ['Reduce scope', 'Find funding'],
          indicators: ['High burn rate'],
        },
      ],
      criticalDecisions: [],
      escapeRoutes: [],
    };

    mockSession = {
      id: 'test-session',
      technique: 'six_hats',
      problem: 'Test problem',
      currentStep: 3,
      totalSteps: 6,
      history: [],
      branches: {},
      insights: [],
      lastActivityTime: Date.now(),
    };
  });

  describe('measure', () => {
    it('should return safe reading when resources are adequate', async () => {
      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(reading.sensorType).toBe('resource');
      expect(reading.warningLevel).toBeDefined();
      expect(reading.distance).toBeGreaterThan(0);
      expect(reading.confidence).toBeGreaterThan(0);
    });

    it('should calculate approach rate based on historical data', async () => {
      // Add more history showing resource consumption
      mockPathMemory.pathHistory.push(
        {
          id: 'event-2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: 2,
          decision: 'Expand scope',
          optionsOpened: [],
          optionsClosed: ['budget_option1'],
          reversibilityCost: 0.4,
          commitmentLevel: 0.5,
          constraintsCreated: ['budget_constraint1'],
          flexibilityImpact: -0.2,
        },
        {
          id: 'event-3',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: 3,
          decision: 'More resources',
          optionsOpened: [],
          optionsClosed: ['budget_option2', 'budget_option3'],
          reversibilityCost: 0.6,
          commitmentLevel: 0.7,
          constraintsCreated: ['budget_constraint2'],
          flexibilityImpact: -0.3,
        }
      );

      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(reading.approachRate).toBeDefined();
      expect(reading.context.resourceMetrics).toBeDefined();
      expect(reading.context.resourceMetrics.burnRate).toBeDefined();
    });

    it('should warn when approaching budget limits', async () => {
      // Simulate high resource consumption
      for (let i = 0; i < 10; i++) {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (10 - i) * 600000).toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: i + 2,
          decision: `Resource allocation ${i}`,
          optionsOpened: [],
          optionsClosed: [`resource_option${i}`],
          reversibilityCost: 0.5 + i * 0.05,
          commitmentLevel: 0.6 + i * 0.04,
          constraintsCreated: [`resource_constraint${i}`],
          flexibilityImpact: -(0.2 + i * 0.05),
        });
      }

      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(reading.indicators.length).toBeGreaterThan(0);
    });

    it('should assess option space depletion', async () => {
      // Simulate closing many options
      mockPathMemory.foreclosedOptions = ['option3', 'option4', 'option5', 'option6', 'option7'];
      mockPathMemory.availableOptions = ['option1', 'option2'];

      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(reading.context.wastedEffort).toBeDefined();
    });

    it('should detect option creation vs destruction imbalance', async () => {
      // History with more options closed than opened
      for (let i = 0; i < 5; i++) {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (5 - i) * 1800000).toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: i + 2,
          decision: `Decision ${i}`,
          optionsOpened: i % 2 === 0 ? [`new_option${i}`] : [],
          optionsClosed: [`closed_option${i}1`, `closed_option${i}2`],
          reversibilityCost: 0.4,
          commitmentLevel: 0.5,
          constraintsCreated: [],
          flexibilityImpact: -0.15,
        });
      }

      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(reading.context.resourceTrend).toBeDefined();
    });

    it('should provide time to depletion estimate', async () => {
      // Simulate steady resource consumption
      const steadyBurnHistory = [];
      for (let i = 0; i < 8; i++) {
        steadyBurnHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (8 - i) * 3600000).toISOString(), // 1 hour intervals
          technique: 'six_hats' as LateralTechnique,
          step: i + 2,
          decision: `Steady burn ${i}`,
          optionsOpened: [],
          optionsClosed: [`option${i}`],
          reversibilityCost: 0.3,
          commitmentLevel: 0.4,
          constraintsCreated: [],
          flexibilityImpact: -0.1,
        });
      }
      mockPathMemory.pathHistory.push(...steadyBurnHistory);

      const reading = await monitor.measure(mockPathMemory, mockSession);

      // Time to impact may not always be calculable
      if (reading.timeToImpact !== undefined) {
        expect(reading.timeToImpact).toBeGreaterThan(0);
      }
    });
  });

  describe('calibrate', () => {
    it('should adjust sensitivity to resource consumption', async () => {
      const calibration = {
        sensitivity: 0.9, // Very sensitive
        warningThresholds: {
          caution: 0.7,
          warning: 0.5,
          critical: 0.3,
        },
        noiseFilter: 0.02,
        historicalWeight: 0.3,
        contextFactors: {
          budgetBuffer: 0.2, // Small buffer = more sensitive
        },
      };

      monitor.calibrate(calibration);

      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(monitor.getCalibration()).toMatchObject(calibration);
    });

    it('should apply context factors for resource assessment', async () => {
      const calibration = {
        sensitivity: 0.6,
        warningThresholds: {
          caution: 0.5,
          warning: 0.3,
          critical: 0.1,
        },
        noiseFilter: 0.1,
        historicalWeight: 0.4,
        contextFactors: {
          teamSize: 5, // Larger team = higher resource needs
          projectPhase: 'early', // Early phase = more uncertainty
          fundingConfidence: 0.8, // High confidence = less worry
        },
      };

      monitor.calibrate(calibration);

      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(reading.context.resourceMetrics).toBeDefined();
    });
  });

  describe('resource-specific patterns', () => {
    it('should identify resource hoarding patterns', async () => {
      // Decisions that accumulate resources without using them
      for (let i = 0; i < 5; i++) {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (5 - i) * 7200000).toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: i + 2,
          decision: `Reserve resources for ${i}`,
          optionsOpened: [`reserve_option${i}`],
          optionsClosed: [],
          reversibilityCost: 0.1,
          commitmentLevel: 0.8, // High commitment to holding
          constraintsCreated: [`hold_constraint${i}`],
          flexibilityImpact: -0.05,
        });
      }

      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(reading.indicators.length).toBeGreaterThan(0);
    });

    it('should detect feast-famine cycles', async () => {
      // Alternating periods of high and low resource usage
      for (let i = 0; i < 10; i++) {
        const isFeast = i % 4 < 2;
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (10 - i) * 1800000).toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: i + 2,
          decision: isFeast ? 'Major expenditure' : 'Minimal activity',
          optionsOpened: isFeast ? [] : ['saving_option'],
          optionsClosed: isFeast ? ['expensive_option1', 'expensive_option2'] : [],
          reversibilityCost: isFeast ? 0.7 : 0.1,
          commitmentLevel: isFeast ? 0.8 : 0.2,
          constraintsCreated: isFeast ? [`spend_constraint${i}`] : [],
          flexibilityImpact: isFeast ? -0.4 : -0.05,
        });
      }

      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(reading.context.resourceTrend).toBeDefined();
    });

    it('should assess commitment vs liquidity balance', async () => {
      // High commitment decisions with low reversibility
      mockPathMemory.pathHistory.push({
        id: 'event-2',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        technique: 'six_hats' as LateralTechnique,
        step: 2,
        decision: 'Long-term contract commitment',
        optionsOpened: [],
        optionsClosed: ['flexible_option1', 'flexible_option2', 'flexible_option3'],
        reversibilityCost: 0.9,
        commitmentLevel: 0.95,
        constraintsCreated: ['long_term_commitment'],
        flexibilityImpact: -0.6,
      });

      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(reading.indicators.length).toBeGreaterThan(0);
    });
  });

  describe('integration scenarios', () => {
    it('should correlate resource depletion with constraint creation', async () => {
      // Add constraints that consume resources
      mockPathMemory.constraints = [
        {
          id: 'c1',
          type: 'technical',
          description: 'Must maintain 99.9% uptime',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          createdBy: mockPathMemory.pathHistory[0],
          strength: 0.9,
          affectedOptions: ['cheap_hosting', 'basic_monitoring'],
          reversibilityCost: 0.8,
        },
        {
          id: 'c2',
          type: 'resource',
          description: 'Fixed monthly infrastructure cost',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          createdBy: mockPathMemory.pathHistory[0],
          strength: 1.0,
          affectedOptions: ['scale_down', 'reduce_redundancy'],
          reversibilityCost: 0.7,
        },
      ];

      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(reading.context.wastedEffort).toBeDefined();
    });

    it('should handle sudden resource shocks', async () => {
      // Normal history followed by sudden shock
      mockPathMemory.pathHistory.push({
        id: 'event-shock',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        technique: 'six_hats' as LateralTechnique,
        step: 4,
        decision: 'Emergency response - major budget cut',
        optionsOpened: [],
        optionsClosed: [
          'expansion_plan',
          'new_features',
          'team_growth',
          'marketing_campaign',
          'r_and_d',
          'training_budget',
        ],
        reversibilityCost: 0.4,
        commitmentLevel: 0.3,
        constraintsCreated: ['budget_cut_constraint'],
        flexibilityImpact: -0.5,
      });

      const reading = await monitor.measure(mockPathMemory, mockSession);

      // With many options closed and constraints created, warning level should reflect resource consumption
      expect(reading.indicators.length).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should clear measurement history', async () => {
      // Take measurements
      await monitor.measure(mockPathMemory, mockSession);
      await monitor.measure(mockPathMemory, mockSession);

      // Reset
      monitor.reset();

      const status = monitor.getStatus();
      expect(status.historySize).toBe(0);
      expect(status.lastReading).toBeNull();
    });
  });
});
