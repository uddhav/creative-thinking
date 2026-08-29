/**
 * The plan's executionGraph parameters ARE the contract: a caller that
 * executes each node's parameters verbatim (filling only `output` and
 * threading `sessionId`) must complete the session exactly once, at the
 * plan-wide final node.
 *
 * The graph used to put nextStepNeeded: false on the final node of EVERY
 * technique (it was computed from technique-local step counts), while the
 * executor treats false as "finalize the session" — so following the graph
 * literally finalized and then blocked the session at every technique
 * boundary, and the finalization (endTime, completion telemetry) had already
 * fired before the gatekeeper vetoed it.
 *
 * retry is disabled for this suite: these are kill-checked guards, and the
 * global retry: 2 (vitest.config.ts) would let a flaky pass mask exactly the
 * regression this file exists to catch.
 */
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

interface GraphNode {
  id: string;
  stepNumber: number;
  technique: string;
  parameters: {
    planId: string;
    technique: string;
    problem: string;
    currentStep: number;
    totalSteps: number;
    output: string;
    nextStepNeeded: boolean;
    [key: string]: unknown;
  };
  dependencies: Array<{ nodeId: string; type: string }>;
}

const PROBLEM = 'Reduce onboarding time for new engineers';

async function planWithGraph(
  client: MCPClientTestHelper,
  techniques: string[]
): Promise<GraphNode[]> {
  const plan = await client.planThinkingSession(PROBLEM, techniques);
  const graph = (plan as Record<string, unknown>).executionGraph as
    { nodes: GraphNode[] } | undefined;
  expect(graph, 'plan response must carry executionGraph').toBeDefined();
  expect(graph?.nodes.length).toBeGreaterThan(0);
  return graph?.nodes ?? [];
}

describe('executionGraph parameters run verbatim', { retry: 0 }, () => {
  const client = new MCPClientTestHelper();
  // The defense case below probes the PERSISTED completion status via the
  // session list, which reads only from a persistence adapter.
  const persistencePath = mkdtempSync(path.join(tmpdir(), 'ct-graph-verbatim-'));

  beforeAll(async () => {
    await client.connect({
      env: {
        ...(process.env as Record<string, string>),
        PERSISTENCE_TYPE: 'filesystem',
        PERSISTENCE_PATH: persistencePath,
      },
    });
  });

  afterAll(async () => {
    await client.disconnect();
    rmSync(persistencePath, { recursive: true, force: true });
  });

  it('emits exactly one terminal nextStepNeeded: false, on the plan-wide last node', async () => {
    const nodes = await planWithGraph(client, ['triz', 'six_hats']);
    const terminals = nodes.filter(n => n.parameters.nextStepNeeded === false);
    expect(terminals).toHaveLength(1);
    expect(terminals[0].id).toBe(nodes[nodes.length - 1].id);
  });

  it('executing every node verbatim completes the session once, at the end', async () => {
    const nodes = await planWithGraph(client, ['triz', 'six_hats']);
    let sessionId: string | undefined;

    // Technique-native risk fields only — never the legacy `risks` /
    // `antifragileProperties` arrays. The final summary's counters must still
    // see them (they used to read only the legacy fields and reported 0
    // after a fully populated red-team session).
    const riskFieldsByIndex: Record<number, Record<string, unknown>> = {
      1: { failureModes: ['Single point of failure', 'Schedule slip'] },
      2: {
        timelineProjections: { blackSwanScenarios: ['Key dependency vanishes'] },
        temporalEscapeRoutes: ['Defer the decision', 'Refundable commitments'],
      },
    };

    for (const [index, node] of nodes.entries()) {
      const data = await client.executeThinkingStep({
        ...node.parameters,
        output: `Step ${node.stepNumber}: working ${PROBLEM} from the ${node.technique} angle`,
        ...(riskFieldsByIndex[index] ?? {}),
        ...(sessionId ? { sessionId } : {}),
      });
      sessionId = data.sessionId;

      const record = data as Record<string, unknown>;
      if (index === 0) {
        // stepCompleteness was retired: a 0.5-floored field-presence number
        // with no consumer. The honest fields stay.
        const meta = record.executionMetadata as Record<string, unknown> | undefined;
        expect(meta, 'executionMetadata must be present').toBeDefined();
        expect(meta?.stepCompleteness).toBeUndefined();
        expect(meta?.flexibilityImpact).toBeDefined();
      }
      if (index < nodes.length - 1) {
        expect(record.blocked, `node ${node.id} must not be blocked`).toBeUndefined();
        expect(
          record.sessionComplete,
          `node ${node.id} must not complete the session`
        ).toBeUndefined();
      } else {
        expect(record.sessionComplete).toBe(true);
        expect(record.completed).toBe(true);

        const summary = record.summary as Record<string, unknown> | undefined;
        const metrics = record.metrics as Record<string, unknown> | undefined;
        expect(summary?.risksCaught, 'technique-native risk fields must be counted').toBe(3);
        expect(
          metrics?.antifragileFeatures,
          'technique-native antifragile fields must be counted'
        ).toBe(2);
      }
    }
  });

  it('a vetoed mid-technique termination blocks without finalizing the session', async () => {
    const nodes = await planWithGraph(client, ['triz']);
    const planId = nodes[0].parameters.planId;

    const first = await client.executeThinkingStep({
      planId,
      technique: 'triz',
      problem: PROBLEM,
      currentStep: 1,
      totalSteps: 4,
      output: 'Identifying the contradiction',
      nextStepNeeded: true,
      autoSave: true,
    });
    const sessionId = first.sessionId;

    const blocked = (await client.executeThinkingStep({
      planId,
      technique: 'triz',
      problem: PROBLEM,
      currentStep: 2,
      totalSteps: 4,
      output: 'Stopping early',
      nextStepNeeded: false,
      sessionId,
      autoSave: true,
    })) as Record<string, unknown>;

    expect(blocked.blocked, 'early termination must be blocked').toBe(true);
    expect(blocked.sessionComplete).toBeUndefined();

    // Continue as the veto instructs. If the veto had already finalized the
    // session in memory, this allowed step's auto-save would write the stale
    // endTime to disk — which is exactly the leak being guarded against.
    await client.executeThinkingStep({
      planId,
      technique: 'triz',
      problem: PROBLEM,
      currentStep: 2,
      totalSteps: 4,
      output: 'Continuing after the veto',
      nextStepNeeded: true,
      sessionId,
      autoSave: true,
    });

    // The veto must arrive before any completion side effect: a session whose
    // termination was refused must not be persisted as completed.
    const listResult = await client.callTool('execute_thinking_step', {
      sessionOperation: 'list',
    });
    const parsed = JSON.parse((listResult.content[0] as { text: string }).text) as {
      result?: { sessions?: Array<{ id: string; complete: boolean }> };
    };
    const entry = parsed.result?.sessions?.find(s => s.id === sessionId);
    expect(entry, 'session must appear in the session list').toBeDefined();
    expect(entry?.complete, 'a vetoed termination must not mark the session complete').toBe(false);
  });
});
