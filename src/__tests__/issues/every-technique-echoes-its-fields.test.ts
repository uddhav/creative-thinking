/**
 * Every technique gets its own declared fields back, not just the fourteen
 * someone remembered to add to a switch.
 *
 * `extractTechniqueSpecificFields` was a switch with one `case` per technique.
 * Fourteen had a case; the other eighteen — biomimetic_path, temporal_creativity,
 * first_principles, paradoxical_problem, neuro_computational, meta_learning and
 * the rest — declared fields in the tool schema, accepted them on input, and
 * received nothing back. A caller sending `swarmBehavior` could not tell
 * whether the server had read it, ignored it, or rejected it.
 *
 * The switch is a table now, so `tsc` refuses to build until all thirty-two
 * techniques have an entry. That catches a technique added without an echo. It
 * does not catch a technique whose entry is wrong, which is what these guards
 * are for.
 *
 * They drive the real MCP client. An earlier version called the layer function
 * directly and so never met `RequestHandlers`, which holds its own
 * technique-field validation and can refuse a call before an echo is ever
 * built. Three defects on this branch passed their guards for exactly that
 * reason, so an assertion about what the caller receives is written at the
 * caller's level.
 *
 * Second defect, same function: every field was gated on truthiness. A
 * `validityScore` of 0 — criteria-based analysis concluding the account does
 * not hold up — was indistinguishable from a step that measured nothing. One
 * field, `suppressionDepth`, had been hand-patched to `!== undefined` after it
 * bit someone; the other hundred-odd had not.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';
import { EXECUTE_THINKING_STEP_TOOL } from '../../server/ToolDefinitions.js';
import { ALL_LATERAL_TECHNIQUES } from '../../types/index.js';
import type { LateralTechnique } from '../../types/index.js';

const PROBLEM = 'Cut the release train from monthly to weekly';

/**
 * The fields each technique is expected to echo. Kept here rather than
 * imported so the guard cannot pass by agreeing with the table it is guarding —
 * a guard that reads its own subject proves only that the subject is
 * self-consistent.
 */
const EXPECTED: Record<LateralTechnique, readonly string[]> = {
  six_hats: ['hatColor'],
  scamper: ['scamperAction', 'modifications'],
  po: ['provocation', 'principles'],
  random_entry: ['randomStimulus', 'connections'],
  concept_extraction: ['successExample', 'extractedConcepts', 'applications'],
  yes_and: ['initialIdea', 'additions', 'evaluations'],
  design_thinking: ['designStage', 'empathyInsights', 'ideaList', 'userFeedback'],
  triz: ['contradiction', 'inventivePrinciples', 'minimalSolution'],
  neural_state: ['dominantNetwork', 'switchingRhythm', 'integrationInsights'],
  temporal_work: ['temporalLandscape', 'circadianAlignment', 'asyncSyncBalance'],
  cultural_integration: ['culturalFrameworks', 'bridgeBuilding', 'parallelPaths'],
  collective_intel: ['wisdomSources', 'emergentPatterns', 'collectiveInsights'],
  disney_method: ['dreamerVision', 'realistPlan', 'criticRisks'],
  nine_windows: ['nineWindowsMatrix', 'interdependencies'],
  quantum_superposition: ['solutionStates', 'amplitudes', 'chosenState', 'preservedInsights'],
  temporal_creativity: ['pathHistory', 'delayOptions', 'timelineProjections', 'lessonIntegration'],
  paradoxical_problem: ['paradox', 'solutionA', 'solutionB', 'metaPath'],
  meta_learning: ['patternRecognition', 'learningHistory', 'strategyAdaptations'],
  biomimetic_path: ['immuneResponse', 'swarmBehavior', 'symbioticRelationships', 'mutations'],
  first_principles: ['components', 'fundamentalTruths', 'assumptions', 'reconstruction'],
  neuro_computational: ['neuralMappings', 'computationalModels', 'convergenceMetrics'],
  criteria_based_analysis: ['validityScore'],
  linguistic_forensics: ['pronounRatios', 'coherenceScore'],
  competing_hypotheses: ['probabilities', 'matrix', 'leadingHypothesis'],
  reverse_benchmarking: ['weaknessMapping', 'vacantSpaces', 'excellenceDesign'],
  context_reframing: ['contextAnalysis', 'frameShift', 'interventions'],
  perception_optimization: ['perceptionGaps', 'experienceDesign', 'psychologicalValue'],
  anecdotal_signal: ['signals', 'anecdoteCount', 'scalingScenarios'],
  // These four read no declared field of their own — they work from `output`
  // alone. Recorded as an empty expectation rather than omitted, because an
  // omission is exactly what hid the eighteen.
  cognitive_bias_audit: [],
  latticework: [],
  keeper_test: [],
  steelman_red_team: [],
};

/**
 * A value of the shape the tool schema declares.
 *
 * Built from the schema rather than hand-written, because several of these
 * fields are rejected by their handler unless the shape is exact: `hatColor`
 * and `scamperAction` are enums, and every `perceptionGaps` entry needs all
 * four of its keys. A sampler that ignored that produced validation errors and
 * the guard read them as missing echoes.
 */
interface FieldSchema {
  type?: string;
  enum?: unknown[];
  items?: FieldSchema;
  properties?: Record<string, FieldSchema>;
  required?: string[];
}

