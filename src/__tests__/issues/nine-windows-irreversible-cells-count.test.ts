/**
 * A cell the caller marks irreversible is a declared foreclosure.
 *
 * Since #303 the constraint warnings fire only on content-provenance
 * constraints, and the sole producer was a downward `stepReversibility` claim.
 * #310 asked for a second organic producer that does not require callers to
 * adopt a new field.
 *
 * `nineWindowsMatrix[]` already carries `irreversible: boolean` per cell,
 * caller-supplied and validated cell by cell by `ObjectFieldValidator`. Marking
 * a cell irreversible is the same shape as a downward reversibility claim — the
 * caller declaring the world is more committed than the server assumed — and it
 * reached `extractInsights` as prose while never reaching `pathsForeclosed`.
 * That asymmetry is what this closes.
 *
 * Two decisions, made rather than left implicit:
 *
 * - `past` cells do not count. They describe what the system used to be, which
 *   is history rather than a commitment made in this session. `present` and
 *   `future` both do.
 * - The constraint text is the cell's own `content` plus its
 *   `pathDependencies`, matching both the existing producer's use of the
 *   caller's own words and the insight line the handler already emits.
 *
 * Steps 7-9 of nine_windows are `action` steps and 1-6 are `thinking`, and
 * callers repeat the whole matrix on every step (which is why
 * NineWindowsHandler dedups its insights), so the matrix reliably reaches a
 * step where content constraints are counted.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Whether to retire the on-premise billing cluster';
const FUTURE_CELL = 'Billing runs only in the managed service';
const PRESENT_CELL = 'The cluster already holds three years of ledger state';
const PAST_CELL = 'Billing was originally a single mainframe batch';
const DEPENDENCY = 'ledger export format is frozen';
const LEAK_MARKER = 'Matrix cell smuggled in on a scamper step';
const DUPE_CELL = 'The same future system cell sent more than once';

const stateDir = mkdtempSync(path.join(tmpdir(), 'ct-ninewindows-'));
// A separate root, so counting entries in one test is not confused by sessions
// another test wrote.
const dupeDir = mkdtempSync(path.join(tmpdir(), 'ct-ninewindows-dupe-'));

afterAll(() => {
  rmSync(stateDir, { recursive: true, force: true });
  rmSync(dupeDir, { recursive: true, force: true });
});

function textOf(result: { content: Array<{ type: string }> }): string {
  const first = result.content[0];
  if (first?.type !== 'text') {
    throw new Error(`expected a text content item, got ${first?.type ?? 'nothing'}`);
  }
  return (first as { type: 'text'; text: string }).text;
}

/**
 * The `pathsForeclosed` list off the persisted session.
 *
 * Two layers, both of which caught out earlier versions of this guard. The
 * stored file is an envelope (`version`, `format`, `compressed`, `encrypted`,
 * `data`), and the whole SessionState — `reflexivity` included — is inside
 * `data`, not beside it. And `data` is a JSON *string* in some envelopes and an
 * object in others depending on which save path wrote it, so both are handled.
 *
 * Grepping the raw file does NOT work as a substitute: the cell text is present
 * either way, echoed in the stored history entry and again in the insight
 * prose, so a whole-file assertion is green with no producer at all.
 */
function foreclosedPaths(root: string = stateDir): string[] {
  const dir = path.join(root, 'sessions');
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const envelope = JSON.parse(readFileSync(path.join(dir, name), 'utf8')) as { data?: unknown };
    const inner = (
      typeof envelope.data === 'string' ? JSON.parse(envelope.data) : envelope.data
    ) as { reflexivity?: { realityState?: { pathsForeclosed?: string[] } } } | undefined;
    found.push(...(inner?.reflexivity?.realityState?.pathsForeclosed ?? []));
  }
  return found;
}

