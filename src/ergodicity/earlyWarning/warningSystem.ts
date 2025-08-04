/**
 * Absorbing Barrier Early Warning System
 * Coordinates multiple sensors to detect approaching points of no return
 */

import { randomUUID } from 'crypto';
import { BarrierWarningLevel } from './types.js';
import type {
  SensorType,
  SensorReading,
  BarrierWarning,
  EarlyWarningState,
  EscapeProtocol,
  WarningHistory,
  WarningPattern,
  EarlyWarningConfig,
  SensorCalibration,
} from './types.js';
import type { PathMemory, Barrier } from '../types.js';
import type { SessionData } from '../../index.js';
import { logger } from '../../utils/Logger.js';

// Import sensors
import type { Sensor } from './sensors/base.js';
import { ResourceMonitor } from './sensors/resourceMonitor.js';
import { CognitiveAssessor } from './sensors/cognitiveAssessor.js';
import { TechnicalDebtAnalyzer } from './sensors/technicalDebtAnalyzer.js';

export class AbsorbingBarrierEarlyWarning {
  private sensors: Map<SensorType, Sensor>;
  private warningHistory: WarningHistory[] = [];
  private lastWarningState: EarlyWarningState | null = null;
  private readonly maxHistorySize: number;
  private readonly historyTTL: number;
  private lastMeasurementTime: Map<SensorType, number> = new Map();
  private readonly measurementThrottleMs: number;
  private readonly defaultCalibration: Partial<SensorCalibration>;
  private readonly onError: (
    error: Error,
    context: { sensor?: SensorType; operation: string }
  ) => void;
  private sensorFailures: Map<SensorType, number> = new Map();
  private readonly maxConsecutiveFailures = 3;

  constructor(config: EarlyWarningConfig = {}) {
    // Apply configuration with defaults
    this.maxHistorySize = config.maxHistorySize ?? 100;
    this.historyTTL = config.historyTTL ?? 24 * 60 * 60 * 1000; // 24 hours
    this.measurementThrottleMs = config.measurementThrottleMs ?? 5000; // 5 seconds
    this.defaultCalibration = config.defaultCalibration ?? {};
    this.onError =
      config.onError ??
      ((error, context) => {
        logger.error(`Early Warning System Error [${context.operation}]`, {
          error: error.message,
          stack: error.stack,
          sensor: context.sensor,
        });
      });

    // Initialize sensors with calibration
    this.sensors = new Map<SensorType, Sensor>();
    this.sensors.set('resource', new ResourceMonitor(this.defaultCalibration));
    this.sensors.set('cognitive', new CognitiveAssessor(this.defaultCalibration));
    this.sensors.set('technical_debt', new TechnicalDebtAnalyzer(this.defaultCalibration));
  }

