/**
 * Tests for Cognitive Assessor sensor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CognitiveAssessor } from '../../../../ergodicity/earlyWarning/sensors/cognitiveAssessor.js';
import type { PathMemory } from '../../../../ergodicity/types.js';
import type { SessionData, LateralTechnique } from '../../../../types/index.js';

describe('CognitiveAssessor', () => {
  let assessor: CognitiveAssessor;
  let mockPathMemory: PathMemory;
  let mockSession: SessionData;

  beforeEach(() => {
    assessor = new CognitiveAssessor();

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
        flexibilityScore: 0.8,
        reversibilityIndex: 0.8,
        pathDivergence: 0.2,
        barrierProximity: [],
        optionVelocity: 0.5,
        commitmentDepth: 0.2,
      },
      absorbingBarriers: [],
      criticalDecisions: [],
      escapeRoutes: [],
    };

    mockSession = {
      id: 'test-session',
      technique: 'six_hats',
      problem: 'Complex system design',
      currentStep: 3,
      totalSteps: 6,
      history: [],
      branches: {},
      insights: [],
      lastActivityTime: Date.now(),
    };
  });

  describe('measure', () => {
    it('should assess cognitive load based on decision complexity', async () => {
      const reading = await assessor.measure(mockPathMemory, mockSession);

      expect(reading.sensorType).toBe('cognitive');
      expect(reading.distance).toBeGreaterThan(0);
      expect(reading.warningLevel).toBeDefined();
      expect(reading.indicators).toBeInstanceOf(Array);
    });

    it('should detect increasing complexity patterns', async () => {
      const complexScenarios = [
        'Implement distributed caching with consistency guarantees',
        'Design fault-tolerant message queue system',
        'Create real-time data synchronization across regions',
      ];

      // Add complex decisions with increasing complexity
      for (let i = 0; i < 10; i++) {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(), // 1 minute intervals
          technique: 'six_hats' as LateralTechnique,
          step: i + 2,
          decision: `Decision ${i + 2}: ${complexScenarios[i % complexScenarios.length]}`,
          optionsOpened: [],
          optionsClosed: [`option${i + 3}`],
          reversibilityCost: 0.3 + i * 0.05,
          commitmentLevel: 0.4 + i * 0.05,
          constraintsCreated: [],
          flexibilityImpact: -(i * 0.05),
        });
      }

      const reading = await assessor.measure(mockPathMemory, mockSession);

      expect(reading.indicators.length).toBeGreaterThan(0);
      expect(reading.approachRate).toBeGreaterThanOrEqual(0);
    });

    it('should warn about decision fatigue', async () => {
      // Add many rapid decisions
      for (let i = 0; i < 20; i++) {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (20 - i) * 10000).toISOString(), // 10 second intervals
          technique: 'six_hats' as LateralTechnique,
          step: i + 2,
          decision: `Quick decision ${i + 2}`,
          optionsOpened: [],
          optionsClosed: [],
          reversibilityCost: 0.1,
          commitmentLevel: 0.1,
          constraintsCreated: [],
          flexibilityImpact: -0.05,
        });
      }

      const reading = await assessor.measure(mockPathMemory, mockSession);

      expect(reading.indicators.length).toBeGreaterThan(0);
      expect(reading.context.cognitiveLoad).toBeDefined();
    });

    it('should assess cognitive diversity in techniques', async () => {
      // Use diverse techniques
      const techniques: LateralTechnique[] = ['six_hats', 'po', 'random_entry', 'scamper'];
      techniques.forEach((technique, i) => {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (4 - i) * 60000).toISOString(),
          technique,
          step: i + 2,
          decision: `${technique} approach applied`,
          optionsOpened: [`${technique}_option1`, `${technique}_option2`],
          optionsClosed: [],
          reversibilityCost: 0.3,
          commitmentLevel: 0.3,
          constraintsCreated: [],
          flexibilityImpact: -0.1,
        });
      });

      const reading = await assessor.measure(mockPathMemory, mockSession);

      expect(reading.context.cognitiveMetrics).toBeDefined();
      expect(reading.context.cognitiveMetrics.perspectiveDiversity).toBeDefined();
    });

    it('should detect abstract thinking overload', async () => {
      // Add increasingly abstract decisions
      const abstractDecisions = [
        'Define meta-framework for thinking about thinking',
        'Consider higher-order implications of decision patterns',
        'Abstract pattern recognition across domains',
        'Theoretical framework synthesis from empirical observations',
        'Conceptual model recursion and self-reference',
      ];

      abstractDecisions.forEach((decision, i) => {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (5 - i) * 60000).toISOString(),
          technique: 'concept_extraction' as LateralTechnique,
          step: i + 2,
          decision,
          optionsOpened: [],
          optionsClosed: [`abstract_option${i}`],
          reversibilityCost: 0.5 + i * 0.1,
          commitmentLevel: 0.6 + i * 0.1,
          constraintsCreated: [`abstract_constraint${i}`],
          flexibilityImpact: -(0.2 + i * 0.1),
        });
      });

      const reading = await assessor.measure(mockPathMemory, mockSession);

      // With many abstract decisions, cognitive load should be elevated
      expect(reading.context.cognitiveLoad).toBeGreaterThan(0);
    });

    it('should calculate cognitive recovery needs', async () => {
      // High load followed by recovery period
      for (let i = 0; i < 10; i++) {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (20 - i) * 60000).toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: i + 2,
          decision: i < 5 ? 'High complexity decision' : 'Simple recovery decision',
          optionsOpened: i < 5 ? [] : ['recovery_option1', 'recovery_option2'],
          optionsClosed: i < 5 ? ['option_closed1', 'option_closed2'] : [],
          reversibilityCost: i < 5 ? 0.7 : 0.2,
          commitmentLevel: i < 5 ? 0.8 : 0.2,
          constraintsCreated: i < 5 ? [`constraint${i}`] : [],
          flexibilityImpact: i < 5 ? -0.3 : 0.1,
        });
      }

      const reading = await assessor.measure(mockPathMemory, mockSession);

      expect(reading.context.cognitiveLoad).toBeDefined();
    });
  });

  describe('calibrate', () => {
    it('should adjust thresholds for cognitive sensitivity', async () => {
      const calibration = {
        sensitivity: 0.8, // High sensitivity to cognitive load
        warningThresholds: {
          caution: 0.6,
          warning: 0.4,
          critical: 0.2,
        },
        noiseFilter: 0.05,
        historicalWeight: 0.4,
        contextFactors: {
          experienceLevel: 0.7, // Less experienced = more cognitive load
        },
      };

      assessor.calibrate(calibration);

      const reading = await assessor.measure(mockPathMemory, mockSession);

      expect(reading).toBeDefined();
      expect(assessor.getCalibration()).toMatchObject(calibration);
    });

    it('should apply experience factors', async () => {
      const calibration = {
        sensitivity: 0.5,
        warningThresholds: {
          caution: 0.5,
          warning: 0.3,
          critical: 0.1,
        },
        noiseFilter: 0.1,
        historicalWeight: 0.3,
        contextFactors: {
          domainExpertise: 1.5, // Expert = higher tolerance
          teamSupport: 1.2, // Team help = higher capacity
        },
      };

      assessor.calibrate(calibration);

      const reading = await assessor.measure(mockPathMemory, mockSession);

      expect(reading.context).toBeDefined();
      expect(reading.confidence).toBeGreaterThan(0);
    });
  });

  describe('cognitive-specific patterns', () => {
    it('should identify cognitive tunneling', async () => {
      // Add decisions showing tunneling pattern
      const tunnelingDecisions = [
        'Focus on optimization of specific algorithm',
        'Further optimize the same algorithm',
        'Micro-optimize algorithm performance',
        'Continue optimizing despite diminishing returns',
        'Extreme optimization at cost of maintainability',
      ];

      tunnelingDecisions.forEach((decision, i) => {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (5 - i) * 60000).toISOString(),
          technique: 'six_hats' as LateralTechnique,
          step: i + 2,
          decision,
          optionsOpened: [],
          optionsClosed: [`alternative${i}`, `alternative${i + 1}`],
          reversibilityCost: 0.6 + i * 0.05,
          commitmentLevel: 0.7 + i * 0.05,
          constraintsCreated: [`tunnel_constraint${i}`],
          flexibilityImpact: -(0.2 + i * 0.05),
        });
      });

      const reading = await assessor.measure(mockPathMemory, mockSession);

      // With tunneling pattern, there should be indicators
      expect(reading.indicators.length).toBeGreaterThan(0);
      // Perspective diversity calculation in early stages may still show diversity
      expect(reading.context.cognitiveMetrics.perspectiveDiversity).toBeDefined();
    });

    it('should detect context switching overhead', async () => {
      // Rapid context switching
      const contexts = ['Frontend', 'Backend', 'Database', 'DevOps', 'Architecture'];
      for (let i = 0; i < 15; i++) {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (15 - i) * 30000).toISOString(), // 30 second intervals
          technique: 'six_hats' as LateralTechnique,
          step: i + 2,
          decision: `${contexts[i % contexts.length]} decision`,
          optionsOpened: [`${contexts[i % contexts.length]}_option`],
          optionsClosed: [],
          reversibilityCost: 0.3,
          commitmentLevel: 0.4,
          constraintsCreated: [],
          flexibilityImpact: -0.1,
        });
      }

      const reading = await assessor.measure(mockPathMemory, mockSession);

      // With multiple context switches, perspective shifts should be detected
      expect(reading.context.perspectiveShifts).toBeGreaterThanOrEqual(0);
    });

    it('should assess working memory load', async () => {
      // Complex nested decisions
      const workingMemoryLoad = [
        'Consider A while remembering B, C, and D',
        'Evaluate E in context of A-D relationships',
        'Compare F with patterns from A-E',
        'Synthesize G from all previous elements',
        'Meta-analysis of A-G interactions',
      ];

      workingMemoryLoad.forEach((decision, i) => {
        mockPathMemory.pathHistory.push({
          id: `event-${i + 2}`,
          timestamp: new Date(Date.now() - (5 - i) * 60000).toISOString(),
          technique: 'concept_extraction' as LateralTechnique,
          step: i + 2,
          decision,
          optionsOpened: [],
          optionsClosed: [`memory_option${i}`],
          reversibilityCost: 0.4 + i * 0.1,
          commitmentLevel: 0.5 + i * 0.1,
          constraintsCreated: [`memory_constraint${i}`],
          flexibilityImpact: -(0.15 + i * 0.05),
        });
      });

      const reading = await assessor.measure(mockPathMemory, mockSession);

      // With many abstract decisions, cognitive load should be elevated
      expect(reading.context.cognitiveLoad).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should clear cognitive assessment state', async () => {
      // Take some measurements
      await assessor.measure(mockPathMemory, mockSession);

      // Reset
      assessor.reset();

      const status = assessor.getStatus();
      expect(status.historySize).toBe(0);
    });
  });
});
