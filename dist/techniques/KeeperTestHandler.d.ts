/**
 * Keeper Test technique handler
 *
 * A 5-step re-decision for something already in place — a role, a task group, a
 * library, a subscription, a meeting. It replaces the elimination question
 * ("has this failed badly enough to remove?") with the acquisition question
 * ("if it weren't already here, would I take it on today, at today's price?"),
 * which moves the burden of proof onto retention rather than removal.
 *
 * Distinct from cognitive_bias_audit, which diagnoses the distortions acting on
 * a decider. This produces a verdict on an asset, and still produces one when
 * there is no bias to find: a maintainer with no attachment to an inherited
 * library reaches "replace" here via the fence reconstruction and the
 * recurring-versus-one-time cost split, while a bias audit finds nothing.
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class KeeperTestHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Reports what the session actually recorded, labelled by step.
     *
     * Diverges from sibling handlers in one place: the final step is reported
     * whole rather than truncated to its first sentence. That step's output is
     * the verdict, its owner, and the tripwire — truncating it would discard the
     * two things that make the decision hold.
     */
    extractInsights(history: Array<{
        output?: string;
    }>): string[];
}
//# sourceMappingURL=KeeperTestHandler.d.ts.map