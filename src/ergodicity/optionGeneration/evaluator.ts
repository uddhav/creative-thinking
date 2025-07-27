/**
 * Option Evaluation Framework
 */

import type { Option, OptionEvaluation, OptionGenerationContext } from './types.js';
import type { Constraint, PathEvent } from '../../ergodicity/types.js';

type ConstraintType = Constraint['type'];

/**
 * Evaluates and ranks generated options
 */
export class OptionEvaluator {
  /**
   * Evaluate a single option
   */
  evaluateOption(option: Option, context: OptionGenerationContext): OptionEvaluation {
    const flexibilityGain = this.calculateFlexibilityGain(option, context);
    const implementationCost = this.estimateImplementationCost(option, context);
    const reversibility = this.assessReversibility(option, context);
    const synergyScore = this.calculateSynergies(option, context);
    const timeToValue = this.estimateTimeToValue(option);

    const overallScore = this.calculateOverallScore({
      flexibilityGain,
      implementationCost,
      reversibility,
      synergyScore,
      timeToValue,
    });

    const recommendation = this.determineRecommendation(overallScore, context);
    const reasoning = this.generateReasoning(option, {
      flexibilityGain,
      implementationCost,
      reversibility,
      synergyScore,
      timeToValue,
      overallScore,
    });

    return {
      optionId: option.id,
      flexibilityGain,
      implementationCost,
      reversibility,
      synergyScore,
      timeToValue,
      overallScore,
      recommendation,
      reasoning,
    };
  }

