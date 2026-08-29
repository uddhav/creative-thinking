/**
 * A planId issued by one server process has to work in the next one.
 *
 * `PlanManager` keeps plans in a plain in-memory Map, and nothing outside
 * `src/cli/` ever wrote them down. So the two binaries disagreed about whether
 * a planId outlives the process that issued it: `socketes` hydrated from
 * `plans/<planId>.json` on every invocation and worked, while the MCP server
 * handed the same id to a second process resolved it to `PLAN_NOT_FOUND`
 * (`ExecutionValidator`). Sessions already crossed this boundary — see
 * session-resumes-across-processes.test.ts — and plans were the half that had
 * not come along, so a restarted server could restore what was said and not
 * what was being executed. See #316.
 *
 * This covers the ordinary `plan_<uuid>` id specifically. An *encoded* planId
 * decodes to a reconstructed `minimalPlan` and has always executed, which is
 * why the gap stayed invisible: long-lived clients tend to hold encoded ids.
 * That path is not a substitute — the reconstruction gives every workflow step
 * an empty `description` and `expectedOutput`, so it executes with no step
 * guidance. The assertion below therefore pins the id format first; if plan ids
 * ever become encoded by default, this test would otherwise keep passing while
 * covering nothing.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';
import { SessionManager } from '../../core/SessionManager.js';

const PROBLEM = 'Decide whether to keep the nightly reconciliation job';
const TECHNIQUES = ['six_hats'];

const stateDir = mkdtempSync(path.join(tmpdir(), 'ct-plan-resume-'));

afterAll(() => {
  rmSync(stateDir, { recursive: true, force: true });
});

function textOf(result: { content: Array<{ type: string }> }): string {
  const first = result.content[0];
  if (first?.type !== 'text') {
    throw new Error(`expected a text content item, got ${first?.type ?? 'nothing'}`);
  }
  return (first as { type: 'text'; text: string }).text;
}

/** A client whose server persists to the shared directory. */
async function connectedClient(): Promise<MCPClientTestHelper> {
  const client = new MCPClientTestHelper();
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  env.PERSISTENCE_TYPE = 'filesystem';
  env.PERSISTENCE_PATH = stateDir;
  await client.connect({ env });
  return client;
}

interface StepResponse {
  technique?: string;
  currentStep?: number;
  sessionId?: string;
  error?: string;
  code?: string;
}

describe('a plan survives the process that issued it', () => {
  it('executes in a second process under the same planId', async () => {
    const first = await connectedClient();
    let planId: string;
    let estimatedSteps: number;

    try {
      const plan = JSON.parse(
        textOf(
          await first.callTool('plan_thinking_session', {
            problem: PROBLEM,
            techniques: TECHNIQUES,
            timeframe: 'thorough',
          })
        )
      ) as { planId: string; estimatedSteps: number };
      planId = plan.planId;
      estimatedSteps = plan.estimatedSteps;

      // The path under test is the plain id, not the encoded one.
      expect(planId, 'this test only covers unencoded plan ids').toMatch(/^plan_/);
    } finally {
      await first.disconnect();
    }

    // Written down before anything reads it back, under the layout CLAUDE.md
    // documents: plans/ directly under PERSISTENCE_PATH, no state/ prefix.
    const storedPlans = path.join(stateDir, 'plans');
    expect(existsSync(storedPlans), 'the plan was never persisted').toBe(true);
    expect(
      readdirSync(storedPlans).some(name => name.includes(planId)),
      'the plan was not written under its own id'
    ).toBe(true);

    // A second process, which has never seen this plan and is not given a
    // chance to re-plan — re-planning is the workaround this closes.
    const second = await connectedClient();
    try {
      const after = JSON.parse(
        textOf(
          await second.callTool('execute_thinking_step', {
            planId,
            technique: 'six_hats',
            problem: PROBLEM,
            currentStep: 1,
            totalSteps: estimatedSteps,
            hatColor: 'blue',
            output: 'Framing the decision before the other hats run.',
            nextStepNeeded: true,
            autoSave: true,
          })
        )
      ) as StepResponse;

      expect(after.code, `second process refused the plan: ${after.error ?? ''}`).toBeUndefined();
      expect(after.technique).toBe('six_hats');
      expect(after.currentStep).toBe(1);
      expect(after.sessionId, 'no session was started for the resumed plan').toBeTruthy();
    } finally {
      await second.disconnect();
    }
  });
});

