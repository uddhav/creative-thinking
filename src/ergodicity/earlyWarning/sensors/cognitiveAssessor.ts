/**
 * Cognitive Assessor - Monitors mental flexibility and detects cognitive lock-in
 */

import { Sensor } from './base.js';
import type { CognitiveMetrics, SensorCalibration } from '../types.js';
import type { PathMemory, Barrier } from '../../types.js';
import type { SessionData } from '../../../index.js';

export class CognitiveAssessor extends Sensor {
  constructor(calibration?: Partial<SensorCalibration>) {
    // Cognitive sensor should be less sensitive in early stages
    const cognitiveCalibration = {
      sensitivity: 0.6, // Less sensitive than default
      warningThresholds: {
        caution: 0.45, // Only caution when less than 45% diverse
        warning: 0.25, // Warning at 25% diversity
        critical: 0.1, // Critical at 10% diversity
      },
      ...calibration,
    };
    super('cognitive', cognitiveCalibration);
  }

  /**
   * Calculate cognitive rigidity level
   */
  protected async getRawReading(pathMemory: PathMemory, sessionData: SessionData): Promise<number> {
    const metrics = this.calculateCognitiveMetrics(pathMemory, sessionData);

    // Weighted combination of cognitive factors
    const weights = {
      perspectiveDiversity: 0.3,
      assumptionChallenge: 0.25,
      learningVelocity: 0.25,
      mentalFlexibility: 0.2,
    };

    // Calculate rigidity scores (0 = flexible, 1 = rigid)
    const perspectiveRigidity = 1 - metrics.perspectiveDiversity;
    const assumptionRigidity = 1 - metrics.assumptionChallengeRate;
    const learningRigidity = 1 - metrics.learningVelocity;
    const mentalRigidity = 1 - metrics.mentalModelFlexibility;

    // Weighted average
    const overallRigidity =
      perspectiveRigidity * weights.perspectiveDiversity +
      assumptionRigidity * weights.assumptionChallenge +
      learningRigidity * weights.learningVelocity +
      mentalRigidity * weights.mentalFlexibility;

    // Apply pattern-based adjustments
    const patternAdjusted = this.adjustForCognitivePatterns(overallRigidity, pathMemory);

    return Math.min(1, Math.max(0, patternAdjusted));
  }

  /**
   * Detect specific cognitive rigidity indicators
   */
  protected async detectIndicators(pathMemory: PathMemory, sessionData: SessionData): Promise<string[]> {
    const indicators: string[] = [];
    const metrics = this.calculateCognitiveMetrics(pathMemory, sessionData);

    // Perspective diversity indicators
    if (metrics.perspectiveDiversity < 0.3) {
      indicators.push('Limited perspective diversity');
    }
    if (this.detectPerspectiveNarrowing(pathMemory)) {
      indicators.push('Perspective narrowing over time');
    }

    // Assumption challenging indicators
    if (metrics.assumptionChallengeRate < 0.2) {
      indicators.push('Rarely questioning assumptions');
    }
    if (this.detectAssumptionHardening(pathMemory)) {
      indicators.push('Assumptions becoming rigid');
    }

    // Learning indicators
    if (metrics.learningVelocity < 0.2) {
      indicators.push('Slow learning rate');
    }
    if (this.detectLearningPlateau(sessionData)) {
      indicators.push('Learning plateau detected');
    }

    // Mental model indicators
    if (metrics.mentalModelFlexibility < 0.3) {
      indicators.push('Rigid mental models');
    }
    if (this.detectFrameworkLockIn(pathMemory)) {
      indicators.push('Framework lock-in detected');
    }

    // Creativity indicators
    if (metrics.creativeDivergence < 0.3) {
      indicators.push('Low creative divergence');
    }
    if (this.detectRepetitiveThinking(pathMemory)) {
      indicators.push('Repetitive thinking patterns');
    }

    return indicators;
  }

  /**
   * Gather cognitive-specific context
   */
  protected async gatherContext(
    pathMemory: PathMemory,
    sessionData: SessionData
  ): Promise<Record<string, unknown>> {
    const metrics = this.calculateCognitiveMetrics(pathMemory, sessionData);

    return {
      cognitiveMetrics: metrics,
      uniqueTechniquesUsed: this.countUniqueTechniques(pathMemory),
      perspectiveShifts: this.countPerspectiveShifts(pathMemory),
      assumptionsChallenged: this.identifyChallengedAssumptions(pathMemory),
      dominantTechnique: this.identifyDominantTechnique(pathMemory),
      thinkingLoops: this.detectThinkingLoops(pathMemory),
      cognitiveLoad: this.estimateCognitiveLoad(pathMemory),
    };
  }

