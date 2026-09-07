/**
 * Adjacent-pair sequence advice on the plan response (#240), asserted where
 * the caller stands, through the built server.
 *
 * Advisory only: the planner never reorders. Every adjacent pair gets an
 * entry, and an entry with `evidence: 'none'` is NEUTRAL by absence, never
 * "checked and compatible". Emitting only the non-NEUTRAL rows was rejected
 * because an empty array reads as clean.
 *
 * The seed is whatever survived re-measurement (see the table module and the
 * evidence file); the assertions below read the table rather than hard-code
 * a pair, so they stay honest if the evidence changes.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';
import { SEQUENCE_TABLE } from '../../layers/planning/techniqueSequenceTable.js';
import type { LateralTechnique } from '../../types/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const PROBLEM = 'Pick one data architecture with budget for only one';

let client: MCPClientTestHelper;

beforeAll(async () => {
  client = new MCPClientTestHelper();
  await client.connect();
}, 30_000);

afterAll(async () => {
  await client.disconnect();
}, 30_000);

interface Advice {
  pair: [string, string];
  position: number;
  relation: string;
  evidence: 'measured' | 'none';
  citation?: string;
  note?: string;
}

// The plan response carries no `techniques` field (the allowlist never did);
// order is read from workflow[].technique and the graph.
interface PlanResponse {
  workflow?: Array<{ technique: string }>;
  executionGraph?: { nodes: Array<{ technique: string }> };
  sequenceAdvice?: Advice[];
  warnings?: string[];
}

function textOf(result: { content: Array<{ type: string; text?: string }> }): string {
  return result.content[0]?.text ?? '';
}

/** The workflow is one entry per step; the technique order is the sequence of distinct techniques by first appearance. */
function techniqueOrder(p: PlanResponse): string[] {
  const order: string[] = [];
  for (const step of p.workflow ?? []) {
    if (order.at(-1) !== step.technique) order.push(step.technique);
  }
  return order;
}

async function plan(techniques: LateralTechnique[]): Promise<PlanResponse> {
  const result = await client.callTool('plan_thinking_session', { problem: PROBLEM, techniques });
  expect(result.isError).toBeFalsy();
  return JSON.parse(textOf(result)) as PlanResponse;
}

