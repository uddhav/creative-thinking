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
 * 'minimal' is the default since 3.0.0 (#311); 'full', per call or through
 * RESPONSE_VERBOSITY=full, restores the pre-3.0 shape.
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
// merges (advisory findings, autoSave status, the completion block on the
// terminal step).
const MINIMAL_EXTRAS = new Set([
  'completionMetadata',
  'executionMetadata',
  'ruinAssessment',
  'newInsights',
  'fieldsRecorded',
  'truncation',
  'advisoryFindings',
  'autoSaveStatus',
  'autoSaveMessage',
  'autoSaveError',
  // Terminal-step completion merge (handleSessionCompletion, post-slim):
  'sessionComplete',
  'completed',
  'techniqueUsed',
  'techniquesUsed',
  'insights',
  'message',
  'metrics',
  'summary',
  'pathAnalysis',
  'warnings',
  'escapeOptions',
]);

async function planId(client: MCPClientTestHelper, techniques: string[]): Promise<string> {
  const plan = await client.planThinkingSession(PROBLEM, techniques);
  return (plan as { planId: string }).planId;
}

describe('response verbosity (default server)', { retry: 0 }, () => {
  const client = new MCPClientTestHelper();

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('the default is minimal: receipts and steering, no echoes', async () => {
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

    // SOCKETES.md's documented default output.
    expect(data.sessionId).toBeDefined();
    expect(data.historyLength).toBe(1);
    expect(data.nextStepGuidance).toBeDefined();
    expect(Array.isArray(data.newInsights)).toBe(true);
    expect(data.fieldsRecorded).toContain('scamperAction');
    expect(data.pathImpact, "this step's verdict rides the default").toBeDefined();
    expect(data.problem, 'the default echoes nothing').toBeUndefined();
    expect(data.output).toBeUndefined();
    expect(data.insights, 'the cumulative list is a full-mode field').toBeUndefined();
  });

  it('a value that is not the string full falls into the default, not into full', async () => {
    // Nothing validates the enum on either surface (a stdin field bypasses the
    // CLI's choices), so before this a misspelt value widened the response.
    const id = await planId(client, ['six_hats']);
    for (const bogus of ['Minimal', 'bogus', '']) {
      const data = (await client.executeThinkingStep({
        planId: id,
        technique: 'six_hats',
        problem: PROBLEM,
        currentStep: 1,
        totalSteps: 7,
        output: 'Blue hat: setting the agenda',
        nextStepNeeded: true,
        hatColor: 'blue',
        verbosity: bogus,
      })) as Record<string, unknown>;
      expect(
        data.problem,
        `verbosity ${JSON.stringify(bogus)} widened the response`
      ).toBeUndefined();
      expect(data.fieldsRecorded, `verbosity ${JSON.stringify(bogus)}`).toContain('hatColor');
    }
  });

  it("verbosity: 'full' restores the pre-3.0 shape", async () => {
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
      verbosity: 'full',
    })) as Record<string, unknown>;

    expect(data.sessionId).toBeDefined();
    expect(data.historyLength).toBe(1);
    expect(Array.isArray(data.insights)).toBe(true);
    expect(data.nextStepGuidance).toBeDefined();
    expect(data.problem).toBe(PROBLEM);
    expect(data.output).toContain('one-page pre-read');
    expect(data.scamperAction).toBe('substitute');
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

  it('a skipped step reaches a default caller as structure, not only as prose', async () => {
    // Under the default a client that parses structure rather than the
    // completionWarnings prose still sees the skip: the per-technique status
    // entry rides whole (#298 made skipping visible; #311 keeps it visible
    // once minimal is the default).
    const id = await planId(client, ['six_hats']);
    const first = (await client.executeThinkingStep({
      planId: id,
      technique: 'six_hats',
      problem: PROBLEM,
      currentStep: 1,
      totalSteps: 7,
      output: 'Blue hat: setting the agenda',
      nextStepNeeded: true,
      hatColor: 'blue',
    })) as Record<string, unknown>;
    const third = (await client.executeThinkingStep({
      planId: id,
      sessionId: first.sessionId,
      technique: 'six_hats',
      problem: PROBLEM,
      currentStep: 3,
      totalSteps: 7,
      output: 'Red hat: how the room feels about it',
      nextStepNeeded: true,
      hatColor: 'red',
    })) as Record<string, unknown>;

    const statuses = (third.completionMetadata as Record<string, unknown> | undefined)
      ?.techniqueStatuses as Array<{ technique: string; skippedSteps: number[] }> | undefined;
    expect(statuses?.[0]?.technique, 'the per-technique status must ride the default').toBe(
      'six_hats'
    );
    expect(statuses?.[0]?.skippedSteps, 'the skipped step is not named as data').toContain(2);
  });
});

describe('response verbosity (env-default-full server)', { retry: 0 }, () => {
  const client = new MCPClientTestHelper();

  beforeAll(async () => {
    // env replaces the child environment wholesale — spread process.env.
    await client.connect({
      env: { ...(process.env as Record<string, string>), RESPONSE_VERBOSITY: 'full' },
    });
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('param-absent calls are full; an explicit verbosity: minimal overrides per call', async () => {
    const id = await planId(client, ['six_hats']);
    const full = (await client.executeThinkingStep({
      planId: id,
      technique: 'six_hats',
      problem: PROBLEM,
      currentStep: 1,
      totalSteps: 7,
      output: 'Blue hat: setting the agenda',
      nextStepNeeded: true,
      hatColor: 'blue',
    })) as Record<string, unknown>;
    expect(full.problem, 'RESPONSE_VERBOSITY=full must restore the echoes').toBe(PROBLEM);
    expect(full.hatColor).toBe('blue');
    expect(full.fieldsRecorded).toBeUndefined();

    const slim = (await client.executeThinkingStep({
      planId: id,
      technique: 'six_hats',
      problem: PROBLEM,
      currentStep: 2,
      totalSteps: 7,
      output: 'White hat: the facts',
      nextStepNeeded: true,
      hatColor: 'white',
      sessionId: full.sessionId,
      verbosity: 'minimal',
    })) as Record<string, unknown>;
    expect(slim.problem, 'per-call minimal must override the env default').toBeUndefined();
    expect(slim.fieldsRecorded).toContain('hatColor');
  });
});
