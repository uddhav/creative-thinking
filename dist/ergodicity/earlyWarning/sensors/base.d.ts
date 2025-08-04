/**
 * Base abstract class for all early warning system sensors
 */
import { BarrierWarningLevel } from '../types.js';
import type { SensorType, SensorReading, SensorCalibration } from '../types.js';
import type { PathMemory, Barrier } from '../../types.js';
import type { SessionData } from '../../../index.js';
export declare abstract class Sensor {
    readonly type: SensorType;
    protected calibration: SensorCalibration;
    protected lastReading: SensorReading | null;
    protected readingHistory: SensorReading[];
    protected readonly maxHistorySize = 20;
    constructor(type: SensorType, calibration?: Partial<SensorCalibration>);
    /**
     * Take a sensor reading based on current state
     */
    measure(pathMemory: PathMemory, sessionData: SessionData): Promise<SensorReading>;
    /**
     * Get the raw sensor reading (0.0-1.0, where 1.0 = at barrier)
     * Must be implemented by each sensor
     */
    protected abstract getRawReading(pathMemory: PathMemory, sessionData: SessionData): Promise<number>;
    /**
     * Detect specific indicators for this sensor
     * Must be implemented by each sensor
     */
    protected abstract detectIndicators(pathMemory: PathMemory, sessionData: SessionData): Promise<string[]>;
    /**
     * Gather sensor-specific context data
     * Must be implemented by each sensor
     */
    protected abstract gatherContext(pathMemory: PathMemory, sessionData: SessionData): Promise<Record<string, unknown>>;
    /**
     * Calculate sensor confidence in the reading
     * Can be overridden by specific sensors
     */
    protected calculateConfidence(): number;
    /**
     * Apply noise filtering to smooth readings
     */
    protected applyNoiseFilter(rawValue: number): number;
    /**
     * Calculate how fast we're approaching the barrier
     */
    protected calculateApproachRate(): number;
    /**
     * Determine warning level based on distance
     */
    protected determineWarningLevel(distance: number): BarrierWarningLevel;
    /**
     * Estimate time to impact based on distance and approach rate
     */
    protected estimateTimeToImpact(distance: number, approachRate: number): number | undefined;
    /**
     * Update reading history
     */
    protected updateHistory(reading: SensorReading): void;
    /**
     * Calculate variance in recent readings
     */
    protected calculateVariance(): number;
    /**
     * Calibrate sensor sensitivity
     */
    calibrate(settings: Partial<SensorCalibration>): void;
    /**
     * Get current calibration settings
     */
    getCalibration(): SensorCalibration;
    /**
     * Reset sensor history
     */
    reset(): void;
    /**
     * Get sensor status
     */
    getStatus(): {
        type: SensorType;
        lastReading: SensorReading | null;
        historySize: number;
        calibration: SensorCalibration;
    };
    /**
     * Get matching barriers for this sensor
     */
    abstract getMonitoredBarriers(): Barrier[];
}
//# sourceMappingURL=base.d.ts.map