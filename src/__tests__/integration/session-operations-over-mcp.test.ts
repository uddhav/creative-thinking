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

describe('session operations over the MCP client', () => {
  let client: MCPClientTestHelper;
  let sessionId: string;

  beforeAll(async () => {
    client = new MCPClientTestHelper();
    await client.connect();

    const plan = JSON.parse(
      (
        await client.callTool('plan_thinking_session', {
          problem: PROBLEM,
          techniques: ['six_hats'],
          timeframe: 'thorough',
        })
      ).content[0].text as string
    ) as { planId: string };

    const step = JSON.parse(
      (
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
      ).content[0].text as string
    ) as { sessionId: string };

    sessionId = step.sessionId;
  }, 30_000);

  afterAll(async () => {
    await client.disconnect();
  });

  it('exports the session in the shape the skill documents', async () => {
    const result = await client.callTool('execute_thinking_step', {
      sessionOperation: 'export',
      exportOptions: { sessionId, format: 'markdown' },
    });
    const text = result.content[0].text as string;

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
      const payload = JSON.parse(result.content[0].text as string) as {
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
      refusal = result.content[0].text as string;
    } catch (error) {
      refusal = error instanceof Error ? error.message : String(error);
    }

    expect(refusal, 'a thinking step with no planId was allowed through').toContain(
      'missing required parameters'
    );
  }, 30_000);
});
