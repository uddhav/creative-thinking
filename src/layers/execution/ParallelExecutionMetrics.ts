/**
 * ParallelExecutionMetrics - Tracks and reports performance metrics for parallel execution
 */

import type { LateralTechnique } from '../../types/index.js';

/**
 * Execution metrics for a single session
 */
export interface SessionMetrics {
  sessionId: string;
  technique: LateralTechnique;
  startTime: number;
  endTime?: number;
  duration?: number;
  steps: {
    stepNumber: number;
    startTime: number;
    endTime: number;
    duration: number;
  }[];
  waitTime?: number;
  retryCount: number;
  status: 'in_progress' | 'completed' | 'failed';
  errorCount: number;
  insightsGenerated: number;
}

/**
 * Group execution metrics
 */
export interface GroupMetrics {
  groupId: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  parallelEfficiency?: number;
  sessions: Map<string, SessionMetrics>;
  convergenceOptions?: {
    strategy: string;
    sessionCount: number;
  };
  resourceUsage: {
    peakMemoryUsage: number;
    averageMemoryUsage: number;
    cpuTime: number;
  };
}

/**
 * Aggregate metrics across all executions
 */
export interface AggregateMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  averageParallelEfficiency: number;
  techniquePerformance: Map<
    LateralTechnique,
    {
      count: number;
      averageDuration: number;
      successRate: number;
      averageInsights: number;
    }
  >;
  peakConcurrency: number;
  totalInsightsGenerated: number;
}

/**
 * Tracks performance metrics for parallel execution
 */
export class ParallelExecutionMetrics {
  private groupMetrics: Map<string, GroupMetrics> = new Map();
  private completedGroups: GroupMetrics[] = [];
  private currentConcurrency = 0;
  private peakConcurrency = 0;
  private metricsStartTime = Date.now();

  /**
   * Start tracking a group
   */
  startGroup(
    groupId: string,
    sessionCount: number,
    convergenceOptions?: { strategy: string }
  ): void {
    const metrics: GroupMetrics = {
      groupId,
      startTime: Date.now(),
      sessions: new Map(),
      convergenceOptions: convergenceOptions
        ? {
            strategy: convergenceOptions.strategy,
            sessionCount,
          }
        : undefined,
      resourceUsage: {
        peakMemoryUsage: 0,
        averageMemoryUsage: 0,
        cpuTime: 0,
      },
    };

    this.groupMetrics.set(groupId, metrics);
    this.updateConcurrency(1);
  }

  /**
   * Start tracking a session
   */
  startSession(
    groupId: string,
    sessionId: string,
    technique: LateralTechnique,
    waitTime?: number
  ): void {
    const group = this.groupMetrics.get(groupId);
    if (!group) return;

    const sessionMetrics: SessionMetrics = {
      sessionId,
      technique,
      startTime: Date.now(),
      steps: [],
      waitTime,
      retryCount: 0,
      status: 'in_progress',
      errorCount: 0,
      insightsGenerated: 0,
    };

    group.sessions.set(sessionId, sessionMetrics);
  }

  /**
   * Record step completion
   */
  recordStepCompletion(
    sessionId: string,
    stepNumber: number,
    startTime: number,
    endTime: number
  ): void {
    for (const group of this.groupMetrics.values()) {
      const session = group.sessions.get(sessionId);
      if (session) {
        session.steps.push({
          stepNumber,
          startTime,
          endTime,
          duration: endTime - startTime,
        });
        break;
      }
    }
  }

  /**
   * Complete a session
   */
  completeSession(
    sessionId: string,
    status: 'completed' | 'failed',
    insightsGenerated: number
  ): void {
    for (const group of this.groupMetrics.values()) {
      const session = group.sessions.get(sessionId);
      if (session) {
        session.endTime = Date.now();
        session.duration = session.endTime - session.startTime;
        session.status = status;
        session.insightsGenerated = insightsGenerated;
        break;
      }
    }
  }

  /**
   * Record error
   */
  recordError(sessionId: string): void {
    for (const group of this.groupMetrics.values()) {
      const session = group.sessions.get(sessionId);
      if (session) {
        session.errorCount++;
        break;
      }
    }
  }

  /**
   * Record retry
   */
  recordRetry(sessionId: string): void {
    for (const group of this.groupMetrics.values()) {
      const session = group.sessions.get(sessionId);
      if (session) {
        session.retryCount++;
        break;
      }
    }
  }

  /**
   * Complete a group
   */
  completeGroup(groupId: string): void {
    const group = this.groupMetrics.get(groupId);
    if (!group) return;

    group.endTime = Date.now();
    group.totalDuration = group.endTime - group.startTime;

    // Calculate parallel efficiency
    group.parallelEfficiency = this.calculateParallelEfficiency(group);

    // Update resource usage
    this.updateResourceUsage(group);

    // Move to completed
    this.completedGroups.push(group);
    this.groupMetrics.delete(groupId);
    this.updateConcurrency(-1);
  }

  /**
   * Calculate parallel efficiency
   */
  private calculateParallelEfficiency(group: GroupMetrics): number {
    const sessions = Array.from(group.sessions.values());
    if (sessions.length === 0) return 0;

    // Calculate total work time (sum of all session durations)
    const totalWorkTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);

    // Calculate wall clock time (from first start to last end)
    const startTimes = sessions.map(s => s.startTime);
    const endTimes = sessions.map(s => s.endTime || Date.now());
    const wallClockTime = Math.max(...endTimes) - Math.min(...startTimes);