function sampleFor(field: string, schema: FieldSchema | undefined): unknown {
  if (schema?.enum?.length) return schema.enum[0];

  switch (schema?.type) {
    case 'array': {
      const one = schema.items ? sampleFor(field, schema.items) : `${field} entry`;
      return [one];
    }
    case 'object': {
      if (!schema.properties) return { note: `${field} recorded` };
      const built: Record<string, unknown> = {};
      for (const key of schema.required ?? Object.keys(schema.properties)) {
        built[key] = sampleFor(key, schema.properties[key]);
      }
      return built;
    }
    case 'number':
    case 'integer':
      // Several numeric fields carry an exclusiveMinimum of 0, so 0.5 rather
      // than 0. The zero case is guarded separately, on a field that allows it.
      return 0.5;
    case 'boolean':
      return true;
    default:
      return `${field} recorded`;
  }
}

const schemaProperties = (
  EXECUTE_THINKING_STEP_TOOL.inputSchema as { properties: Record<string, FieldSchema> }
).properties;

/** One client for the file: the helper spawns a server, and 28 is a lot of them. */
let client: MCPClientTestHelper;

beforeAll(async () => {
  client = new MCPClientTestHelper();
  await client.connect();
}, 30_000);

afterAll(async () => {
  await client.disconnect();
  // Explicit timeout: vitest's hook default is 10s, and tearing down a spawned
  // server under full-suite load exceeded it. Only ever failed in the whole
  // run, never when the file was run alone.
}, 30_000);

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

describe('a technique gets back the fields it declares', () => {
  it('covers every registered technique, so a new one cannot be forgotten', () => {
    expect(Object.keys(EXPECTED).sort()).toEqual([...ALL_LATERAL_TECHNIQUES].sort());
  });

  it.each(ALL_LATERAL_TECHNIQUES.filter(t => EXPECTED[t].length > 0))(
    '%s echoes what the caller recorded',
    async technique => {
      const sent: Record<string, unknown> = {};
      for (const field of EXPECTED[technique]) {
        sent[field] = sampleFor(field, schemaProperties[field]);
      }

      const data = await firstStep(technique, sent);

      const missing = EXPECTED[technique].filter(
        field => JSON.stringify(data[field]) !== JSON.stringify(sent[field])
      );
      expect(missing, `${technique} was sent these and did not report them back`).toEqual([]);
    }
  );

  it('echoes a zero rather than dropping it as falsy', async () => {
    // A validityScore of 0 is criteria-based analysis concluding the account
    // does not hold up. Under the old truthiness gate that reading and "the
    // step measured nothing" were the same response.
    const data = await firstStep('criteria_based_analysis', { validityScore: 0 });

    expect(data.validityScore, 'a zero reading was dropped as falsy').toBe(0);
  });

  it('echoes an empty array rather than dropping it', async () => {
    // "We looked for signals and found none" is a finding. `[]` is falsy in
    // neither JS nor this codebase — but `if (stepInput.signals)` passed it,
    // and `if (stepInput.signals.length)` would not have. Guarding the shape
    // that is actually easy to get wrong next.
    const data = await firstStep('anecdotal_signal', { signals: [], anecdoteCount: 0 });

    expect(data.signals).toEqual([]);
    expect(data.anecdoteCount).toBe(0);
  });

  it('does not echo a field belonging to a different technique', async () => {
    // The table is per-technique for a reason: echoing everything the caller
    // sent would make the response a mirror rather than a report, and a
    // misrouted field would look accepted.
    const data = await firstStep('six_hats', { hatColor: 'blue', swarmBehavior: ['not ours'] });

    expect(data.hatColor).toBe('blue');
    expect(data.swarmBehavior, 'a biomimetic_path field came back from six_hats').toBeUndefined();
  });
});

describe('the echo table and the tool schema agree', () => {
  it('declares every field it promises to echo', () => {
    const undeclared = ALL_LATERAL_TECHNIQUES.flatMap(technique =>
      EXPECTED[technique]
        .filter(field => schemaProperties[field] === undefined)
        .map(field => `${technique}.${field}`)
    );

    expect(undeclared, 'echoed to the caller but absent from the tool schema').toEqual([]);
  });

  it('also returns the three scamper fields the server produces itself', async () => {
    // These are not caller echoes and so are not in EXPECTED, which asserts
    // that what came back equals what was sent. `pathImpact` is the server's
    // own analysis of the step, `modificationHistory` is accumulated across
    // the session at execution.ts:229 — it is overwritten on the way in, which
    // is why sending one and expecting it back is the wrong test — and
    // `alternativeSuggestions` is passed through. None is schema-declared.
    // Guarded here so rebuilding the echo cannot quietly drop them; leaving
    // `modificationHistory` out of the table is exactly what broke
    // `pda-scamper.test.ts` on the first attempt.
    const data = await firstStep('scamper', {
      scamperAction: 'substitute',
      alternativeSuggestions: ['Use a recycled frame'],
    });

    expect(data.pathImpact).toBeDefined();
    expect(data.modificationHistory).toBeDefined();
    expect(data.alternativeSuggestions).toEqual(['Use a recycled frame']);
  });
});
