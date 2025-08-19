/**
 * Metrics Resource Provider - Exposes real-time metrics as MCP resources
 */

import { BaseResourceProvider } from './ResourceProvider.js';
import type { ResourceContent } from './types.js';
import type { CreativeThinkingState } from '../CreativeThinkingMcpAgent.js';

export class MetricsResourceProvider extends BaseResourceProvider {
  private metricsHistory: Array<{
    timestamp: number;
    flexibilityScore: number;
    optionsGenerated: number;
    pathDependencies: number;
  }> = [];

  constructor(private getState: () => CreativeThinkingState) {
    super('metrics://');
    // Shorter cache for real-time metrics
    this.cacheTTL = 5000; // 5 seconds
  }

  /**
   * List all available metrics resources
   */
  async listResources(): Promise<Array<{ uri: string; name: string; mimeType: string }>> {
    return [
      {
        uri: 'metrics://ergodicity/current',
        name: 'Current Ergodicity Metrics',
        mimeType: 'application/json',
      },
      {
        uri: 'metrics://flexibility/current',
        name: 'Current Flexibility Score',
        mimeType: 'application/json',
      },
      {
        uri: 'metrics://flexibility/history',
        name: 'Flexibility Score History',
        mimeType: 'application/json',
      },
      {
        uri: 'metrics://warnings/active',
        name: 'Active Warnings',
        mimeType: 'application/json',
      },
      {
        uri: 'metrics://options/generated',
        name: 'Options Generation Metrics',
        mimeType: 'application/json',
      },
      {
        uri: 'metrics://global/stats',
        name: 'Global Statistics',
        mimeType: 'application/json',
      },
      {
        uri: 'metrics://techniques/usage',
        name: 'Technique Usage Statistics',
        mimeType: 'application/json',
      },
    ];
  }

  /**
   * Generate content for a metrics resource
   */
  protected async generateContent(uri: string): Promise<ResourceContent | null> {
    const parts = this.parseUri(uri);

    if (parts.length < 2) {
      return null;
    }

    const [category, type] = parts;

    switch (category) {
      case 'ergodicity':
        return this.getErgodicityMetrics(type);

      case 'flexibility':
        return this.getFlexibilityMetrics(type);

      case 'warnings':
        return this.getWarnings(type);

      case 'options':
        return this.getOptionsMetrics(type);

      case 'global':
        return this.getGlobalMetrics(type);

      case 'techniques':
        return this.getTechniqueMetrics(type);

      default:
        return null;
    }
  }

  /**
   * Get ergodicity metrics
   */
  private getErgodicityMetrics(type: string): ResourceContent | null {
    if (type !== 'current') {
      return null;
    }

    const state = this.getState();
    const currentSession = state.currentSessionId ? state.sessions[state.currentSessionId] : null;

    const metrics = {
      isErgodic: false, // Creative processes are typically non-ergodic
      pathDependencies: currentSession?.pathDependencies?.length || 0,
      absorbingBarriers: this.detectAbsorbingBarriers(currentSession),
      irreversibleDecisions: currentSession?.irreversibleDecisions || [],
      timeAverage: this.calculateTimeAverage(currentSession),
      ensembleAverage: this.calculateEnsembleAverage(state),
    };

    return {
      uri: 'metrics://ergodicity/current',
      name: 'Current Ergodicity Metrics',
      mimeType: 'application/json',
      text: JSON.stringify(metrics, null, 2),
    };
  }

  /**
   * Get flexibility metrics
   */
  private getFlexibilityMetrics(type: string): ResourceContent | null {
    const state = this.getState();
    const currentSession = state.currentSessionId ? state.sessions[state.currentSessionId] : null;

    switch (type) {
      case 'current':
        const currentScore = currentSession?.flexibilityScore || 1.0;
        return {
          uri: 'metrics://flexibility/current',
          name: 'Current Flexibility Score',
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              score: currentScore,
              level: this.getFlexibilityLevel(currentScore),
              trend: this.getFlexibilityTrend(),
              recommendations: this.getFlexibilityRecommendations(currentScore),
            },
            null,
            2
          ),
        };

      case 'history':
        return {
          uri: 'metrics://flexibility/history',
          name: 'Flexibility Score History',
          mimeType: 'application/json',
          text: JSON.stringify(this.metricsHistory, null, 2),
        };

