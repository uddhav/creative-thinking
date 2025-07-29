/**
 * Reality Assessment Module
 *
 * Implements the Reality Gradient System that enhances creative thinking
 * by annotating ideas with their possibility levels and breakthrough requirements.
 *
 * Instead of blocking "impossible" ideas, this system shows what would need
 * to change for them to become possible, with historical precedents.
 */

import type { RealityAssessment, PossibilityLevel, ImpossibilityType } from '../index.js';

/**
 * Historical precedents of "impossible" becoming possible
 */
const HISTORICAL_PRECEDENTS: Record<string, string[]> = {
  flight: [
    'Pre-1903: Human flight was deemed impossible',
    '1903: Wright Brothers achieve powered flight',
    'Breakthrough: Understanding of aerodynamics + lightweight engines',
  ],
  space_travel: [
    '1920s: Rocket to moon considered fantasy',
    '1969: Apollo 11 lands on moon',
    'Breakthrough: Rocket propulsion + computing + materials science',
  ],
  instant_global_communication: [
    '1800s: Instant worldwide communication impossible',
    '1990s: Internet enables real-time global communication',
    'Breakthrough: Electronics + fiber optics + protocols',
  ],
  remote_work: [
    'Pre-2020: "Most jobs require physical presence"',
    '2020: Pandemic proves remote work viable at scale',
    'Breakthrough: Video conferencing + cloud computing + cultural shift',
  ],
  ai_creativity: [
    '2010: "AI will never be creative"',
    '2020s: AI generates art, music, and text',
    'Breakthrough: Neural networks + massive compute + large datasets',
  ],
};

/**
 * Common breakthrough patterns by impossibility type
 */
const BREAKTHROUGH_PATTERNS: Record<ImpossibilityType, string[]> = {
  logical: [
    'Reframe the problem to avoid contradiction',
    'Question fundamental assumptions',
    'Find a different logical system',
  ],
  physical: [
    'Discover new physical principles',
    'Work within constraints creatively',
    'Find loopholes in current understanding',
  ],
  technical: [
    'Develop new technologies',
    'Combine existing technologies differently',
    "Wait for Moore's Law progression",
  ],
  regulatory: [
    'Change laws or regulations',
    'Find regulatory arbitrage',
    'Create new category outside current rules',
  ],
  resource: [
    'Find cheaper alternatives',
    'Create abundance through innovation',
    'Change business model to reduce costs',
  ],
  social: [
    'Cultural evolution over time',
    'Find early adopter communities',
    'Reframe to align with values',
  ],
};

export class RealityAssessor {
  /**
   * Assess the reality gradient of an idea or solution
   */
  static assess(idea: string, context: string, domain?: string): RealityAssessment {
    // Analyze the idea for impossibility markers
    const analysis = this.analyzeIdea(idea, context, domain);

    // Find relevant historical precedents
    const precedents = this.findPrecedents(analysis);

    // Determine breakthrough requirements
    const breakthroughs = this.identifyBreakthroughs(analysis);

    return {
      possibilityLevel: analysis.level,
      impossibilityType: analysis.type,
      breakthroughsRequired: breakthroughs,
      historicalPrecedents: precedents,
      confidenceLevel: analysis.confidence,
      mechanismExplanation: analysis.mechanism,
    };
  }

  /**
   * Analyze idea for impossibility markers
   */
  private static analyzeIdea(
    idea: string,
    context: string,
    domain?: string
  ): {
    level: PossibilityLevel;
    type?: ImpossibilityType;
    confidence: number;
    mechanism?: string;
  } {
    const lowerIdea = idea.toLowerCase();
    const lowerContext = context.toLowerCase();

    // Check for logical impossibilities
    if (this.hasLogicalContradiction(lowerIdea, lowerContext)) {
      return {
        level: 'impossible',
        type: 'logical',
        confidence: 0.95,
        mechanism: 'Contains self-contradictory requirements',
      };
    }

    // Check for physical law violations
    if (this.violatesPhysicalLaws(lowerIdea, lowerContext)) {
      return {
        level: 'breakthrough-required',
        type: 'physical',
        confidence: 0.9,
        mechanism: 'Would require new physics or energy source',
      };
    }

    // Check for regulatory constraints
    if (this.hasRegulatoryConstraints(lowerIdea, domain)) {
      return {
        level: 'breakthrough-required',
        type: 'regulatory',
        confidence: 0.85,
        mechanism: 'Current regulations prohibit this approach',
      };
    }

    // Check for technical limitations
    if (this.hasTechnicalLimitations(lowerIdea, lowerContext)) {
      return {
        level: 'difficult',
        type: 'technical',
        confidence: 0.8,
        mechanism: 'Requires advancing current technology',
      };
    }

    // Check for resource constraints
    if (this.hasResourceConstraints(lowerIdea, lowerContext)) {
      return {
        level: 'difficult',
        type: 'resource',
        confidence: 0.75,
        mechanism: 'Requires significant resources or cost reduction',
      };
    }

    // Default to feasible
    return {
      level: 'feasible',
      confidence: 0.7,
      mechanism: 'No major barriers identified',
    };
  }

