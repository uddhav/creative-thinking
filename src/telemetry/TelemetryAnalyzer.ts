/**
 * Telemetry Analyzer
 * Analyzes telemetry data to provide insights on technique effectiveness
 */

import type {
  PrivacySafeEvent,
  AnalyticsQuery,
  AnalyticsResult,
  AnalyticsData,
  AnalyticsSummary,
  TechniqueEffectiveness,
  SessionAnalytics,
  AnalyticsMetric,
  TelemetryConfig,
} from './types.js';
import type { LateralTechnique } from '../types/index.js';
import { TelemetryStorage } from './TelemetryStorage.js';

export class TelemetryAnalyzer {
  private storage: TelemetryStorage;

  constructor(config: TelemetryConfig) {
    this.storage = new TelemetryStorage(config);
  }

  /**
   * Get analytics based on query
   */
  async getAnalytics(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const events = await this.getEventsForQuery(query);
    const results = this.analyzeEvents(events, query);
    const summary = this.generateSummary(events, results);

    return {
      query,
      generatedAt: Date.now(),
      results,
      summary,
    };
  }

  /**
   * Get technique effectiveness analysis
   */
  async getTechniqueEffectiveness(technique?: LateralTechnique): Promise<TechniqueEffectiveness[]> {
    const events = await this.storage.getStoredEvents();
    const techniqueMap = new Map<LateralTechnique, TechniqueEffectiveness>();

    // Group events by technique
    for (const event of events) {
      if (!event.technique) continue;
      if (technique && event.technique !== technique) continue;

      if (!techniqueMap.has(event.technique)) {
        techniqueMap.set(event.technique, {
          technique: event.technique,
          sessionsUsed: 0,
          completionRate: 0,
          averageEffectiveness: 0,
          averageInsights: 0,
          averageRisks: 0,
          averageDuration: 0,
          userSatisfaction: undefined,
          commonCombinations: [],
        });
      }

      const stats = techniqueMap.get(event.technique);
      if (stats) {
        this.updateTechniqueStats(stats, event, events);
      }
    }

    // Calculate final metrics
    const results: TechniqueEffectiveness[] = [];
    for (const [, stats] of techniqueMap) {
      this.finalizeTechniqueStats(stats, events);
      results.push(stats);
    }

    // Sort by effectiveness
    return results.sort((a, b) => b.averageEffectiveness - a.averageEffectiveness);
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId?: string): Promise<SessionAnalytics[]> {
    const events = await this.storage.getStoredEvents();
    const sessionMap = new Map<string, SessionAnalytics>();

    // Group events by session
    for (const event of events) {
      const sid = event.anonymousSessionId;
      if (sessionId && sid !== sessionId) continue;

      if (!sessionMap.has(sid)) {
        sessionMap.set(sid, {
          sessionId: sid,
          startTime: event.timestamp,
          duration: 0,
          techniquesUsed: [],
          totalSteps: 0,
          completedSteps: 0,
          insightsGenerated: 0,
          risksIdentified: 0,
          flexibilityProgression: [],
          effectiveness: 0,
          abandoned: true,
        });
      }

      const analytics = sessionMap.get(sid);
      if (analytics) {
        this.updateSessionAnalytics(analytics, event);
      }
    }

    // Calculate final metrics
    const results: SessionAnalytics[] = [];
    for (const [, analytics] of sessionMap) {
      this.finalizeSessionAnalytics(analytics);
      results.push(analytics);
    }

    return results;
  }

