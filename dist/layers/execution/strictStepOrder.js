import { SessionCompletionTracker } from '../../core/session/SessionCompletionTracker.js';
import { ErrorFactory } from '../../errors/enhanced-errors.js';
import { stepOrderIsStrict } from '../../config/StepOrderEnforcement.js';
import { assignedStimuliFor, describeNumberingMismatch, } from './advisoryGates.js';
import { guidanceContext } from './ExecutionResponseBuilder.js';
// Stateless apart from its thresholds; one instance per module is enough.
const completionTracker = new SessionCompletionTracker();
/**
 * Throws an E211 `WorkflowError` when strict mode is on and the step is out of
 * order, contradictorily numbered, or carries an unassigned stimulus. Returns
 * normally otherwise. A session without a plan has no order to enforce.
 */
export function refuseIfStrict(args) {
    const { input, session, plan, handler, techniqueLocalStep, techniqueIndex, stepsBeforeThisTechnique, numberingMismatch, techniqueInstance, } = args;
    if (!plan || !stepOrderIsStrict(plan))
        return;
    // For a repeated technique the validator resolves a technique-local number
    // to the FIRST occurrence, so `techniqueIndex` and `stepsBeforeThisTechnique`
    // describe run 1 whatever run the step belongs to. The refusal must use the
    // run the step will be stamped with: the progress it judges against and the
    // plan-wide resend form both come from that occurrence's block. Measured
    // before this: run 2 step 2 of ['po','six_hats','po'] was named as 2/15
    // (run 1's range) instead of 13/15, and a caller who followed that form
    // recorded a run-1 duplicate and was refused again, forever.
    let runIndex = techniqueIndex;
    let stepsBefore = stepsBeforeThisTechnique;
    if (techniqueInstance !== undefined) {
        const occurrences = plan.workflow
            .map((w, i) => ({ technique: w.technique, index: i }))
            .filter(w => w.technique === input.technique);
        const occurrence = occurrences[techniqueInstance];
        if (occurrence) {
            runIndex = occurrence.index;
            stepsBefore = plan.workflow
                .slice(0, occurrence.index)
                .reduce((sum, w) => sum + w.steps.length, 0);
        }
    }
    const techniqueSteps = plan.workflow[runIndex]?.steps.length ?? 0;
    const planTotal = plan.workflow.reduce((sum, w) => sum + w.steps.length, 0);
    const forms = (step) => ({
        localForm: `currentStep ${step} with totalSteps ${techniqueSteps}`,
        planForm: `currentStep ${step + stepsBefore} with totalSteps ${planTotal}`,
    });
    if (numberingMismatch) {
        const { localForm, planForm } = forms(techniqueLocalStep);
        throw ErrorFactory.numberingRefused(input.technique, techniqueLocalStep, describeNumberingMismatch(input.technique, techniqueLocalStep, numberingMismatch), localForm, planForm);
    }
    const { completedStepNumbers } = completionTracker.techniqueLocalProgress(session, plan, input.technique, runIndex, techniqueInstance);
    for (let step = 1; step < techniqueLocalStep; step++) {
        if (completedStepNumbers.has(step))
            continue;
        const { localForm, planForm } = forms(step);
        throw ErrorFactory.stepOutOfOrder(input.technique, techniqueLocalStep, step, localForm, planForm, handler.getStepGuidance(step, input.problem, guidanceContext(input)));
    }
    // Same predicate as the advisory gate: structured equality against every
    // instance's assignment, silent when the field is absent.
    const sent = input.technique === 'po' ? input.provocation : input.randomStimulus;
    if (typeof sent === 'string' && sent.length > 0) {
        const assigned = assignedStimuliFor(plan, input.technique);
        if (assigned.length > 0 && !assigned.includes(sent)) {
            throw ErrorFactory.stimulusRefused(input.technique, techniqueLocalStep, input.technique === 'po' ? 'provocation' : 'randomStimulus', sent, assigned);
        }
    }
}
//# sourceMappingURL=strictStepOrder.js.map