/**
 * Base abstract class for all early warning system sensors
 */
import { BarrierWarningLevel } from '../types.js';
export class Sensor {
    type;
    calibration;
    lastReading = null;
    readingHistory = [];
    maxHistorySize = 20;
    constructor(type, calibration) {
        this.type = type;
        this.calibration = {
            sensitivity: 0.7,
            warningThresholds: {
                caution: 0.5, // Changed from 0.6 - only warn when 50% to barrier
                warning: 0.3, // Changed from 0.4 - warn at 30% distance
                critical: 0.15, // Changed from 0.2 - critical at 15% distance
            },
            noiseFilter: 0.05,
            historicalWeight: 0.3,
            contextFactors: {},
            ...calibration,
        };
    }
    /**
     * Take a sensor reading based on current state
     */
    async measure(pathMemory, sessionData) {
        // Get raw sensor data
        const rawValue = await this.getRawReading(pathMemory, sessionData);
        // Apply noise filtering
        const filteredValue = this.applyNoiseFilter(rawValue);
        // Calculate distance to barrier
        const distance = 1 - filteredValue;
        // Calculate approach rate
        const approachRate = this.calculateApproachRate(filteredValue);
        // Determine warning level
        const warningLevel = this.determineWarningLevel(distance);
        // Get specific indicators
        const indicators = await this.detectIndicators(pathMemory, sessionData);
        // Calculate time to impact
        const timeToImpact = this.estimateTimeToImpact(distance, approachRate);
        // Build sensor reading
        const reading = {
            sensorType: this.type,
            timestamp: new Date().toISOString(),
            rawValue: filteredValue,
            warningLevel,
            distance,
            approachRate,
            timeToImpact,
            confidence: this.calculateConfidence(pathMemory, sessionData),
            indicators,
            context: await this.gatherContext(pathMemory, sessionData),
        };
        // Update history
        this.updateHistory(reading);
        return reading;
    }
    /**
     * Calculate sensor confidence in the reading
     * Can be overridden by specific sensors
     */
    calculateConfidence(_pathMemory, _sessionData) {
        // Base confidence on data availability and history
        let confidence = 0.5;
        // More history = more confidence
        if (this.readingHistory.length >= 5) {
            confidence += 0.2;
        }
        // Stable readings = more confidence
        if (this.readingHistory.length >= 3) {
            const variance = this.calculateVariance();
            if (variance < 0.1) {
                confidence += 0.2;
            }
        }
        // Recent readings = more confidence
        if (this.lastReading) {
            const timeSinceLastReading = Date.now() - new Date(this.lastReading.timestamp).getTime();
            if (timeSinceLastReading < 60000) {
                // Less than 1 minute
                confidence += 0.1;
            }
        }
        return Math.min(confidence, 1.0);
    }
    /**
     * Apply noise filtering to smooth readings
     */
    applyNoiseFilter(rawValue) {
        if (!this.lastReading) {
            return rawValue;
        }
        const change = Math.abs(rawValue - this.lastReading.rawValue);
        // If change is below noise threshold, use weighted average
        if (change < this.calibration.noiseFilter) {
            return (this.lastReading.rawValue * this.calibration.historicalWeight +
                rawValue * (1 - this.calibration.historicalWeight));
        }
        return rawValue;
    }
    /**
     * Calculate how fast we're approaching the barrier
     */
    calculateApproachRate(_currentValue) {
        if (this.readingHistory.length < 2) {
            return 0;
        }
        // Get readings from last 5 measurements or available history
        const recentHistory = this.readingHistory.slice(-5);
        // Calculate average change rate
        let totalChange = 0;
        for (let i = 1; i < recentHistory.length; i++) {
            totalChange += recentHistory[i].rawValue - recentHistory[i - 1].rawValue;
        }
        const averageChange = totalChange / (recentHistory.length - 1);
        // Normalize to -1 to 1 range
        return Math.max(-1, Math.min(1, averageChange * 10));
    }
    /**
     * Determine warning level based on distance
     */
    determineWarningLevel(distance) {
        const thresholds = this.calibration.warningThresholds;
        if (distance >= thresholds.caution) {
            return BarrierWarningLevel.SAFE;
        }
        else if (distance >= thresholds.warning) {
            return BarrierWarningLevel.CAUTION;
        }
        else if (distance >= thresholds.critical) {
            return BarrierWarningLevel.WARNING;
        }
        else {
            return BarrierWarningLevel.CRITICAL;
        }
    }
    /**
     * Estimate time to impact based on distance and approach rate
     */
    estimateTimeToImpact(distance, approachRate) {
        // If moving away or stationary, no impact
        if (approachRate <= 0) {
            return undefined;
        }
        // If already very close, impact is imminent
        if (distance < 0.1) {
            return 1;
        }
        // Calculate steps to impact based on current rate
        // Assuming each step moves us approachRate * 0.1 closer
        const stepsToImpact = distance / (approachRate * 0.1);
        return Math.round(stepsToImpact);
    }
    /**
     * Update reading history
     */
    updateHistory(reading) {
        this.lastReading = reading;
        this.readingHistory.push(reading);
        // Maintain max history size
        if (this.readingHistory.length > this.maxHistorySize) {
            this.readingHistory.shift();
        }
    }
    /**
     * Calculate variance in recent readings
     */
    calculateVariance() {
        if (this.readingHistory.length < 2) {
            return 0;
        }
        const values = this.readingHistory.map(r => r.rawValue);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }
    /**
     * Calibrate sensor sensitivity
     */
    calibrate(settings) {
        this.calibration = {
            ...this.calibration,
            ...settings,
        };
    }
    /**
     * Get current calibration settings
     */
    getCalibration() {
        return { ...this.calibration };
    }
    /**
     * Reset sensor history
     */
    reset() {
        this.lastReading = null;
        this.readingHistory = [];
    }
    /**
     * Get sensor status
     */
    getStatus() {
        return {
            type: this.type,
            lastReading: this.lastReading,
            historySize: this.readingHistory.length,
            calibration: this.getCalibration(),
        };
    }
}
//# sourceMappingURL=base.js.map