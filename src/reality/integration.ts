/**
 * Reality Assessment Integration
 *
 * Integrates the Reality Gradient System into existing thinking techniques
 * to enhance rather than restrict creativity.
 */

import type { RealityAssessment, LateralTechnique, ExecuteThinkingStepInput } from '../index.js';
import { RealityAssessor } from './index.js';

/**
 * Domain detection patterns
 */
const DOMAIN_PATTERNS: Record<string, RegExp[]> = {
  finance: [
    /tax|taxes|taxation/i,
    /investment|portfolio|trading/i,
    /stock|bond|security|securities/i,
    /loss harvesting|capital gains/i,
  ],
  healthcare: [
    /medical|medicine|health/i,
    /treatment|therapy|diagnosis/i,
    /patient|doctor|clinical/i,
    /drug|pharmaceutical/i,
  ],
  technology: [
    /software|hardware|code/i,
    /algorithm|data structure/i,
    /system|architecture|design/i,
    /ai|machine learning|neural/i,
  ],
  regulatory: [
    /compliance|regulation|law/i,
    /legal|policy|governance/i,
    /privacy|gdpr|ccpa/i,
    /sec|fda|regulatory/i,
  ],
};

/**
 * Technique-specific reality check patterns
 */
const TECHNIQUE_REALITY_CHECKS: Partial<Record<LateralTechnique, string[]>> = {
  triz: [
    'Check if contradiction is truly fundamental',
    'Verify physical principles are correctly understood',
    "Ensure inventive principles don't violate domain constraints",
  ],
  scamper: [
    'Verify substitutions are actually possible',
    'Check if combinations create new contradictions',
    "Ensure eliminations don't remove required elements",
  ],
  design_thinking: [
    'Validate user needs are real not assumed',
    'Check if prototypes can actually be built',
    'Ensure solutions fit within constraints',
  ],
};

export class RealityIntegration {
  /**
   * Detect domain from problem and context
   */
  static detectDomain(problem: string, context?: string): string | undefined {
    const combined = `${problem} ${context || ''}`.toLowerCase();

    for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(combined))) {
        return domain;
      }
    }

    return undefined;
  }

  /**
   * Enhance technique output with reality assessment
   */
  static enhanceWithReality(
    input: ExecuteThinkingStepInput,
    output: string
  ): {
    enhancedOutput: string;
    realityAssessment?: RealityAssessment;
  } {
    // Don't assess if explicitly disabled or already assessed
    if (input.realityAssessment !== undefined) {
      return { enhancedOutput: output };
    }

    // Detect domain
    const domain = this.detectDomain(input.problem, output);

    // Perform reality assessment
    const assessment = RealityAssessor.assess(output, input.problem, domain);

    // Only add assessment if it's not trivially feasible
    if (assessment.possibilityLevel === 'feasible' && assessment.confidenceLevel >= 0.7) {
      return { enhancedOutput: output };
    }

    // Generate enhanced output
    const navigatorOutput = RealityAssessor.generateNavigatorOutput(output, assessment);

    const enhancedOutput = `${output}\n\n📊 Reality Navigator:\n${navigatorOutput}`;

    return {
      enhancedOutput,
      realityAssessment: assessment,
    };
  }

  /**
   * Get technique-specific reality checks
   */
  static getTechniqueChecks(technique: LateralTechnique): string[] {
    return (
      TECHNIQUE_REALITY_CHECKS[technique] || [
        'Verify assumptions are correct',
        'Check for hidden contradictions',
        'Ensure solution fits constraints',
      ]
    );
  }

  /**
   * Analyze multiple outputs for reality patterns
   */
  static analyzeSessionReality(
    outputs: Array<{
      output: string;
      assessment?: RealityAssessment;
    }>
  ): {
    feasibilityTrend: 'improving' | 'declining' | 'stable';
    breakthroughsNeeded: Set<string>;
    commonBarriers: Map<string, number>;
  } {
    const assessments = outputs
      .map(o => o.assessment)
      .filter((a): a is RealityAssessment => a !== undefined);

    if (assessments.length < 2) {
      return {
        feasibilityTrend: 'stable',
        breakthroughsNeeded: new Set(),
        commonBarriers: new Map(),
      };
    }

    // Analyze feasibility trend
    const feasibilityScores = assessments.map(a => {
      switch (a.possibilityLevel) {
        case 'feasible':
          return 3;
        case 'difficult':
          return 2;
        case 'breakthrough-required':
          return 1;
        case 'impossible':
          return 0;
      }
    });

    const firstHalf = feasibilityScores.slice(0, Math.floor(feasibilityScores.length / 2));
    const secondHalf = feasibilityScores.slice(Math.floor(feasibilityScores.length / 2));

    const firstAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;

    const feasibilityTrend =
      secondAvg > firstAvg + 0.5
        ? 'improving'
        : secondAvg < firstAvg - 0.5
          ? 'declining'
          : 'stable';

    // Collect all breakthroughs needed
    const breakthroughsNeeded = new Set<string>();
    assessments.forEach(a => {
      a.breakthroughsRequired?.forEach(b => breakthroughsNeeded.add(b));
    });

    // Count common barriers
    const commonBarriers = new Map<string, number>();
    assessments.forEach(a => {
      if (a.impossibilityType) {
        commonBarriers.set(a.impossibilityType, (commonBarriers.get(a.impossibilityType) || 0) + 1);
      }
    });

    return {
      feasibilityTrend,
      breakthroughsNeeded,
      commonBarriers,
    };
  }

  /**
   * Generate breakthrough strategy based on assessments
   */
  static generateBreakthroughStrategy(
    analysis: ReturnType<typeof RealityIntegration.analyzeSessionReality>
  ): string {
    let strategy = '🚀 Breakthrough Strategy:\n\n';

    // Feasibility trend
    if (analysis.feasibilityTrend === 'improving') {
      strategy += '✅ Good progress: Ideas becoming more feasible\n';
    } else if (analysis.feasibilityTrend === 'declining') {
      strategy += '⚠️ Caution: Ideas becoming less feasible - consider reframing\n';
    }

    // Common barriers
    if (analysis.commonBarriers.size > 0) {
      strategy += '\n🔍 Focus Areas:\n';
      for (const [barrier, count] of analysis.commonBarriers) {
        strategy += `- ${barrier} barriers (${count} times)\n`;
      }
    }

    // Breakthroughs needed
    if (analysis.breakthroughsNeeded.size > 0) {
      strategy += '\n💡 Key Breakthroughs Needed:\n';
      let i = 1;
      for (const breakthrough of analysis.breakthroughsNeeded) {
        strategy += `${i}. ${breakthrough}\n`;
        i++;
        if (i > 5) break; // Limit to top 5
      }
    }

    return strategy;
  }
}
