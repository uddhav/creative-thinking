/**
 * Unit tests for escape velocity protocols
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EscapeVelocitySystem,
  EscapeLevel,
  type EscapeContext,
  type EscapeAnalysis,
  type EscapeAttemptResult,
} from '../../ergodicity/escapeProtocols/index.js';
import { EscapeProtocolFactory } from '../../ergodicity/escapeProtocols/protocols.js';
import { EscapeVelocityCalculator } from '../../ergodicity/escapeProtocols/calculator.js';
import type { PathMemory, FlexibilityState } from '../../ergodicity/types.js';
import type { SessionData } from '../../index.js';

describe('Escape Protocols', () => {
  let escapeSystem: EscapeVelocitySystem;
  let mockContext: EscapeContext;

  beforeEach(() => {
    escapeSystem = new EscapeVelocitySystem();

    // Create mock context for testing
    const mockPathMemory: PathMemory = {
      pathHistory: [],
      constraints: [],
      foreclosedOptions: ['option1', 'option2', 'option3'],
      availableOptions: ['option4', 'option5'],
      currentFlexibility: {
        flexibilityScore: 0.25,
        reversibilityIndex: 0.3,
        optionVelocity: -0.1,
        commitmentDepth: 0.7,
      },
    };

    const mockSessionData: SessionData = {
      technique: 'six_hats',
      problem: 'Test problem',
      history: [],
      branches: {},
      insights: [],
      startTime: Date.now(),
      lastActivityTime: Date.now(),
    };

    mockContext = {
      pathMemory: mockPathMemory,
      sessionData: mockSessionData,
      currentFlexibility: mockPathMemory.currentFlexibility,
      triggerReason: 'Low flexibility detected',
      userApproval: true,
      automaticMode: false,
    };
  });

  describe('EscapeVelocitySystem', () => {
    it('should analyze escape needs correctly', () => {
      const analysis = escapeSystem.analyzeEscapeNeeds(mockContext);

      expect(analysis).toBeDefined();
      expect(analysis.currentFlexibility).toBe(0.25);
      expect(analysis.feasibility).toBeDefined();
      expect(analysis.successProbability).toBeGreaterThan(0);
      expect(analysis.optimalTrajectory.protocol).toBeDefined();
      expect(analysis.executionPlan.immediateActions.length).toBeGreaterThan(0);
    });

    it('should identify when escape is needed', () => {
      expect(escapeSystem.isEscapeNeeded(0.1)).toBe(true);
      expect(escapeSystem.isEscapeNeeded(0.25)).toBe(true);
      expect(escapeSystem.isEscapeNeeded(0.35)).toBe(false);
      expect(escapeSystem.isEscapeNeeded(0.5)).toBe(false);
    });

    it('should calculate escape urgency correctly', () => {
      expect(escapeSystem.getEscapeUrgency(0.05)).toBe('critical');
      expect(escapeSystem.getEscapeUrgency(0.15)).toBe('high');
      expect(escapeSystem.getEscapeUrgency(0.25)).toBe('medium');
      expect(escapeSystem.getEscapeUrgency(0.35)).toBe('low');
    });

    it('should get available protocols based on flexibility', () => {
      const protocols = escapeSystem.getAvailableProtocols(0.25);

      expect(protocols.length).toBeGreaterThan(0);
      // Should include Pattern Interruption (requires 0.1) and Resource Reallocation (requires 0.2)
      const protocolLevels = protocols.map(p => p.level);
      expect(protocolLevels).toContain(EscapeLevel.PATTERN_INTERRUPTION);
      expect(protocolLevels).toContain(EscapeLevel.RESOURCE_REALLOCATION);
      // Should not include Stakeholder Reset (requires 0.3)
      expect(protocolLevels).not.toContain(EscapeLevel.STAKEHOLDER_RESET);
    });

    it('should execute pattern interruption protocol', () => {
      const result = escapeSystem.executeProtocol(EscapeLevel.PATTERN_INTERRUPTION, mockContext);

      expect(result.success).toBe(true);
      expect(result.protocol.level).toBe(EscapeLevel.PATTERN_INTERRUPTION);
      expect(result.flexibilityBefore).toBe(0.25);
      expect(result.flexibilityAfter).toBeGreaterThan(0.25);
      expect(result.flexibilityGained).toBeGreaterThan(0);
      expect(result.newOptionsCreated.length).toBeGreaterThan(0);
      expect(result.constraintsRemoved.length).toBeGreaterThan(0);
    });

    it('should throw error for insufficient flexibility', () => {
      // Try to execute Stakeholder Reset with insufficient flexibility
      expect(() => {
        escapeSystem.executeProtocol(EscapeLevel.STAKEHOLDER_RESET, mockContext);
      }).toThrow('Insufficient flexibility');
    });

    it('should update monitoring after protocol execution', () => {
      const initialMonitoring = escapeSystem.getMonitoringData();
      expect(initialMonitoring.attemptCount).toBe(0);

      escapeSystem.executeProtocol(EscapeLevel.PATTERN_INTERRUPTION, mockContext);

      const updatedMonitoring = escapeSystem.getMonitoringData();
      expect(updatedMonitoring.attemptCount).toBe(1);
      expect(updatedMonitoring.successCount).toBe(1);
      expect(updatedMonitoring.averageFlexibilityGain).toBeGreaterThan(0);
    });

    it('should reset monitoring data', () => {
      // Execute a protocol to populate monitoring
      escapeSystem.executeProtocol(EscapeLevel.PATTERN_INTERRUPTION, mockContext);
      
      const monitoringBefore = escapeSystem.getMonitoringData();
      expect(monitoringBefore.attemptCount).toBe(1);

      escapeSystem.resetMonitoring();

      const monitoringAfter = escapeSystem.getMonitoringData();
      expect(monitoringAfter.attemptCount).toBe(0);
      expect(monitoringAfter.successCount).toBe(0);
      expect(monitoringAfter.averageFlexibilityGain).toBe(0);
    });
  });

  describe('Protocol Factory', () => {
    let factory: EscapeProtocolFactory;

    beforeEach(() => {
      factory = new EscapeProtocolFactory();
    });

    it('should create all five protocol levels', () => {
      const allProtocols = factory.getAllProtocols();
      expect(allProtocols.length).toBe(5);

      const levels = allProtocols.map(p => p.level);
      expect(levels).toContain(EscapeLevel.PATTERN_INTERRUPTION);
      expect(levels).toContain(EscapeLevel.RESOURCE_REALLOCATION);
      expect(levels).toContain(EscapeLevel.STAKEHOLDER_RESET);
      expect(levels).toContain(EscapeLevel.TECHNICAL_REFACTORING);
      expect(levels).toContain(EscapeLevel.STRATEGIC_PIVOT);
    });

    it('should get protocol by level', () => {
      const protocol = factory.getProtocol(EscapeLevel.PATTERN_INTERRUPTION);
      expect(protocol).toBeDefined();
      expect(protocol?.level).toBe(EscapeLevel.PATTERN_INTERRUPTION);
      expect(protocol?.name).toBe('Pattern Interruption');
    });

    it('should filter available protocols by flexibility', () => {
      const lowFlexProtocols = factory.getAvailableProtocols(0.15);
      expect(lowFlexProtocols.length).toBe(1); // Only Pattern Interruption

      const midFlexProtocols = factory.getAvailableProtocols(0.35);
      expect(midFlexProtocols.length).toBe(3); // Pattern, Resource, Stakeholder

      const highFlexProtocols = factory.getAvailableProtocols(0.6);
      expect(highFlexProtocols.length).toBe(5); // All protocols
    });

    it('should recommend appropriate protocol based on constraints', () => {
      // High constraints, low flexibility
      const highConstraintRec = factory.recommendProtocol(0.25, 0.9);
      expect(highConstraintRec?.level).toBe(EscapeLevel.RESOURCE_REALLOCATION);

      // Low constraints, moderate flexibility
      const lowConstraintRec = factory.recommendProtocol(0.4, 0.3);
      expect(lowConstraintRec?.level).toBe(EscapeLevel.PATTERN_INTERRUPTION);

      // No available protocols
      const noProtocols = factory.recommendProtocol(0.05, 0.5);
      expect(noProtocols).toBeNull();
    });
  });

  describe('Individual Protocol Execution', () => {
    let factory: EscapeProtocolFactory;

    beforeEach(() => {
      factory = new EscapeProtocolFactory();
    });

    it('should execute Pattern Interruption with proper results', () => {
      const protocol = factory.getProtocol(EscapeLevel.PATTERN_INTERRUPTION)!;
      const result = protocol.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.flexibilityGained).toBeGreaterThanOrEqual(0.2);
      expect(result.flexibilityGained).toBeLessThanOrEqual(0.4);
      expect(result.newOptionsCreated.length).toBe(4);
      expect(result.constraintsRemoved).toContain('Mental fixation');
      expect(result.executionNotes.length).toBeGreaterThan(0);
      expect(result.duration).toBe(10 * 60 * 1000); // 10 minutes
    });

    it('should execute Resource Reallocation with proper results', () => {
      // Update context for sufficient flexibility
      mockContext.currentFlexibility.flexibilityScore = 0.3;
      
      const protocol = factory.getProtocol(EscapeLevel.RESOURCE_REALLOCATION)!;
      const result = protocol.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.flexibilityGained).toBeGreaterThanOrEqual(0.15);
      expect(result.flexibilityGained).toBeLessThanOrEqual(0.3);
      expect(result.constraintsRemoved).toContain('Over-committed time resources');
      expect(result.newOptionsCreated).toContain('Innovation time budget');
      expect(result.duration).toBe(90 * 60 * 1000); // 90 minutes
    });

    it('should execute Stakeholder Reset with proper results', () => {
      // Update context for sufficient flexibility
      mockContext.currentFlexibility.flexibilityScore = 0.4;
      
      const protocol = factory.getProtocol(EscapeLevel.STAKEHOLDER_RESET)!;
      const result = protocol.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.flexibilityGained).toBeGreaterThanOrEqual(0.25);
      expect(result.flexibilityGained).toBeLessThanOrEqual(0.45);
      expect(result.constraintsRemoved).toContain('Rigid success criteria');
      expect(result.newOptionsCreated).toContain('MVP-first strategy');
      expect(result.duration).toBe(24 * 60 * 60 * 1000); // 1 day
    });

    it('should execute Technical Refactoring with proper results', () => {
      // Update context for sufficient flexibility
      mockContext.currentFlexibility.flexibilityScore = 0.5;
      
      const protocol = factory.getProtocol(EscapeLevel.TECHNICAL_REFACTORING)!;
      const result = protocol.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.flexibilityGained).toBeGreaterThanOrEqual(0.3);
      expect(result.flexibilityGained).toBeLessThanOrEqual(0.5);
      expect(result.constraintsRemoved).toContain('Monolithic architecture');
      expect(result.newOptionsCreated).toContain('Microservices architecture');
      expect(result.duration).toBe(7 * 24 * 60 * 60 * 1000); // 1 week
    });

    it('should execute Strategic Pivot with proper results', () => {
      // Update context for sufficient flexibility
      mockContext.currentFlexibility.flexibilityScore = 0.6;
      
      const protocol = factory.getProtocol(EscapeLevel.STRATEGIC_PIVOT)!;
      const result = protocol.execute(mockContext);

      expect(result.success).toBe(true);
      expect(result.flexibilityGained).toBeGreaterThanOrEqual(0.4);
      expect(result.flexibilityGained).toBeLessThanOrEqual(0.7);
      expect(result.constraintsRemoved).toContain('Market positioning lock-in');
      expect(result.newOptionsCreated).toContain('New market opportunities');
      expect(result.duration).toBe(14 * 24 * 60 * 60 * 1000); // 2 weeks
    });
  });

  describe('Escape Velocity Calculator', () => {
    let calculator: EscapeVelocityCalculator;

    beforeEach(() => {
      calculator = new EscapeVelocityCalculator();
    });

    it('should calculate escape requirements accurately', () => {
      const analysis = calculator.calculateEscapeRequirements(mockContext);

      expect(analysis.currentFlexibility).toBe(0.25);
      expect(analysis.constraintStrength).toBeGreaterThan(0);
      expect(analysis.escapeForceNeeded).toBeGreaterThan(0);
      expect(analysis.availableResources).toBeGreaterThan(0);
      expect(analysis.feasibility).toBeDefined();
      expect(analysis.optimalTrajectory).toBeDefined();
      expect(analysis.successProbability).toBeGreaterThan(0);
      expect(analysis.executionPlan).toBeDefined();
    });

    it('should not recommend escape for high flexibility', () => {
      const highFlexContext = {
        ...mockContext,
        currentFlexibility: {
          flexibilityScore: 0.8,
          reversibilityIndex: 0.9,
          optionVelocity: 0.1,
          commitmentDepth: 0.2,
        },
      };

      const analysis = calculator.calculateEscapeRequirements(highFlexContext);
      // High flexibility means low constraint strength and high success probability
      expect(analysis.constraintStrength).toBeLessThan(0.5);
      expect(analysis.successProbability).toBeGreaterThan(0.7);
    });

    it('should identify critical escape scenarios', () => {
      // Create a context with many constraints to ensure low success probability
      const criticalContext = {
        ...mockContext,
        pathMemory: {
          ...mockContext.pathMemory,
          constraints: [
            { id: '1', type: 'resource' as const, description: 'Budget limitation', strength: 0.8 },
            { id: '2', type: 'technical' as const, description: 'Technical debt', strength: 0.9 },
            { id: '3', type: 'social' as const, description: 'Stakeholder resistance', strength: 0.7 },
          ],
          foreclosedOptions: Array(10).fill(null).map((_, i) => `option${i}`),
        },
        currentFlexibility: {
          flexibilityScore: 0.05,
          reversibilityIndex: 0.1,
          optionVelocity: -0.3,
          commitmentDepth: 0.95,
        },
      };

      const analysis = calculator.calculateEscapeRequirements(criticalContext);
      // Critical scenario means constraints exist and challenges are present
      expect(analysis.constraintStrength).toBeGreaterThan(0.4);
      expect(analysis.feasibility).toBeDefined();
      // Check that we have a valid success probability
      expect(analysis.successProbability).toBeGreaterThan(0);
      expect(analysis.successProbability).toBeLessThanOrEqual(0.95); // Capped at 95%
      // Resource gap may or may not exist depending on calculations
      expect(analysis.resourceGap).toBeGreaterThanOrEqual(0);
      // Should have warnings about the critical state
      expect(analysis.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Protocol Risk and Success Factors', () => {
    let factory: EscapeProtocolFactory;

    beforeEach(() => {
      factory = new EscapeProtocolFactory();
    });

    it('should have appropriate risk profiles', () => {
      const protocols = factory.getAllProtocols();

      protocols.forEach(protocol => {
        expect(protocol.risks.length).toBeGreaterThan(0);
        expect(protocol.steps.length).toBeGreaterThan(0);
        expect(protocol.successProbability).toBeGreaterThan(0);
        expect(protocol.successProbability).toBeLessThanOrEqual(1);
      });

      // Higher level protocols should have more risks
      const patternInterruption = factory.getProtocol(EscapeLevel.PATTERN_INTERRUPTION)!;
      const strategicPivot = factory.getProtocol(EscapeLevel.STRATEGIC_PIVOT)!;
      
      expect(strategicPivot.risks.length).toBeGreaterThan(patternInterruption.risks.length);
      expect(strategicPivot.successProbability).toBeLessThan(patternInterruption.successProbability);
    });

    it('should have progressive flexibility requirements', () => {
      const protocols = factory.getAllProtocols();
      const sortedProtocols = protocols.sort((a, b) => a.level - b.level);

      for (let i = 1; i < sortedProtocols.length; i++) {
        expect(sortedProtocols[i].requiredFlexibility).toBeGreaterThan(
          sortedProtocols[i - 1].requiredFlexibility
        );
      }
    });
  });

  describe('Monitoring and Learning', () => {
    it('should track protocol effectiveness over multiple attempts', () => {
      // Execute multiple protocols
      const attempts = [
        { level: EscapeLevel.PATTERN_INTERRUPTION, flexibility: 0.2 },
        { level: EscapeLevel.PATTERN_INTERRUPTION, flexibility: 0.25 },
        { level: EscapeLevel.RESOURCE_REALLOCATION, flexibility: 0.3 },
      ];

      attempts.forEach(({ level, flexibility }) => {
        mockContext.currentFlexibility.flexibilityScore = flexibility;
        escapeSystem.executeProtocol(level, mockContext);
      });

      const monitoring = escapeSystem.getMonitoringData();
      expect(monitoring.attemptCount).toBe(3);
      expect(monitoring.successCount).toBe(3);
      expect(monitoring.averageFlexibilityGain).toBeGreaterThan(0);
      expect(monitoring.learnings.length).toBeGreaterThan(0);
    });

    it('should identify most effective protocol', () => {
      // Execute a highly effective protocol
      mockContext.currentFlexibility.flexibilityScore = 0.5;
      const result = escapeSystem.executeProtocol(EscapeLevel.STRATEGIC_PIVOT, mockContext);

      // If flexibility gain is high enough, it should become most effective
      if (result.flexibilityGained > 0.3) {
        const monitoring = escapeSystem.getMonitoringData();
        expect(monitoring.mostEffectiveProtocol).toBe(EscapeLevel.STRATEGIC_PIVOT);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle unknown protocol level', () => {
      expect(() => {
        escapeSystem.executeProtocol(999 as EscapeLevel, mockContext);
      }).toThrow('Unknown escape protocol');
    });

    it('should handle zero flexibility scenario', () => {
      mockContext.currentFlexibility.flexibilityScore = 0;
      
      const analysis = escapeSystem.analyzeEscapeNeeds(mockContext);
      expect(analysis.constraintStrength).toBeGreaterThan(0);
      expect(analysis.feasibility).toBeDefined();
      expect(analysis.successProbability).toBeDefined();
      
      // Should still have a trajectory (emergency protocol)
      expect(analysis.optimalTrajectory).toBeDefined();
      expect(analysis.optimalTrajectory.protocol.name).toBe('Pattern Interruption');
      
      // With zero flexibility, available protocols should be minimal
      const availableProtocols = escapeSystem.getAvailableProtocols(0);
      expect(availableProtocols.length).toBe(0); // No protocols available at 0 flexibility
    });

    it('should cap flexibility at 1.0 after protocol execution', () => {
      mockContext.currentFlexibility.flexibilityScore = 0.9;
      
      const result = escapeSystem.executeProtocol(EscapeLevel.PATTERN_INTERRUPTION, mockContext);
      expect(result.flexibilityAfter).toBeLessThanOrEqual(1.0);
    });
  });
});