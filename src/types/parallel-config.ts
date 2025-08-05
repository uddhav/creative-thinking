/**
 * Configuration types for parallel execution
 */

/**
 * Configuration for the PartialCompletionHandler
 */
export interface PartialCompletionConfig {
  /**
   * Threshold for determining critical sessions
   * A session is critical if more than this percentage of other sessions depend on it
   * @default 0.3 (30%)
   */
  criticalSessionThreshold: number;

  /**
   * Minimum completion rate to proceed with partial results
   * @default 0.5 (50%)
   */
  minimumCompletionRate: number;

  /**
   * Maximum retry attempts for critical sessions
   * @default 3
   */
  maxRetryAttempts: number;

  /**
   * Delay between retry attempts in milliseconds
   * @default 1000
   */
  retryDelayMs: number;
}

/**
 * Configuration for the SessionSynchronizer
 */
export interface SessionSynchronizerConfig {
  /**
   * Maximum number of updates to batch before processing
   * @default 10
   */
  maxBatchSize: number;

  /**
   * Interval for processing batched updates in milliseconds
   * @default 500
   */
  batchIntervalMs: number;

  /**
   * Strategy for handling context updates when errors occur
   * - 'continue': Continue processing other updates
   * - 'abort': Stop processing and throw error
   * @default 'continue'
   */
  errorStrategy: 'continue' | 'abort';

  /**
   * Maximum size of shared insights array before truncation
   * @default 1000
   */
  maxInsights: number;

  /**
   * Maximum number of themes to track
   * @default 100
   */
  maxThemes: number;
}

/**
 * Configuration for the ParallelGroupManager
 */
export interface ParallelGroupManagerConfig {
  /**
   * Time-to-live for completed groups in milliseconds
   * @default 86400000 (24 hours)
   */
  groupTTLMs: number;

  /**
   * Maximum number of concurrent sessions per group
   * @default 10
   */
  maxConcurrentSessions: number;

  /**
   * Timeout for individual session execution in milliseconds
   * @default 300000 (5 minutes)
   */
  sessionTimeoutMs: number;

  /**
   * Buffer percentage for group completion time estimation
   * @default 0.1 (10%)
   */
  completionTimeBuffer: number;

  /**
   * Enable detailed progress logging
   * @default false
   */
  enableProgressLogging: boolean;
}

/**
 * Configuration for the SessionIndex
 */
export interface SessionIndexConfig {
  /**
   * Enable caching for circular dependency detection
   * @default true
   */
  enableDependencyCaching: boolean;

  /**
   * Cache TTL for dependency analysis results in milliseconds
   * @default 60000 (1 minute)
   */
  dependencyCacheTTLMs: number;

  /**
   * Maximum depth for dependency traversal
   * @default 100
   */
  maxDependencyDepth: number;

  /**
   * Enable performance monitoring for graph operations
   * @default false
   */
  enablePerformanceMonitoring: boolean;
}

/**
 * Configuration for the ParallelProgressTracker
 */
export interface ParallelProgressTrackerConfig {
  /**
   * Interval for progress update events in milliseconds
   * @default 1000
   */
  progressUpdateIntervalMs: number;

  /**
   * Threshold for triggering milestone events (percentage)
   * @default [0.25, 0.5, 0.75, 1.0]
   */
  milestoneThresholds: number[];

  /**
   * Enable detailed progress metrics
   * @default false
   */
  enableDetailedMetrics: boolean;

  /**
   * Maximum number of progress events to keep in history
   * @default 100
   */
  maxProgressHistory: number;
}

/**
 * Combined configuration for all parallel execution components
 */
export interface ParallelExecutionConfig {
  partialCompletion?: Partial<PartialCompletionConfig>;
  synchronizer?: Partial<SessionSynchronizerConfig>;
  groupManager?: Partial<ParallelGroupManagerConfig>;
  sessionIndex?: Partial<SessionIndexConfig>;
  progressTracker?: Partial<ParallelProgressTrackerConfig>;
}

/**
 * Default configurations
 */
export const DEFAULT_PARTIAL_COMPLETION_CONFIG: PartialCompletionConfig = {
  criticalSessionThreshold: 0.3,
  minimumCompletionRate: 0.5,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
};

export const DEFAULT_SYNCHRONIZER_CONFIG: SessionSynchronizerConfig = {
  maxBatchSize: 10,
  batchIntervalMs: 500,
  errorStrategy: 'continue',
  maxInsights: 1000,
  maxThemes: 100,
};

export const DEFAULT_GROUP_MANAGER_CONFIG: ParallelGroupManagerConfig = {
  groupTTLMs: 86400000, // 24 hours
  maxConcurrentSessions: 10,
  sessionTimeoutMs: 300000, // 5 minutes
  completionTimeBuffer: 0.1,
  enableProgressLogging: false,
};

export const DEFAULT_SESSION_INDEX_CONFIG: SessionIndexConfig = {
  enableDependencyCaching: true,
  dependencyCacheTTLMs: 60000, // 1 minute
  maxDependencyDepth: 100,
  enablePerformanceMonitoring: false,
};

export const DEFAULT_PROGRESS_TRACKER_CONFIG: ParallelProgressTrackerConfig = {
  progressUpdateIntervalMs: 1000,
  milestoneThresholds: [0.25, 0.5, 0.75, 1.0],
  enableDetailedMetrics: false,
  maxProgressHistory: 100,
};

/**
 * Helper function to merge configurations with defaults
 */
export function mergeConfig<T>(partial: Partial<T> | undefined, defaults: T): T {
  if (!partial) {
    return defaults;
  }
  return { ...defaults, ...partial };
}
