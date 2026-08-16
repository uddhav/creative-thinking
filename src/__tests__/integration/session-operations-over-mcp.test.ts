/**
 * The session-operation mode has to work through the MCP client, because that
 * is the only surface there is.
 *
 * An earlier commit declared `sessionOperation` in the tool schema with a
 * `oneOf` saying a call may carry either the seven thinking-step fields or a
 * session operation, and its guard passed. The guard called
 * `LateralThinkingServer.executeThinkingStep()` directly, which enters at
 * `processLateralThinking` — below two gates that a real client meets first:
 *
 *   1. `RequestHandlers` validated the seven thinking-step parameters
 *      unconditionally, so every session operation was refused with
 *      "MANDATORY PARAMETERS MISSING" before dispatch.
 *   2. `WorkflowGuard` then asked whether discovery had preceded the call, and
 *      refused an export with "Discovery phase skipped" — a session operation
 *      is not a step in discover -> plan -> execute, it acts on a session that
 *      already exists.
 *
 * So the schema said the call was legal and the request path said it was not,
 * and the request path is the one callers meet. The feature was declared,
 * documented as fixed, and still unreachable. It was found by an eval executor
 * following the skill's own stage 6 instructions and reporting that both
 * documented shapes were rejected.
 *
 * These run through the real client for that reason. A test that reaches past
 * the handler proves only that the layer underneath is fine, which was never
 * in doubt.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Cut the release train from monthly to weekly';

/**
 * The SDK types a content item as a union of text/image/audio/resource, so
 * `content[0].text` does not typecheck. Narrow once here rather than casting at
 * each call site — a cast would compile and then throw at runtime on a
 * non-text item, which is the shape of bug this file exists to catch.
 */
function textOf(result: { content: Array<{ type: string }> }): string {
  const first = result.content[0];
  if (first?.type !== 'text') {
    throw new Error(`expected a text content item, got ${first?.type ?? 'nothing'}`);
  }
  return (first as { type: 'text'; text: string }).text;
}

