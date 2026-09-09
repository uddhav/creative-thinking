/**
 * The five stragglers from the controlled retest (#417), observed where a
 * caller observes them: through the built MCP server.
 *
 * 1. The discovery `reasoning` sentence named three of five recommended
 *    techniques (the three lowest-scoring, via a positional slice), and
 *    `suggestedWorkflow` dropped anything outside three hard-coded phase
 *    lists that name ten of the thirty-two techniques.
 * 2. `techniqueUsed` at completion was the plan's FIRST technique.
 * 3. A random_entry plan's step 1 told the reader to ignore the instruction
 *    below and then kept "Select from a book, dictionary, or random
 *    generator".
 * 4. No response carried the server version.
 * 5. The execute schema's `problem` description said REQUIRED while the
 *    schema and the validator deliberately omit it.
 *
 * Breaks: restore `.slice(0, 3)` in buildReasoningString; drop the
 * Specialized phase; read `session.technique` in addCompletionData; prefix
 * instead of replace in applyAssignedStimulus; drop `serverVersion` from an
 * allowlist; restore the REQUIRED text.
 *
 * Runs the BUILT server (dist/): rebuild before trusting a kill-check.
 */
import { readFileSync } from 'fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EXECUTE_THINKING_STEP_TOOL } from '../../server/ToolDefinitions.js';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

// Five recommendations, three of them outside the hard-coded phase lists
// (temporal_creativity, steelman_red_team, cultural_integration on the
// build this was written against). "Redesign the family trip for September"
// yields a single technique and must not be used here.
const PROBLEM =
  'Plan a two-week family trip for September: balance the schedule across time zones, the ' +
  'trade-off between must-see cities and rest, and the risk that splitting the party backfires';

interface Discover {
  reasoning?: string;
  suggestedWorkflow?: string;
  serverVersion?: string;
  nextStepGuidance?: { suggestedParameters?: { techniques?: string[] } };
}
interface Plan {
  planId: string;
  serverVersion?: string;
  // One entry per step; step 1 of the first technique is workflow[0].
  workflow?: Array<{ technique: string; description?: string; stimulus?: string }>;
}

function textOf(result: { content: Array<{ type: string; text?: string }> }): string {
  return result.content[0]?.text ?? '';
}
function parse<T>(result: { content: Array<{ type: string; text?: string }> }): T {
  return JSON.parse(textOf(result)) as T;
}

const packageVersion = (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string })
  .version;

describe('the five stragglers (#417)', () => {
  let client: MCPClientTestHelper;

  beforeAll(async () => {
    client = new MCPClientTestHelper();
    const env = { ...process.env };
    delete env.CREATIVE_THINKING_VERSION;
    await client.connect({ env });
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('reasoning and suggestedWorkflow name every recommended technique, and the response carries the version', async () => {
    const result = await client.callTool('discover_techniques', { problem: PROBLEM });
    const d = parse<Discover>(result);
    const recommended = d.nextStepGuidance?.suggestedParameters?.techniques ?? [];
    expect(recommended.length).toBeGreaterThanOrEqual(4);
    for (const t of recommended) {
      expect(d.reasoning, `reasoning omits ${t}`).toContain(t);
      expect(d.suggestedWorkflow, `suggestedWorkflow omits ${t}`).toContain(t);
    }
    expect(d.serverVersion).toBe(packageVersion);
  }, 30_000);

  it('a plan carries the version, and an assigned stimulus replaces the choose-your-own text', async () => {
    const result = await client.callTool('plan_thinking_session', {
      problem: PROBLEM,
      techniques: ['random_entry'],
    });
    const p = parse<Plan>(result);
    expect(p.serverVersion).toBe(packageVersion);
    const step1 = p.workflow?.[0];
    expect(step1?.stimulus).toBeTruthy();
    expect(step1?.description).toContain(step1?.stimulus ?? '');
    expect(step1?.description).not.toMatch(/select from a book/i);
    expect(step1?.description).not.toMatch(/ignore any instruction below/i);
  }, 30_000);

  it('a persona plan keeps its persona header above the assigned-stimulus text', async () => {
    // Break: replace the whole description instead of the guidance below the header.
    const result = await client.callTool('plan_thinking_session', {
      problem: PROBLEM,
      techniques: ['random_entry'],
      persona: 'rory_sutherland',
    });
    const p = parse<Plan>(result);
    const step1 = p.workflow?.[0];
    expect(step1?.description).toMatch(/Thinking as Rory Sutherland/);
    expect(step1?.description).toContain(step1?.stimulus ?? '');
    expect(step1?.description).not.toMatch(/select from a book/i);
  }, 30_000);

  it('completion names the technique that completed the session, and lists every technique run', async () => {
    const planResult = await client.callTool('plan_thinking_session', {
      problem: PROBLEM,
      techniques: ['po', 'six_hats'],
    });
    const plan = parse<Plan>(planResult);
    let sessionId: string | undefined;
    const run = async (technique: string, step: number, total: number, last: boolean) => {
      const r = await client.callTool('execute_thinking_step', {
        planId: plan.planId,
        ...(sessionId ? { sessionId } : {}),
        technique,
        problem: PROBLEM,
        currentStep: step,
        totalSteps: total,
        output: `${technique} step ${step}: a concrete answer about the trip`,
        nextStepNeeded: !last,
      });
      const parsed = parse<{
        sessionId?: string;
        techniqueUsed?: string;
        techniquesUsed?: string[];
        summary?: { technique?: string };
      }>(r);
      sessionId = parsed.sessionId ?? sessionId;
      return parsed;
    };
    for (let s = 1; s <= 4; s++) await run('po', s, 4, false);
    let final;
    for (let s = 1; s <= 7; s++) final = await run('six_hats', s, 7, s === 7);
    expect(final?.techniqueUsed).toBe('six_hats');
    expect(final?.summary?.technique).toBe('six_hats');
    expect(final?.techniquesUsed).toEqual(['po', 'six_hats']);
  }, 60_000);

  it('the execute schema no longer calls problem REQUIRED', () => {
    const props = EXECUTE_THINKING_STEP_TOOL.inputSchema.properties as Record<
      string,
      { description?: string }
    >;
    expect(props.problem.description).not.toMatch(/^REQUIRED/);
    expect(props.problem.description).toMatch(/plan/i);
  });
});
