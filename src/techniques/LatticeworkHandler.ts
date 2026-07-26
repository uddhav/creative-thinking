/**
 * Latticework of Mental Models technique handler
 *
 * A 7-step multidisciplinary technique distilled from Charlie Munger's
 * 2008 Caltech lecture: "grab all the big ideas in all the disciplines"
 * so you become a man with multiple tools, rather than the man with a
 * hammer to whom every problem looks like a nail. Forces a problem through
 * four named disciplinary lenses, then synthesizes where they agree,
 * conflict, or stack.
 */

import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface MentalModel {
  id: string;
  name: string;
  question: string;
}

interface LatticeworkStep extends StepInfo {
  modelIds?: string[];
}

/**
 * The big ideas worth borrowing from each discipline. Inline for now;
 * promote to a shared data module when a second consumer appears.
 */
const MENTAL_MODELS: readonly MentalModel[] = [
  // Physics & engineering
  {
    id: 'equilibrium',
    name: 'Equilibrium & backup systems',
    question: 'What forces balance here, and what happens when one gives way?',
  },
  {
    id: 'feedback',
    name: 'Feedback loops',
    question: 'What reinforces itself, and what damps itself?',
  },
  {
    id: 'critical_mass',
    name: 'Critical mass / breakpoints',
    question: 'Is there a threshold past which behavior changes entirely?',
  },
  {
    id: 'margin_of_safety',
    name: 'Margin of safety',
    question: 'What slack absorbs the mischances of life without collapse?',
  },
  {
    id: 'common_mode',
    name: 'Common-mode failure',
    question: 'Are the risks truly independent, or do they all fail together?',
  },
  // Biology & evolution
  {
    id: 'competition',
    name: 'Competition & niches',
    question: 'Who else wants this, and where is the uncontested space?',
  },
  {
    id: 'adaptation',
    name: 'Adaptation & selection',
    question: 'What is being selected for here, over time?',
  },
  {
    id: 'carrying_capacity',
    name: 'Carrying capacity',
    question: 'What limit does the surrounding system impose on growth?',
  },
  // Psychology
  {
    id: 'incentives',
    name: 'Incentive super-response',
    question: 'Whose behavior follows the money, status, or ego?',
  },
  {
    id: 'misjudgment',
    name: 'Standard causes of misjudgment',
    question: 'Which psychological tendencies are distorting the judgment?',
  },
  // Economics & mathematics
  {
    id: 'scale',
    name: 'Economies (and diseconomies) of scale',
    question: 'What gets cheaper — or worse — as this grows?',
  },
  {
    id: 'compounding',
    name: 'Compounding',
    question: 'What small rate, repeated, dominates the long run?',
  },
  {
    id: 'base_rates',
    name: 'Base rates & probability',
    question: 'What does the reference class say, before this case?',
  },
  {
    id: 'opportunity_cost',
    name: 'Opportunity cost',
    question: 'What is the best alternative we give up by doing this?',
  },
  {
    id: 'occam',
    name: "Occam's razor",
    question: 'What is the simplest explanation that is still sufficient?',
  },
  {
    id: 'inversion',
    name: 'Inversion',
    question: 'What would guarantee failure — and are we doing any of it?',
  },
];

const MODEL_BY_ID = new Map<string, MentalModel>(
  MENTAL_MODELS.map((m): [string, MentalModel] => [m.id, m])
);