  /**
   * Calculate comprehensive cognitive metrics
   */
  private calculateCognitiveMetrics(
    pathMemory: PathMemory,
    sessionData: SessionData
  ): CognitiveMetrics {
    return {
      perspectiveDiversity: this.calculatePerspectiveDiversity(pathMemory),
      assumptionChallengeRate: this.calculateAssumptionChallengeRate(pathMemory),
      learningVelocity: this.calculateLearningVelocity(sessionData),
      mentalModelFlexibility: this.calculateMentalModelFlexibility(pathMemory),
      creativeDivergence: this.calculateCreativeDivergence(pathMemory),
    };
  }

  /**
   * Calculate diversity of perspectives used
   */
  private calculatePerspectiveDiversity(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length === 0) {
      return 1.0;
    }

    // Give more lenient assessment for early stages
    if (pathMemory.pathHistory.length < 10) {
      // In early stages, assume diversity is good unless proven otherwise
      return 0.8; // 80% diversity assumed for early exploration
    }

    const recentHistory = pathMemory.pathHistory.slice(-20);

    // Count unique techniques - adjust denominator based on history size
    const techniques = new Set(recentHistory.map(e => e.technique));
    const maxExpectedTechniques = Math.min(recentHistory.length / 3, 8); // Expect technique variety every 3 steps
    const techniquesDiversity = techniques.size / maxExpectedTechniques;

    // Count unique decision types
    const decisionPatterns = new Set(
      recentHistory.map(e => this.classifyDecisionPattern(e.decision))
    );
    const maxExpectedPatterns = Math.min(recentHistory.length / 4, 5); // Expect pattern variety every 4 steps
    const patternDiversity = decisionPatterns.size / maxExpectedPatterns;

    // Count option variety - scale expectations with history size
    const allOptions = recentHistory.flatMap(e => [...e.optionsOpened, ...e.optionsClosed]);
    const uniqueOptions = new Set(allOptions);
    const maxExpectedOptions = Math.min(recentHistory.length * 1.5, 20); // 1.5 unique options per step
    const optionDiversity = uniqueOptions.size / maxExpectedOptions;

    // Weight recent diversity more heavily than technique diversity early on
    const weights =
      recentHistory.length < 15
        ? { technique: 0.2, pattern: 0.4, option: 0.4 }
        : { technique: 0.33, pattern: 0.33, option: 0.34 };

