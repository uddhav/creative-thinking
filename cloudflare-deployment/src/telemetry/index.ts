/**
 * Telemetry Module
 * Exports main telemetry components
 */

export { TelemetryCollector } from './TelemetryCollector.js';
export { TelemetryAnalyzer } from './TelemetryAnalyzer.js';
export { PrivacyManager } from './privacy.js';
export { TelemetryStorage } from './TelemetryStorage.js';

// Export types
export type {
  TelemetryEvent,
  TelemetryEventType,
  TelemetryLevel,
  TelemetryStorage as TelemetryStorageType,
  TelemetryConfig,
  TelemetryMetadata,
  PrivacySafeEvent,
  AnalyticsQuery,
  AnalyticsResult,
  AnalyticsData,
  AnalyticsSummary,
  AnalyticsMetric,
  TechniqueEffectiveness,
  SessionAnalytics,
  TelemetryExport,
} from './types.js';
