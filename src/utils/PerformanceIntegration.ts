/**
 * Performance monitoring integration for critical operations
 */

import { performanceProfiler } from './PerformanceProfiler.js';
import type { HybridComplexityAnalyzer } from '../complexity/analyzer.js';
import type { ErgodicityManager } from '../ergodicity/index.js';
import type { SessionManager } from '../core/SessionManager.js';
import type { LateralTechnique, SessionData, LateralThinkingResponse } from '../types/index.js';

/**
 * Wrap complexity analyzer with performance monitoring
 */
export function wrapComplexityAnalyzer(
  analyzer: HybridComplexityAnalyzer
): HybridComplexityAnalyzer {
  if (!performanceProfiler.isEnabled()) return analyzer;

  // Use a Proxy to intercept method calls
  return new Proxy(analyzer, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver) as unknown;

      if (prop === 'analyze' && typeof value === 'function') {
        return (text: string, useCache?: boolean) => {
          const fn = value as typeof target.analyze;
          return performanceProfiler.measureSync(
            'complexity_analysis',
            () => fn.call(target, text, useCache),
            { textLength: text.length }
          );
        };
      }

      return value;
    },
  });
}

/**
 * Wrap ergodicity manager with performance monitoring
 */
export function wrapErgodicityManager(manager: ErgodicityManager): ErgodicityManager {
  if (!performanceProfiler.isEnabled()) return manager;

  // Use a Proxy to intercept method calls
  return new Proxy(manager, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver) as unknown;

      if (prop === 'recordThinkingStep' && typeof value === 'function') {
        return async (
          technique: LateralTechnique,
          step: number,
          output: string,
          impact?: {
            optionsOpened?: string[];
            optionsClosed?: string[];
            reversibilityCost?: number;
            commitmentLevel?: number;
          },
          session?: SessionData
        ) => {
          const fn = value as typeof target.recordThinkingStep;
          return performanceProfiler.measureAsync(
            'ergodicity_record_step',
            () => fn.call(target, technique, step, output, impact || {}, session),
            { technique, step }
          );
        };
      }

      if (prop === 'analyzeEscapeVelocity' && typeof value === 'function') {
        return (sessionData: SessionData) => {
          const fn = value as typeof target.analyzeEscapeVelocity;
          return performanceProfiler.measureSync('ergodicity_analyze_escape', () =>
            fn.call(target, sessionData)
          );
        };
      }

      return value;
    },
  });
}

/**
 * Wrap session manager operations
 */
export function wrapSessionManager(manager: SessionManager): SessionManager {
  if (!performanceProfiler.isEnabled()) return manager;

  // Use a Proxy to intercept method calls
  return new Proxy(manager, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver) as unknown;

      if (prop === 'saveSessionToPersistence' && typeof value === 'function') {
        return async (sessionId: string) => {
          const fn = value as typeof target.saveSessionToPersistence;
          return performanceProfiler.measureAsync(
            'session_save',
            () => fn.call(target, sessionId),
            { sessionId }
          );
        };
      }

      if (prop === 'loadSessionFromPersistence' && typeof value === 'function') {
        return async (sessionId: string) => {
          const fn = value as typeof target.loadSessionFromPersistence;
          return performanceProfiler.measureAsync(
            'session_load',
            () => fn.call(target, sessionId),
            { sessionId }
          );
        };
      }

      return value;
    },
  });
}

/**
 * Wrap technique handler execution
 */
export function wrapTechniqueExecution<T extends (...args: unknown[]) => unknown>(
  techniqueName: string,
  fn: T
): T {
  if (!performanceProfiler.isEnabled()) return fn;

  return ((...args: Parameters<T>) => {
    return performanceProfiler.measureSync(`technique_${techniqueName}`, () => fn(...args), {
      technique: techniqueName,
    });
  }) as T;
}

/**
 * Monitor a critical section of code
 */
export function monitorCriticalSection<T>(
  sectionName: string,
  operation: () => T,
  metadata?: Record<string, unknown>
): T {
  return performanceProfiler.measureSync(sectionName, operation, metadata);
}

/**
 * Monitor an async critical section
 */
export async function monitorCriticalSectionAsync<T>(
  sectionName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  return performanceProfiler.measureAsync(sectionName, operation, metadata);
}

/**
 * Add performance summary to response
 */
export function addPerformanceSummary(response: LateralThinkingResponse): LateralThinkingResponse {
  if (!performanceProfiler.isEnabled()) return response;

  const report = performanceProfiler.generateReport();

  // Only add summary if there were significant operations
  if (report.totalOperations > 0) {
    const summary = {
      totalOperations: report.totalOperations,
      totalDurationMs: Math.round(report.totalDuration),
      slowestOperations: report.metrics.slice(0, 3).map(m => ({
        name: m.operationName,
        avgMs: Math.round(m.avgDuration),
        count: m.count,
      })),
    };

    // Add to response if it's an object
    if (response && typeof response === 'object' && 'content' in response && response.content[0]) {
      try {
        const content = JSON.parse(response.content[0].text) as Record<string, unknown>;
        content.performanceSummary = summary;
        response.content[0].text = JSON.stringify(content, null, 2);
      } catch {
        // If parsing fails, don't add summary
      }
    }
  }

  return response;
}

/**
 * Log performance report to console (for debugging)
 */
export function logPerformanceReport(): void {
  if (!performanceProfiler.isEnabled()) return;

  const report = performanceProfiler.generateReport();

  // Use console.error for performance logging (allowed by lint rules)
  console.error('\n=== Performance Report ===');
  console.error(`Total Operations: ${report.totalOperations}`);
  console.error(`Total Duration: ${Math.round(report.totalDuration)}ms`);

  if (report.metrics.length > 0) {
    console.error('\nTop Operations by Total Time:');
    report.metrics.slice(0, 5).forEach(m => {
      console.error(
        `  ${m.operationName}: ${m.count} calls, ` +
          `avg ${Math.round(m.avgDuration)}ms, ` +
          `total ${Math.round(m.totalDuration)}ms`
      );
    });
  }

  if (report.slowOperations.length > 0) {
    console.error(`\nSlow Operations (>${Math.round(report.slowOperations[0].duration)}ms):`);
    report.slowOperations.slice(0, 5).forEach(op => {
      console.error(`  ${op.operationName}: ${Math.round(op.duration)}ms`);
    });
  }

  if (report.memoryPressure) {
    console.error('\nMemory Usage:');
    console.error(`  Heap Used: ${Math.round(report.memoryPressure.heapUsed / 1024 / 1024)}MB`);
    console.error(`  RSS: ${Math.round(report.memoryPressure.rss / 1024 / 1024)}MB`);
  }

  console.error('========================\n');
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  performanceProfiler.clear();
}

/**
 * Export performance data
 */
export function exportPerformanceData(): string {
  return performanceProfiler.exportMetrics();
}