  /**
   * Perform continuous monitoring of all sensors
   */
  async continuousMonitoring(
    pathMemory: PathMemory,
    sessionData: SessionData
  ): Promise<EarlyWarningState> {
    const now = Date.now();

    // Prepare sensor tasks for parallel execution
    const sensorTasks = Array.from(this.sensors.entries()).map(async ([sensorType, sensor]) => {
      try {
        const lastMeasurement = this.lastMeasurementTime.get(sensorType) || 0;
        const timeSinceLastMeasurement = now - lastMeasurement;

        // Use cached reading if within throttle window
        if (timeSinceLastMeasurement < this.measurementThrottleMs && this.lastWarningState) {
          const cachedReading = this.lastWarningState.sensorReadings.get(sensorType);
          if (cachedReading) {
            const warnings = this.generateWarningsFromReading(
              cachedReading,
              sensor,
              pathMemory,
              sessionData
            );
            return { sensorType, reading: cachedReading, warnings, cached: true };
          }
        }

        // Take new measurement
        const reading = await sensor.measure(pathMemory, sessionData);
        this.lastMeasurementTime.set(sensorType, now);

        // Generate warnings if needed
        const warnings = this.generateWarningsFromReading(reading, sensor, pathMemory, sessionData);

        // Reset failure count on success
        this.sensorFailures.set(sensorType, 0);

        return { sensorType, reading, warnings, cached: false };
      } catch (error) {
        this.handleSensorError(error as Error, sensorType);

        // Use fallback reading if available
        const fallbackReading = this.createFallbackReading(sensorType);
        return {
          sensorType,
          reading: fallbackReading,
          warnings: [],
          error: true,
        };
      }
    });

    // Execute all sensor measurements in parallel
    const startTime = Date.now();
    const sensorResults = await Promise.all(sensorTasks);
    const executionTime = Date.now() - startTime;

    // Log performance metrics
    logger.logPerformance('sensor measurements (parallel)', executionTime, 100);

    // Collect results
    const sensorReadings = new Map<SensorType, SensorReading>();
    const activeWarnings: BarrierWarning[] = [];

    for (const result of sensorResults) {
      if (result.reading) {
        sensorReadings.set(result.sensorType, result.reading);
      }
      activeWarnings.push(...result.warnings);
    }

    // Prioritize warnings
    const prioritizedWarnings = this.prioritizeWarnings(activeWarnings);

    // Detect compound risks
    const compoundRisk = this.detectCompoundRisk(prioritizedWarnings);

    // Identify critical barriers
    const criticalBarriers = this.identifyCriticalBarriers(sensorReadings, pathMemory);

    // Determine recommended action
    const recommendedAction = this.determineRecommendedAction(prioritizedWarnings, compoundRisk);

    // Get available escape routes
    const escapeRoutes = this.getAvailableEscapeRoutes(prioritizedWarnings, pathMemory);

    // Calculate overall risk level
    const overallRisk = this.calculateOverallRisk(prioritizedWarnings);

    const state: EarlyWarningState = {
      overallRisk,
      activeWarnings: prioritizedWarnings,
      sensorReadings,
      compoundRisk,
      criticalBarriers,
      recommendedAction,
      escapeRoutesAvailable: escapeRoutes,
    };

    // Update history
    this.updateWarningHistory(state, sessionData);
    this.lastWarningState = state;

    return state;
  }

  /**
   * Generate warnings from a sensor reading
   */
  private generateWarningsFromReading(
    reading: SensorReading,
    sensor: Sensor,
    pathMemory: PathMemory,
    sessionData: SessionData
  ): BarrierWarning[] {
    const warnings: BarrierWarning[] = [];

    // Get barriers monitored by this sensor
    const monitoredBarriers = sensor.getMonitoredBarriers();

    for (const barrier of monitoredBarriers) {
      // Create a copy of barrier with updated proximity
      const barrierWithProximity = {
        ...barrier,
        proximity: reading.rawValue,
      };

      // Generate warning if threshold exceeded
      if (reading.warningLevel !== BarrierWarningLevel.SAFE) {
        const warning = this.createBarrierWarning(reading, barrierWithProximity, sensor.type);

        // Enhance warning message with context
        if (pathMemory.currentFlexibility.flexibilityScore < 0.3) {
          warning.message += ' [LOW FLEXIBILITY - URGENT]';
        }
        if (sessionData.history.length > 20) {
          warning.detailedAnalysis += ` Extended session detected (${sessionData.history.length} steps).`;
        }

        warnings.push(warning);
      }
    }

    return warnings;
  }

  /**
   * Create a barrier warning
   */
  private createBarrierWarning(
    reading: SensorReading,
    barrier: Barrier,
    sensorType: SensorType
  ): BarrierWarning {
    const severity = reading.warningLevel;
    const message = this.generateWarningMessage(reading, barrier);
    const detailedAnalysis = this.generateDetailedAnalysis(reading, barrier);
    const recommendations = this.generateRecommendations(reading, barrier);
    const escapeProtocols = this.generateEscapeProtocols(severity, barrier);

    return {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      sensor: sensorType,
      barrier,
      reading,
      severity,
      message,
      detailedAnalysis,
      recommendations,
      escapeProtocols,
      visualIndicator: this.getVisualIndicator(severity),
      requiresUserAttention: severity === BarrierWarningLevel.CRITICAL,
      autoResponseTriggered: false,
    };
  }

