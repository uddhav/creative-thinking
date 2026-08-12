/**
 * Debate mode was computed in full and thrown away at the last step.
 *
 * `planThinkingSession` resolves the personas, runs `DebateOrchestrator`, and
 * writes four fields onto the plan: `personaContext`, `debateOutline`,
 * `parallelPlans` (one per persona plus a synthesis plan) and
 * `coordinationStrategy`. `ResponseBuilder.transformedOutput` is a
 * hand-maintained allowlist of fields to return, and none of the four was on
 * it.
 *
 * So a caller asking for a two-persona structured debate received an ordinary
 * single-technique plan with no indication that anything else had been
 * computed. Measured before the fix: no debate key, no `parallelPlans`, and
 * neither persona's voice anywhere in the response. The whole persona-debate
 * feature — a headline capability in the project's own documentation — was
 * unreachable through the only surface that exposes it.
 *
 * Same fault as the technique fields that were accepted and never echoed, one
 * layer up: an allowlist that has to be kept in step with the thing it
 * describes, and silently wasn't.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Accept the counteroffer or leave';

interface DebateResponse {
  personaContext?: { activePersonas?: Array<{ id: string }>; isDebateMode?: boolean };
  debateOutline?: {
    personaPlans?: Array<{ personaId: string; planId: string }>;
    synthesisPlanId?: string;
  };
  parallelPlans?: Array<{ planId: string; techniques: string[] }>;
  coordinationStrategy?: unknown;
}

let client: MCPClientTestHelper;

beforeAll(async () => {
  client = new MCPClientTestHelper();
  await client.connect();
}, 30_000);

afterAll(async () => {
  await client.disconnect();
}, 30_000);

function textOf(result: { content: Array<{ type: string }> }): string {
  const first = result.content[0];
  if (first?.type !== 'text') {
    throw new Error(`expected a text content item, got ${first?.type ?? 'nothing'}`);
  }
  return (first as { type: 'text'; text: string }).text;
}

/**
 * Plans a two-persona debate and returns what the caller actually receives.
 *
 * Through the real client rather than a hand-built `ResponseBuilder`. The
 * fields were lost in the response allowlist, so asserting on the plan object
 * would have passed throughout the defect — and constructing the builder here
 * would assert against a reconstruction of the response path rather than the
 * path itself. `personas` and `debateFormat` also never meet the planning
 * validator that way.
 */
async function debatePlan(): Promise<DebateResponse> {
  return JSON.parse(
    textOf(
      await client.callTool('plan_thinking_session', {
        problem: PROBLEM,
        techniques: ['six_hats'],
        timeframe: 'thorough',
        personas: ['nassim_taleb', 'rory_sutherland'],
        debateFormat: 'structured',
      })
    )
  ) as DebateResponse;
}

describe('a two-persona debate arrives at the caller', () => {
  it('names both personas and says it is a debate', async () => {
    const data = await debatePlan();

    expect(data.personaContext, 'personaContext never left the server').toBeDefined();
    expect(data.personaContext?.activePersonas?.map(p => p.id)).toEqual([
      'nassim_taleb',
      'rory_sutherland',
    ]);
    expect(data.personaContext?.isDebateMode).toBe(true);
  });

  it('returns a plan per persona plus a synthesis plan', async () => {
    const data = await debatePlan();

    // Two voices and the thing that reconciles them. Without the synthesis
    // plan a debate is two monologues.
    expect(data.parallelPlans, 'the orchestrator ran and its plans were dropped').toHaveLength(3);

    const outline = data.debateOutline;
    expect(outline?.personaPlans?.map(p => p.personaId)).toEqual([
      'nassim_taleb',
      'rory_sutherland',
    ]);
    expect(outline?.synthesisPlanId).toBeDefined();

    // Every planId in the outline has to be one the caller can actually
    // execute — an id naming a plan that is not returned is worse than none.
    const returned = new Set(data.parallelPlans?.map(p => p.planId));
    for (const plan of outline?.personaPlans ?? []) {
      expect(returned.has(plan.planId), `${plan.personaId}'s planId is not among the plans`).toBe(
        true
      );
    }
    expect(returned.has(outline?.synthesisPlanId ?? '')).toBe(true);
  });

  it('gives each persona plan that persona to speak in', async () => {
    const data = await debatePlan();
    const [taleb, rory] = data.parallelPlans ?? [];

    // The guidance has to differ, or the parallel plans are three copies and
    // the debate is a formality.
    expect(JSON.stringify(taleb)).toMatch(/taleb|antifragil|black swan|ruin|barbell/i);
    expect(JSON.stringify(rory)).toMatch(/rory|sutherland|perceiv|psycholog|behaviou?ral/i);
  });

  it('tells the caller how to run them', async () => {
    const data = await debatePlan();

    expect(data.coordinationStrategy, 'no instruction for sequencing the debate').toBeDefined();
  });

  it('says nothing about debates when only one persona is asked for', async () => {
    const data = JSON.parse(
      textOf(
        await client.callTool('plan_thinking_session', {
          problem: PROBLEM,
          techniques: ['six_hats'],
          timeframe: 'thorough',
          persona: 'nassim_taleb',
        })
      )
    ) as DebateResponse;

    // The control. Surfacing these fields must not mean inventing a debate
    // for a caller who asked for one voice.
    expect(data.personaContext?.isDebateMode).toBe(false);
    expect(data.debateOutline).toBeUndefined();
    expect(data.parallelPlans).toBeUndefined();
  });
});