  /**
   * Get events for query
   */
  private async getEventsForQuery(query: AnalyticsQuery): Promise<PrivacySafeEvent[]> {
    let events: PrivacySafeEvent[];

    // Get events by time range
    if (query.startTime && query.endTime) {
      events = await this.storage.getEventsByTimeRange(query.startTime, query.endTime);
    } else {
      events = await this.storage.getStoredEvents();

      // Apply time range filter
      if (query.timeRange) {
        const now = Date.now();
        const ranges: Record<NonNullable<AnalyticsQuery['timeRange']>, number> = {
          last_hour: 60 * 60 * 1000,
          last_day: 24 * 60 * 60 * 1000,
          last_week: 7 * 24 * 60 * 60 * 1000,
          last_30_days: 30 * 24 * 60 * 60 * 1000,
          all_time: Infinity,
        };
        const cutoff = now - ranges[query.timeRange];
        events = events.filter(e => e.timestamp >= cutoff);
      }
    }

    // Apply filters
    if (query.techniques && query.techniques.length > 0) {
      events = events.filter(
        e => e.technique && query.techniques && query.techniques.includes(e.technique)
      );
    }

    if (query.eventTypes && query.eventTypes.length > 0) {
      events = events.filter(e => query.eventTypes && query.eventTypes.includes(e.eventType));
    }

    // Apply limit
    if (query.limit) {
      events = events.slice(0, query.limit);
    }

    return events;
  }

