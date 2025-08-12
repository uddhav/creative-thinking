/**
 * Tests for Post-Action Reflexivity Tracking
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { ReflexivityTracker } from '../core/ReflexivityTracker.js';
import type { ReflexiveEffects } from '../techniques/types.js';

describe('ReflexivityTracker', () => {
  let tracker: ReflexivityTracker;
  const sessionId = 'test-session-123';

  beforeEach(() => {
    tracker = new ReflexivityTracker();
  });

  describe('Step Tracking', () => {
    it('should not track reflexivity for thinking steps', () => {
      const record = tracker.trackStep(
        sessionId,
        'six_hats',
        1,
        'thinking',
        'Analyzing with Blue Hat'
      );

      expect(record.stepType).toBe('thinking');
      expect(record.reflexiveEffects).toBeUndefined();
      expect(Object.keys(record.realityChanges).length).toBe(0);
    });

    it('should track reflexivity for action steps with effects', () => {
      const reflexiveEffects: ReflexiveEffects = {
        triggers: ['Presenting to stakeholders'],
        realityChanges: ['Stakeholder expectations set', 'Budget allocated'],
        futureConstraints: ['Cannot change approach without approval', 'Timeline now fixed'],
        reversibility: 'low',
      };

      const record = tracker.trackStep(
        sessionId,
        'six_hats',
        4,
        'action',
        'Present Green Hat ideas to board',
        reflexiveEffects
      );

      expect(record.stepType).toBe('action');
      expect(record.reflexiveEffects).toEqual(reflexiveEffects);
      expect(record.realityChanges.stakeholderExpectations).toBeDefined();
      expect(record.realityChanges.resourceCommitments).toBeDefined();
    });
  });

  describe('Reality State Management', () => {
    it('should accumulate reality changes across multiple actions', () => {
      // First action
      tracker.trackStep(sessionId, 'triz', 2, 'action', 'Remove component A', {
        triggers: ['Component removal'],
        realityChanges: ['Component A no longer available'],
        futureConstraints: ['Cannot use A-dependent features'],
        reversibility: 'low',
      });

      // Second action
      tracker.trackStep(sessionId, 'triz', 3, 'action', 'Simplify system', {
        triggers: ['System simplification'],
        realityChanges: ['System architecture changed'],
        futureConstraints: ['Cannot add complexity easily'],
        reversibility: 'medium',
      });

      const state = tracker.getRealityState(sessionId);
      expect(state).toBeDefined();
      expect(state?.pathsForeclosed?.length || 0).toBeGreaterThan(0);
      expect(state?.technicalDependencies?.length || 0).toBeGreaterThan(0);
    });

    it('should track both constraints and opportunities', () => {
      tracker.trackStep(sessionId, 'temporal_creativity', 4, 'action', 'Create temporal options', {
        triggers: ['Option creation'],
        realityChanges: ['New timeline branches available'],
        futureConstraints: [
          'Cannot abandon option A without cost',
          'Can now pursue parallel paths',
          'Flexibility enabled for future pivots',
        ],
        reversibility: 'medium',
      });

      const state = tracker.getRealityState(sessionId);
      expect(state?.pathsForeclosed?.length || 0).toBeGreaterThan(0);
      expect(state?.optionsCreated?.length || 0).toBeGreaterThan(0);
    });
  });

  describe('Future Action Assessment', () => {
    beforeEach(() => {
      // Set up some history
      tracker.trackStep(sessionId, 'six_hats', 4, 'action', 'Announced plan publicly', {
        triggers: ['Public announcement'],
        realityChanges: ['Public commitment made', 'Media coverage started'],
        futureConstraints: ['Cannot change without reputation damage'],
        reversibility: 'low',
      });
    });

    it('should assess high reversibility for experimental actions', () => {
      const assessment = tracker.assessFutureAction(sessionId, 'Run a small test with subset');

      expect(assessment.reversibilityAssessment).toBe('high');
      expect(assessment.likelyEffects).toContain('Learning without commitment');
      expect(assessment.recommendation).toContain('Safe to proceed');
    });

    it('should assess low reversibility for elimination actions', () => {
      const assessment = tracker.assessFutureAction(sessionId, 'Eliminate the old system entirely');

      expect(assessment.reversibilityAssessment).toBe('low');
      expect(assessment.likelyEffects).toContain('Permanent removal of capabilities');
      expect(assessment.currentConstraints.length).toBeGreaterThan(0);
    });

    it('should warn about communication actions creating expectations', () => {
      const assessment = tracker.assessFutureAction(
        sessionId,
        'Communicate new strategy to all teams'
      );

      expect(assessment.reversibilityAssessment).toBe('low');
      expect(assessment.likelyEffects).toContain('Creates stakeholder expectations');
    });
  });

  describe('Session Summary', () => {
    it('should provide accurate session statistics', () => {
      // Mix of thinking and action steps
      tracker.trackStep(sessionId, 'six_hats', 1, 'thinking', 'Blue Hat planning');
      tracker.trackStep(sessionId, 'six_hats', 2, 'thinking', 'White Hat facts');
      tracker.trackStep(sessionId, 'six_hats', 3, 'action', 'Share findings', {
        triggers: ['Communication'],
        realityChanges: ['Team informed'],
        futureConstraints: ['Team expects follow-up'],
        reversibility: 'medium',
      });
      tracker.trackStep(sessionId, 'six_hats', 4, 'thinking', 'Black Hat risks');
      tracker.trackStep(sessionId, 'six_hats', 5, 'action', 'Implement safeguards', {
        triggers: ['Implementation'],
        realityChanges: ['Safeguards in place'],
        futureConstraints: ['Cannot remove safeguards easily'],
        reversibility: 'low',
      });

      const summary = tracker.getSessionSummary(sessionId);

      expect(summary.totalActions).toBe(5);
      expect(summary.thinkingSteps).toBe(3);
      expect(summary.actionSteps).toBe(2);
      expect(summary.overallReversibility).toBe('low'); // One medium + one low = low overall
    });

    it('should handle sessions with no actions', () => {
      tracker.trackStep(sessionId, 'po', 1, 'thinking', 'Generate provocation');
      tracker.trackStep(sessionId, 'po', 2, 'thinking', 'Extract principle');

      const summary = tracker.getSessionSummary(sessionId);

      expect(summary.totalActions).toBe(2);
      expect(summary.thinkingSteps).toBe(2);
      expect(summary.actionSteps).toBe(0);
      expect(summary.overallReversibility).toBe('high'); // No actions = high reversibility
    });
  });

  describe('Reflexive Patterns', () => {
    it('should identify commitment cascades', () => {
      // Simulate a cascade where one action leads to another
      tracker.trackStep(sessionId, 'scamper', 2, 'action', 'Substitute component A with B', {
        triggers: ['Substitution'],
        realityChanges: ['Component B now in use', 'Supplier contract changed'],
        futureConstraints: ['Must maintain B compatibility', 'Locked into B supplier'],
        reversibility: 'low',
      });

      // This creates pressure for more changes
      tracker.trackStep(sessionId, 'scamper', 3, 'action', 'Modify interface for B', {
        triggers: ['Interface modification'],
        realityChanges: ['Interface redesigned for B', 'User training needed'],
        futureConstraints: ['Users trained on B interface', 'Documentation updated for B'],
        reversibility: 'low',
      });

      const history = tracker.getActionHistory(sessionId);
      const lowReversibilityCount = history.filter(
        h => h.reflexiveEffects?.reversibility === 'low'
      ).length;

      expect(lowReversibilityCount).toBe(2);
      // Both actions have low reversibility - a commitment cascade
    });

    it('should track fertile fallacies (temporary self-validation)', () => {
      // Innovation theatre example
      tracker.trackStep(sessionId, 'design_thinking', 3, 'action', 'Create innovation lab', {
        triggers: ['Lab creation'],
        realityChanges: [
          'Innovation lab established',
          'Team believes innovation happening',
          'Budget allocated to lab',
        ],
        futureConstraints: [
          'Must show innovation results',
          'Cannot close lab without admitting failure',
        ],
        reversibility: 'low',
      });

      const state = tracker.getRealityState(sessionId);
      const hasExpectation =
        state?.stakeholderExpectations?.some(e => e.includes('innovation')) || false;

      expect(hasExpectation).toBe(true);
      // The lab creates expectation of innovation (fertile fallacy)
    });
  });

  describe('Cross-Technique Reflexivity', () => {
    it('should track how different techniques create different reflexive patterns', () => {
      // TRIZ: Elimination pattern
      tracker.trackStep(sessionId, 'triz', 2, 'action', 'Eliminate contradiction', {
        triggers: ['Elimination'],
        realityChanges: ['Contradiction removed'],
        futureConstraints: ['Cannot restore complexity'],
        reversibility: 'low',
      });

      // Paradoxical: Embrace pattern
      tracker.trackStep(sessionId, 'paradoxical_problem', 2, 'action', 'Build dual paths', {
        triggers: ['Dual path creation'],
        realityChanges: ['Two parallel solutions maintained'],
        futureConstraints: ['Must maintain both paths'],
        reversibility: 'medium',
      });

      const history = tracker.getActionHistory(sessionId);
      const trizAction = history.find(h => h.technique === 'triz');
      const paradoxicalAction = history.find(h => h.technique === 'paradoxical_problem');

      // Different techniques create opposite reflexive effects
      expect(trizAction?.realityChanges).toBeDefined();
      expect(paradoxicalAction?.realityChanges).toBeDefined();
      expect(trizAction?.reflexiveEffects?.reversibility).toBe('low');
      expect(paradoxicalAction?.reflexiveEffects?.reversibility).toBe('medium');
    });
  });

  describe('Session Cleanup', () => {
    it('should clear all session data', () => {
      tracker.trackStep(sessionId, 'six_hats', 1, 'action', 'Test action', {
        triggers: ['Test'],
        realityChanges: ['Test change'],
        futureConstraints: ['Test constraint'],
        reversibility: 'high',
      });

      tracker.clearSession(sessionId);

      expect(tracker.getRealityState(sessionId)).toBeUndefined();
      expect(tracker.getActionHistory(sessionId).length).toBe(0);
    });
  });
});
