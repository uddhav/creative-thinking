/**
 * Telemetry Collector
 * Central service for collecting and managing telemetry events
 */
import { randomUUID } from 'crypto';
import { PrivacyManager } from './privacy.js';
import { TelemetryStorage } from './TelemetryStorage.js';
export class TelemetryCollector {
    config;
    privacyManager;
    storage;
    eventBuffer = [];
    inFlight = Promise.resolve();
    flushTimer;
    sessionStartTimes = new Map();
    isShuttingDown = false;
    shutdownHandler;
    constructor(config = PrivacyManager.getConfigFromEnvironment()) {
        this.config = config;
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
    async trackEvent(eventType, sessionId, metadata, technique) {
        if (!this.config.enabled || this.isShuttingDown) {
            return;
        }
        // Check level restrictions
        if (!this.shouldTrackEvent(eventType)) {
            return;
        }
        const event = {
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
    async trackTechniqueStart(sessionId, technique, metadata = {}) {
        await this.trackEvent('technique_start', sessionId, metadata, technique);
    }
    /**
     * Track technique step
     */
    async trackTechniqueStep(sessionId, technique, step, totalSteps, metadata = {}) {
        await this.trackEvent('technique_step', sessionId, {
            ...metadata,
            step,
            totalSteps,
        }, technique);
    }
    /**
     * Track technique completion
     */
    async trackTechniqueComplete(sessionId, technique, effectiveness, metadata = {}) {
        await this.trackEvent('technique_complete', sessionId, {
            ...metadata,
            effectiveness,
        }, technique);
    }
    /**
     * Track insight generation
     */
    async trackInsight(sessionId, technique, insightCount) {
        await this.trackEvent('insight_generated', sessionId, { insightCount }, technique);
    }
    /**
     * Track risk identification
     */
    async trackRisk(sessionId, technique, riskCount) {
        await this.trackEvent('risk_identified', sessionId, { riskCount }, technique);
    }
    /**
     * Track flexibility warning
     */
    async trackFlexibilityWarning(sessionId, flexibilityScore, warningLevel) {
        await this.trackEvent('flexibility_warning', sessionId, {
            flexibilityScore,
            warningLevel,
        });
    }
    /**
     * Track option generation
     */
    async trackOptionGeneration(sessionId, optionCount, flexibilityScore) {
        await this.trackEvent('option_generated', sessionId, {
            optionCount,
            flexibilityScore,
        });
    }
    /**
     * Track session start
     */
    async trackSessionStart(sessionId, problemLength) {
        await this.trackEvent('session_start', sessionId, {
            problemLength,
        });
    }
    /**
     * Track session completion
     */
    async trackSessionComplete(sessionId, metadata = {}) {
        await this.trackEvent('session_complete', sessionId, metadata);
    }
    /**
     * Track workflow transition
     */
    async trackWorkflowTransition(sessionId, fromTechnique, toTechnique) {
        await this.trackEvent('workflow_transition', sessionId, {
            previousTechnique: fromTechnique,
            nextTechnique: toTechnique,
        });
    }
    /**
     * Track technique pair usage for complementarity learning
     */
    async trackTechniquePair(sessionId, technique1, technique2, completionRate, effectiveness) {
        await this.trackEvent('technique_pair_used', sessionId, {
            pairSequence: [technique1, technique2],
            pairCompletionRate: completionRate,
            pairEffectiveness: effectiveness,
        });
    }
    /**
     * Track technique recommendation for effectiveness learning
     */
    async trackTechniqueRecommendation(sessionId, recommendedTechniques, selectedTechnique) {
        await this.trackEvent('technique_recommended', sessionId, {
            recommendedTechniques,
            selectedTechnique,
        });
    }
    /**
     * One discover_techniques call. There is no session yet, so the caller
     * synthesizes an id; balanced privacy hashes it like any other.
     */
    async trackProblemDiscovered(discoveryId, meta) {
        await this.trackEvent('problem_discovered', discoveryId, meta);
    }
    /**
     * The early-warning system recommended an escape protocol on this step.
     * The event type is the whole signal; the protocol name is not carried.
     */
    async trackEscapeRecommended(sessionId, technique) {
        await this.trackEvent('escape_protocol_recommended', sessionId, {}, technique);
    }
    /**
     * Flush buffered events to storage
     */
    async flush() {
        // Flushes are serialised, and a caller awaiting flush() waits for every
        // flush already in flight. The exit flush behind a batch-size flush would
        // otherwise either write the same rows again (batch taken after the
        // await) or resolve on an empty buffer and let the process exit while the
        // first append is still pending (batch taken before it). Both were seen.
        const run = this.inFlight.then(() => this.flushBatch());
        this.inFlight = run.catch(() => undefined);
        return run;
    }
    async flushBatch() {
        if (this.eventBuffer.length === 0) {
            return;
        }
        // The batch is taken before the first await; on a storage failure it is
        // dropped, not retried, and storage logs the failure.
        const batch = this.eventBuffer;
        this.eventBuffer = [];
        // Convert events to privacy-safe format
        const safeEvents = [];
        for (const event of batch) {
            const safeEvent = this.privacyManager.sanitizeEvent(event);
            if (safeEvent) {
                safeEvents.push(safeEvent);
            }
        }
        // Store events
        if (safeEvents.length > 0) {
            await this.storage.storeEvents(safeEvents);
        }
        // Clean up privacy manager mappings periodically
        this.privacyManager.clearMappings();
    }
    /**
     * Get telemetry analytics
     */
    async getAnalytics() {
        // This will be implemented by TelemetryAnalyzer
        return this.storage.getStoredEvents();
    }
    /**
     * Export telemetry data
     */
    async exportTelemetry(privacyLevel) {
        const events = await this.storage.getStoredEvents();
        return {
            version: '1.0.0',
            exportDate: Date.now(),
            privacyLevel,
            events: privacyLevel !== 'aggregated' ? events : undefined,
            eventCount: events.length,
        };
    }
    /**
     * Clear all telemetry data
     */
    async clearTelemetry() {
        this.eventBuffer = [];
        this.sessionStartTimes.clear();
        await this.storage.clear();
    }
    /**
     * Check if event should be tracked based on level
     */
    shouldTrackEvent(eventType) {
        if (this.config.level === 'full') {
            return true;
        }
        // Discovery is the first lifecycle event, so it is basic: the complaint
        // that motivated it was that a default install learned nothing about the
        // problems it was asked (#241).
        const basicEvents = [
            'technique_start',
            'technique_complete',
            'session_start',
            'session_complete',
            'problem_discovered',
        ];
        // The pair event is what #240 names as its promotion instrument; until it
        // sat at 'full' it stored nothing on any real install.
        const detailedEvents = [
            ...basicEvents,
            'insight_generated',
            'risk_identified',
            'flexibility_warning',
            'escape_protocol_recommended',
            'technique_pair_used',
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
    filterMetadataByLevel(metadata) {
        if (this.config.level === 'full') {
            return metadata;
        }
        const filtered = {};
        // Basic level - minimal metadata
        const basicFields = [
            'step',
            'totalSteps',
            'effectiveness',
            'duration',
            'category',
            'evidenceBreadth',
            'tier',
        ];
        // Detailed level - more metadata
        const detailedFields = [
            ...basicFields,
            'insightCount',
            'riskCount',
            'flexibilityScore',
            'outputCompleteness',
            'revisionCount',
            'pairSequence',
        ];
        const allowedFields = this.config.level === 'basic' ? basicFields : detailedFields;
        for (const field of allowedFields) {
            if (metadata[field] !== undefined) {
                // Use a type assertion that satisfies ESLint
                const target = filtered;
                target[field] = metadata[field];
            }
        }
        return filtered;
    }
    /**
     * Start the flush timer
     */
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flush().catch(console.error);
        }, this.config.flushInterval);
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
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
    getStatus() {
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
    static instance;
    static getInstance() {
        if (!TelemetryCollector.instance) {
            TelemetryCollector.instance = new TelemetryCollector();
        }
        return TelemetryCollector.instance;
    }
}
//# sourceMappingURL=TelemetryCollector.js.map