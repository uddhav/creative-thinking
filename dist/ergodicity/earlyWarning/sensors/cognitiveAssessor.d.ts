/**
 * Cognitive Assessor - Monitors mental flexibility and detects cognitive lock-in
 */
import { Sensor } from './base.js';
import type { SensorCalibration } from '../types.js';
import type { PathMemory, Barrier } from '../../types.js';
import type { SessionData } from '../../../index.js';
export declare class CognitiveAssessor extends Sensor {
    constructor(calibration?: Partial<SensorCalibration>);
    /**
     * Calculate cognitive rigidity level
     */
    protected getRawReading(pathMemory: PathMemory, sessionData: SessionData): Promise<number>;
    /**
     * Detect specific cognitive rigidity indicators
     */
    protected detectIndicators(pathMemory: PathMemory, sessionData: SessionData): Promise<string[]>;
    /**
     * Gather cognitive-specific context
     */
    protected gatherContext(pathMemory: PathMemory, sessionData: SessionData): Promise<Record<string, unknown>>;
    /**
     * Calculate comprehensive cognitive metrics
     */
    private calculateCognitiveMetrics;
    /**
     * Calculate diversity of perspectives used
     */
    private calculatePerspectiveDiversity;
    /**
     * Calculate how often assumptions are challenged
     */
    private calculateAssumptionChallengeRate;
    /**
     * Calculate rate of learning and insight generation
     */
    private calculateLearningVelocity;
    /**
     * Calculate flexibility of mental models
     */
    private calculateMentalModelFlexibility;
    /**
     * Calculate creative divergence in solutions
     */
    private calculateCreativeDivergence;
    /**
     * Adjust reading based on cognitive patterns
     */
    private adjustForCognitivePatterns;
    /**
     * Detect narrowing of perspectives over time
     */
    private detectPerspectiveNarrowing;
    /**
     * Detect hardening of assumptions
     */
    private detectAssumptionHardening;
    /**
     * Detect learning plateau
     */
    private detectLearningPlateau;
    /**
     * Calculate insight densities for first and second halves of session
     */
    private calculateInsightDensities;
    /**
     * Detect framework lock-in
     */
    private detectFrameworkLockIn;
    /**
     * Detect repetitive thinking patterns
     */
    private detectRepetitiveThinking;
    /**
     * Classify decision patterns
     */
    private classifyDecisionPattern;
    /**
     * Count unique techniques used
     */
    private countUniqueTechniques;
    /**
     * Count perspective shifts
     */
    private countPerspectiveShifts;
    /**
     * Identify challenged assumptions
     */
    private identifyChallengedAssumptions;
    /**
     * Identify dominant technique
     */
    private identifyDominantTechnique;
    /**
     * Detect thinking loops
     */
    private detectThinkingLoops;
    /**
     * Estimate cognitive load
     */
    private estimateCognitiveLoad;
    /**
     * Calculate metrics improvement
     */
    private calculateMetricsImprovement;
    /**
     * Calculate approach evolution
     */
    private calculateApproachEvolution;
    /**
     * Count framework switches
     */
    private countFrameworkSwitches;
    /**
     * Calculate adaptation rate
     */
    private calculateAdaptationRate;
    /**
     * Detect technique fixation
     */
    private detectTechniqueFixation;
    /**
     * Detect circular reasoning
     */
    private detectCircularReasoning;
    /**
     * Detect confirmation bias
     */
    private detectConfirmationBias;
    /**
     * Normalize decision text for comparison
     */
    private normalizeDecision;
    /**
     * Find most common element in array
     */
    private findMostCommon;
    /**
     * Get barriers monitored by this sensor
     */
    getMonitoredBarriers(): Barrier[];
}
//# sourceMappingURL=cognitiveAssessor.d.ts.map