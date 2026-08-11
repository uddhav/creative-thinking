/**
 * What the monitoring concludes has to reach the caller.
 *
 * `recordThinkingStep` returned an `EarlyWarningState` and, when things got bad
 * enough, an `EscapeProtocol` — the exact types `SessionData` declares fields
 * for. Nothing assigned them. A note in the orchestrator explained that session
 * state was not updated "due to type incompatibility between simplified adapted
 * types and full SessionData interface requirements": true of the adapted
 * result, and beside the point, because the raw result was already the right
 * shape and the adapter is what flattens it.
 *
 * So `ResponseBuilder`, `ExecutionResponseBuilder.addWarnings` and
 * `MetricsCollector` all read these fields, all read undefined, and a session
 * could reach `escape` internally while reporting nothing at all. Measured
 * before the fix: zero of twenty responses carried a warning state on a chain
 * whose internal state said escape on eleven of them.
 *
 * The second half matters as much. The response carried a list of warnings and
 * a count, and withheld the verdict — `overallRisk` and `recommendedAction` —
 * so a caller could see that something was flagged but not whether the server
 * thought it should continue, change course, or stop. A caller inferring that
 * from message strings is doing the server's job for it.
 */

import { describe, it, expect } from 'vitest';
import { executeThinkingStep } from '../../layers/execution.js';
import { planThinkingSession } from '../../layers/planning.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type {
  PlanThinkingSessionInput,
  ExecuteThinkingStepInput,
  LateralTechnique,
  SessionData,
} from '../../types/index.js';

const PROBLEM = 'Retire the legacy pipeline';

interface StepReading {
  step: number;
  risk?: string;
  action?: string;
  hasEscape: boolean;
  session: SessionData;
}

/** Walks a plan and reports what each response actually carried. */
async function walk(techniques: LateralTechnique[]): Promise<StepReading[]> {
  const sessionManager = new SessionManager();
  const registry = TechniqueRegistry.getInstance();
  const plan = planThinkingSession(
    { problem: PROBLEM, techniques, timeframe: 'thorough' } as PlanThinkingSessionInput,
    sessionManager,
    registry
  );

  const steps = plan.workflow.flatMap(block =>
    block.steps.map(() => ({ technique: block.technique }))
  );

  let sessionId: string | undefined;
  const readings: StepReading[] = [];

  for (let index = 0; index < steps.length; index++) {
    const response = await executeThinkingStep(
      {
        planId: plan.planId,
        sessionId,
        technique: steps[index].technique,
        problem: PROBLEM,
        currentStep: index + 1,
        totalSteps: steps.length,
        output: 'A recorded finding for this step, written plainly.',
        nextStepNeeded: index < steps.length - 1,
      } as ExecuteThinkingStepInput,
      sessionManager,
      registry,
      new VisualFormatter(true),
      new MetricsCollector(),
      new HybridComplexityAnalyzer(),
      new ErgodicityManager()
    );

    const data = JSON.parse(response.content[0].text) as Record<string, unknown>;
    sessionId = (data.sessionId as string) ?? sessionId;
    const warning = data.earlyWarningState as
      | { overallRisk?: string; recommendedAction?: string }
      | undefined;

    readings.push({
      step: index + 1,
      risk: warning?.overallRisk,
      action: warning?.recommendedAction,
      hasEscape: data.escapeRecommendation !== undefined,
      session: sessionManager.getSession(sessionId) as SessionData,
    });
  }

  return readings;
}

/** Fifteen steps of low-reversibility work; reaches escape. */
const COMMITTING: LateralTechnique[] = [
  'context_reframing',
  'context_reframing',
  'context_reframing',
];

/** Thirteen steps that commit to nothing. */
const REFLECTIVE: LateralTechnique[] = ['neural_state', 'random_entry', 'six_hats'];

describe('a session that is running out of room says so', () => {
  it('records the warning state on the session, where every reader looks', async () => {
    const readings = await walk(COMMITTING);

    // Assigned from the raw result, not the adapter, so the readers that have
    // always been complete finally have something to read.
    expect(readings[0].session.earlyWarningState, 'never assigned before').toBeDefined();
    expect(readings.at(-1)?.session.escapeRecommendation).toBeDefined();
  });

  it('reports the verdict, not only the evidence', async () => {
    const readings = await walk(COMMITTING);
    const withVerdict = readings.filter(r => r.risk !== undefined);

    expect(withVerdict.length, 'no response carried a risk level').toBeGreaterThan(0);
    for (const reading of withVerdict) {
      expect(reading.action, `step ${reading.step} reported a risk with no action`).toBeDefined();
    }
  });

  it('escalates as the session spends its room, and offers a way out at the end', async () => {
    const readings = await walk(COMMITTING);
    const actions = readings.map(r => r.action).filter(Boolean);

    expect(actions).toContain('pivot');
    expect(actions).toContain('escape');
    expect(readings.at(-1)?.hasEscape, 'no escape protocol offered at the end').toBe(true);

    // The escape must not arrive before the pivot.
    expect(readings.findIndex(r => r.action === 'escape')).toBeGreaterThan(
      readings.findIndex(r => r.action === 'pivot')
    );
  });

  it('says nothing of the kind about a session that has committed to nothing', async () => {
    // The control. Longer than the committing chain, and it must stay quiet —
    // a warning channel that fires on reflection is one a caller learns to
    // ignore, which costs the warnings that matter.
    const readings = await walk(REFLECTIVE);

    expect(readings.length).toBeGreaterThanOrEqual(13);
    expect(readings.some(r => r.action === 'pivot' || r.action === 'escape')).toBe(false);
    expect(readings.some(r => r.hasEscape)).toBe(false);
  });

  it('withdraws the escape protocol when the reading no longer calls for one', async () => {
    // The assignment had no else-branch, so a protocol outlived the condition
    // that produced it. Measured: escape fired at step 15, and step 19 reported
    // `recommendedAction: 'pivot'` with the escape protocol still attached —
    // the response contradicting itself about what to do next.
    const readings = await walk([...COMMITTING, 'six_hats']);

    const contradictory = readings.filter(r => r.hasEscape && r.action !== 'escape');
    expect(
      contradictory.map(r => `step ${r.step}: ${r.action} + escape protocol`),
      'an escape protocol outlived the reading that produced it'
    ).toEqual([]);
  });
});
