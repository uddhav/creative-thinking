/**
 * `execute_thinking_step` has always had a second mode, and the schema said
 * nothing about it.
 *
 * `processLateralThinking` dispatches on `sessionOperation` before it validates
 * anything else (index.ts:166), so save / load / list / delete / export have
 * always worked. None of them was declared in the tool schema, and `required`
 * listed the seven thinking-step fields unconditionally — so a client following
 * the schema could not legally issue one. The capability existed and was
 * unreachable by contract, the same fault as the technique fields that were
 * accepted but never declared.
 *
 * What remains here is the schema itself: whether the contract declares the
 * mode, its options objects, and the two-shape `oneOf`. Those are facts about a
 * static object and reading it directly is the right level.
 *
 * The behavioural half — that the operations actually work through the request
 * path, and that the ones needing persistence say when they cannot reach it —
 * moved to `integration/session-operations-over-mcp.test.ts`. It belongs there
 * because a schema saying a call is legal and a request path refusing it is
 * exactly the disagreement that made this feature unreachable for a day while
 * this file was green.
 */

import { describe, it, expect } from 'vitest';
import { EXECUTE_THINKING_STEP_TOOL } from '../../server/ToolDefinitions.js';

const OPERATIONS = ['save', 'load', 'list', 'delete', 'export'] as const;

describe('the session-operation mode is in the contract', () => {
  const schema = EXECUTE_THINKING_STEP_TOOL.inputSchema;

  it('declares every operation the server dispatches', () => {
    expect(schema.properties.sessionOperation?.enum).toEqual([...OPERATIONS]);
  });

  it('declares the options object each operation reads', () => {
    for (const options of [
      'saveOptions',
      'loadOptions',
      'listOptions',
      'deleteOptions',
      'exportOptions',
    ]) {
      expect(schema.properties[options], `${options} is undeclared`).toBeDefined();
    }
  });

  it('lets a session operation satisfy the schema without the thinking-step fields', () => {
    // The whole point. A single `required` list demanded planId, technique,
    // problem, currentStep, totalSteps, output and nextStepNeeded of every
    // call — including the ones that must not carry any of them.
    expect(schema.required, 'a flat required list cannot describe two shapes').toBeUndefined();

    const branches = schema.oneOf ?? [];
    expect(branches).toHaveLength(2);
    expect(branches.map(b => b.required)).toContainEqual(['sessionOperation']);
    // `problem` is not in this list. The plan states it once at plan scope and
    // its execution-graph nodes omit it, so a caller running those nodes
    // verbatim sends none; the server resolves it from `planId`. Sending it is
    // still accepted, which is why this is a relaxation rather than a removal.
    expect(branches.map(b => b.required)).toContainEqual([
      'planId',
      'technique',
      'currentStep',
      'totalSteps',
      'output',
      'nextStepNeeded',
    ]);
  });

  it('says where exportOptions.sessionId goes, because the top-level one is ignored', () => {
    const exportOptions = schema.properties.exportOptions;

    expect(exportOptions?.required).toEqual(['sessionId', 'format']);
    // A top-level sessionId looks like it should work and is silently unread —
    // the call is then rejected as missing the very field that was sent.
    expect(exportOptions?.description).toMatch(/sessionId.*HERE/i);
  });
});
