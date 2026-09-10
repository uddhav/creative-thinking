/**
 * The session export and the session file carry session state once
 * (#415, #416), observed where a caller observes them: the JSON export
 * through the built server, and the file the filesystem adapter writes.
 *
 * The JSON export was `JSON.stringify(session)` of the live SessionData, so
 * it carried the per-process ergodicity manager (43.6% of a three-step
 * export) with a second, byte-identical copy of `pathMemory`, the manager's
 * subsystems' empty learning slots (#416, which no production path can
 * populate), and on every history entry the server's own prompt text
 * (`ergodicityCheck`, `ruinAssessment.prompt`), read by nothing, and (since
 * 3.0.0) the orchestrator's per-step copy of `session.riskDiscoveryData`,
 * 53% of each entry and read by nothing there. The session file wrote every
 * history entry twice, `{ input, output }` byte-identical, and read only
 * `input`.
 *
 * Breaks: stringify the whole session (manager and duplicate reappear);
 * drop `ergodicityCheck`, `ruinAssessment` or `riskDiscoveryData` from the
 * push destructure;
 * restore the `{ input, output }` writer (the file doubles); drop the
 * old-shape branch of `historyInput` (an old file loads with no fields).
 *
 * Runs the BUILT server (dist/): rebuild before trusting a kill-check.
 */
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

// A gate word so the ruin assessment runs and `ruinAssessment.prompt` would land.
const PROBLEM = 'should I change careers, and what is the risk if it fails';

function textOf(result: { content: Array<{ type: string; text?: string }> }): string {
  return result.content[0]?.text ?? '';
}

interface Exported {
  ergodicityManager?: unknown;
  pathMemory?: unknown;
  history?: Array<Record<string, unknown>>;
}

