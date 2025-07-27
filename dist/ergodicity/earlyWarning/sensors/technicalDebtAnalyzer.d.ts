/**
 * Technical Debt Analyzer - Monitors solution complexity and technical rigidity
 */
import { Sensor } from './base.js';
import type { SensorCalibration } from '../types.js';
import type { PathMemory, Barrier } from '../../types.js';
import type { SessionData } from '../../../index.js';
export declare class TechnicalDebtAnalyzer extends Sensor {
    constructor(calibration?: Partial<SensorCalibration>);
    /**
     * Calculate technical debt level
     */
    protected getRawReading(pathMemory: PathMemory, sessionData: SessionData): Promise<number>;
    /**
     * Detect specific technical debt indicators
     */
    protected detectIndicators(pathMemory: PathMemory, sessionData: SessionData): Promise<string[]>;
    /**
     * Gather technical debt context
     */
    protected gatherContext(pathMemory: PathMemory, sessionData: SessionData): Promise<Record<string, unknown>>;
    /**
     * Calculate technical debt metrics
     */
    private calculateTechnicalDebtMetrics;
    /**
     * Calculate solution entropy (disorder)
     */
    private calculateEntropy;
    /**
     * Calculate change velocity
     */
    private calculateChangeVelocity;
    /**
     * Calculate solution modularity
     */
    private calculateModularity;
    /**
     * Calculate coupling score
     */
    private calculateCoupling;
    /**
     * Calculate refactoring cost
     */
    private calculateRefactorCost;
    /**
     * Calculate rate of debt accumulation
     */
    private calculateDebtAccumulation;
    /**
     * Calculate average debt for a set of events
     */
    private calculateAverageDebt;
    /**
     * Detect hacky patterns
     */
    private detectHackyPatterns;
    /**
     * Count quick fixes
     */
    private countQuickFixes;
    /**
     * Count irreversible decisions
     */
    private countIrreversibleDecisions;
    /**
     * Calculate solution complexity
     */
    private calculateSolutionComplexity;
    /**
     * Identify refactor opportunities
     */
    private identifyRefactorOpportunities;
    /**
     * Find repeated patterns
     */
    private findRepeatedPatterns;
    /**
     * Get barriers monitored by this sensor
     */
    getMonitoredBarriers(): Barrier[];
}
//# sourceMappingURL=technicalDebtAnalyzer.d.ts.map