describe('an irreversible nine_windows cell is a declared constraint', () => {
  it('records present and future cells, and not past ones', async () => {
    const client = new MCPClientTestHelper();
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) env[key] = value;
    }
    env.PERSISTENCE_TYPE = 'filesystem';
    env.PERSISTENCE_PATH = stateDir;
    await client.connect({ env });

    try {
      const plan = JSON.parse(
        textOf(
          await client.callTool('plan_thinking_session', {
            problem: PROBLEM,
            techniques: ['nine_windows'],
          })
        )
      ) as { planId: string };

      // Step 7 is the first ACTION step (Future Sub-system). Content-provenance
      // constraints are only counted on action steps, so this is where a
      // declared foreclosure can land.
      await client.callTool('execute_thinking_step', {
        planId: plan.planId,
        technique: 'nine_windows',
        problem: PROBLEM,
        currentStep: 7,
        totalSteps: 9,
        output: 'Committing to the managed service for the future sub-system.',
        nineWindowsMatrix: [
          {
            timeFrame: 'past',
            systemLevel: 'system',
            content: PAST_CELL,
            irreversible: true,
          },
          {
            timeFrame: 'present',
            systemLevel: 'system',
            content: PRESENT_CELL,
            irreversible: true,
          },
          {
            timeFrame: 'future',
            systemLevel: 'sub-system',
            content: FUTURE_CELL,
            pathDependencies: [DEPENDENCY],
            irreversible: true,
          },
          // A future cell NOT marked irreversible must not be recorded — the
          // flag is what is being read, not the presence of a cell.
          {
            timeFrame: 'future',
            systemLevel: 'super-system',
            content: 'Finance reporting could move later',
            irreversible: false,
          },
        ],
        nextStepNeeded: true,
        autoSave: true,
      });

      // Assert on pathsForeclosed specifically, NOT on the file as a whole.
      // The cell text is in the file either way — the matrix is echoed back in
      // the stored history entry and again in the insight prose — so a
      // whole-file assertion passes without the producer and proves nothing.
      // (It did: the first version of this guard was green before the producer
      // existed, which is what sent it back for a rewrite.)
      const foreclosed = foreclosedPaths().join('\n');
      expect(foreclosed, 'no pathsForeclosed recorded at all').not.toBe('');

      expect(foreclosed, 'the future cell was not recorded as foreclosed').toContain(FUTURE_CELL);
      expect(foreclosed, 'its path dependency was dropped').toContain(DEPENDENCY);
      expect(foreclosed, 'the present cell was not recorded as foreclosed').toContain(PRESENT_CELL);
      expect(foreclosed, 'a past cell was counted as a new commitment').not.toContain(PAST_CELL);
      expect(foreclosed, 'a reversible cell was counted').not.toContain('Finance reporting');
    } finally {
      await client.disconnect();
    }
  });

  it('counts a repeated cell once, and bounds what it records', async () => {
    // ReflexivityTracker filters an incoming batch against the array as it
    // stood BEFORE the push, not against the batch itself — so duplicates
    // within one matrix all survived. Measured before the fix: three identical
    // cells recorded three constraints and contentConstraintCount read 3.
    //
    // Nothing had exercised that path, because the only other content producer
    // emits exactly one string per call and a batch of one cannot contain
    // duplicates. This producer is the first that can.
    const client = new MCPClientTestHelper();
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) env[key] = value;
    }
    env.PERSISTENCE_TYPE = 'filesystem';
    env.PERSISTENCE_PATH = dupeDir;
    await client.connect({ env });

    try {
      const plan = JSON.parse(
        textOf(
          await client.callTool('plan_thinking_session', {
            problem: PROBLEM,
            techniques: ['nine_windows'],
          })
        )
      ) as { planId: string };

      const cell = {
        timeFrame: 'future',
        systemLevel: 'system',
        content: DUPE_CELL,
        irreversible: true,
      };

      await client.callTool('execute_thinking_step', {
        planId: plan.planId,
        technique: 'nine_windows',
        problem: PROBLEM,
        currentStep: 7,
        totalSteps: 9,
        output: 'Committing to the future system.',
        nineWindowsMatrix: [
          cell,
          { ...cell },
          { ...cell },
          // Same coordinates, restated: the newest wording wins, still once.
          { ...cell, content: `${DUPE_CELL} (restated)` },
          // Caller constraints bypass the tracker's 1000-char cap on purpose,
          // and nothing else bounds cell content — so the producer caps it.
          {
            timeFrame: 'present',
            systemLevel: 'sub-system',
            content: 'X'.repeat(5000),
            irreversible: true,
          },
        ],
        nextStepNeeded: true,
        autoSave: true,
      });

      const recorded = foreclosedPaths(dupeDir);
      const forThatCell = recorded.filter(p => p.includes(DUPE_CELL));
      expect(forThatCell, `one cell recorded ${forThatCell.length} times`).toHaveLength(1);
      expect(forThatCell[0], 'the newest wording did not win').toContain('(restated)');

      const longest = Math.max(...recorded.map(p => p.length));
      expect(longest, 'an unbounded cell body reached pathsForeclosed').toBeLessThan(1200);
    } finally {
      await client.disconnect();
    }
  });

  it('ignores a matrix sent with a different technique', async () => {
    // `nineWindowsMatrix` sits on the shared input type, and its cell-by-cell
    // validation in ValidationStrategies sits under `case 'nine_windows'` — so
    // on any other technique the field is neither validated nor rejected.
    // Measured before the technique gate existed: this recorded
    // "Caller-declared (nine_windows future system): …" against a SCAMPER
    // session, from cells ObjectFieldValidator had never inspected.
    const client = new MCPClientTestHelper();
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) env[key] = value;
    }
    env.PERSISTENCE_TYPE = 'filesystem';
    env.PERSISTENCE_PATH = stateDir;
    await client.connect({ env });

    try {
      const plan = JSON.parse(
        textOf(
          await client.callTool('plan_thinking_session', {
            problem: PROBLEM,
            techniques: ['scamper'],
          })
        )
      ) as { planId: string };

      await client.callTool('execute_thinking_step', {
        planId: plan.planId,
        technique: 'scamper',
        problem: PROBLEM,
        currentStep: 4,
        totalSteps: 8,
        scamperAction: 'modify',
        output: 'Modifying the billing batch window.',
        nineWindowsMatrix: [
          {
            timeFrame: 'future',
            systemLevel: 'system',
            content: LEAK_MARKER,
            irreversible: true,
          },
        ],
        nextStepNeeded: true,
        autoSave: true,
      });

      expect(
        foreclosedPaths().join('\n'),
        'a nine_windows field injected a constraint into another technique'
      ).not.toContain(LEAK_MARKER);
    } finally {
      await client.disconnect();
    }
  });
});
