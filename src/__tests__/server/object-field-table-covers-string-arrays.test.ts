/**
 * The request path has its own table of which fields to type-check, and it is
 * the third such list in the codebase.
 *
 * `ObjectFieldValidator.validateTechniqueArrayFields` runs before dispatch and
 * checks that a technique's array fields really are arrays of strings. It is
 * hand-maintained, and it agreed with neither the tool schema nor the handlers:
 * it covered 14 of 32 techniques, left 30 string-array fields unchecked, and
 * listed `connections` under `po` — which has no such field — while
 * `random_entry`, which does, went unchecked.
 *
 * The partiality is not all accidental, and that is the point of this guard.
 * The validator checks arrays of STRINGS. Eight fields the handlers read are
 * arrays of OBJECTS — nineWindowsMatrix, perceptionGaps, signals,
 * scalingScenarios, interventions, vacantSpaces, entanglements, pathHistory —
 * and listing any of them would refuse valid input. So "make it cover all 32"
 * would have been a regression wearing the clothes of a fix.
 *
 * Both halves are asserted here: every string-array field a handler reads is
 * present, and no object-array field is. Membership is checked against the
 * built schema rather than by reading the source, because doing the latter got
 * the field types wrong three separate times in the work that produced this
 * file — `provocation` and `successExample` read as arrays when they are
 * strings, `weaknessMapping` as an array when it is an object.
 */

import { describe, it, expect } from 'vitest';
import { EXECUTE_THINKING_STEP_TOOL } from '../../server/ToolDefinitions.js';
import { ObjectFieldValidator } from '../../core/validators/ObjectFieldValidator.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { ALL_LATERAL_TECHNIQUES } from '../../types/index.js';
import type { LateralTechnique } from '../../types/index.js';

interface Prop {
  type?: string;
  items?: { type?: string };
}
const schema = (EXECUTE_THINKING_STEP_TOOL.inputSchema as { properties: Record<string, Prop> })
  .properties;

const isStringArray = (field: string) =>
  schema[field]?.type === 'array' && schema[field]?.items?.type === 'string';
const isObjectArray = (field: string) =>
  schema[field]?.type === 'array' && schema[field]?.items?.type === 'object';

/**
 * What the request-path table validates for a technique, discovered by probing
 * the validator rather than by importing its private map: a field that is
 * checked rejects a non-array, and a field that is not checked is passed over.
 */
function validatedFields(technique: LateralTechnique): Set<string> {
  const checked = new Set<string>();
  for (const field of Object.keys(schema)) {
    // Every array field, not just the string ones. Probing only string arrays
    // made the object-array half of this guard vacuous: an object array could
    // never enter this set, so the assertion that none is present passed no
    // matter what the table said. Caught by kill-check — adding
    // nineWindowsMatrix to the table left all 66 tests green.
    if (schema[field]?.type !== 'array') continue;
    const result = ObjectFieldValidator.validateTechniqueArrayFields(technique, {
      [field]: 'not an array',
    });
    if (!result.isValid) checked.add(field);
  }
  return checked;
}

/** Every field each handler actually reads, per the schema's vocabulary. */
function fieldsReadBy(technique: LateralTechnique): string[] {
  const handler = TechniqueRegistry.getInstance().getHandler(technique);
  const info = handler.getTechniqueInfo();
  const touched = new Set<string>();
  const base: Record<string, unknown> = {};
  for (const field of Object.keys(schema)) {
    base[field] = isStringArray(field) || isObjectArray(field) ? [] : 'x';
  }
  for (let step = 1; step <= info.totalSteps; step++) {
    const probe = new Proxy(
      { ...base, currentStep: step, technique, output: 'x'.repeat(80) },
      {
        get(target, prop) {
          if (typeof prop === 'string') touched.add(prop);
          return (target as Record<string, unknown>)[prop as string];
        },
        has(target, prop) {
          if (typeof prop === 'string') touched.add(prop);
          return prop in target;
        },
      }
    );
    try {
      handler.validateStep(step, probe);
    } catch {
      /* a refusal still records the reads that led to it */
    }
  }
  return [...touched].filter(field => schema[field] !== undefined);
}

describe('the request-path array table matches what the handlers read', () => {
  it.each(ALL_LATERAL_TECHNIQUES)('%s has every string-array field it reads', technique => {
    const validated = validatedFields(technique);
    const missing = fieldsReadBy(technique).filter(f => isStringArray(f) && !validated.has(f));

    expect(missing, `${technique} reads these string arrays and nothing type-checks them`).toEqual(
      []
    );
  });

  it.each(ALL_LATERAL_TECHNIQUES)('%s does not string-check an array of objects', technique => {
    const validated = validatedFields(technique);
    const wrong = [...validated].filter(isObjectArray);

    // The failure this prevents: adding one of these makes a valid call fail
    // with "must be an array of strings" for a field the schema says is an
    // array of objects.
    expect(wrong, `${technique} would reject valid object arrays`).toEqual([]);
  });

  it('checks connections for random_entry and not for po', () => {
    // The transposition that prompted this guard. `po` has no `connections`;
    // `random_entry` does, and was the one going unchecked.
    expect(validatedFields('random_entry').has('connections')).toBe(true);
    expect(validatedFields('po').has('connections')).toBe(false);
  });

  it('still refuses a malformed array for a covered field', () => {
    // The control. Coverage means nothing if the check itself stopped working.
    const result = ObjectFieldValidator.validateTechniqueArrayFields('biomimetic_path', {
      swarmBehavior: 'a string, not an array',
    });

    expect(result.isValid).toBe(false);
  });
});