describe('session export and file (#415, #416)', () => {
  let client: MCPClientTestHelper;
  let dir: string;

  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), 'ct-export-415-'));
    client = new MCPClientTestHelper();
    await client.connect({
      env: { ...process.env, PERSISTENCE_TYPE: 'filesystem', PERSISTENCE_PATH: dir },
    });
  });

  afterAll(async () => {
    await client.disconnect();
    rmSync(dir, { recursive: true, force: true });
  });

  async function threeSteps(): Promise<string> {
    const plan = JSON.parse(
      textOf(
        await client.callTool('plan_thinking_session', {
          problem: PROBLEM,
          techniques: ['six_hats'],
        })
      )
    ) as { planId: string };
    let sessionId: string | undefined;
    for (let s = 1; s <= 3; s++) {
      const r = JSON.parse(
        textOf(
          await client.callTool('execute_thinking_step', {
            planId: plan.planId,
            ...(sessionId ? { sessionId } : {}),
            technique: 'six_hats',
            problem: PROBLEM,
            currentStep: s,
            totalSteps: 7,
            output: `six_hats step ${s}: this could ruin us if the risk is real`,
            nextStepNeeded: true,
            autoSave: true,
          })
        )
      ) as { sessionId?: string };
      sessionId = r.sessionId ?? sessionId;
    }
    return sessionId as string;
  }

  it('the export is the session state: no manager, one pathMemory, no prompt on any entry', async () => {
    const sessionId = await threeSteps();
    const exported = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          sessionOperation: 'export',
          exportOptions: { sessionId, format: 'json' },
        })
      )
    ) as { result?: { data?: string } };
    const raw = exported.result?.data ?? '';
    const session = JSON.parse(raw) as Exported;
    expect(session).not.toHaveProperty('ergodicityManager');
    expect(session).toHaveProperty('pathMemory');
    expect((raw.match(/"pathHistory"/g) ?? []).length, 'pathMemory serialised more than once').toBe(
      1
    );
    expect(session.history).toHaveLength(3);
    for (const entry of session.history ?? []) {
      expect(entry).not.toHaveProperty('ergodicityCheck');
      expect(entry).not.toHaveProperty('riskDiscoveryData');
      const ruin = entry.ruinAssessment as { prompt?: unknown } | undefined;
      if (ruin) expect(ruin).not.toHaveProperty('prompt');
    }
    // The session-level copy stays: it is the live assessment, not an echo.
    expect(session).toHaveProperty('riskDiscoveryData');
  }, 60_000);

  it('the file holds each entry once, and a file written in the old shape still loads', async () => {
    const sessionId = await threeSteps();
    const file = path.join(dir, 'sessions', `${sessionId}.json`);
    expect(existsSync(file), `no session file under ${dir}: ${readdirSync(dir).join(',')}`).toBe(
      true
    );
    const saved = JSON.parse(readFileSync(file, 'utf8')) as {
      data: { history: Array<Record<string, unknown>> };
    };
    expect(saved.data.history).toHaveLength(3);
    for (const entry of saved.data.history) {
      // Flat: the step's own fields, not a { input, output } wrapper.
      expect(entry).not.toHaveProperty('input');
      expect(typeof entry.output).toBe('string');
      expect(entry).toHaveProperty('technique', 'six_hats');
    }

    // An old-shape file: the same session, every entry wrapped as { input, output }.
    const oldId = `${sessionId}_old`;
    const wrapped = {
      ...saved,
      data: {
        ...saved.data,
        id: oldId,
        history: saved.data.history.map((entry, i) => ({
          step: i + 1,
          timestamp: entry.timestamp,
          input: entry,
          output: entry,
        })),
      },
    };
    writeFileSync(path.join(dir, 'sessions', `${oldId}.json`), JSON.stringify(wrapped));
    const loaded = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          sessionOperation: 'load',
          loadOptions: { sessionId: oldId },
        })
      )
    ) as { result?: { session?: { stepsCompleted?: number; lastStep?: number } } };
    // The load summary reads `currentStep` off the last entry: with the
    // old-shape branch dropped, the wrapper spreads instead of its `input`,
    // `currentStep` is undefined and `lastStep` reads 0.
    expect(loaded.result?.session?.stepsCompleted, 'old-shape file did not load').toBe(3);
    expect(loaded.result?.session?.lastStep, 'old-shape entry lost its fields').toBe(3);
    const reExported = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          sessionOperation: 'export',
          exportOptions: { sessionId: oldId, format: 'json' },
        })
      )
    ) as { result?: { data?: string } };
    const reloaded = JSON.parse(reExported.result?.data ?? '{}') as Exported;
    expect(reloaded.history).toHaveLength(3);
    expect(typeof reloaded.history?.[0]?.output).toBe('string');
  }, 60_000);

  it('a caller-sent field named input does not turn a flat entry into a wrapper on reload', async () => {
    // Break: discriminate the old shape on `'input' in entry` instead of on
    // `technique`. The execute schema admits unknown fields and every one
    // lands on the history entry, so a step carrying `input: "…"` would be
    // read as the old wrapper and lose its fields.
    const plan = JSON.parse(
      textOf(
        await client.callTool('plan_thinking_session', {
          problem: PROBLEM,
          techniques: ['six_hats'],
        })
      )
    ) as { planId: string };
    const first = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          planId: plan.planId,
          technique: 'six_hats',
          problem: PROBLEM,
          currentStep: 1,
          totalSteps: 7,
          output: 'six_hats step 1 with a field the schema does not know',
          nextStepNeeded: true,
          autoSave: true,
          input: 'forged by caller',
        })
      )
    ) as { sessionId: string };
    const loaded = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          sessionOperation: 'load',
          loadOptions: { sessionId: first.sessionId },
        })
      )
    ) as { result?: { session?: { stepsCompleted?: number; lastStep?: number } } };
    expect(loaded.result?.session?.stepsCompleted).toBe(1);
    expect(loaded.result?.session?.lastStep, 'the flat entry was read as a wrapper').toBe(1);
  }, 60_000);
});
