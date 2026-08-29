/**
 * A step the completion gatekeeper vetoes still has to reach disk.
 *
 * `executeThinkingStep` pushes the step into `session.history` and then, if the
 * termination is vetoed, returns the blocking response — above the `autoSave`
 * block further down (`src/layers/execution.ts`). In a long-running server that
 * is invisible: the step is in memory and the next call saves it. In the CLI
 * the process exits, and the only other save path is an explicit
 * `sessionOperation: 'save'`, so the caller loses the step and has to re-send
 * it. See #307.
 *
 * The veto is a decision about the shape of the response, not a rollback of
 * state — the step happened either way. What the veto exists to prevent is
 * `endTime` being set and the session being recorded as completed, and saving
 * an *active* session does not do that.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Decide whether to consolidate the two billing services';
const MARKER = 'This vetoed step must survive to disk under marker c7f1a9.';

const stateDir = mkdtempSync(path.join(tmpdir(), 'ct-blocked-step-'));

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

describe('a vetoed termination does not lose the step', () => {
  it('persists the step it just refused to end on', async () => {
    const client = new MCPClientTestHelper();
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) env[key] = value;
    }
    env.PERSISTENCE_TYPE = 'filesystem';
    env.PERSISTENCE_PATH = stateDir;
    // The gate only runs above NONE; `standard` is the default but pin it, so
    // this cannot start passing because someone changed a default.
    env.COMPLETION_ENFORCEMENT_MODE = 'standard';
    await client.connect({ env });

    try {
      const plan = JSON.parse(
        textOf(
          await client.callTool('plan_thinking_session', {
            problem: PROBLEM,
            techniques: ['six_hats'],
          })
        )
      ) as { planId: string; estimatedSteps: number };

      // End on step 1 of seven (SixHatsHandler declares 7). Every later step is
      // skipped, so the gatekeeper refuses the termination. The veto comes from
      // the skipped steps in techniqueStatuses rather than from this number,
      // but it should still say what the technique says.
      const blocked = JSON.parse(
        textOf(
          await client.callTool('execute_thinking_step', {
            planId: plan.planId,
            technique: 'six_hats',
            problem: PROBLEM,
            currentStep: 1,
            totalSteps: 7,
            hatColor: 'blue',
            output: MARKER,
            nextStepNeeded: false,
            autoSave: true,
          })
        )
      ) as Record<string, unknown>;

      // Confirm the premise: this really was refused. Without this the test
      // would still pass if the gate stopped firing, while covering nothing.
      const looksBlocked =
        blocked.blocked === true ||
        blocked.isError === true ||
        typeof blocked.completionStatus === 'object';
      expect(looksBlocked, `expected a blocking response, got ${JSON.stringify(blocked)}`).toBe(
        true
      );

      const sessions = path.join(stateDir, 'sessions');
      expect(existsSync(sessions), 'the vetoed step was never written to disk').toBe(true);

      const written = readdirSync(sessions)
        .map(name => readFileSync(path.join(sessions, name), 'utf8'))
        .join('\n');
      expect(written, 'the step is on no session on disk').toContain(MARKER);
    } finally {
      await client.disconnect();
    }
  });
});
