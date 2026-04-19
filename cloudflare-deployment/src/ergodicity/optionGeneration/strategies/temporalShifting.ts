/**
 * Temporal Shifting Strategy - Create options by shifting time perspectives and temporal dynamics
 */

import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
import { COMMITMENT_THRESHOLDS } from '../constants.js';

export class TemporalShiftingStrategy extends BaseOptionStrategy {
  readonly strategyName = 'temporal_shifting' as const;
  readonly description =
    'Create flexibility by shifting temporal perspectives - zoom in/out on timeframes, create temporal buffers';
  readonly typicalFlexibilityGain = { min: 0.2, max: 0.4 };
  readonly applicableCategories: OptionCategory[] = ['temporal', 'process', 'structural'];

  isApplicable(context: OptionGenerationContext): boolean {
    // Look for time pressure or temporal constraints
    const hasTimePressure = context.pathMemory.constraints.some(
      c =>
        c.description.toLowerCase().includes('urgent') ||
        c.description.toLowerCase().includes('immediate') ||
        c.description.toLowerCase().includes('asap')
    );

    const hasTemporalRigidity =
      context.pathMemory.pathHistory.filter(
        event => event.commitmentLevel > COMMITMENT_THRESHOLDS.HIGH
      ).length > 2;

    return (
      hasTimePressure || hasTemporalRigidity || context.currentFlexibility.flexibilityScore < 0.35
    );
  }

  generate(context: OptionGenerationContext): Option[] {
    const options: Option[] = [];

    // Generate time horizon expansion option
    const expansionOption = this.createTimeHorizonExpansion(context);
    if (expansionOption && this.isCategoryAllowed(expansionOption.category, context)) {
      options.push(expansionOption);
    }

    // Generate temporal buffer creation option
    const bufferOption = this.createTemporalBuffer(context);
    if (bufferOption && this.isCategoryAllowed(bufferOption.category, context)) {
      options.push(bufferOption);
    }

    // Generate rhythm breaking option
    if (this.hasRigidRhythm(context)) {
      const rhythmOption = this.createRhythmBreaking(context);
      if (rhythmOption && this.isCategoryAllowed(rhythmOption.category, context)) {
        options.push(rhythmOption);
      }
    }

    // Generate temporal decoupling option
    const decouplingOption = this.createTemporalDecoupling(context);
    if (decouplingOption && this.isCategoryAllowed(decouplingOption.category, context)) {
      options.push(decouplingOption);
    }

    return options;
  }

  estimateEffort(option: Option): 'low' | 'medium' | 'high' {
    if (option.name.includes('Buffer')) return 'low';
    if (option.name.includes('Expansion')) return 'medium';
    if (option.name.includes('Decoupling')) return 'high';
    return 'medium';
  }

  private hasRigidRhythm(context: OptionGenerationContext): boolean {
    // Check for fixed temporal patterns
    const timeStamps = context.pathMemory.flexibilityOverTime.map(f => f.timestamp);
    if (timeStamps.length < 5) return false;

    // Calculate intervals
    const intervals: number[] = [];
    for (let i = 1; i < timeStamps.length; i++) {
      intervals.push(timeStamps[i] - timeStamps[i - 1]);
    }

    // Check if intervals are too regular (low variance)
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance =
      intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
    const coefficientOfVariation = Math.sqrt(variance) / avgInterval;

    return coefficientOfVariation < 0.2; // Very regular rhythm
  }

  private createTimeHorizonExpansion(context: OptionGenerationContext): Option {
    const currentHorizon = this.estimateCurrentHorizon(context);

    return this.createOption(
      'Expand Time Horizon Perspective',
      `Shift from ${currentHorizon} thinking to longer-term perspective. This reveals options invisible in short timeframes and reduces urgency pressure.`,
      'temporal',
      [
        'Map decisions across 3x current timeframe',
        'Identify which "urgent" items can actually wait',
        'Find natural breathing points in extended timeline',
        'Create decision criteria for different time horizons',
      ],
      ['Ability to step back from immediate pressures']
    );
  }

