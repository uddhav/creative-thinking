/**
 * Abstraction Strategy - Move up levels to find new solution spaces
 */

import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';

export class AbstractionStrategy extends BaseOptionStrategy {
  readonly strategyName = 'abstraction' as const;
  readonly description = 'Move up abstraction levels to discover new solution spaces and patterns';
  readonly typicalFlexibilityGain = { min: 0.2, max: 0.5 };
  readonly applicableCategories: OptionCategory[] = ['conceptual', 'structural'];

  isApplicable(context: OptionGenerationContext): boolean {
    // Abstraction is particularly useful when stuck in details
    const hasDetailedConstraints = context.pathMemory.constraints.some(
      c =>
        c.description.length > 50 || // Detailed descriptions suggest specific constraints
        c.type === 'technical'
    );

    const isStuckInSpecifics =
      context.currentFlexibility.flexibilityScore < 0.4 &&
      context.pathMemory.pathHistory.length > 5;

    return hasDetailedConstraints || isStuckInSpecifics;
  }

  generate(context: OptionGenerationContext): Option[] {
    const options: Option[] = [];

    // Generate pattern abstraction option
    const patternOption = this.createPatternAbstractionOption(context);
    if (patternOption && this.isCategoryAllowed(patternOption.category, context)) {
      options.push(patternOption);
    }

    // Generate domain transfer option
    const domainOption = this.createDomainTransferOption(context);
    if (domainOption && this.isCategoryAllowed(domainOption.category, context)) {
      options.push(domainOption);
    }

    // Generate principle extraction option
    const principleOption = this.createPrincipleExtractionOption(context);
    if (principleOption && this.isCategoryAllowed(principleOption.category, context)) {
      options.push(principleOption);
    }

    // Generate metaphorical thinking option
    const metaphorOption = this.createMetaphorOption(context);
    if (metaphorOption && this.isCategoryAllowed(metaphorOption.category, context)) {
      options.push(metaphorOption);
    }

    return options;
  }

  estimateEffort(option: Option): 'low' | 'medium' | 'high' {
    // Abstraction is mostly cognitive work
    if (option.name.includes('Pattern')) return 'low';
    if (option.name.includes('Principle')) return 'low';
    return 'medium'; // Domain transfer and metaphors require more work
  }

  private createPatternAbstractionOption(context: OptionGenerationContext): Option {
    const patterns = this.identifyPatterns(context);

    const actions = [
      `List all current constraints and decisions`,
      `Identify recurring patterns: ${patterns.slice(0, 2).join(', ')}`,
      `Abstract patterns to general form`,
      `Search for solutions to the abstract pattern`,
      `Translate abstract solutions back to specific context`,
    ];

    const prerequisites = [
      'Document current specific constraints',
      'Research pattern libraries in related domains',
    ];

    return this.createOption(
      'Apply Pattern Abstraction',
      `Step back from specific details to identify underlying patterns. Current situation shows patterns of: ${patterns.join(', ')}. By solving at the pattern level, multiple specific constraints can be addressed simultaneously.`,
      'conceptual',
      actions,
      prerequisites
    );
  }

  private createDomainTransferOption(context: OptionGenerationContext): Option {
    const analogousDomains = this.findAnalogousDomains(context);
    const primaryDomain = analogousDomains[0];

    const actions = [
      `Research how ${primaryDomain.domain} handles ${primaryDomain.similarity}`,
      `Identify key principles used in ${primaryDomain.domain}`,
      `Map principles to current context`,
      `Adapt ${primaryDomain.example} pattern to our situation`,
      `Test adapted solution with small experiment`,
    ];

    return this.createOption(
      `Apply ${primaryDomain.domain} Patterns`,
      `Transfer solutions from ${primaryDomain.domain} where they face similar challenges with ${primaryDomain.similarity}. For example, ${primaryDomain.example}. This opens new solution spaces not visible from within our domain.`,
      'conceptual',
      actions,
      ['Study successful examples from target domain']
    );
  }

  private createPrincipleExtractionOption(context: OptionGenerationContext): Option {
    const principles = this.extractPrinciples(context);

    const actions = [
      'Document what has worked well so far',
      `Extract core principles: ${principles.slice(0, 2).join(', ')}`,
      'Generalize principles beyond current context',
      'Generate new applications of these principles',
      'Select most promising applications for testing',
    ];

    return this.createOption(
      'Extract and Apply Core Principles',
      `Identify the fundamental principles underlying successful decisions: ${principles.join(', ')}. Apply these principles in new ways to generate fresh options while maintaining what works.`,
      'conceptual',
      actions,
      ['Review successful past decisions', 'Identify why they worked']
    );
  }

