/**
 * Early Warning System Public API
 * Exports all components needed for barrier detection and prevention
 */
export { AbsorbingBarrierEarlyWarning } from './warningSystem.js';
export { ResponseProtocolSystem } from './responseProtocols.js';
export { Sensor } from './sensors/base.js';
export { ResourceMonitor } from './sensors/resourceMonitor.js';
export { CognitiveAssessor } from './sensors/cognitiveAssessor.js';
export { TechnicalDebtAnalyzer } from './sensors/technicalDebtAnalyzer.js';
export type { SensorType, SensorReading, SensorCalibration, BarrierWarning, EarlyWarningState, WarningHistory, WarningPattern, EscapeProtocol, EscapeResponse, ResourceMetrics, CognitiveMetrics, TechnicalDebtMetrics, } from './types.js';
export { BarrierWarningLevel } from './types.js';
//# sourceMappingURL=index.d.ts.map