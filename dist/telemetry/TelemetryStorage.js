/**
 * Telemetry Storage
 * Handles persistent storage of telemetry events
 */
import { promises as fs } from 'fs';
import path from 'path';
export class TelemetryStorage {
    config;
    memoryStore = [];
    storagePath;
    maxMemoryEvents = 10000;
    maxFileSize = 10 * 1024 * 1024; // 10MB
    constructor(config) {
        this.config = config;
        this.storagePath = config.storagePath || '.creative-thinking/telemetry';
    }
    /**
     * Store telemetry events
     */
    async storeEvents(events) {
        switch (this.config.storage) {
            case 'memory':
                this.storeInMemory(events);
                break;
            case 'filesystem':
                await this.storeInFilesystem(events);
                break;
            case 'external':
                // External storage would be implemented here (e.g., API call)
                console.error('External telemetry storage not yet implemented');
                break;
        }
    }
    /**
     * Store events in memory
     */
    storeInMemory(events) {
        this.memoryStore.push(...events);
        // Limit memory usage
        if (this.memoryStore.length > this.maxMemoryEvents) {
            // Keep only the most recent events
            this.memoryStore = this.memoryStore.slice(-this.maxMemoryEvents);
        }
    }
    /**
     * Store events in filesystem
     */
    async storeInFilesystem(events) {
        try {
            // Ensure directory exists
            await fs.mkdir(this.storagePath, { recursive: true });
            // Create filename based on date
            const date = new Date();
            const filename = `telemetry-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.jsonl`;
            const filepath = path.join(this.storagePath, filename);
            // Append events as JSON lines
            const lines = events.map(event => JSON.stringify(event)).join('\n') + '\n';
            // Check file size before appending
            let stats;
            try {
                stats = await fs.stat(filepath);
            }
            catch {
                // File doesn't exist yet
                stats = { size: 0 };
            }
            if (stats.size + Buffer.byteLength(lines) > this.maxFileSize) {
                // Rotate file if it would exceed max size
                const rotatedPath = filepath.replace('.jsonl', `-${Date.now()}.jsonl`);
                // Try rotation with retry logic
                let retries = 3;
                while (retries > 0) {
                    try {
                        await fs.rename(filepath, rotatedPath);
                        break;
                    }
                    catch (error) {
                        retries--;
                        if (retries === 0) {
                            // If rotation fails after retries, continue without rotation
                            console.error('File rotation failed after retries:', error);
                        }
                        else {
                            // Wait briefly before retry
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                }
            }
            // Append to file
            await fs.appendFile(filepath, lines, 'utf8');
            // Also keep recent events in memory for quick access
            this.storeInMemory(events);
        }
        catch (error) {
            console.error('Failed to store telemetry in filesystem:', error);
            // Fall back to memory storage
            this.storeInMemory(events);
        }
    }
    /**
     * Get stored events
     */
    async getStoredEvents() {
        switch (this.config.storage) {
            case 'memory':
                return [...this.memoryStore];
            case 'filesystem':
                return await this.loadFromFilesystem();
            case 'external':
                console.error('External telemetry storage not yet implemented');
                return [];
            default:
                return [];
        }
    }
    /**
     * Load events from filesystem
     */
    async loadFromFilesystem() {
        const events = [];
        try {
            // Read all telemetry files
            const files = await fs.readdir(this.storagePath);
            const telemetryFiles = files
                .filter(f => f.startsWith('telemetry-') && f.endsWith('.jsonl'))
                .sort()
                .slice(-7); // Last 7 days
            for (const file of telemetryFiles) {
                const filepath = path.join(this.storagePath, file);
                const content = await fs.readFile(filepath, 'utf8');
                const lines = content.trim().split('\n');
                for (const line of lines) {
                    if (line) {
                        try {
                            const event = JSON.parse(line);
                            events.push(event);
                        }
                        catch {
                            // Skip invalid lines
                        }
                    }
                }
            }
            return events;
        }
        catch (error) {
            console.error('Failed to load telemetry from filesystem:', error);
            return [];
        }
    }
    /**
     * Get events within a time range
     */
    async getEventsByTimeRange(startTime, endTime) {
        const allEvents = await this.getStoredEvents();
        return allEvents.filter(event => event.timestamp >= startTime && event.timestamp <= endTime);
    }
    /**
     * Get events by session
     */
    async getEventsBySession(sessionId) {
        const allEvents = await this.getStoredEvents();
        return allEvents.filter(event => event.anonymousSessionId === sessionId);
    }
    /**
     * Clear all stored events
     */
    async clear() {
        this.memoryStore = [];
        if (this.config.storage === 'filesystem') {
            try {
                const files = await fs.readdir(this.storagePath);
                const telemetryFiles = files.filter(f => f.startsWith('telemetry-') && f.endsWith('.jsonl'));
                for (const file of telemetryFiles) {
                    await fs.unlink(path.join(this.storagePath, file));
                }
            }
            catch {
                // Directory might not exist
            }
        }
    }
    /**
     * Clean up old events
     */
    async cleanup(daysToKeep = 30) {
        const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
        // Clean memory store
        this.memoryStore = this.memoryStore.filter(event => event.timestamp > cutoffTime);
        // Clean filesystem
        if (this.config.storage === 'filesystem') {
            try {
                const files = await fs.readdir(this.storagePath);
                const cutoffDate = new Date(cutoffTime);
                const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;
                for (const file of files) {
                    if (file.startsWith('telemetry-') && file < `telemetry-${cutoffStr}`) {
                        await fs.unlink(path.join(this.storagePath, file));
                    }
                }
            }
            catch {
                // Ignore cleanup errors
            }
        }
    }
    /**
     * Get storage statistics
     */
    async getStats() {
        const events = await this.getStoredEvents();
        let storageSize = 0;
        if (this.config.storage === 'filesystem') {
            try {
                const files = await fs.readdir(this.storagePath);
                for (const file of files) {
                    if (file.startsWith('telemetry-')) {
                        const stats = await fs.stat(path.join(this.storagePath, file));
                        storageSize += stats.size;
                    }
                }
            }
            catch {
                // Ignore
            }
        }
        else {
            // Estimate memory size
            storageSize = JSON.stringify(this.memoryStore).length;
        }
        const timestamps = events.map(e => e.timestamp).sort((a, b) => a - b);
        return {
            eventCount: events.length,
            oldestEvent: timestamps[0],
            newestEvent: timestamps[timestamps.length - 1],
            storageSize,
        };
    }
    /**
     * Close storage (cleanup resources)
     */
    async close() {
        // Cleanup old data on close
        await this.cleanup();
    }
}
//# sourceMappingURL=TelemetryStorage.js.map