  /**
   * Generate warning message
   */
  private generateWarningMessage(reading: SensorReading, barrier: Barrier): string {
    const distance = Math.round(reading.distance * 100);
    const level = reading.warningLevel.toUpperCase();

    return `${level}: Approaching ${barrier.name} barrier (${distance}% distance remaining)`;
  }

  /**
   * Generate detailed analysis
   */
  private generateDetailedAnalysis(reading: SensorReading, barrier: Barrier): string {
    const indicators = reading.indicators.join(', ');
    const timeToImpact = reading.timeToImpact ? `~${reading.timeToImpact} steps` : 'Unknown';

    return `
Barrier: ${barrier.name}
Type: ${barrier.type}
Impact: ${barrier.impact}
Current Distance: ${Math.round(reading.distance * 100)}%
Approach Rate: ${reading.approachRate > 0 ? '+' : ''}${(reading.approachRate * 100).toFixed(1)}%/step
Time to Impact: ${timeToImpact}
Confidence: ${Math.round(reading.confidence * 100)}%

Detected Indicators:
${indicators}

Barrier Description:
${barrier.description}
    `.trim();
  }

  /**
   * Generate recommendations based on warning
   */
  private generateRecommendations(reading: SensorReading, barrier: Barrier): string[] {
    const recommendations: string[] = [];

    // Add barrier-specific strategies
    recommendations.push(...barrier.avoidanceStrategies);

    // Add urgency-based recommendations
    if (reading.warningLevel === BarrierWarningLevel.CRITICAL) {
      recommendations.unshift('IMMEDIATE ACTION REQUIRED');
      recommendations.push('Consider executing escape protocol');
    } else if (reading.warningLevel === BarrierWarningLevel.WARNING) {
      recommendations.unshift('Take corrective action soon');
    }

    // Add context-specific recommendations
    if (reading.approachRate > 0.5) {
      recommendations.push('Rapidly approaching - slow down decision pace');
    }

    return recommendations;
  }

  /**
   * Generate escape protocols based on severity
   */
  private generateEscapeProtocols(
    severity: BarrierWarningLevel,
    barrier: Barrier
  ): EscapeProtocol[] {
    const protocols: EscapeProtocol[] = [];

    if (severity === BarrierWarningLevel.CRITICAL) {
      protocols.push({
        level: 1,
        name: 'Pattern Interruption',
        description: `Break current thinking patterns immediately - ${barrier.name} barrier detected`,
        automaticTrigger: false,
        requiredFlexibility: 0.1,
        estimatedFlexibilityGain: 0.3,
        steps: [
          'Stop current approach',
          'Use Random Entry technique',
          'Challenge all assumptions',
          'Seek opposite perspective',
          `Specifically avoid ${barrier.subtype} patterns`,
        ],
        risks: ['May feel disorienting', 'Loss of current progress'],
        successProbability: barrier.impact === 'irreversible' ? 0.7 : 0.8,
      });
    }

    if (severity >= BarrierWarningLevel.WARNING) {
      protocols.push({
        level: 2,
        name: 'Resource Reallocation',
        description: 'Shift resources to create new options',
        automaticTrigger: false,
        requiredFlexibility: 0.2,
        estimatedFlexibilityGain: 0.2,
        steps: [
          'Identify non-critical commitments',
          'Free up resources',
          'Invest in exploration',
          'Create option buffer',
        ],
        risks: ['May slow current progress', 'Stakeholder pushback'],
        successProbability: 0.7,
      });
    }

    return protocols;
  }

