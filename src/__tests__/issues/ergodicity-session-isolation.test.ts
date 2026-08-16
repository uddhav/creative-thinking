/**
 * Path memory and sensor readings belong to a session, not to the process.
 *
 * `ErgodicityManager` was constructed once per server (`index.ts`) and handed to
 * every `executeThinkingStep` call, and `initializeSession` seeded each new
 * session with `ergodicityManager.getPathMemory()` — which returns the live
 * object, not a copy. So every session shared one `PathMemory` by identity
 * before a single step ran: one session's irreversible commitments depressed
 * another's flexibility, and its constraints surfaced in the other's response.
 *
 * The early-warning sensors leaked the same way — `warningSystem` caches a
 * reading for five seconds, so a concurrent session received a measurement
 * taken for a different problem.
 *
 * `SessionData.ergodicityManager` already existed and was already populated by
 * `initializeSession`; nothing read it. The fix reads it.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { executeThinkingStep } from '../../layers/execution.js';
import { planThinkingSession } from '../../layers/planning.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type { PlanThinkingSessionInput, ExecuteThinkingStepInput } from '../../types/index.js';

describe('Ergodicity state is per session', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let visualFormatter: VisualFormatter;
  let metricsCollector: MetricsCollector;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  /** One manager for the whole run, exactly as the server constructs it. */
  let sharedManager: ErgodicityManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
    techniqueRegistry = TechniqueRegistry.getInstance();
    visualFormatter = new VisualFormatter(true);
    metricsCollector = new MetricsCollector();
    complexityAnalyzer = new HybridComplexityAnalyzer();
    sharedManager = new ErgodicityManager();
  });

  async function runSession(problem: string, outputs: string[]): Promise<string> {
    const plan = planThinkingSession(
      { problem, techniques: ['triz'], timeframe: 'thorough' } as PlanThinkingSessionInput,
      sessionManager,
      techniqueRegistry
    );

    let sessionId: string | undefined;

    for (let index = 0; index < outputs.length; index++) {
      const stepInput: ExecuteThinkingStepInput = {
        planId: plan.planId,
        sessionId,
        technique: 'triz',
        problem,
        currentStep: index + 1,
        totalSteps: outputs.length,
        output: outputs[index],
        nextStepNeeded: index < outputs.length - 1,
      };

      const response = await executeThinkingStep(
        stepInput,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        sharedManager
      );

      const data = JSON.parse(response.content[0].text) as Record<string, unknown>;
      sessionId = (data.sessionId as string) ?? sessionId;
    }

    return sessionId as string;
  }

  it('does not let one session accumulate into another', async () => {
    const heavy = await runSession('Retire the legacy pipeline', [
      'We will eliminate the legacy pipeline permanently and commit the budget.',
      'Remove the fallback entirely; delete the old path.',
      'Invest in a permanent single-vendor contract.',
      'Commit irreversibly to the migration.',
    ]);

    const light = await runSession('Name the onboarding flow', [
      'Explore lightly.',
      'Consider options.',
      'Sketch alternatives.',
      'Note ideas.',
    ]);

    const heavyMemory = sessionManager.getSession(heavy)?.pathMemory;
    const lightMemory = sessionManager.getSession(light)?.pathMemory;

    expect(heavyMemory).toBeDefined();
    expect(lightMemory).toBeDefined();

    // Identity, not just value: initializeSession used to hand out the shared
    // manager's live PathMemory, so both sessions pointed at one object.
    expect(heavyMemory, 'sessions must not share one PathMemory object').not.toBe(lightMemory);

    // Each records only its own steps. Shared, both read 8.
    expect(heavyMemory?.pathHistory).toHaveLength(4);
    expect(lightMemory?.pathHistory).toHaveLength(4);

    const lightDecisions = (lightMemory?.pathHistory ?? [])
      .map(event => String(event.decision ?? ''))
      .join(' ');
    expect(lightDecisions, 'the second session must not see the first’s commitments').not.toContain(
      'eliminate'
    );
  });

  it('gives each session its own manager', async () => {
    const first = await runSession('First problem', ['One.', 'Two.']);
    const second = await runSession('Second problem', ['One.', 'Two.']);

    const firstManager = sessionManager.getSession(first)?.ergodicityManager;
    const secondManager = sessionManager.getSession(second)?.ergodicityManager;

    expect(firstManager).toBeDefined();
    expect(secondManager).toBeDefined();
    expect(firstManager).not.toBe(secondManager);
    // And neither is the process-wide one the server passes in.
    expect(firstManager).not.toBe(sharedManager);
  });
});
