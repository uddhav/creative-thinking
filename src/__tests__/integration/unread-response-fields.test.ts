/**
 * Response fields nothing read.
 *
 * An audit of this branch listed six caller-visible fields of a successful
 * `execute_thinking_step` whose names appeared nowhere in any test: the server
 * emitted them and nothing anywhere checked they arrived, or what they said.
 *
 * That list is not academic. The previous audit found `completionMetadata` the
 * same way, and it turned out to be telling every caller that Black Hat had
 * been skipped on step 1 of seven.
 *
 * `reflexivityWarning` is the one worth the most care. It is produced by
 * reaching through an untyped cast into `SessionManager`'s private
 * `reflexivityTracker`, inside a `try`/`catch {}` that swallows everything.
 * Rename that field and the warning stops forever, silently, with every test
 * still green.
 *
 * One session drives all five, because they fire at different depths and a
 * session long enough for the last one has passed the others on the way. The
 * step each appears at is recorded so a change in when they fire reads as a
 * change rather than a mystery.
 *
 * Two of the six are not here: `sequentialThinkingSuggestion` and
 * `reflectionRequired`. Neither appeared in a 26-step mixed session.
 * `reflectionRequired` needs `riskEngagementMetrics.escalationLevel >= 2`,
 * which the dismissal tracker only reaches when a session argues back at
 * risks; the conditions are not obviously reachable from ordinary output and
 * are recorded as unverified rather than guessed at.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

const PROBLEM = 'Cut the release train from monthly to weekly';
const TECHNIQUES = ['scamper', 'context_reframing', 'scamper', 'design_thinking'];
const SCAMPER_ACTIONS = [
  'substitute',
  'combine',
  'adapt',
  'modify',
  'put_to_other_use',
  'eliminate',
  'reverse',
  'parameterize',
];

interface Seen {
  step: number;
  value: unknown;
}

let client: MCPClientTestHelper;
let seen: Record<string, Seen>;
let totalSteps: number;

beforeAll(async () => {
  client = new MCPClientTestHelper();
  await client.connect();

  const textOf = (result: { content: Array<{ type: string }> }): string => {
    const first = result.content[0];
    if (first?.type !== 'text') throw new Error('expected text content');
    return (first as { type: 'text'; text: string }).text;
  };

  const plan = JSON.parse(
    textOf(
      await client.callTool('plan_thinking_session', {
        problem: PROBLEM,
        techniques: TECHNIQUES,
        timeframe: 'thorough',
      })
    )
  ) as { planId: string; estimatedSteps: number; workflow: Array<{ technique: string }> };

  totalSteps = plan.estimatedSteps;
  seen = {};
  let sessionId: string | undefined;

  for (let step = 1; step <= totalSteps; step++) {
    const technique = plan.workflow[step - 1].technique;
    const data = JSON.parse(
      textOf(
        await client.callTool('execute_thinking_step', {
          planId: plan.planId,
          ...(sessionId ? { sessionId } : {}),
          technique,
          problem: PROBLEM,
          currentStep: step,
          totalSteps,
          output: `Finding ${step}, written plainly and at length for the record.`,
          nextStepNeeded: step < totalSteps,
          ...(technique === 'scamper' ? { scamperAction: SCAMPER_ACTIONS[step % 8] } : {}),
        })
      )
    ) as Record<string, unknown>;

    sessionId = (data.sessionId as string) ?? sessionId;
    for (const field of [
      'progressDisplay',
      'flexibilityMessage',
      'reflexivityWarning',
      'escapeRecommendation',
    ]) {
      if (data[field] !== undefined && seen[field] === undefined) {
        seen[field] = { step, value: data[field] };
      }
    }
  }
}, 180_000);

afterAll(async () => {
  await client.disconnect();
}, 30_000);

describe('the fields nothing was reading do arrive', () => {
  it('shows progress from the first step', () => {
    // Fires below 80% complete, so on nearly every step of any real session.
    // The most-seen unguarded output on the branch.
    expect(seen.progressDisplay, 'progressDisplay never reached the caller').toBeDefined();
    expect(seen.progressDisplay.step).toBe(1);
    expect(String(seen.progressDisplay.value)).toMatch(/Progress:/);
    expect(String(seen.progressDisplay.value)).toContain(`/${totalSteps} steps`);
  });

  it('says flexibility is falling, once it is', () => {
    expect(seen.flexibilityMessage, 'flexibilityMessage never reached the caller').toBeDefined();
    // Gated on currentFlexibility < 0.7, so not on step 1 — a message that
    // appeared immediately would be reporting the default, not a reading.
    expect(seen.flexibilityMessage.step).toBeGreaterThan(1);
    expect(String(seen.flexibilityMessage.value)).toMatch(/Flexibility/i);
  });

  it('warns when constraints accumulate, through the private tracker reach-through', () => {
    // The silent-catch one. If `SessionManager.reflexivityTracker` is renamed
    // or `generateWarning` changes shape, the catch swallows it and this is
    // the only thing that would notice.
    expect(seen.reflexivityWarning, 'reflexivityWarning never reached the caller').toBeDefined();

    const warning = seen.reflexivityWarning.value as {
      level?: string;
      type?: string;
      message?: string;
      constraintCount?: number;
    };
    expect(['caution', 'warning', 'critical']).toContain(warning.level);
    expect(warning.message, 'the warning arrived without saying anything').toBeTruthy();
    expect(
      warning.constraintCount,
      'a constraint warning that counts no constraints'
    ).toBeGreaterThan(0);
  });

  it('offers an escape with the count of steps beyond the ones shown', () => {
    expect(
      seen.escapeRecommendation,
      'escapeRecommendation never reached the caller'
    ).toBeDefined();

    const escape = seen.escapeRecommendation.value as {
      protocol?: string;
      steps?: string[];
      furtherSteps?: number;
    };
    expect(escape.protocol, 'an escape with no protocol named').toBeTruthy();
    expect(escape.steps?.length, 'an escape with no steps').toBeGreaterThan(0);

    // `furtherSteps` is new on this branch and was among the unread fields: the
    // response shows the first three steps, and this says how many were cut.
    // Without it a caller reads three steps as the whole protocol.
    expect(escape.furtherSteps, 'the truncated-step count never arrived').toBeGreaterThan(0);
  });
});