  /**
   * Get visual indicator for warning level
   */
  private getVisualIndicator(level: BarrierWarningLevel): string {
    switch (level) {
      case BarrierWarningLevel.SAFE:
        return '🟢';
      case BarrierWarningLevel.CAUTION:
        return '🟡';
      case BarrierWarningLevel.WARNING:
        return '🟠';
      case BarrierWarningLevel.CRITICAL:
        return '🔴';
    }
  }

  /**
   * Prioritize warnings by severity and impact
   */
  private prioritizeWarnings(warnings: BarrierWarning[]): BarrierWarning[] {
    return warnings.sort((a, b) => {
      // First by severity
      const severityOrder = {
        [BarrierWarningLevel.CRITICAL]: 0,
        [BarrierWarningLevel.WARNING]: 1,
        [BarrierWarningLevel.CAUTION]: 2,
        [BarrierWarningLevel.SAFE]: 3,
      };

      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by distance (closer = higher priority)
      return a.reading.distance - b.reading.distance;
    });
  }

  /**
   * Detect compound risk from multiple barriers
   */
  private detectCompoundRisk(warnings: BarrierWarning[]): boolean {
    const criticalCount = warnings.filter(w => w.severity === BarrierWarningLevel.CRITICAL).length;
    const warningCount = warnings.filter(w => w.severity === BarrierWarningLevel.WARNING).length;

    return criticalCount > 1 || (criticalCount > 0 && warningCount > 1);
  }

  /**
   * Identify barriers in critical range
   */
  private identifyCriticalBarriers(
    readings: Map<SensorType, SensorReading>,
    pathMemory: PathMemory
  ): Barrier[] {
    const criticalBarriers: Barrier[] = [];

    for (const [sensorType, reading] of readings) {
      if (reading.warningLevel === BarrierWarningLevel.CRITICAL) {
        const sensor = this.sensors.get(sensorType);
        if (sensor) {
          const barriers = sensor.getMonitoredBarriers();
          // Add all barriers from this sensor
          criticalBarriers.push(...barriers);
        }
      }
    }

    // Sort by impact severity and path state
    return criticalBarriers.sort((a, b) => {
      const impactWeight = { irreversible: 3, difficult: 2, recoverable: 1 };
      let aScore = impactWeight[a.impact] || 0;
      let bScore = impactWeight[b.impact] || 0;

      // Boost score for barriers that match current constraint types
      if (pathMemory.constraints.some(c => a.description.toLowerCase().includes(c.type)))
        aScore += 0.5;
      if (pathMemory.constraints.some(c => b.description.toLowerCase().includes(c.type)))
        bScore += 0.5;

      return bScore - aScore;
    });
  }

  /**
   * Determine recommended action based on warnings
   */
  private determineRecommendedAction(
    warnings: BarrierWarning[],
    compoundRisk: boolean
  ): 'continue' | 'caution' | 'pivot' | 'escape' {
    if (compoundRisk || warnings.some(w => w.severity === BarrierWarningLevel.CRITICAL)) {
      return 'escape';
    }

    if (warnings.some(w => w.severity === BarrierWarningLevel.WARNING)) {
      return 'pivot';
    }

    if (warnings.some(w => w.severity === BarrierWarningLevel.CAUTION)) {
      return 'caution';
    }

    return 'continue';
  }

  /**
   * Get available escape routes based on current state
   */
  private getAvailableEscapeRoutes(
    warnings: BarrierWarning[],
    pathMemory: PathMemory
  ): EscapeProtocol[] {
    const routes: EscapeProtocol[] = [];

    // Collect all escape protocols from warnings
    for (const warning of warnings) {
      routes.push(...warning.escapeProtocols);
    }

    // Filter by required flexibility
    const currentFlexibility = pathMemory.currentFlexibility.flexibilityScore;
    const availableRoutes = routes.filter(route => route.requiredFlexibility <= currentFlexibility);

    // Sort by success probability
    return availableRoutes.sort((a, b) => b.successProbability - a.successProbability);
  }

