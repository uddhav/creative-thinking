/**
 * Tests for ParallelGroupManager - Group coordination and lifecycle
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParallelGroupManager } from '../../../core/session/ParallelGroupManager.js';
import { SessionIndex } from '../../../core/session/SessionIndex.js';
import type { ParallelPlan, LateralTechnique, SessionData } from '../../../types/index.js';

describe('ParallelGroupManager', () => {
  let manager: ParallelGroupManager;
  let sessionIndex: SessionIndex;

  beforeEach(() => {
    sessionIndex = new SessionIndex();
    manager = new ParallelGroupManager(sessionIndex);
  });

  describe('Group Creation', () => {
    it('should create a new parallel group', () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
          metadata: {
            techniqueCount: 1,
            totalSteps: 6,
            complexity: 'low',
          },
        },
        {
          planId: 'plan2',
          techniques: ['scamper'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '15 minutes',
          canExecuteIndependently: true,
          metadata: {
            techniqueCount: 1,
            totalSteps: 8,
            complexity: 'medium',
          },
        },
      ];

      const result = manager.createParallelSessionGroup('How to improve user retention?', plans);

      expect(result.groupId).toMatch(/^group_/);
      expect(result.sessionIds).toHaveLength(2);

      // Check the group was created
      const group = manager.getGroup(result.groupId);
      expect(group).toBeDefined();
      expect(group?.parentProblem).toBe('How to improve user retention?');
      expect(group?.executionMode).toBe('parallel');
      expect(group?.status).toBe('active');
      expect(group?.completedSessions).toEqual(new Set());
      expect(group?.metadata.totalPlans).toBe(2);
    });

    it('should create group with dependencies', () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
        },
        {
          planId: 'plan2',
          techniques: ['scamper'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '15 minutes',
          canExecuteIndependently: false,
          dependencies: ['plan1'],
        },
      ];

      const result = manager.createParallelSessionGroup('Test problem', plans);
      const group = manager.getGroup(result.groupId);

      expect(group).toBeDefined();
      expect(group?.sessionIds).toHaveLength(2);
    });

    it('should handle convergence options', () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
        },
      ];

      const convergenceOptions = {
        convergencePlan: {
          planId: 'conv_plan',
          sessionId: 'conv_session',
          technique: 'convergence' as LateralTechnique,
          totalSteps: 3,
        },
      };

      const result = manager.createParallelSessionGroup('Test problem', plans, convergenceOptions);

      const group = manager.getGroup(result.groupId);
      expect(group?.convergenceOptions).toBeDefined();
      expect(group?.convergenceOptions?.convergencePlan.planId).toBe('conv_plan');
    });

    it('should handle empty plan list', () => {
      expect(() => {
        manager.createParallelSessionGroup('Test problem', []);
      }).toThrow('Cannot create group with no plans');
    });
  });

  describe('Group Retrieval', () => {
    it('should retrieve an existing group', () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
        },
      ];

      const result = manager.createParallelSessionGroup('Test', plans);
      const retrieved = manager.getGroup(result.groupId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.groupId).toBe(result.groupId);
    });

    it('should return undefined for non-existent group', () => {
      const group = manager.getGroup('non-existent-id');
      expect(group).toBeUndefined();
    });

    it('should list active groups', () => {
      const plans1: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
        },
      ];
      const plans2: ParallelPlan[] = [
        {
          planId: 'plan2',
          techniques: ['scamper'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '15 minutes',
          canExecuteIndependently: true,
        },
      ];

      manager.createParallelSessionGroup('Test 1', plans1);
      manager.createParallelSessionGroup('Test 2', plans2);

      const groups = manager.getActiveGroups();
      expect(groups).toHaveLength(2);
    });

    it('should handle completed groups', () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
        },
      ];

      const result = manager.createParallelSessionGroup('Test 1', plans);

      // Update group status
      manager.updateGroupStatus(result.groupId, 'completed');

      const activeGroups = manager.getActiveGroups();
      expect(activeGroups).toHaveLength(0);
    });
  });

  describe('Session Completion', () => {
    it('should mark session as complete', () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
        },
        {
          planId: 'plan2',
          techniques: ['scamper'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '15 minutes',
          canExecuteIndependently: true,
        },
      ];

      const sessions = new Map<string, SessionData>();
      const result = manager.createParallelSessionGroup('Test', plans, undefined, sessions);
      const group = manager.getGroup(result.groupId);

      // Create a mock session
      const sessionData: SessionData = {
        technique: 'six_hats',
        problem: 'Test',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
        parallelGroupId: result.groupId,
      };
      sessions.set(result.sessionIds[0], sessionData);

      // Mark session complete
      manager.markSessionComplete(result.sessionIds[0], sessions);

      expect(group?.completedSessions.has(result.sessionIds[0])).toBe(true);
    });

    it('should update group status when all sessions complete', () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
        },
        {
          planId: 'plan2',
          techniques: ['scamper'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '15 minutes',
          canExecuteIndependently: true,
        },
      ];

      const sessions = new Map<string, SessionData>();
      const result = manager.createParallelSessionGroup('Test', plans, undefined, sessions);
      const group = manager.getGroup(result.groupId);

      // Create mock sessions
      result.sessionIds.forEach((sessionId, index) => {
        const sessionData: SessionData = {
          technique: index === 0 ? 'six_hats' : 'scamper',
          problem: 'Test',
          history: [],
          branches: {},
          insights: [],
          lastActivityTime: Date.now(),
          startTime: Date.now(),
          parallelGroupId: result.groupId,
        };
        sessions.set(sessionId, sessionData);
      });

      // Mark all sessions complete
      result.sessionIds.forEach(sessionId => {
        manager.markSessionComplete(sessionId, sessions);
      });

      expect(group?.status).toBe('completed');
    });

    it('should handle marking same session complete multiple times', () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
        },
      ];

      const sessions = new Map<string, SessionData>();
      const result = manager.createParallelSessionGroup('Test', plans, undefined, sessions);
      const group = manager.getGroup(result.groupId);

      // Create a mock session
      const sessionData: SessionData = {
        technique: 'six_hats',
        problem: 'Test',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
        parallelGroupId: result.groupId,
      };
      sessions.set(result.sessionIds[0], sessionData);

      // Mark session complete twice
      manager.markSessionComplete(result.sessionIds[0], sessions);
      manager.markSessionComplete(result.sessionIds[0], sessions);

      expect(group?.completedSessions.size).toBe(1);
    });

    it('should throw for non-existent session', () => {
      const sessions = new Map<string, SessionData>();

      expect(() => {
        manager.markSessionComplete('non-existent', sessions);
      }).toThrow();
    });

    it('should handle session without group ID', () => {
      const sessions = new Map<string, SessionData>();
      const sessionData: SessionData = {
        technique: 'six_hats',
        problem: 'Test',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
        // No parallelGroupId
      };
      sessions.set('session1', sessionData);

      // Should not throw but also not update any group
      expect(() => {
        manager.markSessionComplete('session1', sessions);
      }).not.toThrow();
    });
  });

  // Session Failure tests removed - markSessionFailed doesn't exist in ParallelGroupManager

  describe('Group Status Updates', () => {
    it('should update group status', () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
        },
      ];

      const result = manager.createParallelSessionGroup('Test', plans);
      manager.updateGroupStatus(result.groupId, 'converging');

      const group = manager.getGroup(result.groupId);
      expect(group?.status).toBe('converging');
    });

    it('should handle status update for non-existent group', () => {
      expect(() => {
        manager.updateGroupStatus('non-existent', 'completed');
      }).not.toThrow();
    });
  });

  describe('Session Start Check', () => {
    it('should check if session can start', () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
        },
        {
          planId: 'plan2',
          techniques: ['scamper'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '15 minutes',
          canExecuteIndependently: false,
          dependencies: ['plan1'],
        },
      ];

      const sessions = new Map<string, SessionData>();
      const result = manager.createParallelSessionGroup('Test', plans, undefined, sessions);

      // Session 1 can start immediately
      expect(manager.canSessionStart(result.sessionIds[0], result.groupId)).toBe(true);

      // Session 2 cannot start until session 1 is complete
      expect(manager.canSessionStart(result.sessionIds[1], result.groupId)).toBe(false);
    });
  });

  // Tests removed - methods don't exist in ParallelGroupManager:
  // - createGroup
  // - getNextSessionsToExecute

  // Tests removed - methods don't exist in ParallelGroupManager:
  // - isGroupReadyForConvergence
  // - markSessionFailed

  describe('Group Cleanup', () => {
    it('should clear all groups', () => {
      const plans: ParallelPlan[] = [
        {
          planId: 'plan1',
          techniques: ['six_hats'] as LateralTechnique[],
          workflow: [],
          estimatedTime: '10 minutes',
          canExecuteIndependently: true,
        },
      ];

      manager.createParallelSessionGroup('Test 1', plans);
      manager.createParallelSessionGroup('Test 2', plans);

      manager.clear();

      expect(manager.getActiveGroups()).toHaveLength(0);
    });
  });
});
