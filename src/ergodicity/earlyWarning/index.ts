/**
 * Early Warning System Public API
 * Exports all components needed for barrier detection and prevention
 */

// Main system
export { AbsorbingBarrierEarlyWarning } from './warningSystem.js';
export { ResponseProtocolSystem } from './responseProtocols.js';

// Sensors
export { Sensor } from './sensors/base.js';
export { ResourceMonitor } from './sensors/resourceMonitor.js';
export { CognitiveAssessor } from './sensors/cognitiveAssessor.js';
export { TechnicalDebtAnalyzer } from './sensors/technicalDebtAnalyzer.js';

// Types
export type {
  // Core types
  SensorType,
  SensorReading,
  SensorCalibration,

  // Warning types
  BarrierWarning,
  EarlyWarningState,
  WarningHistory,
  WarningPattern,

  // Response types
  EscapeProtocol,
  EscapeResponse,

  // Metrics types
  ResourceMetrics,
  CognitiveMetrics,
  TechnicalDebtMetrics,
} from './types.js';

// Re-export enum for convenience
export { BarrierWarningLevel } from './types.js';
