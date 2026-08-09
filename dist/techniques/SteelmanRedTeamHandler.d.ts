/**
 * Steelman & Red Team technique handler
 *
 * A 7-step adversarial review. The catalogue already holds plenty of criticism,
 * but all of it is first-person: what could go wrong for me (`six_hats` Black
 * Hat, `disney_method` Critic), which of my tendencies are firing
 * (`cognitive_bias_audit`), whether this evidence was planted
 * (`competing_hypotheses`). None of it asks you to occupy a position that is not
 * yours — first cooperatively, building the other side at its strongest, then
 * hostilely, from the chair of someone who wants you to fail.
 *
 * Two gates carry the technique. Step 3 refuses to proceed until a named holder
 * of the opposing view would sign your version of it, because an opponent you
 * invented is one you were always going to beat. Step 6 asks whether any finding
 * could actually have changed the decision, because a review that could not
 * overturn anything was decoration.
 *
 * Distinct from `cognitive_bias_audit`, which diagnoses the decider. Take the
 * contract consolidation onto a single observability vendor: the bias audit
 * returns the sales engineer's incentive, the all-hands announcement now being
 * defended by consistency, the vividness of the demo — a verdict that your
 * judgment is contaminated. This returns a change to the artefact: the strongest
 * case for staying multi-vendor as its proponents state it, the account team at
 * renewal holding your telemetry and knowing your switching cost, their move of
 * an uplift you cannot refuse, and the missing price-cap clause. Hand both to a
 * new hire with no stake, no announcement to defend and no vendor relationship
 * and the difference is decisive: the bias audit finds nothing and returns the
 * decision unchanged, while this still returns the clause, because the
 * adversary's leverage is a property of the contract rather than of anyone's
 * psychology.
 *
 * Distinct from `competing_hypotheses`, which asks which explanation is true and
 * ends in a posterior. Its adversary manipulates evidence about what already
 * happened; this one plans a defeat that has not happened yet.
 *
 * `disney_method`'s Critic keeps its "constructively" on purpose. It strengthens
 * a plan you already want. This one attacks a plan you already believe in.
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class SteelmanRedTeamHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Report what each step recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array. Position looks
     * equivalent and is not: `execute` appends a history entry for every call
     * including revisions, so one revision shifts every later entry and the last
     * step falls off the end — of a session reporting `completed: true`. Keying on
     * the step also means a revision supersedes the entry it revises rather than
     * reporting twice.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        output?: string;
    }>): string[];
}
//# sourceMappingURL=SteelmanRedTeamHandler.d.ts.map