  /**
   * Evaluate and rank multiple options
   */
  evaluateOptions(options: Option[], context: OptionGenerationContext): OptionEvaluation[] {
    const evaluations = options.map(option => this.evaluateOption(option, context));

    // Sort by overall score (highest first)
    return evaluations.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Calculate flexibility gain from implementing the option
   */
  private calculateFlexibilityGain(option: Option, context: OptionGenerationContext): number {
    const currentFlexibility = context.currentFlexibility.flexibilityScore;
    let baseGain = 0.2; // Default gain

    // Strategy-specific base gains
    const strategyGains: Record<string, number> = {
      decomposition: 0.3,
      abstraction: 0.35,
      inversion: 0.25,
      temporal: 0.2,
      stakeholder: 0.25,
      resource: 0.25,
      capability: 0.35,
      recombination: 0.2,
    };

    baseGain = strategyGains[option.strategy] || baseGain;

    // Adjust based on current flexibility (more gain when flexibility is low)
    const urgencyMultiplier = currentFlexibility < 0.2 ? 1.5 : currentFlexibility < 0.4 ? 1.2 : 1.0;

    // Adjust based on category match with constraints
    const categoryBonus = this.calculateCategoryBonus(option, context);

    // Calculate final gain (capped at 0.5)
    const gain = Math.min(0.5, baseGain * urgencyMultiplier + categoryBonus);

    // Store for later use
    option.flexibilityGain = gain;

    return gain;
  }

  /**
   * Estimate implementation cost (0 = low cost, 1 = high cost)
   */
  private estimateImplementationCost(option: Option, context: OptionGenerationContext): number {
    const baseCost = 0.3;

    // Action count factor
    const actionCost = option.actions.length * 0.05;

    // Prerequisite factor
    const prereqCost = option.prerequisites.length * 0.1;

    // Category-specific costs
    const categoryCosts: Record<string, number> = {
      structural: 0.6, // High - requires architecture changes
      technical: 0.5, // Medium-high - technical implementation
      process: 0.3, // Medium - process changes
      relational: 0.4, // Medium - stakeholder coordination
      resource: 0.4, // Medium - resource reallocation
      capability: 0.5, // Medium-high - learning investment
      temporal: 0.2, // Low - mostly scheduling
      conceptual: 0.2, // Low - mostly thinking work
    };

    const categoryCost = categoryCosts[option.category] || 0.3;

    // Current state factors
    const constraintFactor = context.pathMemory.constraints.length * 0.02;

    // Calculate final cost (capped at 0.9)
    const cost =
      Math.min(0.9, baseCost + actionCost + prereqCost + categoryCost + constraintFactor) / 2;

    option.implementationCost = cost;

    return cost;
  }

  /**
   * Assess how reversible the option is (0 = irreversible, 1 = fully reversible)
   */
  private assessReversibility(option: Option, context: OptionGenerationContext): number {
    // Strategy-based reversibility
    const strategyReversibility: Record<string, number> = {
      temporal: 0.9, // Delays are highly reversible
      abstraction: 0.8, // Conceptual changes are reversible
      inversion: 0.7, // Assumption changes can be reverted
      capability: 0.7, // Skills remain even if not used
      stakeholder: 0.6, // Relationship changes harder to reverse
      resource: 0.5, // Resource shifts have momentum
      recombination: 0.5, // Combinations create dependencies
      decomposition: 0.4, // Structural changes are sticky
    };

    let reversibility = strategyReversibility[option.strategy] || 0.6;

    // Category adjustments
    if (option.category === 'structural') {
      reversibility *= 0.7; // Structural changes are harder to reverse
    } else if (option.category === 'conceptual') {
      reversibility *= 1.2; // Conceptual changes are easier to reverse
    }

    // Context-based adjustments
    // High commitment history makes reversal harder
    const avgCommitment =
      context.pathMemory.pathHistory.length > 0
        ? context.pathMemory.pathHistory.reduce((sum, e) => sum + e.commitmentLevel, 0) /
          context.pathMemory.pathHistory.length
        : 0.5;
    if (avgCommitment > 0.7) {
      reversibility *= 0.8; // Harder to reverse in high-commitment environments
    }

    // Strong constraints reduce reversibility
    const strongConstraints = context.pathMemory.constraints.filter(c => c.strength > 0.7).length;
    if (strongConstraints > 2) {
      reversibility *= 0.9; // Multiple strong constraints limit reversal options
    }

    // Consider if option creates new constraints
    const createsConstraints = option.actions.some(
      a => a.toLowerCase().includes('commit') || a.toLowerCase().includes('permanent')
    );

    if (createsConstraints) {
      reversibility *= 0.8;
    }

    // Ensure within bounds
    reversibility = Math.max(0.1, Math.min(1.0, reversibility));

    option.reversibility = reversibility;

    return reversibility;
  }

  /**
   * Calculate synergy with existing options and decisions
   */
  private calculateSynergies(option: Option, context: OptionGenerationContext): number {
    let synergyScore = 0.5; // Neutral default

    // Check synergy with recent successful decisions
    const recentSuccesses = context.pathMemory.pathHistory
      .filter(e => e.optionsOpened.length > e.optionsClosed.length)
      .slice(-5);

    recentSuccesses.forEach(success => {
      if (this.hasPositiveSynergy(option, success)) {
        synergyScore += 0.1;
      }
    });

    // Check for conflicts with constraints
    const conflicts = context.pathMemory.constraints.filter(c => this.hasConflict(option, c));

    synergyScore -= conflicts.length * 0.1;

    // Bonus for addressing multiple constraints
    const addressedConstraints = context.pathMemory.constraints.filter(
      c =>
        option.description.toLowerCase().includes(c.type) ||
        option.actions.some(a => a.toLowerCase().includes(c.type))
    );

    synergyScore += addressedConstraints.length * 0.05;

    // Ensure within bounds
    synergyScore = Math.max(0.0, Math.min(1.0, synergyScore));

    option.synergyScore = synergyScore;

    return synergyScore;
  }

  /**
   * Estimate time to value in days
   */
  private estimateTimeToValue(option: Option): number {
    // Base estimates by strategy
    const strategyTimes: Record<string, number> = {
      temporal: 7, // Quick wins from time changes
      inversion: 7, // Assumption changes can be fast
      abstraction: 14, // Conceptual work takes some time
      stakeholder: 14, // Coordination takes time
      resource: 21, // Reallocation has lag
      capability: 30, // Learning takes time
      recombination: 21, // Integration work
      decomposition: 30, // Structural changes are slow
    };

    let timeToValue = strategyTimes[option.strategy] || 14;

    // Adjust based on action count
    timeToValue += option.actions.length * 2;

    // Adjust based on prerequisites
    timeToValue += option.prerequisites.length * 3;

    option.timeToValue = timeToValue;

    return timeToValue;
  }

  /**
   * Calculate overall score combining all factors
   */
  private calculateOverallScore(metrics: {
    flexibilityGain: number;
    implementationCost: number;
    reversibility: number;
    synergyScore: number;
    timeToValue: number;
  }): number {
    const weights = {
      flexibilityGain: 0.35, // Primary goal
      implementationCost: -0.2, // Cost is negative
      reversibility: 0.2, // Safety factor
      synergyScore: 0.15, // Compatibility
      timeToValue: -0.1, // Faster is better (normalized)
    };

    // Normalize time to value (0-1 scale, inverted)
    const normalizedTime = 1 - Math.min(metrics.timeToValue / 60, 1);

    const score =
      metrics.flexibilityGain * weights.flexibilityGain +
      (1 - metrics.implementationCost) * Math.abs(weights.implementationCost) +
      metrics.reversibility * weights.reversibility +
      metrics.synergyScore * weights.synergyScore +
      normalizedTime * Math.abs(weights.timeToValue);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determine recommendation level based on score and context
   */
  private determineRecommendation(
    score: number,
    context: OptionGenerationContext
  ): 'highly_recommended' | 'recommended' | 'viable' | 'last_resort' {
    const flexibility = context.currentFlexibility.flexibilityScore;

    // Adjust thresholds based on urgency
    if (flexibility < 0.2) {
      // Crisis mode - lower bar for recommendations
      if (score > 0.5) return 'highly_recommended';
      if (score > 0.3) return 'recommended';
      if (score > 0.2) return 'viable';
      return 'last_resort';
    } else if (flexibility < 0.4) {
      // Low flexibility - moderate bar
      if (score > 0.6) return 'highly_recommended';
      if (score > 0.4) return 'recommended';
      if (score > 0.25) return 'viable';
      return 'last_resort';
    } else {
      // Normal mode - higher bar
      if (score > 0.7) return 'highly_recommended';
      if (score > 0.5) return 'recommended';
      if (score > 0.3) return 'viable';
      return 'last_resort';
    }
  }

  /**
   * Generate human-readable reasoning for the evaluation
   */
  private generateReasoning(option: Option, metrics: Record<string, number>): string {
    const parts: string[] = [];

    // Flexibility gain assessment
    if (metrics.flexibilityGain > 0.3) {
      parts.push(`High flexibility gain (+${(metrics.flexibilityGain * 100).toFixed(0)}%)`);
    } else if (metrics.flexibilityGain > 0.15) {
      parts.push(`Moderate flexibility gain (+${(metrics.flexibilityGain * 100).toFixed(0)}%)`);
    }

    // Cost assessment
    if (metrics.implementationCost < 0.3) {
      parts.push('low implementation cost');
    } else if (metrics.implementationCost > 0.6) {
      parts.push('significant investment required');
    }

    // Reversibility
    if (metrics.reversibility > 0.7) {
      parts.push('highly reversible');
    } else if (metrics.reversibility < 0.3) {
      parts.push('difficult to reverse');
    }

    // Time to value
    if (metrics.timeToValue <= 7) {
      parts.push('quick results');
    } else if (metrics.timeToValue > 30) {
      parts.push('longer-term investment');
    }

    // Synergies
    if (metrics.synergyScore > 0.7) {
      parts.push('strong synergies with current approach');
    } else if (metrics.synergyScore < 0.3) {
      parts.push('may conflict with current constraints');
    }

    return parts.join(', ') + '.';
  }

  // Helper methods

  private calculateCategoryBonus(option: Option, context: OptionGenerationContext): number {
    let bonus = 0;

    // Bonus for addressing constraint types
    const constraintTypes = new Set(context.pathMemory.constraints.map(c => c.type));

    const categoryToConstraintMap: Record<string, ConstraintType[]> = {
      structural: ['technical'],
      technical: ['technical'],
      process: ['resource', 'technical'],
      relational: ['relational'],
      resource: ['resource'],
      capability: ['cognitive'],
      temporal: ['resource'],
      conceptual: ['cognitive', 'creative'],
    };

    const relevantConstraints = categoryToConstraintMap[option.category] || [];
    relevantConstraints.forEach(constraintType => {
      if (constraintTypes.has(constraintType)) {
        bonus += 0.05;
      }
    });

    return bonus;
  }

  private hasPositiveSynergy(option: Option, event: PathEvent): boolean {
    // Simple heuristic: same category or complementary strategies
    return option.description.toLowerCase().includes(event.decision.toLowerCase());
  }

  private hasConflict(option: Option, constraint: Constraint): boolean {
    // Check if option might conflict with constraint
    return constraint.affectedOptions.some((affected: string) =>
      option.actions.some(action => action.toLowerCase().includes(affected.toLowerCase()))
    );
  }
}
