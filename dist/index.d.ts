#!/usr/bin/env node
/**
 * Creative Thinking MCP Server
 * A modular implementation of lateral thinking techniques
 */
import { SessionManager } from './core/SessionManager.js';
import { VisualFormatter } from './utils/VisualFormatter.js';
import type { SessionData } from './types/index.js';
export * from './types/index.js';
export * from './types/planning.js';
import { SamplingHandler } from './server/SamplingHandler.js';
/**
 * Main server class that orchestrates all components
 */
export declare class LateralThinkingServer {
    private sessionManager;
    private responseBuilder;
    private metricsCollector;
    private techniqueRegistry;
    private visualFormatter;
    private complexityAnalyzer;
    private ergodicityManager;
    private neuralOptimizationEnabled;
    private culturalFrameworksEnabled;
    private sessionOperationsHandler;
    private samplingHandler;
    get sessions(): Map<string, SessionData>;
    get config(): import("./core/SessionManager.js").SessionConfig;
    getSessionManager(): SessionManager;
    getVisualFormatter(): VisualFormatter;
    getSamplingHandler(): SamplingHandler;
    cleanupOldSessions(): void;
    initializeSession(technique: string, problem: string): string;
    touchSession(sessionId: string): void;
    evictOldestSessions(): void;
    logMemoryMetrics(): void;
    constructor();
    /**
     * Process lateral thinking requests
     */
    processLateralThinking(input: unknown): Promise<import("./types/index.js").LateralThinkingResponse>;
    /**
     * Discover techniques handler
     */
    discoverTechniques(input: unknown): import("./types/index.js").LateralThinkingResponse;
    /**
     * Plan thinking session handler
     */
    planThinkingSession(input: unknown): import("./types/index.js").LateralThinkingResponse;
    /**
     * Execute thinking step handler
     */
    executeThinkingStep(input: unknown): Promise<import("./types/index.js").LateralThinkingResponse>;
    /**
     * Handle session operations - delegate to SessionOperationsHandler
     */
    private handleSessionOperation;
    private isSessionOperation;
    /**
     * Clean up resources
     */
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map