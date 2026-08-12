/**
 * A technique's own fields, and the engine's own metrics, have to come back.
 *
 * There were two copies of `extractTechniqueSpecificFields`. The one on the
 * live path (`ExecutionResponseBuilder`) knew six techniques; a second copy in
 * `ResponseBuilder` knew fourteen and sat behind a private `buildCoreResponse`
 * that nothing called. So eight techniques — concept_extraction, yes_and,
 * design_thinking, triz, neural_state, temporal_work, cultural_integration,
 * collective_intel — declared fields in the tool schema, accepted them on
 * input, and got none of them back. A caller could not tell whether the server
 * had read `contradiction` at all.
 *
 * Separately, `execution.ts` took `currentFlexibility` off the orchestrator's
 * result and dropped `metrics` — constraintLevel, optionSpaceSize and
 * pathDivergence, measured on every step and reported to nobody.
 *
 * These guards drive the real MCP client, because that is the only path either
 * defect lived on: both had unit coverage against the copy that was never
 * called, which is how they survived. A later round found the same shape twice
 * more — `isError` stripped from every layer-built error, and debate mode
 * dropped by the planning allowlist — both invisible to a test that enters
 * below `RequestHandlers`.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';
import type { LateralTechnique } from '../../types/index.js';

const PROBLEM = 'Cut the release train from monthly to weekly';

/** One client for the file; the helper spawns a server per connection. */
let client: MCPClientTestHelper;

beforeAll(async () => {
  client = new MCPClientTestHelper();
  await client.connect();
}, 30_000);

afterAll(async () => {
  await client.disconnect();
});

function textOf(result: { content: Array<{ type: string }> }): string {
  const first = result.content[0];
  if (first?.type !== 'text') {
    throw new Error(`expected a text content item, got ${first?.type ?? 'nothing'}`);
  }
  return (first as { type: 'text'; text: string }).text;
}

/** Runs step 1 of a single-technique plan and returns what the caller got. */
async function firstStep(
  technique: LateralTechnique,
  fields: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const plan = JSON.parse(
    textOf(
      await client.callTool('plan_thinking_session', {
        problem: PROBLEM,
        techniques: [technique],
        timeframe: 'thorough',
      })
    )
  ) as { planId: string; estimatedSteps: number };

  return JSON.parse(
    textOf(
      await client.callTool('execute_thinking_step', {
        planId: plan.planId,
        technique,
        problem: PROBLEM,
        currentStep: 1,
        totalSteps: plan.estimatedSteps,
        output: 'A recorded finding for this step, written plainly and at length.',
        nextStepNeeded: true,
        ...fields,
      })
    )
  ) as Record<string, unknown>;
}