    // Efficiency = total work time / (wall clock time * session count)
    const theoreticalParallelTime = wallClockTime * sessions.length;
    return theoreticalParallelTime > 0 ? totalWorkTime / theoreticalParallelTime : 0;
  }

  /**
   * Update resource usage
   */
  private updateResourceUsage(group: GroupMetrics): void {
    // Get current memory usage
    const memoryUsage = process.memoryUsage();
    const currentMemory = memoryUsage.heapUsed / 1024 / 1024; // MB

    // Update peak memory
    if (currentMemory > group.resourceUsage.peakMemoryUsage) {
      group.resourceUsage.peakMemoryUsage = currentMemory;
    }

    // Calculate average (simplified)
    const sessionCount = group.sessions.size;
    group.resourceUsage.averageMemoryUsage = currentMemory / Math.max(sessionCount, 1);

    // Estimate CPU time (sum of all session durations)
    group.resourceUsage.cpuTime = Array.from(group.sessions.values()).reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );
  }

  /**
   * Update concurrency tracking
   */
  private updateConcurrency(delta: number): void {
    this.currentConcurrency += delta;
    if (this.currentConcurrency > this.peakConcurrency) {
      this.peakConcurrency = this.currentConcurrency;
    }
  }

  /**
   * Get current metrics snapshot
   */
  getCurrentMetrics(): {
    activeGroups: number;
    activeSessions: number;
    currentConcurrency: number;
    peakConcurrency: number;
    uptime: number;
  } {
    let activeSessions = 0;
    for (const group of this.groupMetrics.values()) {
      activeSessions += group.sessions.size;
    }

    return {
      activeGroups: this.groupMetrics.size,
      activeSessions,
      currentConcurrency: this.currentConcurrency,
      peakConcurrency: this.peakConcurrency,
      uptime: Date.now() - this.metricsStartTime,
    };
  }

  /**
   * Get aggregate metrics
   */
  getAggregateMetrics(): AggregateMetrics {
    const allGroups = [...this.completedGroups, ...this.groupMetrics.values()];
    const techniqueStats = new Map<
      LateralTechnique,
      {
        count: number;
        totalDuration: number;
        successCount: number;
        totalInsights: number;
      }
    >();

    let totalExecutions = 0;
    let successfulExecutions = 0;
    let failedExecutions = 0;
    let totalDuration = 0;
    let totalEfficiency = 0;
    let totalInsights = 0;

    // Process all groups
    for (const group of allGroups) {
      if (group.totalDuration) {
        totalDuration += group.totalDuration;
      }
      if (group.parallelEfficiency) {
        totalEfficiency += group.parallelEfficiency;
      }

      // Process sessions
      for (const session of group.sessions.values()) {
        totalExecutions++;
        totalInsights += session.insightsGenerated;

        if (session.status === 'completed') {
          successfulExecutions++;
        } else if (session.status === 'failed') {
          failedExecutions++;
        }

        // Update technique stats
        let stats = techniqueStats.get(session.technique);
        if (!stats) {
          stats = { count: 0, totalDuration: 0, successCount: 0, totalInsights: 0 };
          techniqueStats.set(session.technique, stats);
        }

        stats.count++;
        stats.totalDuration += session.duration || 0;
        stats.totalInsights += session.insightsGenerated;
        if (session.status === 'completed') {
          stats.successCount++;
        }
      }
    }

    // Calculate technique performance
    const techniquePerformance = new Map<
      LateralTechnique,
      {
        count: number;
        averageDuration: number;
        successRate: number;
        averageInsights: number;
      }
    >();

    for (const [technique, stats] of techniqueStats) {
      techniquePerformance.set(technique, {
        count: stats.count,
        averageDuration: stats.count > 0 ? stats.totalDuration / stats.count : 0,
        successRate: stats.count > 0 ? stats.successCount / stats.count : 0,
        averageInsights: stats.count > 0 ? stats.totalInsights / stats.count : 0,
      });
    }

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageDuration: totalExecutions > 0 ? totalDuration / totalExecutions : 0,
      averageParallelEfficiency: allGroups.length > 0 ? totalEfficiency / allGroups.length : 0,
      techniquePerformance,
      peakConcurrency: this.peakConcurrency,
      totalInsightsGenerated: totalInsights,
    };
  }

  /**
   * Get detailed group metrics
   */
  getGroupMetrics(groupId: string): GroupMetrics | undefined {
    return this.groupMetrics.get(groupId) || this.completedGroups.find(g => g.groupId === groupId);
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    const aggregate = this.getAggregateMetrics();
    const current = this.getCurrentMetrics();
    const groups = [...this.completedGroups, ...this.groupMetrics.values()];

    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        aggregate,
        current,
        groups: groups.map(g => ({
          groupId: g.groupId,
          startTime: new Date(g.startTime).toISOString(),
          endTime: g.endTime ? new Date(g.endTime).toISOString() : null,
          duration: g.totalDuration,
          efficiency: g.parallelEfficiency,
          sessionCount: g.sessions.size,
          convergenceOptions: g.convergenceOptions,
        })),
      },
      null,
      2
    );
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.groupMetrics.clear();
    this.completedGroups = [];
    this.currentConcurrency = 0;
    this.peakConcurrency = 0;
    this.metricsStartTime = Date.now();
  }
}
