/**
 * Cultural Bridging Strategy - Create options by bridging different cultural and contextual frameworks
 */

import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';

export class CulturalBridgingStrategy extends BaseOptionStrategy {
  readonly strategyName = 'cultural_bridging' as const;
  readonly description =
    'Create flexibility by bridging different cultural frameworks, contexts, and worldviews';
  readonly typicalFlexibilityGain = { min: 0.25, max: 0.45 };
  readonly applicableCategories: OptionCategory[] = ['relational', 'conceptual', 'structural'];

  isApplicable(context: OptionGenerationContext): boolean {
    // Look for cultural, contextual, or framework conflicts
    const hasFrameworkConflict = context.pathMemory.constraints.some(
      c =>
        c.description.toLowerCase().includes('conflict') ||
        c.description.toLowerCase().includes('incompatible') ||
        c.description.toLowerCase().includes('different approach')
    );

    const hasMultipleStakeholders =
      context.pathMemory.constraints.filter(
        c =>
          c.description.toLowerCase().includes('stakeholder') ||
          c.description.toLowerCase().includes('team') ||
          c.description.toLowerCase().includes('department')
      ).length > 1;

    const hasContextualRigidity =
      context.currentFlexibility.flexibilityScore < 0.4 &&
      context.pathMemory.pathHistory.some(
        e =>
          e.decision.toLowerCase().includes('must') || e.decision.toLowerCase().includes('only way')
      );

    return hasFrameworkConflict || hasMultipleStakeholders || hasContextualRigidity;
  }

  generate(context: OptionGenerationContext): Option[] {
    const options: Option[] = [];

    // Generate synthesis framework option
    const synthesisOption = this.createSynthesisFramework(context);
    if (synthesisOption && this.isCategoryAllowed(synthesisOption.category, context)) {
      options.push(synthesisOption);
    }

    // Generate translation interface option
    const translationOption = this.createTranslationInterface(context);
    if (translationOption && this.isCategoryAllowed(translationOption.category, context)) {
      options.push(translationOption);
    }

    // Generate parallel paths option
    if (this.hasMultipleValidApproaches(context)) {
      const parallelOption = this.createParallelPaths(context);
      if (parallelOption && this.isCategoryAllowed(parallelOption.category, context)) {
        options.push(parallelOption);
      }
    }

    // Generate bridge concepts option
    const bridgeOption = this.createBridgeConcepts(context);
    if (bridgeOption && this.isCategoryAllowed(bridgeOption.category, context)) {
      options.push(bridgeOption);
    }

    return options;
  }

  estimateEffort(option: Option): 'low' | 'medium' | 'high' {
    if (option.name.includes('Bridge Concepts')) return 'low';
    if (option.name.includes('Translation')) return 'medium';
    if (option.name.includes('Synthesis') || option.name.includes('Parallel')) return 'high';
    return 'medium';
  }

  private hasMultipleValidApproaches(context: OptionGenerationContext): boolean {
    // Check if different stakeholders or contexts suggest different valid approaches
    const approaches = new Set<string>();

    context.pathMemory.pathHistory.forEach(event => {
      if (event.decision.includes('approach') || event.decision.includes('method')) {
        approaches.add(event.decision.split(' ')[0]); // Simple heuristic
      }
    });

    return approaches.size > 2;
  }

  private identifyFrameworks(context: OptionGenerationContext): string[] {
    const frameworks: string[] = [];

    // Extract from constraints and history
    const keywords = ['framework', 'approach', 'methodology', 'culture', 'tradition', 'practice'];

    context.pathMemory.constraints.forEach(c => {
      keywords.forEach(keyword => {
        if (c.description.toLowerCase().includes(keyword)) {
          frameworks.push(c.description);
        }
      });
    });

    // Add inferred frameworks
    if (context.pathMemory.pathHistory.some(e => e.decision.includes('agile'))) {
      frameworks.push('Agile methodology');
    }
    if (context.pathMemory.pathHistory.some(e => e.decision.includes('waterfall'))) {
      frameworks.push('Waterfall methodology');
    }

    return [...new Set(frameworks)].slice(0, 3);
  }

  private createSynthesisFramework(context: OptionGenerationContext): Option {
    const frameworks = this.identifyFrameworks(context);
    const frameworkCount = frameworks.length;
    const complexityNote =
      frameworkCount > 2
        ? `Complex synthesis required across ${frameworkCount} frameworks`
        : 'Focused synthesis between primary frameworks';

    return this.createOption(
      'Create Synthesis Framework',
      'Develop a meta-framework that incorporates strengths from different cultural or methodological approaches, creating a flexible hybrid.',
      'conceptual',
      [
        'Map core values and principles from each framework',
        'Identify complementary rather than conflicting elements',
        'Design integration points that preserve framework integrity',
        'Create switching protocols between framework modes',
        complexityNote,
      ],
      ['Understanding of multiple frameworks', 'Authority to create hybrid approaches']
    );
  }

  private createTranslationInterface(context: OptionGenerationContext): Option {
    // Use context to assess translation complexity
    const stakeholderCount = context.pathMemory.constraints.filter(c =>
      c.description.toLowerCase().includes('stakeholder')
    ).length;
    const interfaceScope =
      stakeholderCount > 3
        ? 'Multi-stakeholder translation framework required'
        : 'Focused bilateral translation interfaces';
    return this.createOption(
      'Build Translation Interfaces',
      'Create interfaces that translate between different cultural or contextual frameworks, enabling collaboration without forcing uniformity.',
      'relational',
      [
        'Identify key concepts that need translation',
        'Create bidirectional mapping of terminology and practices',
        'Design boundary objects that work in multiple contexts',
        'Establish translation protocols and ambassadors',
        interfaceScope,
      ],
      ['Access to different stakeholder groups', 'Communication channels']
    );
  }

  private createParallelPaths(context: OptionGenerationContext): Option {
    // Use context to determine parallel path strategy
    const highCommitment = context.pathMemory.pathHistory.filter(
      e => e.commitmentLevel > 0.7
    ).length;
    const pathStrategy =
      highCommitment > 2
        ? 'Create escape routes from high-commitment paths'
        : 'Design flexible convergence points between paths';
    return this.createOption(
      'Implement Parallel Cultural Paths',
      'Allow different approaches to coexist and proceed in parallel, converging only where necessary. This preserves cultural integrity while enabling progress.',
      'structural',
      [
        'Define clear boundaries for each approach',
        'Identify mandatory convergence points',
        'Create loose coupling between parallel paths',
        'Design reconciliation mechanisms for conflicts',
        pathStrategy,
      ],
      ['Organizational flexibility', 'Resource allocation for multiple paths']
    );
  }

  private createBridgeConcepts(context: OptionGenerationContext): Option {
    const constraints = this.getRelevantConstraints(context).slice(0, 3);
    const bridgeComplexity =
      constraints.length > 2
        ? `Address ${constraints.length} key constraints through bridge concepts`
        : 'Focus on primary constraint bridges';

    return this.createOption(
      'Develop Bridge Concepts',
      'Identify or create concepts that naturally exist in multiple frameworks, serving as connection points for integration.',
      'conceptual',
      [
        'Survey each framework for universal concepts',
        'Identify metaphors that resonate across contexts',
        'Create new bridging terminology if needed',
        'Use bridge concepts as collaboration anchors',
        bridgeComplexity,
      ],
      ['Deep understanding of involved frameworks', 'Creative conceptual thinking']
    );
  }
}