  /**
   * Check for logical contradictions
   */
  private static hasLogicalContradiction(idea: string, context: string): boolean {
    const contradictionPatterns = [
      /both\s+(\w+)\s+and\s+not\s+\1/,
      /simultaneously\s+(\w+)\s+and\s+(\w+).*mutually\s+exclusive/,
      /wants?\s+to\s+(\w+)\s+without\s+(\w+ing)/,
      /maintain.*while.*eliminating/,
      /keep.*position.*while.*selling/,
      /eliminate\s+all.*while\s+maintaining/,
      /without.*but.*must/,
    ];

    const combined = `${idea} ${context}`.toLowerCase();
    return contradictionPatterns.some(pattern => pattern.test(combined));
  }

  /**
   * Check for physical law violations
   */
  private static violatesPhysicalLaws(idea: string, context: string): boolean {
    const physicsViolations = [
      'perpetual motion',
      'free energy',
      'faster than light',
      'create matter from nothing',
      'time travel to past',
      '100% efficiency',
      'entropy reversal',
    ];

    const combined = `${idea} ${context}`;
    return physicsViolations.some(violation => combined.includes(violation));
  }

  /**
   * Check for regulatory constraints
   */
  private static hasRegulatoryConstraints(idea: string, domain?: string): boolean {
    if (!domain) return false;

    const regulatoryKeywords: Record<string, string[]> = {
      finance: [
        'insider trading',
        'market manipulation',
        'ponzi',
        'pyramid scheme',
        'substantially identical',
        'sell and immediately buy back',
        'tax loss harvesting',
      ],
      healthcare: ['unapproved treatment', 'experimental drug', 'unlicensed practice'],
      tax: ['tax evasion', 'substantially identical', 'wash sale'],
      data: ['personal data without consent', 'violate privacy', 'sell user data'],
    };

    const keywords = regulatoryKeywords[domain] || [];
    return keywords.some(keyword => idea.includes(keyword));
  }

  /**
   * Check for technical limitations
   */
  private static hasTechnicalLimitations(idea: string, context: string): boolean {
    const technicalMarkers = [
      "requires technology that doesn't exist",
      'beyond current capabilities',
      'need breakthrough in',
      'waiting for',
      'not yet possible',
      'theoretical only',
      'capture all',
      'all solar energy',
    ];

    const combined = `${idea} ${context}`;
    return technicalMarkers.some(marker => combined.includes(marker));
  }

  /**
   * Check for resource constraints
   */
  private static hasResourceConstraints(idea: string, context: string): boolean {
    const resourceMarkers = [
      'too expensive',
      'requires billions',
      'massive infrastructure',
      'scarce resources',
      'limited supply',
      'economically unfeasible',
    ];

    const combined = `${idea} ${context}`;
    return resourceMarkers.some(marker => combined.includes(marker));
  }

  /**
   * Find relevant historical precedents
   */
  private static findPrecedents(analysis: {
    level: PossibilityLevel;
    type?: ImpossibilityType;
  }): string[] {
    if (analysis.level === 'feasible') {
      return ['Many similar ideas have been successfully implemented'];
    }

    const precedents: string[] = [];

    // Add general precedents based on type
    if (analysis.type === 'technical') {
      precedents.push(...HISTORICAL_PRECEDENTS.ai_creativity);
    } else if (analysis.type === 'physical') {
      precedents.push(...HISTORICAL_PRECEDENTS.flight);
      precedents.push(...HISTORICAL_PRECEDENTS.space_travel);
    } else if (analysis.type === 'social') {
      precedents.push(...HISTORICAL_PRECEDENTS.remote_work);
    } else if (analysis.type === 'resource') {
      precedents.push(...HISTORICAL_PRECEDENTS.instant_global_communication);
    }

    return precedents.slice(0, 3); // Return top 3 precedents
  }

  /**
   * Identify required breakthroughs
   */
  private static identifyBreakthroughs(analysis: {
    level: PossibilityLevel;
    type?: ImpossibilityType;
  }): string[] {
    if (analysis.level === 'feasible') {
      return ['No major breakthroughs required'];
    }

    if (analysis.level === 'impossible' && analysis.type === 'logical') {
      return ['Fundamental reframing of the problem required'];
    }

    if (analysis.type) {
      return BREAKTHROUGH_PATTERNS[analysis.type] || [];
    }

    return ['Unknown breakthroughs needed'];
  }

  /**
   * Generate possibility navigator output
   */
  static generateNavigatorOutput(idea: string, assessment: RealityAssessment): string {
    let output = `Idea: "${idea}"\n`;
    output += `Reality Assessment:\n`;
    output += `- Level: ${assessment.possibilityLevel}`;

    if (assessment.impossibilityType) {
      output += ` (${assessment.impossibilityType})`;
    }
    output += `\n`;

    if (assessment.impossibilityType) {
      output += `- Type: ${assessment.impossibilityType} impossibility\n`;
    }

    if (assessment.breakthroughsRequired && assessment.breakthroughsRequired.length > 0) {
      output += `- Breakthroughs required:\n`;
      assessment.breakthroughsRequired.forEach(b => {
        output += `  • ${b}\n`;
      });
    }

    if (assessment.historicalPrecedents && assessment.historicalPrecedents.length > 0) {
      output += `- Historical precedents:\n`;
      assessment.historicalPrecedents.forEach(p => {
        output += `  • ${p}\n`;
      });
    }

    if (assessment.mechanismExplanation) {
      output += `- Mechanism: ${assessment.mechanismExplanation}\n`;
    }

    output += `- Confidence: ${Math.round(assessment.confidenceLevel * 100)}%\n`;

    return output;
  }
}
