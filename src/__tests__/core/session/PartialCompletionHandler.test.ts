/**
 * Tests for PartialCompletionHandler - Partial completion strategies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PartialCompletionHandler } from '../../../core/session/PartialCompletionHandler.js';
import { SessionManager } from '../../../core/SessionManager.js';
import type { ParallelSessionGroup, SessionData } from '../../../types/index.js';

// Mock SessionManager
vi.mock('../../../core/SessionManager.js', () => ({
  SessionManager: vi.fn().mockImplementation(() => {
    const getSession = vi.fn();
    const updateParallelGroupStatus = vi.fn();
    return {
      getSession,
      updateParallelGroupStatus,
    };
  }),
}));

describe('PartialCompletionHandler', () => {
  let handler: PartialCompletionHandler;
  let mockSessionManager: SessionManager;
  let getSessionMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = new PartialCompletionHandler();
    mockSessionManager = new SessionManager();
    // Accessing the method directly and casting it
    const manager = mockSessionManager as any;
    getSessionMock = manager.getSession;
  });

  function createMockGroup(
    sessionIds: string[],
    completedIds: string[] = []
  ): ParallelSessionGroup {
    return {
      groupId: 'group_test',
      sessionIds,
      parentProblem: 'Test problem',
      executionMode: 'parallel',
      status: 'active',
      startTime: Date.now(),
      completedSessions: new Set(completedIds),
      metadata: {
        totalPlans: sessionIds.length,
        totalSteps: sessionIds.length * 5,
        techniques: ['six_hats', 'scamper', 'po'],
        startTime: Date.now(),
      },
    };
  }

  function createMockSession(
    sessionId: string,
    technique: string = 'six_hats',
    dependsOn: string[] = []
  ): SessionData {
    return {
      technique: technique as any,
      problem: 'Test problem',
      history: [],
      branches: {},
      insights: ['Insight 1', 'Insight 2'],
      lastActivityTime: Date.now(),
      dependsOn,
    };
  }

  describe('Strategy Determination', () => {
    it('should abort when completion rate is too low', () => {
      const group = createMockGroup(['s1', 's2', 's3', 's4'], ['s1']);
      const failedSessions = new Set(['s2', 's3']);

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      expect(result.strategy).toBe('abort_group');
      expect(result.canContinue).toBe(false);
    });

    it('should proceed with available when sufficient sessions complete', () => {
      const group = createMockGroup(['s1', 's2', 's3', 's4'], ['s1', 's2', 's3']);
      const failedSessions = new Set(['s4']);

      // Mock session data with different techniques for diversity
      getSessionMock.mockImplementation((id: string) => {
        if (id === 's1') return createMockSession(id, 'six_hats');
        if (id === 's2') return createMockSession(id, 'scamper');
        if (id === 's3') return createMockSession(id, 'po');
        return undefined;
      });

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      expect(result.strategy).toBe('proceed_with_available');
      expect(result.canContinue).toBe(true); // Now has 3 different techniques
      expect(result.availableResults).toHaveLength(3);
    });

    it('should retry critical sessions when they fail', () => {
      const group = createMockGroup(['s1', 's2', 's3', 's4', 's5'], ['s1', 's3', 's4']);
      const failedSessions = new Set(['s2']);

      // Mock s2 as critical (>30% of sessions depend on it)
      getSessionMock.mockImplementation((id: string) => {
        // s3, s4, s5 all depend on s2 (3/5 = 60% > 30% threshold)
        if (['s3', 's4', 's5'].includes(id)) {
          return createMockSession(id, 'po', ['s2']);
        }
        if (id === 's1') return createMockSession(id, 'six_hats');
        return createMockSession(id);
      });

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      expect(result.strategy).toBe('retry_critical');
      expect(result.canContinue).toBe(false);
      expect(result.retryPlanIds).toContain('s2');
    });

    it('should use fallback convergence when partial results are insufficient', () => {
      const group = createMockGroup(['s1', 's2', 's3', 's4'], ['s1', 's2']);
      const failedSessions = new Set(['s3', 's4']);

      // Set convergence options that require more sessions than we have
      group.convergenceOptions = {
        convergencePlan: {
          planId: 'conv_plan',
          sessionId: 'conv_session',
          technique: 'convergence',
          totalSteps: 3,
          metadata: {
            minSessionsRequired: 3, // Requires 3 but only have 2 completed
            minTechniquesRequired: 2,
          },
        },
      };

      getSessionMock.mockImplementation((id: string) => {
        if (id === 's1') return createMockSession(id, 'six_hats');
        if (id === 's2') return createMockSession(id, 'scamper');
        return undefined;
      });

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      expect(result.strategy).toBe('fallback_convergence');
      expect(result.canContinue).toBe(true);
      expect(result.fallbackPlan).toBeDefined();
      expect(result.fallbackPlan?.technique).toBe('convergence');
    });
  });

  describe('Critical Session Detection', () => {
    it('should identify critical sessions based on dependencies', () => {
      const group = createMockGroup(['s1', 's2', 's3', 's4', 's5'], ['s2', 's3', 's4']);
      const failedSessions = new Set(['s1']);

      // Make s1 critical - many sessions depend on it
      getSessionMock.mockImplementation((id: string) => {
        if (['s2', 's3', 's4'].includes(id)) {
          return createMockSession(id, 'po', ['s1']);
        }
        if (id === 's5') {
          return createMockSession(id, 'six_hats', ['s1']);
        }
        return createMockSession(id);
      });

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      // Should retry s1 since it's critical
      expect(result.strategy).toBe('retry_critical');
      expect(result.retryPlanIds).toContain('s1');
    });

    it('should not consider session critical if few depend on it', () => {
      const group = createMockGroup(['s1', 's2', 's3', 's4', 's5'], ['s2', 's3', 's4']);
      const failedSessions = new Set(['s1']);

      // Only s5 depends on s1
      getSessionMock.mockImplementation((id: string) => {
        if (id === 's5') {
          return createMockSession(id, 'po', ['s1']);
        }
        return createMockSession(id);
      });

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      // Should proceed without s1 since it's not critical
      expect(result.strategy).toBe('proceed_with_available');
    });
  });

  describe('Result Collection', () => {
    it('should collect results from completed sessions', () => {
      const group = createMockGroup(['s1', 's2', 's3'], ['s1', 's2']);
      const failedSessions = new Set(['s3']);

      getSessionMock.mockImplementation((id: string) => {
        if (['s1', 's2'].includes(id)) {
          const session = createMockSession(id);
          session.history = [
            {
              technique: 'six_hats' as any,
              problem: 'Test',
              currentStep: 6,
              totalSteps: 6,
              output: 'Complete',
              nextStepNeeded: false,
              timestamp: new Date().toISOString(),
            },
          ];
          session.startTime = Date.now() - 1000;
          session.endTime = Date.now();
          return session;
        }
        return undefined;
      });

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      expect(result.availableResults).toHaveLength(2);
      expect(result.availableResults[0].status).toBe('completed');
      expect(result.availableResults[0].insights).toEqual(['Insight 1', 'Insight 2']);
      expect(result.availableResults[0].metrics?.executionTime).toBeGreaterThan(0);
    });
  });

  describe('Warnings and Recommendations', () => {
    it('should provide appropriate warnings for partial completion', () => {
      const group = createMockGroup(['s1', 's2', 's3', 's4'], ['s1', 's2']);
      const failedSessions = new Set(['s3', 's4']);

      getSessionMock.mockImplementation((id: string) => {
        if (['s1', 's2'].includes(id)) {
          return createMockSession(id);
        }
        if (['s3', 's4'].includes(id)) {
          return createMockSession(id, 'scamper');
        }
        return undefined;
      });

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      expect(result.warnings).toContain('Proceeding with 2/4 completed sessions');
      expect(result.warnings).toContain('Missing techniques: scamper');
      expect(result.warnings).toContain('Failed sessions: 2');
    });

    it('should provide recommendations based on results quality', () => {
      const group = createMockGroup(['s1', 's2'], ['s1']);
      const failedSessions = new Set(['s2']);

      getSessionMock.mockImplementation((id: string) => {
        if (id === 's1') {
          const session = createMockSession(id);
          session.insights = ['Single insight']; // Low insight count
          session.metrics = { creativityScore: 0.3 }; // Low confidence
          return session;
        }
        return undefined;
      });

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      expect(result.recommendations).toContain(
        'Limited insights available - consider manual exploration of key themes'
      );
      expect(result.recommendations).toContain(
        'Low average confidence - results should be validated carefully'
      );
    });
  });

  describe('Convergence Readiness', () => {
    it('should check minimum requirements for convergence', () => {
      const group = createMockGroup(['s1', 's2', 's3', 's4'], ['s1', 's2']);
      group.convergenceOptions = {
        convergencePlan: {
          planId: 'conv_plan',
          sessionId: 'conv_session',
          technique: 'convergence',
          totalSteps: 3,
          metadata: {
            minSessionsRequired: 3,
            minTechniquesRequired: 2,
          },
        },
      };
      const failedSessions = new Set(['s3', 's4']);

      getSessionMock.mockImplementation((id: string) => {
        if (id === 's1') return createMockSession(id, 'six_hats');
        if (id === 's2') return createMockSession(id, 'po');
        return undefined;
      });

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      // Should fail convergence - only 2 sessions < 3 required
      expect(result.strategy).toBe('fallback_convergence');
    });

    it('should check technique diversity for convergence', () => {
      const group = createMockGroup(['s1', 's2', 's3'], ['s1', 's2', 's3']);
      const failedSessions = new Set<string>();

      getSessionMock.mockImplementation((id: string) => {
        // All use same technique
        return createMockSession(id, 'six_hats');
      });

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      // Should warn about limited diversity
      expect(result.recommendations).toContain(
        'Limited technique diversity - consider additional perspectives'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle all sessions failing', () => {
      const group = createMockGroup(['s1', 's2', 's3']);
      const failedSessions = new Set(['s1', 's2', 's3']);

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      expect(result.strategy).toBe('abort_group');
      expect(result.canContinue).toBe(false);
      expect(result.availableResults).toHaveLength(0);
    });

    it('should handle no failed sessions', () => {
      const group = createMockGroup(['s1', 's2'], ['s1', 's2']);
      const failedSessions = new Set<string>();

      getSessionMock.mockImplementation((id: string) => {
        // Use different techniques to meet diversity requirement
        if (id === 's1') return createMockSession(id, 'six_hats');
        if (id === 's2') return createMockSession(id, 'scamper');
        return createMockSession(id);
      });

      const result = handler.handlePartialCompletion(group, failedSessions, mockSessionManager);

      expect(result.strategy).toBe('proceed_with_available');
      expect(result.canContinue).toBe(true);
      expect(result.availableResults).toHaveLength(2);
    });

    it('should handle custom configuration thresholds', () => {
      // Create handler with custom config
      const customHandler = new PartialCompletionHandler({
        criticalSessionThreshold: 0.1, // Very low threshold
        minimumCompletionRate: 0.9, // Very high threshold
      });

      const group = createMockGroup(['s1', 's2', 's3', 's4'], ['s1', 's2', 's3']);
      const failedSessions = new Set(['s4']);

      // Even though 75% completed, custom config requires 90%
      const result = customHandler.handlePartialCompletion(
        group,
        failedSessions,
        mockSessionManager
      );

      expect(result.strategy).toBe('abort_group');
    });
  });
});