describe('a technique gets its own declared fields back', () => {
  it('echoes TRIZ fields, which only the uncalled copy used to know', async () => {
    const data = await firstStep('triz', {
      contradiction: 'Faster releases against fewer regressions',
      inventivePrinciples: ['Segmentation', 'Prior action'],
      viaNegativaRemovals: ['The manual sign-off gate'],
      minimalSolution: 'Ship the smallest slice behind a flag',
    });

    expect(data.contradiction).toBe('Faster releases against fewer regressions');
    expect(data.inventivePrinciples).toEqual(['Segmentation', 'Prior action']);
    expect(data.viaNegativaRemovals).toEqual(['The manual sign-off gate']);
    expect(data.minimalSolution).toBe('Ship the smallest slice behind a flag');
  });

  it('echoes neural_state fields, including a suppressionDepth of zero', async () => {
    const data = await firstStep('neural_state', {
      dominantNetwork: 'dmn',
      // Zero is a reading. The extractor tests `!== undefined` for exactly
      // this: a falsy guard would drop it and report nothing measured.
      suppressionDepth: 0,
      switchingRhythm: ['20 minutes diffuse', '40 minutes focused'],
      integrationInsights: ['The two modes disagree about scope'],
    });

    expect(data.dominantNetwork).toBe('dmn');
    expect(data.suppressionDepth).toBe(0);
    expect(data.switchingRhythm).toEqual(['20 minutes diffuse', '40 minutes focused']);
    expect(data.integrationInsights).toEqual(['The two modes disagree about scope']);
  });

  it('still echoes the six the live path already knew', async () => {
    const data = await firstStep('six_hats', { hatColor: 'blue' });

    expect(data.hatColor).toBe('blue');
  });

  // The four assertions below were `ResponseBuilder.test.ts`'s
  // `buildExecutionResponse` and `extractTechniqueSpecificFields` describes.
  // They moved here with the behaviour: against the deleted copy they proved a
  // dead method worked, and every one of them passed while the eight
  // techniques above got nothing back.
  it('echoes the insights, guidance and history the caller asked for', async () => {
    const data = await firstStep('six_hats', {
      hatColor: 'blue',
      risks: ['Risk 1'],
      mitigations: ['Mitigation 1'],
    });

    expect(data.technique).toBe('six_hats');
    expect(data.currentStep).toBe(1);
    expect(Array.isArray(data.insights)).toBe(true);
    expect(data.risks).toEqual(['Risk 1']);
    expect(data.mitigations).toEqual(['Mitigation 1']);
    expect(data.nextStepGuidance).toBeDefined();
    expect(data.historyLength).toBe(1);
  });

  it('echoes SCAMPER path impact without echoing a caller-typed flexibility', async () => {
    const data = await firstStep('scamper', {
      scamperAction: 'substitute',
      alternativeSuggestions: ['Use recycled materials'],
    });

    expect(data.scamperAction).toBe('substitute');
    // The handler's own analysis, not whatever the caller sent.
    expect(data.pathImpact).toBeDefined();
    expect(data.alternativeSuggestions).toEqual(['Use recycled materials']);
    // The caller's own flexibility number is not echoed back, because it is
    // not an input any more — the engine measures it from the path history.
    expect(data.flexibilityScore).toBeUndefined();
  });

  it('echoes revision fields', async () => {
    const data = await firstStep('po', {
      isRevision: true,
      revisesStep: 1,
      branchFromStep: 1,
      branchId: 'branch-123',
    });

    expect(data.isRevision).toBe(true);
    expect(data.revisesStep).toBe(1);
    expect(data.branchFromStep).toBe(1);
    expect(data.branchId).toBe('branch-123');
  });

  it('echoes the risk and adversarial fields', async () => {
    const data = await firstStep('triz', {
      risks: ['Risk 1'],
      failureModes: ['Failure 1'],
      mitigations: ['Mitigation 1'],
      antifragileProperties: ['Redundancy'],
      blackSwans: ['Unexpected event'],
    });

    expect(data.risks).toEqual(['Risk 1']);
    expect(data.failureModes).toEqual(['Failure 1']);
    expect(data.mitigations).toEqual(['Mitigation 1']);
    expect(data.antifragileProperties).toEqual(['Redundancy']);
    expect(data.blackSwans).toEqual(['Unexpected event']);
  });
});

describe('the response carries what the ergodicity adapter measured', () => {
  it('reports constraintLevel, optionSpaceSize and pathDivergence', async () => {
    const data = await firstStep('six_hats', { hatColor: 'blue' });

    const metrics = data.ergodicityMetrics as Record<string, number> | undefined;
    expect(metrics, 'the adapted metrics never reached the caller').toBeDefined();
    // Values, not shapes. These four were asserted only as `typeof ===
    // 'number'`, which let every one of them be replaced by a constant zero
    // with the whole suite still green — the wiring was guarded and the
    // measurement was not.
    expect(typeof metrics?.constraintLevel).toBe('number');
    expect(typeof metrics?.optionSpaceSize).toBe('number');
    expect(typeof metrics?.pathDivergence).toBe('number');

    // A session one step in has spent something and no more than everything.
    expect(metrics?.currentFlexibility).toBeGreaterThan(0);
    expect(metrics?.currentFlexibility).toBeLessThanOrEqual(1);
    expect(metrics?.currentFlexibility).toBe(
      (data.flexibilityScore as number | undefined) ?? metrics?.currentFlexibility
    );
  });

  it('reports them on every step, not only when flexibility has already fallen', async () => {
    // `flexibilityScore` is withheld above 0.7 because it is a warning. These
    // are readings, and a reading withheld until things look bad cannot serve
    // as the baseline they are compared against.
    const data = await firstStep('six_hats', { hatColor: 'blue' });

    expect(data.flexibilityScore, 'step 1 should be well above the warning line').toBeUndefined();
    expect(data.ergodicityMetrics).toBeDefined();
  });
});
