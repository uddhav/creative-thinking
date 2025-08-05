/**
 * Tests for SessionIndex - Fast lookup and dependency tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SessionIndex } from '../../../core/session/SessionIndex.js';
import type { SessionData, LateralTechnique } from '../../../types/index.js';
import type { ParallelSessionGroup } from '../../../types/parallel-session.js';

describe('SessionIndex', () => {
  let index: SessionIndex;

  beforeEach(() => {
    index = new SessionIndex();
  });

  describe('Group Indexing', () => {
    it('should index a parallel group and its sessions', () => {
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['session1', 'session2', 'session3'],
        parentProblem: 'Test problem',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 3,
          totalSteps: 15,
          techniques: ['six_hats', 'scamper'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };

      index.indexGroup(group);

      // Verify sessions are indexed to group
      expect(index.getSessionsInGroup('group1')).toEqual(['session1', 'session2', 'session3']);
      expect(index.getGroupForSession('session1')).toBe('group1');
      expect(index.getGroupForSession('session2')).toBe('group1');
      expect(index.getGroupForSession('session3')).toBe('group1');
    });

    it('should handle non-existent groups', () => {
      expect(index.getSessionsInGroup('nonexistent')).toEqual([]);
      expect(index.getGroupForSession('nonexistent')).toBeUndefined();
    });
  });

  describe('Session Indexing', () => {
    it('should index sessions by technique', () => {
      const session1: SessionData = {
        technique: 'six_hats',
        problem: 'Test problem',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
      };

      const session2: SessionData = {
        technique: 'six_hats',
        problem: 'Another problem',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
      };

      const session3: SessionData = {
        technique: 'scamper',
        problem: 'Different problem',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
      };

      index.indexSession('session1', session1);
      index.indexSession('session2', session2);
      index.indexSession('session3', session3);

      expect(index.getSessionsByTechnique('six_hats')).toContain('session1');
      expect(index.getSessionsByTechnique('six_hats')).toContain('session2');
      expect(index.getSessionsByTechnique('scamper')).toEqual(['session3']);
    });

    it('should index parallel metadata techniques', () => {
      const session: SessionData = {
        technique: 'convergence',
        problem: 'Test problem',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
        parallelMetadata: {
          planId: 'plan1',
          techniques: ['six_hats', 'scamper', 'triz'] as LateralTechnique[],
          canExecuteIndependently: true,
        },
      };

      index.indexSession('session1', session);

      // Should be indexed under all techniques
      expect(index.getSessionsByTechnique('convergence')).toContain('session1');
      expect(index.getSessionsByTechnique('six_hats')).toContain('session1');
      expect(index.getSessionsByTechnique('scamper')).toContain('session1');
      expect(index.getSessionsByTechnique('triz')).toContain('session1');
    });

    it('should set initial status to pending', () => {
      const session: SessionData = {
        technique: 'six_hats',
        problem: 'Test problem',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
      };

      index.indexSession('session1', session);
      expect(index.getSessionStatus('session1')).toBe('pending');
    });
  });

  describe('Dependency Management', () => {
    it('should track session dependencies', () => {
      index.addDependencies('session3', ['session1', 'session2']);

      expect(index.getDependencies('session3')).toEqual(['session1', 'session2']);
      expect(index.getDependentSessions('session1')).toContain('session3');
      expect(index.getDependentSessions('session2')).toContain('session3');
    });

    it('should check if session can start based on dependencies', () => {
      index.addDependencies('session3', ['session1', 'session2']);

      // No sessions completed yet
      expect(index.canSessionStart('session3', new Set())).toBe(false);

      // Only session1 completed
      expect(index.canSessionStart('session3', new Set(['session1']))).toBe(false);

      // Both dependencies completed
      expect(index.canSessionStart('session3', new Set(['session1', 'session2']))).toBe(true);

      // Session without dependencies can always start
      expect(index.canSessionStart('session1', new Set())).toBe(true);
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect simple circular dependencies', () => {
      index.addDependencies('A', ['B']);
      index.addDependencies('B', ['C']);
      index.addDependencies('C', ['A']); // Creates cycle A -> B -> C -> A

      const cycles = index.detectCircularDependencies();
      expect(cycles.length).toBe(1);
      expect(cycles[0]).toEqual(['A', 'B', 'C']);
    });

    it('should detect multiple circular dependencies', () => {
      // First cycle: A -> B -> A
      index.addDependencies('A', ['B']);
      index.addDependencies('B', ['A']);

      // Second cycle: C -> D -> E -> C
      index.addDependencies('C', ['D']);
      index.addDependencies('D', ['E']);
      index.addDependencies('E', ['C']);

      const cycles = index.detectCircularDependencies();
      expect(cycles.length).toBe(2);
    });

    it('should handle no circular dependencies', () => {
      index.addDependencies('A', ['B']);
      index.addDependencies('B', ['C']);
      index.addDependencies('C', ['D']);

      const cycles = index.detectCircularDependencies();
      expect(cycles).toEqual([]);
    });
  });

  describe('Topological Sorting', () => {
    it('should return correct execution order for linear dependencies', () => {
      index.addDependencies('C', ['B']);
      index.addDependencies('B', ['A']);

      const order = index.getTopologicalOrder(['A', 'B', 'C']);
      expect(order).toEqual(['A', 'B', 'C']);
    });

    it('should handle parallel tasks', () => {
      index.addDependencies('C', ['A', 'B']); // C depends on both A and B
      // A and B have no dependencies, so they can run in parallel

      const order = index.getTopologicalOrder(['A', 'B', 'C']);
      expect(order).toBeTruthy();
      if (order) {
        expect(order.indexOf('C')).toBeGreaterThan(order.indexOf('A'));
        expect(order.indexOf('C')).toBeGreaterThan(order.indexOf('B'));
      }
    });

    it('should return null for circular dependencies', () => {
      index.addDependencies('A', ['B']);
      index.addDependencies('B', ['A']);

      const order = index.getTopologicalOrder(['A', 'B']);
      expect(order).toBeNull();
    });

    it('should handle disconnected components', () => {
      index.addDependencies('B', ['A']);
      index.addDependencies('D', ['C']);

      const order = index.getTopologicalOrder(['A', 'B', 'C', 'D']);
      expect(order).toBeTruthy();
      if (order) {
        expect(order.indexOf('B')).toBeGreaterThan(order.indexOf('A'));
        expect(order.indexOf('D')).toBeGreaterThan(order.indexOf('C'));
      }
    });
  });

  describe('Status Management', () => {
    it('should update and retrieve session status', () => {
      index.updateSessionStatus('session1', 'active');
      expect(index.getSessionStatus('session1')).toBe('active');

      index.updateSessionStatus('session1', 'completed');
      expect(index.getSessionStatus('session1')).toBe('completed');
    });

    it('should get sessions by status', () => {
      index.updateSessionStatus('session1', 'active');
      index.updateSessionStatus('session2', 'active');
      index.updateSessionStatus('session3', 'completed');
      index.updateSessionStatus('session4', 'failed');

      expect(index.getSessionsByStatus('active')).toEqual(['session1', 'session2']);
      expect(index.getSessionsByStatus('completed')).toEqual(['session3']);
      expect(index.getSessionsByStatus('failed')).toEqual(['session4']);
      expect(index.getSessionsByStatus('pending')).toEqual([]);
    });
  });

  describe('Session Removal', () => {
    it('should remove session from all indexes', () => {
      // Set up a session with group, technique, dependencies, and status
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['session1', 'session2'],
        parentProblem: 'Test',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 2,
          totalSteps: 10,
          techniques: ['six_hats'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };

      const session: SessionData = {
        technique: 'six_hats',
        problem: 'Test',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
      };

      index.indexGroup(group);
      index.indexSession('session1', session);
      index.addDependencies('session2', ['session1']);
      index.updateSessionStatus('session1', 'active');

      // Verify it's indexed
      expect(index.getSessionsInGroup('group1')).toContain('session1');
      expect(index.getSessionsByTechnique('six_hats')).toContain('session1');
      expect(index.getDependentSessions('session1')).toContain('session2');
      expect(index.getSessionStatus('session1')).toBe('active');

      // Remove the session
      index.removeSession('session1');

      // Verify it's removed from all indexes
      expect(index.getSessionsInGroup('group1')).not.toContain('session1');
      expect(index.getSessionsByTechnique('six_hats')).not.toContain('session1');
      expect(index.getDependentSessions('session1')).toEqual([]);
      expect(index.getSessionStatus('session1')).toBeUndefined();
    });
  });

  describe('Statistics', () => {
    it('should provide comprehensive statistics', () => {
      // Set up test data
      const group1: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['session1', 'session2'],
        parentProblem: 'Test',
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

      const group2: ParallelSessionGroup = {
        groupId: 'group2',
        sessionIds: ['session3'],
        parentProblem: 'Test 2',
        executionMode: 'parallel',
        status: 'active',
        startTime: Date.now(),
        completedSessions: new Set(),
        metadata: {
          totalPlans: 1,
          totalSteps: 5,
          techniques: ['triz'] as LateralTechnique[],
          startTime: Date.now(),
        },
      };

      index.indexGroup(group1);
      index.indexGroup(group2);

      const session1: SessionData = {
        technique: 'six_hats',
        problem: 'Test',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
      };

      const session2: SessionData = {
        technique: 'scamper',
        problem: 'Test',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
      };

      const session3: SessionData = {
        technique: 'triz',
        problem: 'Test 2',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
        startTime: Date.now(),
      };

      index.indexSession('session1', session1);
      index.indexSession('session2', session2);
      index.indexSession('session3', session3);

      index.addDependencies('session2', ['session1']);
      index.addDependencies('session3', ['session1', 'session2']);

      index.updateSessionStatus('session1', 'completed');
      index.updateSessionStatus('session2', 'active');
      index.updateSessionStatus('session3', 'pending');

      const stats = index.getStats();

      expect(stats.totalGroups).toBe(2);
      expect(stats.totalSessions).toBe(3);
      expect(stats.totalDependencies).toBe(3); // session2->session1, session3->session1, session3->session2
      expect(stats.techniqueDistribution.six_hats).toBe(1);
      expect(stats.techniqueDistribution.scamper).toBe(1);
      expect(stats.techniqueDistribution.triz).toBe(1);
      expect(stats.statusDistribution.completed).toBe(1);
      expect(stats.statusDistribution.active).toBe(1);
      expect(stats.statusDistribution.pending).toBe(1);
    });
  });

  describe('Clear', () => {
    it('should clear all indexes', () => {
      // Set up some data
      const group: ParallelSessionGroup = {
        groupId: 'group1',
        sessionIds: ['session1'],
        parentProblem: 'Test',
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

      index.indexGroup(group);
      index.updateSessionStatus('session1', 'active');
      index.addDependencies('session1', ['session2']);

      // Clear everything
      index.clear();

      // Verify everything is cleared
      const stats = index.getStats();
      expect(stats.totalGroups).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.totalDependencies).toBe(0);
      expect(Object.keys(stats.techniqueDistribution)).toHaveLength(0);
      expect(Object.keys(stats.statusDistribution)).toHaveLength(0);
    });
  });
});
