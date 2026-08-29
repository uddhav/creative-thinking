/**
 * Random Entry technique handler
 *
 * Enhanced with "Rory Mode" - behavioral economics-inspired wildcarding
 * that focuses on human irrationality and psychological insights
 */

import { BaseTechniqueHandler, firstSentence, type StepInfo, type TechniqueInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
import { RORY_STIMULI } from './decks/randomEntryDeck.js';

interface RandomEntryContext {
  roryMode?: boolean;
  stimulus?: string;
  connections?: string[];
}

export class RandomEntryHandler extends BaseTechniqueHandler {
  // Rory Mode wildcards live in the deck module so the planner can draw from
  // them as data; the handler keeps this alias for its guidance paths.
  private readonly roryModeStimuli = RORY_STIMULI;

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Random Entry',
      emoji: '🎲',
      totalSteps: 3,
      description: 'Use random stimuli to trigger new associations (enhanced with Rory Mode)',
      focus: 'Generate fresh perspectives through unrelated concepts',
      enhancedFocus:
        'Includes "Rory Mode" for behavioral economics-inspired psychological wildcarding',
      parallelSteps: {
        canParallelize: false,
        description: 'Random stimulus must be generated before connections can be explored',
      },
      reflexivityProfile: {
        primaryCommitmentType: 'exploratory',
        overallReversibility: 'high',
        riskLevel: 'low',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    const steps: StepInfo[] = [
      {
        name: 'Random Stimulus',
        focus: 'Select a random word or concept',
        emoji: '🎲',
        type: 'thinking',
        reversibility: 'high',
      },
      {
        name: 'Force Connections',
        focus: 'Find links between stimulus and problem',
        emoji: '🔗',
        type: 'thinking',
        reversibility: 'high',
      },
      {
        name: 'Develop Ideas',
        focus: 'Transform connections into solutions',
        emoji: '💡',
        type: 'thinking',
        reversibility: 'high',
      },
    ];

    if (step < 1 || step > steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Random Entry technique. Valid steps are 1-${steps.length}`,
        'step',
        { providedStep: step, validRange: `1-${steps.length}` }
      );
    }

    return steps[step - 1];
  }

  getStepGuidance(step: number, problem: string, context?: RandomEntryContext): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > 3) {
      return `Complete the Random Entry process for: "${problem}"`;
    }

    const isRoryMode = context?.roryMode || false;

    switch (step) {
      case 1:
        if (isRoryMode) {
          return `🎲 **Step 1: Random Stimulus (Rory Mode)**

Selecting behavioral economics wildcard for: "${problem}"

Instead of a traditional random word, we'll use a psychological/perceptual stimulus 
that reveals human irrationality and hidden motivations.

**Rory Mode Categories:**
• **Psychological**: Biases and mental shortcuts (loss aversion, social proof)
• **Contextual**: Environmental manipulations (changing where/when/how)
• **Perceptual**: Experience illusions (progress theater, peak-end rule)
• **Counterintuitive**: Paradoxical strategies (make it harder to increase value)

**Sutherland's Principle:**
"The opposite of a good idea can also be a good idea"

Select one wildcard from these categories or generate your own behavioral insight.
Don't think about "${problem}" yet - just pick what intrigues you.

Examples:
- "Making it more expensive made it more desirable" (Veblen goods)
- "Adding friction increased satisfaction" (IKEA effect)
- "Showing less improved conversion" (Paradox of choice)`;
        } else {
          return `🎲 **Step 1: Random Stimulus**

Choose a random word/concept for: "${problem}"

Select from a book, dictionary, or random generator.
Don't think about the problem yet - just pick something unrelated.

Optional: Enable "Rory Mode" for behavioral economics-inspired wildcards.`;
        }
      case 2:
        if (isRoryMode) {
          return `🔗 **Step 2: Force Connections (Rory Mode)**

Connect your behavioral wildcard to: "${problem}"

How do the psychological/perceptual principles apply?

**Connection Strategies:**
• **Inversion**: What if we did the opposite?
• **Reframing**: How would this change the context?
• **Perception Hack**: What subjective experience could we create?
• **Irrational Appeal**: What emotional button does this push?
• **Status Play**: How does this affect social signaling?

**Key Questions:**
- How would this bias/effect manifest in our problem?
- What human irrationality could we leverage?
- Where are we fighting psychology instead of using it?
- What would happen if we optimized for perception, not reality?

Remember: "Humans are not logical, they're psychological"`;
        } else {
          return `🔗 **Step 2: Force Connections**

Force connections between your random stimulus and "${problem}".

How do properties, characteristics, or associations of the stimulus relate?
What unexpected parallels can you draw?`;
        }
      case 3:
        if (isRoryMode) {
          return `💡 **Step 3: Develop Ideas (Rory Mode)**

Transform psychological insights into solutions for: "${problem}"

**Development Framework:**
• **Perception Solution**: Change how it's experienced, not what it is
• **Context Solution**: Alter the environment, not the product
• **Psychological Solution**: Appeal to emotions, not logic
• **Counterintuitive Solution**: Do the opposite of best practice

**Sutherland's Tests:**
1. Would a rational economist hate this? (Good sign!)
2. Does it make psychological sense even if not logical sense?
3. Could we test this cheaply before committing?
4. What's the worst that could happen? (Often: nothing)

**Remember:**
- Small perceptual changes can have massive impacts
- The map is not the territory (perception ≠ reality)
- Costly signaling often works better than efficiency
- Sometimes the irrational approach is the most effective`;
        } else {
          return `💡 **Step 3: Develop Ideas**

Develop the connections into practical ideas for "${problem}".

Which associations lead to viable solutions?
How can the forced connections become real innovations?`;
        }
      default:
        return `Complete the Random Entry process for: "${problem}"`;
    }
  }

  /**
   * @deprecated Non-deterministic (Math.random) and caller-less in production.
   * Plan-time assignment (techniques/decks/assignment.ts) is the supported
   * path: seeded, per-instance, recoverable from the planId.
   */
  private getRandomRoryStimulus(): string {
    const categories = Object.keys(this.roryModeStimuli) as Array<
      keyof typeof this.roryModeStimuli
    >;
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const categoryStimuli = this.roryModeStimuli[randomCategory];
    return categoryStimuli[Math.floor(Math.random() * categoryStimuli.length)];
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Additional validation for Rory Mode
    if (data && typeof data === 'object' && 'roryMode' in data) {
      const dataWithRoryMode = data;
      if (typeof dataWithRoryMode.roryMode !== 'boolean') {
        return false;
      }
    }

    return true;
  }

  extractInsights(
    history: Array<{
      currentStep?: number;
      randomStimulus?: string;
      connections?: string[];
      output?: string;
      roryMode?: boolean;
    }>
  ): string[] {
    const insights: string[] = [];
    const isRoryMode = history.some(entry => entry.roryMode === true);
    const latestByStep = new Map<number, (typeof history)[number]>();

    history.forEach((entry, index) => {
      const step = entry.currentStep ?? index + 1;
      if (step >= 1 && step <= 3) {
        latestByStep.set(step, entry);
      }
    });

    for (let step = 1; step <= 3; step++) {
      const entry = latestByStep.get(step);
      if (!entry) continue;
      const stepName = this.getStepInfo(step).name;

      const output = entry.output?.trim();
      if (output) {
        const summary = firstSentence(output);
        if (summary.length > 0) {
          insights.push(`${stepName}: ${summary}`);
        }
      }

      if (step === 1 && entry.randomStimulus) {
        insights.push(
          isRoryMode
            ? `Rory Mode stimulus: ${entry.randomStimulus} (behavioral economics wildcard)`
            : `Random stimulus used: ${entry.randomStimulus}`
        );
      }

      // Every connection, not the first. Forcing connections is the technique;
      // reporting one of six is reporting a sixth of the step.
      if (step === 2 && entry.connections && entry.connections.length > 0) {
        const label = isRoryMode ? 'Psychological connection' : 'Key connection';
        insights.push(`${label}: ${entry.connections.join('; ')}`);
      }
    }

    // Step 3 used to count occurrences of "could", "might" and "perhaps" in the
    // prose and report that count as the number of ideas. An idea written in
    // the imperative — "Ship a shadow deploy; charge for the slow lane" —
    // counted zero and was reported as nothing. The step's own output, reported
    // above, is what it produced.
    //
    // The Rory Mode banner is gone with it: it fired on any three-entry history
    // and asserted that non-obvious solutions had been generated, whatever the
    // steps said.

    return insights;
  }

  /**
   * Get a suggested Rory Mode stimulus for a given problem
   * @deprecated Use the plan-time assignment (techniques/decks/assignment.ts)
   * — seeded and per-instance — instead of this Math.random draw.
   */
  suggestRoryStimulus(): string {
    return this.getRandomRoryStimulus();
  }
}
