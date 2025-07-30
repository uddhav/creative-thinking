/**
 * Neural Optimization Strategy - Create options by leveraging neural state management
 */

import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';

export class NeuralOptimizationStrategy extends BaseOptionStrategy {
  readonly strategyName = 'neural_optimization' as const;
  readonly description =
    'Create flexibility by optimizing neural states - switching between focused and diffuse thinking modes';
  readonly typicalFlexibilityGain = { min: 0.15, max: 0.35 };
  readonly applicableCategories: OptionCategory[] = ['process', 'capability', 'conceptual'];

  isApplicable(context: OptionGenerationContext): boolean {
    // Look for cognitive rigidity or stuck patterns
    const hasRigidPatterns = context.pathMemory.pathHistory.some(
      event =>
        event.decision.toLowerCase().includes('stuck') ||
        event.decision.toLowerCase().includes('rigid') ||
        event.decision.toLowerCase().includes('fixed')
    );

    const lowFlexibility = context.currentFlexibility.flexibilityScore < 0.4;
    const repetitiveDecisions = this.hasRepetitivePatterns(context);

    return hasRigidPatterns || (lowFlexibility && repetitiveDecisions);
  }

  generate(context: OptionGenerationContext): Option[] {
    const options: Option[] = [];

    // Generate Default Mode Network activation option
    if (this.needsDMNActivation(context)) {
      const dmnOption = this.createDMNOption(context);
      if (dmnOption && this.isCategoryAllowed(dmnOption.category, context)) {
        options.push(dmnOption);
      }
    }

    // Generate Executive Control Network optimization
    if (this.needsECNOptimization(context)) {
      const ecnOption = this.createECNOption(context);
      if (ecnOption && this.isCategoryAllowed(ecnOption.category, context)) {
        options.push(ecnOption);
      }
    }

    // Generate network switching rhythm option
    if (this.needsSwitchingRhythm(context)) {
      const switchOption = this.createSwitchingOption(context);
      if (switchOption && this.isCategoryAllowed(switchOption.category, context)) {
        options.push(switchOption);
      }
    }

    // Generate cognitive load redistribution option
    const redistributionOption = this.createLoadRedistributionOption(context);
    if (redistributionOption && this.isCategoryAllowed(redistributionOption.category, context)) {
      options.push(redistributionOption);
    }

    return options;
  }

  estimateEffort(option: Option): 'low' | 'medium' | 'high' {
    if (option.name.includes('Activation')) return 'low';
    if (option.name.includes('Optimization')) return 'medium';
    if (option.name.includes('Rhythm')) return 'medium';
    return 'high'; // Redistribution requires more effort
  }

  private hasRepetitivePatterns(context: OptionGenerationContext): boolean {
    const recentDecisions = context.pathMemory.pathHistory.slice(-5);
    const uniquePatterns = new Set(
      recentDecisions.map(d => d.decision.split(' ').slice(0, 3).join(' '))
    );
    return uniquePatterns.size < recentDecisions.length * 0.6;
  }

  private needsDMNActivation(context: OptionGenerationContext): boolean {
    // Check if too focused/narrow
    const narrowFocus = context.pathMemory.constraints.filter(c => c.strength > 0.7).length >= 3; // Changed from > 3 to >= 3

    return narrowFocus || context.currentFlexibility.flexibilityScore < 0.3;
  }

  private needsECNOptimization(context: OptionGenerationContext): boolean {
    // Check if too scattered/unfocused
    const highVariability =
      context.pathMemory.flexibilityOverTime.length > 5 &&
      this.calculateVariability(context.pathMemory.flexibilityOverTime) > 0.3;

    return highVariability;
  }

  private needsSwitchingRhythm(context: OptionGenerationContext): boolean {
    // Check if stuck in one mode
    return (
      context.pathMemory.pathHistory.length > 10 &&
      context.currentFlexibility.flexibilityScore < 0.5
    );
  }

  private calculateVariability(scores: Array<{ score: number }>): number {
    if (scores.length < 2) return 0;
    const values = scores.map(s => s.score);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private createDMNOption(context: OptionGenerationContext): Option {
    // Use context to tailor DMN activation approach
    const flexibilityLevel = context.currentFlexibility.flexibilityScore;
    const urgencyNote =
      flexibilityLevel < 0.2
        ? 'Critical: Immediate DMN activation needed to restore flexibility'
        : 'Regular DMN activation sessions to maintain creative flow';
    return this.createOption(
      'Default Mode Network Activation',
      'Engage diffuse thinking by introducing unstructured exploration time. This activates the Default Mode Network to discover hidden connections and creative solutions.',
      'process',
      [
        'Schedule 20-minute unstructured thinking sessions',
        'Use mind-wandering techniques with loose problem framing',
        'Capture emergent insights without judgment',
        'Allow cross-domain associations to form naturally',
        urgencyNote,
      ],
      ['Quiet environment', 'Reduced immediate pressure']
    );
  }

  private createECNOption(context: OptionGenerationContext): Option {
    // Use context to determine ECN optimization priorities
    const variability = this.calculateVariability(context.pathMemory.flexibilityOverTime);
    const focusStrategy =
      variability > 0.4
        ? 'High variability detected - implement strict focus protocols'
        : 'Maintain balanced focus with periodic reviews';
    return this.createOption(
      'Executive Control Network Optimization',
      'Enhance focused problem-solving by structuring decision-making processes. This optimizes the Executive Control Network for systematic analysis.',
      'process',
      [
        'Create structured decision frameworks',
        'Implement systematic evaluation criteria',
        'Use time-boxed focused work sessions',
        'Apply analytical tools to break down complexity',
        focusStrategy,
      ],
      ['Clear objectives', 'Measurable criteria']
    );
  }

  private createSwitchingOption(context: OptionGenerationContext): Option {
    // Use context to design optimal switching rhythm
    const sessionLength = context.pathMemory.pathHistory.length;
    const rhythmDesign =
      sessionLength > 20
        ? 'Extended work requires more frequent mode switches'
        : 'Standard pomodoro-style switching rhythm';
    return this.createOption(
      'Neural Network Switching Rhythm',
      'Develop a rhythm between focused and diffuse thinking modes. This creates cognitive flexibility through intentional mode switching.',
      'capability',
      [
        'Alternate 25-minute focused sessions with 10-minute diffuse breaks',
        'Use transition rituals to signal mode switches',
        'Track energy and insight patterns',
        'Adjust timing based on cognitive load',
        rhythmDesign,
      ],
      ['Awareness of current neural state', 'Flexible schedule']
    );
  }

  private createLoadRedistributionOption(context: OptionGenerationContext): Option {
    const currentConstraints = context.pathMemory.constraints.filter(c => c.strength > 0.5).length;
    const redistributionPriority =
      currentConstraints > 4
        ? `High cognitive load detected (${currentConstraints} active constraints) - urgent redistribution needed`
        : 'Proactive load management to maintain cognitive flexibility';

    return this.createOption(
      'Cognitive Load Redistribution',
      'Redistribute cognitive load by externalizing constraints and decisions. This frees up mental resources for creative problem-solving.',
      'conceptual',
      [
        'Document all active constraints and decisions',
        'Create external decision support systems',
        'Delegate or automate routine cognitive tasks',
        'Use visual thinking tools to offload complexity',
        redistributionPriority,
      ],
      ['Documentation tools', 'Delegation possibilities']
    );
  }
}
