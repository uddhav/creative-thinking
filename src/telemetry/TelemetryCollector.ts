/**
 * Telemetry Collector
 * Central service for collecting and managing telemetry events
 */

import { randomUUID } from 'crypto';
import type {
  TelemetryEvent,
  TelemetryConfig,
  TelemetryEventType,
  TelemetryMetadata,
  PrivacySafeEvent,
} from './types.js';
import type { LateralTechnique } from '../types/index.js';
import { PrivacyManager } from './privacy.js';
import { TelemetryStorage } from './TelemetryStorage.js';

export class TelemetryCollector {
  private privacyManager: PrivacyManager;
  private storage: TelemetryStorage;
  private eventBuffer: TelemetryEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionStartTimes = new Map<string, number>();
  private isShuttingDown = false;
  private shutdownHandler?: () => void;

  constructor(private config: TelemetryConfig = PrivacyManager.getConfigFromEnvironment()) {
    this.privacyManager = new PrivacyManager(config);
    this.storage = new TelemetryStorage(config);

    if (config.enabled && config.flushInterval) {
      this.startFlushTimer();
    }

    // Handle graceful shutdown - store handler for cleanup
    this.shutdownHandler = () => {
      this.shutdown().catch(console.error);
    };
    process.on('beforeExit', this.shutdownHandler);
  }

  /**
   * Track a telemetry event
   */
  async trackEvent(
    eventType: TelemetryEventType,
    sessionId: string,
    metadata: TelemetryMetadata,
    technique?: LateralTechnique
  ): Promise<void> {
    if (!this.config.enabled || this.isShuttingDown) {
      return;
    }

    // Check level restrictions
    if (!this.shouldTrackEvent(eventType)) {
      return;
    }

    const event: TelemetryEvent = {
      eventId: randomUUID(),
      eventType,
      timestamp: Date.now(),
      sessionId,
      technique,
      metadata: this.filterMetadataByLevel(metadata),
    };

    // Add to buffer
    this.eventBuffer.push(event);

    // Track session start time
    if (eventType === 'session_start') {
      this.sessionStartTimes.set(sessionId, event.timestamp);
    }

    // Calculate session duration for completion events
    if (eventType === 'session_complete' || eventType === 'technique_complete') {
      const startTime = this.sessionStartTimes.get(sessionId);
      if (startTime) {
        event.metadata.duration = event.timestamp - startTime;
      }
    }

    // Check if we should flush
    if (this.eventBuffer.length >= (this.config.batchSize || 100)) {
      await this.flush();
    }
  }

  /**
   * Track technique start
   */
  async trackTechniqueStart(
    sessionId: string,
    technique: LateralTechnique,
    metadata: Partial<TelemetryMetadata> = {}
  ): Promise<void> {
    await this.trackEvent('technique_start', sessionId, metadata as TelemetryMetadata, technique);
  }

  /**
   * Track technique step
   */
  async trackTechniqueStep(
    sessionId: string,
    technique: LateralTechnique,
    step: number,
    totalSteps: number,
    metadata: Partial<TelemetryMetadata> = {}
  ): Promise<void> {
    await this.trackEvent(
      'technique_step',
      sessionId,
      {
        ...metadata,
        step,
        totalSteps,
      } as TelemetryMetadata,
      technique
    );
  }

  /**
   * Track technique completion
   */
  async trackTechniqueComplete(
    sessionId: string,
    technique: LateralTechnique,
    effectiveness: number,
    metadata: Partial<TelemetryMetadata> = {}
  ): Promise<void> {
    await this.trackEvent(
      'technique_complete',
      sessionId,
      {
        ...metadata,
        effectiveness,
      } as TelemetryMetadata,
      technique
    );
  }

  /**
   * Track insight generation
   */
  async trackInsight(
    sessionId: string,
    technique: LateralTechnique,
    insightCount: number
  ): Promise<void> {
    await this.trackEvent(
      'insight_generated',
      sessionId,
      { insightCount } as TelemetryMetadata,
      technique
    );
  }

  /**
   * Track risk identification
   */
  async trackRisk(
    sessionId: string,
    technique: LateralTechnique,
    riskCount: number
  ): Promise<void> {
    await this.trackEvent(
      'risk_identified',
      sessionId,
      { riskCount } as TelemetryMetadata,
      technique
    );
  }

  /**
   * Track flexibility warning
   */
  async trackFlexibilityWarning(
    sessionId: string,
    flexibilityScore: number,
    warningLevel: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    await this.trackEvent('flexibility_warning', sessionId, {
      flexibilityScore,
      warningLevel,
    } as TelemetryMetadata);
  }

  /**
   * Track option generation
   */
  async trackOptionGeneration(
    sessionId: string,
    optionCount: number,
    flexibilityScore: number
  ): Promise<void> {
    await this.trackEvent('option_generated', sessionId, {
      optionCount,
      flexibilityScore,
    } as TelemetryMetadata);
  }

