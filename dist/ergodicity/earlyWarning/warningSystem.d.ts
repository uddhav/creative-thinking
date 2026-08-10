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
    /**
     * Path length at which each sensor last took a fresh reading.
     *
     * The gate used to be wall-clock: a sensor re-measured only if 5000 ms had
     * passed. Steps, not seconds, are the unit this subsystem reasons about, and
     * every scripted caller — the CLI, the test suite, any programmatic run —
     * completes a whole session inside one throttle window, so it measured once
     * at step 1 and replayed that reading for the rest of the session. Measured:
     * the server reported `continue` on 20/20 steps of a chain where an
     * unthrottled monitor reported `escape` on step 11. Keying on path length
     * costs the same one measurement per step while making a scripted run and a
     * slow interactive run behave identically.
     */
    private lastMeasurementPathLength;
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