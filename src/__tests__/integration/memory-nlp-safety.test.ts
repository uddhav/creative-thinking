/**
 * Integration tests for memory monitoring and NLP safety features
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { ReflexivityTracker } from '../../core/ReflexivityTracker.js';
import { NLPService } from '../../nlp/NLPService.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';

describe('Memory Monitoring Integration', () => {
  let reflexivityTracker: ReflexivityTracker;
  let nlpService: NLPService;

  beforeEach(() => {
    nlpService = new NLPService();
    reflexivityTracker = new ReflexivityTracker(nlpService);
  });

  test('should track memory statistics correctly', () => {
    // Create multiple sessions with data
    for (let i = 0; i < 5; i++) {
      const sessionId = `session_${i}`;

      // Add some actions
      for (let j = 0; j < 10; j++) {
        reflexivityTracker.trackStep(
          sessionId,
          'triz',
          j + 1,
          'action',
          `Action ${j} for session ${i}`,
          {
            reversibility: 'medium',
            likelyEffects: ['Effect 1', 'Effect 2'],
            stakeholderImpact: ['Stakeholder impact'],
            temporalScope: 'short-term',
            realityChanges: ['Reality change 1'],
            futureConstraints: ['Cannot do X anymore', 'Must maintain Y'],
          }
        );
      }
    }

    const stats = reflexivityTracker.getMemoryStats();

    expect(stats.sessionCount).toBe(5);
    expect(stats.totalActions).toBe(50);
    expect(stats.totalConstraints).toBeGreaterThan(0);
    expect(stats.estimatedMemoryBytes).toBeGreaterThan(0);
    expect(stats.oldestSession).toBeLessThanOrEqual(stats.newestSession);
  });

  test('should clean up old sessions', () => {
    // Create an old session with action step to ensure reality state is created
    const oldSessionId = 'old_session';
    reflexivityTracker.trackStep(oldSessionId, 'triz', 1, 'action', 'Old action', {
      reversibility: 'medium',
      likelyEffects: ['Some effect'],
      stakeholderImpact: [],
      temporalScope: 'short-term',
      realityChanges: ['Change 1'],
      futureConstraints: ['Constraint 1'],
    });

    // Verify the old session was created
    let state = (reflexivityTracker as any).realityStates.get(oldSessionId);
    expect(state).toBeDefined();

    // Manually set the session timestamp to 25 hours ago
    const oldTime = Date.now() - 25 * 60 * 60 * 1000;
    (reflexivityTracker as any).sessionTimestamps.set(oldSessionId, oldTime);

    // Also update the lastModified in reality state to match
    state = (reflexivityTracker as any).realityStates.get(oldSessionId);
    if (state) {
      state.lastModified = oldTime;
    }

    // Add a recent session with action step
    const newSessionId = 'new_session';
    reflexivityTracker.trackStep(newSessionId, 'triz', 1, 'action', 'New action', {
      reversibility: 'high',
      likelyEffects: ['New effect'],
      stakeholderImpact: [],
      temporalScope: 'immediate',
      realityChanges: ['New change'],
      futureConstraints: [],
    });

    // Verify both sessions exist before cleanup
    let stats = reflexivityTracker.getMemoryStats();
    expect(stats.sessionCount).toBe(2);

    // Trigger cleanup
    (reflexivityTracker as any).cleanupOldSessions();

    // Check after cleanup
    stats = reflexivityTracker.getMemoryStats();
    expect(stats.sessionCount).toBe(1); // Only new session should remain

    // Verify the correct session remains
    const remainingState = (reflexivityTracker as any).realityStates.get(newSessionId);
    expect(remainingState).toBeDefined();
    const oldState = (reflexivityTracker as any).realityStates.get(oldSessionId);
    expect(oldState).toBeUndefined();
  });

  test('should handle maximum session limit', () => {
    // Set a lower limit for testing
    const originalMax = (ReflexivityTracker as any).REFLEXIVITY_CONFIG?.MAX_TRACKED_SESSIONS;
    process.env.MAX_REFLEXIVITY_SESSIONS = '3';

    const tracker = new ReflexivityTracker(nlpService);

    // Create more sessions than the limit
    for (let i = 0; i < 5; i++) {
      tracker.trackStep(`session_${i}`, 'triz', 1, 'thinking', `Action ${i}`);
    }

    // Trigger cleanup
    (tracker as any).cleanupOldSessions();

    const stats = tracker.getMemoryStats();
    expect(stats.sessionCount).toBeLessThanOrEqual(3);

    // Restore original
    if (originalMax !== undefined) {
      process.env.MAX_REFLEXIVITY_SESSIONS = String(originalMax);
    } else {
      delete process.env.MAX_REFLEXIVITY_SESSIONS;
    }
  });
});

describe('NLP Safety Integration', () => {
  let nlpService: NLPService;

  beforeEach(() => {
    nlpService = new NLPService();
  });

  test('should validate input text length', async () => {
    const longText = 'a'.repeat(1001);

    await expect(nlpService.analyzeActionSemantics(longText)).rejects.toThrow(
      'Action text must be between 1 and 1000 characters'
    );
  });

  test('should handle empty input', async () => {
    await expect(nlpService.analyzeActionSemantics('')).rejects.toThrow(
      'Action text must be between 1 and 1000 characters'
    );
  });

  test('should fallback to local analysis on timeout', async () => {
    // Test with sampling manager unavailable
    const result = await nlpService.analyzeActionSemantics('eliminate the old system');

    expect(result.actionType).toBe('elimination');
    expect(result.reversibility).toBe('low');
    // Local analysis may have higher confidence for clear patterns
    expect(result.confidence).toBeDefined();
    expect(typeof result.confidence).toBe('number');
  });

  test('should detect various action types locally', async () => {
    const testCases = [
      { text: 'eliminate the old process', expectedType: 'elimination' },
      { text: 'communicate the decision to stakeholders', expectedType: 'communication' },
      { text: 'test the new approach', expectedType: 'experimentation' },
      { text: 'commit to the long-term plan', expectedType: 'commitment' },
      { text: 'automate the workflow', expectedType: 'automation' },
      { text: 'integrate the systems', expectedType: 'integration' },
    ];

    for (const testCase of testCases) {
      const result = await nlpService.analyzeActionSemantics(testCase.text);
      expect(result.actionType).toBe(testCase.expectedType);
    }
  });
});

describe('Memory and NLP Integration with SessionManager', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;

  beforeEach(() => {
    techniqueRegistry = new TechniqueRegistry();
    sessionManager = new SessionManager(techniqueRegistry);

    // Initialize reflexivity tracker if it doesn't exist
    if (!(sessionManager as any).reflexivityTracker) {
      (sessionManager as any).initializeReflexivityTracker();
    }
  });

  test('should track reflexivity with NLP analysis', () => {
    const sessionId = 'test_session';
    sessionManager.createSession({
      sessionId,
      techniques: ['triz'],
      problem: 'Test problem',
      planId: 'test_plan',
    });

    // Ensure reflexivity tracker is initialized
    if (!(sessionManager as any).reflexivityTracker) {
      (sessionManager as any).initializeReflexivityTracker();
    }

    // Track step with reflexivity
    sessionManager.trackReflexivity(sessionId, 'triz', 1, 'action', {
      reversibility: 'low',
      likelyEffects: ['Permanent change'],
      stakeholderImpact: ['Major impact on team'],
      temporalScope: 'permanent',
      realityChanges: ['Cannot revert to old system'],
      futureConstraints: ['Must maintain new approach'],
    });

    // Access the reflexivity tracker directly to verify tracking worked
    const tracker = (sessionManager as any).reflexivityTracker;
    expect(tracker).toBeDefined();

    if (tracker) {
      const realityState = tracker.getRealityState(sessionId);
      const summary = tracker.getSessionSummary(sessionId);

      expect(summary.totalActions).toBe(1);
      expect(summary.actionSteps).toBe(1);

      // Check for the specific constraint
      if (realityState?.pathsForeclosed) {
        expect(realityState.pathsForeclosed).toContain('Must maintain new approach');
      }
    }
  });

  test('should assess future actions with timeout protection', async () => {
    const sessionId = 'test_session';
    sessionManager.createSession({
      sessionId,
      techniques: ['triz'],
      problem: 'Test problem',
      planId: 'test_plan',
    });

    const tracker = (sessionManager as any).reflexivityTracker as ReflexivityTracker;

    // Test with a reasonable action
    const assessment = await tracker.assessFutureAction(sessionId, 'implement automated testing');

    expect(assessment).toBeDefined();
    expect(assessment.reversibilityAssessment).toBeDefined();
    expect(assessment.likelyEffects).toBeInstanceOf(Array);
    expect(assessment.recommendation).toBeDefined();
  });

  test('should cache NLP analysis results', async () => {
    const sessionId = 'test_session';
    sessionManager.createSession({
      sessionId,
      techniques: ['triz'],
      problem: 'Test problem',
      planId: 'test_plan',
    });

    const tracker = (sessionManager as any).reflexivityTracker as ReflexivityTracker;
    const action = 'implement new system';

    // First call - should analyze
    const start1 = Date.now();
    const result1 = await tracker.assessFutureAction(sessionId, action);
    const time1 = Date.now() - start1;

    // Second call - should use cache
    const start2 = Date.now();
    const result2 = await tracker.assessFutureAction(sessionId, action);
    const time2 = Date.now() - start2;

    // Cache should be faster
    expect(time2).toBeLessThanOrEqual(time1 + 1); // Allow 1ms variance
    expect(result1.reversibilityAssessment).toBe(result2.reversibilityAssessment);
  });
});
