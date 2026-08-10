/**
 * A step whose data is refused must not be reported as a step out of range.
 *
 * `validateStep` returns a bare boolean. `ExecutionValidator` folded that
 * `false` in with "the step number was normalised", and `execution.ts` built one
 * message for both: `Step 2 is invalid for Reverse Benchmarking. Valid range is
 * 1-5`. Step 2 is inside 1-5. The caller was handed a range to fix that was
 * never wrong, with no mention of the field that was — and the step was
 * discarded, so the session could not complete either.
 *
 * The two failures are now told apart, and the culprit field is named by asking
 * the handler again without each field in turn.
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
import type { PlanThinkingSessionInput, ExecuteThinkingStepInput } from '../../types/index.js';

async function runStep(overrides: Partial<ExecuteThinkingStepInput>): Promise<string> {
  const sessionManager = new SessionManager();
  const registry = TechniqueRegistry.getInstance();
  const problem = 'Where is nobody competing?';
  const technique = overrides.technique ?? 'reverse_benchmarking';

  const plan = planThinkingSession(
    { problem, techniques: [technique], timeframe: 'quick' } as PlanThinkingSessionInput,
    sessionManager,
    registry
  );

  const response = await executeThinkingStep(
    {
      planId: plan.planId,
      technique,
      problem,
      currentStep: 2,
      totalSteps: registry.getHandler(technique).getTechniqueInfo().totalSteps,
      output: 'Overnight support and self-serve onboarding.',
      nextStepNeeded: true,
      ...overrides,
    } as ExecuteThinkingStepInput,
    sessionManager,
    registry,
    new VisualFormatter(true),
    new MetricsCollector(),
    new HybridComplexityAnalyzer(),
    new ErgodicityManager()
  );

  return response.content[0].text;
}

describe('a refused field is reported as a field', () => {
  it('names the field instead of the step number', async () => {
    // vacantSpaces entries need four keys. The schema used to describe them as
    // plain strings, so this is exactly what an obedient caller sent.
    const text = await runStep({
      vacantSpaces: ['overnight support', 'self-serve onboarding'],
    } as Partial<ExecuteThinkingStepInput>);

    expect(text).toContain('vacantSpaces');
    expect(text, 'the step number was never the problem').not.toContain('Valid range is');
    expect(text).toContain('E102');
  });

  it('still reports a genuine out-of-range step as one', async () => {
    const text = await runStep({ currentStep: 99, totalSteps: 5 });

    expect(text).toContain('exceeds total steps');
    expect(text).toContain('E206');
  });

  it('accepts the same field once it is the shape the schema now describes', async () => {
    const text = await runStep({
      vacantSpaces: [
        {
          space: 'overnight support',
          opportunityValue: 'high',
          implementationDifficulty: 'medium',
          whyVacant: 'everyone staffs to business hours',
        },
      ],
    } as Partial<ExecuteThinkingStepInput>);

    expect(text).not.toContain('E102');
    expect(text).toContain('overnight support');
  });
});
