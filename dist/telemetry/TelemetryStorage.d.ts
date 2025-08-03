/**
 * Telemetry Storage
 * Handles persistent storage of telemetry events
 */
import type { TelemetryConfig, PrivacySafeEvent } from './types.js';
export declare class TelemetryStorage {
    private config;
    private memoryStore;
    private storagePath;
    private maxMemoryEvents;
    private maxFileSize;
    constructor(config: TelemetryConfig);
    /**
     * Store telemetry events
     */
    storeEvents(events: PrivacySafeEvent[]): Promise<void>;
    /**
     * Store events in memory
     */
    private storeInMemory;
    /**
     * Store events in filesystem
     */
    private storeInFilesystem;
    /**
     * Get stored events
     */
    getStoredEvents(): Promise<PrivacySafeEvent[]>;
    /**
     * Load events from filesystem
     */
    private loadFromFilesystem;
    /**
     * Get events within a time range
     */
    getEventsByTimeRange(startTime: number, endTime: number): Promise<PrivacySafeEvent[]>;
    /**
     * Get events by session
     */
    getEventsBySession(sessionId: string): Promise<PrivacySafeEvent[]>;
    /**
     * Clear all stored events
     */
    clear(): Promise<void>;
    /**
     * Clean up old events
     */
    cleanup(daysToKeep?: number): Promise<void>;
    /**
     * Get storage statistics
     */
    getStats(): Promise<{
        eventCount: number;
        oldestEvent?: number;
        newestEvent?: number;
        storageSize: number;
    }>;
    /**
     * Close storage (cleanup resources)
     */
    close(): Promise<void>;
}
//# sourceMappingURL=TelemetryStorage.d.ts.map