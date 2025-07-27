/**
 * Ergodicity awareness and path dependency tracking for creative thinking
 */

export * from './types.js';
export * from './pathMemory.js';
export * from './metrics.js';

import { PathMemoryManager } from './pathMemory.js';
import { MetricsCalculator } from './metrics.js';
import type { PathMemory, FlexibilityMetrics, PathEvent, ErgodicityWarning } from './types.js';
import type { LateralTechnique } from '../index.js';

/**
 * Main ergodicity manager that coordinates path tracking and metrics
 */
export class ErgodicityManager {
  private pathMemoryManager: PathMemoryManager;
  private metricsCalculator: MetricsCalculator;

  constructor() {
    this.pathMemoryManager = new PathMemoryManager();
    this.metricsCalculator = new MetricsCalculator();
  }

  /**
   * Record a thinking step and its path impacts
   */
  recordThinkingStep(
    technique: LateralTechnique,
    step: number,
    decision: string,
    impact: {
      optionsOpened?: string[];
      optionsClosed?: string[];
      reversibilityCost?: number;
      commitmentLevel?: number;
    }
  ): {
    event: PathEvent;
    metrics: FlexibilityMetrics;
    warnings: ErgodicityWarning[];
  } {
    // Record the path event
    const event = this.pathMemoryManager.recordPathEvent(technique, step, decision, impact);

    // Get updated metrics
    const pathMemory = this.pathMemoryManager.getPathMemory();
    const metrics = this.metricsCalculator.calculateMetrics(pathMemory);

    // Generate warnings
    const warnings = this.metricsCalculator.generateWarnings(metrics);

    return { event, metrics, warnings };
  }

  /**
   * Get current path memory state
   */
  getPathMemory(): PathMemory {
    return this.pathMemoryManager.getPathMemory();
  }

  /**
   * Get current flexibility metrics
   */
  getMetrics(): FlexibilityMetrics {
    const pathMemory = this.pathMemoryManager.getPathMemory();
    return this.metricsCalculator.calculateMetrics(pathMemory);
  }

  /**
   * Get current warnings
   */
  getWarnings(): ErgodicityWarning[] {
    const metrics = this.getMetrics();
    return this.metricsCalculator.generateWarnings(metrics);
  }

  /**
   * Get escape routes for low flexibility situations
   */
  getEscapeRoutes() {
    return this.pathMemoryManager.generateEscapeRoutes();
  }

  /**
   * Get a formatted summary of ergodicity state
   */
  getErgodicityStatus(): string {
    const metrics = this.getMetrics();
    const warnings = this.pathMemoryManager.getWarnings();
    const metricsSummary = this.metricsCalculator.getMetricsSummary(metrics);

    let status = metricsSummary;

    if (warnings.length > 0) {
      status += '\n\n⚠️ Active Warnings:';
      warnings.forEach(warning => {
        status += `\n├─ ${warning}`;
      });
    }

    const escapeRoutes = this.pathMemoryManager.generateEscapeRoutes();
    if (escapeRoutes.length > 0 && metrics.flexibilityScore < 0.4) {
      status += '\n\n🚪 Escape Routes Available:';
      escapeRoutes.forEach(route => {
        status += `\n├─ ${route.name} (feasibility: ${Math.round(route.feasibility * 100)}%)`;
      });
    }

    return status;
  }

  /**
   * Analyze a specific technique for its path impact
   */
  analyzeTechniqueImpact(technique: LateralTechnique): {
    typicalReversibility: number;
    typicalCommitment: number;
    riskProfile: string;
  } {
    const profiles: Record<
      LateralTechnique,
      {
        typicalReversibility: number;
        typicalCommitment: number;
        riskProfile: string;
      }
    > = {
      six_hats: {
        typicalReversibility: 0.9,
        typicalCommitment: 0.2,
        riskProfile: 'Low - Exploration without commitment',
      },
      po: {
        typicalReversibility: 0.8,
        typicalCommitment: 0.3,
        riskProfile: 'Low - Provocations are exploratory',
      },
      random_entry: {
        typicalReversibility: 0.9,
        typicalCommitment: 0.1,
        riskProfile: 'Very Low - Pure exploration',
      },
      scamper: {
        typicalReversibility: 0.6,
        typicalCommitment: 0.5,
        riskProfile: 'Medium - Some modifications hard to reverse',
      },
      concept_extraction: {
        typicalReversibility: 0.7,
        typicalCommitment: 0.4,
        riskProfile: 'Low-Medium - Depends on application',
      },
      yes_and: {
        typicalReversibility: 0.5,
        typicalCommitment: 0.6,
        riskProfile: 'Medium - Builds commitments incrementally',
      },
      design_thinking: {
        typicalReversibility: 0.4,
        typicalCommitment: 0.7,
        riskProfile: 'Medium-High - User research creates expectations',
      },
      triz: {
        typicalReversibility: 0.5,
        typicalCommitment: 0.6,
        riskProfile: 'Medium - Technical solutions may lock in',
      },
    };

    return profiles[technique];
  }
}
