/**
 * The tool schema must declare the fields the handlers actually require.
 *
 * Nothing enforces the schema — `index.ts` casts raw arguments straight to the
 * input type and no `additionalProperties` is set — so an undeclared field has
 * always worked *if the caller happened to send it*. That is the trap: the
 * schema is the only thing telling a caller a field exists, so an undeclared
 * required field is not a validation gap, it is an undiscoverable one.
 *
 * `meta_learning` steps 1 and 2 threw `MISSING_REQUIRED_FIELD` for
 * `patternRecognition` and `learningHistory`, neither of which the schema
 * declared. The schema even carried a comment naming them as "alternative
 * fields" while not declaring them, so the only way to find them was to trigger
 * the error and read the message.
 *
 * This walks the registry rather than listing techniques, so a new handler that
 * requires an undeclared field fails here instead of at a user's first run.
 *
 * Declaring a field is only half of it. The first version of this file probed
 * for *absence* — it caught a field the schema failed to name, and was blind to
 * a field the schema named with the wrong shape, because a handler that objects
 * to a shape returns `false` rather than throwing. Six were wrong that way, and
 * they failed in two different registers:
 *
 *   loud   `matrix` was declared `number[][]` against a validator wanting
 *          `{ hypotheses, evidence, ratings }`; `vacantSpaces` was declared
 *          `string[]` against four-key objects. The schema-obedient value was
 *          rejected outright.
 *   silent `weaknessMapping` and `excellenceDesign` were declared flat against
 *          object reads, `pronounRatios` carried an example keyed by pronoun
 *          when the reader wants `iWe`, and `coherenceScore` was capped at 1
 *          against a 0-100 scale. All four validate, then report nothing — or,
 *          for `coherenceScore`, report the opposite of what was measured.
 *
 * So there are three tests below, one per register.
 */

import { describe, it, expect } from 'vitest';
import { EXECUTE_THINKING_STEP_TOOL } from '../../server/ToolDefinitions.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { ALL_LATERAL_TECHNIQUES } from '../../types/index.js';
import type { LateralTechnique } from '../../types/index.js';
import { ValidationError } from '../../errors/types.js';

const properties = EXECUTE_THINKING_STEP_TOOL.inputSchema.properties as Record<
  string,
  Record<string, unknown>
>;
const declared = new Set(Object.keys(properties));

/**
 * The value a caller reading only the schema would most plausibly send:
 * enum members by their first option, numbers at the low end of their declared
 * range, objects filled out to every declared property. If a handler rejects
 * this, the schema and the handler disagree about the field's shape.
 */
function canonical(schema: Record<string, unknown>): unknown {
  if (Array.isArray(schema.anyOf)) {
    return canonical(schema.anyOf[0] as Record<string, unknown>);
  }
  switch (schema.type) {
    case 'string':
      return Array.isArray(schema.enum) ? (schema.enum as string[])[0] : 'probe';
    case 'integer':
    case 'number':
      if (typeof schema.exclusiveMinimum === 'number') return schema.exclusiveMinimum + 1;
      if (typeof schema.minimum === 'number') return schema.minimum;
      return 0;
    case 'boolean':
      return true;
    case 'array':
      return [canonical((schema.items as Record<string, unknown>) ?? { type: 'string' })];
    case 'object': {
      const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
      if (!props) return {};
      return Object.fromEntries(Object.entries(props).map(([key, sub]) => [key, canonical(sub)]));
    }
    default:
      return 'probe';
  }
}

/**
 * Fields no single value can satisfy, with the constraint that makes it so.
 * Each is a real cross-field or cross-step rule, not an exemption — and each is
 * stated in the field's own schema description, which is the point.
 */
/**
 * Does a value the handler demonstrably reads match what the schema declares?
 *
 * Enough JSON Schema to answer that and no more: type, enum, numeric bounds,
 * array items, object properties. A value that reaches an insight but does not
 * conform is a field the schema describes wrongly.
 */
