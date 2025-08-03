/**
 * Privacy Utilities
 * Ensures telemetry data collection respects user privacy
 */
import { createHash } from 'crypto';
export class PrivacyManager {
    config;
    sessionHashMap = new Map();
    salt;
    constructor(config) {
        this.config = config;
        // Generate a random salt for this instance
        this.salt = this.generateSalt();
    }
    /**
     * Anonymize a session ID using consistent hashing
     */
    anonymizeSessionId(sessionId) {
        if (!this.sessionHashMap.has(sessionId)) {
            const hash = createHash('sha256')
                .update(sessionId + this.salt)
                .digest('hex')
                .substring(0, 16); // Use first 16 chars for brevity
            this.sessionHashMap.set(sessionId, `anon_${hash}`);
        }
        const hash = this.sessionHashMap.get(sessionId);
        if (!hash) {
            throw new Error(`Session ID not found: ${sessionId}`);
        }
        return hash;
    }
    /**
     * Convert telemetry event to privacy-safe format
     */
    sanitizeEvent(event) {
        // Check privacy mode
        if (this.config.privacyMode === 'strict') {
            // In strict mode, only aggregate data is allowed
            return null;
        }
        // Check exclude patterns
        if (this.shouldExclude(event)) {
            return null;
        }
        // Create privacy-safe event
        const safeEvent = {
            eventId: this.anonymizeId(event.eventId),
            eventType: event.eventType,
            timestamp: this.fuzzyTimestamp(event.timestamp),
            anonymousSessionId: this.anonymizeSessionId(event.sessionId),
            technique: event.technique,
            metrics: this.sanitizeMetrics(event.metadata),
        };
        return safeEvent;
    }
    /**
     * Sanitize metrics based on privacy level
     */
    sanitizeMetrics(metadata) {
        const metrics = {};
        // Always include these core metrics
        if (metadata.effectiveness !== undefined) {
            metrics.effectiveness = this.roundMetric(metadata.effectiveness);
        }
        if (metadata.insightCount !== undefined) {
            metrics.insightCount = metadata.insightCount;
        }
        if (metadata.riskCount !== undefined) {
            metrics.riskCount = metadata.riskCount;
        }
        // Include additional metrics based on privacy mode
        if (this.config.privacyMode !== 'strict') {
            if (metadata.duration !== undefined) {
                metrics.duration = this.roundDuration(metadata.duration);
            }
            if (metadata.flexibilityScore !== undefined) {
                metrics.flexibilityScore = this.roundMetric(metadata.flexibilityScore);
            }
        }
        return metrics;
    }
    /**
     * Check if event should be excluded based on patterns
     */
    shouldExclude(event) {
        if (!this.config.excludePatterns || this.config.excludePatterns.length === 0) {
            return false;
        }
        // Check event type
        for (const pattern of this.config.excludePatterns) {
            if (event.eventType.includes(pattern)) {
                return true;
            }
            if (event.technique && event.technique.includes(pattern)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Anonymize event ID
     */
    anonymizeId(id) {
        return createHash('sha256')
            .update(id + this.salt)
            .digest('hex')
            .substring(0, 8);
    }
    /**
     * Add fuzzing to timestamp for privacy
     */
    fuzzyTimestamp(timestamp) {
        if (this.config.privacyMode === 'strict') {
            // Round to nearest hour
            return Math.floor(timestamp / (1000 * 60 * 60)) * (1000 * 60 * 60);
        }
        else if (this.config.privacyMode === 'balanced') {
            // Round to nearest 5 minutes
            return Math.floor(timestamp / (1000 * 60 * 5)) * (1000 * 60 * 5);
        }
        // Minimal privacy mode - keep exact timestamp
        return timestamp;
    }
    /**
     * Round metric values for privacy
     */
    roundMetric(value) {
        if (this.config.privacyMode === 'strict') {
            // Round to 1 decimal place
            return Math.round(value * 10) / 10;
        }
        // Keep 2 decimal places for other modes
        return Math.round(value * 100) / 100;
    }
    /**
     * Round duration to prevent timing attacks
     */
    roundDuration(duration) {
        if (this.config.privacyMode === 'strict') {
            // Round to nearest minute
            return Math.round(duration / 60000) * 60000;
        }
        else if (this.config.privacyMode === 'balanced') {
            // Round to nearest 10 seconds
            return Math.round(duration / 10000) * 10000;
        }
        // Minimal mode - round to nearest second
        return Math.round(duration / 1000) * 1000;
    }
    /**
     * Generate a random salt for hashing
     */
    generateSalt() {
        return createHash('sha256')
            .update(Date.now().toString() + Math.random().toString())
            .digest('hex')
            .substring(0, 16);
    }
    /**
     * Clear session mappings (for memory management)
     * Implements LRU-like cleanup to preserve memory
     */
    clearMappings() {
        const maxSize = 1000;
        const targetSize = 500;
        if (this.sessionHashMap.size > maxSize) {
            // Since we don't track access time, use insertion order (Map maintains it)
            // Convert to array to sort by least recently used
            const entries = Array.from(this.sessionHashMap.entries());
            // Keep the most recent entries (last targetSize items)
            const toKeep = entries.slice(-targetSize);
            // Clear and repopulate with recent entries
            this.sessionHashMap.clear();
            toKeep.forEach(([key, value]) => this.sessionHashMap.set(key, value));
        }
    }
    /**
     * Get privacy policy text
     */
    static getPrivacyPolicy() {
        return `
# Telemetry Privacy Policy

## Data Collection
- This tool collects anonymous usage data to improve technique effectiveness
- All data is collected on an opt-in basis (disabled by default)
- No personally identifiable information (PII) is collected

## What We Collect
- Technique usage patterns and effectiveness scores
- Session durations and completion rates
- Insight and risk identification counts
- Anonymous session identifiers

## What We DON'T Collect
- Your actual problem statements or outputs
- Any personal information
- Specific content of insights or risks
- Network information or IP addresses

## Data Control
- Set TELEMETRY_ENABLED=false to disable all telemetry
- Use TELEMETRY_LEVEL to control data granularity
- All data is stored locally by default
- You can delete telemetry data at any time

## Privacy Modes
- Strict: Maximum privacy, only aggregate metrics
- Balanced: Reasonable privacy with useful analytics
- Minimal: Full telemetry for detailed insights
`;
    }
    /**
     * Check if telemetry should be enabled based on environment
     */
    static shouldEnableTelemetry() {
        // Check for explicit opt-in
        const telemetryEnabled = process.env.TELEMETRY_ENABLED;
        // Require explicit opt-in
        return telemetryEnabled === 'true';
    }
    /**
     * Get telemetry configuration from environment
     */
    static getConfigFromEnvironment() {
        return {
            enabled: PrivacyManager.shouldEnableTelemetry(),
            level: process.env.TELEMETRY_LEVEL || 'basic',
            storage: process.env.TELEMETRY_STORAGE || 'memory',
            storagePath: process.env.TELEMETRY_PATH || '.creative-thinking/telemetry',
            batchSize: parseInt(process.env.TELEMETRY_BATCH_SIZE || '100', 10),
            flushInterval: parseInt(process.env.TELEMETRY_FLUSH_INTERVAL || '60000', 10),
            privacyMode: process.env.TELEMETRY_PRIVACY_MODE || 'balanced',
            excludePatterns: process.env.TELEMETRY_EXCLUDE?.split(',').map(p => p.trim()) || [],
        };
    }
}
//# sourceMappingURL=privacy.js.map