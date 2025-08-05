/**
 * ProgressCoordinator - Manages and tracks progress across parallel sessions
 * Provides real-time progress updates and coordination for parallel execution
 */

import { EventEmitter } from 'events';
import type { SessionManager } from '../../core/SessionManager.js';

/**
 * Progress update event data
 */
export interface ProgressUpdate {
  groupId: string;
  sessionId: string;
  technique: string;
  currentStep: number;
  totalSteps: number;
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'waiting';
  timestamp: number;
  metadata?: {
    insightsGenerated?: number;
    errorMessage?: string;
    dependencies?: string[];
  };
}

/**
 * Group progress summary
 */
export interface GroupProgressSummary {
  groupId: string;
  totalSessions: number;
  completedSessions: number;
  failedSessions: number;
  inProgressSessions: number;
  waitingSessions: number;
  overallProgress: number; // 0-1
  estimatedTimeRemaining?: number; // milliseconds
  sessionProgress: Map<
    string,
    {
      technique: string;
      currentStep: number;
      totalSteps: number;
      status: ProgressUpdate['status'];
    }
  >;
}

/**
 * Coordinates progress tracking across parallel sessions
 */
export class ProgressCoordinator extends EventEmitter {
  // Track progress for each session
  private sessionProgress: Map<string, ProgressUpdate> = new Map();

  // Track group start times for time estimation
  private groupStartTimes: Map<string, number> = new Map();

  // Track average step durations for time estimation
  private stepDurations: Map<string, number[]> = new Map();

  constructor(private sessionManager: SessionManager) {
    super();
  }

  /**
   * Report progress for a session
   */
  reportProgress(update: ProgressUpdate): void {
    // Store the update
    this.sessionProgress.set(update.sessionId, update);

    // Track step duration if completed
    if (update.status === 'completed' || update.status === 'in_progress') {
      this.trackStepDuration(update.sessionId, update.timestamp);
    }

    // Emit progress event
    this.emit('progress', update);
    this.emit(`progress:${update.groupId}`, update);
    this.emit(`progress:${update.sessionId}`, update);

    // Check if group is complete
    this.checkGroupCompletion(update.groupId);
  }

  /**
   * Get progress summary for a group
   */
  getGroupProgress(groupId: string): GroupProgressSummary | null {
    const group = this.sessionManager.getParallelGroup(groupId);
    if (!group) return null;

    const summary: GroupProgressSummary = {
      groupId,
      totalSessions: group.sessionIds.length,
      completedSessions: 0,
      failedSessions: 0,
      inProgressSessions: 0,
      waitingSessions: 0,
      overallProgress: 0,
      sessionProgress: new Map(),
    };

    let totalSteps = 0;
    let completedSteps = 0;

    // Calculate progress for each session
    for (const sessionId of group.sessionIds) {
      const progress = this.sessionProgress.get(sessionId);
      const session = this.sessionManager.getSession(sessionId);

      if (!session) continue;

      const status = progress?.status || 'waiting';
      const currentStep = progress?.currentStep || 0;
      const sessionTotalSteps = progress?.totalSteps || 1;

      // Update counters
      switch (status) {
        case 'completed':
          summary.completedSessions++;
          break;
        case 'failed':
          summary.failedSessions++;
          break;
        case 'in_progress':
        case 'started':
          summary.inProgressSessions++;
          break;
        case 'waiting':
          summary.waitingSessions++;
          break;
      }

      // Track individual session progress
      summary.sessionProgress.set(sessionId, {
        technique: session.technique,
        currentStep,
        totalSteps: sessionTotalSteps,
        status,
      });

      // Calculate overall progress
      totalSteps += sessionTotalSteps;
      completedSteps += status === 'completed' ? sessionTotalSteps : currentStep;
    }

    // Calculate overall progress percentage
    summary.overallProgress = totalSteps > 0 ? completedSteps / totalSteps : 0;

    // Estimate time remaining
    summary.estimatedTimeRemaining = this.estimateTimeRemaining(groupId, summary);

    return summary;
  }

  /**
   * Start tracking a group
   */
  startGroup(groupId: string): void {
    this.groupStartTimes.set(groupId, Date.now());
    this.emit('group:started', { groupId, timestamp: Date.now() });
  }

  /**
   * Get real-time progress stream for a group
   */
  streamGroupProgress(
    groupId: string,
    callback: (summary: GroupProgressSummary) => void
  ): () => void {
    const handler = () => {
      const summary = this.getGroupProgress(groupId);
      if (summary) {
        callback(summary);
      }
    };

    // Send initial progress
    handler();

    // Subscribe to updates
    this.on(`progress:${groupId}`, handler);

    // Return unsubscribe function
    return () => {
      this.off(`progress:${groupId}`, handler);
    };
  }

