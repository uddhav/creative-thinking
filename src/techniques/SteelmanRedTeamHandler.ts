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

export class SteelmanRedTeamHandler extends BaseTechniqueHandler {
  private readonly steps: StepInfo[] = [
    {
      name: 'Name the Target and the Stake',
      focus: 'State what is under attack and what changes if the attack lands',
      emoji: '🎯',
      type: 'thinking',
    },
    {
      name: 'Build the Strongest Opposing Case',
      focus: "State the opposing position at its best, in its holders' own terms",
      emoji: '🧱',
      type: 'thinking',
    },
    {
      name: 'Ideological Turing Test',
      focus: 'Gate: would a named holder of that view sign what you just wrote?',
      emoji: '🗣️',
      type: 'thinking',
    },
    {
      name: 'Appoint the Adversary',
      focus: 'Name a concrete opponent with a motive, a budget, and what they know',
      emoji: '😈',
      type: 'thinking',
    },
    {
      name: 'Run the Attack',
      focus: "From the adversary's chair, plan the defeat of the target",
      emoji: '💥',
      type: 'thinking',
    },
    {
      name: 'Independence and Consequence Check',
      focus: 'Gate: who ran this, and could any finding actually change the decision?',
      emoji: '🚦',
      type: 'thinking',
    },
    {
      name: 'Amend and Commit',
      focus: 'Turn surviving findings into changes with owners, and record what you accept',
      emoji: '✍️',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Delivering the findings to whoever owns the plan',
          'Committing to a disposition',
          'Recording the objections you are choosing to accept',
        ],
        realityChanges: [
          'The owner now knows their plan was attacked, and by whom',
          'The accepted objections are on record and will be read back if it fails',
          'Amendments with owners are commitments, not suggestions',
        ],
        futureConstraints: [
          'Re-running the review is cheaper the second time but less revealing — the surprise is spent',
          'An accepted objection that later lands makes the next review harder to convene, not easier',
        ],
        reversibility: 'medium',
      },
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Steelman & Red Team',
      emoji: '🥊',
      totalSteps: 7,
      description:
        'Builds the opposing case until its holders would sign it, then attacks the plan from a named adversary who wants it to fail',
      focus: 'Occupy a position that is not yours, cooperatively and then hostilely',
      enhancedFocus:
        'Gated at both halves: a caricatured opponent fails the Turing test, and findings that could not have changed the decision fail the consequence check',
      parallelSteps: {
        canParallelize: false,
        // The full chain, because the technique really is step-by-step. The
        // two that matter most are 2→3 and 5→6: a gate can only judge work
        // that already exists.
        dependencies: [
          [1, 2],
          [2, 3],
          [3, 4],
          [4, 5],
          [5, 6],
          [6, 7],
        ],
        description:
          'Sequential, and the gates are the reason: the Turing test can only judge a case already built, and the consequence check can only judge findings already produced',
      },
      reflexivityProfile: {
        primaryCommitmentType: 'relationship',
        overallReversibility: 'medium',
        riskLevel: 'low',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    const info = this.steps[step - 1];
    if (!info) {
      return {
        name: `Step ${step}`,
        focus: 'Outside the defined sequence',
        emoji: '🥊',
        type: 'thinking',
      };
    }
    return info;
  }