  /**
   * Calculate overall risk level
   */
  private calculateOverallRisk(warnings: BarrierWarning[]): BarrierWarningLevel {
    if (warnings.length === 0) {
      return BarrierWarningLevel.SAFE;
    }

    // Return highest severity
    return warnings[0].severity;
  }

  /**
   * Update warning history
   */
  private updateWarningHistory(state: EarlyWarningState, sessionData: SessionData): void {
    // Use technique and problem as a session identifier since SessionData doesn't have sessionId
    const sessionId = `${sessionData.technique}-${sessionData.problem.substring(0, 20)}`;

    let history = this.warningHistory.find(h => h.sessionId === sessionId);
    if (!history) {
      history = {
        sessionId,
        warnings: [],
        escapesExecuted: [],
        patterns: [],
        learnings: [],
      };
      this.warningHistory.push(history);
    }

    // Add new warnings
    history.warnings.push(...state.activeWarnings);

    // Detect patterns
    const patterns = this.detectWarningPatterns(history.warnings);
    history.patterns = patterns;

    // Extract learnings
    const learnings = this.extractLearnings(history);
    history.learnings = learnings;

    // Clean up old sessions
    this.cleanupWarningHistory();
  }

  /**
   * Clean up old warning history to prevent memory leaks
   */
  private cleanupWarningHistory(): void {
    const now = Date.now();
    const cutoffTime = now - this.historyTTL;

    // Remove old sessions based on TTL
    this.warningHistory = this.warningHistory.filter(history => {
      const lastWarningTime =
        history.warnings.length > 0
          ? new Date(history.warnings[history.warnings.length - 1].timestamp).getTime()
          : now;
      return lastWarningTime > cutoffTime;
    });

    // If still too many sessions, keep only the most recent
    if (this.warningHistory.length > this.maxHistorySize) {
      this.warningHistory.sort((a, b) => {
        const aTime =
          a.warnings.length > 0
            ? new Date(a.warnings[a.warnings.length - 1].timestamp).getTime()
            : 0;
        const bTime =
          b.warnings.length > 0
            ? new Date(b.warnings[b.warnings.length - 1].timestamp).getTime()
            : 0;
        return bTime - aTime;
      });
      this.warningHistory = this.warningHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Detect patterns in warning history
   */
  private detectWarningPatterns(warnings: BarrierWarning[]): WarningPattern[] {
    const patterns: WarningPattern[] = [];

    // Group warnings by barrier type
    const byBarrier = new Map<string, BarrierWarning[]>();
    for (const warning of warnings) {
      const key = warning.barrier.subtype;
      if (!byBarrier.has(key)) {
        byBarrier.set(key, []);
      }
      byBarrier.get(key)?.push(warning);
    }

    // Analyze each barrier type
    for (const [barrierType, barrierWarnings] of byBarrier) {
      if (barrierWarnings.length >= 2) {
        patterns.push({
          type: 'recurring',
          barriers: barrierWarnings.map(w => w.barrier),
          frequency: barrierWarnings.length,
          averageTimeToBarrier: this.calculateAverageTimeToBarrier(barrierWarnings),
          commonTriggers: this.identifyCommonTriggers(barrierWarnings),
          effectiveEscapes: [],
        });

        // If this barrier type appears very frequently, add it to pattern description
        if (barrierWarnings.length > 5) {
          const lastPattern = patterns[patterns.length - 1];
          if (lastPattern.type === 'recurring') {
            // Store dominant barrier type in the existing commonTriggers array
            lastPattern.commonTriggers.push(`Dominant barrier type: ${barrierType}`);
          }
        }
      }
    }

    return patterns;
  }

  /**
   * Calculate average time to barrier
   */
  private calculateAverageTimeToBarrier(warnings: BarrierWarning[]): number {
    const times = warnings
      .map(w => w.reading.timeToImpact)
      .filter((t): t is number => t !== undefined);

    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  /**
   * Identify common triggers
   */
  private identifyCommonTriggers(warnings: BarrierWarning[]): string[] {
    const allIndicators = warnings.flatMap(w => w.reading.indicators);

    // Count occurrences
    const counts = new Map<string, number>();
    for (const indicator of allIndicators) {
      counts.set(indicator, (counts.get(indicator) || 0) + 1);
    }

    // Return indicators that appear in >50% of warnings
    const threshold = warnings.length * 0.5;
    return Array.from(counts.entries())
      .filter(([, count]) => count >= threshold)
      .map(([indicator]) => indicator);
  }

  /**
   * Extract learnings from history
   */
  private extractLearnings(history: WarningHistory): string[] {
    const learnings: string[] = [];

    // Recurring patterns
    for (const pattern of history.patterns) {
      if (pattern.type === 'recurring' && pattern.frequency > 3) {
        learnings.push(`Recurring ${pattern.barriers[0].name} - consider systematic approach`);
      }
    }

    // Successful escapes
    const successfulEscapes = history.escapesExecuted.filter(e => e.success);
    if (successfulEscapes.length > 0) {
      const avgGain =
        successfulEscapes.map(e => e.flexibilityGained).reduce((a, b) => a + b, 0) /
        successfulEscapes.length;
      learnings.push(`Escape protocols average ${Math.round(avgGain * 100)}% flexibility gain`);
    }

    return learnings;
  }

  /**
   * Get sensor status
   */
  getSensorStatus(): Map<SensorType, unknown> {
    const status = new Map<SensorType, unknown>();

    for (const [type, sensor] of this.sensors) {
      status.set(type, sensor.getStatus());
    }

    return status;
  }

  /**
   * Get warning history for a session
   */
  getWarningHistory(sessionId?: string): WarningHistory[] {
    if (sessionId) {
      return this.warningHistory.filter(h => h.sessionId === sessionId);
    }
    return [...this.warningHistory];
  }

  /**
   * Reset warning system
   */
  reset(): void {
    for (const sensor of this.sensors.values()) {
      sensor.reset();
    }
    this.lastWarningState = null;
    this.sensorFailures.clear();
  }

  /**
   * Handle sensor errors with proper reporting
   */
  private handleSensorError(error: Error, sensorType: SensorType): void {
    const failures = (this.sensorFailures.get(sensorType) ?? 0) + 1;
    this.sensorFailures.set(sensorType, failures);

    const context = {
      sensor: sensorType,
      operation: 'sensor measurement',
      consecutiveFailures: failures,
    };

    this.onError(error, context);

    // Disable sensor after too many failures
    if (failures >= this.maxConsecutiveFailures) {
      this.onError(
        new Error(`Sensor ${sensorType} disabled after ${failures} consecutive failures`),
        { sensor: sensorType, operation: 'sensor disabled' }
      );
    }
  }

  /**
   * Create a fallback reading for a failed sensor
   */
  private createFallbackReading(sensorType: SensorType): SensorReading | null {
    // If we have a recent reading, use it with reduced confidence
    if (this.lastWarningState) {
      const lastReading = this.lastWarningState.sensorReadings.get(sensorType);
      if (lastReading) {
        const age = Date.now() - new Date(lastReading.timestamp).getTime();
        const ageMinutes = age / (1000 * 60);

        // Only use readings less than 30 minutes old
        if (ageMinutes < 30) {
          return {
            ...lastReading,
            timestamp: new Date().toISOString(),
            confidence: Math.max(0.1, lastReading.confidence * (1 - ageMinutes / 30)),
            indicators: [...lastReading.indicators, 'Using cached reading due to sensor failure'],
          };
        }
      }
    }

    return null;
  }
}
