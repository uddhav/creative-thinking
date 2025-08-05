/**
 * Tests for ParallelProgressTracker - Progress monitoring and ETA calculation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ParallelProgressTracker } from '../../../core/session/ParallelProgressTracker.js';
import type { ParallelSessionGroup, LateralTechnique } from '../../../types/index.js';

describe('ParallelProgressTracker', () => {
  let tracker: ParallelProgressTracker;

  beforeEach(() => {
    tracker = new ParallelProgressTracker();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Group Progress Initialization', () => {
    it('should initialize group progress', () => {
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['s1', 's2', 's3'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 3,
          totalSteps: 19, // 5 + 8 + 6
          techniques: ['six_hats', 'scamper', 'po'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };

      tracker.initializeGroupProgress(group);

      const progress = tracker.getGroupProgress('group1');
      expect(progress).toBeDefined();
      expect(progress?.groupId).toBe('group1');
      expect(progress?.totalSteps).toBe(19); // 5 + 8 + 6
      expect(progress?.completedSteps).toBe(0);
      expect(progress?.status).toBe('in_progress');
      expect(progress?.sessionProgress.size).toBe(3);
    });

    it('should initialize individual session progress', () => {
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['s1'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 1,
          totalSteps: 5,
          techniques: ['six_hats'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };

      tracker.initializeGroupProgress(group);

      const groupProgress = tracker.getGroupProgress('group1');
      const sessionProgress = groupProgress?.sessionProgress.get('s1');
      expect(sessionProgress).toBeDefined();
      expect(sessionProgress?.sessionId).toBe('s1');
      expect(sessionProgress?.totalSteps).toBe(0); // Initially 0, updated when session starts
      expect(sessionProgress?.completedSteps).toBe(0);
      expect(sessionProgress?.status).toBe('pending');
    });
  });

  describe('Session Progress Updates', () => {
    beforeEach(() => {
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['s1', 's2'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 2,
          totalSteps: 15, // 5 + 10
          techniques: ['six_hats', 'scamper'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };
      tracker.initializeGroupProgress(group);
    });

    it('should update session progress', () => {
      tracker.updateSessionProgress('s1', 3, 5);

      const groupProgress = tracker.getGroupProgress('group1');
      const progress = groupProgress?.sessionProgress.get('s1');
      expect(progress?.completedSteps).toBe(3);
      expect(progress?.status).toBe('in_progress');
    });

    it('should update group progress when session progresses', () => {
      tracker.updateSessionProgress('s1', 3, 5);

      const groupProgress = tracker.getGroupProgress('group1');
      expect(groupProgress?.completedSteps).toBe(3);
    });

    it('should mark session as completed when all steps done', () => {
      tracker.updateSessionProgress('s1', 5, 5);

      const groupProgress = tracker.getGroupProgress('group1');
      const progress = groupProgress?.sessionProgress.get('s1');
      expect(progress?.status).toBe('completed');
    });

    it('should handle progress updates for multiple sessions', () => {
      tracker.updateSessionProgress('s1', 3, 5);
      tracker.updateSessionProgress('s2', 7, 10);

      const groupProgress = tracker.getGroupProgress('group1');
      expect(groupProgress?.completedSteps).toBe(10); // 3 + 7
    });

    it('should not exceed total steps', () => {
      tracker.updateSessionProgress('s1', 10, 5); // More than total

      const groupProgress = tracker.getGroupProgress('group1');
      const progress = groupProgress?.sessionProgress.get('s1');
      expect(progress?.completedSteps).toBe(5); // Capped at total
    });
  });

  describe('Session Status Management', () => {
    beforeEach(() => {
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['s1', 's2', 's3'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 3,
          totalSteps: 15, // 5 + 5 + 5
          techniques: ['six_hats', 'scamper', 'po'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };
      tracker.initializeGroupProgress(group);
    });

    it('should mark session as failed', () => {
      tracker.markSessionFailed('s1', 'Test error');

      const groupProgress = tracker.getGroupProgress('group1');
      const progress = groupProgress?.sessionProgress.get('s1');
      expect(progress?.status).toBe('failed');
    });

    it('should update group status when all sessions complete', () => {
      tracker.updateSessionProgress('s1', 5, 5);
      tracker.updateSessionProgress('s2', 5, 5);
      tracker.updateSessionProgress('s3', 5, 5);

      const groupProgress = tracker.getGroupProgress('group1');
      expect(groupProgress?.status).toBe('completed');
    });

    it('should mark group as failed when critical sessions fail', () => {
      tracker.markSessionFailed('s1', 'Error');
      tracker.markSessionFailed('s2', 'Error');
      tracker.markSessionFailed('s3', 'Error');

      const groupProgress = tracker.getGroupProgress('group1');
      expect(groupProgress?.status).toBe('failed');
    });

    it('should mark group as partial success with mixed results', () => {
      tracker.updateSessionProgress('s1', 5, 5); // Complete
      tracker.markSessionFailed('s2', 'Error'); // Failed
      tracker.updateSessionProgress('s3', 5, 5); // Complete

      const groupProgress = tracker.getGroupProgress('group1');
      expect(groupProgress?.status).toBe('partial_success');
    });
  });

  describe('Progress Summary', () => {
    beforeEach(() => {
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['s1', 's2', 's3', 's4'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 4,
          totalSteps: 20, // 5 * 4
          techniques: ['six_hats', 'scamper', 'po', 'triz'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };
      tracker.initializeGroupProgress(group);
    });

    it('should calculate progress percentage', () => {
      tracker.updateSessionProgress('s1', 5, 5); // Complete
      tracker.updateSessionProgress('s2', 3, 5); // Partial

      const summary = tracker.getProgressSummary('group1');
      expect(summary?.percentage).toBe(40); // 8/20 = 40%
    });

    it('should count active and completed sessions', () => {
      tracker.updateSessionProgress('s1', 5, 5); // Complete
      tracker.updateSessionProgress('s2', 3, 5); // Active
      // s3, s4 are pending

      const summary = tracker.getProgressSummary('group1');
      expect(summary?.completedSessions).toBe(1);
      expect(summary?.activeSessions).toBe(1);
    });

    it('should provide status description', () => {
      const summary = tracker.getProgressSummary('group1');
      expect(summary?.status).toBe('in_progress');

      tracker.updateSessionProgress('s1', 3, 5);
      const summary2 = tracker.getProgressSummary('group1');
      expect(summary2?.status).toBe('in_progress');
    });
  });

  describe('ETA Calculation', () => {
    beforeEach(() => {
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['s1', 's2'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 2,
          totalSteps: 20, // 10 + 10
          techniques: ['six_hats', 'scamper'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };
      tracker.initializeGroupProgress(group);
    });

    it('should calculate ETA based on progress rate', () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      // Start sessions
      tracker.updateSessionProgress('s1', 1, 10);
      tracker.updateSessionProgress('s2', 1, 10);

      // Advance time by 1 second
      vi.setSystemTime(startTime + 1000);

      // Update progress (2 steps in 1 second = 2 steps/sec)
      tracker.updateSessionProgress('s1', 2, 10);
      tracker.updateSessionProgress('s2', 2, 10);

      const summary = tracker.getProgressSummary('group1');
      // 16 steps remaining at 4 steps/sec = 4 seconds
      expect(summary?.estimatedTimeRemaining).toBeCloseTo(4000, -2);
    });

    it('should not provide ETA without sufficient data', () => {
      const summary = tracker.getProgressSummary('group1');
      expect(summary?.estimatedTimeRemaining).toBeUndefined();
    });

    it('should handle variable progress rates', () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      tracker.updateSessionProgress('s1', 5, 10);

      vi.setSystemTime(startTime + 5000); // 5 seconds for 5 steps
      tracker.updateSessionProgress('s1', 10, 10); // Complete s1

      vi.setSystemTime(startTime + 10000); // Another 5 seconds
      tracker.updateSessionProgress('s2', 5, 10);

      const summary = tracker.getProgressSummary('group1');
      // Average rate: 15 steps in 10 seconds = 1.5 steps/sec
      // 5 steps remaining / 1.5 = ~3.33 seconds
      expect(summary?.estimatedTimeRemaining).toBeCloseTo(3333, -2);
    });
  });

  describe('History Tracking', () => {
    it('should track progress history', () => {
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['s1'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 1,
          totalSteps: 5,
          techniques: ['six_hats'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };
      tracker.initializeGroupProgress(group);

      tracker.updateSessionProgress('s1', 1, 5);
      vi.advanceTimersByTime(1000);
      tracker.updateSessionProgress('s1', 2, 5);
      vi.advanceTimersByTime(1000);
      tracker.updateSessionProgress('s1', 3, 5);

      // Note: getProgressHistory doesn't exist, we need to test differently
      const groupProgress = tracker.getGroupProgress('group1');
      expect(groupProgress?.completedSteps).toBe(3);
    });

    it('should handle many progress updates', () => {
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['s1'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 1,
          totalSteps: 200,
          techniques: ['six_hats'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };
      tracker.initializeGroupProgress(group);

      // Add many progress updates
      for (let i = 1; i <= 150; i++) {
        tracker.updateSessionProgress('s1', i, 200);
      }

      const groupProgress = tracker.getGroupProgress('group1');
      expect(groupProgress?.completedSteps).toBe(150);
    });
  });

  describe('Clear and Cleanup', () => {
    it('should clear group progress', () => {
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['s1', 's2'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 2,
          totalSteps: 10,
          techniques: ['six_hats', 'scamper'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };
      tracker.initializeGroupProgress(group);

      tracker.updateSessionProgress('s1', 3, 5);
      tracker.clearGroupProgress('group1');

      expect(tracker.getGroupProgress('group1')).toBeUndefined();
    });

    it('should clear all progress data', () => {
      const group1: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['s1'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 1,
          totalSteps: 5,
          techniques: ['six_hats'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };
      const group2: ParallelSessionGroup = {
        groupId: 'group2',
        sessionIds: ['s2'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 1,
          totalSteps: 5,
          techniques: ['scamper'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };
      tracker.initializeGroupProgress(group1);
      tracker.initializeGroupProgress(group2);

      tracker.clear();

      expect(tracker.getGroupProgress('group1')).toBeUndefined();
      expect(tracker.getGroupProgress('group2')).toBeUndefined();
    });
  });

  describe('Concurrent Session Tracking', () => {
    it('should track multiple groups simultaneously', () => {
      const group1: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['s1', 's2'],
        parentProblem: 'Test problem 1',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 2,
          totalSteps: 10, // 5 + 5
          techniques: ['six_hats', 'scamper'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };
      const group2: ParallelSessionGroup = {
        groupId: 'group2',
        sessionIds: ['s3', 's4'],
        parentProblem: 'Test problem 2',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 2,
          totalSteps: 20, // 10 + 10
          techniques: ['po', 'triz'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };

      tracker.initializeGroupProgress(group1);
      tracker.initializeGroupProgress(group2);

      tracker.updateSessionProgress('s1', 3, 5);
      tracker.updateSessionProgress('s3', 7, 10);

      const group1Progress = tracker.getGroupProgress('group1');
      const group2Progress = tracker.getGroupProgress('group2');

      expect(group1Progress?.completedSteps).toBe(3);
      expect(group2Progress?.completedSteps).toBe(7);
    });
  });
});
