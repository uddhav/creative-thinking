/**
 * SessionIndex - Provides fast lookups for sessions and their relationships
 */

import type { LateralTechnique } from '../../types/index.js';
import type { SessionData } from '../../types/index.js';

/**
 * Manages indexes for fast session lookups
 */
export class SessionIndex {
  // Indexes for fast lookup
  private techniqueToSessions: Map<LateralTechnique, Set<string>> = new Map();
  private sessionStatus: Map<string, 'pending' | 'running' | 'completed' | 'failed'> = new Map();

  /**
   * Index an individual session
   */
  indexSession(sessionId: string, session: SessionData): void {
    // Index by primary technique
    const techniqueSessions = this.techniqueToSessions.get(session.technique) || new Set();
    techniqueSessions.add(sessionId);
    this.techniqueToSessions.set(session.technique, techniqueSessions);

    // Set initial status
    this.sessionStatus.set(sessionId, 'pending');
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
  updateSessionStatus(
    sessionId: string,
    status: 'pending' | 'running' | 'completed' | 'failed'
  ): void {
    this.sessionStatus.set(sessionId, status);
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): 'pending' | 'running' | 'completed' | 'failed' | undefined {
    return this.sessionStatus.get(sessionId);
  }

  /**
   * Get all sessions with a specific status
   */
  getSessionsByStatus(status: 'pending' | 'running' | 'completed' | 'failed'): string[] {
    const sessions: string[] = [];
    for (const [sessionId, sessionStatus] of this.sessionStatus.entries()) {
      if (sessionStatus === status) {
        sessions.push(sessionId);
      }
    }
    return sessions;
  }

  /**
   * Remove a session from all indexes
   */
  removeSession(sessionId: string): void {
    // Remove from technique indexes
    for (const sessions of this.techniqueToSessions.values()) {
      sessions.delete(sessionId);
    }

    // Remove from status
    this.sessionStatus.delete(sessionId);
  }

  /**
   * Clear all indexes
   */
  clear(): void {
    this.techniqueToSessions.clear();
    this.sessionStatus.clear();
  }

  /**
   * Get index statistics
   */
  getStats(): {
    totalSessions: number;
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

    // Count total unique sessions
    const allSessions = new Set<string>();
    for (const sessions of this.techniqueToSessions.values()) {
      for (const sessionId of sessions) {
        allSessions.add(sessionId);
      }
    }

    return {
      totalSessions: allSessions.size,
      techniqueDistribution: techniqueDistribution as Record<LateralTechnique, number>,
      statusDistribution,
    };
  }
}
