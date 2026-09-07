/**
 * `escape_protocol_recommended` fires when the early-warning system
 * recommends an escape on a step (#241).
 *
 * The union member was `escape_protocol_triggered` and nothing emitted it:
 * the only "trigger" in the codebase, `executeEscapeProtocol`, has no
 * production caller. What happens live is a RECOMMENDATION, assigned to
 * `session.escapeRecommendation` by the orchestrator on every step and read
 * by the response builder. The event is renamed to say so and emitted where
 * the builder reads it.
 *
 * The recommendation is injected through the real path: the ergodicity
 * manager's own `recordThinkingStep` is wrapped so its genuine result carries
 * one. Setting `session.escapeRecommendation` by hand would not do, because
 * the orchestrator overwrites the field from that result on every step.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import { TelemetryCollector } from '../../telemetry/TelemetryCollector.js';
import type { EscapeProtocol } from '../../ergodicity/escapeProtocols/types.js';

const PROBLEM = 'Rebalance an on-call rotation that keeps burning out the same two people';

function protocol(): EscapeProtocol {
  return {
    level: 1,
    name: 'Pattern Interruption',
    description: 'injected for the test',
    requiredFlexibility: 0.2,
    estimatedFlexibilityGain: 0.3,
    successProbability: 0.5,
    steps: ['Stop', 'Name the pattern', 'Do the opposite once'],
    risks: [],
    executionTime: 'minutes',
    automaticTrigger: false,
    execute: () => ({ success: true }) as never,
  };
}

function textOf(result: { content: Array<{ type: string; text?: string }> }): string {
  return result.content[0]?.text ?? '';
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('escape_protocol_recommended', () => {
  it('is emitted once per step that carries a recommendation, with the session and technique', async () => {
    // Break: delete the trackEscapeRecommended call in ExecutionResponseBuilder.
    // The unbound reference is re-bound below with apply(this, args); the lint rule cannot see that.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = ErgodicityManager.prototype.recordThinkingStep;
    vi.spyOn(ErgodicityManager.prototype, 'recordThinkingStep').mockImplementation(async function (
      this: ErgodicityManager,
      ...args: Parameters<typeof original>
    ) {
      const result = await original.apply(this, args);
      return { ...result, escapeRecommendation: protocol() };
    });
    const track = vi
      .spyOn(TelemetryCollector.prototype, 'trackEscapeRecommended')
      .mockResolvedValue(undefined);

    const server = new LateralThinkingServer();
    try {
      const planned = await server.planThinkingSession({
        problem: PROBLEM,
        techniques: ['six_hats'],
      });
      const planId = (JSON.parse(textOf(planned)) as { planId: string }).planId;
      const sessionId = `session_escape_${Date.now()}`;
      const response = await server.executeThinkingStep({
        planId,
        sessionId,
        technique: 'six_hats',
        problem: PROBLEM,
        currentStep: 1,
        totalSteps: 7,
        output: 'Blue hat: the rotation is a scheduling problem wearing a people-problem costume.',
        nextStepNeeded: true,
      });
      expect(response.isError).toBeFalsy();
      const body = JSON.parse(textOf(response)) as { escapeRecommendation?: { protocol?: string } };
      expect(
        body.escapeRecommendation?.protocol,
        'the injected recommendation reached the response'
      ).toBe('Pattern Interruption');
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith(sessionId, 'six_hats');
    } finally {
      server.destroy();
    }
  }, 20_000);

  it('is admitted at detailed level and dropped at basic', async () => {
    // Break: drop it from detailedEvents in shouldTrackEvent.
    const base = {
      enabled: true,
      storage: 'memory' as const,
      privacyMode: 'balanced' as const,
      batchSize: 100,
      flushInterval: 0,
    };
    const detailed = new TelemetryCollector({ ...base, level: 'detailed' });
    await detailed.trackEscapeRecommended('session_x', 'six_hats');
    expect(detailed.getStatus().bufferedEvents).toBe(1);
    await detailed.shutdown();

    const basic = new TelemetryCollector({ ...base, level: 'basic' });
    await basic.trackEscapeRecommended('session_x', 'six_hats');
    expect(basic.getStatus().bufferedEvents).toBe(0);
    await basic.shutdown();
  });

  it('technique_pair_used is admitted at detailed and its pair survives to storage', async () => {
    // #240's promotion instrument. Break: drop it from detailedEvents, or
    // drop the pairSequence copy in sanitizeMetrics.
    const collector = new TelemetryCollector({
      enabled: true,
      level: 'detailed',
      storage: 'memory',
      privacyMode: 'balanced',
      batchSize: 100,
      flushInterval: 0,
    });
    await collector.trackTechniquePair('session_y', 'six_hats', 'scamper');
    await collector.flush();
    const stored = (await collector.getAnalytics()) as Array<{
      eventType: string;
      metrics: { pairSequence?: [string, string] };
    }>;
    expect(stored).toHaveLength(1);
    expect(stored[0].eventType).toBe('technique_pair_used');
    expect(stored[0].metrics.pairSequence).toEqual(['six_hats', 'scamper']);
    await collector.shutdown();
  });
});
