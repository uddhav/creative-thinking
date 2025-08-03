/**
 * Performance test utilities
 * Helpers for performance testing, environment detection, and cleanup
 */

import type { LateralThinkingServer } from '../../index.js';

/**
 * Detects the current execution environment
 */
export function detectEnvironment(): {
  isCI: boolean;
  isGitHubActions: boolean;
  isDocker: boolean;
  environmentName: string;
} {
  const isCI = process.env.CI === 'true';
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
  const isDocker = process.env.DOCKER_CONTAINER === 'true' || process.env.container !== undefined;

  let environmentName = 'local';
  if (isGitHubActions) {
    environmentName = 'github-actions';
  } else if (isDocker) {
    environmentName = 'docker';
  } else if (isCI) {
    environmentName = 'ci';
  }

  return {
    isCI,
    isGitHubActions,
    isDocker,
    environmentName,
  };
}

/**
 * Gets environment-specific timeout multiplier
 */
export function getTimeoutMultiplier(): number {
  const env = detectEnvironment();
  const customMultiplier = parseFloat(process.env.PERF_TIMEOUT_MULTIPLIER || '1');

  // Apply environment-specific adjustments
  let baseMultiplier = 1;
  if (env.isGitHubActions) {
    baseMultiplier = 1.3; // 30% overhead for GitHub Actions
  } else if (env.isDocker) {
    baseMultiplier = 1.15; // 15% overhead for Docker
  } else if (env.isCI) {
    baseMultiplier = 1.2; // 20% overhead for generic CI
  }

  return baseMultiplier * customMultiplier;
}

/**
 * Gets environment-specific memory thresholds
 */
export function getMemoryThresholds(): {
  warning: number;
  critical: number;
} {
  const env = detectEnvironment();

  // GitHub Actions has 7GB limit
  if (env.isGitHubActions) {
    return {
      warning: 400, // MB
      critical: 800, // MB
    };
  }

  // Docker might have container limits
  if (env.isDocker) {
    return {
      warning: 450, // MB
      critical: 900, // MB
    };
  }

  // Local development typically has more memory
  return {
    warning: 500, // MB
    critical: 1000, // MB
  };
}

/**
 * Cleans up all sessions in the server
 */
export function cleanupSessions(server: LateralThinkingServer): void {
  // Quick check if cleanup is needed
  const sessions = server.sessions;
  if (!sessions || Object.keys(sessions).length === 0) {
    return;
  }

  // Try bulk cleanup first if available
  const sessionManager = (server as any).sessionManager;
  if (sessionManager && typeof sessionManager.clearAllSessions === 'function') {
    try {
      sessionManager.clearAllSessions();
      return;
    } catch {
      // Fall through to individual cleanup
    }
  }

  // Individual cleanup as fallback
  const sessionIds = Object.keys(sessions);
  sessionIds.forEach(id => {
    try {
      if (sessionManager && typeof sessionManager.deleteSession === 'function') {
        sessionManager.deleteSession(id);
      }
    } catch (error) {
      // Silently continue - don't log in performance tests
      if (!process.env.SKIP_CLEANUP_LOGS) {
        console.error(`[Performance] Failed to clean up session ${id}:`, error);
      }
    }
  });

  // Force garbage collection if available and not skipped
  if (!process.env.SKIP_GC && typeof global !== 'undefined' && global.gc) {
    global.gc();
  }
}

/**
 * Memory usage tracking helper
 */
export class MemoryTracker {
  private baseline: NodeJS.MemoryUsage | null = null;

  start(): void {
    // Force GC before baseline
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
    this.baseline = process.memoryUsage();
  }

  getDelta(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  } | null {
    if (!this.baseline) return null;

    const current = process.memoryUsage();
    return {
      heapUsed: Math.round((current.heapUsed - this.baseline.heapUsed) / 1024 / 1024),
      heapTotal: Math.round((current.heapTotal - this.baseline.heapTotal) / 1024 / 1024),
      external: Math.round((current.external - this.baseline.external) / 1024 / 1024),
      rss: Math.round((current.rss - this.baseline.rss) / 1024 / 1024),
    };
  }

  logDelta(label: string): void {
    const delta = this.getDelta();
    if (delta) {
      console.error(`[Memory] ${label}: Heap=${delta.heapUsed}MB, RSS=${delta.rss}MB`);
    }
  }
}

/**
 * Performance result with environment metadata
 */
export interface PerformanceResult {
  duration: number;
  memory: {
    start: NodeJS.MemoryUsage;
    end: NodeJS.MemoryUsage;
    delta: {
      heapUsed: number;
      rss: number;
    };
  };
  environment: {
    name: string;
    isCI: boolean;
    timeoutMultiplier: number;
  };
}

/**
 * Measures performance of an async operation
 */
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  label?: string
): Promise<{ result: T; metrics: PerformanceResult }> {
  const memTracker = new MemoryTracker();
  memTracker.start();

  const startTime = Date.now();
  const startMem = process.memoryUsage();

  const result = await operation();

  const endTime = Date.now();
  const endMem = process.memoryUsage();
  const env = detectEnvironment();

  const metrics: PerformanceResult = {
    duration: endTime - startTime,
    memory: {
      start: startMem,
      end: endMem,
      delta: {
        heapUsed: Math.round((endMem.heapUsed - startMem.heapUsed) / 1024 / 1024),
        rss: Math.round((endMem.rss - startMem.rss) / 1024 / 1024),
      },
    },
    environment: {
      name: env.environmentName,
      isCI: env.isCI,
      timeoutMultiplier: getTimeoutMultiplier(),
    },
  };

  if (label) {
    console.error(
      `[Performance] ${label}: ${metrics.duration}ms, Heap +${metrics.memory.delta.heapUsed}MB`
    );
  }

  return { result, metrics };
}

/**
 * Waits for memory to stabilize after operations
 */
export async function waitForMemoryStabilization(maxWaitMs = 1000): Promise<void> {
  const startTime = Date.now();
  let previousHeap = process.memoryUsage().heapUsed;
  let stableCount = 0;

  while (Date.now() - startTime < maxWaitMs && stableCount < 3) {
    await new Promise(resolve => setTimeout(resolve, 100));

    const currentHeap = process.memoryUsage().heapUsed;
    const delta = Math.abs(currentHeap - previousHeap);

    // Consider stable if change is less than 1MB
    if (delta < 1024 * 1024) {
      stableCount++;
    } else {
      stableCount = 0;
    }

    previousHeap = currentHeap;
  }
}
