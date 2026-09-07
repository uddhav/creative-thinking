/**
 * TelemetryStorage: the memory and filesystem backends (#241).
 *
 * Untested before this file. The filesystem path is the one a real
 * deployment uses, and its date-named files, rotation, malformed-line
 * handling and date-based cleanup had never been exercised.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readdirSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { TelemetryStorage } from '../../telemetry/TelemetryStorage.js';
import type { TelemetryConfig, PrivacySafeEvent } from '../../telemetry/types.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'ct-telemetry-storage-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function config(storage: TelemetryConfig['storage']): TelemetryConfig {
  return {
    enabled: true,
    level: 'full',
    storage,
    storagePath: dir,
    privacyMode: 'balanced',
    batchSize: 100,
    flushInterval: 60_000,
  };
}

function safeEvent(n: number, timestamp = Date.now()): PrivacySafeEvent {
  return {
    eventId: `e${n}`,
    eventType: 'technique_start',
    timestamp,
    anonymousSessionId: 'anon_x',
    technique: 'six_hats',
    metrics: { insightCount: n },
  };
}

function todayFile(): string {
  const d = new Date();
  return `telemetry-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.jsonl`;
}

describe('memory backend', () => {
  it('stores and returns events, capped at the most recent 10,000', async () => {
    const storage = new TelemetryStorage(config('memory'));
    await storage.storeEvents(Array.from({ length: 10_050 }, (_, i) => safeEvent(i)));
    const events = await storage.getStoredEvents();
    expect(events).toHaveLength(10_000);
    expect(events[0].eventId).toBe('e50');
    expect(events.at(-1)?.eventId).toBe('e10049');
  });

  it('clear empties it', async () => {
    const storage = new TelemetryStorage(config('memory'));
    await storage.storeEvents([safeEvent(1)]);
    await storage.clear();
    expect(await storage.getStoredEvents()).toEqual([]);
  });
});

describe('filesystem backend', () => {
  it('appends one JSON line per event to a date-named file under storagePath', async () => {
    const storage = new TelemetryStorage(config('filesystem'));
    await storage.storeEvents([safeEvent(1), safeEvent(2)]);
    await storage.storeEvents([safeEvent(3)]);
    const files = readdirSync(dir);
    expect(files).toEqual([todayFile()]);
    const lines = readFileSync(path.join(dir, files[0]), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[2])).toMatchObject({ eventId: 'e3', metrics: { insightCount: 3 } });
  });

  it('reads back what it wrote and skips a malformed line', async () => {
    const storage = new TelemetryStorage(config('filesystem'));
    await storage.storeEvents([safeEvent(1)]);
    writeFileSync(path.join(dir, todayFile()), '{not json\n', { flag: 'a' });
    await storage.storeEvents([safeEvent(2)]);
    const fresh = new TelemetryStorage(config('filesystem'));
    const events = await fresh.getStoredEvents();
    expect(events.map(e => e.eventId)).toEqual(['e1', 'e2']);
  });

  it('cleanup removes files older than the cutoff by their date name', async () => {
    const storage = new TelemetryStorage(config('filesystem'));
    writeFileSync(
      path.join(dir, 'telemetry-2020-01-01.jsonl'),
      JSON.stringify(safeEvent(9)) + '\n'
    );
    await storage.storeEvents([safeEvent(1)]);
    await storage.cleanup(30);
    expect(readdirSync(dir)).toEqual([todayFile()]);
  });

  it('clear removes every telemetry file', async () => {
    const storage = new TelemetryStorage(config('filesystem'));
    await storage.storeEvents([safeEvent(1)]);
    await storage.clear();
    expect(readdirSync(dir)).toEqual([]);
  });

  it('stats count events and bytes', async () => {
    const storage = new TelemetryStorage(config('filesystem'));
    await storage.storeEvents([safeEvent(1, 1000), safeEvent(2, 2000)]);
    const stats = await storage.getStats();
    expect(stats.eventCount).toBe(2);
    expect(stats.oldestEvent).toBe(1000);
    expect(stats.newestEvent).toBe(2000);
    expect(stats.storageSize).toBeGreaterThan(0);
  });
});

describe('external backend', () => {
  it('is unimplemented: stores nothing, returns nothing, says so on stderr', async () => {
    const stderr: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      stderr.push(args.map(String).join(' '));
    };
    try {
      const storage = new TelemetryStorage(config('external'));
      await storage.storeEvents([safeEvent(1)]);
      expect(await storage.getStoredEvents()).toEqual([]);
      expect(stderr.join('\n')).toMatch(/not yet implemented/);
    } finally {
      console.error = original;
    }
  });
});