describe('session operations over the MCP client', () => {
  let client: MCPClientTestHelper;
  let sessionId: string;
  let planId: string;

  beforeAll(async () => {
    client = new MCPClientTestHelper();
    await client.connect();

    const plan = JSON.parse(
      textOf(
        await client.callTool('plan_thinking_session', {
          problem: PROBLEM,
          techniques: ['six_hats'],
          timeframe: 'thorough',
        })
      )
    ) as { planId: string };
    planId = plan.planId;

    const step = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          planId: plan.planId,
          technique: 'six_hats',
          problem: PROBLEM,
          currentStep: 1,
          totalSteps: 7,
          output: 'A recorded finding for this step, written plainly and at length.',
          nextStepNeeded: true,
          hatColor: 'blue',
        })
      )
    ) as { sessionId: string };

    sessionId = step.sessionId;
  }, 30_000);

  afterAll(async () => {
    await client.disconnect();
  }, 30_000);

  it('exports the session in the shape the skill documents', async () => {
    const result = await client.callTool('execute_thinking_step', {
      sessionOperation: 'export',
      exportOptions: { sessionId, format: 'markdown' },
    });
    const text = textOf(result);

    // The two rejections this call used to meet, named so a regression says
    // which gate came back.
    expect(text, 'the required-field check refused a session operation').not.toContain(
      'MANDATORY PARAMETERS MISSING'
    );
    expect(text, 'the workflow guard refused a session operation').not.toContain(
      'Discovery phase skipped'
    );

    const payload = JSON.parse(text) as {
      operation?: string;
      success?: boolean;
      result?: { format?: string; data?: string };
    };
    expect(payload.operation).toBe('export');
    expect(payload.success).toBe(true);
    expect(payload.result?.data).toContain('Creative Thinking Session');
  }, 30_000);

  it.each(['json', 'csv'])(
    'exports as %s too',
    async format => {
      const result = await client.callTool('execute_thinking_step', {
        sessionOperation: 'export',
        exportOptions: { sessionId, format },
      });
      const payload = JSON.parse(textOf(result)) as {
        success?: boolean;
        result?: { format?: string };
      };

      expect(payload.success).toBe(true);
      expect(payload.result?.format).toBe(format);
    },
    30_000
  );

  it('still refuses a thinking step that is genuinely missing its fields', async () => {
    // The control. Exempting session operations must not disarm the check for
    // the shape it was written for.
    //
    // The helper rejects rather than returning an error result, so the refusal
    // arrives as a thrown error and has to be caught to be read.
    let refusal = '';
    try {
      const result = await client.callTool('execute_thinking_step', {
        technique: 'six_hats',
        problem: PROBLEM,
      });
      refusal = textOf(result);
    } catch (error) {
      refusal = error instanceof Error ? error.message : String(error);
    }

    expect(refusal, 'a thinking step with no planId was allowed through').toContain(
      'missing required parameters'
    );
  }, 30_000);

  it('flags a layer-rejected step as an error, the way it flags a gated one', async () => {
    // `RequestHandlers` rebuilt the outgoing response as `{ content }` and
    // dropped `isError`. Refusals raised at the gate returned early and kept
    // theirs; everything the layers refused lost it. So a client was told the
    // call succeeded and handed a body whose entire content was an error
    // object — and the two kinds of refusal, from the same tool, gave opposite
    // signals.
    //
    // `purple` is a real hat on the wrong step, so the handler refuses the data
    // rather than the shape: the refusal comes from the layer, past the gate.
    let flagged: boolean | undefined;
    let body = '';
    try {
      const result = await client.callTool('execute_thinking_step', {
        planId,
        technique: 'six_hats',
        problem: PROBLEM,
        currentStep: 1,
        totalSteps: 7,
        output: 'A recorded finding for this step, written plainly and at length.',
        nextStepNeeded: true,
        hatColor: 'purple',
      });
      flagged = result.isError === true;
      body = textOf(result);
    } catch (error) {
      // The helper throws when the response carries isError, which is itself
      // the signal being asserted.
      flagged = true;
      body = error instanceof Error ? error.message : String(error);
    }

    expect(body, 'expected the layer to refuse this step').toMatch(/rejected the data|E102/);
    expect(flagged, 'a layer-rejected step reached the client flagged as success').toBe(true);
  }, 30_000);

  describe('an operation that cannot reach persistence says which case it is', () => {
    // Moved here from `issues/session-operations-are-discoverable.test.ts`,
    // which asserted these against `LateralThinkingServer` directly and so
    // never met the two gates that made the whole mode unreachable. The
    // behaviour is about what a caller receives, so it is checked where a
    // caller stands.
    //
    // These run against the shared client, which is started WITHOUT
    // PERSISTENCE_TYPE — the default. Degrading gracefully here is deliberate:
    // three tests in `validation.test.ts` hold both operations to returning a
    // success. Degrading *silently* was the fault.
    it.each([
      ['list', { sessionOperation: 'list', listOptions: { limit: 5 } }],
      [
        'delete',
        { sessionOperation: 'delete', deleteOptions: { sessionId: 'nope', confirm: true } },
      ],
    ])(
      '%s still succeeds, and flags that there was nothing to reach',
      async (operation, input) => {
        const result = await client.callTool('execute_thinking_step', input);

        expect(result.isError, `${operation} stopped degrading gracefully`).not.toBe(true);

        const payload = JSON.parse(textOf(result)) as {
          result?: { persistenceAvailable?: boolean };
        };
        expect(
          payload.result?.persistenceAvailable,
          `${operation} did not say whether it could reach persistence at all`
        ).toBe(false);
      },
      30_000
    );

    it('does not claim to have deleted anything it could not reach', async () => {
      const text = textOf(
        await client.callTool('execute_thinking_step', {
          sessionOperation: 'delete',
          deleteOptions: { sessionId: 'never-existed', confirm: true },
        })
      );

      expect(text).not.toContain('Session deleted successfully');
      expect(text).toContain('nothing was deleted');
    }, 30_000);

    it('distinguishes an empty list from an unreachable one', async () => {
      const text = textOf(
        await client.callTool('execute_thinking_step', {
          sessionOperation: 'list',
          listOptions: {},
        })
      );
      // Parsed, not raw — the note's own quotes are escaped in the JSON.
      const payload = JSON.parse(text) as { result?: { note?: string; sessions?: unknown[] } };

      // The whole defect in one assertion: an empty array meant both "I looked
      // and found none" and "I cannot look", and nothing told them apart.
      expect(payload.result?.sessions).toEqual([]);
      expect(payload.result?.note).toContain('means "cannot look", not "none found"');
    }, 30_000);
  });
});
