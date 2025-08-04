/**
 * Absorbing Barrier Early Warning System
 * Coordinates multiple sensors to detect approaching points of no return
 */
import { randomUUID } from 'crypto';
import { BarrierWarningLevel } from './types.js';
import { ResourceMonitor } from './sensors/resourceMonitor.js';
import { CognitiveAssessor } from './sensors/cognitiveAssessor.js';
import { TechnicalDebtAnalyzer } from './sensors/technicalDebtAnalyzer.js';
export class AbsorbingBarrierEarlyWarning {
    sensors;
    warningHistory = [];
    lastWarningState = null;
    maxHistorySize;
    historyTTL;
    lastMeasurementTime = new Map();
    measurementThrottleMs;
    defaultCalibration;
    onError;
    sensorFailures = new Map();
    maxConsecutiveFailures = 3;
    constructor(config = {}) {
        // Apply configuration with defaults
        this.maxHistorySize = config.maxHistorySize ?? 100;
        this.historyTTL = config.historyTTL ?? 24 * 60 * 60 * 1000; // 24 hours
        this.measurementThrottleMs = config.measurementThrottleMs ?? 5000; // 5 seconds
        this.defaultCalibration = config.defaultCalibration ?? {};
        this.onError =
            config.onError ??
                ((error, context) => {
                    console.error(`Early Warning System Error [${context.operation}]:`, error);
                    if (context.sensor) {
                        console.error(`Sensor: ${context.sensor}`);
                    }
                });
        // Initialize sensors with calibration
        this.sensors = new Map();
        this.sensors.set('resource', new ResourceMonitor(this.defaultCalibration));
        this.sensors.set('cognitive', new CognitiveAssessor(this.defaultCalibration));
        this.sensors.set('technical_debt', new TechnicalDebtAnalyzer(this.defaultCalibration));
    }
    /**
     * Perform continuous monitoring of all sensors
     */
    async continuousMonitoring(pathMemory, sessionData) {
        const sensorReadings = new Map();
        const activeWarnings = [];
        const now = Date.now();
        // Run all sensors with throttling
        for (const [sensorType, sensor] of this.sensors) {
            try {
                const lastMeasurement = this.lastMeasurementTime.get(sensorType) || 0;
                const timeSinceLastMeasurement = now - lastMeasurement;
                // Use cached reading if within throttle window
                if (timeSinceLastMeasurement < this.measurementThrottleMs && this.lastWarningState) {
                    const cachedReading = this.lastWarningState.sensorReadings.get(sensorType);
                    if (cachedReading) {
                        sensorReadings.set(sensorType, cachedReading);
                        // Still check for warnings with cached reading
                        const warnings = this.generateWarningsFromReading(cachedReading, sensor, pathMemory, sessionData);
                        activeWarnings.push(...warnings);
                        continue;
                    }
                }
                // Take new measurement
                const reading = await sensor.measure(pathMemory, sessionData);
                sensorReadings.set(sensorType, reading);
                this.lastMeasurementTime.set(sensorType, now);
                // Generate warnings if needed
                const warnings = this.generateWarningsFromReading(reading, sensor, pathMemory, sessionData);
                activeWarnings.push(...warnings);
                // Reset failure count on success
                this.sensorFailures.set(sensorType, 0);
            }
            catch (error) {
                this.handleSensorError(error, sensorType);
                // Use fallback reading if available
                const fallbackReading = this.createFallbackReading(sensorType);
                if (fallbackReading) {
                    sensorReadings.set(sensorType, fallbackReading);
                }
            }
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
        const state = {
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
    generateWarningsFromReading(reading, sensor, pathMemory, sessionData) {
        const warnings = [];
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
    createBarrierWarning(reading, barrier, sensorType) {
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
    generateWarningMessage(reading, barrier) {
        const distance = Math.round(reading.distance * 100);
        const level = reading.warningLevel.toUpperCase();
        return `${level}: Approaching ${barrier.name} barrier (${distance}% distance remaining)`;
    }
    /**
     * Generate detailed analysis
     */
    generateDetailedAnalysis(reading, barrier) {
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
    generateRecommendations(reading, barrier) {
        const recommendations = [];
        // Add barrier-specific strategies
        recommendations.push(...barrier.avoidanceStrategies);
        // Add urgency-based recommendations
        if (reading.warningLevel === BarrierWarningLevel.CRITICAL) {
            recommendations.unshift('IMMEDIATE ACTION REQUIRED');
            recommendations.push('Consider executing escape protocol');
        }
        else if (reading.warningLevel === BarrierWarningLevel.WARNING) {
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
    generateEscapeProtocols(severity, barrier) {
        const protocols = [];
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
    getVisualIndicator(level) {
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
    prioritizeWarnings(warnings) {
        return warnings.sort((a, b) => {
            // First by severity
            const severityOrder = {
                [BarrierWarningLevel.CRITICAL]: 0,
                [BarrierWarningLevel.WARNING]: 1,
                [BarrierWarningLevel.CAUTION]: 2,
                [BarrierWarningLevel.SAFE]: 3,
            };
            const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (severityDiff !== 0)
                return severityDiff;
            // Then by distance (closer = higher priority)
            return a.reading.distance - b.reading.distance;
        });
    }
    /**
     * Detect compound risk from multiple barriers
     */
    detectCompoundRisk(warnings) {
        const criticalCount = warnings.filter(w => w.severity === BarrierWarningLevel.CRITICAL).length;
        const warningCount = warnings.filter(w => w.severity === BarrierWarningLevel.WARNING).length;
        return criticalCount > 1 || (criticalCount > 0 && warningCount > 1);
    }
    /**
     * Identify barriers in critical range
     */
    identifyCriticalBarriers(readings, pathMemory) {
        const criticalBarriers = [];
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
    determineRecommendedAction(warnings, compoundRisk) {
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
    getAvailableEscapeRoutes(warnings, pathMemory) {
        const routes = [];
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
    calculateOverallRisk(warnings) {
        if (warnings.length === 0) {
            return BarrierWarningLevel.SAFE;
        }
        // Return highest severity
        return warnings[0].severity;
    }
    /**
     * Update warning history
     */
    updateWarningHistory(state, sessionData) {
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
    cleanupWarningHistory() {
        const now = Date.now();
        const cutoffTime = now - this.historyTTL;
        // Remove old sessions based on TTL
        this.warningHistory = this.warningHistory.filter(history => {
            const lastWarningTime = history.warnings.length > 0
                ? new Date(history.warnings[history.warnings.length - 1].timestamp).getTime()
                : now;
            return lastWarningTime > cutoffTime;
        });
        // If still too many sessions, keep only the most recent
        if (this.warningHistory.length > this.maxHistorySize) {
            this.warningHistory.sort((a, b) => {
                const aTime = a.warnings.length > 0
                    ? new Date(a.warnings[a.warnings.length - 1].timestamp).getTime()
                    : 0;
                const bTime = b.warnings.length > 0
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
    detectWarningPatterns(warnings) {
        const patterns = [];
        // Group warnings by barrier type
        const byBarrier = new Map();
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
    calculateAverageTimeToBarrier(warnings) {
        const times = warnings
            .map(w => w.reading.timeToImpact)
            .filter((t) => t !== undefined);
        if (times.length === 0)
            return 0;
        return times.reduce((a, b) => a + b, 0) / times.length;
    }
    /**
     * Identify common triggers
     */
    identifyCommonTriggers(warnings) {
        const allIndicators = warnings.flatMap(w => w.reading.indicators);
        // Count occurrences
        const counts = new Map();
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
    extractLearnings(history) {
        const learnings = [];
        // Recurring patterns
        for (const pattern of history.patterns) {
            if (pattern.type === 'recurring' && pattern.frequency > 3) {
                learnings.push(`Recurring ${pattern.barriers[0].name} - consider systematic approach`);
            }
        }
        // Successful escapes
        const successfulEscapes = history.escapesExecuted.filter(e => e.success);
        if (successfulEscapes.length > 0) {
            const avgGain = successfulEscapes.map(e => e.flexibilityGained).reduce((a, b) => a + b, 0) /
                successfulEscapes.length;
            learnings.push(`Escape protocols average ${Math.round(avgGain * 100)}% flexibility gain`);
        }
        return learnings;
    }
    /**
     * Get sensor status
     */
    getSensorStatus() {
        const status = new Map();
        for (const [type, sensor] of this.sensors) {
            status.set(type, sensor.getStatus());
        }
        return status;
    }
    /**
     * Get warning history for a session
     */
    getWarningHistory(sessionId) {
        if (sessionId) {
            return this.warningHistory.filter(h => h.sessionId === sessionId);
        }
        return [...this.warningHistory];
    }
    /**
     * Reset warning system
     */
    reset() {
        for (const sensor of this.sensors.values()) {
            sensor.reset();
        }
        this.lastWarningState = null;
        this.sensorFailures.clear();
    }
    /**
     * Handle sensor errors with proper reporting
     */
    handleSensorError(error, sensorType) {
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
            this.onError(new Error(`Sensor ${sensorType} disabled after ${failures} consecutive failures`), { sensor: sensorType, operation: 'sensor disabled' });
        }
    }
    /**
     * Create a fallback reading for a failed sensor
     */
    createFallbackReading(sensorType) {
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
//# sourceMappingURL=warningSystem.js.map