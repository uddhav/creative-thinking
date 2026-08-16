/**
 * Cognitive Bias Audit technique handler
 *
 * A 9-step debiasing checklist distilled from Charlie Munger's
 * "The Psychology of Human Misjudgment" (1995). The decider runs the standard
 * causes of misjudgment against their own judgment, detects the multiplicative
 * "lollapalooza" confluence, then inverts and seeks disconfirmation before
 * committing.
 */
import { BaseTechniqueHandler, firstSentence } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
/**
 * The tendencies this audit walks. Inline for now; promote to a shared data
 * module when a second consumer (e.g. a generated catalog) appears.
 *
 * Entries without `supplementary` are Munger's own, from the 1995 talk. Those
 * marked `supplementary: true` are not his — they are Kahneman-family, added
 * because his taxonomy has no entry for the biases that attach to something you
 * already hold. The flag is not decoration: the guidance renders the two groups
 * under separate headings, so a reader is never shown a borrowed bias inside a
 * list narrated in Munger's voice.
 */
const TENDENCIES = [
    {
        id: 'incentives',
        name: 'Reward/punishment super-response',
        antidote: 'Follow the incentives; distrust the conclusion that pays you',
    },
    {
        id: 'agency',
        name: 'Incentive-caused bias in advisors',
        antidote: 'Apply a windage factor to anyone who profits from your conclusion',
    },
    {
        id: 'denial',
        name: 'Simple psychological denial',
        antidote: 'Name the painful fact out loud',
    },
    {
        id: 'consistency',
        name: 'Consistency & commitment tendency',
        antidote: 'Treat your conclusions as hypotheses; do not declare too early',
    },
    { id: 'envy', name: 'Envy / jealousy', antidote: 'Name envy as a driver and discount it' },
    {
        id: 'chemical',
        name: 'Chemical dependency',
        antidote: 'Recognize the denial it always brings',
    },
    {
        id: 'liking_disliking',
        name: 'Liking / disliking distortion',
        antidote: 'Discount love of your own ideas; learn from the disliked',
    },
    {
        id: 'social_proof',
        name: 'Social proof',
        antidote: 'Run an independent pass; ignore the crowd under stress',
    },
    {
        id: 'authority',
        name: 'Over-influence by authority',
        antidote: 'Demand the why; let the co-pilot speak',
    },
    {
        id: 'reciprocation',
        name: 'Reciprocation tendency',
        antidote: 'Beware unearned favors (Sam Walton took no gifts)',
    },
    {
        id: 'stress',
        name: 'Stress-induced mental change',
        antidote: 'Recognize that stress distorts judgment; slow down',
    },
    {
        id: 'say_something',
        name: 'Say-something syndrome',
        antidote: 'Do not add noise; silence is acceptable',
    },
    {
        id: 'deprival',
        name: 'Deprival super-reaction',
        antidote: 'Size the felt loss; refuse to escalate',
    },
    {
        id: 'gambling',
        name: 'Mis-gambling compulsion',
        antidote: 'Beware variable reinforcement and near-misses',
    },
    {
        id: 'pavlovian',
        name: 'Pavlovian association',
        antidote: 'Ask what really causes the correlation',
    },
    {
        id: 'contrast',
        name: 'Contrast-caused distortion',
        antidote: 'Check the absolute scale, not the comparison',
    },
    {
        id: 'availability',
        name: 'Availability-misweighing',
        antidote: 'Use base rates; think like Zeckhauser plays bridge',
    },
    {
        id: 'vivid',
        name: 'Over-influence by extra-vivid evidence',
        antidote: 'Down-weight the vivid; weight the base rate',
    },
    {
        id: 'sensory_limits',
        name: 'Other sensation/cognition limits',
        antidote: 'Accept the limits; array the facts on a theory structure',
    },
    // --- Supplementary: not on Munger's 1995 list ---
    // These three are the specific distortions that attach to an incumbent — to
    // something already owned, already paid for, already the default. Munger's
    // taxonomy covers deprival (losing what you nearly have) but has no entry for
    // the mirror cases, which is why a retention decision could pass the whole
    // checklist untouched.
    {
        id: 'endowment',
        name: 'Endowment effect',
        antidote: 'Price it as a stranger would, not as the owner',
        supplementary: true,
    },
    {
        id: 'sunk_cost',
        name: 'Sunk-cost commitment',
        antidote: 'What is already spent is gone; decide on the costs still ahead',
        supplementary: true,
    },
    {
        id: 'status_quo',
        name: 'Status-quo bias',
        antidote: 'Ask whether you would choose this if it were not already the default',
        supplementary: true,
    },
];
const TENDENCY_BY_ID = new Map(TENDENCIES.map((t) => [t.id, t]));
export class CognitiveBiasAuditHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Frame the Judgment',
            focus: 'Name the specific decision and your tentative answer',
            emoji: '🎯',
            type: 'thinking',
            reversibility: 'high',
        },
        {
            name: 'Follow the Incentives',
            focus: 'Map incentive forces on self and advisors',
            emoji: '🎣',
            type: 'thinking',
            reversibility: 'high',
            tendencyIds: ['incentives', 'agency'],
        },
        {
            name: 'Ego & Commitment Defenses',
            focus: 'Surface denial, commitment lock-in, envy, liking bias',
            emoji: '🧠',
            type: 'thinking',
            reversibility: 'high',
            tendencyIds: [
                'denial',
                'consistency',
                'sunk_cost',
                'status_quo',
                'envy',
                'chemical',
                'liking_disliking',
            ],
        },
        {
            name: 'Social Pressure Scan',
            focus: 'Scan social proof, authority, reciprocation, stress, noise',
            emoji: '👥',
            type: 'thinking',
            reversibility: 'high',
            tendencyIds: ['social_proof', 'authority', 'reciprocation', 'stress', 'say_something'],
        },
        {
            name: 'Deprival & Scarcity Check',
            focus: 'Check deprival super-reaction and near-miss gambling',
            emoji: '🐶',
            type: 'thinking',
            reversibility: 'high',
            tendencyIds: ['deprival', 'endowment', 'gambling'],
        },
        {
            name: 'Perception & Math Distortions',
            focus: 'Identify association, contrast, availability, base-rate neglect, vividness',
            emoji: '🔬',
            type: 'thinking',
            reversibility: 'high',
            tendencyIds: ['pavlovian', 'contrast', 'availability', 'vivid', 'sensory_limits'],
        },
        {
            name: 'Lollapalooza Check',
            focus: 'Find tendencies stacking multiplicatively toward one conclusion',
            emoji: '🎰',
            type: 'thinking',
            reversibility: 'high',
        },
        {
            name: 'Invert & Seek Disconfirmation',
            focus: 'Argue the opposite; hunt evidence that proves you wrong',
            emoji: '🔄',
            type: 'thinking',
            reversibility: 'high',
        },
        {
            name: 'Debias & Decide',
            focus: 'Apply antidotes and commit with reversal criteria',
            emoji: '✅',
            type: 'action',
            reflexiveEffects: {
                triggers: [
                    'Committing to a debiased verdict',
                    'Declaring the conclusion (publicly or in writing)',
                ],
                realityChanges: [
                    'A decision is now on record',
                    'Consistency and commitment tendency now defends THIS conclusion',
                    'Antidotes installed (post-mortem trigger, base-rate anchor, reversal criteria)',
                ],
                futureConstraints: [
                    'Must run the post-mortem when the outcome is known',
                    'Re-examination now requires overcoming the commitment bias just created',
                ],
                reversibility: 'medium',
            },
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Cognitive Bias Audit',
            emoji: '🪞',
            totalSteps: 9,
            description: "Munger's checklist of standard causes of human misjudgment, with lollapalooza detection and inversion",
            focus: 'Run down the catalog of misjudgment tendencies instead of jumping on one factor',
            enhancedFocus: 'Detects multiplicative lollapalooza confluences and forces disconfirmation before commitment',
            parallelSteps: {
                canParallelize: false,
                description: 'Sequential: each scan lens narrows the field before the lollapalooza and inversion steps',
            },
            reflexivityProfile: {
                primaryCommitmentType: 'behavioral',
                overallReversibility: 'medium',
                riskLevel: 'low',
            },
        };
    }
    getStepInfo(step) {
        if (step < 1 || step > this.steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Cognitive Bias Audit. Valid steps are 1-${this.steps.length}`, 'step', { received: step, expected: `1-${this.steps.length}` });
        }
        return this.steps[step - 1];
    }
    getStepGuidance(step, problem) {
        const guidance = {
            1: `🎯 **Step 1: Frame the Judgment**\n\nDecision under audit: "${problem}"\n\nDon't audit in the abstract. Name the specific decision and the answer you're already leaning toward — out loud or on paper. You cannot disarm a bias you won't name, and the man who says "I'm being objective" is usually the one being played. Ask first whether "${problem}" even sits inside your circle of competence — it is not a competency if you do not know its edge, and stepping over that edge is how smart people get killed.`,
            2: `🎣 **Step 2: Follow the Incentives**\n\nNever, ever think about anything else when you should be thinking about the power of incentives. For "${problem}", ask whose pay, ego, or status moves with each possible answer — yours, and your trusted advisors'. Remember the gall-bladder surgeon: the sincere-but-biased advisor is the dangerous one, so apply a windage factor to anyone who profits from your conclusion.`,
            3: `🧠 **Step 3: Ego & Commitment Defenses**\n\nSimple psychological denial — the dead pilot's mother — and consistency-commitment are a superpower working against you. Have you already declared your answer on "${problem}" out loud, in a memo, or to a room? Then it's been pounded into your head. Ask what hard-won or stated view you're now defending, and whether envy, or liking your own kind and your own ideas, is doing the steering.`,
            4: `👥 **Step 4: Social Pressure Scan**\n\nUnder uncertainty and stress we ape the crowd and obey authority — that's a lollapalooza all by itself. Kitty Genovese died because everyone took everyone else's inaction as proof. On "${problem}", are you deferring because the boss, the market price, or the consensus says so, and is somebody doing an incoherent honeybee dance just to have something to say?`,
            5: `🐶 **Step 5: Deprival & Scarcity Check**\n\nTake away something a man almost has and watch him bite — I learned it from my own dog. New Coke, feuds over a neighbor's tree, escalation through reciprocated animosity: deprival super-reaction makes us irrational about loss and near-misses. Is your judgment on "${problem}" about the merits, or about not losing something you'd half-counted as yours?`,
            6: `🔬 **Step 6: Perception & Math Distortions**\n\nThe brain runs on crude heuristics — Pavlovian association, contrast, and the availability of one vivid story. Three buckets of water teach you that contrast distorts cognition, and the frog boils because it came in small pieces. Where's the base rate for "${problem}" (think like Zeckhauser plays bridge), and are you over-weighting one vivid fact the way I once wrote off thirty million dollars? And beware false precision — do not overweigh a number just because it can be measured while the things that matter go unmeasured; better roughly right than precisely wrong.`,
            7: `🎰 **Step 7: Lollapalooza Check**\n\nNow the most important step. Simple explanations first — but when the outcome is a Lollapalooza (extreme and outsized), the rule flips: look for a confluence of causes, not one. The tendencies don't add, they multiply. Tupperware parties, open-outcry auctions, a Moonie conversion, a dysfunctional board — each is four or five tendencies pulling the same way at once. List which forces from steps 2-6 are stacking toward the same answer on "${problem}"; that confluence, not any single factor, is what blows up judgment.`,
            8: `🔄 **Step 8: Invert & Seek Disconfirmation**\n\nInvert, always invert. State the opposite conclusion on "${problem}" and argue it hard. Darwin paid extra attention to evidence that disconfirmed his cherished ideas and wore little hair shirts to force it — so go hunt the facts that would prove your preferred answer a disaster, and weight them more, not less, because your consistency bias wants to wave them off.`,
            9: `✅ **Step 9: Debias & Decide**\n\n⚠️ Medium Reflexivity: declaring the verdict re-triggers commitment bias — write down what would make you reverse.\n\nInstall the antidotes and commit on "${problem}". Explain the why with the five W's (a fact not hung on a theory that answers "why?" won't stick), use base rates, apply granny's rule, and schedule the post-mortem the way J&J revisits its failed acquisitions. Then decide.`,
        };
        const base = guidance[step];
        if (!base) {
            return `Complete the Cognitive Bias Audit process for: "${problem}"`;
        }
        // Append the structured tendency checklist for scan steps (data-driven).
        const ids = this.steps[step - 1]?.tendencyIds;
        if (ids && ids.length > 0) {
            const tendencies = ids
                .map(id => TENDENCY_BY_ID.get(id))
                .filter((t) => t !== undefined);
            const render = (list) => list.map(t => `- ${t.name} → ${t.antidote}`).join('\n');
            const mungers = tendencies.filter(t => !t.supplementary);
            const borrowed = tendencies.filter(t => t.supplementary);
            let checklist = '';
            if (mungers.length > 0) {
                checklist += `\n\nRun the checklist for this lens:\n${render(mungers)}`;
            }
            // Rendered separately so a borrowed bias is never presented as Munger's.
            if (borrowed.length > 0) {
                checklist += `\n\nNot on Munger's list, but they bite here too:\n${render(borrowed)}`;
            }
            return `${base}${checklist}`;
        }
        return base;
    }
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
    extractInsights(history) {
        const totalSteps = this.steps.length;
        const latestByStep = new Map();
        history.forEach((entry, index) => {
            // Fall back to position only when the caller sent no step number.
            const step = entry.currentStep ?? index + 1;
            if (step >= 1 && step <= totalSteps) {
                latestByStep.set(step, entry);
            }
        });
        const insights = [];
        for (let step = 1; step <= totalSteps; step++) {
            const output = latestByStep.get(step)?.output?.trim();
            const stepName = this.steps[step - 1]?.name;
            if (!output || !stepName) {
                continue;
            }
            const summary = firstSentence(output);
            if (summary.length > 0) {
                insights.push(`${stepName}: ${summary}`);
            }
        }
        return insights;
    }
}
//# sourceMappingURL=CognitiveBiasAuditHandler.js.map