  /**
   * Analyze events based on query
   */
  private analyzeEvents(events: PrivacySafeEvent[], query: AnalyticsQuery): AnalyticsData[] {
    const groupMap = new Map<string, AnalyticsData>();

    for (const event of events) {
      const groupKey = this.getGroupKey(event, query.groupBy);

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          groupKey,
          metrics: {} as Record<AnalyticsMetric, number>,
          count: 0,
        });
      }

      const data = groupMap.get(groupKey);
      if (data) {
        data.count++;
        this.updateMetrics(data.metrics, event, query.metrics || this.getDefaultMetrics());
      }
    }

    // Finalize metrics
    const results: AnalyticsData[] = [];
    for (const [, data] of groupMap) {
      this.finalizeMetrics(data);
      results.push(data);
    }

    return results;
  }

  /**
   * Get group key for event
   */
  private getGroupKey(event: PrivacySafeEvent, groupBy?: AnalyticsQuery['groupBy']): string {
    if (!groupBy) return 'all';

    switch (groupBy) {
      case 'technique':
        return event.technique || 'unknown';

      case 'session':
        return event.anonymousSessionId;

      case 'day':
        return new Date(event.timestamp).toISOString().split('T')[0];

      case 'hour': {
        const date = new Date(event.timestamp);
        return `${date.toISOString().split('T')[0]}-${date.getHours()}`;
      }

      default:
        return 'all';
    }
  }

  /**
   * Update metrics based on event
   */
  private updateMetrics(
    metrics: Record<AnalyticsMetric, number>,
    event: PrivacySafeEvent,
    requestedMetrics: AnalyticsMetric[]
  ): void {
    for (const metric of requestedMetrics) {
      if (!(metric in metrics)) {
        metrics[metric] = 0;
      }

      switch (metric) {
        case 'effectiveness':
          if (event.metrics.effectiveness !== undefined) {
            metrics.effectiveness += event.metrics.effectiveness;
          }
          break;

        case 'insight_density':
          if (event.metrics.insightCount !== undefined) {
            metrics.insight_density += event.metrics.insightCount;
          }
          break;

        case 'risk_identification_rate':
          if (event.metrics.riskCount !== undefined) {
            metrics.risk_identification_rate += event.metrics.riskCount;
          }
          break;

        case 'flexibility_preservation':
          if (event.metrics.flexibilityScore !== undefined) {
            metrics.flexibility_preservation += event.metrics.flexibilityScore;
          }
          break;

        case 'average_duration':
          if (event.metrics.duration !== undefined) {
            metrics.average_duration += event.metrics.duration;
          }
          break;
      }
    }
  }

  /**
   * Finalize metrics (calculate averages)
   */
  private finalizeMetrics(data: AnalyticsData): void {
    if (data.count === 0) return;

    const avgMetrics: AnalyticsMetric[] = [
      'effectiveness',
      'insight_density',
      'risk_identification_rate',
      'flexibility_preservation',
      'average_duration',
    ];

    for (const metric of avgMetrics) {
      if (metric in data.metrics) {
        data.metrics[metric] = data.metrics[metric] / data.count;
      }
    }
  }

  /**
   * Generate analytics summary
   */
  private generateSummary(events: PrivacySafeEvent[], _results: AnalyticsData[]): AnalyticsSummary {
    const sessions = new Set(events.map(e => e.anonymousSessionId));
    const techniques = new Map<LateralTechnique, { count: number; effectiveness: number }>();

    // Count techniques and effectiveness
    for (const event of events) {
      if (event.technique && event.eventType === 'technique_complete') {
        if (!techniques.has(event.technique)) {
          techniques.set(event.technique, { count: 0, effectiveness: 0 });
        }
        const stats = techniques.get(event.technique);
        if (stats) {
          stats.count++;
          if (event.metrics.effectiveness !== undefined) {
            stats.effectiveness += event.metrics.effectiveness;
          }
        }
      }
    }

    // Calculate top techniques
    const topTechniques = Array.from(techniques.entries())
      .map(([technique, stats]) => ({
        technique,
        effectiveness: stats.effectiveness / stats.count,
      }))
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 5);

    // Calculate completion rate
    const sessionStarts = events.filter(e => e.eventType === 'session_start').length;
    const sessionCompletes = events.filter(e => e.eventType === 'session_complete').length;
    const completionRate = sessionStarts > 0 ? sessionCompletes / sessionStarts : 0;

    // Calculate other rates
    const insightEvents = events.filter(e => e.eventType === 'insight_generated');
    const totalInsights = insightEvents.reduce((sum, e) => sum + (e.metrics.insightCount || 0), 0);
    const insightGenerationRate = sessions.size > 0 ? totalInsights / sessions.size : 0;

    const riskEvents = events.filter(e => e.eventType === 'risk_identified');
    const totalRisks = riskEvents.reduce((sum, e) => sum + (e.metrics.riskCount || 0), 0);
    const riskIdentificationRate = sessions.size > 0 ? totalRisks / sessions.size : 0;

    // Calculate average duration
    const durationEvents = events.filter(e => e.metrics.duration !== undefined);
    const totalDuration = durationEvents.reduce((sum, e) => sum + (e.metrics.duration || 0), 0);
    const averageSessionDuration =
      durationEvents.length > 0 ? totalDuration / durationEvents.length : 0;

    return {
      totalEvents: events.length,
      totalSessions: sessions.size,
      topTechniques,
      averageSessionDuration,
      completionRate,
      insightGenerationRate,
      riskIdentificationRate,
    };
  }

  /**
   * Update technique statistics
   */
  private updateTechniqueStats(
    stats: TechniqueEffectiveness,
    event: PrivacySafeEvent,
    _allEvents: PrivacySafeEvent[]
  ): void {
    if (event.eventType === 'technique_start') {
      stats.sessionsUsed++;
    }

    if (event.eventType === 'technique_complete' && event.metrics.effectiveness !== undefined) {
      stats.averageEffectiveness += event.metrics.effectiveness;
    }

    if (event.eventType === 'insight_generated' && event.metrics.insightCount !== undefined) {
      stats.averageInsights += event.metrics.insightCount;
    }

    if (event.eventType === 'risk_identified' && event.metrics.riskCount !== undefined) {
      stats.averageRisks += event.metrics.riskCount;
    }

    if (event.metrics.duration !== undefined) {
      stats.averageDuration += event.metrics.duration;
    }
  }

  /**
   * Finalize technique statistics
   */
  private finalizeTechniqueStats(
    stats: TechniqueEffectiveness,
    allEvents: PrivacySafeEvent[]
  ): void {
    const techniqueEvents = allEvents.filter(e => e.technique === stats.technique);
    const starts = techniqueEvents.filter(e => e.eventType === 'technique_start').length;
    const completes = techniqueEvents.filter(e => e.eventType === 'technique_complete').length;

    stats.completionRate = starts > 0 ? completes / starts : 0;

    if (completes > 0) {
      stats.averageEffectiveness = stats.averageEffectiveness / completes;
    }

    const insightEvents = techniqueEvents.filter(e => e.eventType === 'insight_generated').length;
    if (insightEvents > 0) {
      stats.averageInsights = stats.averageInsights / insightEvents;
    }

    const riskEvents = techniqueEvents.filter(e => e.eventType === 'risk_identified').length;
    if (riskEvents > 0) {
      stats.averageRisks = stats.averageRisks / riskEvents;
    }

    const durationEvents = techniqueEvents.filter(e => e.metrics.duration !== undefined).length;
    if (durationEvents > 0) {
      stats.averageDuration = stats.averageDuration / durationEvents;
    }

    // Find common combinations
    stats.commonCombinations = this.findCommonCombinations(stats.technique, allEvents);
  }

  /**
   * Find common technique combinations
   */
  private findCommonCombinations(
    technique: LateralTechnique,
    events: PrivacySafeEvent[]
  ): TechniqueEffectiveness['commonCombinations'] {
    const combinations = new Map<string, { count: number; effectiveness: number }>();

    // Group by session and find technique sequences
    const sessionTechniques = new Map<string, LateralTechnique[]>();
    for (const event of events) {
      if (event.technique && event.eventType === 'technique_start') {
        const sid = event.anonymousSessionId;
        if (!sessionTechniques.has(sid)) {
          sessionTechniques.set(sid, []);
        }
        const sessionTechs = sessionTechniques.get(sid);
        if (sessionTechs) {
          sessionTechs.push(event.technique);
        }
      }
    }

    // Find combinations including our technique
    for (const [sid, techniques] of sessionTechniques) {
      if (techniques.includes(technique) && techniques.length > 1) {
        const key = techniques.sort().join(',');
        if (!combinations.has(key)) {
          combinations.set(key, { count: 0, effectiveness: 0 });
        }

        const combo = combinations.get(key);
        if (combo) {
          combo.count++;
          // Get session effectiveness
          const sessionEvents = events.filter(e => e.anonymousSessionId === sid);
          const effectivenessEvents = sessionEvents.filter(
            e => e.eventType === 'technique_complete' && e.metrics.effectiveness !== undefined
          );
          if (effectivenessEvents.length > 0) {
            const avgEffectiveness =
              effectivenessEvents.reduce((sum, e) => sum + (e.metrics.effectiveness || 0), 0) /
              effectivenessEvents.length;
            combo.effectiveness += avgEffectiveness;
          }
        }
      }
    }

    // Convert to array and sort
    return Array.from(combinations.entries())
      .map(([techs, stats]) => ({
        techniques: techs.split(',') as LateralTechnique[],
        frequency: stats.count,
        effectiveness: stats.count > 0 ? stats.effectiveness / stats.count : 0,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  /**
   * Update session analytics
   */
  private updateSessionAnalytics(analytics: SessionAnalytics, event: PrivacySafeEvent): void {
    // Update time bounds
    if (event.timestamp < analytics.startTime) {
      analytics.startTime = event.timestamp;
    }
    if (!analytics.endTime || event.timestamp > analytics.endTime) {
      analytics.endTime = event.timestamp;
    }

    // Track techniques
    if (event.technique && !analytics.techniquesUsed.includes(event.technique)) {
      analytics.techniquesUsed.push(event.technique);
    }

    // Count steps
    if (event.eventType === 'technique_step') {
      analytics.totalSteps++;
      if (event.metrics.effectiveness !== undefined && event.metrics.effectiveness > 0) {
        analytics.completedSteps++;
      }
    }

    // Track insights and risks
    if (event.eventType === 'insight_generated' && event.metrics.insightCount !== undefined) {
      analytics.insightsGenerated += event.metrics.insightCount;
    }
    if (event.eventType === 'risk_identified' && event.metrics.riskCount !== undefined) {
      analytics.risksIdentified += event.metrics.riskCount;
    }

    // Track flexibility
    if (event.metrics.flexibilityScore !== undefined) {
      analytics.flexibilityProgression.push(event.metrics.flexibilityScore);
    }

    // Mark as completed
    if (event.eventType === 'session_complete') {
      analytics.abandoned = false;
    }
  }

  /**
   * Finalize session analytics
   */
  private finalizeSessionAnalytics(analytics: SessionAnalytics): void {
    // Calculate duration
    if (analytics.endTime) {
      analytics.duration = analytics.endTime - analytics.startTime;
    }

    // Calculate effectiveness
    if (analytics.completedSteps > 0 && analytics.totalSteps > 0) {
      analytics.effectiveness = analytics.completedSteps / analytics.totalSteps;
    }
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): AnalyticsMetric[] {
    return ['effectiveness', 'insight_density', 'risk_identification_rate', 'average_duration'];
  }
}
