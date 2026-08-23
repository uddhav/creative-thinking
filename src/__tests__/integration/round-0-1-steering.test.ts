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
      expect(['fit', 'quality-fill', 'wildcard']).toContain(rec.scoreProvenance);
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
