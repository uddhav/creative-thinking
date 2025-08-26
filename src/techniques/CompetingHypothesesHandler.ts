/**
 * Competing Hypotheses Analysis technique handler
 *
 * An 8-step structured analytical technique for evaluating multiple
 * competing explanations using evidence matrices and Bayesian reasoning
 */

import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface HypothesisStep extends StepInfo {
  analysisType?: string;
  matrixElements?: string[];
}

export interface EvidenceHypothesisMatrix {
  hypotheses: string[];
  evidence: string[];
  ratings: { [key: string]: number }; // evidence_hypothesis -> rating (-2 to +2)
  diagnosticValue: { [evidence: string]: number }; // 0-1 scale
  probabilities: { [hypothesis: string]: number }; // posterior probabilities
}

export class CompetingHypothesesHandler extends BaseTechniqueHandler {
  private readonly steps: HypothesisStep[] = [
    {
      name: 'Hypothesis Generation',
      focus: 'Create multiple competing explanations',
      emoji: '💡',
      type: 'thinking',
      analysisType: 'generation',
      matrixElements: [
        'Primary hypothesis',
        'Alternative explanations',
        'Null hypothesis',
        'Deception scenario',
        'Black swan possibility',
      ],
    },
    {
      name: 'Evidence Mapping',
      focus: 'List all available evidence',
      emoji: '📊',
      type: 'thinking',
      analysisType: 'evidence',
      matrixElements: [
        'Direct evidence',
        'Circumstantial evidence',
        'Absence of evidence',
        'Evidence quality/source',
        'Evidence reliability',
      ],
    },
    {
      name: 'Matrix Construction',
      focus: 'Build evidence-hypothesis compatibility matrix',
      emoji: '🔳',
      type: 'action',
      analysisType: 'matrix',
      matrixElements: [
        'Evidence-hypothesis pairs',
        'Compatibility ratings (--, -, 0, +, ++)',
        'Diagnostic evidence identification',
        'Evidence independence check',
        'Matrix completeness',
      ],
      reflexiveEffects: {
        triggers: ['Matrix structure creation', 'Evidence-hypothesis linking'],
        realityChanges: ['Analysis framework established', 'Commitment to evidence set'],
        futureConstraints: ['Must work within matrix structure', 'Evidence relationships fixed'],
        reversibility: 'medium',
      },
    },
    {
      name: 'Diagnostic Value Assessment',
      focus: 'Identify evidence that discriminates between hypotheses',
      emoji: '🎯',
      type: 'thinking',
      analysisType: 'diagnostic',
      matrixElements: [
        'High-value discriminators',
        'Evidence uniqueness',
        'Hypothesis differentiation power',
        'Critical evidence gaps',
        'Evidence priority ranking',
      ],
      reflexiveEffects: {
        triggers: ['Identifying key discriminators', 'Evidence weighting'],
        realityChanges: ['Focus shifts to diagnostic evidence', 'Investigation priorities set'],
        futureConstraints: ['Must pursue high-value evidence', 'Resource allocation committed'],
        reversibility: 'medium',
      },
    },
    {
      name: 'Deception Scenario Modeling',
      focus: 'Consider active manipulation possibilities',
      emoji: '🎭',
      type: 'action',
      analysisType: 'deception',
      matrixElements: [
        'Manipulation scenarios',
        'Planted evidence possibilities',
        'Misdirection patterns',
        'Adversarial strategies',
        'Deception indicators',
      ],
      reflexiveEffects: {
        triggers: ['Adversarial thinking', 'Trust model adjustment'],
        realityChanges: ['Trust landscape transformed', 'Paranoia vs naivety balance'],
        futureConstraints: [
          'Must consider manipulation in all evidence',
          'Verification requirements increase',
        ],
        reversibility: 'low',
      },
    },
    {
      name: 'Bayesian Update',
      focus: 'Apply probabilistic reasoning to hypotheses',
      emoji: '📈',
      type: 'action',
      analysisType: 'bayesian',
      matrixElements: [
        'Prior probabilities',
        'Likelihood ratios',
        'Posterior probabilities',
        'Confidence intervals',
        'Probability distributions',
      ],
      reflexiveEffects: {
        triggers: ['Probability commitment', 'Quantified beliefs'],
        realityChanges: ['Beliefs become numerical', 'Uncertainty quantified'],
        futureConstraints: [
          'Must act consistent with probabilities',
          'Updates require justification',
        ],
        reversibility: 'low',
      },
    },
    {
      name: 'Sensitivity Analysis',
      focus: 'Test robustness to evidence changes',
      emoji: '🔄',
      type: 'thinking',
      analysisType: 'sensitivity',
      matrixElements: [
        'Critical assumptions',
        'Evidence fragility',
        'Conclusion stability',
        'Tipping points',
        'Uncertainty bounds',
      ],
      reflexiveEffects: {
        triggers: ['Identifying fragility points', 'Testing robustness'],
        realityChanges: ['Understanding of conclusion strength', 'Awareness of vulnerabilities'],
        futureConstraints: ['Must monitor sensitive factors', 'Contingency planning required'],
        reversibility: 'medium',
      },
    },
    {
      name: 'Decision Synthesis',
      focus: 'Integrate analysis into actionable recommendation',
      emoji: '✅',
      type: 'action',
      analysisType: 'synthesis',
      matrixElements: [
        'Leading hypothesis',
        'Confidence level',
        'Key uncertainties',
        'Action recommendations',
        'Monitoring requirements',
      ],
      reflexiveEffects: {
        triggers: ['Final decision', 'Action commitment'],
        realityChanges: ['Decision path selected', 'Resources committed'],
        futureConstraints: ['Must act on recommendations', 'Reputation tied to outcome'],
        reversibility: 'low',
      },
    },
  ];

