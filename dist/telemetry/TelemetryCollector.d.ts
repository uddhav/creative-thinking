/**
 * Telemetry Collector
 * Central service for collecting and managing telemetry events
 */
import type { TelemetryConfig, TelemetryEventType, TelemetryMetadata } from './types.js';
import type { LateralTechnique } from '../types/index.js';
export declare class TelemetryCollector {
    private config;
    private privacyManager;
    private storage;
    private eventBuffer;
    private flushTimer?;
    private sessionStartTimes;
    private isShuttingDown;
    private shutdownHandler?;
    constructor(config?: TelemetryConfig);
    /**
     * Track a telemetry event
     */
    trackEvent(eventType: TelemetryEventType, sessionId: string, metadata: TelemetryMetadata, technique?: LateralTechnique): Promise<void>;
    /**
     * Track technique start
     */
    trackTechniqueStart(sessionId: string, technique: LateralTechnique, metadata?: Partial<TelemetryMetadata>): Promise<void>;
    /**
     * Track technique step
     */
    trackTechniqueStep(sessionId: string, technique: LateralTechnique, step: number, totalSteps: number, metadata?: Partial<TelemetryMetadata>): Promise<void>;
    /**
     * Track technique completion
     */
    trackTechniqueComplete(sessionId: string, technique: LateralTechnique, effectiveness: number, metadata?: Partial<TelemetryMetadata>): Promise<void>;
    /**
     * Track insight generation
     */
    trackInsight(sessionId: string, technique: LateralTechnique, insightCount: number): Promise<void>;
    /**
     * Track risk identification
     */
    trackRisk(sessionId: string, technique: LateralTechnique, riskCount: number): Promise<void>;
    /**
     * Track flexibility warning
     */
    trackFlexibilityWarning(sessionId: string, flexibilityScore: number, warningLevel: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    /**
     * Track option generation
     */
    trackOptionGeneration(sessionId: string, optionCount: number, flexibilityScore: number): Promise<void>;
    /**
     * Track session start
     */
    trackSessionStart(sessionId: string, problemLength: number): Promise<void>;
    /**
     * Track session completion
     */
    trackSessionComplete(sessionId: string, metadata?: Partial<TelemetryMetadata>): Promise<void>;
    /**
     * Track workflow transition
     */
    trackWorkflowTransition(sessionId: string, fromTechnique: LateralTechnique, toTechnique: LateralTechnique): Promise<void>;
    /**
     * Track technique pair usage for complementarity learning
     */
    trackTechniquePair(sessionId: string, technique1: LateralTechnique, technique2: LateralTechnique, completionRate?: number, effectiveness?: number): Promise<void>;
    /**
     * Track technique recommendation for effectiveness learning
     */
    trackTechniqueRecommendation(sessionId: string, recommendedTechniques: LateralTechnique[], selectedTechnique: LateralTechnique): Promise<void>;
    /**
     * Flush buffered events to storage
     */
    flush(): Promise<void>;
    /**
     * Get telemetry analytics
     */
    getAnalytics(): Promise<unknown>;
    /**
     * Export telemetry data
     */
    exportTelemetry(privacyLevel: 'full' | 'anonymized' | 'aggregated'): Promise<unknown>;
    /**
     * Clear all telemetry data
     */
    clearTelemetry(): Promise<void>;
    /**
     * Check if event should be tracked based on level
     */
    private shouldTrackEvent;
    /**
     * Filter metadata based on telemetry level
     */
    private filterMetadataByLevel;
    /**
     * Start the flush timer
     */
    private startFlushTimer;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
    /**
     * Get telemetry status
     */
    getStatus(): {
        enabled: boolean;
        level: string;
        storage: string;
        bufferedEvents: number;
        totalSessions: number;
    };
    /**
     * Create a global instance
     */
    private static instance?;
    static getInstance(): TelemetryCollector;
}
//# sourceMappingURL=TelemetryCollector.d.ts.map