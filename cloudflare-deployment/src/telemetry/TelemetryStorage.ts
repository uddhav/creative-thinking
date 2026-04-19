/**
 * Telemetry Storage — Cloudflare Workers edition.
 *
 * Filesystem backend is not available in Workers; the `kv` backend is the
 * production path. Events are written to individual KV keys of the form:
 *
 *   telemetry:{YYYY-MM-DD}:{anonymousSessionId}:{eventIdx}
 *
 * Unique keys per event avoid the 1-write/sec/key limit. A 30-day TTL on
 * each write handles retention without a separate cleanup sweep.
 */

import type {
  KVNamespace,
  KVNamespaceListResult,
  KVNamespaceListKey,
} from '@cloudflare/workers-types';
import type { TelemetryConfig, PrivacySafeEvent } from './types.js';

type KvListResult = KVNamespaceListResult<unknown, string>;
type KvListKey = KVNamespaceListKey<unknown, string>;

const DEFAULT_KV_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const DEFAULT_MAX_LIST_SCAN = 10_000;

export class TelemetryStorage {
  private memoryStore: PrivacySafeEvent[] = [];
  private maxMemoryEvents = 10_000;
  private eventCounter = 0;
  private filesystemWarned = false;
  private readonly kvNamespace: KVNamespace | null;

  constructor(
    private config: TelemetryConfig,
    kvNamespace: KVNamespace | null = null
  ) {
    this.kvNamespace = kvNamespace;
  }

  async storeEvents(events: PrivacySafeEvent[]): Promise<void> {
    switch (this.config.storage) {
      case 'memory':
        this.storeInMemory(events);
        return;
      case 'kv':
        await this.storeInKv(events);
        return;
      case 'filesystem':
        if (!this.filesystemWarned) {
          console.error(
            '[Telemetry] filesystem storage is not supported in Workers; falling back to in-memory'
          );
          this.filesystemWarned = true;
        }
        this.storeInMemory(events);
        return;
      case 'external':
        console.error('[Telemetry] external storage not yet implemented');
        return;
    }
  }

  private storeInMemory(events: PrivacySafeEvent[]): void {
    this.memoryStore.push(...events);
    if (this.memoryStore.length > this.maxMemoryEvents) {
      this.memoryStore = this.memoryStore.slice(-this.maxMemoryEvents);
    }
  }

  private async storeInKv(events: PrivacySafeEvent[]): Promise<void> {
    if (!this.kvNamespace) {
      // No KV bound — degrade to memory-only so telemetry never hard-fails.
      this.storeInMemory(events);
      return;
    }

    const writes: Promise<void>[] = [];
    for (const event of events) {
      const key = this.buildEventKey(event);
      writes.push(
        this.kvNamespace
          .put(key, JSON.stringify(event), { expirationTtl: DEFAULT_KV_TTL_SECONDS })
          .catch(error => {
            console.error('[Telemetry] KV write failed:', error);
          })
      );
    }
    await Promise.all(writes);

    // Keep a recent slice in memory for quick reads without a KV round-trip.
    this.storeInMemory(events);
  }

  private buildEventKey(event: PrivacySafeEvent): string {
    const date = new Date(event.timestamp);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const idx = this.eventCounter++;
    return `telemetry:${y}-${m}-${d}:${event.anonymousSessionId}:${idx}:${event.eventId}`;
  }

  async getStoredEvents(): Promise<PrivacySafeEvent[]> {
    switch (this.config.storage) {
      case 'memory':
      case 'filesystem':
        return [...this.memoryStore];
      case 'kv':
        return await this.loadFromKv();
      case 'external':
        return [];
      default:
        return [];
    }
  }

  private async loadFromKv(): Promise<PrivacySafeEvent[]> {
    if (!this.kvNamespace) return [...this.memoryStore];

    const events: PrivacySafeEvent[] = [];
    let cursor: string | undefined = undefined;
    let scanned = 0;

    do {
      const list: KvListResult = await this.kvNamespace.list({
        prefix: 'telemetry:',
        cursor,
        limit: 1_000,
      });
      for (const entry of list.keys as KvListKey[]) {
        if (scanned >= DEFAULT_MAX_LIST_SCAN) break;
        scanned += 1;
        try {
          const raw = await this.kvNamespace.get(entry.name);
          if (raw) events.push(JSON.parse(raw) as PrivacySafeEvent);
        } catch (error) {
          console.error('[Telemetry] KV read failed for', entry.name, error);
        }
      }
      cursor = list.list_complete ? undefined : (list as { cursor?: string }).cursor;
    } while (cursor && scanned < DEFAULT_MAX_LIST_SCAN);

    return events;
  }

  async getEventsByTimeRange(startTime: number, endTime: number): Promise<PrivacySafeEvent[]> {
    const allEvents = await this.getStoredEvents();
    return allEvents.filter(event => event.timestamp >= startTime && event.timestamp <= endTime);
  }

  async getEventsBySession(sessionId: string): Promise<PrivacySafeEvent[]> {
    const allEvents = await this.getStoredEvents();
    return allEvents.filter(event => event.anonymousSessionId === sessionId);
  }

  async clear(): Promise<void> {
    this.memoryStore = [];

    if (this.config.storage === 'kv' && this.kvNamespace) {
      let cursor: string | undefined = undefined;
      do {
        const list: KvListResult = await this.kvNamespace.list({
          prefix: 'telemetry:',
          cursor,
          limit: 1_000,
        });
        await Promise.all(
          (list.keys as KvListKey[]).map(entry =>
            this.kvNamespace!.delete(entry.name).catch(error => {
              console.error('[Telemetry] KV delete failed for', entry.name, error);
            })
          )
        );
        cursor = list.list_complete ? undefined : (list as { cursor?: string }).cursor;
      } while (cursor);
    }
  }

  async cleanup(_daysToKeep = 30): Promise<void> {
    // KV TTL handles retention automatically; in-memory ring buffer is already bounded.
    // Parameter retained for API compatibility with main `src/`.
    return;
  }

  async getStats(): Promise<{
    eventCount: number;
    oldestEvent?: number;
    newestEvent?: number;
    storageSize: number;
  }> {
    const events = await this.getStoredEvents();
    const timestamps = events.map(e => e.timestamp).sort((a, b) => a - b);
    const storageSize = JSON.stringify(events).length;

    return {
      eventCount: events.length,
      oldestEvent: timestamps[0],
      newestEvent: timestamps[timestamps.length - 1],
      storageSize,
    };
  }

  async close(): Promise<void> {
    await this.cleanup();
  }
}
