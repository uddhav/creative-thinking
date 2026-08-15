/**
 * A session named by a caller has to be the session the server had.
 *
 * `ExecutionValidator` looks a `sessionId` up in memory and, finding nothing,
 * creates a new session under the caller's id and reports success. In one
 * process that is harmless — the id can only be unknown if the caller invented
 * it. Across a restart it is data loss reported as a step.
 *
 * Measured before the fix, two server processes sharing one PERSISTENCE_PATH:
 * six committing steps in the first, saved with `flexibility 0.4754` and a
 * six-event path history. A step in the second process naming that same
 * sessionId returned `historyLength: 1` and `flexibility 0.975`. The stored
 * work was on disk, complete and correct, and ignored.
 *
 * The CLI never had this, because `hydrateSession` loads from disk before
 * calling in. The MCP server had no equivalent, so `socketes` resumed and the
 * server it shares its code with did not. The load now happens in the layer,
 * which covers both.
 *
 * Two claims corrected by the measurement that produced this file. The project
 * notes say persistence does not save `pathMemory`; it does — read out of the
 * stored JSON at flexibility 0.4754 with six events. And a first pass here
 * reported nothing written to disk at all, which was a probe looking under
 * `state/sessions/`: that prefix is the CLI's, and the server writes to
 * `sessions/`.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Cut the release train from monthly to weekly';
const TECHNIQUES = ['context_reframing', 'context_reframing', 'context_reframing'];
const STEPS_BEFORE_RESTART = 6;

const stateDir = mkdtempSync(path.join(tmpdir(), 'ct-resume-'));

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
  sessionId?: string;
  historyLength?: number;
  ergodicityMetrics?: { currentFlexibility?: number };
}

describe('a persisted session survives the process that made it', () => {
  it('resumes with its history and its spent flexibility', async () => {
    const first = await connectedClient();
    let sessionId: string | undefined;
    let before: StepResponse = {};

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

      for (let step = 1; step <= STEPS_BEFORE_RESTART; step++) {
        before = JSON.parse(
          textOf(
            await first.callTool('execute_thinking_step', {
              planId: plan.planId,
              ...(sessionId ? { sessionId } : {}),
              technique: 'context_reframing',
              problem: PROBLEM,
              currentStep: step,
              totalSteps: plan.estimatedSteps,
              output: `Finding ${step}, written plainly and at length for the record.`,
              nextStepNeeded: true,
              autoSave: true,
            })
          )
        ) as StepResponse;
        sessionId = before.sessionId ?? sessionId;
      }
    } finally {
      await first.disconnect();
    }

    const spent = before.ergodicityMetrics?.currentFlexibility ?? 1;
    expect(spent, 'six committing steps must have cost something').toBeLessThan(0.9);

    // On disk, before anything reads it back.
    const stored = path.join(stateDir, 'sessions');
    expect(existsSync(stored), 'nothing was persisted').toBe(true);
    const file = readdirSync(stored).find(name => name.includes(sessionId?.slice(-12) ?? '~'));
    expect(file, 'the session was not written under its own id').toBeDefined();
    const envelope = JSON.parse(readFileSync(path.join(stored, file as string), 'utf8')) as {
      data: unknown;
    };
    // `data` is a JSON string in some envelopes and an object in others,
    // depending on which save path wrote it. Take both.
    const inner = (
      typeof envelope.data === 'string' ? JSON.parse(envelope.data) : envelope.data
    ) as { pathMemory?: { pathHistory?: unknown[] } };
    expect(inner.pathMemory?.pathHistory, 'pathMemory did not survive persistence').toHaveLength(
      STEPS_BEFORE_RESTART
    );

    // A second process, which has never seen this session.
    const second = await connectedClient();
    try {
      const plan = JSON.parse(
        textOf(
          await second.callTool('plan_thinking_session', {
            problem: PROBLEM,
            techniques: TECHNIQUES,
            timeframe: 'thorough',
          })
        )
      ) as { planId: string; estimatedSteps: number };

      const after = JSON.parse(
        textOf(
          await second.callTool('execute_thinking_step', {
            planId: plan.planId,
            sessionId,
            technique: 'context_reframing',
            problem: PROBLEM,
            currentStep: STEPS_BEFORE_RESTART + 1,
            totalSteps: plan.estimatedSteps,
            output: 'A finding after the restart, written plainly and at length.',
            nextStepNeeded: true,
          })
        )
      ) as StepResponse;

      // The two readings that separate a resume from a fresh start.
      expect(
        after.historyLength,
        'the resumed session forgot everything it had already recorded'
      ).toBe(STEPS_BEFORE_RESTART + 1);
      expect(
        after.ergodicityMetrics?.currentFlexibility,
        'the resumed session started again at full flexibility'
      ).toBeLessThan(spent);
    } finally {
      await second.disconnect();
    }
  }, 120_000);
});
