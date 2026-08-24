/**
 * Round 0+1 steering surfaces, asserted through the surface the caller uses —
 * a real MCP client driving the BUILT server (dist/), not layer functions.
 * Three prior caller-surface defects (isError dropped, debate mode stripped,
 * session ops refused) all passed unit guards below the fault; this file
 * exists so these fields cannot silently vanish the same way.
 *
 * Covers: P2 provenance (evidenceBreadth, scoreProvenance, scoreBreakdown),
 * P3 assigned stimulus (plan carries it, guidance names it, mismatch gate),
 * P1 advisory findings (field gate true positive/negative, validator-warning
 * surfacing, echo of the gated field), strictness echo.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MCPClientTestHelper } from '../utils/MCPClientTestHelper.js';

interface FlatWorkflowStep {
  technique: string;
  stepNumber: number;
  description: string;
  stimulus?: string;
  stimulusSource?: string;
}

interface AdvisoryFindingShape {
  gate: string;
  technique: string;
  step: number;
  message: string;
  severity: string;
}

describe('round 0+1 steering surfaces (via MCP client)', () => {
  let client: MCPClientTestHelper;

  beforeAll(async () => {
    client = new MCPClientTestHelper();
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('discovery surfaces evidenceBreadth and per-recommendation provenance', async () => {
    const res = await client.discoverTechniques(
      'Our weekly team retrospective produces the same three complaints and no new ideas'
    );
    expect(typeof res.evidenceBreadth).toBe('number');

    const recs = res.recommendations as Array<Record<string, unknown>>;
    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      expect(['fit', 'quality-fill', 'wildcard', 'crux']).toContain(rec.scoreProvenance);
    }
    // Scored entries carry the four-factor breakdown; quality fillers carry
    // none — their effectiveness never passed through the scorer, and the
    // absence of a breakdown is the honest report of that.
    for (const rec of recs) {
      if (rec.scoreProvenance === 'fit') {
        const breakdown = rec.scoreBreakdown as Record<string, number>;
        expect(breakdown).toBeDefined();
        for (const key of [
          'categoryFit',
          'complexityMatch',
          'constraintCompatibility',
          'outcomeAlignment',
        ]) {
          expect(typeof breakdown[key]).toBe('number');
        }
      }
      if (rec.scoreProvenance === 'quality-fill') {
        expect(rec.scoreBreakdown).toBeUndefined();
      }
    }
  });

  it('plan assigns a stimulus to random_entry, names it in the description, and echoes strictness', async () => {
    const result = await client.callTool('plan_thinking_session', {
      problem: 'Our onboarding email sequence converts nobody',
      techniques: ['random_entry'],
      strictness: 'advisory',
    });
    const parsed = MCPClientTestHelper.parseToolResult(result) as {
      strictness?: string;
      workflow: FlatWorkflowStep[];
    };
    expect(parsed.strictness).toBe('advisory');

    const assigned = parsed.workflow.find(s => s.technique === 'random_entry' && s.stimulus);
    expect(assigned).toBeDefined();
    expect(assigned?.stimulusSource).toBe('assigned');
    // The prose path must carry the value too, or prose-only callers never see it.
    expect(assigned?.description).toContain(assigned?.stimulus as string);
  });

  it('a stimulus field that contradicts the assignment draws a mismatch finding; the assigned value draws none', async () => {
    const plan = await client.planThinkingSession('Our onboarding email sequence converts nobody', [
      'random_entry',
    ]);
    const planWorkflow = (plan as unknown as { workflow: FlatWorkflowStep[] }).workflow;
    const assignedValue = planWorkflow.find(s => s.stimulus)?.stimulus as string;
    expect(assignedValue).toBeTruthy();

    const contradicting = await client.executeThinkingStep({
      planId: plan.planId,
      technique: 'random_entry',
      problem: 'Our onboarding email sequence converts nobody',
      currentStep: 1,
      totalSteps: 3,
      output: 'Choosing my own word instead.',
      nextStepNeeded: true,
      randomStimulus: 'a-word-the-plan-never-assigned',
    });
    const mismatch = (contradicting.advisoryFindings as AdvisoryFindingShape[] | undefined)?.find(
      f => f.gate === 'stimulus.mismatch'
    );
    expect(mismatch).toBeDefined();
    expect(mismatch?.severity).toBe('advisory');
    expect(mismatch?.message).toContain(assignedValue);

    const compliant = await client.executeThinkingStep({
      planId: plan.planId,
      technique: 'random_entry',
      problem: 'Our onboarding email sequence converts nobody',
      currentStep: 1,
      totalSteps: 3,
      output: `Working with the assigned stimulus: ${assignedValue}.`,
      nextStepNeeded: true,
      randomStimulus: assignedValue,
    });
    const compliantFindings = compliant.advisoryFindings as AdvisoryFindingShape[] | undefined;
    expect(compliantFindings?.find(f => f.gate === 'stimulus.mismatch')).toBeUndefined();
  });

  it('steelman step 5 without failureModes draws the field-gate finding; with them it draws none and echoes the field', async () => {
    const problem = 'Proposal: replace the on-call rotation with a follow-the-sun model';
    const plan = await client.planThinkingSession(problem, ['steelman_red_team']);

    let sessionId: string | undefined;
    for (let step = 1; step <= 4; step++) {
      const res = await client.executeThinkingStep({
        planId: plan.planId,
        technique: 'steelman_red_team',
        problem,
        currentStep: step,
        totalSteps: 7,
        output: `Step ${step} content for the steelman exercise.`,
        nextStepNeeded: true,
        ...(sessionId && { sessionId }),
      });
      sessionId = res.sessionId;
    }

    const bare = await client.executeThinkingStep({
      planId: plan.planId,
      technique: 'steelman_red_team',
      problem,
      currentStep: 5,
      totalSteps: 7,
      output: 'The attack: exploit the handoff gap between regions during incidents.',
      nextStepNeeded: true,
      sessionId,
    });
    const gateFinding = (bare.advisoryFindings as AdvisoryFindingShape[] | undefined)?.find(
      f => f.gate === 'fields.steelman_red_team.step5'
    );
    expect(gateFinding).toBeDefined();
    expect(gateFinding?.severity).toBe('advisory');
    // Advisory means advisory: the step was accepted, not bounced.
    expect(bare.currentStep).toBe(5);

    const withModes = await client.executeThinkingStep({
      planId: plan.planId,
      technique: 'steelman_red_team',
      problem,
      currentStep: 5,
      totalSteps: 7,
      output: 'The attack, with its failure modes recorded as data this time.',
      nextStepNeeded: true,
      sessionId,
      failureModes: ['handoff gap drops incident context between regions'],
    });
    const findings = withModes.advisoryFindings as AdvisoryFindingShape[] | undefined;
    expect(findings?.find(f => f.gate === 'fields.steelman_red_team.step5')).toBeUndefined();
    // The gated field must be echoed, or the caller cannot see what the gate saw.
    expect(withModes.failureModes).toEqual(['handoff gap drops incident context between regions']);
  });

  it('a declared crux surfaces its techniques past keyword categorization and is echoed', async () => {
    // A deliberately bland problem whose vocabulary suggests nothing
    // adversarial — without the crux, keyword categorization has no reason to
    // pick steelman_red_team.
    const result = await client.callTool('discover_techniques', {
      problem: 'Plan the quarterly notebook restock for the studio',
      crux: 'contested',
    });
    const parsed = MCPClientTestHelper.parseToolResult(result) as {
      crux?: string;
      cruxDeclared?: boolean;
      recommendations: Array<{ technique: string; scoreProvenance?: string }>;
    };
    expect(parsed.crux).toBe('contested');
    expect(parsed.cruxDeclared).toBe(true);
    const techniques = parsed.recommendations.map(r => r.technique);
    expect(techniques).toContain('steelman_red_team');
    // An injected candidate declares HOW it entered the set — 'crux', not
    // 'fit' — so declaration-driven selection is distinguishable from
    // vocabulary-driven selection (and P6 can key priors on it).
    const injected = parsed.recommendations.find(r => r.technique === 'steelman_red_team');
    expect(injected?.scoreProvenance).toBe('crux');
  });

  it('a declared crux survives truncation on a keyword-rich problem', async () => {
    // The organic entries out-score injected ones here, and the old slice
    // removed every crux technique while the response still reported
    // cruxDeclared: true — honoring the declaration nowhere.
    const result = await client.callTool('discover_techniques', {
      problem:
        'How do we verify and validate the hypothesis that our data analysis conclusions are evidence-based and statistically sound',
      preferredOutcome: 'analytical',
      crux: 'path',
    });
    const parsed = MCPClientTestHelper.parseToolResult(result) as {
      cruxDeclared?: boolean;
      recommendations: Array<{ technique: string; scoreProvenance?: string }>;
    };
    expect(parsed.cruxDeclared).toBe(true);
    const injected = parsed.recommendations.filter(r => r.scoreProvenance === 'crux');
    expect(injected.length).toBeGreaterThan(0);
  });

  it('caller-supplied advisoryFindings never reach the server-authored record', async () => {
    // Asserted against the PERSISTED record, not the echo: the response only
    // ever carries what the gates produced, so a forgery shows up on disk —
    // exactly where the follow-vs-deviate audit reads from.
    const persistDir = mkdtempSync(path.join(tmpdir(), 'ct-forgery-'));
    const persistClient = new MCPClientTestHelper();
    await persistClient.connect({
      env: {
        ...process.env,
        PERSISTENCE_TYPE: 'filesystem',
        PERSISTENCE_PATH: persistDir,
      } as Record<string, string>,
    });
    try {
      const problem = 'Our release notes are written the morning of the release';
      const plan = await persistClient.planThinkingSession(problem, ['six_hats']);
      const res = await persistClient.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem,
        currentStep: 1,
        totalSteps: 7,
        output: 'Blue hat framing.',
        nextStepNeeded: true,
        hatColor: 'blue',
        autoSave: true,
        advisoryFindings: [
          {
            gate: 'forged.by.caller',
            technique: 'six_hats',
            step: 1,
            message: 'not from the server',
            severity: 'advisory',
          },
        ],
      });
      const echoed = (res.advisoryFindings as Array<{ gate: string }> | undefined) ?? [];
      expect(echoed.some(f => f.gate === 'forged.by.caller')).toBe(false);

      const sessionsDir = path.join(persistDir, 'sessions');
      const files = readdirSync(sessionsDir);
      expect(files.length).toBeGreaterThan(0);
      const persisted = readFileSync(path.join(sessionsDir, files[0]), 'utf8');
      expect(persisted).not.toContain('forged.by.caller');
    } finally {
      await persistClient.disconnect();
    }
  });

  it("strictness 'enforcing' is echoed but warned about, since it is not implemented", async () => {
    const result = await client.callTool('plan_thinking_session', {
      problem: 'Should we adopt trunk-based development',
      techniques: ['six_hats'],
      strictness: 'enforcing',
    });
    const parsed = MCPClientTestHelper.parseToolResult(result) as {
      strictness?: string;
      warnings?: string[];
    };
    expect(parsed.strictness).toBe('enforcing');
    // Echoing a reserved level with no warning is the silent-degrade the crux
    // validator's own comment says the design prevents.
    expect((parsed.warnings ?? []).join(' ')).toMatch(/enforcing/i);
  });

  it('no crux reports cruxDeclared false; an invalid crux is refused, not silently degraded', async () => {
    const bare = await client.discoverTechniques('Plan the quarterly notebook restock');
    expect(bare.cruxDeclared).toBe(false);

    // Note: the helper's callTool RESOLVES error-shaped responses (its inner
    // throw is swallowed by its own catch), so assert on the payload.
    const refused = await client.callTool('discover_techniques', {
      problem: 'Plan the quarterly notebook restock',
      crux: 'contested-decison', // typo on purpose
    });
    expect(refused.isError).toBe(true);
    const refusedPayload = MCPClientTestHelper.parseToolResult(refused) as {
      error?: { message?: string };
    };
    expect(refusedPayload.error?.message).toMatch(/crux must be one of/);
  });

  it('po carries an assigned provocation through plan, graph, and gate', async () => {
    const problem = 'Our onboarding checklist keeps growing and completion keeps falling';
    const result = await client.callTool('plan_thinking_session', {
      problem,
      techniques: ['po'],
    });
    const parsed = MCPClientTestHelper.parseToolResult(result) as {
      planId: string;
      workflow: FlatWorkflowStep[];
      executionGraph?: { nodes: Array<{ parameters: { provocation?: string } }> };
    };
    const assigned = parsed.workflow.find(s => s.technique === 'po' && s.stimulus);
    expect(assigned?.stimulusSource).toBe('assigned');
    const provocation = assigned?.stimulus as string;
    expect(provocation).toMatch(/^Po:/);

    // EVERY graph node carries the assignment — a caller executing the graph
    // verbatim must never send a value the gate then flags (the pre-fix graph
    // put guidance prose in steps 2+, a self-inflicted false mismatch).
    const nodes = parsed.executionGraph?.nodes ?? [];
    expect(nodes.length).toBeGreaterThan(1);
    for (const node of nodes) {
      expect(node.parameters.provocation).toBe(provocation);
    }

    const contradicting = await client.executeThinkingStep({
      planId: parsed.planId,
      technique: 'po',
      problem,
      currentStep: 2,
      totalSteps: 4,
      output: 'Working from a different provocation entirely.',
      nextStepNeeded: true,
      provocation: 'Po: something the plan never assigned',
    });
    const mismatch = (contradicting.advisoryFindings as AdvisoryFindingShape[] | undefined)?.find(
      f => f.gate === 'stimulus.mismatch'
    );
    expect(mismatch).toBeDefined();
    expect(mismatch?.message).toContain(provocation);

    const compliant = await client.executeThinkingStep({
      planId: parsed.planId,
      technique: 'po',
      problem,
      currentStep: 2,
      totalSteps: 4,
      output: `Movement from the assigned provocation.`,
      nextStepNeeded: true,
      provocation,
    });
    const compliantFindings = compliant.advisoryFindings as AdvisoryFindingShape[] | undefined;
    expect(compliantFindings?.find(f => f.gate === 'stimulus.mismatch')).toBeUndefined();
  });

  it('repeated technique instances draw distinct stimuli and neither draws a false mismatch under local numbering', async () => {
    const problem = 'Name the two new meeting rooms';
    const result = await client.callTool('plan_thinking_session', {
      problem,
      techniques: ['random_entry', 'six_hats', 'random_entry'],
    });
    const parsed = MCPClientTestHelper.parseToolResult(result) as {
      planId: string;
      workflow: FlatWorkflowStep[];
    };
    const assignments = parsed.workflow.filter(s => s.technique === 'random_entry' && s.stimulus);
    expect(assignments).toHaveLength(2);
    const [first, second] = assignments.map(s => s.stimulus as string);
    expect(first).not.toBe(second);

    // Technique-local numbering cannot name the instance (issue #301), so the
    // SECOND instance's own assignment must NOT draw a mismatch — the pre-fix
    // gate compared against the first instance only and told the caller to
    // abandon the value the plan itself assigned.
    const secondInstance = await client.executeThinkingStep({
      planId: parsed.planId,
      technique: 'random_entry',
      problem,
      currentStep: 1,
      totalSteps: 3,
      output: `Working with the second instance's stimulus: ${second}.`,
      nextStepNeeded: true,
      randomStimulus: second,
    });
    const findings = secondInstance.advisoryFindings as AdvisoryFindingShape[] | undefined;
    expect(findings?.find(f => f.gate === 'stimulus.mismatch')).toBeUndefined();
    // Guidance must not steer this caller onto the first instance's value.
    expect((secondInstance.nextStepGuidance as string | undefined) ?? '').toContain(second);

    // A value the plan assigned NOWHERE still draws the finding, listing both.
    const foreign = await client.executeThinkingStep({
      planId: parsed.planId,
      technique: 'random_entry',
      problem,
      currentStep: 1,
      totalSteps: 3,
      output: 'Choosing my own word.',
      nextStepNeeded: true,
      randomStimulus: 'a-value-assigned-nowhere',
    });
    const mismatch = (foreign.advisoryFindings as AdvisoryFindingShape[] | undefined)?.find(
      f => f.gate === 'stimulus.mismatch'
    );
    expect(mismatch).toBeDefined();
    expect(mismatch?.message).toContain(first);
    expect(mismatch?.message).toContain(second);
  });

  it('advisory findings survive minimal verbosity', async () => {
    const problem = 'Proposal: consolidate the three staging environments into one';
    const plan = await client.planThinkingSession(problem, ['steelman_red_team']);
    let sessionId: string | undefined;
    for (let step = 1; step <= 4; step++) {
      const res = await client.executeThinkingStep({
        planId: plan.planId,
        technique: 'steelman_red_team',
        problem,
        currentStep: step,
        totalSteps: 7,
        output: `Step ${step}.`,
        nextStepNeeded: true,
        ...(sessionId && { sessionId }),
      });
      sessionId = res.sessionId;
    }
    // Minimal mode slims to MINIMAL_RESPONSE_KEEP_KEYS; findings attach past
    // that filter by the same sanctioned mechanism as the autoSave fields.
    // This is the regression a refactor moving the attach into buildResponse
    // would reintroduce silently (design ledger entry 18).
    const minimal = await client.executeThinkingStep({
      planId: plan.planId,
      technique: 'steelman_red_team',
      problem,
      currentStep: 5,
      totalSteps: 7,
      output: 'The attack, without failure modes recorded.',
      nextStepNeeded: true,
      sessionId,
      verbosity: 'minimal',
    });
    const finding = (minimal.advisoryFindings as AdvisoryFindingShape[] | undefined)?.find(
      f => f.gate === 'fields.steelman_red_team.step5'
    );
    expect(finding).toBeDefined();
  });

  it('debate persona plans are non-empty, carry assigned stimuli, and are executable', async () => {
    const problem = 'How should we name the internal design system';
    // rich_hickey and nassim_taleb have no random_entry techniqueBias — the
    // old fallback filtered itself to the empty set, scheduling two debate
    // voices with NOTHING to execute.
    const result = await client.callTool('plan_thinking_session', {
      problem,
      techniques: ['random_entry'],
      personas: ['rich_hickey', 'nassim_taleb'],
    });
    const parsed = MCPClientTestHelper.parseToolResult(result) as {
      parallelPlans?: Array<{
        planId: string;
        techniques?: string[];
        workflow?: Array<{ technique: string; steps: FlatWorkflowStep[] }>;
      }>;
    };
    const allPlans = parsed.parallelPlans ?? [];
    expect(allPlans.length).toBeGreaterThan(0);
    // parallelPlans includes the synthesis plan (competing_hypotheses); the
    // empty-plan defect concerned the per-persona plans.
    const personaPlans = allPlans.filter(
      p => !(p.techniques ?? []).includes('competing_hypotheses')
    );
    expect(personaPlans.length).toBeGreaterThan(0);
    for (const plan of allPlans) {
      // The defect: a debate voice scheduled with NOTHING to execute.
      expect((plan.techniques ?? []).length).toBeGreaterThan(0);
    }
    for (const plan of personaPlans) {
      // Non-empty: the fallback now prefers the caller's requested techniques.
      expect(plan.techniques ?? []).toContain('random_entry');
      for (const entry of plan.workflow ?? []) {
        if (entry.technique !== 'random_entry' && entry.technique !== 'po') continue;
        const first = entry.steps?.[0];
        expect(first?.stimulusSource).toBe('assigned');
        expect(first?.description).toContain(first?.stimulus as string);
      }
    }

    // Executable: every planId the debate structure advertises must accept an
    // execute call — these were never saved, so following the response's own
    // instructions failed as a workflow-order violation.
    const personaStep = await client.executeThinkingStep({
      planId: personaPlans[0].planId,
      technique: 'random_entry',
      problem,
      currentStep: 1,
      totalSteps: 3,
      output: 'Working with the assigned stimulus as this persona.',
      nextStepNeeded: true,
    });
    expect(personaStep.sessionId).toBeTruthy();
    expect(personaStep.currentStep).toBe(1);
  });

  it('a mismatch finding is recorded on the persisted session history', async () => {
    // Dedicated client with filesystem persistence: the guard is about the
    // DURABLE record (follow-vs-deviate must be auditable after the fact),
    // and the MCP export echo truncates long fields, so the session file on
    // disk is the honest assertion surface.
    const persistDir = mkdtempSync(path.join(tmpdir(), 'ct-advisory-persist-'));
    const persistClient = new MCPClientTestHelper();
    await persistClient.connect({
      env: {
        ...process.env,
        PERSISTENCE_TYPE: 'filesystem',
        PERSISTENCE_PATH: persistDir,
      } as Record<string, string>,
    });
    try {
      const problem = 'Our sprint demos have become status meetings';
      const plan = await persistClient.planThinkingSession(problem, ['random_entry']);
      const step = await persistClient.executeThinkingStep({
        planId: plan.planId,
        technique: 'random_entry',
        problem,
        currentStep: 1,
        totalSteps: 3,
        output: 'Own word.',
        nextStepNeeded: true,
        randomStimulus: 'never-assigned-anywhere',
        autoSave: true,
      });
      expect(
        (step.advisoryFindings as AdvisoryFindingShape[] | undefined)?.find(
          f => f.gate === 'stimulus.mismatch'
        )
      ).toBeDefined();

      const sessionsDir = path.join(persistDir, 'sessions');
      const files = readdirSync(sessionsDir);
      expect(files.length).toBeGreaterThan(0);
      const persisted = readFileSync(path.join(sessionsDir, files[0]), 'utf8');
      expect(persisted).toContain('stimulus.mismatch');

      // Export returns everything WHOLE — the optimizer's string cap was
      // truncating result.data at 1000 chars, so the finding (recorded late
      // in the entry) never survived the echo.
      const exported = await persistClient.callTool('execute_thinking_step', {
        sessionOperation: 'export',
        exportOptions: { sessionId: step.sessionId, format: 'json' },
      });
      const exportText = MCPClientTestHelper.extractTextContent(exported);
      expect(exportText).toContain('stimulus.mismatch');
      expect(exportText).not.toContain('[truncated]');
    } finally {
      await persistClient.disconnect();
    }
  });

  it('validator warnings surface as advisory findings instead of being discarded', async () => {
    const problem = 'Which architecture should the ingestion pipeline use';
    const plan = await client.planThinkingSession(problem, ['six_hats']);

    // six_hats without hatColor: the validator has warned about this for years
    // ('hatColor is recommended...') and the valid path threw the warning away.
    const res = await client.executeThinkingStep({
      planId: plan.planId,
      technique: 'six_hats',
      problem,
      currentStep: 1,
      totalSteps: 7,
      output: 'Process framing for the session.',
      nextStepNeeded: true,
    });
    const warning = (res.advisoryFindings as AdvisoryFindingShape[] | undefined)?.find(
      f => f.gate === 'validation.warning'
    );
    expect(warning).toBeDefined();
    expect(warning?.message).toContain('hatColor');
  });
});
