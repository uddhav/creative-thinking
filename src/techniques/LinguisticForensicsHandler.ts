/**
 * Linguistic Forensics technique handler
 *
 * A 6-step technique for analyzing communication patterns to reveal
 * hidden insights, cognitive states, and authenticity markers
 */

import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface LinguisticStep extends StepInfo {
  markers?: string[];
  analysisType?: string;
}

export class LinguisticForensicsHandler extends BaseTechniqueHandler {
  private readonly steps: LinguisticStep[] = [
    {
      name: 'Content Mapping',
      focus: 'Identify key claims, statements, and assertions',
      emoji: '📝',
      type: 'thinking',
      markers: [
        'Main claims and assertions',
        'Supporting statements',
        'Qualifiers and hedges',
        'Omissions and gaps',
        'Repeated themes',
      ],
      analysisType: 'content',
    },
    {
      name: 'Pattern Recognition',
      focus: 'Detect linguistic markers and anomalies',
      emoji: '🔍',
      type: 'thinking',
      markers: [
        'Recurring linguistic structures',
        'Deviations from baseline',
        'Unusual word choices',
        'Pattern breaks',
        'Stylistic shifts',
      ],
      analysisType: 'patterns',
    },
    {
      name: 'Pronoun Analysis',
      focus: 'Examine psychological distance indicators',
      emoji: '👤',
      type: 'thinking',
      markers: [
        'I/we/they ratios',
        'Ownership patterns (my/our/their)',
        'Distancing language',
        'Pronoun drops',
        'Perspective shifts',
      ],
      analysisType: 'pronouns',
      reflexiveEffects: {
        triggers: ['Identifying relationship dynamics', 'Revealing psychological distance'],
        realityChanges: ["Understanding of speaker's relationship to content"],
        futureConstraints: ['Must consider revealed dynamics in interpretation'],
        reversibility: 'medium',
      },
    },
    {
      name: 'Complexity Assessment',
      focus: 'Evaluate cognitive load indicators',
      emoji: '🧩',
      type: 'action',
      markers: [
        'Lexical diversity',
        'Sentence complexity',
        'Cognitive load indicators',
        'Simplification under stress',
        'Abstract vs concrete language',
      ],
      analysisType: 'complexity',
      reflexiveEffects: {
        triggers: ['Measuring cognitive engagement', 'Assessing mental state'],
        realityChanges: ["Understanding of speaker's cognitive state"],
        futureConstraints: ['Future communication shaped by complexity findings'],
        reversibility: 'medium',
      },
    },
    {
      name: 'Emotional Profiling',
      focus: 'Analyze sentiment and affect patterns',
      emoji: '💬',
      type: 'action',
      markers: [
        'Emotional valence',
        'Affect intensity',
        'Emotional leakage',
        'Incongruence markers',
        'Emotional trajectory',
      ],
      analysisType: 'emotional',
      reflexiveEffects: {
        triggers: ['Emotional pattern identification', 'Affect assessment'],
        realityChanges: ['Emotional dynamics become visible', 'Trust affected by findings'],
        futureConstraints: ['Must respond to revealed emotional state'],
        reversibility: 'low',
      },
    },
    {
      name: 'Coherence Verification',
      focus: 'Check internal consistency across time',
      emoji: '✅',
      type: 'action',
      markers: [
        'Narrative consistency',
        'Temporal markers alignment',
        'Contradiction detection',
        'Gap identification',
        'Story evolution patterns',
      ],
      analysisType: 'coherence',
      reflexiveEffects: {
        triggers: ['Final coherence determination', 'Trust assessment'],
        realityChanges: ['Trust relationships established', 'Communication patterns set'],
        futureConstraints: ['Must maintain consistency with findings', 'Trust dynamics locked in'],
        reversibility: 'low',
      },
    },
  ];