      default:
        return null;
    }
  }

  /**
   * Get active warnings
   */
  private getWarnings(type: string): ResourceContent | null {
    if (type !== 'active') {
      return null;
    }

    const state = this.getState();
    const currentSession = state.currentSessionId ? state.sessions[state.currentSessionId] : null;
    const warnings = [];

    // Check flexibility
    if (currentSession?.flexibilityScore && currentSession.flexibilityScore < 0.3) {
      warnings.push({
        type: 'flexibility',
        severity: 'high',
        message: 'Low flexibility detected - options are becoming limited',
        recommendation: 'Consider using PO or Random Entry techniques',
      });
    }

    // Check path dependencies
    if (currentSession?.pathDependencies && currentSession.pathDependencies.length > 5) {
      warnings.push({
        type: 'path_dependency',
        severity: 'medium',
        message: 'High path dependencies accumulating',
        recommendation: 'Review decisions for potential backtracking',
      });
    }

    // Check options
    if (currentSession?.optionsGenerated && currentSession.optionsGenerated < 3) {
      warnings.push({
        type: 'options',
        severity: 'low',
        message: 'Limited options generated',
        recommendation: 'Use SCAMPER or brainstorming techniques',
      });
    }

    return {
      uri: 'metrics://warnings/active',
      name: 'Active Warnings',
      mimeType: 'application/json',
      text: JSON.stringify({ warnings, count: warnings.length }, null, 2),
    };
  }

  /**
   * Get options generation metrics
   */
  private getOptionsMetrics(type: string): ResourceContent | null {
    if (type !== 'generated') {
      return null;
    }

    const state = this.getState();
    const currentSession = state.currentSessionId ? state.sessions[state.currentSessionId] : null;

    return {
      uri: 'metrics://options/generated',
      name: 'Options Generation Metrics',
      mimeType: 'application/json',
      text: JSON.stringify(
        {
          totalGenerated: currentSession?.optionsGenerated || 0,
          viableOptions: currentSession?.viableOptions || 0,
          discardedOptions: currentSession?.discardedOptions || 0,
          averageQuality: currentSession?.optionQuality || 0,
          generationRate: this.calculateGenerationRate(currentSession),
        },
        null,
        2
      ),
    };
  }

  /**
   * Get global metrics
   */
  private getGlobalMetrics(type: string): ResourceContent | null {
    if (type !== 'stats') {
      return null;
    }

    const state = this.getState();

    return {
      uri: 'metrics://global/stats',
      name: 'Global Statistics',
      mimeType: 'application/json',
      text: JSON.stringify(
        {
          totalSessions: state.globalMetrics.totalSessions,
          totalIdeasGenerated: state.globalMetrics.totalIdeasGenerated,
          averageFlexibilityScore: state.globalMetrics.averageFlexibilityScore,
          activeSessions: Object.keys(state.sessions).length,
          activeWorkflows: Object.keys(state.workflows).length,
        },
        null,
        2
      ),
    };
  }

  /**
   * Get technique usage metrics
   */
  private getTechniqueMetrics(type: string): ResourceContent | null {
    if (type !== 'usage') {
      return null;
    }

    const state = this.getState();

    // Calculate usage statistics
    const usage = { ...state.globalMetrics.techniqueUsage };
    const total = Object.values(usage).reduce((sum: number, count: any) => sum + count, 0);

    const statistics = Object.entries(usage).map(([technique, count]) => ({
      technique,
      count: count as number,
      percentage: total > 0 ? (((count as number) / total) * 100).toFixed(2) + '%' : '0%',
    }));

    return {
      uri: 'metrics://techniques/usage',
      name: 'Technique Usage Statistics',
      mimeType: 'application/json',
      text: JSON.stringify(
        {
          totalUsage: total,
          techniques: statistics,
          mostUsed:
            statistics.reduce(
              (max, curr) => (curr.count > (max?.count || 0) ? curr : max),
              statistics[0]
            )?.technique || null,
          leastUsed:
            statistics.reduce(
              (min, curr) => (curr.count < (min?.count || Infinity) ? curr : min),
              statistics[0]
            )?.technique || null,
        },
        null,
        2
      ),
    };
  }

  /**
   * Helper methods
   */

  private detectAbsorbingBarriers(session: any): string[] {
    const barriers = [];

    if (session?.completed) {
      barriers.push('Session completed - no further changes possible');
    }

    if (session?.lockedDecisions?.length > 0) {
      barriers.push(`${session.lockedDecisions.length} decisions locked`);
    }

    return barriers;
  }

  private calculateTimeAverage(session: any): number {
    if (!session?.metrics?.history) {
      return 0;
    }
    return (
      session.metrics.history.reduce((sum: number, val: number) => sum + val, 0) /
      session.metrics.history.length
    );
  }

  private calculateEnsembleAverage(state: CreativeThinkingState): number {
    const sessions = Object.values(state.sessions);
    if (sessions.length === 0) {
      return 0;
    }

    const sum = sessions.reduce(
      (total, session: any) => total + (session.flexibilityScore || 0),
      0
    );
    return sum / sessions.length;
  }

  private getFlexibilityLevel(score: number): string {
    if (score >= 0.8) return 'High';
    if (score >= 0.5) return 'Medium';
    if (score >= 0.3) return 'Low';
    return 'Critical';
  }

  private getFlexibilityTrend(): string {
    if (this.metricsHistory.length < 2) {
      return 'Insufficient data';
    }

    const recent = this.metricsHistory.slice(-5);
    const trend = recent[recent.length - 1].flexibilityScore - recent[0].flexibilityScore;

    if (trend > 0.1) return 'Improving';
    if (trend < -0.1) return 'Declining';
    return 'Stable';
  }

  private getFlexibilityRecommendations(score: number): string[] {
    const recommendations = [];

    if (score < 0.3) {
      recommendations.push('Use PO technique to break current patterns');
      recommendations.push('Apply Random Entry for fresh perspectives');
      recommendations.push('Consider reversing key assumptions');
    } else if (score < 0.5) {
      recommendations.push('Generate more alternatives with SCAMPER');
      recommendations.push('Use concept extraction for new angles');
    }

    return recommendations;
  }

  private calculateGenerationRate(session: any): string {
    if (!session?.startTime || !session?.optionsGenerated) {
      return 'N/A';
    }

    const duration = Date.now() - session.startTime;
    const hours = duration / (1000 * 60 * 60);
    const rate = session.optionsGenerated / hours;

    return `${rate.toFixed(2)} options/hour`;
  }

  /**
   * Update metrics history (call periodically)
   */
  updateHistory(state: CreativeThinkingState): void {
    const currentSession = state.currentSessionId ? state.sessions[state.currentSessionId] : null;

    if (currentSession) {
      this.metricsHistory.push({
        timestamp: Date.now(),
        flexibilityScore: currentSession.flexibilityScore || 1.0,
        optionsGenerated: currentSession.optionsGenerated || 0,
        pathDependencies: currentSession.pathDependencies?.length || 0,
      });

      // Keep only last 100 entries
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }
    }
  }
}
