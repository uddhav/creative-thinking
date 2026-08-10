/**
 * Anecdotal Signal Detection technique handler
 *
 * A 6-step technique inspired by Rory Sutherland's argument that
 * "the most important information about the future first arrives
 * in anecdotal form" - using outliers as early change indicators
 */

import {
  BaseTechniqueHandler,
  describeStructuredField,
  firstSentence,
  type TechniqueInfo,
  type StepInfo,
} from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface AnecdotalSignal {
  story: string;
  divergenceLevel: 'minor' | 'moderate' | 'significant' | 'extreme';
  signalStrength: 'weak' | 'moderate' | 'strong' | 'critical';
  scalability: 'low' | 'medium' | 'high';
  precedentType: 'first' | 'rare' | 'emerging' | 'recurring';
}

interface AnecdotalSignalStep extends StepInfo {
  analysisElements?: string[];
  detectionType?: string;
}

export class AnecdotalSignalHandler extends BaseTechniqueHandler {
  private readonly steps: AnecdotalSignalStep[] = [
    {
      name: 'Anecdote Collection',
      focus: 'Gather outlier stories and edge cases',
      emoji: '📚',
      type: 'thinking',
      analysisElements: [
        'Outlier behaviors',
        'Edge case stories',
        'Unusual successes',
        'Unexpected failures',
        'Individual trajectories',
      ],
      detectionType: 'collection',
    },
    {
      name: 'Signal Assessment',
      focus: 'Evaluate if anecdotes represent signals or noise',
      emoji: '📡',
      type: 'thinking',
      analysisElements: [
        'Divergence from norms',
        'First instance checking',
        'Path dependency analysis',
        'Reproducibility assessment',
        'System impact projection',
      ],
      detectionType: 'evaluation',
      reflexiveEffects: {
        triggers: ['Signal identification', 'Pattern deviation recognition'],
        realityChanges: ['Understanding of normal vs exceptional'],
        futureConstraints: ['Must track identified patterns'],
        reversibility: 'high',
      },
    },
    {
      name: 'Trajectory Analysis',
      focus: 'Compare individual paths against ensemble averages',
      emoji: '📈',
      type: 'thinking',
      analysisElements: [
        'Individual vs ensemble divergence',
        'Path-dependent factors',
        'Unique conditions required',
        'Non-ergodic elements',
        'Trajectory sustainability',
      ],
      detectionType: 'trajectory_mapping',
      reflexiveEffects: {
        triggers: ['Path analysis', 'Non-ergodic recognition'],
        realityChanges: ['Statistical assumptions questioned'],
        futureConstraints: ['Must consider path dependencies'],
        reversibility: 'medium',
      },
    },
    {
      name: 'Early Warning Extraction',
      focus: 'Identify what anecdotes reveal about emerging changes',
      emoji: '⚠️',
      type: 'action',
      analysisElements: [
        'Precedent violations',
        'New possibility spaces',
        'Hidden assumptions revealed',
        'Emerging conditions',
        'Cascade potential',
      ],
      detectionType: 'warning_identification',
      reflexiveEffects: {
        triggers: ['Future possibility recognition', 'Change detection'],
        realityChanges: ['Awareness of emerging shifts', 'Preparedness altered'],
        futureConstraints: ['Must monitor identified trends'],
        reversibility: 'medium',
      },
    },
    {
      name: 'Scaling Projection',
      focus: 'Project what happens if outliers become mainstream',
      emoji: '🔮',
      type: 'action',
      analysisElements: [
        'Scaling scenarios',
        'Tipping point identification',
        'System impact modeling',
        'Resource requirements',
        'Barrier analysis',
      ],
      detectionType: 'impact_projection',
      reflexiveEffects: {
        triggers: ['Future scenario creation', 'Scaling analysis'],
        realityChanges: ['Strategic planning influenced', 'Investment priorities shifted'],
        futureConstraints: ['Projections influence decisions'],
        reversibility: 'low',
      },
    },
    {
      name: 'Strategic Response',
      focus: 'Develop strategies based on anecdotal intelligence',
      emoji: '🎯',
      type: 'action',
      analysisElements: [
        'Early mover advantages',
        'Risk mitigation strategies',
        'Opportunity capture',
        'Monitoring systems',
        'Adaptive protocols',
      ],
      detectionType: 'strategy_formulation',
      reflexiveEffects: {
        triggers: ['Strategic commitment', 'Resource allocation'],
        realityChanges: ['Organization positioned for change', 'Competitive dynamics altered'],
        futureConstraints: ['Strategy based on weak signals', 'Must maintain vigilance'],
        reversibility: 'low',
      },
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Anecdotal Signal Detection',
      emoji: '🔍',
      totalSteps: 6,
      description: 'Use outliers and individual stories as early indicators of change',
      focus: 'Extracting future insights from non-statistical anecdotal evidence',
      enhancedFocus:
        'Systematic harvesting of weak signals from individual trajectories that diverge from averages',
      parallelSteps: {
        canParallelize: false,
        description: 'Sequential analysis required to build from collection to strategic response',
      },
      reflexivityProfile: {
        primaryCommitmentType: 'observational',
        overallReversibility: 'medium',
        riskLevel: 'low',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    if (step < 1 || step > this.steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Anecdotal Signal Detection. Valid steps are 1-${this.steps.length}`,
        'step',
        { received: step, expected: `1-${this.steps.length}` }
      );
    }
    return this.steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    const stepInfo = this.steps[step - 1] as AnecdotalSignalStep | undefined;
    const elements = stepInfo?.analysisElements || [];

    const guidanceTemplates: Record<number, string> = {
      1: `📚 **Step 1: Anecdote Collection**

Gathering outlier stories for: "${problem}"

Collect individual cases that diverge from statistical norms.

Focus on these anecdotal types:
${elements.map(e => `• ${e}`).join('\n')}

Anecdote Sources:
1. **Customer extremes**: Power users, edge cases, unusual uses
2. **Failure stories**: Where conventional wisdom failed
3. **Success outliers**: Unexpected wins against odds
4. **Workarounds**: Creative solutions to constraints
5. **Early adopters**: First movers in new behaviors

Collection Framework:
- What "shouldn't work" but does?
- What "should work" but doesn't?
- What individual succeeded where groups failed?
- What unusual pattern keeps appearing?
- What story makes experts uncomfortable?

Don't Design for Average (Rule 2):
Focus on extreme users, not the average. The most valuable signals come from
people at the edges — power users, non-consumers, workaround inventors.
Average users reveal nothing; outliers reveal the future.

Sutherland's Principle:
"The plural of anecdote is not data, but it might be insight"

Historical Examples:
- Titanic: One anecdote (iceberg) trumped all statistics
- COVID: Early anecdotes from Italy preceded data
- iPhone: Power users showed future mainstream use
- Airbnb: Couch surfers revealed hospitality revolution

Output: Curated collection of significant anecdotes with context`,

      2: `📡 **Step 2: Signal Assessment**

Evaluating signal strength for: "${problem}"

Distinguish meaningful signals from random noise.

Assess anecdotes across:
${elements.map(e => `• ${e}`).join('\n')}

Signal vs Noise Framework:
| Indicator | Signal | Noise |
|-----------|--------|-------|
| Pattern violation | Breaks established rules | Random variation |
| Conditions | Changed environment | Same as always |
| Reproducibility | Others could follow | Unique to individual |
| Impact if scaled | System changing | Marginal effect |
| Expert reaction | Dismissive/threatened | Indifferent |

Signal Strength Indicators:
1. **Violates established patterns** - Not just unusual
2. **Emerges from changed conditions** - New enablers present
3. **Contains path-dependent insights** - Shows how, not just what
4. **Suggests new possibilities** - Opens option spaces
5. **Reveals hidden assumptions** - Exposes blind spots

Key Questions:
- Is this the first instance we've seen?
- What unique trajectory led here?
- Could this be replicated?
- What would happen if everyone did this?
- Why are experts dismissing this?

⚠️ Low Reflexivity: Assessment doesn't commit resources yet.

Output: Classified anecdotes with signal strength ratings`,

      3: `📈 **Step 3: Trajectory Analysis**

Mapping individual paths for: "${problem}"

Compare how individual trajectories diverge from ensemble averages.

Analyze trajectory elements:
${elements.map(e => `• ${e}`).join('\n')}

Individual vs Ensemble Comparison:
| Ensemble Average | Individual Path | Insight Value |
|-----------------|-----------------|---------------|
| "90% fail" | "Succeeded because..." | High - success factors |
| "Takes 5 years" | "Did it in 6 months via..." | Critical - acceleration |
| "Costs $1M" | "Achieved with $10K by..." | Very High - efficiency |
| "Requires expertise" | "Novice succeeded through..." | High - accessibility |

Non-Ergodic Analysis:
1. **Path Dependencies**: What sequence was crucial?
2. **Irreversible Decisions**: What bridges were burned?
3. **Timing Factors**: What windows were exploited?
4. **Network Effects**: What connections enabled this?
5. **Lock-in Moments**: Where did trajectory solidify?

The Ergodic Fallacy:
Remember: The average outcome tells you nothing about any individual journey.
Each path creates its own possibility space.

Real Examples:
- Startup success: Survivorship bias hides path dependence
- Career trajectories: Individual timing beats statistics
- Investment returns: One outlier changes everything
- Innovation adoption: Early users != mass market

⚠️ Medium Reflexivity: Trajectory analysis shapes strategic thinking.

Output: Path analysis showing divergence points and enablers`,

      4: `⚠️ **Step 4: Early Warning Extraction**

Identifying emerging changes for: "${problem}"

Extract early warning signals from anecdotal evidence.

Focus on these warning elements:
${elements.map(e => `• ${e}`).join('\n')}

Early Warning Indicators:
1. **Precedent Violations**: First time we've seen X
2. **Assumption Breaks**: Y is no longer true
3. **New Combinations**: A + B creating unexpected C
4. **Behavioral Shifts**: People starting to Z
5. **Technology Enablers**: Now possible because of...

Warning Signal Types:
| Signal Type | What It Reveals | Action Required |
|------------|-----------------|-----------------|
| Leading indicator | Change starting | Prepare now |
| Weak signal | Possible future | Monitor closely |
| Wild card | Low probability, high impact | Contingency plan |
| Trend break | Discontinuity ahead | Strategic pivot |
| Cascade trigger | System change coming | Position early |

Historical Early Warnings from Anecdotes:
- Napster users → Music industry transformation
- Early Tesla buyers → EV revolution
- Zoom fatigue stories → Hybrid work future
- Toilet paper hoarding → Supply chain fragility

Critical Questions:
- What assumption does this anecdote violate?
- What would need to be true for this to scale?
- Who would be most threatened by this change?
- What adjacent changes might this trigger?

⚠️ Medium Reflexivity: Recognition creates preparedness obligations.

Output: Early warning signals with monitoring recommendations`,

      5: `🔮 **Step 5: Scaling Projection**

Projecting mainstream adoption for: "${problem}"

Model what happens if outlier behaviors become widespread.

Project across these dimensions:
${elements.map(e => `• ${e}`).join('\n')}

Scaling Scenario Framework:
1. **Linear Scaling**: X% adopt gradually
2. **Tipping Point**: Sudden cascade after threshold
3. **Network Effects**: Exponential value creation
4. **Substitution**: Replaces existing solution
5. **Transformation**: Changes entire system

Impact Modeling:
| Adoption Level | System Impact | Probability | Timeframe |
|---------------|--------------|-------------|-----------|
| 1% (Early) | Invisible | High | 1 year |
| 10% (Growing) | Noticeable | Medium | 2-3 years |
| 25% (Tipping) | Disruptive | Medium | 3-5 years |
| 50% (Mainstream) | Transformative | Low | 5-10 years |

Barriers to Scaling:
- Technical limitations
- Economic constraints
- Regulatory hurdles
- Cultural resistance
- Infrastructure needs

Enablers for Scaling:
- Technology improvements
- Cost reductions
- Network effects
- Social proof
- Crisis catalysts

Good Guess + Empirical Observation = Science (Rule 7):
Test counterintuitive hypotheses with the cheapest possible experiment.
Don't wait for perfect data — a good guess validated by a quick observation
is more valuable than a rigorous study that arrives too late.
Ask: "What's the fastest, cheapest way to test if this outlier is a signal?"

Real Scaling Examples:
- Remote work: Fringe → Mainstream (COVID catalyst)
- Smartphones: Luxury → Necessity (10 years)
- Social media: Youth → All ages (15 years)
- Electric vehicles: Enthusiast → Mass market (ongoing)

⚠️ High Reflexivity: Projections influence investment and strategy.

Output: Scaling scenarios with probabilities and timelines`,

      6: `🎯 **Step 6: Strategic Response**

Developing strategy based on anecdotal intelligence for: "${problem}"

Create strategic options based on weak signal analysis.

Design response across:
${elements.map(e => `• ${e}`).join('\n')}

Strategic Response Options:
1. **Early Mover**: Invest now, capture advantage
2. **Fast Follower**: Prepare to move quickly
3. **Hedge Position**: Small bets, multiple options
4. **Monitor & Wait**: Track signals, defer commitment
5. **Defensive**: Protect against disruption

Response Strategy Framework:
| Signal Strength | Scaling Probability | Recommended Response |
|----------------|--------------------|--------------------|
| Strong | High | Early mover |
| Strong | Low | Hedge position |
| Weak | High | Monitor closely |
| Weak | Low | Awareness only |

Implementation Tactics:
- **Experimentation**: Small tests of anecdotal insights
- **Capability Building**: Develop skills for possible future
- **Network Positioning**: Connect with early movers
- **Scenario Planning**: Prepare for multiple futures
- **Option Creation**: Preserve flexibility

Monitoring Systems:
- Set up anecdote collection processes
- Create weak signal dashboards
- Establish early warning triggers
- Build sensing networks
- Regular trajectory reviews

Success Criteria:
- Caught change before competitors
- Positioned advantageously
- Avoided disruption
- Captured new opportunities
- Maintained adaptability

⚠️ High Reflexivity: Strategic choices based on weak signals shape organizational future.

Output: Complete strategic response plan with monitoring systems`,
    };

    return (
      guidanceTemplates[step] || `Complete the Anecdotal Signal Detection process for: "${problem}"`
    );
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Step 2: Validate signal assessment
    if (step === 2 && data && typeof data === 'object' && 'signals' in data) {
      const signals = data.signals;
      if (!Array.isArray(signals)) {
        return false;
      }
      return signals.every((signal: unknown) => {
        if (typeof signal !== 'object' || !signal) return false;
        const signalObj = signal as Record<string, unknown>;
        const validDivergence = ['minor', 'moderate', 'significant', 'extreme'].includes(
          signalObj.divergenceLevel as string
        );
        const validStrength = ['weak', 'moderate', 'strong', 'critical'].includes(
          signalObj.signalStrength as string
        );
        const validPrecedent = ['first', 'rare', 'emerging', 'recurring'].includes(
          signalObj.precedentType as string
        );
        return (
          typeof signalObj.story === 'string' && validDivergence && validStrength && validPrecedent
        );
      });
    }

    // Step 5: Validate scaling projections
    if (step === 5 && data && typeof data === 'object' && 'scalingScenarios' in data) {
      const scenarios = data.scalingScenarios;
      if (!Array.isArray(scenarios)) {
        return false;
      }
      return scenarios.every((scenario: unknown) => {
        if (typeof scenario === 'object' && scenario !== null) {
          const scenarioObj = scenario as Record<string, unknown>;
          return (
            typeof scenarioObj.adoptionLevel === 'number' &&
            scenarioObj.adoptionLevel >= 0 &&
            scenarioObj.adoptionLevel <= 100
          );
        }
        return false;
      });
    }

    return true;
  }

  /**
   * Report what each step actually recorded, labelled by the step.
   *
   * Keyed on `entry.currentStep`, not on position in the array: `execute`
   * appends a history entry for every call including revisions, so one revision
   * shifts every later entry. Keying on the step also means a revision
   * supersedes the entry it revises rather than reporting twice.
   */
  extractInsights(history: unknown[]): string[] {
    const totalSteps = this.steps.length;
    const latestByStep = new Map<number, Record<string, unknown>>();

    history.forEach((entry, index) => {
      if (typeof entry !== 'object' || entry === null) {
        return;
      }
      const entryObj = entry as Record<string, unknown>;
      // Fall back to position only when the caller sent no step number.
      const step = typeof entryObj.currentStep === 'number' ? entryObj.currentStep : index + 1;
      if (step >= 1 && step <= totalSteps) {
        latestByStep.set(step, entryObj);
      }
    });

    const insights: string[] = [];

    for (let step = 1; step <= totalSteps; step++) {
      const entryObj = latestByStep.get(step);
      if (!entryObj) {
        continue;
      }
      const stepName = this.steps[step - 1]?.name;
      if (!stepName) {
        continue;
      }

      const output = typeof entryObj.output === 'string' ? entryObj.output.trim() : '';
      if (output) {
        const summary = firstSentence(output);
        if (summary.length > 0) {
          insights.push(`${stepName}: ${summary}`);
        }
      }

      // Each structured field belongs to one step; report it there.
      if (step === 1 && typeof entryObj.anecdoteCount === 'number' && entryObj.anecdoteCount > 0) {
        insights.push(`${stepName}: Collected ${entryObj.anecdoteCount} significant anecdotes`);
      }

      if (step === 2 && Array.isArray(entryObj.signals)) {
        const strongSignals = entryObj.signals.filter((s: unknown) => {
          if (typeof s === 'object' && s !== null) {
            const signalObj = s as AnecdotalSignal;
            return signalObj.signalStrength === 'strong' || signalObj.signalStrength === 'critical';
          }
          return false;
        });
        if (strongSignals.length > 0) {
          insights.push(
            `${stepName}: Identified ${strongSignals.length} strong signals from anecdotal evidence — ${strongSignals
              .map(s => (s as AnecdotalSignal).story)
              .filter(story => typeof story === 'string' && story.length > 0)
              .join(', ')}`
          );
        }
      }

      if (step === 3) {
        // Report the trajectories that were recorded, not a constant asserting
        // that they are non-ergodic — the constant said that whatever the data.
        const trajectories = describeStructuredField(entryObj.trajectoryAnalysis);
        if (trajectories.length > 0) {
          insights.push(`${stepName}: ${trajectories}`);
        }
      }

      if (step === 4 && Array.isArray(entryObj.earlyWarnings)) {
        const warnings = describeStructuredField(entryObj.earlyWarnings);
        if (entryObj.earlyWarnings.length > 0) {
          insights.push(
            `${stepName}: ${entryObj.earlyWarnings.length} early warning signals extracted — ${warnings}`
          );
        }
      }

      if (step === 5 && Array.isArray(entryObj.scalingScenarios)) {
        const scenarios = describeStructuredField(entryObj.scalingScenarios);
        if (scenarios.length > 0) {
          insights.push(`${stepName}: ${scenarios}`);
        }
        const mainstream = entryObj.scalingScenarios.filter((s: unknown) => {
          if (typeof s === 'object' && s !== null) {
            const scenarioObj = s as Record<string, unknown>;
            return typeof scenarioObj.adoptionLevel === 'number' && scenarioObj.adoptionLevel > 25;
          }
          return false;
        });
        if (mainstream.length > 0) {
          insights.push(
            `${stepName}: ${mainstream.length} projection(s) cross mainstream adoption (>25%)`
          );
        }
      }

      if (step === 6) {
        const response = describeStructuredField(entryObj.strategicResponse);
        if (response.length > 0) {
          insights.push(`${stepName}: ${response}`);
        }
      }
    }

    // No completion banner. Reaching the last step is already visible from the
    // step count, and a fixed string asserts a finding the session never made —
    // "competitive advantage identified", "future insights extracted" — whatever
    // the steps actually said.

    return insights;
  }
}
