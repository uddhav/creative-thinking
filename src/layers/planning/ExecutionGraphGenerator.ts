/**
 * ExecutionGraphGenerator - Generates DAG for client-side parallel execution
 */

import type {
  ExecutionGraph,
  ExecutionGraphNode,
  NodeDependency,
  TechniqueWorkflow,
} from '../../types/planning.js';
import type { ExecuteThinkingStepInput, LateralTechnique } from '../../types/index.js';

export class ExecutionGraphGenerator {
  /**
   * Generate execution graph from workflow
   */
  static generateExecutionGraph(
    planId: string,
    problem: string,
    workflows: TechniqueWorkflow[]
  ): ExecutionGraph {
    const nodes: ExecutionGraphNode[] = [];
    let nodeId = 0;
    let globalStepNumber = 0;

    // Process each technique workflow
    for (const workflow of workflows) {
      const techniqueNodes = this.generateTechniqueNodes(
        planId,
        problem,
        workflow,
        nodeId,
        globalStepNumber
      );

      nodes.push(...techniqueNodes);
      nodeId += techniqueNodes.length;
      globalStepNumber += techniqueNodes.length;
    }

    // nextStepNeeded: false triggers the executor's completion path, so only
    // the plan-wide last node may carry it. Per-technique terminal nodes used
    // to send false too (they were computed from technique-local counts),
    // which finalized and then blocked the session at every technique
    // boundary when the graph was executed verbatim.
    const lastNode = nodes[nodes.length - 1];
    if (lastNode) {
      lastNode.parameters.nextStepNeeded = false;

      // The terminal node ends the session, so every other technique must
      // finish first even under parallel execution. Soft dependencies order
      // it last without blocking — parallelizableGroups reads hard deps only.
      const existing = new Set(lastNode.dependencies.map(d => d.nodeId));
      let offset = 0;
      for (const workflow of workflows) {
        const techniqueFinal = nodes[offset + workflow.steps.length - 1];
        offset += workflow.steps.length;
        if (techniqueFinal && techniqueFinal !== lastNode && !existing.has(techniqueFinal.id)) {
          lastNode.dependencies.push({ nodeId: techniqueFinal.id, type: 'soft' });
          existing.add(techniqueFinal.id);
        }
      }
    }

    // Calculate metadata
    const metadata = this.calculateMetadata(nodes);

    // Generate instructions
    const instructions = this.generateInstructions(nodes, metadata);

    return {
      nodes,
      metadata,
      instructions,
    };
  }

  /**
   * Generate nodes for a specific technique
   */
  private static generateTechniqueNodes(
    planId: string,
    problem: string,
    workflow: TechniqueWorkflow,
    startNodeId: number,
    startStepNumber: number
  ): ExecutionGraphNode[] {
    const nodes: ExecutionGraphNode[] = [];
    const technique = workflow.technique;
    const totalSteps = workflow.steps.length;

    // A plan-time assigned stimulus lives on the block's step 1 but applies to
    // EVERY step of the technique — a po/random_entry session works with one
    // value throughout. Nodes previously carried the per-step description as
    // provocation on steps 2+, so a caller executing the graph verbatim sent
    // guidance prose that the stimulus.mismatch gate then flagged.
    const blockFirst = workflow.steps[0] as
      { stimulus?: string; stimulusSource?: string } | undefined;
    const assignedStimulus =
      blockFirst?.stimulusSource === 'assigned' ? blockFirst.stimulus : undefined;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const nodeId = `node-${startNodeId + i + 1}`;
      const stepNumber = startStepNumber + i + 1;

      // Determine dependencies based on technique type
      const dependencies = this.getDependencies(technique, i, startNodeId);

      // Build complete parameters for execute_thinking_step
      const parameters = this.buildParameters(
        planId,
        technique,
        i + 1,
        totalSteps,
        assignedStimulus !== undefined ? { ...step, stimulus: assignedStimulus } : step
      );

      nodes.push({
        id: nodeId,
        stepNumber,
        technique,
        parameters,
        dependencies,
        canSkipIfFailed: this.canSkipIfFailed(technique),
      });
    }

