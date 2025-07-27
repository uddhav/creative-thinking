/**
 * Tests for Escape Velocity Protocols
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErgodicityManager } from '../src/ergodicity/index.js';
import {
  EscapeVelocitySystem,
  EscapeLevel,
  PatternInterruptionProtocol,
  ResourceReallocationProtocol,
  StakeholderResetProtocol,
  TechnicalRefactoringProtocol,
  StrategicPivotProtocol,
  EscapeVelocityCalculator,
} from '../src/ergodicity/escapeProtocols/index.js';
import type { SessionData, LateralTechnique } from '../src/index.js';
import type { EscapeContext } from '../src/ergodicity/escapeProtocols/types.js';
import type { PathEvent } from '../src/ergodicity/types.js';
import { ErgodicityWarningLevel } from '../src/ergodicity/types.js';

describe('Escape Velocity Protocols', () => {
  let ergodicityManager: ErgodicityManager;
  let escapeSystem: EscapeVelocitySystem;
  let sessionData: SessionData;
  let context: EscapeContext;

  beforeEach(async () => {
    ergodicityManager = new ErgodicityManager();
    escapeSystem = new EscapeVelocitySystem();

    sessionData = {
      technique: 'six_hats',
      problem: 'Test problem',
      history: [],
      branches: {},
      insights: [],
      startTime: Date.now(),
    };

    // Create initial path events to simulate low (but not zero) flexibility
    // First, open some options
    await ergodicityManager.recordThinkingStep('random_entry', 1, 'Initial exploration', {
      optionsOpened: ['opt1', 'opt2', 'opt3', 'opt4', 'opt5'],
      optionsClosed: [],
      reversibilityCost: 0.1,
      commitmentLevel: 0.1,
    });

    // Then close most but not all options to create low flexibility
    for (let i = 0; i < 3; i++) {
      await ergodicityManager.recordThinkingStep('scamper', i + 2, 'High commitment decision', {
        optionsOpened: [],
        optionsClosed: [`opt${i + 1}`],
        reversibilityCost: 0.8,
        commitmentLevel: 0.9,
      });
    }

    // Get the current state for context
    const pathMemory = ergodicityManager.getPathMemory();
    const currentFlexibility = ergodicityManager.getCurrentFlexibility();

    context = {
      pathMemory,
      sessionData,
      currentFlexibility,
      triggerReason: 'Test',
      userApproval: true,
      automaticMode: false,
    };
  });

  describe('Protocol Implementation', () => {
    it('should execute Pattern Interruption protocol', () => {
      const protocol = new PatternInterruptionProtocol();
      const result = protocol.execute(context);

      expect(result.success).toBe(true);
      expect(result.protocol.level).toBe(EscapeLevel.PATTERN_INTERRUPTION);
      expect(result.flexibilityGained).toBeGreaterThan(0.1);
      expect(result.newOptionsCreated.length).toBeGreaterThan(0);
      expect(result.executionNotes.length).toBeGreaterThan(0);
    });

    it('should execute Resource Reallocation protocol', () => {
      const protocol = new ResourceReallocationProtocol();
      const result = protocol.execute(context);

      expect(result.success).toBe(true);
      expect(result.protocol.level).toBe(EscapeLevel.RESOURCE_REALLOCATION);
      expect(result.flexibilityGained).toBeGreaterThan(0.1);
      expect(result.constraintsRemoved.length).toBeGreaterThan(0);
    });

    it('should execute Stakeholder Reset protocol', () => {
      const protocol = new StakeholderResetProtocol();
      const result = protocol.execute(context);

      expect(result.success).toBe(true);
      expect(result.protocol.level).toBe(EscapeLevel.STAKEHOLDER_RESET);
      expect(result.flexibilityGained).toBeGreaterThan(0.2);
      expect(result.newOptionsCreated).toContain('Phased delivery approach');
    });

    it('should execute Technical Refactoring protocol', () => {
      const protocol = new TechnicalRefactoringProtocol();
      const result = protocol.execute(context);

      expect(result.success).toBe(true);
      expect(result.protocol.level).toBe(EscapeLevel.TECHNICAL_REFACTORING);
      expect(result.flexibilityGained).toBeGreaterThan(0.25);
      expect(result.constraintsRemoved).toContain('Monolithic architecture');
    });

    it('should execute Strategic Pivot protocol', () => {
      const protocol = new StrategicPivotProtocol();
      const result = protocol.execute(context);

      expect(result.success).toBe(true);
      expect(result.protocol.level).toBe(EscapeLevel.STRATEGIC_PIVOT);
      expect(result.flexibilityGained).toBeGreaterThan(0.3);
      expect(result.constraintsRemoved.length).toBeGreaterThan(3);
    });
  });

  describe('Escape Velocity Calculator', () => {
    let calculator: EscapeVelocityCalculator;

    beforeEach(() => {
      calculator = new EscapeVelocityCalculator();
    });

    it('should analyze escape requirements', () => {
      const analysis = calculator.calculateEscapeRequirements(context);

      // With our setup (5 options opened, 3 closed), flexibility should be around 0.53
      expect(analysis.currentFlexibility).toBeGreaterThan(0.3);
      expect(analysis.currentFlexibility).toBeLessThan(0.7);
      expect(analysis.constraintStrength).toBeGreaterThan(0);
      expect(analysis.escapeForceNeeded).toBeGreaterThan(0);
      expect(analysis.availableResources).toBeGreaterThan(0);
      expect(analysis.feasibility).toBeDefined();
      expect(analysis.optimalTrajectory).toBeDefined();
      expect(analysis.executionPlan).toBeDefined();
    });

    it('should recommend appropriate protocol based on flexibility', () => {
      // Test with very low flexibility
      context.currentFlexibility.flexibilityScore = 0.1;
      const lowFlexAnalysis = calculator.calculateEscapeRequirements(context);
      expect(lowFlexAnalysis.optimalTrajectory.protocol.level).toBe(
        EscapeLevel.PATTERN_INTERRUPTION
      );

      // Test with medium flexibility (0.4 gives access to levels 1-4)
      context.currentFlexibility.flexibilityScore = 0.4;
      const medFlexAnalysis = calculator.calculateEscapeRequirements(context);
      // With flexibility 0.4, we can use up to Technical Refactoring (level 4)
      expect(medFlexAnalysis.optimalTrajectory.protocol.level).toBeGreaterThanOrEqual(
        EscapeLevel.PATTERN_INTERRUPTION
      );
      expect(medFlexAnalysis.optimalTrajectory.protocol.level).toBeLessThanOrEqual(
        EscapeLevel.TECHNICAL_REFACTORING
      );
    });

    it('should generate warnings for difficult escapes', () => {
      // Create very high constraints
      context.currentFlexibility.flexibilityScore = 0.05;
      // Create proper constraint objects
      context.pathMemory.constraints = Array(20)
        .fill(null)
        .map((_, i) => ({
          id: `constraint_${i}`,
          type: 'technical' as const,
          description: `High constraint ${i}`,
          createdAt: new Date().toISOString(),
          createdBy: {} as PathEvent,
          strength: 0.9,
          affectedOptions: [],
          reversibilityCost: 0.9,
        }));

      const analysis = calculator.calculateEscapeRequirements(context);

      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.feasibility).toBe(false);
      expect(analysis.resourceGap).toBeGreaterThan(0);
    });
  });

  describe('Escape Velocity System', () => {
    it('should check if escape is needed based on flexibility', () => {
      expect(escapeSystem.isEscapeNeeded(0.15)).toBe(true);
      expect(escapeSystem.isEscapeNeeded(0.25)).toBe(true);
      expect(escapeSystem.isEscapeNeeded(0.35)).toBe(false);
    });

    it('should determine escape urgency correctly', () => {
      expect(escapeSystem.getEscapeUrgency(0.05)).toBe('critical');
      expect(escapeSystem.getEscapeUrgency(0.15)).toBe('high');
      expect(escapeSystem.getEscapeUrgency(0.25)).toBe('medium');
      expect(escapeSystem.getEscapeUrgency(0.5)).toBe('low');
    });

    it('should get available protocols based on flexibility', () => {
      const lowFlexProtocols = escapeSystem.getAvailableProtocols(0.1);
      expect(lowFlexProtocols.length).toBe(1); // Only Pattern Interruption

      const medFlexProtocols = escapeSystem.getAvailableProtocols(0.3);
      expect(medFlexProtocols.length).toBeGreaterThan(1);

      const highFlexProtocols = escapeSystem.getAvailableProtocols(0.6);
      expect(highFlexProtocols.length).toBe(5); // All protocols
    });

    it('should execute protocol and update monitoring', () => {
      const result = escapeSystem.executeProtocol(EscapeLevel.PATTERN_INTERRUPTION, context);

      expect(result.success).toBe(true);

      const monitoring = escapeSystem.getMonitoringData();
      expect(monitoring.attemptCount).toBe(1);
      expect(monitoring.successCount).toBe(1);
      expect(monitoring.averageFlexibilityGain).toBeGreaterThan(0);
    });

    it('should throw error for insufficient flexibility', () => {
      context.currentFlexibility.flexibilityScore = 0.05;

      expect(() => {
        escapeSystem.executeProtocol(EscapeLevel.STRATEGIC_PIVOT, context);
      }).toThrow('Insufficient flexibility');
    });
  });

  describe('Integration with Ergodicity Manager', () => {
    it('should analyze escape velocity through ergodicity manager', () => {
      const analysis = ergodicityManager.analyzeEscapeVelocity(sessionData);

      expect(analysis).toBeDefined();
      expect(analysis.currentFlexibility).toBeDefined();
      expect(analysis.optimalTrajectory).toBeDefined();
    });

    it('should execute escape protocol through ergodicity manager', () => {
      const result = ergodicityManager.executeEscapeVelocityProtocol(
        EscapeLevel.PATTERN_INTERRUPTION,
        sessionData,
        true
      );

      expect(result.success).toBe(true);
      expect(result.flexibilityGained).toBeGreaterThan(0);

      // Check that path memory was updated
      const pathMemory = ergodicityManager.getPathMemory();
      const lastEvent = pathMemory.pathHistory[pathMemory.pathHistory.length - 1];
      expect(lastEvent.decision).toContain('Pattern Interruption');
    });

    it('should require user approval for high-level protocols', () => {
      expect(() =>
        ergodicityManager.executeEscapeVelocityProtocol(
          EscapeLevel.STRATEGIC_PIVOT,
          sessionData,
          false // No user approval
        )
      ).toThrow('User approval required');
    });

    it('should show escape velocity warnings when flexibility is low', async () => {
      // Force very low flexibility
      for (let i = 0; i < 20; i++) {
        await ergodicityManager.recordThinkingStep(
          'yes_and',
          i + 1,
          'Another high commitment',
          {
            optionsOpened: [],
            optionsClosed: ['a', 'b', 'c'],
            reversibilityCost: 0.95,
            commitmentLevel: 0.95,
          },
          sessionData
        );
      }

      const warnings = ergodicityManager.getWarnings();
      const escapeWarning = warnings.find(
        w => w.metric === 'flexibilityScore' && w.level === ErgodicityWarningLevel.CRITICAL
      );

      expect(escapeWarning).toBeDefined();
      // Check that one of the recommendations mentions escape protocols
      const hasEscapeRecommendation = escapeWarning?.recommendations.some(
        (r: string) => r.includes('Pattern Interruption') || r.includes('escape protocol')
      );
      expect(hasEscapeRecommendation).toBe(true);
    });
  });

  describe('Escape Protocol Recommendations', () => {
    it('should recommend based on constraint analysis', () => {
      const protocols = escapeSystem.getAvailableProtocols(0.5);
      const recommended = escapeSystem.recommendProtocol(0.5, 0.3);

      expect(recommended).toBeDefined();
      expect(protocols).toContain(recommended);
    });

    it('should handle edge cases gracefully', () => {
      // Zero flexibility - should still provide emergency protocol
      context.currentFlexibility.flexibilityScore = 0;
      const zeroFlexAnalysis = escapeSystem.analyzeEscapeNeeds(context);
      expect(zeroFlexAnalysis.optimalTrajectory).toBeDefined();
      expect(zeroFlexAnalysis.optimalTrajectory.protocol.level).toBe(
        EscapeLevel.PATTERN_INTERRUPTION
      );

      // Perfect flexibility - should show feasible if resources are high
      context.currentFlexibility.flexibilityScore = 1;
      context.pathMemory.constraints = []; // Remove constraints for perfect flexibility
      // Also ensure path history shows low commitment for perfect flexibility
      context.pathMemory.pathHistory = [
        {
          id: 'test1',
          timestamp: new Date().toISOString(),
          technique: 'random_entry' as LateralTechnique,
          step: 1,
          decision: 'Exploring options',
          optionsOpened: ['a', 'b', 'c'],
          optionsClosed: [],
          reversibilityCost: 0.1,
          commitmentLevel: 0.1,
          constraintsCreated: [],
        },
      ];
      const perfectFlexAnalysis = escapeSystem.analyzeEscapeNeeds(context);
      // With no constraints and low commitments, constraint strength should be low
      expect(perfectFlexAnalysis.constraintStrength).toBeLessThan(0.5);
    });
  });
});
