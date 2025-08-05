/**
 * SessionIndex - Provides fast lookups for sessions and their relationships
 * Maintains multiple indexes for efficient querying of parallel sessions
 */

import type { LateralTechnique } from '../../types/index.js';
import type { SessionData } from '../../types/index.js';
import type { ParallelSessionGroup, IndexEntry } from '../../types/parallel-session.js';

/**
 * Manages indexes for fast session lookups and dependency tracking
 */
export class SessionIndex {
  // Indexes for fast lookup
  private groupToSessions: Map<string, Set<string>> = new Map();
  private sessionToGroup: Map<string, string> = new Map();
  private techniqueToSessions: Map<LateralTechnique, Set<string>> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private reverseDependencyGraph: Map<string, Set<string>> = new Map();
  private sessionStatus: Map<string, IndexEntry['status']> = new Map();

  /**
   * Index a parallel group and its sessions
   */
  indexGroup(group: ParallelSessionGroup): void {
    // Create group -> sessions index
    this.groupToSessions.set(group.groupId, new Set(group.sessionIds));

    // Create session -> group index
    for (const sessionId of group.sessionIds) {
      this.sessionToGroup.set(sessionId, group.groupId);
    }

    // Index techniques from group metadata
    for (const technique of group.metadata.techniques) {
      if (!this.techniqueToSessions.has(technique)) {
        this.techniqueToSessions.set(technique, new Set());
      }
      // Note: Actual session-technique mapping happens in indexSession
    }
  }

  /**
   * Index an individual session
   */
  indexSession(sessionId: string, session: SessionData): void {
    // Index by primary technique
    const techniqueSessions = this.techniqueToSessions.get(session.technique) || new Set();
    techniqueSessions.add(sessionId);
    this.techniqueToSessions.set(session.technique, techniqueSessions);

    // Index parallel metadata techniques if present
    if (session.parallelMetadata) {
      for (const tech of session.parallelMetadata.techniques) {
        const techSessions = this.techniqueToSessions.get(tech) || new Set();
        techSessions.add(sessionId);
        this.techniqueToSessions.set(tech, techSessions);
      }
    }

    // Set initial status
    this.sessionStatus.set(sessionId, 'pending');

    // Index dependencies if present
    if (session.dependsOn && session.dependsOn.length > 0) {
      this.addDependencies(sessionId, session.dependsOn);
    }
  }

  /**
   * Add dependencies between sessions
   */
  addDependencies(sessionId: string, dependencies: string[]): void {
    // Create or update forward dependency graph
    const sessionDeps = this.dependencyGraph.get(sessionId) || new Set();
    this.dependencyGraph.set(sessionId, sessionDeps);

    for (const dep of dependencies) {
      sessionDeps.add(dep);

      // Update reverse dependency graph
      const reverseDeps = this.reverseDependencyGraph.get(dep) || new Set();
      reverseDeps.add(sessionId);
      this.reverseDependencyGraph.set(dep, reverseDeps);
    }
  }

  /**
   * Get all sessions that depend on a given session
   */
  getDependentSessions(sessionId: string): string[] {
    return Array.from(this.reverseDependencyGraph.get(sessionId) || []);
  }

  /**
   * Get all dependencies of a session
   */
  getDependencies(sessionId: string): string[] {
    return Array.from(this.dependencyGraph.get(sessionId) || []);
  }

  /**
   * Check if a session can start based on completed dependencies
   */
  canSessionStart(sessionId: string, completedSessions: Set<string>): boolean {
    const dependencies = this.dependencyGraph.get(sessionId);
    if (!dependencies || dependencies.size === 0) return true;

    // Check if all dependencies are completed
    for (const dep of dependencies) {
      if (!completedSessions.has(dep)) return false;
    }

    return true;
  }

  /**
   * Get all sessions in a group
   */
  getSessionsInGroup(groupId: string): string[] {
    return Array.from(this.groupToSessions.get(groupId) || []);
  }

  /**
   * Get the group ID for a session
   */
  getGroupForSession(sessionId: string): string | undefined {
    return this.sessionToGroup.get(sessionId);
  }

  /**
   * Get all sessions using a specific technique
   */
  getSessionsByTechnique(technique: LateralTechnique): string[] {
    return Array.from(this.techniqueToSessions.get(technique) || []);
  }

