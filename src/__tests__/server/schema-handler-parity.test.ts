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
 */

import { describe, it, expect } from 'vitest';
import { EXECUTE_THINKING_STEP_TOOL } from '../../server/ToolDefinitions.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { ALL_LATERAL_TECHNIQUES } from '../../types/index.js';
import { ValidationError } from '../../errors/types.js';

const declared = new Set(Object.keys(EXECUTE_THINKING_STEP_TOOL.inputSchema.properties));

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
});
