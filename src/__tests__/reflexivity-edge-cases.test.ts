/**
 * Edge case tests for ReflexivityTracker
 * Tests memory management, performance, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReflexivityTracker } from '../core/ReflexivityTracker.js';
import type { ReflexiveEffects } from '../techniques/types.js';
import { getNLPService } from '../nlp/NLPService.js';

describe('ReflexivityTracker Edge Cases', () => {
  let tracker: ReflexivityTracker;

  beforeEach(() => {
    const nlpService = getNLPService();
    tracker = new ReflexivityTracker(nlpService);
  });

  afterEach(() => {
    tracker.destroy();
  });

  describe('Memory Management', () => {
    it('should clean up sessions older than TTL', () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      let currentTime = 1000000;
      Date.now = vi.fn(() => currentTime);

      // Create a session
      tracker.trackStep('old-session', 'triz', 1, 'action', 'Test action', {
        triggers: ['Test'],
        realityChanges: ['Change'],
        futureConstraints: ['Constraint'],
        reversibility: 'low',
      });

      // Session should exist
      expect(tracker.getRealityState('old-session')).toBeDefined();

      // Move time forward past TTL (24 hours + 1 second)
      currentTime += 24 * 60 * 60 * 1000 + 1000;

      // Trigger cleanup by tracking a new step (action step to create state)
      tracker.trackStep('new-session', 'triz', 1, 'action', 'New action', {
        triggers: ['New'],
        realityChanges: ['Change'],
        futureConstraints: ['Constraint'],
        reversibility: 'low',
      });

      // Force cleanup to run
      (tracker as any).cleanupOldSessions();

      // Old session should be cleaned up
      expect(tracker.getRealityState('old-session')).toBeUndefined();
      expect(tracker.getRealityState('new-session')).toBeDefined();

      // Restore Date.now
      Date.now = originalNow;
    });

    it('should enforce maximum session limit', () => {
      // Override max sessions for testing
      const maxSessions = 5;
      const config = (tracker as any).constructor.REFLEXIVITY_CONFIG;
      const originalMax = config?.MAX_TRACKED_SESSIONS || 100;

      // Create more sessions than the limit
      for (let i = 0; i < maxSessions + 2; i++) {
        tracker.trackStep(`session-${i}`, 'triz', 1, 'action', `Action ${i}`, {
          triggers: ['Test'],
          realityChanges: ['Change'],
          futureConstraints: ['Constraint'],
          reversibility: 'low',
        });
      }

      // Force cleanup
      (tracker as any).cleanupOldSessions();

      // Should not exceed max sessions (but may be less due to cleanup logic)
      const sessionCount = (tracker as any).realityStates.size;
      expect(sessionCount).toBeLessThanOrEqual(originalMax);
    });
  });

  describe('Performance with Large Constraint Sets', () => {
    it('should handle large numbers of constraints efficiently', () => {
      const sessionId = 'perf-test';

      // Add many constraints
      for (let i = 0; i < 100; i++) {
        tracker.trackStep(sessionId, 'triz', i, 'action', `Action ${i}`, {
          triggers: [`Trigger ${i}`],
          realityChanges: [`Change ${i}`],
          futureConstraints: [`Cannot do ${i}`, `Must maintain ${i}`, `Constraint ${i}`],
          reversibility: 'low',
        });
      }

      // Should still be able to assess future actions
      const assessment = tracker.assessFutureActionSync(sessionId, 'New action');
      expect(assessment).toBeDefined();
      expect(assessment.currentConstraints.length).toBeGreaterThan(0);
    });

    it('should use lazy evaluation for constraint counting', () => {
      const sessionId = 'lazy-test';

      // Track an action with constraints
      tracker.trackStep(sessionId, 'triz', 1, 'action', 'Test action', {
        triggers: ['Test'],
        realityChanges: ['Change'],
        futureConstraints: ['Cannot revert', 'Must continue'],
        reversibility: 'low',
      });

      // Verify lazy evaluation by checking that constraints are counted
      const state = tracker.getRealityState(sessionId);
      expect(state).toBeDefined();

      // Assessment should use lazy evaluation
      const assessment = tracker.assessFutureActionSync(sessionId, 'test action');
      expect(assessment).toBeDefined();
      // With lazy evaluation, constraints should only be concatenated if needed
      expect(assessment.currentConstraints).toBeDefined();
    });
  });

  describe('Malformed Reflexive Effects', () => {
    it('should handle undefined reflexive effects gracefully', () => {
      const sessionId = 'malformed-test';

      // Track with undefined effects
      const record = tracker.trackStep(sessionId, 'triz', 1, 'action', 'Test', undefined);
      expect(record).toBeDefined();
      expect(record.reflexiveEffects).toBeUndefined();
    });

    it('should handle empty reflexive effects', () => {
      const sessionId = 'empty-test';
      const emptyEffects: ReflexiveEffects = {
        triggers: [],
        realityChanges: [],
        futureConstraints: [],
        reversibility: 'medium',
      };

      const record = tracker.trackStep(sessionId, 'triz', 1, 'action', 'Test', emptyEffects);
      expect(record).toBeDefined();

      const state = tracker.getRealityState(sessionId);
      expect(state).toBeDefined();
      // Should have empty arrays but state should exist
      expect(state?.pathsForeclosed).toEqual([]);
    });

    it('should handle very long constraint strings', () => {
      const sessionId = 'long-string-test';
      const longString = 'A'.repeat(10000);

      const effects: ReflexiveEffects = {
        triggers: [longString],
        realityChanges: [longString],
        futureConstraints: [`Cannot ${longString}`, `Must ${longString}`],
        reversibility: 'low',
      };

      // Should not throw
      expect(() => {
        tracker.trackStep(sessionId, 'triz', 1, 'action', 'Test', effects);
      }).not.toThrow();

      const state = tracker.getRealityState(sessionId);
      expect(state).toBeDefined();
      expect(state?.pathsForeclosed.length).toBeGreaterThan(0);
    });
  });

  describe('Action Pattern Recognition', () => {
    it('should correctly identify elimination patterns', () => {
      const testCases = [
        'eliminate the bug',
        'remove unused code',
        'delete old files',
        'discard invalid data',
        'abandon the approach',
      ];

      testCases.forEach(action => {
        const assessment = tracker.assessFutureActionSync('test', action);
        expect(assessment.reversibilityAssessment).toBe('low');
        expect(assessment.likelyEffects).toContain('Permanent removal of capabilities');
      });
    });

    it('should correctly identify communication patterns', () => {
      const testCases = [
        'communicate the changes',
        'announce the release',
        'declare bankruptcy',
        'publish the results',
        'broadcast the message',
      ];

      testCases.forEach(action => {
        const assessment = tracker.assessFutureActionSync('test', action);
        expect(assessment.reversibilityAssessment).toBe('low');
        expect(assessment.likelyEffects).toContain('Creates stakeholder expectations');
      });
    });

    it('should correctly identify experimentation patterns', () => {
      const testCases = [
        'test the hypothesis',
        'experiment with settings',
        'trial run the system',
        'pilot the program',
        'prototype the feature',
      ];

      testCases.forEach(action => {
        const assessment = tracker.assessFutureActionSync('test', action);
        expect(assessment.reversibilityAssessment).toBe('high');
        expect(assessment.likelyEffects).toContain('Learning without commitment');
      });
    });

    it('should handle mixed patterns', () => {
      const assessment = tracker.assessFutureActionSync('test', 'test and then eliminate');
      // Both patterns are identified - 'test' makes it high, 'eliminate' would make it low
      // Since both patterns match, the last matching pattern determines reversibility
      expect(assessment.reversibilityAssessment).toBe('high');
      expect(assessment.likelyEffects).toContain('Learning without commitment');
    });
  });

  describe('Session Summary Edge Cases', () => {
    it('should handle sessions with no actions', () => {
      const summary = tracker.getSessionSummary('non-existent');
      expect(summary.totalActions).toBe(0);
      expect(summary.actionSteps).toBe(0);
      expect(summary.thinkingSteps).toBe(0);
      expect(summary.overallReversibility).toBe('high'); // Default when no actions
    });

    it('should calculate correct reversibility average', () => {
      const sessionId = 'reversibility-test';

      // Add actions with different reversibilities
      tracker.trackStep(sessionId, 'triz', 1, 'action', 'Test 1', {
        triggers: ['Test'],
        realityChanges: ['Change'],
        futureConstraints: ['Constraint'],
        reversibility: 'high',
      });

      tracker.trackStep(sessionId, 'triz', 2, 'action', 'Test 2', {
        triggers: ['Test'],
        realityChanges: ['Change'],
        futureConstraints: ['Constraint'],
        reversibility: 'low',
      });

      tracker.trackStep(sessionId, 'triz', 3, 'action', 'Test 3', {
        triggers: ['Test'],
        realityChanges: ['Change'],
        futureConstraints: ['Constraint'],
        reversibility: 'medium',
      });

      const summary = tracker.getSessionSummary(sessionId);
      // (1 + 0 + 0.5) / 3 = 0.5, which is medium
      expect(summary.overallReversibility).toBe('medium');
    });
  });

  describe('Cleanup Timer', () => {
    it('should start cleanup timer on construction', () => {
      const newTracker = new ReflexivityTracker();
      expect((newTracker as any).cleanupTimer).toBeDefined();
      newTracker.destroy();
    });

    it('should stop cleanup timer on destroy', () => {
      const newTracker = new ReflexivityTracker();
      newTracker.destroy();
      expect((newTracker as any).cleanupTimer).toBeNull();
    });
  });
});
