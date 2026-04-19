/**
 * Decomposition Strategy - Break monolithic commitments into flexible pieces
 */

import { BaseOptionStrategy } from './base.js';
import type {
  Option,
  OptionGenerationContext,
  OptionCategory,
  DecomposableCommitment,
} from '../types.js';
import { COMMITMENT_THRESHOLDS, CONSTRAINT_THRESHOLDS } from '../constants.js';

export class DecompositionStrategy extends BaseOptionStrategy {
  readonly strategyName = 'decomposition' as const;
  readonly description = 'Break monolithic commitments into smaller, flexible pieces';
  readonly typicalFlexibilityGain = { min: 0.2, max: 0.4 };
  readonly applicableCategories: OptionCategory[] = ['structural', 'technical', 'process'];

  isApplicable(context: OptionGenerationContext): boolean {
    // Look for monolithic commitments or high coupling
    const hasMonolithicStructure = context.pathMemory.constraints.some(
      c => c.type === 'technical' && c.strength > CONSTRAINT_THRESHOLDS.STRONG
    );

    const hasHighCommitments = context.pathMemory.pathHistory.some(
      e => e.commitmentLevel > COMMITMENT_THRESHOLDS.HIGH
    );

    return hasMonolithicStructure || hasHighCommitments;
  }

  generate(context: OptionGenerationContext): Option[] {
    const options: Option[] = [];
    const commitments = this.identifyDecomposableCommitments(context);

    // Generate options for top decomposable commitments
    commitments.slice(0, 3).forEach(commitment => {
      const option = this.createDecompositionOption(commitment, context);
      if (option && this.isCategoryAllowed(option.category, context)) {
        options.push(option);
      }
    });

    // Add a general modularization option if applicable
    if (options.length < 2 && this.isCategoryAllowed('structural', context)) {
      const generalOption = this.createGeneralModularizationOption(context);
      if (generalOption) {
        options.push(generalOption);
      }
    }

    return options;
  }

  estimateEffort(option: Option): 'low' | 'medium' | 'high' {
    const actionCount = option.actions.length;
    if (actionCount <= 3) return 'low';
    if (actionCount <= 6) return 'medium';
    return 'high';
  }

  private identifyDecomposableCommitments(
    context: OptionGenerationContext
  ): DecomposableCommitment[] {
    const commitments: DecomposableCommitment[] = [];

    // Analyze constraints for decomposition opportunities
    context.pathMemory.constraints.forEach(constraint => {
      if (constraint.strength > 0.5 && constraint.reversibilityCost > 0.5) {
        commitments.push({
          id: constraint.id,
          description: constraint.description,
          currentStructure: 'Monolithic constraint',
          decomposable: true,
          suggestedModules: this.suggestModules(constraint.description),
          flexibilityGainPotential: 0.3,
          effort: 'medium',
        });
      }
    });

    // Analyze high-commitment decisions
    const recentHighCommitments = context.pathMemory.pathHistory
      .filter(event => event.commitmentLevel > 0.6)
      .slice(-5); // Last 5 high commitments

    recentHighCommitments.forEach(event => {
      commitments.push({
        id: event.id || `event_${event.timestamp}`,
        description: event.decision,
        currentStructure: 'Single large decision',
        decomposable: true,
        suggestedModules: this.suggestModulesForDecision(event.decision),
        flexibilityGainPotential: 0.25,
        effort: 'low',
      });
    });

    // Sort by flexibility gain potential
    return commitments.sort((a, b) => b.flexibilityGainPotential - a.flexibilityGainPotential);
  }

  private createDecompositionOption(
    commitment: DecomposableCommitment,
    context: OptionGenerationContext
  ): Option | null {
    const minReversibility = this.getMinReversibility(context);

    // Skip if decomposition wouldn't meet reversibility requirements
    if (minReversibility > 0.7) {
      return null;
    }

    const actions = [
      `Identify interfaces in ${commitment.description}`,
      `Create abstraction layer for core functionality`,
      `Extract ${commitment.suggestedModules[0]} as separate module`,
      `Define clear contracts between modules`,
      `Test modules independently`,
    ];

    const prerequisites = [
      'Document current dependencies',
      'Identify integration points',
      'Create rollback plan',
    ];

    return this.createOption(
      `Modularize ${this.extractCoreConcept(commitment.description)}`,
      `Break down ${commitment.description} into ${commitment.suggestedModules.length} independent modules: ${commitment.suggestedModules.join(', ')}. This will increase flexibility by allowing independent changes to each module.`,
      'structural',
      actions,
      prerequisites
    );
  }

  private createGeneralModularizationOption(context: OptionGenerationContext): Option {
    const coupledComponents = this.identifyCoupledComponents(context);

    const actions = [
      'Map current component dependencies',
      'Identify natural boundary lines',
      'Create interface definitions',
      'Implement adapter pattern for communication',
      'Gradually migrate to modular structure',
    ];

    return this.createOption(
      'Implement Modular Architecture',
      `Transform the current tightly coupled system into a modular architecture. Focus on separating ${coupledComponents.join(', ')}. This creates flexibility to modify components independently.`,
      'structural',
      actions,
      ['Architecture review', 'Team alignment on boundaries']
    );
  }

  private suggestModules(description: string): string[] {
    // Simple heuristic-based module suggestions
    const modules: string[] = [];

    if (description.toLowerCase().includes('authentication')) {
      modules.push('auth-core', 'session-manager', 'permission-handler');
    } else if (description.toLowerCase().includes('database')) {
      modules.push('data-access', 'query-builder', 'connection-pool');
    } else if (description.toLowerCase().includes('api')) {
      modules.push('endpoint-router', 'request-validator', 'response-formatter');
    } else {
      // Generic suggestions
      modules.push('core-logic', 'interface-layer', 'data-layer');
    }

    return modules;
  }

  private suggestModulesForDecision(decision: string): string[] {
    // Extract potential module points from decision text
    const words = decision.toLowerCase().split(/\s+/);
    const modules: string[] = [];

    // Look for action words that suggest separable concerns
    const actionWords = [
      'process',
      'validate',
      'transform',
      'store',
      'send',
      'receive',
      'calculate',
    ];
    words.forEach(word => {
      if (actionWords.some(action => word.includes(action))) {
        modules.push(word);
      }
    });

    // If no specific modules found, suggest generic ones
    if (modules.length === 0) {
      modules.push('preparation', 'execution', 'verification');
    }

    return modules.slice(0, 3); // Return max 3 modules
  }

  private extractCoreConcept(description: string): string {
    // Extract the main concept from the description
    const words = description.split(/\s+/);

    // Look for nouns that likely represent the core concept
    const importantWords = words.filter(
      word =>
        word.length > 4 && !['with', 'from', 'that', 'this', 'have'].includes(word.toLowerCase())
    );

    return importantWords[0] || 'System';
  }

  private identifyCoupledComponents(context: OptionGenerationContext): string[] {
    const components: Set<string> = new Set();

    // Extract from constraints
    context.pathMemory.constraints.forEach(c => {
      if (c.affectedOptions.length > 2) {
        components.add(this.extractCoreConcept(c.description));
      }
    });

    // Extract from high-commitment events
    context.pathMemory.pathHistory
      .filter(e => e.commitmentLevel > 0.5)
      .forEach(e => {
        const concept = this.extractCoreConcept(e.decision);
        if (concept !== 'System') {
          components.add(concept);
        }
      });

    return Array.from(components).slice(0, 3);
  }
}
