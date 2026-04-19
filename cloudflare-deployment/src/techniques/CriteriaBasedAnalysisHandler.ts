/**
 * Criteria-Based Analysis technique handler
 *
 * A 5-step technique for evaluating authenticity and validity
 * based on established criteria from deception detection research
 */

import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface CriteriaStep extends StepInfo {
  criteria?: string[];
  assessmentType?: string;
}

export class CriteriaBasedAnalysisHandler extends BaseTechniqueHandler {
  private readonly steps: CriteriaStep[] = [
    {
      name: 'Baseline Assessment',
      focus: 'Establish normal patterns and expected characteristics',
      emoji: '🎯',
      type: 'thinking',
      criteria: [
        'What does truth look like in this context?',
        'What are normal patterns for this domain?',
        'What are context-specific validity markers?',
        'What baseline expectations should we establish?',
      ],
      assessmentType: 'reference',
    },
    {
      name: 'Cognitive Criteria Analysis',
      focus: 'Evaluate logical consistency and detail richness',
      emoji: '🧠',
      type: 'thinking',
      criteria: [
        'Is there logical consistency throughout?',
        'Are there unexpected complications that add credibility?',
        'Are there appropriate self-corrections?',
        'Is uncertainty acknowledged appropriately?',
        'Is the level of detail consistent with genuine experience?',
      ],
      assessmentType: 'cognitive',
    },
    {
      name: 'Motivational Analysis',
      focus: 'Examine incentives and potential biases',
      emoji: '💭',
      type: 'thinking',
      criteria: [
        'What incentives might influence this?',
        'Which stakeholder interests are present?',
        'Are there self-serving elements?',
        'What biases might be operating?',
        'What pressures could distort truth?',
      ],
      assessmentType: 'motivational',
      reflexiveEffects: {
        triggers: ['Identifying stakeholder motivations'],
        realityChanges: ['Understanding of incentive structures'],
        futureConstraints: ['Must consider revealed motivations in future analysis'],
        reversibility: 'medium',
      },
    },
    {
      name: 'Reality Monitoring',
      focus: 'Distinguish experienced vs. imagined elements',
      emoji: '🔍',
      type: 'action',
      criteria: [
        'Are sensory details present and consistent?',
        'Are contextual details verifiable?',
        'Can elements be cross-referenced with external sources?',
        'Are there signs of fabrication or imagination?',
        'Do details match known reality constraints?',
      ],
      assessmentType: 'reality',
      reflexiveEffects: {
        triggers: ['Active verification of claims', 'External source checking'],
        realityChanges: ['Commitment to specific reality model', 'Trust relationships affected'],
        futureConstraints: ['Verification standards established', 'Must maintain consistency'],
        reversibility: 'low',
      },
    },
    {
      name: 'Validity Synthesis',
      focus: 'Integrate findings into confidence assessment',
      emoji: '✅',
      type: 'action',
      criteria: [
        'What is the overall confidence level?',
        'What uncertainty bounds exist?',
        'Which factors are path-dependent?',
        'What validity score emerges?',
        'What actions does this assessment support?',
      ],
      assessmentType: 'synthesis',
      reflexiveEffects: {
        triggers: ['Final validity determination', 'Confidence scoring'],
        realityChanges: ['Decision commitment based on assessment', 'Trust levels established'],
        futureConstraints: [
          'Must act consistent with validity findings',
          'Assessment becomes precedent',
        ],
        reversibility: 'low',
      },
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Criteria-Based Analysis',
      emoji: '🔬',
      totalSteps: 5,
      description: 'Systematic evaluation of authenticity and validity using established criteria',
      focus: 'Truth verification through multi-criteria assessment',
      enhancedFocus: 'Reduces cognitive biases and provides structured approach to validation',
      parallelSteps: {
        canParallelize: false,
        description: 'Steps must be sequential as each builds on previous findings',
      },
      reflexivityProfile: {
        primaryCommitmentType: 'structural',
        overallReversibility: 'medium',
        riskLevel: 'low',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    if (step < 1 || step > this.steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Criteria-Based Analysis. Valid steps are 1-${this.steps.length}`,
        'step',
        { received: step, expected: `1-${this.steps.length}` }
      );
    }
    return this.steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    const stepInfo = this.getStepInfo(step) as CriteriaStep;
    const criteria = stepInfo.criteria || [];

    const guidanceTemplates: Record<number, string> = {
      1: `🎯 **Step 1: Baseline Assessment**

For the problem: "${problem}"

Establish what "truth" and validity look like in this specific context. This creates your reference framework.

Consider these criteria:
${criteria.map(c => `• ${c}`).join('\n')}

Key Actions:
1. Map normal patterns for this domain
2. Identify context-specific validity markers  
3. Document expected characteristics
4. Note any domain-specific truth indicators

Output: A clear baseline of what valid/true looks like in this context`,

      2: `🧠 **Step 2: Cognitive Criteria Analysis**

Evaluating: "${problem}"

Analyze the logical consistency and cognitive markers of the information or solution.

Apply these cognitive criteria:
${criteria.map(c => `• ${c}`).join('\n')}

Key Markers to Assess:
- Detail richness and specificity
- Logical flow and consistency
- Presence of unexpected complications
- Appropriate uncertainty acknowledgment
- Self-corrections that add credibility

Output: Cognitive validity assessment with specific evidence`,

      3: `💭 **Step 3: Motivational Analysis**

Context: "${problem}"

Examine the incentive structures and potential biases that could influence validity.

Investigate these motivational factors:
${criteria.map(c => `• ${c}`).join('\n')}

Consider:
- Stakeholder interests and pressures
- Self-serving elements or spin
- Cognitive biases that might operate
- External pressures that could distort

⚠️ Medium Reflexivity: Understanding motivations changes how you interpret everything else.

Output: Map of incentives and biases affecting validity`,

      4: `🔍 **Step 4: Reality Monitoring**

Verifying: "${problem}"

Distinguish between experienced reality and imagined/fabricated elements through active verification.

Apply reality monitoring criteria:
${criteria.map(c => `• ${c}`).join('\n')}

Verification Actions:
- Check sensory and contextual details
- Cross-reference with external sources
- Verify against known constraints
- Look for fabrication indicators

⚠️ High Reflexivity: This step commits you to a specific reality model that affects trust relationships.

Output: Reality verification results with confidence levels`,

      5: `✅ **Step 5: Validity Synthesis**

Final assessment for: "${problem}"

Integrate all findings into a comprehensive validity assessment with actionable conclusions.

Synthesize using these criteria:
${criteria.map(c => `• ${c}`).join('\n')}

Final Assessment Should Include:
- Overall validity score (0-100%)
- Confidence bounds (±%)
- Path-dependent factors identified
- Specific recommendations based on validity
- Risk assessment of acting on this information

⚠️ High Reflexivity: Your synthesis creates decision commitment and becomes precedent for future assessments.

Output: Complete validity assessment with confidence score and recommendations`,
    };

    return guidanceTemplates[step] || `Step ${step}: ${stepInfo.name}\n\nFocus: ${stepInfo.focus}`;
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Additional validation for specific steps
    if (step === 5 && data && typeof data === 'object' && 'validityScore' in data) {
      const validityScore = (data as { validityScore?: unknown }).validityScore;
      // Ensure validity score is between 0 and 100
      return typeof validityScore === 'number' && validityScore >= 0 && validityScore <= 100;
    }

    return true;
  }

  extractInsights(history: Array<{ output?: string; validityScore?: number }>): string[] {
    const insights: string[] = [];

    history.forEach((entry, index) => {
      if (entry.output) {
        // Extract key findings from each step
        const stepNumber = index + 1;
        const stepName = this.steps[index]?.name || `Step ${stepNumber}`;

        // Look for validity indicators
        if (entry.output.toLowerCase().includes('consistent')) {
          insights.push(`${stepName}: Consistency indicators found`);
        }
        if (
          entry.output.toLowerCase().includes('inconsistent') ||
          entry.output.toLowerCase().includes('contradiction')
        ) {
          insights.push(`${stepName}: Inconsistencies detected`);
        }
        if (entry.validityScore !== undefined) {
          insights.push(`Validity Score: ${entry.validityScore}%`);
        }
      }
    });

    // Add summary insight if we have enough data
    if (history.length >= this.steps.length) {
      const finalEntry = history[history.length - 1];
      if (finalEntry.validityScore !== undefined) {
        const score = finalEntry.validityScore;
        if (score >= 80) {
          insights.push('High validity - Strong confidence in findings');
        } else if (score >= 60) {
          insights.push('Moderate validity - Proceed with appropriate caution');
        } else if (score >= 40) {
          insights.push('Low validity - Significant concerns identified');
        } else {
          insights.push('Very low validity - Major red flags present');
        }
      }
    }

    return insights;
  }
}