    return nodes;
  }

  /**
   * Determine dependencies based on technique characteristics
   */
  private static getDependencies(
    technique: LateralTechnique,
    stepIndex: number,
    startNodeId: number
  ): NodeDependency[] {
    // Every technique chains. There is no parallel class, no sequential class
    // and no hybrid class any more, because all three produced the same edges
    // or produced edges that were unsafe to follow.
    //
    // #327 removed the parallel class: six_hats, scamper and nine_windows
    // emitted no dependencies at all, on the reasoning that their steps are
    // independent perspectives. Defensible about the method, false about
    // execution — the steps of one technique run against one sessionId.
    //
    // The sequential class then had a body byte-identical to the default, so
    // listing a technique in it changed nothing, and two of the five hybrids
    // fell through to a hybrid default that was itself identical to the outer
    // one. Of the three hybrids that did differ, all emitted fan-out: two steps
    // depending on the same earlier step, i.e. concurrent with each other.
    //
    // That is the same shape #327 removed, and it is now measured rather than
    // argued. Two concurrent cross-process writes to one session lose a step,
    // five runs out of five; the same two writes under distinct sessionIds lose
    // nothing. neural_state's fan-out was reachable; its `return []` for a
    // fifth step was not, because the technique has three.
    //
    // Cross-technique parallelism is unaffected: independent techniques still
    // advance concurrently, which is what `parallelizableGroups` expresses.
    if (stepIndex === 0) {
      return [];
    }
    return [{ nodeId: `node-${startNodeId + stepIndex}`, type: 'hard' }];
  }

  /**
   * Build complete parameters for execute_thinking_step.
   *
   * These parameters are the contract: a caller runs them verbatim, filling
   * only `output` and threading `sessionId`. `problem` is deliberately absent
   * — one copy per node meant 25 copies of the caller's problem in a
   * five-technique plan, half the total echo. `execute_thinking_step` resolves
   * it from `planId` instead, which is why `problem` is optional there.
   */
  private static buildParameters(
    planId: string,
    technique: LateralTechnique,
    currentStep: number,
    totalSteps: number,
    step: { description?: string; stimulus?: string; contradiction?: string }
  ): Omit<ExecuteThinkingStepInput, 'problem'> {
    const baseParams: Omit<ExecuteThinkingStepInput, 'problem'> = {
      planId,
      technique,
      currentStep,
      totalSteps,
      output: '',
      // Only the plan-wide last node ends the session; generateExecutionGraph
      // flips that single node to false after all techniques are laid out.
      nextStepNeeded: true,
    };

    // Add technique-specific parameters
    const techniqueParams = this.getTechniqueSpecificParams(technique, currentStep, step);

    return {
      ...baseParams,
      ...techniqueParams,
    };
  }

  /**
   * Get technique-specific parameters
   * Made public for testing bounds checking
   */
  static getTechniqueSpecificParams(
    technique: LateralTechnique,
    currentStep: number,
    step: { description?: string; stimulus?: string; contradiction?: string }
  ): Partial<ExecuteThinkingStepInput> {
    switch (technique) {
      case 'six_hats': {
        // Six Hats has 7 colors including purple (ergodicity extension)
        const hatColors = ['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'] as const;
        const colorIndex = Math.min(Math.max(0, currentStep - 1), hatColors.length - 1);
        return {
          hatColor: hatColors[colorIndex],
        };
      }

      case 'scamper': {
        const scamperActions = [
          'substitute',
          'combine',
          'adapt',
          'modify',
          'put_to_other_use',
          'eliminate',
          'reverse',
          'parameterize',
        ] as const;
        const actionIndex = Math.min(Math.max(0, currentStep - 1), scamperActions.length - 1);
        return {
          scamperAction: scamperActions[actionIndex],
        };
      }

      case 'design_thinking': {
        const designStages = ['empathize', 'define', 'ideate', 'prototype', 'test'] as const;
        const stageIndex = Math.min(Math.max(0, currentStep - 1), designStages.length - 1);
        return {
          designStage: designStages[stageIndex],
        };
      }

      case 'disney_method': {
        const disneyRoles = ['dreamer', 'realist', 'critic'] as const;
        const roleIndex = Math.min(Math.max(0, currentStep - 1), disneyRoles.length - 1);
        return {
          disneyRole: disneyRoles[roleIndex],
        };
      }

      case 'nine_windows': {
        const nineWindowsCells = [
          { systemLevel: 'sub-system' as const, timeFrame: 'past' as const },
          { systemLevel: 'sub-system' as const, timeFrame: 'present' as const },
          { systemLevel: 'sub-system' as const, timeFrame: 'future' as const },
          { systemLevel: 'system' as const, timeFrame: 'past' as const },
          { systemLevel: 'system' as const, timeFrame: 'present' as const },
          { systemLevel: 'system' as const, timeFrame: 'future' as const },
          { systemLevel: 'super-system' as const, timeFrame: 'past' as const },
          { systemLevel: 'super-system' as const, timeFrame: 'present' as const },
          { systemLevel: 'super-system' as const, timeFrame: 'future' as const },
        ];
        const cellIndex = Math.min(Math.max(0, currentStep - 1), nineWindowsCells.length - 1);
        const cell = nineWindowsCells[cellIndex];
        return {
          currentCell: cell,
        };
      }

      case 'po':
        // Prefer the plan-time assigned provocation; the description is the
        // full guidance text and only ever a fallback.
        return {
          provocation:
            (step as { stimulus?: string; description?: string }).stimulus ||
            (step as { description?: string }).description ||
            '',
        };

      case 'random_entry':
        return {
          randomStimulus: (step as { stimulus?: string }).stimulus || '',
        };

      case 'triz':
        return {
          contradiction: (step as { contradiction?: string }).contradiction || '',
          inventivePrinciples: [],
        };

      default:
        return {};
    }
  }

  /**
   * Calculate metadata for the execution graph
   */
  private static calculateMetadata(nodes: ExecutionGraphNode[]) {
    // Find parallelizable groups
    const parallelizableGroups = this.findParallelizableGroups(nodes);

    // Calculate critical path
    const criticalPath = this.findCriticalPath(nodes);

    // Calculate max parallelism
    const maxParallelism = Math.max(...parallelizableGroups.map(group => group.length), 1);

    // Calculate sequential time multiplier
    const sequentialTimeMultiplier = this.calculateSequentialTimeMultiplier(
      nodes,
      parallelizableGroups
    );

    return {
      totalNodes: nodes.length,
      maxParallelism,
      criticalPath,
      parallelizableGroups,
      sequentialTimeMultiplier,
    };
  }

  /**
   * Calculate sequential time multiplier based on parallelization potential
   */
  private static calculateSequentialTimeMultiplier(
    nodes: ExecutionGraphNode[],
    rounds: string[][]
  ): string {
    // Nodes divided by rounds — the length of the sequential schedule over the
    // length of the parallel one. That is what the number means, and now that
    // rounds ARE the schedule it can simply be computed.
    //
    // It used to be bucketed off maxParallelism alone: >=2 gave "3x", >=4 gave
    // "5x", >=6 gave "10x", with no reference to how many rounds there were.
    // That consistently overstated, because a plan's techniques differ in
    // length so only the early rounds are full — 11 nodes over 8 rounds is
    // 1.4x, not the 3x it claimed, and 23 over 9 is 2.6x, not 5x.
    //
    // The overstatement was load-bearing rather than decorative:
    // `generateParallelizationBenefits` renders this to the caller as a
    // wall-clock fact, "cutting wall-clock time by roughly Nx".
    if (rounds.length === 0 || nodes.length === 0) {
      return '1x';
    }

    const speedup = nodes.length / rounds.length;
    if (speedup < 1.05) {
      return '1x';
    }
    // One decimal, because the honest figures are small and rounding 1.4 to 1
    // would understate as badly as the buckets overstated.
    return `${speedup.toFixed(1)}x`;
  }

  /**
   * Rounds of nodes that may run concurrently.
   *
   * Grouped by depth in the dependency graph: a node's round is one past the
   * deepest node it hard-depends on, so two nodes share a round exactly when
   * neither can reach the other. Soft dependencies are advisory and do not
   * block, so they do not affect depth.
   *
   * This replaced grouping by identical hard-dependency signature, which was
   * sufficient but not necessary and under-reported badly. Step 2 of technique
   * A depends on A's step 1 and step 2 of B on B's step 1, so their signatures
   * differed and they never shared a round even though the techniques are
   * independent. A four-technique plan reported `maxParallelism: 4` and then
   * placed all twenty remaining nodes in groups of one — only the first round
   * was ever parallel, and the metadata contradicted itself (#308).
   *
   * The invariant #327 established still holds, and now holds by construction
   * rather than by a post-hoc split: two steps of one technique are always
   * chained, so one is always deeper than the other and they cannot land in the
   * same round.
   */
  private static findParallelizableGroups(nodes: ExecutionGraphNode[]): string[][] {
    const byId = new Map(nodes.map(node => [node.id, node]));
    const depth = new Map<string, number>();

    // Memoised longest-path depth, iterative rather than recursive: a plan can
    // carry hundreds of nodes and this runs on every planning call.
    const onStack = new Set<string>();
    const depthOf = (start: ExecutionGraphNode): number => {
      const stack: ExecutionGraphNode[] = [start];
      onStack.add(start.id);
      while (stack.length > 0) {
        const node = stack[stack.length - 1];
        if (depth.has(node.id)) {
          stack.pop();
          onStack.delete(node.id);
          continue;
        }
        let deepest = -1;
        let waiting = false;
        for (const dep of node.dependencies) {
          // Soft dependencies count here, unlike in the old signature grouping.
          // They are non-blocking for EXECUTION — a caller need not wait — but
          // they are still ordering constraints, and a round is an ordering.
          //
          // Skipping them put the terminal node in the wrong round. It carries
          // `nextStepNeeded: false`, ends the session, and takes a soft
          // dependency on every technique's final node so it lands last. With
          // soft edges ignored its depth came only from its own predecessor, so
          // a plan of six_hats (7 steps) then po (4) scheduled the
          // session-ending node in round 3 with three six_hats nodes in rounds
          // 4-6 — telling a caller to end the session and then send more steps
          // to it.
          const parent = byId.get(dep.nodeId);
          // A dependency on a node outside this graph cannot be scheduled
          // against, so it does not constrain the round.
          if (!parent) continue;
          // A dependency already being resolved further down the stack means a
          // cycle. `getDependencies` only ever points at a lower index so this
          // is unreachable today, but without the check the stack would grow
          // without bound and hang the planning call — a worse failure than any
          // wrong round, and one no caller could recover from.
          if (onStack.has(parent.id)) continue;
          const known = depth.get(parent.id);
          if (known === undefined) {
            stack.push(parent);
            onStack.add(parent.id);
            waiting = true;
          } else if (known > deepest) {
            deepest = known;
          }
        }
        if (waiting) continue;
        depth.set(node.id, deepest + 1);
        stack.pop();
        onStack.delete(node.id);
      }
      return depth.get(start.id) ?? 0;
    };

    const rounds = new Map<number, string[]>();
    for (const node of nodes) {
      const level = depthOf(node);
      const round = rounds.get(level);
      if (round) {
        round.push(node.id);
      } else {
        rounds.set(level, [node.id]);
      }
    }

    return [...rounds.entries()].sort((a, b) => a[0] - b[0]).map(([, ids]) => ids);
  }

  /**
   * Find the critical path through the graph
   */
  private static findCriticalPath(nodes: ExecutionGraphNode[]): string[] {
    if (nodes.length === 0) return [];

    // Build adjacency list (considering only hard dependencies for critical path)
    const graph = new Map<string, string[]>();
    const startNodes: ExecutionGraphNode[] = [];

    for (const node of nodes) {
      if (!graph.has(node.id)) {
        graph.set(node.id, []);
      }

      // Check for hard dependencies in a single pass
      let hasHardDeps = false;
      for (const dep of node.dependencies) {
        if (dep.type === 'hard') {
          hasHardDeps = true;
          if (!graph.has(dep.nodeId)) {
            graph.set(dep.nodeId, []);
          }
          graph.get(dep.nodeId)?.push(node.id);
        }
      }

      // Track start nodes while iterating
      if (!hasHardDeps) {
        startNodes.push(node);
      }
    }

    if (startNodes.length === 0) return [];

    // Find longest path from each start node
    let longestPath: string[] = [];
    for (const start of startNodes) {
      const path = this.dfs(start.id, graph, new Set());
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    }

    return longestPath;
  }

  /**
   * Depth-first search to find longest path
   */
  private static dfs(nodeId: string, graph: Map<string, string[]>, visited: Set<string>): string[] {
    if (visited.has(nodeId)) return [];

    visited.add(nodeId);
    const neighbors = graph.get(nodeId) || [];

    let longestSubpath: string[] = [];
    for (const neighbor of neighbors) {
      const subpath = this.dfs(neighbor, graph, new Set(visited));
      if (subpath.length > longestSubpath.length) {
        longestSubpath = subpath;
      }
    }

    return [nodeId, ...longestSubpath];
  }

  /**
   * Generate instructions for the invoker
   */
  private static generateInstructions(
    nodes: ExecutionGraphNode[],
    metadata: {
      maxParallelism: number;
      sequentialTimeMultiplier: string;
      parallelizableGroups: string[][];
      criticalPath: string[];
    }
  ) {
    const hasParallelNodes = metadata.maxParallelism > 1;

    // Determine recommended strategy
    let recommendedStrategy: 'sequential' | 'parallel' | 'hybrid';
    if (!hasParallelNodes) {
      recommendedStrategy = 'sequential';
    } else if (metadata.maxParallelism >= 4) {
      recommendedStrategy = 'parallel';
    } else {
      recommendedStrategy = 'hybrid';
    }

    // Identify sync points (between technique boundaries)
    const syncPoints = this.identifySyncPoints(nodes);

    // Generate parallelization benefits description
    const parallelizationBenefits = this.generateParallelizationBenefits(nodes, metadata);

    // Generate execution guidance
    const terminalNote =
      ' The final node carries nextStepNeeded: false and ends the session - execute it only after every other node has completed.';

    // The condition that makes this schedule safe travels with the schedule.
    // Measured: two concurrent executions naming ONE sessionId lose a step,
    // five runs out of five, because each process loads the session, appends
    // its own step and writes the whole thing back. The same two executions
    // under distinct sessionIds lose nothing. Saying so only in the project
    // docs left the graph handing out a schedule whose safety condition the
    // caller had no way to read (#308).
    const sessionNote = hasParallelNodes
      ? ' Run each branch under its own sessionId: concurrent steps naming the same sessionId are last-writer-wins and silently drop work.'
      : '';

    // Only describe soft dependencies when the graph actually contains some.
    // Chaining every technique removed the last producer of them, and the
    // guidance went on explaining how to treat a kind of edge no plan emits —
    // the same shape of untrue statement this change is removing elsewhere.
    const hasSoftDeps = nodes.some(node => node.dependencies.some(dep => dep.type === 'soft'));
    const softNote = hasSoftDeps
      ? ' Soft dependencies are preferential - better results if completed first, but not blocking.'
      : '';

    const executionGuidance =
      (hasParallelNodes
        ? 'Nodes with empty dependencies can execute immediately. For nodes with dependencies, wait for hard dependencies to complete before starting.' +
          softNote +
          ' Check the dependencies array for each node to determine execution order.'
        : 'Execute nodes sequentially in the order provided. Each node depends on the previous one completing.') +
      sessionNote +
      terminalNote;

    return {
      recommendedStrategy,
      syncPoints,
      sequentialTimeMultiplier: metadata.sequentialTimeMultiplier,
      parallelizationBenefits,
      executionGuidance,
      errorHandling: 'continue-on-non-critical-failure',
    };
  }

  /**
   * Identify sync points between techniques
   */
  private static identifySyncPoints(nodes: ExecutionGraphNode[]): string[] {
    const syncPoints: string[] = [];
    let lastTechnique: LateralTechnique | null = null;

    for (const node of nodes) {
      if (lastTechnique && lastTechnique !== node.technique) {
        // Sync point at technique boundary
        syncPoints.push(node.id);
      }
      lastTechnique = node.technique;
    }

    // The terminal node is always a sync point: it carries the session-ending
    // nextStepNeeded: false and must run after everything else.
    const lastNode = nodes[nodes.length - 1];
    if (lastNode && !syncPoints.includes(lastNode.id)) {
      syncPoints.push(lastNode.id);
    }

    return syncPoints;
  }

  /**
   * Generate description of parallelization benefits
   */
  private static generateParallelizationBenefits(
    nodes: ExecutionGraphNode[],
    metadata: {
      maxParallelism: number;
      parallelizableGroups: string[][];
      sequentialTimeMultiplier: string;
    }
  ): string {
    if (metadata.maxParallelism <= 1) {
      return 'Sequential execution ensures each step builds on previous insights for maximum coherence.';
    }

    const techniqueCount = new Set(nodes.map(n => n.technique)).size;

    // The per-technique strings that were here promised parallel Six Hats,
    // parallel SCAMPER and parallel Nine Windows — the steps of ONE technique
    // running at once, which the graph no longer offers because those steps
    // share a session. What is parallel is techniques against each other.
    //
    // The speedup cites `sequentialTimeMultiplier` rather than computing a
    // second figure from `maxParallelism`. Those were two different numbers
    // for one quantity in one response: a plan reporting "10x" in metadata
    // said "approximately 7x" here.
    if (techniqueCount > 1) {
      // The multiplier assumes every node in a round runs at once. Say so:
      // with 32 techniques the figure is 17.1x, which is true of the schedule
      // and false of a client running three branches at a time (3.0x). The
      // `maxParallelism` INPUT that expresses client capability never reaches
      // this generator, so the number cannot account for it and should not
      // pretend to.
      return `Running ${techniqueCount} techniques concurrently explores different approaches at the same time, cutting wall-clock time by roughly ${metadata.sequentialTimeMultiplier} versus running them end to end — assuming you run a whole round at once; less if you cap concurrency below ${metadata.maxParallelism}. Steps within a technique stay ordered.`;
    }

    return 'Independent techniques can run concurrently; the steps within each stay ordered, so a single-technique plan runs end to end.';
  }

  /**
   * Determine if a step can be skipped if it fails
   */
  private static canSkipIfFailed(technique: LateralTechnique): boolean {
    // Techniques whose steps are independent perspectives on one problem, so
    // losing one does not invalidate the rest. A separate question from
    // whether they may run CONCURRENTLY, which they may not — they share a
    // session, and concurrent writes there are last-writer-wins. These three
    // used to answer both questions from one list.
    const independentPerspectiveTechniques: LateralTechnique[] = [
      'six_hats',
      'scamper',
      'nine_windows',
    ];

    return independentPerspectiveTechniques.includes(technique);
  }
}
