/**
 * Telemetry Types
 * Type definitions for the telemetry and analytics system
 */

import type { LateralTechnique } from '../types/index.js';

/**
 * Telemetry event types
 */
export type TelemetryEventType =
  | 'technique_start'
  | 'technique_step'
  | 'technique_complete'
  | 'insight_generated'
  | 'risk_identified'
  | 'option_generated'
  | 'flexibility_warning'
  | 'escape_protocol_triggered'
  | 'session_start'
  | 'session_complete'
  | 'workflow_transition';

/**
 * Telemetry data collection levels
 */
export type TelemetryLevel = 'basic' | 'detailed' | 'full';

/**
 * Storage backend options
 */
export type TelemetryStorage = 'memory' | 'filesystem' | 'external';

/**
 * Base telemetry event structure
 */
export interface TelemetryEvent {
  eventId: string;
  eventType: TelemetryEventType;
  timestamp: number;
  sessionId: string;
  technique?: LateralTechnique;
  metadata: TelemetryMetadata;
}

/**
 * Telemetry metadata based on event type
 */
export interface TelemetryMetadata {
  // Step information
  step?: number;
  totalSteps?: number;
  completedSteps?: number;
  techniqueStep?: number;
  techniqueTotalSteps?: number;

  // Effectiveness metrics
  flexibilityScore?: number;
  insightCount?: number;
  riskCount?: number;
  effectiveness?: number;
  creativityScore?: number;

  // Timing information
  duration?: number;
  stepDuration?: number;

  // User feedback
  userRating?: number; // 1-5 scale
  userFeedback?: string;

  // Context
  problemLength?: number;
  outputLength?: number;
  revisionCount?: number;
  branchCount?: number;

  // Specific event data
  insightText?: string;
  riskText?: string;
  optionCount?: number;
  warningLevel?: 'low' | 'medium' | 'high' | 'critical';
  escapeProtocol?: string;
  previousTechnique?: LateralTechnique;
  nextTechnique?: LateralTechnique;
}

/**
 * Analytics query parameters
 */
export interface AnalyticsQuery {
  timeRange?: 'last_hour' | 'last_day' | 'last_week' | 'last_30_days' | 'all_time';
  startTime?: number;
  endTime?: number;
  techniques?: LateralTechnique[];
  eventTypes?: TelemetryEventType[];
  groupBy?: 'technique' | 'session' | 'day' | 'hour';
  metrics?: AnalyticsMetric[];
  limit?: number;
}

/**
 * Available analytics metrics
 */
export type AnalyticsMetric =
  | 'effectiveness'
  | 'completion_rate'
  | 'insight_density'
  | 'risk_identification_rate'
  | 'flexibility_preservation'
  | 'average_duration'
  | 'user_satisfaction'
  | 'technique_combinations';

/**
 * Analytics result structure
 */
export interface AnalyticsResult {
  query: AnalyticsQuery;
  generatedAt: number;
  results: AnalyticsData[];
  summary: AnalyticsSummary;
}

/**
 * Individual analytics data point
 */
export interface AnalyticsData {
  groupKey: string; // e.g., technique name, session ID, date
  metrics: Record<AnalyticsMetric, number>;
  count: number;
  timeRange?: {
    start: number;
    end: number;
  };
}

/**
 * Analytics summary statistics
 */
export interface AnalyticsSummary {
  totalEvents: number;
  totalSessions: number;
  topTechniques: Array<{ technique: LateralTechnique; effectiveness: number }>;
  averageSessionDuration: number;
  completionRate: number;
  insightGenerationRate: number;
  riskIdentificationRate: number;
}

/**
 * Telemetry configuration
 */
export interface TelemetryConfig {
  enabled: boolean;
  level: TelemetryLevel;
  storage: TelemetryStorage;
  storagePath?: string;
  batchSize?: number;
  flushInterval?: number; // milliseconds
  privacyMode?: 'strict' | 'balanced' | 'minimal';
  excludePatterns?: string[]; // Patterns to exclude from telemetry
}

/**
 * Technique effectiveness metrics
 */
export interface TechniqueEffectiveness {
  technique: LateralTechnique;
  sessionsUsed: number;
  completionRate: number;
  averageEffectiveness: number;
  averageInsights: number;
  averageRisks: number;
  averageDuration: number;
  userSatisfaction?: number;
  commonCombinations: Array<{
    techniques: LateralTechnique[];
    frequency: number;
    effectiveness: number;
  }>;
}

/**
 * Session analytics data
 */
export interface SessionAnalytics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  techniquesUsed: LateralTechnique[];
  totalSteps: number;
  completedSteps: number;
  insightsGenerated: number;
  risksIdentified: number;
  flexibilityProgression: number[]; // Flexibility scores over time
  effectiveness: number;
  abandoned: boolean;
}

/**
 * Privacy-safe event for storage/export
 */
export interface PrivacySafeEvent {
  eventId: string;
  eventType: TelemetryEventType;
  timestamp: number;
  anonymousSessionId: string; // Hashed/anonymized
  technique?: LateralTechnique;
  metrics: {
    effectiveness?: number;
    insightCount?: number;
    riskCount?: number;
    duration?: number;
    flexibilityScore?: number;
  };
}

/**
 * Telemetry export format
 */
export interface TelemetryExport {
  version: string;
  exportDate: number;
  privacyLevel: 'full' | 'anonymized' | 'aggregated';
  events?: PrivacySafeEvent[];
  analytics?: AnalyticsResult;
  summary?: AnalyticsSummary;
}
