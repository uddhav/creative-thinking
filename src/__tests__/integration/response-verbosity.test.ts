/**
 * Response verbosity: the minimal contract.
 *
 * Roughly 60% of a full response's tokens were repetition — the caller's own
 * problem and output echoed back, the cumulative insights list re-sent every
 * step, technique field values quoted back at their sender. 'minimal' keeps
 * the acknowledgment, the steering, and every warning/verdict, and replaces
 * the echoes with receipts (newInsights, fieldsRecorded). The allowlist is
 * exported (MINIMAL_RESPONSE_KEEP_KEYS) and pinned here as a SUBSET assertion
 * so a future warning-class field cannot silently vanish from minimal mode.
 * Default stays 'full' — zero break — with 'minimal' the declared future
 * default.
 *
 * retry is disabled: kill-checked guards; the global retry: 2 would let a
 * flaky pass mask exactly the regression this file exists to catch.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';
import { MINIMAL_RESPONSE_KEEP_KEYS } from '../../layers/execution/ExecutionResponseBuilder.js';

const PROBLEM = 'Streamline the quarterly planning ritual';

// Keys minimal mode may add beyond the flat keep-list: nested picks, the two
// receipt fields, the optimizer's truncation report, and the post-slim
// merges (completion block on the terminal step, autoSave status).
const MINIMAL_EXTRAS = new Set([
  'completionMetadata',
  'executionMetadata',
  'ruinAssessment',
  'newInsights',
  'fieldsRecorded',
  'truncation',
  'autoSaveStatus',
  'autoSaveMessage',
  'autoSaveError',
  // Terminal-step completion merge (handleSessionCompletion, post-slim):
  'sessionComplete',
  'completed',
  'techniqueUsed',
  'insights',
  'message',
  'metrics',
  'summary',
  'pathAnalysis',
  'warnings',
  'escapeOptions',
  'nextSteps',
]);

async function planId(client: MCPClientTestHelper, techniques: string[]): Promise<string> {
  const plan = await client.planThinkingSession(PROBLEM, techniques);
  return (plan as { planId: string }).planId;
}

describe('response verbosity (default-full server)', { retry: 0 }, () => {
  const client = new MCPClientTestHelper();

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('full mode (the default) still carries the documented contract', async () => {
    const id = await planId(client, ['scamper']);
    const data = (await client.executeThinkingStep({
      planId: id,
      technique: 'scamper',
      problem: PROBLEM,
      currentStep: 1,
      totalSteps: 8,
      output: 'Swap the slide deck for a one-page pre-read',
      nextStepNeeded: true,
      scamperAction: 'substitute',
    })) as Record<string, unknown>;

    // SOCKETES.md's documented output fields, unchanged by default.
    expect(data.sessionId).toBeDefined();
    expect(data.historyLength).toBe(1);
    expect(Array.isArray(data.insights)).toBe(true);
    expect(data.nextStepGuidance).toBeDefined();
    expect(data.problem).toBe(PROBLEM);
    expect(data.output).toContain('one-page pre-read');
  });

  it('minimal mode keeps only the allowlist (plus its declared extras)', async () => {
    const id = await planId(client, ['scamper']);
    const data = (await client.executeThinkingStep({
      planId: id,
      technique: 'scamper',
      problem: PROBLEM,
      currentStep: 1,
      totalSteps: 8,
      output: 'Swap the slide deck for a one-page pre-read',
      nextStepNeeded: true,
      scamperAction: 'substitute',
      verbosity: 'minimal',
    })) as Record<string, unknown>;

    const allowed = new Set<string>([...MINIMAL_RESPONSE_KEEP_KEYS, ...MINIMAL_EXTRAS]);
    for (const key of Object.keys(data)) {
      expect(allowed.has(key), `unexpected key in minimal response: ${key}`).toBe(true);
    }

    // The echoes are gone…
    expect(data.problem).toBeUndefined();
    expect(data.output).toBeUndefined();
    expect(data.modificationHistory).toBeUndefined();
    expect(data.scamperAction).toBeUndefined();
    expect(data.insights, 'cumulative insights are a full-mode field').toBeUndefined();
    expect(data.progressDisplay).toBeUndefined();

    // …replaced by receipts, with the ack and verdicts intact.
    expect(Array.isArray(data.newInsights)).toBe(true);
    expect(data.fieldsRecorded).toContain('scamperAction');
    expect(data.sessionId).toBeDefined();
    expect(data.historyLength).toBe(1);
    expect(data.nextStepGuidance).toBeDefined();
    expect(data.ergodicityMetrics, 'verdict fields must survive minimal').toBeDefined();

    // scamper always gets a ruin check; its verdict survives, its prompt does
    // not (it was boilerplate plus a quote of the caller's own text).
    const ruin = data.ruinAssessment as Record<string, unknown> | undefined;
    if (ruin) {
      expect(ruin.prompt).toBeUndefined();
    }
  });

  it('a warning-bearing step keeps its warning in minimal mode', async () => {
    // A downward reversibility claim fires the content-constraint warning
    // (path_foreclosed) — assert it reaches a minimal-mode caller.
    const id = await planId(client, ['scamper']);
    const data = (await client.executeThinkingStep({
      planId: id,
      technique: 'scamper',
      problem: PROBLEM,
      currentStep: 4,
      totalSteps: 8,
      output: 'Committing to the vendor template',
      nextStepNeeded: true,
      scamperAction: 'modify',
      stepReversibility: { level: 'low', rationale: 'Annual contract signed with the vendor' },
      verbosity: 'minimal',
    })) as Record<string, unknown>;

    const warning = data.reflexivityWarning as Record<string, unknown> | undefined;
    expect(warning, 'the warning must survive minimal mode').toBeDefined();
    expect(warning?.type).toBe('path_foreclosed');
    const audit = (data.executionMetadata as Record<string, unknown> | undefined)
      ?.appliedReversibility;
    expect(audit, 'the clamp audit must survive minimal mode').toBeDefined();
  });

  it('the terminal step keeps its full completion block in minimal mode', async () => {
    const id = await planId(client, ['triz']);
    let sessionId: string | undefined;
    let last: Record<string, unknown> = {};
    for (let step = 1; step <= 4; step++) {
      last = await client.executeThinkingStep({
        planId: id,
        technique: 'triz',
        problem: PROBLEM,
        currentStep: step,
        totalSteps: 4,
        output: `TRIZ step ${step}`,
        nextStepNeeded: step < 4,
        verbosity: 'minimal',
        ...(sessionId ? { sessionId } : {}),
      });
      sessionId = last.sessionId as string;
    }

    expect(last.sessionComplete).toBe(true);
    expect(last.completed).toBe(true);
    expect(last.metrics, 'the completion metrics bypass slimming').toBeDefined();
    expect(last.summary).toBeDefined();
  });
});

describe('response verbosity (env-default-minimal server)', { retry: 0 }, () => {
  const client = new MCPClientTestHelper();

  beforeAll(async () => {
    // env replaces the child environment wholesale — spread process.env.
    await client.connect({
      env: { ...(process.env as Record<string, string>), RESPONSE_VERBOSITY: 'minimal' },
    });
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('param-absent calls are slim; an explicit verbosity: full overrides per call', async () => {
    const id = await planId(client, ['six_hats']);
    const slim = (await client.executeThinkingStep({
      planId: id,
      technique: 'six_hats',
      problem: PROBLEM,
      currentStep: 1,
      totalSteps: 7,
      output: 'Blue hat: setting the agenda',
      nextStepNeeded: true,
      hatColor: 'blue',
    })) as Record<string, unknown>;
    expect(slim.problem, 'env default must slim').toBeUndefined();
    expect(slim.fieldsRecorded).toContain('hatColor');

    const full = (await client.executeThinkingStep({
      planId: id,
      technique: 'six_hats',
      problem: PROBLEM,
      currentStep: 2,
      totalSteps: 7,
      output: 'White hat: the facts',
      nextStepNeeded: true,
      hatColor: 'white',
      sessionId: slim.sessionId,
      verbosity: 'full',
    })) as Record<string, unknown>;
    expect(full.problem, 'per-call full must override the env default').toBe(PROBLEM);
    expect(full.output).toContain('the facts');
  });
});
