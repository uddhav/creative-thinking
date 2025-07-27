/**
 * Absorbing Barrier Early Warning System
 * Coordinates multiple sensors to detect approaching points of no return
 */
import type { SensorType, EarlyWarningState, WarningHistory, EarlyWarningConfig } from './types.js';
import type { PathMemory } from '../types.js';
import type { SessionData } from '../../index.js';
export declare class AbsorbingBarrierEarlyWarning {
    private sensors;
    private warningHistory;
    private lastWarningState;
    private readonly maxHistorySize;
    private readonly historyTTL;
    private lastMeasurementTime;
    private readonly measurementThrottleMs;
    private readonly defaultCalibration;
    private readonly onError;
    private sensorFailures;
    private readonly maxConsecutiveFailures;
    constructor(config?: EarlyWarningConfig);
    /**
     * Perform continuous monitoring of all sensors
     */
    continuousMonitoring(pathMemory: PathMemory, sessionData: SessionData): Promise<EarlyWarningState>;
    /**
     * Generate warnings from a sensor reading
     */
    private generateWarningsFromReading;
    /**
     * Create a barrier warning
     */
    private createBarrierWarning;
    /**
     * Generate warning message
     */
    private generateWarningMessage;
    /**
     * Generate detailed analysis
     */
    private generateDetailedAnalysis;
    /**
     * Generate recommendations based on warning
     */
    private generateRecommendations;
    /**
     * Generate escape protocols based on severity
     */
    private generateEscapeProtocols;
    /**
     * Get visual indicator for warning level
     */
    private getVisualIndicator;
    /**
     * Prioritize warnings by severity and impact
     */
    private prioritizeWarnings;
    /**
     * Detect compound risk from multiple barriers
     */
    private detectCompoundRisk;
    /**
     * Identify barriers in critical range
     */
    private identifyCriticalBarriers;
    /**
     * Determine recommended action based on warnings
     */
    private determineRecommendedAction;
    /**
     * Get available escape routes based on current state
     */
    private getAvailableEscapeRoutes;
    /**
     * Calculate overall risk level
     */
    private calculateOverallRisk;
    /**
     * Update warning history
     */
    private updateWarningHistory;
    /**
     * Clean up old warning history to prevent memory leaks
     */
    private cleanupWarningHistory;
    /**
     * Detect patterns in warning history
     */
    private detectWarningPatterns;
    /**
     * Calculate average time to barrier
     */
    private calculateAverageTimeToBarrier;
    /**
     * Identify common triggers
     */
    private identifyCommonTriggers;
    /**
     * Extract learnings from history
     */
    private extractLearnings;
    /**
     * Get sensor status
     */
    getSensorStatus(): Map<SensorType, unknown>;
    /**
     * Get warning history for a session
     */
    getWarningHistory(sessionId?: string): WarningHistory[];
    /**
     * Reset warning system
     */
    reset(): void;
    /**
     * Handle sensor errors with proper reporting
     */
    private handleSensorError;
    /**
     * Create a fallback reading for a failed sensor
     */
    private createFallbackReading;
}
//# sourceMappingURL=warningSystem.d.ts.map