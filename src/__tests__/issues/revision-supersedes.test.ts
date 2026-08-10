/**
 * A revised step is reported once, as revised.
 *
 * `execute` appends a history entry for every call, revisions included, so a
 * session that revises step 3 holds two entries for it. Handlers keep the
 * latest entry per step precisely so the revision supersedes — but two things
 * defeated that:
 *
 *   `six_hats` iterated the history directly rather than keeping the latest
 *   per step, so it reported the step twice, once each way.
 *
 *   `ExecutionResponseBuilder` appended each call's insights into
 *   `session.insights` and never removed anything, so the superseded text
 *   pushed by the earlier call stayed there whatever the handler now said.
 *   That list is what the metrics, the memory outputs and the export read.
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
  SessionData,
} from '../../types/index.js';

const PROBLEM = 'Decide whether to keep the nightly batch job';

async function runWithRevision(): Promise<{ reported: string[]; session: SessionData }> {
  const sessionManager = new SessionManager();
  const registry = TechniqueRegistry.getInstance();
  const plan = planThinkingSession(
    {
      problem: PROBLEM,
      techniques: ['six_hats'],
      timeframe: 'thorough',
    } as PlanThinkingSessionInput,
    sessionManager,
    registry
  );

  const calls: Array<{ step: number; output: string; revision?: boolean }> = [
    { step: 1, output: 'Set the agenda for the review.' },
    { step: 2, output: 'The job runs for forty minutes each night.' },
    { step: 3, output: 'FIRST reading of how the team feels about it.' },
    { step: 3, output: 'SECOND reading, which supersedes the first.', revision: true },
    { step: 4, output: 'It does catch reconciliation errors early.' },
    { step: 5, output: 'Nobody has tested the failure path in a year.' },
    { step: 6, output: 'A shadow run could tell us what it still catches.' },
    { step: 7, output: 'Turning it off frees a maintenance window we cannot get back.' },
  ];

  let sessionId: string | undefined;
  let reported: string[] = [];

  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    const response = await executeThinkingStep(
      {
        planId: plan.planId,
        sessionId,
        technique: 'six_hats',
        problem: PROBLEM,
        currentStep: call.step,
        totalSteps: 7,
        output: call.output,
        nextStepNeeded: i < calls.length - 1,
        ...(call.revision ? { isRevision: true, revisesStep: call.step } : {}),
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
    reported = (data.insights as string[]) ?? reported;
  }

  return { reported, session: sessionManager.getSession(sessionId as string) as SessionData };
}

describe('a revision supersedes the step it revises', () => {
  it('reports the revised reading and not the one it replaced', async () => {
    const { reported } = await runWithRevision();

    expect(reported.some(i => i.includes('SECOND reading'))).toBe(true);
    expect(reported.some(i => i.includes('FIRST reading'))).toBe(false);
  });

  it('reports one insight per step, not one per call', async () => {
    const { reported } = await runWithRevision();

    // Eight calls covering seven steps. Nine entries in the history — the
    // revision plus the original — must still describe seven.
    const hatLines = reported.filter(i => / Hat: /.test(i));
    expect(hatLines).toHaveLength(7);
  });

  it('leaves no superseded text behind in the session', async () => {
    const { session } = await runWithRevision();

    // session.insights is what the metrics, the memory outputs and the export
    // read. Appending to it kept the replaced reading alive there even once
    // the handler had stopped reporting it.
    expect(session.insights.some(i => i.includes('FIRST reading'))).toBe(false);
    expect(session.insights.some(i => i.includes('SECOND reading'))).toBe(true);
    expect(session.history.length, 'the history still records both calls').toBe(8);
  });

  it('records the revision on the path event, not only on the session history', async () => {
    // `isRevision` reached `SessionData.history` and stopped there. `PathEvent`
    // had no such field and `ErgodicityOrchestrator.calculateImpact` never
    // passed one, so `perfectionism` — the barrier whose whole subject is
    // revision without progress — could not observe a revision from the path
    // record and counted commitments instead, reporting its own maximum for a
    // session that had committed to nothing.
    //
    // This asserts the real call site: the flag has to survive
    // `executeThinkingStep` -> `calculateImpact` -> `recordThinkingStep` ->
    // `recordPathEvent`, not merely be storable on the event type.
    const { session } = await runWithRevision();
    const pathHistory = session.pathMemory?.pathHistory ?? [];

    expect(pathHistory).toHaveLength(8);
    expect(pathHistory.map(e => e.isRevision === true)).toEqual([
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
  });
});