  getStepGuidance(step: number, problem: string): string {
    const guidance: Record<number, string> = {
      1: `🎯 **Step 1: Name the Target and the Stake**\n\nAn attack needs something to hit, so state precisely what in "${problem}" is under review — the claim, the plan, or the decision, in one sentence, in the form someone could disagree with. Pick the grain deliberately: too broad and every objection is answered with "well, not that part", too narrow and you defend a detail while the thing that matters goes untested. Then write down where you currently stand and how sure you are, because step 7 needs a reading to move and a position recorded afterwards is a position adjusted. Finally, name the stake: what actually changes if the attack lands — what gets rewritten, delayed, or abandoned. If nothing does, you have found that out for the price of one sentence rather than seven steps.`,
      2: `🧱 **Step 2: Build the Strongest Opposing Case**\n\nNow argue the other side of "${problem}" as if it were yours. Restate the opposing position so clearly and fairly that someone who holds it would say "yes, that is what I think" — then keep going: list what you genuinely agree with, and name what you have learned from it. Only after that may you strengthen it. Drop the parts that are easy to refute, since beating those proves nothing; repair the joints where a careless advocate would leave an opening; supply the evidence its best defenders would supply, not the evidence you find convenient. Add the argument they have not made but should. You are building the version that would beat you, not the version you would enjoy beating.`,
      3: `🗣️ **Step 3: Ideological Turing Test**\n\nThis is a gate, so answer it before going further. Name a specific person or group who actually holds the opposing view on "${problem}" — a named colleague, a competitor, a team, an author. If you cannot name one, the position you built in step 2 is one you invented, and you were always going to win. Now ask whether that named holder, reading step 2 back, would say "yes, that is my view" or would say "that is not what I think". Two failures to look for by name: the tinman, where you call it a steelman while quietly making them stupider than they are, and the weakman, where you pick their worst advocate and treat them as typical. If it fails, go back to step 2 and rewrite. Do not proceed on a case its own holders would disown.`,
      4: `😈 **Step 4: Appoint the Adversary**\n\nSwitch from cooperative to hostile. Step 2 modelled someone who wants to be right; now model someone who wants "${problem}" to fail, or who simply profits when it does. Name them concretely — a competitor, a regulator, an attacker, a supplier at renewal, a rival team, or time and attrition, which need no motive at all. Then equip them honestly: what do they know about you, what will they spend, how patient are they, and what have they done before? This is the step that separates a real attack from a list of worries. "What could go wrong" produces generic risk; an adversary with a budget, a grievance and your switching costs on a spreadsheet produces the specific thing that actually happens.`,
      5: `💥 **Step 5: Run the Attack**\n\nSit in that adversary's chair and plan the defeat of "${problem}". Cheapest attack first — the one needing least effort, access or luck, because that is the one you will actually meet. Then take the long way round: it is twelve months on, this failed decisively, and you are writing the account of why. What broke, in what order, and which assumption turned out to be load-bearing? Imagining the failure as already accomplished gets you specifics that "what might go wrong" never reaches. For each finding record how bad it would be, how plausible it is, and — the part people skip — the earliest observable: the thing you could go and look at today that would already be visible if this were underway.`,
      6: `🚦 **Step 6: Independence and Consequence Check**\n\nSecond gate, and the one that decides whether any of this counted. First, independence: who ran the attack on "${problem}"? Someone who owns the plan, or is rewarded for it shipping, will find the survivable problems and miss the fatal one — not dishonestly, just reliably. If that describes you, say so and say what it probably cost. Second, consequence: name at least one finding from step 5 that, if true, changes the decision. Then name who has the standing to make that change. If no finding could overturn anything, one of two things is true — the target is genuinely robust, in which case record why and be able to defend it, or the attack was pulled and the whole exercise was theatre. A red team whose findings were never able to land is the documented failure, not the exception.`,
      7: `✍️ **Step 7: Amend and Commit**\n\n⚠️ Medium Reflexivity: once the owner knows their plan was attacked and by whom, the next review starts from a different place.\n\nClose "${problem}" with one of four dispositions — proceed, proceed with changes, hold, or abandon — and say which findings drove it. Turn every surviving finding into either an amendment with a named owner and a date, or a monitor pointed at the earliest observable you wrote in step 5. Then do the part that makes this durable: list the objections you are choosing to accept anyway, by name, with the reason you find them tolerable. Accepting a risk knowingly and never having seen it are indistinguishable afterwards unless you wrote it down, and that record is what the outcome will be judged against. Note what you now believe that you did not at step 1, even if the answer is nothing.`,
    };

    return (
      guidance[step] ?? `Complete the ${this.getTechniqueInfo().name} process for: "${problem}"`
    );
  }

  /**
   * Reports what the session actually recorded, labelled by step.
   *
   * Follows the sibling handlers in truncating to a first sentence, with the
   * final step reported whole: step 7 carries the disposition, the amendments
   * and the objections knowingly accepted, and truncation would keep only the
   * first of the three. The accepted-objection list is the whole reason the
   * technique ends in a record rather than an opinion.
   */
  extractInsights(history: Array<{ output?: string }>): string[] {
    const insights: string[] = [];
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