  private createTemporalBuffer(context: OptionGenerationContext): Option {
    // Use context to determine buffer sizing strategy
    const urgentConstraints = context.pathMemory.constraints.filter(c =>
      c.description.toLowerCase().includes('urgent')
    ).length;
    const bufferStrategy =
      urgentConstraints > 2
        ? 'Create protective buffers around critical urgent items'
        : 'Distribute buffers evenly across timeline';
    return this.createOption(
      'Create Temporal Buffers',
      'Build slack time between commitments to absorb unexpected changes. Buffers act as flexibility reserves in your timeline.',
      'temporal',
      [
        'Add 20-30% buffer time to all estimates',
        'Create explicit "option windows" in schedule',
        'Build contingency time for high-risk activities',
        'Protect buffers from being consumed prematurely',
        bufferStrategy,
      ],
      ['Some control over scheduling', 'Realistic time estimates']
    );
  }

  private createRhythmBreaking(context: OptionGenerationContext): Option {
    // Use context to design rhythm disruption approach
    const rigidityLevel = context.pathMemory.pathHistory.filter(
      e => e.commitmentLevel > 0.8
    ).length;
    const disruptionIntensity =
      rigidityLevel > 3
        ? 'Strong disruption needed - introduce significant rhythm variations'
        : 'Gentle rhythm variations to maintain flexibility';
    return this.createOption(
      'Break Temporal Rhythm',
      'Disrupt fixed temporal patterns that limit flexibility. Varying rhythm creates opportunities for new options to emerge.',
      'process',
      [
        'Introduce irregular intervals for key decisions',
        'Vary work session lengths based on needs',
        'Create unexpected pause points for reflection',
        'Use random timing for some activities',
        disruptionIntensity,
      ],
      ['Flexibility in routine', 'Tolerance for irregularity']
    );
  }

  private createTemporalDecoupling(context: OptionGenerationContext): Option {
    const coupledActivities = this.identifyCoupledActivities(context);
    const decouplingFocus =
      coupledActivities.length > 2
        ? `Focus on decoupling these ${coupledActivities.length} tightly bound activities`
        : 'General temporal decoupling to increase flexibility';

    return this.createOption(
      'Temporal Decoupling',
      'Separate activities that seem time-locked together. This creates independent timing options for each component.',
      'structural',
      [
        'Identify falsely coupled time dependencies',
        'Create asynchronous workflows where possible',
        'Buffer outputs to enable independent timing',
        'Design interfaces that allow temporal flexibility',
        decouplingFocus,
      ],
      ['Understanding of activity dependencies', 'Ability to restructure workflows']
    );
  }

  private estimateCurrentHorizon(context: OptionGenerationContext): string {
    const recentDecisions = context.pathMemory.pathHistory.slice(-5);
    const hasDaily = recentDecisions.some(
      d => d.decision.toLowerCase().includes('today') || d.decision.toLowerCase().includes('daily')
    );
    const hasWeekly = recentDecisions.some(
      d => d.decision.toLowerCase().includes('week') || d.decision.toLowerCase().includes('weekly')
    );

    if (hasDaily) return 'daily';
    if (hasWeekly) return 'weekly';
    return 'short-term';
  }

  private identifyCoupledActivities(context: OptionGenerationContext): string[] {
    // Analyze path history for activities that always occur together
    const activities: string[] = [];
    const decisions = context.pathMemory.pathHistory;

    for (let i = 1; i < decisions.length; i++) {
      const timeDiff = Math.abs(
        new Date(decisions[i].timestamp).getTime() - new Date(decisions[i - 1].timestamp).getTime()
      );
      if (timeDiff < 3600000) {
        // Within 1 hour
        activities.push(`${decisions[i - 1].decision} → ${decisions[i].decision}`);
      }
    }

    return activities.slice(0, 3); // Return top 3 coupled activities
  }
}