  private readonly ratingScale = {
    '--': -2, // Strongly inconsistent
    '-': -1, // Somewhat inconsistent
    '0': 0, // Neutral/irrelevant
    '+': 1, // Somewhat consistent
    '++': 2, // Strongly consistent
  };

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Competing Hypotheses Analysis',
      emoji: '⚖️',
      totalSteps: 8,
      description:
        'Systematic evaluation of multiple explanations using evidence matrices and Bayesian reasoning',
      focus: 'Rigorous hypothesis testing to reduce confirmation bias and handle uncertainty',
      enhancedFocus:
        'Prevents premature convergence and quantifies confidence in complex decisions',
      parallelSteps: {
        canParallelize: false,
        description: 'Sequential analysis required as each step builds on previous findings',
      },
      reflexivityProfile: {
        primaryCommitmentType: 'structural',
        overallReversibility: 'low',
        riskLevel: 'medium',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    if (step < 1 || step > this.steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Competing Hypotheses. Valid steps are 1-${this.steps.length}`,
        'step',
        { received: step, expected: `1-${this.steps.length}` }
      );
    }
    return this.steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    const stepInfo = this.getStepInfo(step) as HypothesisStep;
    const elements = stepInfo.matrixElements || [];

    const guidanceTemplates: Record<number, string> = {
      1: `💡 **Step 1: Hypothesis Generation**

Problem to explain: "${problem}"

Generate a comprehensive set of competing explanations. Don't converge prematurely - include unlikely but possible scenarios.

Create these hypothesis types:
${elements.map(e => `• ${e}`).join('\n')}

Generation Guidelines:
1. Start with the most obvious explanation
2. Add 2-3 strong alternatives
3. Include a null hypothesis (no effect/random chance)
4. Consider deception/manipulation scenario
5. Add a black swan (low probability, high impact)

Good Hypotheses Are:
- Mutually exclusive (only one can be true)
- Collectively exhaustive (cover all possibilities)
- Testable with available/obtainable evidence
- Sufficiently detailed to generate predictions

Output: List of 4-6 competing hypotheses with clear distinctions`,

      2: `📊 **Step 2: Evidence Mapping**

Context: "${problem}"

Create a comprehensive inventory of all available evidence. Remember: absence of evidence is also evidence.

Map these evidence categories:
${elements.map(e => `• ${e}`).join('\n')}

Evidence Collection:
1. List all direct evidence (observations, data, facts)
2. Include circumstantial evidence
3. Note what's missing (dog that didn't bark)
4. Rate evidence quality (High/Medium/Low)
5. Document evidence source and reliability

Evidence Quality Factors:
- Source credibility
- Corroboration level
- Directness vs inference
- Temporal relevance
- Potential for manipulation

Output: Complete evidence inventory with quality ratings`,

      3: `🔳 **Step 3: Matrix Construction**

Building matrix for: "${problem}"

Create the evidence-hypothesis compatibility matrix to systematically evaluate each piece of evidence against each hypothesis.

Construct matrix with:
${elements.map(e => `• ${e}`).join('\n')}

Rating Scale:
• ++ : Strongly consistent (evidence strongly supports hypothesis)
• +  : Somewhat consistent (evidence mildly supports)
• 0  : Neutral/irrelevant (no bearing on hypothesis)
• -  : Somewhat inconsistent (evidence mildly contradicts)
• -- : Strongly inconsistent (evidence strongly contradicts)

Matrix Building:
1. Create rows for each piece of evidence
2. Create columns for each hypothesis
3. Rate each evidence-hypothesis intersection
4. Identify diagnostic evidence (differentiates hypotheses)
5. Check evidence independence

⚠️ Medium Reflexivity: Matrix structure constrains all subsequent analysis.

Output: Complete evidence-hypothesis matrix with all cells rated`,

      4: `🎯 **Step 4: Diagnostic Value Assessment**

Analyzing discriminatory power for: "${problem}"

Identify which evidence best discriminates between competing hypotheses. Focus resources on high-value evidence.

Assess these diagnostic factors:
${elements.map(e => `• ${e}`).join('\n')}

Diagnostic Value Calculation:
1. Find evidence that rates differently across hypotheses
2. Calculate discrimination score (variance in ratings)
3. Identify unique evidence (supports only one hypothesis)
4. Note critical evidence gaps
5. Prioritize evidence collection needs

High Diagnostic Value:
- Evidence rates ++ for one hypothesis, -- for others
- Uniquely supports/refutes specific hypotheses
- Would definitively rule in/out explanations
- Cannot be explained away easily

⚠️ Medium Reflexivity: This assessment drives investigation priorities.

Output: Ranked list of evidence by diagnostic value with collection priorities`,

      5: `🎭 **Step 5: Deception Scenario Modeling**

Adversarial analysis for: "${problem}"

Consider how evidence might be manipulated or planted. Think like an adversary trying to mislead your analysis.

Model these deception elements:
${elements.map(e => `• ${e}`).join('\n')}

Deception Analysis:
1. Identify evidence that could be faked/planted
2. Consider misdirection strategies
3. Evaluate evidence timing (too convenient?)
4. Look for patterns too perfect to be natural
5. Assess manipulation cost/difficulty

Red Team Questions:
- If someone wanted us to believe X, what evidence would they plant?
- What evidence is surprisingly absent?
- Are there patterns suggesting orchestration?
- What would be hardest to fake?

⚠️ High Reflexivity: Considering deception fundamentally changes trust models.

Output: Deception vulnerability assessment with revised evidence reliability`,

      6: `📈 **Step 6: Bayesian Update**

Probability calculation for: "${problem}"

Apply Bayesian reasoning to calculate posterior probabilities for each hypothesis based on evidence.

Calculate these probability elements:
${elements.map(e => `• ${e}`).join('\n')}

Bayesian Process:
1. Assign prior probabilities to hypotheses (before evidence)
2. Calculate likelihood ratios for key evidence
3. Apply Bayes' theorem for posterior probabilities
4. Include confidence intervals
5. Document probability shifts from priors

Probability Guidelines:
- Priors: Based on base rates and domain knowledge
- Likelihoods: P(evidence | hypothesis)
- Avoid: Precision bias (false precision in estimates)
- Include: Uncertainty ranges

Example: If P(H1)=0.3 initially, and evidence E is 5x more likely under H1 than H2, update accordingly.

⚠️ High Reflexivity: Numerical probabilities create strong decision anchors.

Output: Posterior probability distribution across all hypotheses`,

      7: `🔄 **Step 7: Sensitivity Analysis**

Robustness testing for: "${problem}"

Test how sensitive your conclusions are to changes in evidence or assumptions. Identify fragility points.

Test these sensitivity factors:
${elements.map(e => `• ${e}`).join('\n')}

Sensitivity Tests:
1. Remove highest-impact evidence - do conclusions hold?
2. Flip uncertain evidence ratings - what changes?
3. Adjust prior probabilities - how much shift?
4. Identify tipping points (small changes, big effects)
5. Calculate confidence bounds on conclusions

Key Questions:
- Which single piece of evidence could reverse our conclusion?
- What assumptions are we most dependent on?
- How much evidence change would alter the leading hypothesis?
- Where are we most vulnerable to error?

⚠️ Medium Reflexivity: Understanding fragility shapes confidence and contingency planning.

Output: Sensitivity report with critical dependencies and confidence bounds`,

      8: `✅ **Step 8: Decision Synthesis**

Final recommendation for: "${problem}"

Integrate all analysis into a clear, actionable recommendation with appropriate caveats and monitoring plan.

Synthesize these decision elements:
${elements.map(e => `• ${e}`).join('\n')}

Decision Framework:
1. State leading hypothesis with probability
2. Provide confidence level (High/Medium/Low)
3. List key uncertainties and assumptions
4. Recommend specific actions
5. Define monitoring/update triggers

Recommendation Structure:
- Primary Conclusion: [Hypothesis X at Y% probability]
- Confidence: [Level with justification]
- Critical Uncertainties: [Top 2-3 unknowns]
- Recommended Actions: [Specific next steps]
- Monitoring Plan: [What to watch, when to reassess]

Decision Rule:
- >80% probability: Act on leading hypothesis
- 60-80%: Act with hedging/contingencies
- 40-60%: Gather more diagnostic evidence
- <40%: Maintain watchful waiting

⚠️ High Reflexivity: Decision commits resources and reputation to chosen path.

Output: Complete decision package with conclusion, confidence, actions, and monitoring plan`,
    };

    return guidanceTemplates[step] || `Step ${step}: ${stepInfo.name}\n\nFocus: ${stepInfo.focus}`;
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Validate matrix structure if provided
    if (step === 3 && data && typeof data === 'object' && 'matrix' in data) {
      const matrix = (data as { matrix?: unknown }).matrix;
      return this.validateMatrix(matrix);
    }

    // Validate probabilities sum to approximately 1
    if (step === 6 && data && typeof data === 'object' && 'probabilities' in data) {
      const probabilities = (data as { probabilities?: unknown }).probabilities;
      if (typeof probabilities === 'object' && probabilities !== null) {
        const sum = Object.values(probabilities as Record<string, number>).reduce(
          (a, b) => a + b,
          0
        );
        return Math.abs(sum - 1.0) < 0.01; // Allow small rounding errors
      }
      return false;
    }

    return true;
  }

  private validateMatrix(matrix: unknown): boolean {
    if (!matrix || typeof matrix !== 'object') return false;

    const m = matrix as { hypotheses?: unknown; evidence?: unknown; ratings?: unknown };

    if (!m.hypotheses || !Array.isArray(m.hypotheses)) return false;
    if (!m.evidence || !Array.isArray(m.evidence)) return false;
    if (!m.ratings || typeof m.ratings !== 'object' || m.ratings === null) return false;

    // Validate ratings are in correct range
    for (const rating of Object.values(m.ratings)) {
      if (typeof rating !== 'number' || rating < -2 || rating > 2) {
        return false;
      }
    }

    return true;
  }

  extractInsights(
    history: Array<{
      output?: string;
      matrix?: EvidenceHypothesisMatrix;
      probabilities?: Record<string, number>;
      leadingHypothesis?: string;
    }>
  ): string[] {
    const insights: string[] = [];

    history.forEach((entry, index) => {
      if (entry.output) {
        const stepNumber = index + 1;
        const stepName = this.steps[index]?.name || `Step ${stepNumber}`;

        // Extract hypothesis-specific insights
        if (entry.matrix?.hypotheses) {
          insights.push(
            `${stepName}: Evaluating ${entry.matrix.hypotheses.length} competing hypotheses`
          );
        }

        if (entry.probabilities) {
          const sorted = Object.entries(entry.probabilities).sort(([, a], [, b]) => b - a);
          if (sorted.length > 0) {
            const [leading, prob] = sorted[0];
            insights.push(`Leading hypothesis: ${leading} (${(prob * 100).toFixed(1)}%)`);
          }
        }

        if (entry.leadingHypothesis) {
          insights.push(`Decision: ${entry.leadingHypothesis}`);
        }
      }
    });

    // Add final insight about decision confidence
    if (history.length >= this.steps.length) {
      const finalEntry = history[history.length - 1];
      if (finalEntry.probabilities) {
        const probs = Object.values(finalEntry.probabilities);
        const maxProb = Math.max(...probs);

        if (maxProb > 0.8) {
          insights.push('High confidence - Strong evidence for leading hypothesis');
        } else if (maxProb > 0.6) {
          insights.push('Moderate confidence - Leading hypothesis likely but not certain');
        } else if (maxProb > 0.4) {
          insights.push('Low confidence - Multiple plausible hypotheses remain');
        } else {
          insights.push('Very low confidence - No hypothesis strongly supported');
        }
      }
    }

    return insights;
  }

  // Helper method to create empty matrix
  createEmptyMatrix(hypotheses: string[], evidence: string[]): EvidenceHypothesisMatrix {
    const matrix: EvidenceHypothesisMatrix = {
      hypotheses,
      evidence,
      ratings: {},
      diagnosticValue: {},
      probabilities: {},
    };

    // Initialize with neutral ratings
    for (const e of evidence) {
      for (const h of hypotheses) {
        matrix.ratings[`${e}_${h}`] = 0;
      }
      matrix.diagnosticValue[e] = 0;
    }

    // Initialize with uniform probabilities
    const uniformProb = 1.0 / hypotheses.length;
    for (const h of hypotheses) {
      matrix.probabilities[h] = uniformProb;
    }

    return matrix;
  }
}
