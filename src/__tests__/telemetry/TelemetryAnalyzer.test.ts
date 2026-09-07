/**
 * TelemetryAnalyzer: what the stored rows add up to (#241).
 *
 * Untested before this file; its only caller was a repo script that read an
 * array as an object. Names here are honest about what the numbers are:
 * `averageEffectiveness` averages the completion-time `effectiveness` metric,
 * whose sole producer is the technique's output completeness, coverage of the
 * outputs the step asked for. Nothing observes an outcome, so the method is
 * `getTechniqueUsage`, not effectiveness.
 */

import { describe, it, expect } from 'vitest';
import { TelemetryAnalyzer } from '../../telemetry/TelemetryAnalyzer.js';
import type { TelemetryStorage } from '../../telemetry/TelemetryStorage.js';
import type { TelemetryConfig, PrivacySafeEvent } from '../../telemetry/types.js';

const config: TelemetryConfig = {
  enabled: true,
  level: 'full',
  storage: 'memory',
  privacyMode: 'balanced',
  batchSize: 100,
  flushInterval: 60_000,
};

function row(
  partial: Partial<PrivacySafeEvent> & { eventType: PrivacySafeEvent['eventType'] }
): PrivacySafeEvent {
  return {
    eventId: `e_${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    anonymousSessionId: 'anon_a',
    metrics: {},
    ...partial,
  };
}

/** An analyzer whose storage already holds `rows`. */
async function analyzerWith(rows: PrivacySafeEvent[]): Promise<TelemetryAnalyzer> {
  const analyzer = new TelemetryAnalyzer(config);
  const storage = (analyzer as unknown as { storage: TelemetryStorage }).storage;
  await storage.storeEvents(rows);
  return analyzer;
}

describe('getTechniqueUsage', () => {
  it('counts starts, completions and the averages per technique, sorted by average', async () => {
    const analyzer = await analyzerWith([
      row({ eventType: 'technique_start', technique: 'six_hats' }),
      row({
        eventType: 'technique_complete',
        technique: 'six_hats',
        metrics: { effectiveness: 0.8 },
      }),
      row({ eventType: 'technique_start', technique: 'six_hats', anonymousSessionId: 'anon_b' }),
      row({ eventType: 'insight_generated', technique: 'six_hats', metrics: { insightCount: 4 } }),
      row({ eventType: 'technique_start', technique: 'po' }),
      row({ eventType: 'technique_complete', technique: 'po', metrics: { effectiveness: 0.2 } }),
    ]);
    const usage = await analyzer.getTechniqueUsage();
    expect(usage.map(u => u.technique)).toEqual(['six_hats', 'po']);
    const hats = usage[0];
    expect(hats.sessionsUsed).toBe(2);
    expect(hats.completionRate).toBe(0.5);
    expect(hats.averageEffectiveness).toBe(0.8);
    expect(hats.averageInsights).toBe(4);
  });

  it('filters to one technique when asked', async () => {
    const analyzer = await analyzerWith([
      row({ eventType: 'technique_start', technique: 'six_hats' }),
      row({ eventType: 'technique_start', technique: 'po' }),
    ]);
    expect((await analyzer.getTechniqueUsage('po')).map(u => u.technique)).toEqual(['po']);
  });
});

describe('getSessionAnalytics', () => {
  it('returns one entry per session as an ARRAY, abandoned until session_complete arrives', async () => {
    // The export script read this as an object and printed undefined/NaN.
    const analyzer = await analyzerWith([
      row({ eventType: 'session_start', anonymousSessionId: 'anon_a', timestamp: 1000 }),
      row({
        eventType: 'technique_start',
        technique: 'six_hats',
        anonymousSessionId: 'anon_a',
        timestamp: 2000,
      }),
      row({
        eventType: 'session_complete',
        anonymousSessionId: 'anon_a',
        timestamp: 5000,
        metrics: { duration: 4000 },
      }),
      row({ eventType: 'session_start', anonymousSessionId: 'anon_b', timestamp: 1000 }),
    ]);
    const sessions = await analyzer.getSessionAnalytics();
    expect(Array.isArray(sessions)).toBe(true);
    const byId = new Map(sessions.map(s => [s.sessionId, s]));
    expect(byId.get('anon_a')?.abandoned).toBe(false);
    expect(byId.get('anon_a')?.techniquesUsed).toEqual(['six_hats']);
    expect(byId.get('anon_b')?.abandoned).toBe(true);
  });

  it('under strict every row shares the aggregate id, so per-session outputs collapse to one', async () => {
    // Stated, not hidden: strict keeps aggregates and nothing else. The
    // analyzer's per-session views are meaningless in that mode.
    const analyzer = await analyzerWith([
      row({ eventType: 'session_start', anonymousSessionId: 'aggregate' }),
      row({ eventType: 'session_start', anonymousSessionId: 'aggregate' }),
    ]);
    expect(await analyzer.getSessionAnalytics()).toHaveLength(1);
  });
});

describe('getAnalytics', () => {
  it('summarises a query over the stored rows', async () => {
    const analyzer = await analyzerWith([
      row({ eventType: 'technique_start', technique: 'six_hats' }),
      row({
        eventType: 'technique_complete',
        technique: 'six_hats',
        metrics: { effectiveness: 0.6 },
      }),
    ]);
    const result = await analyzer.getAnalytics({ timeRange: 'all_time', limit: 100 });
    expect(result.summary.totalSessions).toBe(1);
    expect(result.summary.topTechniques[0]?.technique).toBe('six_hats');
  });
});

describe('problem_discovered and sessions', () => {
  it('a discovery row opens no session: there is none, and its id is minted per call', async () => {
    // Break: drop the problem_discovered skip in getSessionAnalytics and
    // generateSummary. Every discover_techniques call would then count as one
    // more abandoned session in the export (#424 review).
    const analyzer = await analyzerWith([
      row({
        eventType: 'problem_discovered',
        anonymousSessionId: 'anon_discovery_1',
        metrics: { category: 'process_improvement', evidenceBreadth: 2, tier: 'medium' },
      }),
      row({ eventType: 'session_start' }),
      row({ eventType: 'session_complete' }),
    ]);
    const sessions = await analyzer.getSessionAnalytics();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].sessionId).not.toBe('anon_discovery_1');
    const { summary } = await analyzer.getAnalytics({ timeRange: 'all_time' });
    expect(summary.totalSessions).toBe(1);
    expect(summary.totalEvents).toBe(3);
  });
});
