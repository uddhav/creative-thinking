/**
 * Simple tests for Early Warning System sensors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceMonitor } from '../../../../ergodicity/earlyWarning/sensors/resourceMonitor.js';
import { CognitiveAssessor } from '../../../../ergodicity/earlyWarning/sensors/cognitiveAssessor.js';
import { TechnicalDebtAnalyzer } from '../../../../ergodicity/earlyWarning/sensors/technicalDebtAnalyzer.js';
import { BarrierWarningLevel } from '../../../../ergodicity/earlyWarning/types.js';
import type { PathMemory } from '../../../../ergodicity/types.js';
import type { SessionData, LateralTechnique } from '../../../../types/index.js';

describe('Early Warning Sensors - Basic Tests', () => {
  let mockPathMemory: PathMemory;
  let mockSession: SessionData;

  beforeEach(() => {
    mockPathMemory = {
      pathHistory: [
        {
          id: 'event-1',
          timestamp: new Date().toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: 1,
          decision: 'Initial decision',
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

  describe('ResourceMonitor', () => {
    let monitor: ResourceMonitor;

    beforeEach(() => {
      monitor = new ResourceMonitor();
    });

    it('should create resource monitor instance', () => {
      expect(monitor).toBeDefined();
      expect(monitor.type).toBe('resource');
    });

    it('should take a measurement', async () => {
      const reading = await monitor.measure(mockPathMemory, mockSession);

      expect(reading).toBeDefined();
      expect(reading.sensorType).toBe('resource');
      expect(reading.timestamp).toBeDefined();
      expect(reading.rawValue).toBeGreaterThanOrEqual(0);
      expect(reading.rawValue).toBeLessThanOrEqual(1);
      expect(reading.warningLevel).toBeDefined();
      expect(reading.distance).toBeGreaterThanOrEqual(0);
      expect(reading.distance).toBeLessThanOrEqual(1);
      expect(reading.confidence).toBeGreaterThanOrEqual(0);
      expect(reading.confidence).toBeLessThanOrEqual(1);
      expect(reading.indicators).toBeInstanceOf(Array);
      expect(reading.context).toBeDefined();
    });

    it('should calibrate sensor', () => {
      monitor.calibrate({
        sensitivity: 0.8,
        warningThresholds: {
          caution: 0.6,
          warning: 0.4,
          critical: 0.2,
        },
      });

      const calibration = monitor.getCalibration();
      expect(calibration.sensitivity).toBe(0.8);
      expect(calibration.warningThresholds.caution).toBe(0.6);
    });

    it('should reset sensor state', async () => {
      // Take a measurement
      await monitor.measure(mockPathMemory, mockSession);

      // Reset
      monitor.reset();

      const status = monitor.getStatus();
      expect(status.lastReading).toBeNull();
      expect(status.historySize).toBe(0);
    });
  });

  describe('CognitiveAssessor', () => {
    let assessor: CognitiveAssessor;

    beforeEach(() => {
      assessor = new CognitiveAssessor();
    });

    it('should create cognitive assessor instance', () => {
      expect(assessor).toBeDefined();
      expect(assessor.type).toBe('cognitive');
    });

    it('should assess cognitive load', async () => {
      const reading = await assessor.measure(mockPathMemory, mockSession);

      expect(reading).toBeDefined();
      expect(reading.sensorType).toBe('cognitive');
      expect(reading.indicators).toBeInstanceOf(Array);
      expect(reading.context).toBeDefined();
    });

    it('should handle complex decision history', async () => {
      // Add complex decisions
      mockPathMemory.pathHistory.push(
        {
          id: 'event-2',
          timestamp: new Date().toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: 2,
          decision: 'Implement complex algorithm with multiple nested conditions',
          optionsOpened: [],
          optionsClosed: ['option3'],
          reversibilityCost: 0.5,
          commitmentLevel: 0.5,
          constraintsCreated: ['constraint1'],
          flexibilityImpact: -0.2,
        },
        {
          id: 'event-3',
          timestamp: new Date().toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: 3,
          decision: 'Integrate with external APIs and handle edge cases',
          optionsOpened: [],
          optionsClosed: ['option4', 'option5'],
          reversibilityCost: 0.6,
          commitmentLevel: 0.6,
          constraintsCreated: ['constraint2'],
          flexibilityImpact: -0.3,
        }
      );

      const reading = await assessor.measure(mockPathMemory, mockSession);

      expect(reading.rawValue).toBeGreaterThan(0);
      // Indicators may or may not be present depending on cognitive load
      expect(reading.indicators).toBeInstanceOf(Array);
    });
  });

  describe('TechnicalDebtAnalyzer', () => {
    let analyzer: TechnicalDebtAnalyzer;

    beforeEach(() => {
      analyzer = new TechnicalDebtAnalyzer();
    });

    it('should create technical debt analyzer instance', () => {
      expect(analyzer).toBeDefined();
      expect(analyzer.type).toBe('technical_debt');
    });

    it('should analyze technical debt', async () => {
      const reading = await analyzer.measure(mockPathMemory, mockSession);

      expect(reading).toBeDefined();
      expect(reading.sensorType).toBe('technical_debt');
      expect(reading.warningLevel).toBeDefined();
      expect(Object.values(BarrierWarningLevel)).toContain(reading.warningLevel);
    });

    it('should detect increasing complexity', async () => {
      // Add history showing increasing technical decisions
      for (let i = 0; i < 5; i++) {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 4}`,
          timestamp: new Date(Date.now() - (5 - i) * 3600000).toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: i + 2,
          decision: `Technical decision ${i}`,
          optionsOpened: [],
          optionsClosed: [`option${i + 6}`],
          reversibilityCost: 0.3 + i * 0.1,
          commitmentLevel: 0.4 + i * 0.1,
          constraintsCreated: [],
          flexibilityImpact: -(i * 0.1),
        });
      }

      const reading = await analyzer.measure(mockPathMemory, mockSession);

      expect(reading.context).toBeDefined();
    });
  });

  describe('Sensor coordination', () => {
    it('should have consistent interfaces across sensors', async () => {
      const sensors = [new ResourceMonitor(), new CognitiveAssessor(), new TechnicalDebtAnalyzer()];

      for (const sensor of sensors) {
        // All sensors should have required methods
        expect(typeof sensor.measure).toBe('function');
        expect(typeof sensor.calibrate).toBe('function');
        expect(typeof sensor.reset).toBe('function');
        expect(typeof sensor.getStatus).toBe('function');
        expect(typeof sensor.getCalibration).toBe('function');
        expect(sensor.type).toBeDefined();

        // All sensors should produce valid readings
        const reading = await sensor.measure(mockPathMemory, mockSession);
        expect(reading.sensorType).toBe(sensor.type);
        expect(reading.timestamp).toBeDefined();
        expect(reading.rawValue).toBeDefined();
        expect(reading.warningLevel).toBeDefined();
        expect(reading.distance).toBeDefined();
        expect(reading.confidence).toBeDefined();
        expect(reading.indicators).toBeInstanceOf(Array);
        expect(reading.context).toBeDefined();
      }
    });
  });
});