    return Math.min(
      1,
      techniquesDiversity * weights.technique +
        patternDiversity * weights.pattern +
        optionDiversity * weights.option
    );
  }

  /**
   * Calculate how often assumptions are challenged
   */
  private calculateAssumptionChallengeRate(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length === 0) {
      return 0.5; // Neutral starting point
    }

    const recentHistory = pathMemory.pathHistory.slice(-15);

    // Look for indicators of assumption challenging
    let challengeIndicators = 0;

    // High reversibility decisions indicate willingness to question
    const reversibleDecisions = recentHistory.filter(e => e.reversibilityCost < 0.3);
    challengeIndicators += reversibleDecisions.length / recentHistory.length;

    // Option creation indicates exploring alternatives
    const avgOptionsCreated =
      recentHistory.map(e => e.optionsOpened.length).reduce((a, b) => a + b, 0) /
      recentHistory.length;
    challengeIndicators += Math.min(avgOptionsCreated / 3, 0.5);

    // Low commitment indicates questioning
    const avgCommitment =
      recentHistory.map(e => e.commitmentLevel).reduce((a, b) => a + b, 0) / recentHistory.length;
    challengeIndicators += (1 - avgCommitment) * 0.5;

    return Math.min(challengeIndicators, 1);
  }

  /**
   * Calculate rate of learning and insight generation
   */
  private calculateLearningVelocity(sessionData: SessionData): number {
    if (!sessionData.history || sessionData.history.length < 5) {
      return 0.5;
    }

    // Insights per decision
    const insightRate = sessionData.insights.length / sessionData.history.length;

    // Improvement in metrics over time
    const metricsImprovement = this.calculateMetricsImprovement(sessionData);

    // Variety in approaches over time
    const approachEvolution = this.calculateApproachEvolution(sessionData);

    return Math.min((insightRate + metricsImprovement + approachEvolution) / 3, 1);
  }

  /**
   * Calculate flexibility of mental models
   */
  private calculateMentalModelFlexibility(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length < 5) {
      return 0.7;
    }

    // Framework switching frequency
    const frameworkSwitches = this.countFrameworkSwitches(pathMemory);
    const switchRate = frameworkSwitches / (pathMemory.pathHistory.length - 1);

    // Willingness to reverse course
    const reversals = pathMemory.pathHistory.filter(e => e.reversibilityCost < 0.5).length;
    const reversalRate = reversals / pathMemory.pathHistory.length;

    // Adaptation to feedback
    const adaptationRate = this.calculateAdaptationRate(pathMemory);

    return (switchRate + reversalRate + adaptationRate) / 3;
  }

  /**
   * Calculate creative divergence in solutions
   */
  private calculateCreativeDivergence(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length === 0) {
      return 1.0;
    }

    // Variety in decisions
    const decisions = pathMemory.pathHistory.map(e => e.decision);
    const uniqueDecisions = new Set(decisions);
    const decisionVariety = uniqueDecisions.size / decisions.length;

    // Options generated per decision
    const totalOptions = pathMemory.pathHistory
      .map(e => e.optionsOpened.length)
      .reduce((a, b) => a + b, 0);
    const optionRate = totalOptions / pathMemory.pathHistory.length;
    const normalizedOptionRate = Math.min(optionRate / 3, 1);

    // Technique variety
    const techniques = pathMemory.pathHistory.map(e => e.technique);
    const uniqueTechniques = new Set(techniques);
    const techniqueVariety = uniqueTechniques.size / Math.min(techniques.length, 8);

    return (decisionVariety + normalizedOptionRate + techniqueVariety) / 3;
  }

  /**
   * Adjust reading based on cognitive patterns
   */
  private adjustForCognitivePatterns(baseReading: number, pathMemory: PathMemory): number {
    let adjusted = baseReading;

    // Repeated technique usage increases rigidity
    if (this.detectTechniqueFixation(pathMemory)) {
      adjusted *= 1.2;
    }

    // Circular reasoning patterns
    if (this.detectCircularReasoning(pathMemory)) {
      adjusted *= 1.15;
    }

    // Confirmation bias patterns
    if (this.detectConfirmationBias(pathMemory)) {
      adjusted *= 1.1;
    }

    return Math.min(adjusted, 1);
  }

  /**
   * Detect narrowing of perspectives over time
   */
  private detectPerspectiveNarrowing(pathMemory: PathMemory): boolean {
    if (pathMemory.pathHistory.length < 20) {
      return false;
    }

    const early = pathMemory.pathHistory.slice(0, 10);
    const recent = pathMemory.pathHistory.slice(-10);

    const earlyTechniques = new Set(early.map(e => e.technique)).size;
    const recentTechniques = new Set(recent.map(e => e.technique)).size;

    return recentTechniques < earlyTechniques * 0.7;
  }

  /**
   * Detect hardening of assumptions
   */
  private detectAssumptionHardening(pathMemory: PathMemory): boolean {
    if (pathMemory.pathHistory.length < 15) {
      return false;
    }

    const recent = pathMemory.pathHistory.slice(-10);
    const highCommitment = recent.filter(e => e.commitmentLevel > 0.7).length;
    const lowReversibility = recent.filter(e => e.reversibilityCost > 0.7).length;

    return highCommitment > 6 && lowReversibility > 5;
  }

  /**
   * Detect learning plateau
   */
  private detectLearningPlateau(sessionData: SessionData): boolean {
    if (sessionData.insights.length < 3) {
      return false;
    }

    // Check if insights are becoming less frequent
    const _totalSteps = sessionData.history.length;
    const firstHalfInsights = sessionData.insights.filter(
      (_: unknown, i: number) => i < sessionData.insights.length / 2
    ).length;
    const secondHalfInsights = sessionData.insights.length - firstHalfInsights;

    return secondHalfInsights < firstHalfInsights * 0.5;
  }

  /**
   * Detect framework lock-in
   */
  private detectFrameworkLockIn(pathMemory: PathMemory): boolean {
    if (pathMemory.pathHistory.length < 10) {
      return false;
    }

    const recent = pathMemory.pathHistory.slice(-10);
    const techniques = recent.map(e => e.technique);
    const dominantTechnique = this.findMostCommon(techniques);
    const dominantCount = techniques.filter(t => t === dominantTechnique).length;

    return dominantCount > 7;
  }

  /**
   * Detect repetitive thinking patterns
   */
  private detectRepetitiveThinking(pathMemory: PathMemory): boolean {
    if (pathMemory.pathHistory.length < 10) {
      return false;
    }

    const recent = pathMemory.pathHistory.slice(-10);
    const decisions = recent.map(e => this.normalizeDecision(e.decision));
    const uniqueDecisions = new Set(decisions).size;

    return uniqueDecisions < 4;
  }

  /**
   * Classify decision patterns
   */
  private classifyDecisionPattern(decision: string): string {
    const lower = decision.toLowerCase();
    if (lower.includes('combine') || lower.includes('merge')) return 'combination';
    if (lower.includes('eliminate') || lower.includes('remove')) return 'elimination';
    if (lower.includes('reverse') || lower.includes('opposite')) return 'reversal';
    if (lower.includes('adapt') || lower.includes('modify')) return 'adaptation';
    return 'exploration';
  }

  /**
   * Count unique techniques used
   */
  private countUniqueTechniques(pathMemory: PathMemory): number {
    return new Set(pathMemory.pathHistory.map(e => e.technique)).size;
  }

  /**
   * Count perspective shifts
   */
  private countPerspectiveShifts(pathMemory: PathMemory): number {
    let shifts = 0;
    for (let i = 1; i < pathMemory.pathHistory.length; i++) {
      if (pathMemory.pathHistory[i].technique !== pathMemory.pathHistory[i - 1].technique) {
        shifts++;
      }
    }
    return shifts;
  }

  /**
   * Identify challenged assumptions
   */
  private identifyChallengedAssumptions(pathMemory: PathMemory): string[] {
    return pathMemory.pathHistory
      .filter(e => e.reversibilityCost < 0.3 && e.optionsOpened.length > 1)
      .map(e => e.decision)
      .slice(-5);
  }

  /**
   * Identify dominant technique
   */
  private identifyDominantTechnique(pathMemory: PathMemory): string | null {
    if (pathMemory.pathHistory.length === 0) return null;

    const techniques = pathMemory.pathHistory.map(e => e.technique);
    return this.findMostCommon(techniques);
  }

  /**
   * Detect thinking loops
   */
  private detectThinkingLoops(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length < 10) return 0;

    let loops = 0;
    const decisions = pathMemory.pathHistory.map(e => this.normalizeDecision(e.decision));

    for (let i = 0; i < decisions.length - 5; i++) {
      for (let j = i + 3; j < decisions.length - 2; j++) {
        if (decisions[i] === decisions[j] && decisions[i + 1] === decisions[j + 1]) {
          loops++;
        }
      }
    }

    return loops;
  }

  /**
   * Estimate cognitive load
   */
  private estimateCognitiveLoad(pathMemory: PathMemory): number {
    const constraints = pathMemory.constraints.length;
    const options = pathMemory.availableOptions.length + pathMemory.foreclosedOptions.length;
    const decisions = pathMemory.pathHistory.length;

    // Simple heuristic: more constraints and options = higher load
    const load = (constraints * 0.3 + options * 0.1 + decisions * 0.05) / 10;
    return Math.min(load, 1);
  }

  /**
   * Calculate metrics improvement
   */
  private calculateMetricsImprovement(sessionData: SessionData): number {
    if (!sessionData.metrics) return 0.5;

    // Simple: check if metrics exist and are positive
    const hasPositiveMetrics =
      (sessionData.metrics.creativityScore || 0) > 0 ||
      (sessionData.metrics.risksCaught || 0) > 0 ||
      (sessionData.metrics.antifragileFeatures || 0) > 0;

    return hasPositiveMetrics ? 0.7 : 0.3;
  }

  /**
   * Calculate approach evolution
   */
  private calculateApproachEvolution(sessionData: SessionData): number {
    if (sessionData.history.length < 10) return 0.5;

    const firstHalf = sessionData.history.slice(0, sessionData.history.length / 2);
    const secondHalf = sessionData.history.slice(sessionData.history.length / 2);

    const firstTechniques = new Set(firstHalf.map((h: { technique: string }) => h.technique));
    const secondTechniques = new Set(secondHalf.map((h: { technique: string }) => h.technique));

    // More techniques in second half indicates evolution
    return secondTechniques.size > firstTechniques.size ? 0.8 : 0.4;
  }

  /**
   * Count framework switches
   */
  private countFrameworkSwitches(pathMemory: PathMemory): number {
    let switches = 0;
    for (let i = 1; i < pathMemory.pathHistory.length; i++) {
      const prev = pathMemory.pathHistory[i - 1];
      const curr = pathMemory.pathHistory[i];
      if (
        prev.technique !== curr.technique ||
        (prev.commitmentLevel < 0.3 && curr.commitmentLevel > 0.7)
      ) {
        switches++;
      }
    }
    return switches;
  }

  /**
   * Calculate adaptation rate
   */
  private calculateAdaptationRate(pathMemory: PathMemory): number {
    if (pathMemory.pathHistory.length < 5) return 0.5;

    // Look for course corrections
    let adaptations = 0;
    for (let i = 1; i < pathMemory.pathHistory.length; i++) {
      const prev = pathMemory.pathHistory[i - 1];
      const curr = pathMemory.pathHistory[i];

      // High commitment followed by low commitment suggests adaptation
      if (prev.commitmentLevel > 0.7 && curr.commitmentLevel < 0.3) {
        adaptations++;
      }

      // Opening options after closing them
      if (prev.optionsClosed.length > 2 && curr.optionsOpened.length > 2) {
        adaptations++;
      }
    }

    return Math.min(adaptations / (pathMemory.pathHistory.length - 1), 1);
  }

  /**
   * Detect technique fixation
   */
  private detectTechniqueFixation(pathMemory: PathMemory): boolean {
    if (pathMemory.pathHistory.length < 8) return false;

    const recent = pathMemory.pathHistory.slice(-8);
    const techniques = recent.map(e => e.technique);
    const uniqueTechniques = new Set(techniques).size;

    return uniqueTechniques <= 2;
  }

  /**
   * Detect circular reasoning
   */
  private detectCircularReasoning(pathMemory: PathMemory): boolean {
    if (pathMemory.pathHistory.length < 10) return false;

    const decisions = pathMemory.pathHistory.map(e => this.normalizeDecision(e.decision));

    // Look for A->B->C->A patterns
    for (let i = 0; i < decisions.length - 6; i++) {
      if (decisions[i] === decisions[i + 3] || decisions[i] === decisions[i + 4]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect confirmation bias
   */
  private detectConfirmationBias(pathMemory: PathMemory): boolean {
    if (pathMemory.pathHistory.length < 10) return false;

    const recent = pathMemory.pathHistory.slice(-10);

    // All high commitment and low reversibility suggests not considering alternatives
    const highCommitment = recent.filter(e => e.commitmentLevel > 0.8).length;
    const closedOptions = recent.filter(
      e => e.optionsClosed.length > e.optionsOpened.length
    ).length;

    return highCommitment > 7 && closedOptions > 7;
  }

  /**
   * Normalize decision text for comparison
   */
  private normalizeDecision(decision: string): string {
    return decision
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Find most common element in array
   */
  private findMostCommon<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;

    const counts = new Map<T, number>();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }

    let maxCount = 0;
    let mostCommon: T | null = null;

    for (const [item, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }

    return mostCommon;
  }

  /**
   * Get barriers monitored by this sensor
   */
  getMonitoredBarriers(): Barrier[] {
    return [
      {
        id: 'cognitive_lock_in_barrier',
        type: 'creative',
        subtype: 'cognitive_lock_in',
        name: 'Cognitive Lock-in',
        description: 'Inability to see beyond current framework',
        proximity: 0,
        impact: 'irreversible',
        warningThreshold: 0.3,
        indicators: [
          'Repeated use of same solution patterns',
          'Dismissing alternatives without consideration',
          'Decreasing idea diversity',
          'Resistance to perspective changes',
        ],
        avoidanceStrategies: [
          'Force perspective shift using Random Entry',
          'Explicitly challenge core assumptions',
          'Seek contradictory viewpoints',
          'Take break to reset mental state',
        ],
      },
      {
        id: 'analysis_paralysis_barrier',
        type: 'critical',
        subtype: 'analysis_paralysis',
        name: 'Analysis Paralysis',
        description: 'Overthinking preventing any action',
        proximity: 0,
        impact: 'irreversible',
        warningThreshold: 0.3,
        indicators: [
          'Endless refinement without progress',
          'Fear of making any decision',
          'Excessive data gathering',
          'Circular reasoning patterns',
        ],
        avoidanceStrategies: [
          'Set decision deadlines',
          'Use "good enough" criteria',
          'Prototype instead of plan',
          'Focus on reversible decisions',
        ],
      },
    ];
  }
}