  private createMetaphorOption(context: OptionGenerationContext): Option | null {
    const metaphor = this.generateMetaphor(context);
    if (!metaphor) return null;

    const actions = [
      `Develop the metaphor: "${metaphor.metaphor}"`,
      `Map current elements to metaphor components`,
      `Identify what would work in the metaphorical domain`,
      `Translate metaphorical solutions back`,
      `Create concrete action plan from metaphor insights`,
    ];

    return this.createOption(
      `Think Through ${metaphor.vehicle} Metaphor`,
      `View the current situation as ${metaphor.metaphor}. This metaphor suggests: ${metaphor.insights.join(', ')}. New options emerge by thinking about what would work in this metaphorical context.`,
      'conceptual',
      actions,
      ['Team alignment on metaphor interpretation']
    );
  }

  private identifyPatterns(context: OptionGenerationContext): string[] {
    const patterns: string[] = [];

    // Analyze constraints for patterns
    const constraintTypes = new Map<string, number>();
    context.pathMemory.constraints.forEach(c => {
      const count = constraintTypes.get(c.type) || 0;
      constraintTypes.set(c.type, count + 1);
    });

    // Identify dominant constraint patterns
    constraintTypes.forEach((count, type) => {
      if (count >= 2) {
        patterns.push(`recurring ${type} constraints`);
      }
    });

    // Analyze decision patterns
    const decisions = context.pathMemory.pathHistory.map(e => e.decision.toLowerCase());
    if (decisions.some(d => d.includes('incremental'))) {
      patterns.push('incremental commitment');
    }
    if (decisions.some(d => d.includes('all') || d.includes('complete'))) {
      patterns.push('all-or-nothing decisions');
    }

    // Default patterns if none found
    if (patterns.length === 0) {
      patterns.push('constraint accumulation', 'option reduction', 'complexity growth');
    }

    return patterns;
  }

  private findAnalogousDomains(context: OptionGenerationContext): Array<{
    domain: string;
    similarity: string;
    example: string;
  }> {
    const domains = [];

    // Based on current problem characteristics
    const problemText = context.sessionState.problem.toLowerCase();

    if (problemText.includes('scale') || problemText.includes('growth')) {
      domains.push({
        domain: 'Biology',
        similarity: 'scaling and growth constraints',
        example: 'how organisms manage growth through modular structures',
      });
    }

    if (problemText.includes('coordinate') || problemText.includes('team')) {
      domains.push({
        domain: 'Music',
        similarity: 'coordination without central control',
        example: 'how jazz musicians improvise together using shared patterns',
      });
    }

    if (problemText.includes('resource') || problemText.includes('limit')) {
      domains.push({
        domain: 'Ecology',
        similarity: 'resource constraints and adaptation',
        example: 'how ecosystems create abundance from scarcity through cycles',
      });
    }

    // Default domains if no specific match
    if (domains.length === 0) {
      domains.push({
        domain: 'Architecture',
        similarity: 'structural flexibility with stability',
        example: 'how buildings use joints and flex points to handle stress',
      });
    }

    return domains;
  }

  private extractPrinciples(context: OptionGenerationContext): string[] {
    const principles: string[] = [];

    // Extract from successful low-commitment decisions
    const successfulFlexibleDecisions = context.pathMemory.pathHistory
      .filter(e => e.commitmentLevel < 0.4 && e.optionsOpened.length > 0)
      .slice(-5);

    if (successfulFlexibleDecisions.length > 0) {
      principles.push('maintain optionality');
      principles.push('incremental commitment');
    }

    // Extract from areas with high flexibility
    if (context.currentFlexibility.reversibilityIndex > 0.6) {
      principles.push('design for reversibility');
    }

    // Look for diversity patterns
    const uniqueTechniques = new Set(context.pathMemory.pathHistory.map(e => e.technique)).size;
    if (uniqueTechniques > 3) {
      principles.push('cognitive diversity');
    }

    // Default principles
    if (principles.length === 0) {
      principles.push(
        'simplicity over complexity',
        'adaptation over planning',
        'learning over knowing'
      );
    }

    return principles;
  }

  private generateMetaphor(context: OptionGenerationContext): {
    metaphor: string;
    vehicle: string;
    insights: string[];
  } | null {
    // Generate contextually appropriate metaphors
    const flexibility = context.currentFlexibility.flexibilityScore;

    if (flexibility < 0.2) {
      return {
        metaphor: 'a ship navigating through a narrow strait',
        vehicle: 'Navigation',
        insights: ['need careful piloting', 'must maintain momentum', 'look for widening ahead'],
      };
    } else if (flexibility < 0.4) {
      return {
        metaphor: 'a garden transitioning between seasons',
        vehicle: 'Gardening',
        insights: [
          'some things must die for new growth',
          'preparation now enables future blooming',
          'diversity creates resilience',
        ],
      };
    } else {
      return {
        metaphor: 'a jazz ensemble finding its groove',
        vehicle: 'Jazz',
        insights: [
          'structure enables improvisation',
          'listening creates harmony',
          'mistakes become features',
        ],
      };
    }
  }
}