function conformsToSchema(value: unknown, schema: Record<string, unknown>): string[] {
  const problems: string[] = [];
  if (Array.isArray(schema.anyOf)) {
    const branches = schema.anyOf as Array<Record<string, unknown>>;
    return branches.some(branch => conformsToSchema(value, branch).length === 0)
      ? []
      : ['matches no branch of anyOf'];
  }

  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') problems.push(`expected string, got ${typeof value}`);
      else if (Array.isArray(schema.enum) && !(schema.enum as string[]).includes(value)) {
        problems.push(`"${value}" is not in the declared enum`);
      }
      break;
    case 'integer':
    case 'number':
      if (typeof value !== 'number') problems.push(`expected number, got ${typeof value}`);
      else {
        if (typeof schema.minimum === 'number' && value < schema.minimum) {
          problems.push(`${value} is below the declared minimum ${schema.minimum}`);
        }
        if (typeof schema.maximum === 'number' && value > schema.maximum) {
          problems.push(`${value} is above the declared maximum ${schema.maximum}`);
        }
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') problems.push(`expected boolean, got ${typeof value}`);
      break;
    case 'array':
      if (!Array.isArray(value)) problems.push(`expected array, got ${typeof value}`);
      else if (schema.items) {
        value.forEach((item, index) => {
          for (const problem of conformsToSchema(item, schema.items as Record<string, unknown>)) {
            problems.push(`[${index}] ${problem}`);
          }
        });
      }
      break;
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        problems.push(`expected object, got ${Array.isArray(value) ? 'array' : typeof value}`);
        break;
      }
      const props = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
      const extra = (schema.additionalProperties ?? null) as Record<string, unknown> | null;
      for (const [key, sub] of Object.entries(value as Record<string, unknown>)) {
        const declaredSub = props[key] ?? extra;
        if (!declaredSub) {
          problems.push(`key "${key}" is not declared`);
          continue;
        }
        for (const problem of conformsToSchema(sub, declaredSub)) {
          problems.push(`.${key} ${problem}`);
        }
      }
      break;
    }
    default:
      break;
  }
  return problems;
}

const NO_CANONICAL_VALUE: Record<string, string> = {
  probabilities: 'the values must sum to 1.0, so no per-field value is valid alone',
  hatColor: 'locked to the step: step N must carry hatOrder[N-1]. Covered by its own test below.',
};

