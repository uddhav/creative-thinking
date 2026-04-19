/**
 * Technical Debt Analyzer - Monitors solution complexity and technical rigidity
 */

import { Sensor } from './base.js';
import type { TechnicalDebtMetrics, SensorCalibration } from '../types.js';
import type { PathMemory, Barrier } from '../../types.js';
import type { SessionData } from '../../../index.js';

export class TechnicalDebtAnalyzer extends Sensor {
  constructor(calibration?: Partial<SensorCalibration>) {
    super('technical_debt', calibration);
  }

  /**
   * Calculate technical debt level
   */
  protected getRawReading(pathMemory: PathMemory, sessionData: SessionData): Promise<number> {
    const metrics = this.calculateTechnicalDebtMetrics(pathMemory);

    // Weighted combination of debt factors
    const weights = {
      entropy: 0.3,
      velocity: 0.25,
      modularity: 0.25,
      coupling: 0.2,
    };

    // Calculate debt scores (0 = no debt, 1 = critical debt)
    const entropyDebt = metrics.entropyScore;
    const velocityDebt = 1 - metrics.changeVelocity;
    const modularityDebt = 1 - metrics.modularityIndex;
    const couplingDebt = metrics.couplingScore;

    // Weighted average
    let overallDebt =
      entropyDebt * weights.entropy +
      velocityDebt * weights.velocity +
      modularityDebt * weights.modularity +
      couplingDebt * weights.coupling;

    // Adjust debt score based on session length
    // Longer sessions tend to accumulate more technical debt
    const sessionLength = sessionData.history.length;
    if (sessionLength > 50) {
      // Add 10% penalty for very long sessions
      overallDebt = Math.min(1, overallDebt * 1.1);
    }

    return Promise.resolve(Math.min(1, Math.max(0, overallDebt)));
  }

  /**
   * Detect specific technical debt indicators
   */
  protected detectIndicators(pathMemory: PathMemory, sessionData: SessionData): Promise<string[]> {
    const indicators: string[] = [];
    const metrics = this.calculateTechnicalDebtMetrics(pathMemory);

    // Entropy indicators
    if (metrics.entropyScore > 0.7) {
      indicators.push('High solution entropy detected');
    }
    if (metrics.debtAccumulation > 1.5) {
      indicators.push('Rapid debt accumulation');
    }

    // Velocity indicators
    if (metrics.changeVelocity < 0.3) {
      indicators.push('Change velocity critically low');
    }

    // Modularity indicators
    if (metrics.modularityIndex < 0.3) {
      indicators.push('Low solution modularity');
    }

    // Coupling indicators
    if (metrics.couplingScore > 0.7) {
      indicators.push('High interdependency detected');
    }

    // Refactor cost indicators
    if (metrics.refactorCost > 0.8) {
      indicators.push('High refactoring cost');
    }

    // Pattern indicators
    if (this.detectHackyPatterns(pathMemory)) {
      indicators.push('Quick-fix patterns accumulating');
    }

    // Session-specific indicators
    const latestStep = sessionData.history[sessionData.history.length - 1];
    if (
      latestStep &&
      latestStep.currentStep > latestStep.totalSteps * 0.8 &&
      metrics.entropyScore > 0.5
    ) {
      indicators.push('Late-stage complexity accumulation');
    }

    // Session-specific indicators
    if (sessionData.history.length > 30 && metrics.changeVelocity < 0.3) {
      indicators.push('Extended session with low change velocity');
    }
    if (sessionData.history.length > 40) {
      indicators.push(`Very long session (${sessionData.history.length} operations)`);
    }

    return Promise.resolve(indicators);
  }

  /**
   * Gather technical debt context
   */
  protected gatherContext(
    pathMemory: PathMemory,
    sessionData: SessionData
  ): Promise<Record<string, unknown>> {
    const metrics = this.calculateTechnicalDebtMetrics(pathMemory);

    return Promise.resolve({
      technicalDebtMetrics: metrics,
      quickFixCount: this.countQuickFixes(pathMemory),
      irreversibleDecisions: this.countIrreversibleDecisions(pathMemory),
      solutionComplexity: this.calculateSolutionComplexity(pathMemory),
      refactorOpportunities: this.identifyRefactorOpportunities(pathMemory),
      sessionLength: sessionData.history.length,
      techniqueUsed: sessionData.technique,
    });
  }