/** GitHub's slug rule for a heading: lowercase, strip punctuation incl. the em-dash, spaces to hyphens. */
function slug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[`*_~]/g, m => (m === '_' ? '_' : ''))
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

describe('sequenceAdvice', () => {
  it('a pair with no evidence reports NEUTRAL by absence, and order is kept', async () => {
    // Break: hard-code evidence 'measured' in buildSequenceAdvice.
    const input: LateralTechnique[] = ['six_hats', 'scamper'];
    const p = await plan(input);
    expect(p.sequenceAdvice).toHaveLength(1);
    const [advice] = p.sequenceAdvice ?? [];
    expect(advice.pair).toEqual(input);
    expect(advice.position).toBe(0);
    expect(advice.relation).toBe('NEUTRAL');
    expect(advice.evidence).toBe('none');
    expect(advice.citation).toBeUndefined();
    expect(techniqueOrder(p)).toEqual(input);
  }, 30_000);

  it('a single-technique plan carries no sequenceAdvice', async () => {
    const p = await plan(['six_hats']);
    expect(p.sequenceAdvice).toBeUndefined();
  }, 30_000);

  it('the same technique twice is NEUTRAL by absence with a note that says so', async () => {
    const p = await plan(['triz', 'triz']);
    const [advice] = p.sequenceAdvice ?? [];
    expect(advice.relation).toBe('NEUTRAL');
    expect(advice.evidence).toBe('none');
    expect(advice.note).toMatch(/same technique/i);
  }, 30_000);

  it('order is preserved for a deliberately non-alphabetical input, in workflow and graph', async () => {
    // Break: sort the shared array inside buildSequenceAdvice. The input must
    // not already be sorted, or an in-place sort is a no-op and the break
    // stays green.
    const input: LateralTechnique[] = ['triz', 'paradoxical_problem', 'quantum_superposition'];
    const p = await plan(input);
    expect(techniqueOrder(p)).toEqual(input);
    const graphOrder: string[] = [];
    for (const node of p.executionGraph?.nodes ?? []) {
      if (graphOrder.at(-1) !== node.technique) graphOrder.push(node.technique);
    }
    expect(graphOrder).toEqual(input);
    expect((p.sequenceAdvice ?? []).map(a => a.pair)).toEqual([
      ['triz', 'paradoxical_problem'],
      ['paradoxical_problem', 'quantum_superposition'],
    ]);
  }, 30_000);

  describe('every measured row', () => {
    if (SEQUENCE_TABLE.length === 0) {
      // vitest reports a describe with no case as an error; the empty table is the
      // measured state today, so say so as a case rather than skipping the suite.
      it('has no measured row today, so there is nothing to plan against', () => {
        expect(SEQUENCE_TABLE).toHaveLength(0);
      });
    }
    for (const row of SEQUENCE_TABLE) {
      it(`${row.pair[0]} then ${row.pair[1]} reports ${row.relation} with its citation`, async () => {
        // Break: empty the table, or make the lookup order-sensitive for an
        // AVOID_ADJACENT row.
        const p = await plan(row.pair);
        const [advice] = p.sequenceAdvice ?? [];
        expect(advice.relation).toBe(row.relation);
        expect(advice.evidence).toBe('measured');
        expect(advice.citation).toBe(row.citation);
        if (row.relation === 'AVOID_ADJACENT') {
          expect((p.warnings ?? []).join(' ')).toContain(row.pair[0]);
          expect((p.warnings ?? []).join(' ')).toContain(row.pair[1]);
          const reversed = await plan([row.pair[1], row.pair[0]]);
          expect(reversed.sequenceAdvice?.[0]?.relation).toBe(row.relation);
        } else {
          // SEQUENCE rows state an order; the reversed pair has no row.
          // Break: drop the ORDER_SENSITIVE guard in lookupSequenceRow.
          const reversed = await plan([row.pair[1], row.pair[0]]);
          expect(reversed.sequenceAdvice?.[0]?.evidence).toBe('none');
        }
        // Order kept even when the advice is to separate them.
        expect(techniqueOrder(p)).toEqual(row.pair);
      }, 30_000);
    }
  });
});

describe('the scale', () => {
  // The guard #240's re-scope asked for, modelled on ordinalScale.test.ts:
  // every row is ordinal, cited, and its citation resolves to a heading in
  // the evidence file that ships with the repo. Break: change one anchor.
  const evidence = readFileSync(
    path.join(repoRoot, 'evals', 'evidence', 'technique-contrasts.md'),
    'utf8'
  );
  const anchors = new Set(
    evidence
      .split('\n')
      .filter(line => /^#{1,6} /.test(line))
      .map(line => slug(line.replace(/^#{1,6} /, '')))
  );

  it('the evidence file is the copy in the repo, not a pointer elsewhere', () => {
    expect(evidence).toContain('## The five measured pairs');
  });

  for (const row of SEQUENCE_TABLE) {
    it(`${row.pair.join('+')}: relation is ordinal, cited, and the anchor exists`, () => {
      expect(['SEQUENCE_STRONGLY', 'SEQUENCE', 'AVOID_ADJACENT']).toContain(row.relation);
      const [file, anchor] = row.citation.split('#');
      expect(file).toBe('evals/evidence/technique-contrasts.md');
      expect(anchors.has(anchor), `no heading slugs to #${anchor}`).toBe(true);
      expect(row.note.length).toBeGreaterThan(0);
      for (const value of Object.values(row)) {
        expect(typeof value, 'no numeric field on a row').not.toBe('number');
      }
    });
  }
});