  /**
   * Track session start
   */
  async trackSessionStart(sessionId: string, problemLength: number): Promise<void> {
    await this.trackEvent('session_start', sessionId, {
      problemLength,
    } as TelemetryMetadata);
  }

  /**
   * Track session completion
   */
  async trackSessionComplete(
    sessionId: string,
    metadata: Partial<TelemetryMetadata> = {}
  ): Promise<void> {
    await this.trackEvent('session_complete', sessionId, metadata as TelemetryMetadata);
  }

  /**
   * Track workflow transition
   */
  async trackWorkflowTransition(
    sessionId: string,
    fromTechnique: LateralTechnique,
    toTechnique: LateralTechnique
  ): Promise<void> {
    await this.trackEvent('workflow_transition', sessionId, {
      previousTechnique: fromTechnique,
      nextTechnique: toTechnique,
    } as TelemetryMetadata);
  }

  /**
   * Flush buffered events to storage
   */
  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    // Convert events to privacy-safe format
    const safeEvents: PrivacySafeEvent[] = [];
    for (const event of this.eventBuffer) {
      const safeEvent = this.privacyManager.sanitizeEvent(event);
      if (safeEvent) {
        safeEvents.push(safeEvent);
      }
    }

    // Store events
    if (safeEvents.length > 0) {
      await this.storage.storeEvents(safeEvents);
    }

    // Clear buffer
    this.eventBuffer = [];

    // Clean up privacy manager mappings periodically
    this.privacyManager.clearMappings();
  }

  /**
   * Get telemetry analytics
   */
  async getAnalytics(): Promise<unknown> {
    // This will be implemented by TelemetryAnalyzer
    return this.storage.getStoredEvents();
  }

  /**
   * Export telemetry data
   */
  async exportTelemetry(privacyLevel: 'full' | 'anonymized' | 'aggregated'): Promise<unknown> {
    const events = await this.storage.getStoredEvents();

    return {
      version: '1.0.0',
      exportDate: Date.now(),
      privacyLevel,
      events: privacyLevel !== 'aggregated' ? events : undefined,
      eventCount: events.length,
    } as unknown;
  }

  /**
   * Clear all telemetry data
   */
  async clearTelemetry(): Promise<void> {
    this.eventBuffer = [];
    this.sessionStartTimes.clear();
    await this.storage.clear();
  }

  /**
   * Check if event should be tracked based on level
   */
  private shouldTrackEvent(eventType: TelemetryEventType): boolean {
    if (this.config.level === 'full') {
      return true;
    }

    const basicEvents: TelemetryEventType[] = [
      'technique_start',
      'technique_complete',
      'session_start',
      'session_complete',
    ];

    const detailedEvents: TelemetryEventType[] = [
      ...basicEvents,
      'insight_generated',
      'risk_identified',
      'flexibility_warning',
    ];

    if (this.config.level === 'basic') {
      return basicEvents.includes(eventType);
    }

    if (this.config.level === 'detailed') {
      return detailedEvents.includes(eventType);
    }

    return true;
  }

  /**
   * Filter metadata based on telemetry level
   */
  private filterMetadataByLevel(metadata: TelemetryMetadata): TelemetryMetadata {
    if (this.config.level === 'full') {
      return metadata;
    }

    const filtered: TelemetryMetadata = {};

    // Basic level - minimal metadata
    const basicFields: (keyof TelemetryMetadata)[] = [
      'step',
      'totalSteps',
      'effectiveness',
      'duration',
    ];

    // Detailed level - more metadata
    const detailedFields: (keyof TelemetryMetadata)[] = [
      ...basicFields,
      'insightCount',
      'riskCount',
      'flexibilityScore',
      'creativityScore',
      'revisionCount',
    ];

    const allowedFields = this.config.level === 'basic' ? basicFields : detailedFields;

    for (const field of allowedFields) {
      if (metadata[field] !== undefined) {
        (filtered as Record<string, unknown>)[field] = metadata[field];
      }
    }

    return filtered;
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Remove event listener
    if (this.shutdownHandler) {
      process.removeListener('beforeExit', this.shutdownHandler);
    }

    await this.flush();
    await this.storage.close();
  }

  /**
   * Get telemetry status
   */
  getStatus(): {
    enabled: boolean;
    level: string;
    storage: string;
    bufferedEvents: number;
    totalSessions: number;
  } {
    return {
      enabled: this.config.enabled,
      level: this.config.level,
      storage: this.config.storage,
      bufferedEvents: this.eventBuffer.length,
      totalSessions: this.sessionStartTimes.size,
    };
  }

  /**
   * Create a global instance
   */
  private static instance?: TelemetryCollector;

  static getInstance(): TelemetryCollector {
    if (!TelemetryCollector.instance) {
      TelemetryCollector.instance = new TelemetryCollector();
    }
    return TelemetryCollector.instance;
  }
}