  /**
   * Calculate technical debt metrics
   */
  private calculateTechnicalDebtMetrics(pathMemory: PathMemory): TechnicalDebtMetrics {
    return {
      entropyScore: this.calculateEntropy(pathMemory),
      changeVelocity: this.calculateChangeVelocity(pathMemory),
      modularityIndex: this.calculateModularity(pathMemory),
      couplingScore: this.calculateCoupling(pathMemory),
      refactorCost: this.calculateRefactorCost(pathMemory),
      debtAccumulation: this.calculateDebtAccumulation(pathMemory),
    };
  }

  /**
   * Calculate solution entropy (disorder)
   */
  private calculateEntropy(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length === 0) return 0;

    // High commitment + low reversibility = entropy
    const entropyEvents = pathMemory.pathHistory.filter(
      e => e.commitmentLevel > 0.6 && e.reversibilityCost > 0.6
    );

    const entropyRatio = entropyEvents.length / pathMemory.pathHistory.length;

    // Constraint accumulation adds to entropy
    const constraintEntropy = Math.min(pathMemory.constraints.length * 0.1, 0.5);

    return Math.min(entropyRatio + constraintEntropy, 1);
  }

  /**
   * Calculate change velocity
   */
  private calculateChangeVelocity(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length < 5) return 1;

    // Recent decisions
    const recent = pathMemory.pathHistory.slice(-10);

    // Low reversibility = slow change
    const avgReversibility =
      recent.map(e => 1 - e.reversibilityCost).reduce((a, b) => a + b, 0) / recent.length;

    // Many constraints = slow change
    const constraintPenalty = Math.min(pathMemory.constraints.length * 0.05, 0.5);

    return Math.max(0, avgReversibility - constraintPenalty);
  }

  /**
   * Calculate solution modularity
   */
  private calculateModularity(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length === 0) return 1;

    // Independent decisions = modular
    const independentDecisions = pathMemory.pathHistory.filter(
      e => e.optionsClosed.length === 0 && e.constraintsCreated.length === 0
    );

    const independenceRatio = independentDecisions.length / pathMemory.pathHistory.length;

    // Low coupling between decisions = modular
    const avgOptionsClosedPerDecision =
      pathMemory.pathHistory.map(e => e.optionsClosed.length).reduce((a, b) => a + b, 0) /
      pathMemory.pathHistory.length;

    const couplingPenalty = Math.min(avgOptionsClosedPerDecision * 0.2, 0.5);

    return Math.max(0, independenceRatio - couplingPenalty);
  }

  /**
   * Calculate coupling score
   */
  private calculateCoupling(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length === 0) return 0;

    // Options closed = coupling
    const totalOptionsClosed = pathMemory.pathHistory
      .map(e => e.optionsClosed.length)
      .reduce((a, b) => a + b, 0);

    const avgCoupling = totalOptionsClosed / pathMemory.pathHistory.length;

    // Constraints = coupling
    const constraintCoupling = pathMemory.constraints.length * 0.1;

    return Math.min(avgCoupling * 0.2 + constraintCoupling, 1);
  }

  /**
   * Calculate refactoring cost
   */
  private calculateRefactorCost(pathMemory: PathMemory): number {
    // High commitment decisions are expensive to refactor
    const highCommitmentCount = pathMemory.pathHistory.filter(e => e.commitmentLevel > 0.7).length;

    // Irreversible decisions can't be refactored
    const irreversibleCount = pathMemory.pathHistory.filter(e => e.reversibilityCost > 0.8).length;

    const totalDecisions = Math.max(pathMemory.pathHistory.length, 1);

    const commitmentCost = (highCommitmentCount / totalDecisions) * 0.5;
    const irreversibilityCost = (irreversibleCount / totalDecisions) * 0.5;

    return commitmentCost + irreversibilityCost;
  }

  /**
   * Calculate rate of debt accumulation
   */
  private calculateDebtAccumulation(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length < 10) return 1;

    const recent = pathMemory.pathHistory.slice(-5);
    const older = pathMemory.pathHistory.slice(-10, -5);

    const recentDebt = this.calculateAverageDebt(recent);
    const olderDebt = this.calculateAverageDebt(older);

    // Rate of increase
    return olderDebt > 0 ? recentDebt / olderDebt : 1;
  }

  /**
   * Calculate average debt for a set of events
   */
  private calculateAverageDebt(events: PathMemory['pathHistory']): number {
    if (events.length === 0) return 0;

    const totalDebt = events
      .map((e: PathMemory['pathHistory'][0]) => e.commitmentLevel * 0.5 + e.reversibilityCost * 0.5)
      .reduce((a: number, b: number) => a + b, 0);

    return events.length > 0 ? totalDebt / events.length : 0;
  }

  /**
   * Detect hacky patterns
   */
  private detectHackyPatterns(pathMemory: PathMemory): boolean {
    const recent = pathMemory.pathHistory.slice(-10);

    // Quick decisions with high commitment = hacks
    const quickHighCommitment = recent.filter(
      e => e.commitmentLevel > 0.7 && e.optionsOpened.length < 2
    );

    return quickHighCommitment.length > 3;
  }

  /**
   * Count quick fixes
   */
  private countQuickFixes(pathMemory: PathMemory): number {
    return pathMemory.pathHistory.filter(
      e =>
        e.commitmentLevel > 0.6 &&
        e.optionsOpened.length === 0 &&
        e.decision.toLowerCase().includes('fix')
    ).length;
  }

  /**
   * Count irreversible decisions
   */
  private countIrreversibleDecisions(pathMemory: PathMemory): number {
    return pathMemory.pathHistory.filter(e => e.reversibilityCost > 0.8).length;
  }

  /**
   * Calculate solution complexity
   */
  private calculateSolutionComplexity(pathMemory: PathMemory): number {
    const decisions = pathMemory.pathHistory.length;
    const constraints = pathMemory.constraints.length;
    const closedOptions = pathMemory.foreclosedOptions.length;

    // Simple heuristic
    return Math.min(decisions * 0.02 + constraints * 0.1 + closedOptions * 0.05, 1);
  }

  /**
   * Identify refactor opportunities
   */
  private identifyRefactorOpportunities(pathMemory: PathMemory): string[] {
    const opportunities: string[] = [];

    // High coupling areas
    const highCouplingDecisions = pathMemory.pathHistory
      .filter(e => e.optionsClosed.length > 3)
      .slice(-3);

    if (highCouplingDecisions.length > 0) {
      opportunities.push('Decouple recent high-dependency decisions');
    }

    // Repeated patterns
    const techniques = pathMemory.pathHistory.map(e => e.technique);
    const repeated = this.findRepeatedPatterns(techniques);
    if (repeated.length > 0) {
      opportunities.push('Abstract repeated patterns into reusable approach');
    }

    // Low modularity areas
    if (this.calculateModularity(pathMemory) < 0.3) {
      opportunities.push('Break monolithic decisions into smaller modules');
    }

    return opportunities;
  }

  /**
   * Find repeated patterns
   */
  private findRepeatedPatterns(items: string[]): string[] {
    const patterns: string[] = [];
    const counts = new Map<string, number>();

    for (const item of items) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }

    for (const [item, count] of counts) {
      if (count > 3) {
        patterns.push(item);
      }
    }

    return patterns;
  }

  /**
   * Get barriers monitored by this sensor
   */
  getMonitoredBarriers(): Barrier[] {
    return [
      {
        id: 'technical_debt_barrier',
        type: 'creative',
        subtype: 'technical_debt',
        name: 'Technical Debt',
        description: 'Accumulated complexity preventing further progress',
        proximity: 0,
        impact: 'difficult',
        warningThreshold: 0.3,
        indicators: [
          'Increasing complexity',
          'Slowing change velocity',
          'High coupling between components',
          'Expensive refactoring',
        ],
        avoidanceStrategies: [
          'Regular refactoring sprints',
          'Document decisions clearly',
          'Build modular architecture',
          'Maintain upgrade paths',
        ],
      },
    ];
  }
}
