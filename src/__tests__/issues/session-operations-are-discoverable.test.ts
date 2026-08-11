/**
 * `execute_thinking_step` has always had a second mode, and the schema said
 * nothing about it.
 *
 * `processLateralThinking` dispatches on `sessionOperation` before it validates
 * anything else (index.ts:166), so save / load / list / delete / export have
 * always worked. None of them was declared in the tool schema, and `required`
 * listed the seven thinking-step fields unconditionally — so a client following
 * the schema could not legally issue one. The capability existed and was
 * unreachable by contract, the same fault as the technique fields that were
 * accepted but never declared.
 *
 * Two of the five also reported success over a surface they never examined.
 * `listPersistedSessions` returns `[]` when there is no persistence adapter and
 * `deletePersistedSession` returns void, so an unconfigured server answered
 * "0 sessions" — indistinguishable from a configured one holding none — and
 * "Session deleted successfully" for a session it had no way to delete.
 *
 * Degrading gracefully there is deliberate: three tests in `validation.test.ts`
 * hold both operations to returning a success. So the fix is not to start
 * erroring — the first attempt did, and those three caught it — but to say
 * which case this is. `persistenceAvailable` distinguishes "cannot look" from
 * "none found", and `delete` stops claiming it deleted anything.
 */

import { describe, it, expect } from 'vitest';
import { EXECUTE_THINKING_STEP_TOOL } from '../../server/ToolDefinitions.js';
import { LateralThinkingServer } from '../../index.js';

const OPERATIONS = ['save', 'load', 'list', 'delete', 'export'] as const;

describe('the session-operation mode is in the contract', () => {
  const schema = EXECUTE_THINKING_STEP_TOOL.inputSchema;

  it('declares every operation the server dispatches', () => {
    expect(schema.properties.sessionOperation?.enum).toEqual([...OPERATIONS]);
  });

  it('declares the options object each operation reads', () => {
    for (const options of [
      'saveOptions',
      'loadOptions',
      'listOptions',
      'deleteOptions',
      'exportOptions',
    ]) {
      expect(schema.properties[options], `${options} is undeclared`).toBeDefined();
    }
  });

  it('lets a session operation satisfy the schema without the thinking-step fields', () => {
    // The whole point. A single `required` list demanded planId, technique,
    // problem, currentStep, totalSteps, output and nextStepNeeded of every
    // call — including the ones that must not carry any of them.
    expect(schema.required, 'a flat required list cannot describe two shapes').toBeUndefined();

    const branches = schema.oneOf ?? [];
    expect(branches).toHaveLength(2);
    expect(branches.map(b => b.required)).toContainEqual(['sessionOperation']);
    expect(branches.map(b => b.required)).toContainEqual([
      'planId',
      'technique',
      'problem',
      'currentStep',
      'totalSteps',
      'output',
      'nextStepNeeded',
    ]);
  });

  it('says where exportOptions.sessionId goes, because the top-level one is ignored', () => {
    const exportOptions = schema.properties.exportOptions;

    expect(exportOptions?.required).toEqual(['sessionId', 'format']);
    // A top-level sessionId looks like it should work and is silently unread —
    // the call is then rejected as missing the very field that was sent.
    expect(exportOptions?.description).toMatch(/sessionId.*HERE/i);
  });
});

describe('an operation that cannot reach persistence says which case it is', () => {
  /** Runs one session operation against a default (in-memory) server. */
  async function withoutPersistence(input: Record<string, unknown>): Promise<{
    isError: boolean;
    text: string;
  }> {
    const server = new LateralThinkingServer();
    try {
      const response = await Promise.resolve(server.executeThinkingStep(input));
      return { isError: response.isError === true, text: response.content[0].text };
    } finally {
      server.destroy();
    }
  }

  it.each([
    ['list', { sessionOperation: 'list', listOptions: { limit: 5 } }],
    ['delete', { sessionOperation: 'delete', deleteOptions: { sessionId: 'nope', confirm: true } }],
  ])('%s still succeeds, and flags that there was nothing to reach', async (operation, input) => {
    const { isError, text } = await withoutPersistence(input);

    // Still a success — graceful degradation is the contract, and three tests
    // in validation.test.ts enforce it.
    expect(isError, `${operation} stopped degrading gracefully`).toBe(false);

    const payload = JSON.parse(text) as { result?: { persistenceAvailable?: boolean } };
    expect(
      payload.result?.persistenceAvailable,
      `${operation} did not say whether it could reach persistence at all`
    ).toBe(false);
  });

  it('does not claim to have deleted anything it could not reach', async () => {
    const { text } = await withoutPersistence({
      sessionOperation: 'delete',
      deleteOptions: { sessionId: 'never-existed', confirm: true },
    });

    expect(text).not.toContain('Session deleted successfully');
    expect(text).toContain('nothing was deleted');
  });

  it('distinguishes an empty list from an unreachable one', async () => {
    const { text } = await withoutPersistence({ sessionOperation: 'list', listOptions: {} });
    // Parsed, not raw — the note's own quotes are escaped in the JSON.
    const payload = JSON.parse(text) as { result?: { note?: string; sessions?: unknown[] } };

    // The whole defect in one assertion: an empty array meant both "I looked
    // and found none" and "I cannot look", and nothing told them apart.
    expect(payload.result?.sessions).toEqual([]);
    expect(payload.result?.note).toContain('means "cannot look", not "none found"');
  });

  it('still exports, because export reads the live session and needs no adapter', async () => {
    const server = new LateralThinkingServer();
    try {
      const problem = 'Cut the release train from monthly to weekly';
      // planThinkingSession is synchronous; only execute is async.
      const plan = JSON.parse(
        server.planThinkingSession({
          problem,
          techniques: ['six_hats'],
          timeframe: 'thorough',
        }).content[0].text
      ) as { planId: string };

      const response = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem,
        currentStep: 1,
        totalSteps: 7,
        output: 'A recorded finding for this step, written plainly and at length.',
        nextStepNeeded: true,
        hatColor: 'blue',
      });
      const sessionId = (JSON.parse(response.content[0].text) as { sessionId?: string }).sessionId;

      const exported = await server.executeThinkingStep({
        sessionOperation: 'export',
        exportOptions: { sessionId, format: 'markdown' },
      });

      expect(exported.isError).not.toBe(true);
      expect(exported.content[0].text).toContain('Creative Thinking Session');
    } finally {
      server.destroy();
    }
  });
});