/**
 * The plan store turns a planId into a filename, and `planId` is caller-
 * supplied. `ValidationStrategies` checks that it is a string and stops there,
 * so nothing upstream constrains its shape.
 *
 * This mattered less while the store was CLI-only — the id came from the local
 * user's own shell. Making it shared put it on the MCP tool surface, so the
 * containment is asserted rather than assumed. Measured before the guard
 * existed: `planId: '../outside'` loaded a JSON file from outside `plans/`.
 */
/**
 * Debate mode advertises per-persona and synthesis planIds the caller is told
 * to execute, so each has to survive the same restart. They are not named
 * `plan_*` — `DebateOrchestrator` issues `debate_${persona.id}_${uuid}` and
 * `debate_synthesis_${uuid}` — and the first version of the containment pattern
 * below accepted only `plan_`, which silently switched debate persistence back
 * off. Nothing caught it, because the loop that persists those ids had no test.
 * This is that test.
 */
describe('the planIds a debate hands out survive too', () => {
  it('persists every advertised debate plan', async () => {
    const client = await connectedClient();
    try {
      const debate = JSON.parse(
        textOf(
          await client.callTool('plan_thinking_session', {
            problem: 'Should the reconciliation job stay nightly?',
            techniques: ['six_hats'],
            personas: ['rory_sutherland', 'nassim_taleb'],
          })
        )
      ) as { planId?: string; parallelPlans?: Array<{ planId: string }> };

      const advertised = [
        ...(debate.planId ? [debate.planId] : []),
        ...(debate.parallelPlans ?? []).map(p => p.planId),
      ];
      expect(advertised.length, 'debate mode advertised no planIds').toBeGreaterThan(1);

      const written = readdirSync(path.join(stateDir, 'plans'));
      for (const id of advertised) {
        expect(
          written.some(name => name === `${id}.json`),
          `advertised planId ${id} was not persisted`
        ).toBe(true);
      }
    } finally {
      await client.disconnect();
    }
  });
});

describe('the plan store stays inside its own directory', () => {
  it('refuses a planId that would escape plans/', () => {
    const base = mkdtempSync(path.join(tmpdir(), 'ct-plan-escape-'));
    const previousType = process.env.PERSISTENCE_TYPE;
    const previousPath = process.env.PERSISTENCE_PATH;
    process.env.PERSISTENCE_TYPE = 'filesystem';
    process.env.PERSISTENCE_PATH = base;

    try {
      mkdirSync(path.join(base, 'plans'), { recursive: true });

      // A well-formed plan file sitting outside plans/, whose own planId field
      // matches the traversal string — so the store's "does the id match the
      // file" check cannot be what rejects it.
      const escapingId = '../outside';
      writeFileSync(
        path.join(base, 'outside.json'),
        JSON.stringify({
          planId: escapingId,
          problem: 'contents from outside the plans directory',
          techniques: ['six_hats'],
          workflow: [],
          totalSteps: 6,
          executionMode: 'sequential',
        })
      );

      expect(
        new SessionManager().getPlan(escapingId),
        'a planId escaped the plans directory'
      ).toBeUndefined();
    } finally {
      if (previousType === undefined) delete process.env.PERSISTENCE_TYPE;
      else process.env.PERSISTENCE_TYPE = previousType;
      if (previousPath === undefined) delete process.env.PERSISTENCE_PATH;
      else process.env.PERSISTENCE_PATH = previousPath;
      rmSync(base, { recursive: true, force: true });
    }
  });
});
