/**
 * PrivacyManager: what survives the sanitizer, per mode (#241).
 *
 * This class had no tests of its own. The one telemetry test file ran under
 * level 'full' and privacy 'minimal', so the shipping defaults (basic +
 * balanced) and strict were never exercised, which is how two things went
 * unnoticed: strict returned null for every event, discarding all telemetry
 * while its own policy text promised aggregates; and the closed metrics
 * shape dropped every non-numeric field, so the discovery and pairing events
 * that existed stored nothing usable.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { PrivacyManager } from '../../telemetry/privacy.js';
import type { TelemetryConfig, TelemetryEvent } from '../../telemetry/types.js';

function config(overrides: Partial<TelemetryConfig> = {}): TelemetryConfig {
  return {
    enabled: true,
    level: 'full',
    storage: 'memory',
    privacyMode: 'balanced',
    batchSize: 100,
    flushInterval: 60_000,
    ...overrides,
  };
}

function event(overrides: Partial<TelemetryEvent> = {}): TelemetryEvent {
  return {
    eventId: 'evt-1',
    eventType: 'problem_discovered',
    timestamp: 1_700_000_123_456,
    sessionId: 'session_abc',
    metadata: {
      category: 'process_improvement',
      evidenceBreadth: 2,
      tier: 'medium',
      effectiveness: 0.456,
      insightCount: 3,
      riskCount: 1,
      duration: 12_345,
      flexibilityScore: 0.789,
      pairSequence: ['six_hats', 'scamper'],
      insightText: 'must never survive',
      userFeedback: 'must never survive',
    },
    ...overrides,
  };
}

const ENV_KEYS = ['TELEMETRY_STORAGE', 'TELEMETRY_LEVEL', 'TELEMETRY_PRIVACY_MODE'];
const savedEnv: Record<string, string | undefined> = Object.fromEntries(
  ENV_KEYS.map(key => [key, process.env[key]])
);

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

function setEnv(key: string, value: string): void {
  process.env[key] = value;
}

describe('sanitizeEvent', () => {
  it('keeps the three discovery fields and the pair sequence in every mode', () => {
    // Break: drop the category copy in sanitizeMetrics.
    for (const privacyMode of ['minimal', 'balanced', 'strict'] as const) {
      const safe = new PrivacyManager(config({ privacyMode })).sanitizeEvent(event());
      expect(safe, `${privacyMode} returned null`).not.toBeNull();
      expect(safe?.metrics.category, privacyMode).toBe('process_improvement');
      expect(safe?.metrics.evidenceBreadth, privacyMode).toBe(2);
      expect(safe?.metrics.tier, privacyMode).toBe('medium');
      expect(safe?.metrics.pairSequence, privacyMode).toEqual(['six_hats', 'scamper']);
    }
  });

  it('never carries free text', () => {
    const safe = new PrivacyManager(config()).sanitizeEvent(event());
    const json = JSON.stringify(safe);
    expect(json).not.toContain('must never survive');
    expect(json).not.toContain('session_abc');
  });

  it('strict keeps the event as an aggregate row: no session linkage, hour-rounded, coarse metrics', () => {
    // Break: restore `return null` under strict. The three strict branches in
    // fuzzyTimestamp, roundMetric and roundDuration were dead code until this.
    const safe = new PrivacyManager(config({ privacyMode: 'strict' })).sanitizeEvent(event());
    expect(safe).not.toBeNull();
    expect(safe?.anonymousSessionId).toBe('aggregate');
    expect(safe?.timestamp % (60 * 60 * 1000)).toBe(0);
    expect(safe?.metrics.effectiveness).toBe(0.5);
    expect(safe?.metrics.duration, 'strict drops duration').toBeUndefined();
    expect(safe?.metrics.flexibilityScore, 'strict drops flexibility').toBeUndefined();
  });

  it('balanced links events by a salted hash, rounds to five minutes and two decimals', () => {
    const pm = new PrivacyManager(config());
    const a = pm.sanitizeEvent(event());
    const b = pm.sanitizeEvent(event({ eventId: 'evt-2' }));
    expect(a?.anonymousSessionId).toBe(b?.anonymousSessionId);
    expect(a?.anonymousSessionId).toMatch(/^anon_[0-9a-f]{16}$/);
    expect(a?.timestamp % (5 * 60 * 1000)).toBe(0);
    expect(a?.metrics.effectiveness).toBe(0.46);
    expect(a?.metrics.duration).toBe(10_000);
  });

  it('two managers hash the same session differently (per-instance salt)', () => {
    const one = new PrivacyManager(config()).sanitizeEvent(event());
    const two = new PrivacyManager(config()).sanitizeEvent(event());
    expect(one?.anonymousSessionId).not.toBe(two?.anonymousSessionId);
  });

  it('exclude patterns drop matching events', () => {
    const pm = new PrivacyManager(config({ excludePatterns: ['problem_'] }));
    expect(pm.sanitizeEvent(event())).toBeNull();
    expect(pm.sanitizeEvent(event({ eventType: 'session_start' }))).not.toBeNull();
  });
});

describe('getConfigFromEnvironment', () => {
  it('accepts the three documented storages and falls back to memory with a warning otherwise', () => {
    // Break: restore the bare cast. TELEMETRY_STORAGE=bogus then reaches
    // TelemetryStorage, whose switch stores nothing and says nothing.
    const stderr: string[] = [];
    const original = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk: string | Uint8Array) => {
      stderr.push(String(chunk));
      return true;
    };
    try {
      for (const storage of ['memory', 'filesystem', 'external']) {
        setEnv('TELEMETRY_STORAGE', storage);
        expect(PrivacyManager.getConfigFromEnvironment().storage).toBe(storage);
      }
      setEnv('TELEMETRY_STORAGE', 'bogus');
      expect(PrivacyManager.getConfigFromEnvironment().storage).toBe('memory');
      expect(stderr.join('')).toMatch(/TELEMETRY_STORAGE/);
    } finally {
      process.stderr.write = original;
    }
  });

  it('validates level and privacy mode the same way', () => {
    setEnv('TELEMETRY_LEVEL', 'verbose');
    setEnv('TELEMETRY_PRIVACY_MODE', 'paranoid');
    const c = PrivacyManager.getConfigFromEnvironment();
    expect(c.level).toBe('basic');
    expect(c.privacyMode).toBe('balanced');
    setEnv('TELEMETRY_LEVEL', 'detailed');
    setEnv('TELEMETRY_PRIVACY_MODE', 'strict');
    const d = PrivacyManager.getConfigFromEnvironment();
    expect(d.level).toBe('detailed');
    expect(d.privacyMode).toBe('strict');
  });
});
