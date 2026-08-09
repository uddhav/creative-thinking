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
import { BaseTechniqueHandler } from './types.js';
export class KeeperTestHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Name the Incumbent',
            focus: 'State the unit being re-decided and what a period of keeping it costs',
            emoji: '🪑',
            type: 'thinking',
        },
        {
            name: 'Reconstruct the Fence',
            focus: 'Recover why it exists, then test whether that reason is still live',
            emoji: '🚧',
            type: 'thinking',
        },
        {
            name: 'The Re-Acquisition Test',
            focus: 'Would you take it on today, at today price, against today alternatives?',
            emoji: '🛒',
            type: 'thinking',
        },
        {
            name: 'Price It Honestly',
            focus: 'Carrying, switching and opportunity cost, with sunk cost struck out',
            emoji: '🧾',
            type: 'thinking',
        },
        {
            name: 'Decide and Set the Trigger',
            focus: 'Commit to a verdict and name what forces the next re-decision',
            emoji: '📅',
            type: 'action',
            reflexiveEffects: {
                triggers: [
                    'Committing to a keep, trim, replace or drop verdict',
                    'Naming the tripwire for the next re-decision',
                ],
                realityChanges: [
                    'The verdict is on record and becomes the new incumbent',
                    'That new incumbent will defend itself at the next review',
                    'If cut, the capability is gone and its users must adapt',
                ],
                futureConstraints: [
                    'Restoring what was cut may cost more than holding it did',
                    'The stated tripwire is what reopens the question; without it, the default wins by silence',
                ],
                reversibility: 'low',
            },
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Keeper Test',
            emoji: '🛒',
            totalSteps: 5,
            description: 'Re-decides something already in place by asking whether you would take it on today, rather than whether it has failed badly enough to remove',
            focus: 'Move the burden of proof onto retention instead of removal',
            enhancedFocus: 'Separates carrying cost from switching cost, strikes out sunk cost, and ends in a verdict with a tripwire rather than an opinion',
            parallelSteps: {
                canParallelize: false,
                description: 'Sequential: the fence must be reconstructed before the re-acquisition question can be answered honestly',
            },
            reflexivityProfile: {
                primaryCommitmentType: 'strategic',
                overallReversibility: 'low',
                riskLevel: 'medium',
            },
        };
    }
    getStepInfo(step) {
        const info = this.steps[step - 1];
        if (!info) {
            return {
                name: `Step ${step}`,
                focus: 'Outside the defined sequence',
                emoji: '🛒',
                type: 'thinking',
            };
        }
        return info;
    }
    getStepGuidance(step, problem) {
        const guidance = {
            1: `🪑 **Step 1: Name the Incumbent**\n\n"${problem}" turns on something already in place, so name that something exactly. State the unit you are re-deciding — the thing that would actually stop if you said no — and draw its edges: what sits inside it, what merely touches it, and what would carry on fine without it. Pick the grain deliberately, because too coarse a unit gets defended wholesale and too fine a one lets you cut parts while the whole survives untouched. Record when it arrived, who owns it now, and what one more period of keeping it costs in money, attention, and calendar. A vague incumbent cannot be re-decided, only defended.`,
            2: `🚧 **Step 2: Reconstruct the Fence**\n\nBefore judging what sits behind "${problem}", reconstruct why it exists. Do not clear away a fence until you know why it was put there. What was it adopted to solve, who was feeling that pain, and what were the alternatives at the time? Then ask the question that does the work: is that original problem still live, or has something else quietly taken over solving it? A reason nobody remembers is not the same as no reason, so ask whoever put it there before you call it decoration, and write down what would come back if it vanished tonight.`,
            3: `🛒 **Step 3: The Re-Acquisition Test**\n\nInvert the burden of proof. "${problem}" invites you to justify removal; ask the acquisition question instead. Suppose it did not exist and nobody had ever adopted it — knowing what you know today, at today's price, against today's alternatives, would you take it on now? Answer yes or no first, then give the reason. Reject any reason that is really about the pain of removal; that gets priced in the next step. If the answer is a reluctant yes, name the price or the condition that would flip it to a no, because that is what you are actually deciding.`,
            4: `🧾 **Step 4: Price It Honestly**\n\nPut three numbers against "${problem}" and keep them apart. Carrying cost: what keeping it takes every period from here — fees, maintenance, coordination, the attention it quietly taxes. Switching cost: what leaving takes once, including whatever cannot be bought back afterwards, such as history you could not re-import or a rate you would never be quoted again. Opportunity cost: the best thing the same money, slot, and attention would buy instead. Then strike out everything already spent; it is gone either way and is not a reason to keep. Mark which costs recur and which are paid once, because a recurring cost outruns a one-time one given enough periods.`,
            5: `📅 **Step 5: Decide and Set the Trigger**\n\n⚠️ Medium Reflexivity: whatever you decide becomes the new incumbent, and it will defend itself next time.\n\nCommit on "${problem}" with one of four verdicts — keep, trim, replace, drop — and name who does what by when. Where step 4 found something you could not buy back, take the staged version of the verdict with a stated trial period rather than a clean cut. Then name the tripwire that forces the next re-decision: a price rise, a usage drop, the owner moving on. Retention with no trigger is not a decision but a default, and the point of this whole pass is to stop the default winning by silence.`,
        };
        return (guidance[step] ?? `Complete the ${this.getTechniqueInfo().name} process for: "${problem}"`);
    }
    /**
     * Reports what the session actually recorded, labelled by step.
     *
     * Diverges from sibling handlers in one place: the final step is reported
     * whole rather than truncated to its first sentence. That step's output is
     * the verdict, its owner, and the tripwire — truncating it would discard the
     * two things that make the decision hold.
     */
    extractInsights(history) {
        const insights = [];
        const lastIndex = this.steps.length - 1;
        history.forEach((entry, index) => {
            const output = entry.output?.trim();
            const stepName = this.steps[index]?.name;
            if (!output || !stepName) {
                return;
            }
            if (index === lastIndex) {
                insights.push(`${stepName}: ${output}`);
                return;
            }
            const [firstSentence] = output.split(/(?<=[.!?])\s+/);
            const summary = (firstSentence ?? output).trim();
            if (summary.length > 0) {
                insights.push(`${stepName}: ${summary}`);
            }
        });
        return insights;
    }
}
//# sourceMappingURL=KeeperTestHandler.js.map