/**
 * Performance monitoring integration for critical operations
 */
import type { HybridComplexityAnalyzer } from '../complexity/analyzer.js';
import type { ErgodicityManager } from '../ergodicity/index.js';
import type { SessionManager } from '../core/SessionManager.js';
import type { LateralThinkingResponse } from '../types/index.js';
/**
 * Wrap complexity analyzer with performance monitoring
 */
export declare function wrapComplexityAnalyzer(analyzer: HybridComplexityAnalyzer): HybridComplexityAnalyzer;
/**
 * Wrap ergodicity manager with performance monitoring
 */
export declare function wrapErgodicityManager(manager: ErgodicityManager): ErgodicityManager;
/**
 * Wrap session manager operations
 */
export declare function wrapSessionManager(manager: SessionManager): SessionManager;
/**
 * Wrap technique handler execution
 */
export declare function wrapTechniqueExecution<T extends (...args: unknown[]) => unknown>(techniqueName: string, fn: T): T;
/**
 * Monitor a critical section of code
 */
export declare function monitorCriticalSection<T>(sectionName: string, operation: () => T, metadata?: Record<string, unknown>): T;
/**
 * Monitor an async critical section
 */
export declare function monitorCriticalSectionAsync<T>(sectionName: string, operation: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T>;
/**
 * Add performance summary to response
 */
export declare function addPerformanceSummary(response: LateralThinkingResponse): LateralThinkingResponse;
/**
 * Log performance report to console (for debugging)
 */
export declare function logPerformanceReport(): void;
/**
 * Reset performance metrics
 */
export declare function resetPerformanceMetrics(): void;
/**
 * Export performance data
 */
export declare function exportPerformanceData(): string;
//# sourceMappingURL=PerformanceIntegration.d.ts.map