  /**
   * Get progress for a specific session
   */
  getSessionProgress(sessionId: string): ProgressUpdate | null {
    return this.sessionProgress.get(sessionId) || null;
  }

  /**
   * Check if all sessions in a group are waiting (potential deadlock)
   */
  checkForDeadlock(groupId: string): boolean {
    const group = this.sessionManager.getParallelGroup(groupId);
    if (!group) return false;

    let waitingCount = 0;
    let activeCount = 0;

    for (const sessionId of group.sessionIds) {
      const progress = this.sessionProgress.get(sessionId);
      if (progress?.status === 'waiting') {
        waitingCount++;
      } else if (progress?.status === 'in_progress' || progress?.status === 'started') {
        activeCount++;
      }
    }

    // Deadlock if all non-completed sessions are waiting
    const nonCompletedCount = group.sessionIds.length - group.completedSessions.size;
    return waitingCount === nonCompletedCount && activeCount === 0;
  }

  /**
   * Clear progress data for a group
   */
  clearGroupProgress(groupId: string): void {
    const group = this.sessionManager.getParallelGroup(groupId);
    if (!group) return;

    // Clear session progress
    for (const sessionId of group.sessionIds) {
      this.sessionProgress.delete(sessionId);
      this.stepDurations.delete(sessionId);
    }

    // Clear group data
    this.groupStartTimes.delete(groupId);

    // Remove listeners
    this.removeAllListeners(`progress:${groupId}`);
  }

  /**
   * Track step duration for time estimation
   */
  private trackStepDuration(sessionId: string, timestamp: number): void {
    const durations = this.stepDurations.get(sessionId) || [];

    if (durations.length > 0) {
      const lastTimestamp = durations[durations.length - 1];
      const duration = timestamp - lastTimestamp;

      // Store duration (keep last 10 for average)
      durations.push(duration);
      if (durations.length > 10) {
        durations.shift();
      }
    } else {
      // First step
      durations.push(timestamp);
    }

    this.stepDurations.set(sessionId, durations);
  }

  /**
   * Estimate time remaining for a group
   */
  private estimateTimeRemaining(
    groupId: string,
    summary: GroupProgressSummary
  ): number | undefined {
    const startTime = this.groupStartTimes.get(groupId);
    if (!startTime || summary.overallProgress === 0) return undefined;

    const elapsedTime = Date.now() - startTime;
    const estimatedTotalTime = elapsedTime / summary.overallProgress;
    const remainingTime = estimatedTotalTime - elapsedTime;

    return Math.max(0, Math.round(remainingTime));
  }

  /**
   * Check if a group is complete and emit event
   */
  private checkGroupCompletion(groupId: string): void {
    const group = this.sessionManager.getParallelGroup(groupId);
    if (!group) return;

    const summary = this.getGroupProgress(groupId);
    if (!summary) return;

    // Check if all sessions are either completed or failed
    const totalFinished = summary.completedSessions + summary.failedSessions;

    if (totalFinished === summary.totalSessions) {
      // Group is complete
      const endTime = Date.now();
      const startTime = this.groupStartTimes.get(groupId) || endTime;
      const duration = endTime - startTime;

      this.emit('group:completed', {
        groupId,
        summary,
        duration,
        success: summary.failedSessions === 0,
        timestamp: endTime,
      });

      // Update group status
      this.sessionManager.updateParallelGroupStatus(
        groupId,
        summary.failedSessions === 0 ? 'completed' : 'partial_success'
      );
    }
  }

  /**
   * Get formatted progress display
   */
  formatProgressDisplay(groupId: string): string {
    const summary = this.getGroupProgress(groupId);
    if (!summary) return 'No progress data available';

    const progressBar = this.createProgressBar(summary.overallProgress);
    const timeRemaining = summary.estimatedTimeRemaining
      ? `~${Math.ceil(summary.estimatedTimeRemaining / 1000)}s remaining`
      : '';

    let display = `Group Progress: ${progressBar} ${Math.round(summary.overallProgress * 100)}% ${timeRemaining}\n`;
    display += `Sessions: ${summary.completedSessions}/${summary.totalSessions} completed`;

    if (summary.failedSessions > 0) {
      display += ` (${summary.failedSessions} failed)`;
    }
    if (summary.waitingSessions > 0) {
      display += ` (${summary.waitingSessions} waiting)`;
    }

    return display;
  }

  /**
   * Create a text progress bar
   */
  private createProgressBar(progress: number, width: number = 20): string {
    const filled = Math.round(progress * width);
    const empty = width - filled;
    return `[${'='.repeat(filled)}${' '.repeat(empty)}]`;
  }
}
