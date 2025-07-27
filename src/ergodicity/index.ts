/**
 * Ergodicity awareness and path dependency tracking for creative thinking
 */

export * from './types.js';
export * from './pathMemory.js';
export * from './metrics.js';
export * from './earlyWarning/index.js';

import { PathMemoryManager } from './pathMemory.js';
import { MetricsCalculator } from './metrics.js';
import { AbsorbingBarrierEarlyWarning, ResponseProtocolSystem } from './earlyWarning/index.js';
import type { PathMemory, FlexibilityMetrics, PathEvent, ErgodicityWarning } from './types.js';
import type { LateralTechnique, SessionData } from '../index.js';
import type { EarlyWarningState, EscapeProtocol } from './earlyWarning/types.js';

/**
 * Main ergodicity manager that coordinates path tracking and metrics
 */
export class ErgodicityManager {
  private pathMemoryManager: PathMemoryManager;
  private metricsCalculator: MetricsCalculator;
  private earlyWarningSystem: AbsorbingBarrierEarlyWarning;
  private responseProtocolSystem: ResponseProtocolSystem;
  private lastWarningState: EarlyWarningState | null = null;
  private autoEscapeEnabled: boolean = true;

  constructor() {
    this.pathMemoryManager = new PathMemoryManager();
    this.metricsCalculator = new MetricsCalculator();
    this.earlyWarningSystem = new AbsorbingBarrierEarlyWarning();
    this.responseProtocolSystem = new ResponseProtocolSystem();
  }

  /**
   * Record a thinking step and its path impacts with early warning monitoring
   */
  async recordThinkingStep(
    technique: LateralTechnique,
    step: number,
    decision: string,
    impact: {
      optionsOpened?: string[];
      optionsClosed?: string[];
      reversibilityCost?: number;
      commitmentLevel?: number;
    },
    sessionData?: SessionData
  ): Promise<{
    event: PathEvent;
    metrics: FlexibilityMetrics;
    warnings: ErgodicityWarning[];
    earlyWarningState?: EarlyWarningState;
    escapeRecommendation?: EscapeProtocol;
  }> {
    // Record the path event
    const event = this.pathMemoryManager.recordPathEvent(technique, step, decision, impact);

    // Get updated metrics
    const pathMemory = this.pathMemoryManager.getPathMemory();
    const metrics = this.metricsCalculator.calculateMetrics(pathMemory);

    // Generate traditional warnings
    const warnings = this.metricsCalculator.generateWarnings(metrics);

    // Run early warning system if session data available
    let earlyWarningState: EarlyWarningState | undefined;
    let escapeRecommendation: EscapeProtocol | undefined;

    if (sessionData) {
      earlyWarningState = await this.earlyWarningSystem.continuousMonitoring(
        pathMemory,
        sessionData
      );
      this.lastWarningState = earlyWarningState;

      // Check if escape protocol is needed
      if (
        earlyWarningState.recommendedAction === 'escape' &&
        earlyWarningState.activeWarnings.length > 0
      ) {
        const criticalWarning = earlyWarningState.activeWarnings[0];
        const recommendation = this.responseProtocolSystem.recommendProtocol(
          criticalWarning,
          pathMemory
        );
        if (recommendation !== null) {
          escapeRecommendation = recommendation;
        }
      }
    }

    return { event, metrics, warnings, earlyWarningState, escapeRecommendation };
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

    // Include early warning state if available
    if (this.lastWarningState) {
      const { activeWarnings, recommendedAction } = this.lastWarningState;

      if (activeWarnings.length > 0) {
        status += '\n\n🚨 Absorbing Barrier Warnings:';
        activeWarnings.slice(0, 3).forEach(warning => {
          status += `\n├─ ${warning.visualIndicator} ${warning.message}`;
          if (warning.reading.timeToImpact) {
            status += ` (Impact in ~${warning.reading.timeToImpact} steps)`;
          }
        });

        if (recommendedAction !== 'continue') {
          const actionEmoji =
            {
              caution: '⚡',
              pivot: '🔄',
              escape: '🚨',
            }[recommendedAction] || '❓';
          status += `\n└─ ${actionEmoji} Recommended Action: ${recommendedAction.toUpperCase()}`;
        }
      }
    }

    if (warnings.length > 0) {
      status += '\n\n⚠️ Path Dependency Warnings:';
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
   * Get current early warning state
   */
  async getEarlyWarningState(sessionData: SessionData): Promise<EarlyWarningState | null> {
    if (!sessionData) return this.lastWarningState;

    const pathMemory = this.pathMemoryManager.getPathMemory();
    const state = await this.earlyWarningSystem.continuousMonitoring(pathMemory, sessionData);
    this.lastWarningState = state;
    return state;
  }

  /**
   * Execute an escape protocol
   */
  async executeEscapeProtocol(
    protocol: EscapeProtocol,
    sessionData: SessionData,
    userConfirmation: boolean = true
  ) {
    const pathMemory = this.pathMemoryManager.getPathMemory();
    return await this.responseProtocolSystem.executeProtocol(
      protocol,
      pathMemory,
      sessionData,
      userConfirmation
    );
  }

  /**
   * Get available escape protocols for current state
   */
  getAvailableEscapeProtocols(): EscapeProtocol[] {
    return this.responseProtocolSystem.getAvailableProtocols();
  }

  /**
   * Get sensor status
   */
  getSensorStatus() {
    return this.earlyWarningSystem.getSensorStatus();
  }

  /**
   * Get warning history
   */
  getWarningHistory(sessionId?: string) {
    return this.earlyWarningSystem.getWarningHistory(sessionId);
  }

  /**
   * Toggle auto-escape mode
   */
  setAutoEscapeEnabled(enabled: boolean) {
    this.autoEscapeEnabled = enabled;
  }

  /**
   * Reset early warning system
   */
  resetEarlyWarning() {
    this.earlyWarningSystem.reset();
    this.lastWarningState = null;
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
