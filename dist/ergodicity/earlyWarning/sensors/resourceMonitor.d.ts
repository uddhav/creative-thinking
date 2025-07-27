/**
 * Resource Monitor - Tracks depletion of time, energy, and material resources
 */
import { Sensor } from './base.js';
import type { SensorCalibration } from '../types.js';
import type { PathMemory, Barrier } from '../../types.js';
import type { SessionData } from '../../../index.js';
export declare class ResourceMonitor extends Sensor {
    constructor(calibration?: Partial<SensorCalibration>);
    /**
     * Calculate resource depletion level
     */
    protected getRawReading(pathMemory: PathMemory, sessionData: SessionData): Promise<number>;
    private getRawReadingSync;
    /**
     * Detect specific resource depletion indicators
     */
    protected detectIndicators(pathMemory: PathMemory, sessionData: SessionData): Promise<string[]>;
    private detectIndicatorsSync;
    /**
     * Gather resource-specific context
     */
    protected gatherContext(pathMemory: PathMemory, sessionData: SessionData): Promise<Record<string, unknown>>;
    private gatherContextSync;
    /**
     * Calculate comprehensive resource metrics
     */
    private calculateResourceMetrics;
    /**
     * Calculate current energy level from decision patterns
     */
    private calculateEnergyLevel;
    /**
     * Calculate resource burn rate
     */
    private calculateBurnRate;
    /**
     * Calculate solution efficiency
     */
    private calculateEfficiency;
    /**
     * Calculate time depletion
     */
    private calculateTimeDepletion;
    /**
     * Calculate budget depletion (simplified)
     */
    private calculateBudgetDepletion;
    /**
     * Apply context-specific factors
     */
    private applyContextFactors;
    /**
     * Detect energy drain patterns
     */
    private detectEnergyDrainPattern;
    /**
     * Calculate step rate
     */
    private calculateStepRate;
    /**
     * Calculate repetition rate
     */
    private calculateRepetitionRate;
    /**
     * Calculate session duration in milliseconds
     */
    private calculateSessionDuration;
    /**
     * Calculate average step time
     */
    private calculateAverageStepTime;
    /**
     * Calculate wasted effort
     */
    private calculateWastedEffort;
    /**
     * Calculate resource trend
     */
    private calculateResourceTrend;
    /**
     * Estimate time remaining
     */
    private estimateTimeRemaining;
    /**
     * Estimate budget remaining (simplified)
     */
    private estimateBudgetRemaining;
    /**
     * Get barriers monitored by this sensor
     */
    getMonitoredBarriers(): Barrier[];
}
//# sourceMappingURL=resourceMonitor.d.ts.map