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
    instructions?: unknown;
  };
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
      expect(graph?.nodes.length, `${technique} produced no graph nodes`).toBeGreaterThan(0);
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

    // Rounds track the LONGEST technique, plus at most one for the terminal
    // node — it soft-depends on every technique's final node, so when it is not
    // already the deepest it claims a round of its own. Under signature
    // grouping this tracked the NODE TOTAL instead (17 rounds for 19 nodes),
    // because every later step got its own group.
    expect(
      groups.length,
      `expected ${longest} or ${longest + 1} rounds, got ${groups.length}`
    ).toBeLessThanOrEqual(longest + 1);
    expect(groups.length).toBeGreaterThanOrEqual(longest);

    // More than the first round has to be genuinely parallel — that was the
    // whole defect.
    const parallelRounds = groups.filter(g => g.length > 1).length;
    expect(parallelRounds, 'only the first round was parallel').toBeGreaterThan(1);

    // Deliberately NOT asserting maxParallelism === max(group sizes): the
    // generator computes it with that exact expression, so the assertion is a
    // tautology that cannot fail. Assert against the technique count instead,
    // which is an independent fact about the plan.
    expect(graph?.metadata.maxParallelism, 'every technique should advance in round 1').toBe(
      techniques.length
    );
  });

  it('never puts two steps of one technique in the same round', () => {
    const server = new LateralThinkingServer();
    const graph = planFor(server, ['six_hats', 'scamper', 'concept_extraction']).executionGraph;
    expect(graph?.metadata.parallelizableGroups.length, 'no rounds emitted').toBeGreaterThan(0);
    const byId = new Map((graph?.nodes ?? []).map(n => [n.id, n.technique]));

    for (const group of graph?.metadata.parallelizableGroups ?? []) {
      const techniques = group.map(id => byId.get(id));
      expect(
        new Set(techniques).size,
        `a round runs two steps of one technique: ${techniques.join(', ')}`
      ).toBe(techniques.length);
    }
  });

  it('schedules the session-ending node after everything else', () => {
    // The terminal node carries nextStepNeeded: false and ends the session. It
    // takes a SOFT dependency on every technique's final node so it lands last.
    //
    // Grouping by depth over hard edges only put it in the wrong round: with
    // six_hats (7 steps) then po (4), its depth came from its own predecessor
    // alone, so it landed in round 3 with three six_hats nodes in rounds 4-6 —
    // telling a caller to end the session and then send more steps to it.
    // Soft edges are non-blocking for execution but are still ordering, and a
    // round is an ordering.
    //
    // six_hats+po specifically: the shape only breaks when the LAST technique
    // is shorter than an earlier one.
    const server = new LateralThinkingServer();
    for (const techniques of [
      ['six_hats', 'po'],
      ['six_hats', 'scamper', 'po', 'triz'],
    ] as LateralTechnique[][]) {
      const graph = planFor(server, techniques).executionGraph;
      const groups = graph?.metadata.parallelizableGroups ?? [];
      const nodes = graph?.nodes ?? [];
      const roundOf = (id: string) => groups.findIndex(g => g.includes(id));

      const terminal = nodes.find(
        n =>
          (n as unknown as { parameters: { nextStepNeeded?: boolean } }).parameters
            .nextStepNeeded === false
      );
      expect(terminal, 'no terminal node found').toBeDefined();

      const after = nodes.filter(n => roundOf(n.id) > roundOf((terminal as GraphNode).id));
      expect(
        after.map(n => n.id),
        `${techniques.join('+')}: nodes scheduled after the session-ending node`
      ).toEqual([]);
    }
  });

  it('states a speedup the schedule can actually deliver', () => {
    // `sequentialTimeMultiplier` was bucketed off `maxParallelism` alone —
    // >=2 gave "3x", >=4 gave "5x" — with no reference to how many rounds the
    // schedule actually has. `parallelizationBenefits` renders it to the caller
    // as a wall-clock fact ("cutting wall-clock time by roughly 3x"), so the
    // overstatement was load-bearing, not decorative:
    //
    //   2 techniques: 11 nodes over 8 rounds -> claimed 3x, actual 1.4x
    //   4 techniques: 23 nodes over 9 rounds -> claimed 5x, actual 2.6x
    //
    // Now that rounds are the real schedule length, the honest figure is
    // nodes / rounds.
    // Literal expectations, NOT `totalNodes / parallelizableGroups.length`.
    // That is production's own expression read back off the same object, so it
    // holds for any internally consistent formula — including a regression to
    // the #308 signature grouping, where 23 nodes become 21 singleton rounds,
    // the multiplier becomes "1.1x", and a derived assertion stays green while
    // the graph advertises no parallelism at all.
    //
    // These numbers come from the technique step counts: six_hats 7, scamper 8,
    // po 4, triz 4. Rounds track the longest technique plus one for the
    // session-ending node when it is not already deepest.
    const cases: Array<[LateralTechnique[], number, number, string]> = [
      [['six_hats'], 7, 7, '1x'],
      [['six_hats', 'po'], 11, 8, '1.4x'],
      [['six_hats', 'scamper'], 15, 8, '1.9x'],
      [['six_hats', 'scamper', 'po', 'triz'], 23, 9, '2.6x'],
    ];

    const server = new LateralThinkingServer();
    for (const [techniques, nodes, rounds, multiplier] of cases) {
      const graph = planFor(server, techniques).executionGraph;
      const md = graph?.metadata as unknown as {
        totalNodes: number;
        sequentialTimeMultiplier: string;
        parallelizableGroups: string[][];
      };
      const label = techniques.join('+');

      expect(md.totalNodes, `${label}: node count`).toBe(nodes);
      expect(md.parallelizableGroups.length, `${label}: round count`).toBe(rounds);
      expect(
        md.sequentialTimeMultiplier,
        `${label}: ${nodes} nodes over ${rounds} rounds should read ${multiplier}`
      ).toBe(multiplier);
    }
  });

  it('quotes the same speedup in the prose as in the metadata', () => {
    // `parallelizationBenefits` renders the figure into a caller-facing
    // sentence, and the code comment records that these were once two
    // different numbers for one quantity in one response — metadata said
    // "10x" while the prose said "approximately 7x". Nothing in the suite
    // asserted on that sentence at all, so changing the figure to a decimal
    // could have left it reading wrongly with nothing to notice.
    const server = new LateralThinkingServer();
    for (const techniques of [
      ['six_hats', 'po'],
      ['six_hats', 'scamper', 'po', 'triz'],
    ] as LateralTechnique[][]) {
      const graph = planFor(server, techniques).executionGraph;
      const md = graph?.metadata as unknown as { sequentialTimeMultiplier: string };
      const prose = String(
        (graph?.instructions as { parallelizationBenefits?: string } | undefined)
          ?.parallelizationBenefits ?? ''
      );

      expect(prose, 'no parallelization prose emitted').not.toBe('');
      expect(
        prose,
        `prose does not cite the metadata figure ${md.sequentialTimeMultiplier}`
      ).toContain(md.sequentialTimeMultiplier);
      // And it should read as a sentence, not a bare number spliced in.
      expect(prose).toMatch(/cutting wall-clock time by roughly \d+(\.\d)?x versus/);
    }
  });

  it('tells the caller each parallel branch needs its own session', () => {
    // Measured: two concurrent cross-process writes to ONE session lose a step,
    // 5 runs of 5. The same two writes under distinct sessionIds lose nothing.
    // The graph hands out a parallel schedule, so the condition that makes it
    // safe has to travel with it rather than living only in the project docs.
    const server = new LateralThinkingServer();
    const plan = planFor(server, ['six_hats', 'scamper']);
    // `executionGraph.instructions.executionGuidance` is where this lands.
    // An earlier version read a `parallelizationGuidance` key first, which
    // does not exist anywhere in src/ — a dead branch that would have made
    // this pass off the fallback regardless.
    expect(plan.executionGraph, 'no executionGraph on the plan').toBeDefined();
    const guidance = JSON.stringify(plan.executionGraph?.instructions ?? {});
    expect(guidance.toLowerCase(), 'the plan never mentions a per-branch session').toMatch(
      /sessionid/
    );
  });
});