  private readonly linguisticMarkers = {
    pronouns: {
      high_ownership: ['I', 'me', 'my', 'mine'],
      collective: ['we', 'us', 'our', 'ours'],
      distancing: ['they', 'them', 'their', 'theirs', 'one', 'someone'],
      avoidance: ['it', 'that', 'this', 'those'],
    },
    hedging: [
      'maybe',
      'perhaps',
      'possibly',
      'might',
      'could',
      'seems',
      'appears',
      'suggests',
      'somewhat',
      'rather',
      'quite',
      'fairly',
    ],
    certainty: [
      'definitely',
      'absolutely',
      'certainly',
      'obviously',
      'clearly',
      'undoubtedly',
      'surely',
      'must',
      'will',
      'always',
      'never',
    ],
    temporal: {
      past: ['was', 'were', 'had', 'did', 'used to', 'previously'],
      present: ['is', 'are', 'am', 'do', 'does', 'now', 'currently'],
      future: ['will', 'shall', 'going to', 'plan to', 'intend to'],
    },
    cognitive: [
      'think',
      'believe',
      'know',
      'understand',
      'realize',
      'remember',
      'forget',
      'imagine',
      'suppose',
      'assume',
      'wonder',
      'doubt',
    ],
    emotional: {
      positive: ['happy', 'glad', 'pleased', 'excited', 'wonderful', 'great'],
      negative: ['sad', 'angry', 'upset', 'worried', 'terrible', 'awful'],
      anxiety: ['nervous', 'anxious', 'worried', 'concerned', 'stressed'],
      surprise: ['surprised', 'shocked', 'amazed', 'unexpected', 'sudden'],
    },
  };

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Linguistic Forensics',
      emoji: '🔤',
      totalSteps: 6,
      description: 'Systematic analysis of communication patterns to reveal hidden insights',
      focus: 'Deep linguistic analysis for authenticity and cognitive state assessment',
      enhancedFocus: 'Reveals unstated motivations, cognitive load, and emotional patterns',
      parallelSteps: {
        canParallelize: false,
        description:
          'Sequential analysis required as each step builds on previous linguistic findings',
      },
      reflexivityProfile: {
        primaryCommitmentType: 'relationship',
        overallReversibility: 'medium',
        riskLevel: 'medium',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    if (step < 1 || step > this.steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Linguistic Forensics. Valid steps are 1-${this.steps.length}`,
        'step',
        { received: step, expected: `1-${this.steps.length}` }
      );
    }
    return this.steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    const stepInfo = this.getStepInfo(step) as LinguisticStep;
    const markers = stepInfo.markers || [];

    const guidanceTemplates: Record<number, string> = {
      1: `📝 **Step 1: Content Mapping**

Analyzing communication for: "${problem}"

Create a comprehensive inventory of the content, noting both what is said and what is omitted.

Map these content elements:
${markers.map(m => `• ${m}`).join('\n')}

Key Actions:
1. List all main claims and assertions
2. Identify supporting evidence provided
3. Note qualifiers, hedges, and caveats
4. Document what's conspicuously absent
5. Track recurring themes and emphasis

Cultural Note: Consider cultural communication styles that may affect directness.

Output: Complete content map with claims, support, and gaps identified`,

      2: `🔍 **Step 2: Pattern Recognition**

Text analysis for: "${problem}"

Identify linguistic patterns that reveal underlying cognitive and emotional states.

Detect these pattern types:
${markers.map(m => `• ${m}`).join('\n')}

Pattern Analysis:
1. Establish baseline communication style
2. Identify deviations and anomalies
3. Note unusual vocabulary or phrasing
4. Track style shifts between topics
5. Flag inconsistent language patterns

Look for:
- Sudden formality changes
- Vocabulary complexity shifts
- Repetitive structures
- Avoidance patterns

Output: Pattern analysis with anomalies and their potential significance`,

      3: `👤 **Step 3: Pronoun Analysis**

Psychological distance assessment for: "${problem}"

Examine pronoun usage to understand ownership, responsibility, and psychological distance.

Analyze these pronoun patterns:
${markers.map(m => `• ${m}`).join('\n')}

Key Ratios to Calculate:
- I/We ratio (individual vs collective thinking)
- Active/Passive pronoun use
- Ownership language frequency
- Distancing pronoun patterns
- Pronoun drops (avoidance)

Psychological Indicators:
- High "I" use: Personal involvement, ownership
- High "We" use: Collective identity, shared responsibility  
- High "They" use: Distancing, blame shifting
- Pronoun drops: Deception or discomfort

⚠️ Medium Reflexivity: Understanding these dynamics affects interpretation of all content.

Output: Pronoun analysis with psychological distance assessment`,

      4: `🧩 **Step 4: Complexity Assessment**

Cognitive load evaluation for: "${problem}"

Measure linguistic complexity to assess cognitive engagement and potential stress indicators.

Assess these complexity markers:
${markers.map(m => `• ${m}`).join('\n')}

Complexity Metrics:
1. Calculate average sentence length
2. Measure vocabulary diversity (unique words/total words)
3. Assess abstraction levels
4. Identify simplification patterns
5. Note cognitive load indicators

Stress Indicators:
- Shortened sentences under pressure
- Reduced vocabulary diversity
- Increased repetition
- Concrete vs abstract language shifts
- Cognitive overload markers

⚠️ Medium Reflexivity: Assessment affects how future communication will be structured.

Output: Complexity metrics with cognitive state interpretation`,

      5: `💬 **Step 5: Emotional Profiling**

Emotional pattern analysis for: "${problem}"

Map the emotional landscape through linguistic markers and sentiment patterns.

Profile these emotional dimensions:
${markers.map(m => `• ${m}`).join('\n')}

Emotional Analysis:
1. Track sentiment valence (positive/negative/neutral)
2. Measure affect intensity
3. Identify emotional leakage (unintended reveals)
4. Detect emotional incongruence
5. Map emotional trajectory over time

Key Indicators:
- Emotional vocabulary frequency
- Intensifiers and minimizers
- Emotional regulation patterns
- Authenticity markers
- Suppressed emotion indicators

⚠️ High Reflexivity: Profiling emotions influences trust and relationship dynamics.

Output: Emotional profile with trajectory and authenticity assessment`,

      6: `✅ **Step 6: Coherence Verification**

Final coherence check for: "${problem}"

Verify internal consistency and narrative coherence across all linguistic dimensions.

Verify these coherence factors:
${markers.map(m => `• ${m}`).join('\n')}

Coherence Checks:
1. Cross-reference temporal markers
2. Verify narrative consistency
3. Identify contradictions
4. Map story evolution
5. Assess overall coherence

Final Integration:
- Combine findings from all previous steps
- Generate coherence score (0-100%)
- Identify specific inconsistencies
- Assess deliberate vs unintentional patterns
- Provide confidence level in findings

⚠️ High Reflexivity: Coherence verdict shapes trust relationships and future interactions.

Output: Complete linguistic forensics report with coherence verdict and confidence level`,
    };

    return guidanceTemplates[step] || `Step ${step}: ${stepInfo.name}\n\nFocus: ${stepInfo.focus}`;
  }

  validateStep(step: number, data: unknown): boolean {
    if (!super.validateStep(step, data)) {
      return false;
    }

    // Additional validation for specific steps
    if (step === 3 && data && typeof data === 'object' && 'pronounRatios' in data) {
      const pronounRatios = (data as { pronounRatios?: unknown }).pronounRatios;
      // Validate pronoun ratios are proper numbers
      if (typeof pronounRatios === 'object' && pronounRatios !== null) {
        return Object.values(pronounRatios).every(
          ratio => typeof ratio === 'number' && ratio >= 0 && ratio <= 1
        );
      }
      return false;
    }

    if (step === 6 && data && typeof data === 'object' && 'coherenceScore' in data) {
      const coherenceScore = (data as { coherenceScore?: unknown }).coherenceScore;
      // Ensure coherence score is between 0 and 100
      return typeof coherenceScore === 'number' && coherenceScore >= 0 && coherenceScore <= 100;
    }

    return true;
  }

  extractInsights(
    history: Array<{
      output?: string;
      coherenceScore?: number;
      pronounRatios?: Record<string, number>;
    }>
  ): string[] {
    const insights: string[] = [];

    history.forEach((entry, index) => {
      if (entry.output) {
        const stepNumber = index + 1;
        const stepName = this.steps[index]?.name || `Step ${stepNumber}`;

        // Extract linguistic pattern insights
        if (entry.output.toLowerCase().includes('distancing')) {
          insights.push(`${stepName}: Psychological distancing detected`);
        }
        if (entry.output.toLowerCase().includes('hedg')) {
          insights.push(`${stepName}: Hedging language indicates uncertainty`);
        }
        if (entry.pronounRatios) {
          const iWeRatio = entry.pronounRatios.iWe;
          if (iWeRatio && iWeRatio > 0.7) {
            insights.push('High individual focus (I/We ratio > 0.7)');
          } else if (iWeRatio && iWeRatio < 0.3) {
            insights.push('High collective focus (I/We ratio < 0.3)');
          }
        }
        if (entry.coherenceScore !== undefined) {
          insights.push(`Coherence Score: ${entry.coherenceScore}%`);
        }
      }
    });

    // Add summary insight
    if (history.length >= this.steps.length) {
      const finalEntry = history[history.length - 1];
      if (finalEntry.coherenceScore !== undefined) {
        const score = finalEntry.coherenceScore;
        if (score >= 85) {
          insights.push('High coherence - Consistent and authentic communication');
        } else if (score >= 70) {
          insights.push('Good coherence - Minor inconsistencies noted');
        } else if (score >= 50) {
          insights.push('Moderate coherence - Significant patterns of concern');
        } else {
          insights.push('Low coherence - Major inconsistencies detected');
        }
      }
    }

    return insights;
  }

  // Helper method to get linguistic markers for external use
  getLinguisticMarkers(): typeof this.linguisticMarkers {
    return this.linguisticMarkers;
  }
}
