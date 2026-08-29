/**
 * What the execution graph advertises has to be a schedule that works.
 *
 * Two defects, both measured before this guard existed (#308).
 *
 * `parallelizableGroups` grouped nodes by identical hard-dependency signature.
 * That is sufficient but not necessary: step 2 of technique A depends on A's
 * step 1, step 2 of B depends on B's step 1, so their signatures differ and
 * they never shared a round — even though the techniques are independent. A
 * four-technique plan reported `maxParallelism: 4` and then put all twenty
 * remaining nodes in groups of one, so only the first round was ever parallel
 * and the metadata contradicted itself.
 *
 * And three techniques still emitted intra-technique fan-out — two steps
 * depending on the same earlier step, i.e. concurrent with each other. #327
 * removed exactly that from six_hats, scamper and nine_windows because the
 * steps of one technique run against one sessionId. That reasoning is now
 * measured rather than argued: two concurrent cross-process writes to one
 * session lose a step, five runs out of five, while the same two writes under
 * distinct sessionIds lose nothing. So the graph must never place two steps of
 * one technique in the same round, by any route.
 */

import { describe, it, expect } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import { ALL_LATERAL_TECHNIQUES } from '../../types/index.js';
import type { LateralTechnique } from '../../types/index.js';

interface GraphNode {
  id: string;
  technique: string;
  dependencies: Array<{ nodeId: string; type: 'hard' | 'soft' }>;
}

interface PlanResponse {
  executionGraph?: {
    nodes: GraphNode[];
    metadata: { maxParallelism: number; parallelizableGroups: string[][] };
  };
  parallelizationGuidance?: unknown;
}

function planFor(server: LateralThinkingServer, techniques: LateralTechnique[]): PlanResponse {
  const result = server.planThinkingSession({ problem: 'Graph shape probe', techniques });
  expect(result.isError).toBeFalsy();
  return JSON.parse(result.content[0].text) as PlanResponse;
}

describe('the execution graph advertises a schedule that works', () => {
  it('chains every technique internally, with no step depending on a non-predecessor', () => {
    const server = new LateralThinkingServer();
    const offenders: string[] = [];

    for (const technique of ALL_LATERAL_TECHNIQUES) {
      const graph = planFor(server, [technique]).executionGraph;
      const nodes = graph?.nodes ?? [];
      nodes.forEach((node, i) => {
        const hard = node.dependencies.filter(d => d.type === 'hard');
        if (i === 0) {
          if (hard.length !== 0) offenders.push(`${technique} step 1 has ${hard.length} hard deps`);
          return;
        }
        // Exactly one hard dep, on the immediate predecessor. Checking only the
        // count reads a fan-out as a chain — two steps both depending on step 1
        // are concurrent with each other, which is the shape being excluded.
        if (hard.length !== 1) {
          offenders.push(`${technique} step ${i + 1} has ${hard.length} hard deps`);
          return;
        }
        if (hard[0].nodeId !== nodes[i - 1].id) {
          offenders.push(
            `${technique} step ${i + 1} depends on ${hard[0].nodeId}, not ${nodes[i - 1].id}`
          );
        }
      });
    }

    expect(
      offenders,
      `techniques advertising intra-technique concurrency:\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  it('puts independent techniques in the same round, not just on the first step', () => {
    const server = new LateralThinkingServer();
    const techniques: LateralTechnique[] = ['six_hats', 'scamper', 'po'];
    const graph = planFor(server, techniques).executionGraph;
    const groups = graph?.metadata.parallelizableGroups ?? [];
    const nodes = graph?.nodes ?? [];

    // Round count should track the LONGEST technique, not the node total. With
    // signature grouping it tracked the node total, because every later step
    // got its own group.
    const perTechnique = new Map<string, number>();
    for (const node of nodes) {
      perTechnique.set(node.technique, (perTechnique.get(node.technique) ?? 0) + 1);
    }
    const longest = Math.max(...perTechnique.values());

    expect(groups.length, `expected about ${longest} rounds, got ${groups.length}`).toBe(longest);

    // And more than the first round has to be genuinely parallel.
    const parallelRounds = groups.filter(g => g.length > 1).length;
    expect(parallelRounds, 'only the first round was parallel').toBeGreaterThan(1);

    // maxParallelism must agree with the groups it is derived from.
    expect(graph?.metadata.maxParallelism).toBe(Math.max(...groups.map(g => g.length)));
  });

  it('never puts two steps of one technique in the same round', () => {
    const server = new LateralThinkingServer();
    const graph = planFor(server, ['six_hats', 'scamper', 'concept_extraction']).executionGraph;
    const byId = new Map((graph?.nodes ?? []).map(n => [n.id, n.technique]));

    for (const group of graph?.metadata.parallelizableGroups ?? []) {
      const techniques = group.map(id => byId.get(id));
      expect(
        new Set(techniques).size,
        `a round runs two steps of one technique: ${techniques.join(', ')}`
      ).toBe(techniques.length);
    }
  });

  it('tells the caller each parallel branch needs its own session', () => {
    // Measured: two concurrent cross-process writes to ONE session lose a step,
    // 5 runs of 5. The same two writes under distinct sessionIds lose nothing.
    // The graph hands out a parallel schedule, so the condition that makes it
    // safe has to travel with it rather than living only in the project docs.
    const server = new LateralThinkingServer();
    const plan = planFor(server, ['six_hats', 'scamper']);
    const guidance = JSON.stringify(plan.parallelizationGuidance ?? plan.executionGraph ?? {});
    expect(guidance.toLowerCase(), 'the plan never mentions a per-branch session').toMatch(
      /sessionid/
    );
  });
});
