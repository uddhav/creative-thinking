/**
 * Privacy Utilities
 * Ensures telemetry data collection respects user privacy
 */
import type { TelemetryEvent, PrivacySafeEvent, TelemetryConfig } from './types.js';
export declare class PrivacyManager {
    private config;
    private sessionHashMap;
    private salt;
    constructor(config: TelemetryConfig);
    /**
     * Anonymize a session ID using consistent hashing
     */
    anonymizeSessionId(sessionId: string): string;
    /**
     * Convert telemetry event to privacy-safe format
     */
    sanitizeEvent(event: TelemetryEvent): PrivacySafeEvent | null;
    /**
     * Sanitize metrics based on privacy level
     */
    private sanitizeMetrics;
    /**
     * Check if event should be excluded based on patterns
     */
    private shouldExclude;
    /**
     * Anonymize event ID
     */
    private anonymizeId;
    /**
     * Add fuzzing to timestamp for privacy
     */
    private fuzzyTimestamp;
    /**
     * Round metric values for privacy
     */
    private roundMetric;
    /**
     * Round duration to prevent timing attacks
     */
    private roundDuration;
    /**
     * Generate a random salt for hashing
     */
    private generateSalt;
    /**
     * Clear session mappings (for memory management)
     * Implements LRU-like cleanup to preserve memory
     */
    clearMappings(): void;
    /**
     * Get privacy policy text
     */
    static getPrivacyPolicy(): string;
    /**
     * Check if telemetry should be enabled based on environment
     */
    static shouldEnableTelemetry(): boolean;
    /**
     * Get telemetry configuration from environment
     */
    static getConfigFromEnvironment(): TelemetryConfig;
}
//# sourceMappingURL=privacy.d.ts.map