  /**
   * Update session status
   */
  updateSessionStatus(sessionId: string, status: IndexEntry['status']): void {
    this.sessionStatus.set(sessionId, status);
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): IndexEntry['status'] | undefined {
    return this.sessionStatus.get(sessionId);
  }

  /**
   * Get all sessions with a specific status
   */
  getSessionsByStatus(status: IndexEntry['status']): string[] {
    const sessions: string[] = [];
    for (const [sessionId, sessionStatus] of this.sessionStatus.entries()) {
      if (sessionStatus === status) {
        sessions.push(sessionId);
      }
    }
    return sessions;
  }

  /**
   * Check for circular dependencies
   * @returns Array of session IDs involved in cycles, empty if no cycles
   */
  detectCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (sessionId: string, path: string[]): void => {
      visited.add(sessionId);
      recursionStack.add(sessionId);
      path.push(sessionId);

      const dependencies = this.dependencyGraph.get(sessionId) || [];
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          detectCycle(dep, [...path]);
        } else if (recursionStack.has(dep)) {
          // Found a cycle
          const cycleStart = path.indexOf(dep);
          cycles.push(path.slice(cycleStart));
        }
      }

      recursionStack.delete(sessionId);
    };

    // Check all sessions
    for (const sessionId of this.dependencyGraph.keys()) {
      if (!visited.has(sessionId)) {
        detectCycle(sessionId, []);
      }
    }

    return cycles;
  }

  /**
   * Get topological order of sessions (respecting dependencies)
   * @returns Array of session IDs in execution order, or null if cycles exist
   */
  getTopologicalOrder(sessionIds: string[]): string[] | null {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // Initialize in-degree for all sessions
    for (const sessionId of sessionIds) {
      inDegree.set(sessionId, 0);
    }

    // Calculate in-degrees
    for (const sessionId of sessionIds) {
      const deps = this.dependencyGraph.get(sessionId) || [];
      for (const dep of deps) {
        if (sessionIds.includes(dep)) {
          inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
        }
      }
    }

    // Find sessions with no dependencies
    for (const [sessionId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(sessionId);
      }
    }

    // Process queue
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      result.push(current);

      // Update dependent sessions
      const dependents = this.reverseDependencyGraph.get(current) || [];
      for (const dependent of dependents) {
        if (sessionIds.includes(dependent)) {
          const newDegree = (inDegree.get(dependent) || 0) - 1;
          inDegree.set(dependent, newDegree);
          if (newDegree === 0) {
            queue.push(dependent);
          }
        }
      }
    }

    // Check if all sessions were processed (no cycles)
    return result.length === sessionIds.length ? result : null;
  }

  /**
   * Remove a session from all indexes
   */
  removeSession(sessionId: string): void {
    // Remove from group indexes
    const groupId = this.sessionToGroup.get(sessionId);
    if (groupId) {
      const groupSessions = this.groupToSessions.get(groupId);
      groupSessions?.delete(sessionId);
      this.sessionToGroup.delete(sessionId);
    }

    // Remove from technique indexes
    for (const sessions of this.techniqueToSessions.values()) {
      sessions.delete(sessionId);
    }

    // Remove from dependency graphs
    this.dependencyGraph.delete(sessionId);
    for (const dependents of this.reverseDependencyGraph.values()) {
      dependents.delete(sessionId);
    }

    // Remove from status
    this.sessionStatus.delete(sessionId);
  }

  /**
   * Clear all indexes
   */
  clear(): void {
    this.groupToSessions.clear();
    this.sessionToGroup.clear();
    this.techniqueToSessions.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();
    this.sessionStatus.clear();
  }

  /**
   * Get index statistics
   */
  getStats(): {
    totalGroups: number;
    totalSessions: number;
    totalDependencies: number;
    techniqueDistribution: Record<LateralTechnique, number>;
    statusDistribution: Record<string, number>;
  } {
    const techniqueDistribution: Record<string, number> = {};
    for (const [technique, sessions] of this.techniqueToSessions.entries()) {
      techniqueDistribution[technique] = sessions.size;
    }

    const statusDistribution: Record<string, number> = {};
    for (const status of this.sessionStatus.values()) {
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    }

    let totalDependencies = 0;
    for (const deps of this.dependencyGraph.values()) {
      totalDependencies += deps.size;
    }

    return {
      totalGroups: this.groupToSessions.size,
      totalSessions: this.sessionToGroup.size,
      totalDependencies,
      techniqueDistribution: techniqueDistribution as Record<LateralTechnique, number>,
      statusDistribution,
    };
  }
}