describe('tool schema and handlers agree', () => {
  const registry = TechniqueRegistry.getInstance();

  it('declares every field a handler rejects a step for omitting', () => {
    const undeclared: string[] = [];

    for (const technique of ALL_LATERAL_TECHNIQUES) {
      const handler = registry.getHandler(technique);
      const totalSteps = handler.getTechniqueInfo().totalSteps;

      for (let step = 1; step <= totalSteps; step++) {
        // Probe with output only. A handler that throws here names the field it
        // wanted; that name has to be findable in the schema.
        try {
          handler.validateStep(step, { output: 'probe' });
        } catch (error) {
          if (!(error instanceof ValidationError)) throw error;

          // The field is reported on the error, and aliases are named in the message.
          const named = new Set<string>();
          if (error.field) named.add(error.field);
          const details = error.details as { acceptedFields?: string[] } | undefined;
          for (const alias of details?.acceptedFields ?? []) named.add(alias);

          for (const field of named) {
            if (!declared.has(field)) {
              undeclared.push(`${technique} step ${step} requires "${field}"`);
            }
          }
        }
      }
    }

    expect(undeclared, 'add these to EXECUTE_THINKING_STEP_TOOL.inputSchema.properties').toEqual(
      []
    );
  });

  it('offers every hat the six_hats handler will accept', () => {
    const handler = registry.getHandler('six_hats');
    const enumerated = (
      EXECUTE_THINKING_STEP_TOOL.inputSchema.properties.hatColor as {
        enum: string[];
      }
    ).enum;

    // Step 7 is Purple. The enum stopped at six, so the seventh step could not be
    // labelled — and SixHatsHandler.extractInsights returns nothing at all for a
    // step whose hatColor is absent, so the whole technique reported no insights.
    for (let step = 1; step <= handler.getTechniqueInfo().totalSteps; step++) {
      const accepted = enumerated.filter(color =>
        handler.validateStep(step, { output: 'probe', hatColor: color })
      );

      expect(accepted, `no declared hatColor is valid for six_hats step ${step}`).not.toHaveLength(
        0
      );
    }

    expect(enumerated).toContain('purple');
  });

  it('accepts the value its own schema describes', () => {
    const contradictions: string[] = [];

    for (const technique of ALL_LATERAL_TECHNIQUES) {
      const handler = registry.getHandler(technique);

      for (let step = 1; step <= handler.getTechniqueInfo().totalSteps; step++) {
        // Only steps that pass on output alone can show a field's rejection;
        // a step that already fails, or throws for a missing required field,
        // tells us nothing here and is the first test's business.
        let baseline = false;
        try {
          baseline = handler.validateStep(step, { output: 'probe' });
        } catch {
          continue;
        }
        if (!baseline) continue;

        for (const [field, schema] of Object.entries(properties)) {
          if (field in NO_CANONICAL_VALUE) continue;

          let accepted = false;
          try {
            accepted = handler.validateStep(step, {
              output: 'probe',
              [field]: canonical(schema),
            });
          } catch {
            continue;
          }

          if (!accepted) {
            contradictions.push(
              `${technique} step ${step} rejects "${field}" as the schema describes it`
            );
          }
        }
      }
    }

    expect(
      contradictions,
      'the schema describes a shape the handler refuses — fix whichever is wrong'
    ).toEqual([]);
  });

  /**
   * The quiet half. Each row is a field whose schema-shaped value must reach an
   * insight; the shape in the comment is what the schema used to say, and what
   * produced nothing at all.
   */
  const READ_AS_DESCRIBED: Array<{
    technique: LateralTechnique;
    step: number;
    field: string;
    value: unknown;
    was: string;
  }> = [
    {
      technique: 'reverse_benchmarking',
      step: 1,
      field: 'weaknessMapping',
      value: { universalWeaknesses: ['nobody answers overnight'] },
      was: 'string[]',
    },
    {
      technique: 'reverse_benchmarking',
      step: 3,
      field: 'antiMimeticStrategy',
      value: { differentiationVector: 'answer in five minutes' },
      was: 'string only — half the union it accepts',
    },
    {
      technique: 'reverse_benchmarking',
      step: 4,
      field: 'excellenceDesign',
      value: { area: 'first response', standard: 'five minutes, measured publicly' },
      was: 'string',
    },
    {
      technique: 'linguistic_forensics',
      step: 3,
      field: 'pronounRatios',
      value: { iWe: 0.9, activePassive: 0.5, ownershipAvoidance: 0.2 },
      was: 'an example keyed { i, we } — validates, reports nothing',
    },
    {
      technique: 'temporal_work',
      step: 1,
      field: 'temporalLandscape',
      value: { fixedDeadlines: ['board meeting on the 14th'], kairosOpportunities: [] },
      was: 'a bare object with no keys named',
    },
    {
      technique: 'temporal_creativity',
      step: 3,
      field: 'blackSwanScenarios',
      value: ['the vendor is acquired mid-migration'],
      was: 'declared and validated, then read by nothing',
    },
  ];

  it.each(READ_AS_DESCRIBED)(
    'reads $field on $technique as the schema describes it (was: $was)',
    ({ technique, step, field, value }) => {
      const handler = registry.getHandler(technique);
      const base = { currentStep: step, output: 'A recorded finding for this step.' };

      // Both halves, or the row proves nothing. That the handler reads this
      // value was already true before the schema was fixed; what was missing is
      // that the schema describes the value the handler reads.
      expect(
        conformsToSchema(value, properties[field]),
        `the handler reads this, so the schema has to describe it`
      ).toEqual([]);

      const without = handler.extractInsights([base]);
      const with_ = handler.extractInsights([{ ...base, [field]: value }]);

      expect(
        with_.length,
        `${field} reached no insight, so its content was silently discarded`
      ).toBeGreaterThan(without.length);
    }
  );

  it('reads coherenceScore on the scale it is scored on', () => {
    const handler = registry.getHandler('linguistic_forensics');
    const last = handler.getTechniqueInfo().totalSteps;
    const at = (score: number) =>
      handler.extractInsights([{ currentStep: last, output: 'probe', coherenceScore: score }]);

    // The schema capped this at 1. A caller obeying it reported its highest
    // possible coherence and was told, in the final synthesis, the opposite.
    expect(at(0.9).join(' ')).toContain('Low coherence');
    expect(at(90).join(' ')).toContain('High coherence');

    const schema = properties.coherenceScore;
    expect(schema.maximum, 'the scale the bands at 85/70/50 are read on').toBe(100);
  });
});