export class LatticeworkHandler extends BaseTechniqueHandler {
  private readonly steps: LatticeworkStep[] = [
    {
      name: 'Frame & Name Your Hammer',
      focus: 'State the problem and the one model you instinctively reach for',
      emoji: '🔨',
      type: 'thinking',
    },
    {
      name: 'Physics & Engineering Lens',
      focus: 'Equilibrium, feedback, thresholds, margin of safety, common-mode failure',
      emoji: '⚙️',
      type: 'thinking',
      modelIds: ['equilibrium', 'feedback', 'critical_mass', 'margin_of_safety', 'common_mode'],
    },
    {
      name: 'Biology & Evolution Lens',
      focus: 'Competition, niches, adaptation, selection pressure, carrying capacity',
      emoji: '🧬',
      type: 'thinking',
      modelIds: ['competition', 'adaptation', 'carrying_capacity'],
    },
    {
      name: 'Psychology Lens',
      focus: 'Incentives and the standard causes of human misjudgment',
      emoji: '🧠',
      type: 'thinking',
      modelIds: ['incentives', 'misjudgment'],
    },
    {
      name: 'Economics & Math Lens',
      focus: 'Scale, compounding, base rates, opportunity cost, Occam, inversion',
      emoji: '📐',
      type: 'thinking',
      modelIds: ['scale', 'compounding', 'base_rates', 'opportunity_cost', 'occam', 'inversion'],
    },
    {
      name: 'Synthesize the Lattice',
      focus: 'Where the lenses agree, conflict, or stack into a confluence',
      emoji: '🕸️',
      type: 'thinking',
    },
    {
      name: 'Decide with a Margin of Safety',
      focus: 'Commit inside your competence, with slack for being wrong',
      emoji: '🛡️',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Committing to a multi-model conclusion',
          'Declaring which models governed the decision',
        ],
        realityChanges: [
          'A decision is now on record with its reasoning made explicit',
          'The chosen models become the frame others will inherit',
          'A margin of safety is set (or conspicuously absent)',
        ],
        futureConstraints: [
          'Must revisit if a lens that was overruled turns out to govern',
          'The stated margin of safety bounds how much can go wrong before failure',
        ],
        reversibility: 'medium',
      },
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Latticework of Mental Models',
      emoji: '🧰',
      totalSteps: 7,
      description:
        'Forces a problem through named disciplinary lenses — physics, biology, psychology, economics — to escape the one-model trap',
      focus:
        'To the man with only a hammer every problem looks like a nail; carry multiple tools instead',
      enhancedFocus:
        'Surfaces where disciplines disagree and demands synthesis rather than retreat into one orthodoxy',
      parallelSteps: {
        canParallelize: true,
        description:
          'The four disciplinary lenses (steps 2-5) are independent and can be applied in parallel after framing',
      },
      reflexivityProfile: {
        primaryCommitmentType: 'strategic',
        overallReversibility: 'medium',
        riskLevel: 'low',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    if (step < 1 || step > this.steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Latticework of Mental Models. Valid steps are 1-${this.steps.length}`,
        'step',
        { received: step, expected: `1-${this.steps.length}` }
      );
    }
    return this.steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    const guidance: Record<number, string> = {
      1: `🔨 **Step 1: Frame & Name Your Hammer**\n\nProblem: "${problem}"\n\nBefore reaching for a model, name the one you would instinctively reach for — the tool your training makes cheapest. To the man with a hammer, every problem looks pretty much like a nail, and that syndrome does not exempt bright people. Say which discipline you are about to over-apply, and note where the edge of your competence sits.`,
      2: `⚙️ **Step 2: Physics & Engineering Lens**\n\nAsk what an engineer would see in "${problem}". What forces are in equilibrium and what happens when one gives? Where are the feedback loops, the thresholds, the breakpoints? And check the hard one: are the risks genuinely independent, or have you built a common-mode failure — insuring every house on one island against the same hurricane?`,
      3: `🧬 **Step 3: Biology & Evolution Lens**\n\nAsk what a biologist would see. What is competing here, and what is actually being selected for over time? Where is the uncontested niche? What carrying capacity does the surrounding system impose — the limit an ecologist would see and an economist would wave away?`,
      4: `🧠 **Step 4: Psychology Lens**\n\nAsk what the standard causes of human misjudgment are doing to this problem — and to you. Never think about anything else when you should be thinking about the power of incentives: whose behavior follows the money, the status, or the ego? For a full pass, run the \`cognitive_bias_audit\` technique; here, take the two big ones.`,
      5: `📐 **Step 5: Economics & Math Lens**\n\nAsk what scales and what compounds. What is the base rate before this particular case? What is the opportunity cost — the best alternative you are giving up? Apply Occam's razor: the simplest sufficient explanation. Then invert: what would guarantee failure, and are you doing any of it?`,
      6: `🕸️ **Step 6: Synthesize the Lattice**\n\nNow put the lenses side by side. Where do they agree — that is your confident ground. Where do they conflict, synthesis is demanded: do not retreat into whatever orthodoxy you came from. And where several lenses point the same way at once, you have a confluence — a lollapalooza — which is far stronger than any single factor. Reality must respect all of reality; inconsistencies have to be resolved.`,
      7: `🛡️ **Step 7: Decide with a Margin of Safety**\n\n⚠️ Medium Reflexivity: the models you name become the frame others inherit.\n\nCommit — but inside your circle of competence, and with a margin of safety, the concept Ben Graham borrowed from engineering. Better to be roughly right than precisely wrong, so do not overweigh what is merely measurable. State which lens governed, which you overruled, and what would make you revisit.`,
    };

    const base = guidance[step];
    if (!base) {
      const info = this.getStepInfo(step);
      return `Step ${step}: ${info.name}\n\nFocus: ${info.focus}`;
    }

    // Append the structured model checklist for lens steps (data-driven).
    const ids = this.steps[step - 1]?.modelIds;
    if (ids && ids.length > 0) {
      const lines = ids
        .map(id => MODEL_BY_ID.get(id))
        .filter((m): m is MentalModel => m !== undefined)
        .map(m => `- ${m.name} → ${m.question}`)
        .join('\n');
      return `${base}\n\nModels in this lens:\n${lines}`;
    }
    return base;
  }

  extractInsights(history: Array<{ output?: string }>): string[] {
    const insights: string[] = [];
    history.forEach((entry, index) => {
      if (!entry.output) {
        return;
      }
      if (index >= 1 && index <= 4) {
        const stepName = this.steps[index]?.name ?? `Lens ${index}`;
        insights.push(`${stepName}: applied to the problem`);
      } else if (index === 5) {
        insights.push('Lattice synthesis: agreements, conflicts, and confluence identified');
      } else if (index === 6) {
        insights.push('Decision committed with an explicit margin of safety');
      }
    });
    return insights;
  }
}
