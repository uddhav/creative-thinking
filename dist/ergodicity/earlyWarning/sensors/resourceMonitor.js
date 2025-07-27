/**
 * Resource Monitor - Tracks depletion of time, energy, and material resources
 */
import { Sensor } from './base.js';
export class ResourceMonitor extends Sensor {
    constructor(calibration) {
        super('resource', calibration);
    }
    /**
     * Calculate resource depletion level
     */
    getRawReading(pathMemory, sessionData) {
        return Promise.resolve(this.getRawReadingSync(pathMemory, sessionData));
    }
    getRawReadingSync(pathMemory, sessionData) {
        const metrics = this.calculateResourceMetrics(pathMemory, sessionData);
        // Weighted combination of different resource factors
        const weights = {
            energy: 0.3,
            time: 0.25,
            budget: 0.25,
            efficiency: 0.2,
        };
        // Calculate depletion scores (0 = full resources, 1 = depleted)
        const energyDepletion = 1 - metrics.energyLevel;
        const timeDepletion = this.calculateTimeDepletion(pathMemory, sessionData);
        const budgetDepletion = this.calculateBudgetDepletion(metrics);
        const efficiencyDepletion = 1 - metrics.efficiency;
        // Weighted average
        const overallDepletion = energyDepletion * weights.energy +
            timeDepletion * weights.time +
            budgetDepletion * weights.budget +
            efficiencyDepletion * weights.efficiency;
        // Apply context factors
        const contextAdjusted = this.applyContextFactors(overallDepletion, pathMemory);
        return Math.min(1, Math.max(0, contextAdjusted));
    }
    /**
     * Detect specific resource depletion indicators
     */
    detectIndicators(pathMemory, sessionData) {
        return Promise.resolve(this.detectIndicatorsSync(pathMemory, sessionData));
    }
    detectIndicatorsSync(pathMemory, sessionData) {
        const indicators = [];
        const metrics = this.calculateResourceMetrics(pathMemory, sessionData);
        // Energy indicators
        if (metrics.energyLevel < 0.3) {
            indicators.push('Low energy levels detected');
        }
        if (this.detectEnergyDrainPattern(pathMemory)) {
            indicators.push('Rapid energy drain pattern');
        }
        // Time indicators
        const stepsPerHour = this.calculateStepRate(sessionData);
        if (stepsPerHour < 2) {
            indicators.push('Slow progress rate');
        }
        if (pathMemory.pathHistory.length > 50) {
            indicators.push('Extended session duration');
        }
        // Efficiency indicators
        if (metrics.efficiency < 0.5) {
            indicators.push('Low solution efficiency');
        }
        if (metrics.burnRate > 1.5) {
            indicators.push('High resource burn rate');
        }
        // Repetition indicators
        const repetitionRate = this.calculateRepetitionRate(pathMemory);
        if (repetitionRate > 0.3) {
            indicators.push('High repetition in approaches');
        }
        // Reserve indicators
        if (metrics.reserves < 0.2) {
            indicators.push('Low resource reserves');
        }
        return indicators;
    }
    /**
     * Gather resource-specific context
     */
    gatherContext(pathMemory, sessionData) {
        return Promise.resolve(this.gatherContextSync(pathMemory, sessionData));
    }
    gatherContextSync(pathMemory, sessionData) {
        const metrics = this.calculateResourceMetrics(pathMemory, sessionData);
        return {
            resourceMetrics: metrics,
            sessionDuration: this.calculateSessionDuration(sessionData),
            stepCount: pathMemory.pathHistory.length,
            averageStepTime: this.calculateAverageStepTime(sessionData),
            wastedEffort: this.calculateWastedEffort(pathMemory),
            resourceTrend: this.calculateResourceTrend(),
        };
    }
    /**
     * Calculate comprehensive resource metrics
     */
    calculateResourceMetrics(pathMemory, sessionData) {
        // Energy level based on decision quality degradation
        const energyLevel = this.calculateEnergyLevel(pathMemory);
        // Burn rate based on resource consumption speed
        const burnRate = this.calculateBurnRate(pathMemory, sessionData);
        // Efficiency based on progress vs effort
        const efficiency = this.calculateEfficiency(pathMemory);
        // Reserves based on remaining flexibility
        const reserves = pathMemory.currentFlexibility.flexibilityScore;
        return {
            energyLevel,
            burnRate,
            efficiency,
            reserves,
            timeRemaining: this.estimateTimeRemaining(burnRate, energyLevel),
            budgetRemaining: this.estimateBudgetRemaining(pathMemory),
        };
    }
    /**
     * Calculate current energy level from decision patterns
     */
    calculateEnergyLevel(pathMemory) {
        if (pathMemory.pathHistory.length === 0) {
            return 1.0;
        }
        // Recent decisions
        const recentDecisions = pathMemory.pathHistory.slice(-10);
        // Indicators of energy depletion
        let energyDrain = 0;
        // Check for declining decision quality
        const commitmentLevels = recentDecisions.map(d => d.commitmentLevel);
        const avgCommitment = commitmentLevels.reduce((a, b) => a + b, 0) / commitmentLevels.length;
        if (avgCommitment > 0.7) {
            energyDrain += 0.2; // High commitment when tired is risky
        }
        // Check for reduced option generation
        const optionGeneration = recentDecisions.map(d => d.optionsOpened.length);
        const avgOptions = optionGeneration.reduce((a, b) => a + b, 0) / optionGeneration.length;
        if (avgOptions < 1) {
            energyDrain += 0.3; // Not generating new options
        }
        // Check for repetitive patterns (sign of fatigue)
        const techniques = recentDecisions.map(d => d.technique);
        const uniqueTechniques = new Set(techniques).size;
        if (uniqueTechniques < 3) {
            energyDrain += 0.2; // Using same techniques repeatedly
        }
        return Math.max(0, 1 - energyDrain);
    }
    /**
     * Calculate resource burn rate
     */
    calculateBurnRate(pathMemory, sessionData) {
        const sessionDuration = this.calculateSessionDuration(sessionData);
        if (sessionDuration === 0) {
            return 1.0;
        }
        // Steps per hour
        const stepsPerHour = (pathMemory.pathHistory.length / sessionDuration) * 3600000;
        // Normal rate is about 10-20 steps per hour for thoughtful work
        const normalRate = 15;
        return stepsPerHour / normalRate;
    }
    /**
     * Calculate solution efficiency
     */
    calculateEfficiency(pathMemory) {
        if (pathMemory.pathHistory.length === 0) {
            return 1.0;
        }
        // Progress indicators
        const totalOptions = pathMemory.availableOptions.length + pathMemory.foreclosedOptions.length;
        const progressRatio = pathMemory.availableOptions.length / Math.max(totalOptions, 1);
        // Wasted effort indicators
        const reversals = pathMemory.pathHistory.filter(d => d.reversibilityCost > 0.5).length;
        const reversalRatio = reversals / pathMemory.pathHistory.length;
        // Efficiency = progress with minimal waste
        const efficiency = progressRatio * (1 - reversalRatio);
        return Math.max(0, Math.min(1, efficiency));
    }
    /**
     * Calculate time depletion
     */
    calculateTimeDepletion(pathMemory, sessionData) {
        // Simple heuristic: sessions over 2 hours start showing fatigue
        const sessionHours = this.calculateSessionDuration(sessionData) / 3600000;
        if (sessionHours < 1) {
            return 0;
        }
        else if (sessionHours < 2) {
            return 0.2;
        }
        else if (sessionHours < 3) {
            return 0.5;
        }
        else {
            return 0.8;
        }
    }
    /**
     * Calculate budget depletion (simplified)
     */
    calculateBudgetDepletion(metrics) {
        // Use flexibility as proxy for remaining options/budget
        return 1 - metrics.reserves;
    }
    /**
     * Apply context-specific factors
     */
    applyContextFactors(baseReading, pathMemory) {
        let adjusted = baseReading;
        // If many critical decisions made, resources more precious
        if (pathMemory.criticalDecisions.length > 3) {
            adjusted *= 1.2;
        }
        // If approaching other barriers, resource conservation more important
        const criticalBarriers = pathMemory.currentFlexibility.barrierProximity.filter(bp => bp.distance < 0.3);
        if (criticalBarriers.length > 0) {
            adjusted *= 1.1;
        }
        return adjusted;
    }
    /**
     * Detect energy drain patterns
     */
    detectEnergyDrainPattern(pathMemory) {
        if (pathMemory.pathHistory.length < 10) {
            return false;
        }
        // Check if recent decisions show declining quality
        const recent = pathMemory.pathHistory.slice(-10);
        const older = pathMemory.pathHistory.slice(-20, -10);
        if (older.length === 0) {
            return false;
        }
        const recentOptionsPerDecision = recent.map(d => d.optionsOpened.length).reduce((a, b) => a + b, 0) / recent.length;
        const olderOptionsPerDecision = older.map(d => d.optionsOpened.length).reduce((a, b) => a + b, 0) / older.length;
        // Significant decline in option generation indicates fatigue
        return recentOptionsPerDecision < olderOptionsPerDecision * 0.5;
    }
    /**
     * Calculate step rate
     */
    calculateStepRate(sessionData) {
        const duration = this.calculateSessionDuration(sessionData);
        if (duration === 0) {
            return 0;
        }
        const steps = sessionData.history.length;
        return (steps / duration) * 3600000; // Steps per hour
    }
    /**
     * Calculate repetition rate
     */
    calculateRepetitionRate(pathMemory) {
        if (pathMemory.pathHistory.length < 5) {
            return 0;
        }
        const recentTechniques = pathMemory.pathHistory.slice(-10).map(d => d.technique);
        const totalTechniques = recentTechniques.length;
        const uniqueTechniques = new Set(recentTechniques).size;
        return 1 - uniqueTechniques / totalTechniques;
    }
    /**
     * Calculate session duration in milliseconds
     */
    calculateSessionDuration(sessionData) {
        if (!sessionData.startTime) {
            return 0;
        }
        const endTime = sessionData.endTime || Date.now();
        return endTime - sessionData.startTime;
    }
    /**
     * Calculate average step time
     */
    calculateAverageStepTime(sessionData) {
        const duration = this.calculateSessionDuration(sessionData);
        const steps = sessionData.history.length;
        if (steps === 0) {
            return 0;
        }
        return duration / steps;
    }
    /**
     * Calculate wasted effort
     */
    calculateWastedEffort(pathMemory) {
        // Count high-commitment decisions that were reversed
        const wastedDecisions = pathMemory.pathHistory.filter(d => d.commitmentLevel > 0.5 && d.optionsClosed.length > d.optionsOpened.length).length;
        return wastedDecisions / Math.max(pathMemory.pathHistory.length, 1);
    }
    /**
     * Calculate resource trend
     */
    calculateResourceTrend() {
        if (this.readingHistory.length < 3) {
            return 'stable';
        }
        const recent = this.readingHistory.slice(-3);
        const trend = recent[2].rawValue - recent[0].rawValue;
        if (trend > 0.1) {
            return 'declining';
        }
        else if (trend < -0.1) {
            return 'improving';
        }
        else {
            return 'stable';
        }
    }
    /**
     * Estimate time remaining
     */
    estimateTimeRemaining(burnRate, energyLevel) {
        if (burnRate === 0) {
            return undefined;
        }
        // Simple model: energy / burn rate = time units remaining
        return energyLevel / burnRate;
    }
    /**
     * Estimate budget remaining (simplified)
     */
    estimateBudgetRemaining(pathMemory) {
        // Use flexibility as proxy
        return pathMemory.currentFlexibility.flexibilityScore * 100; // Percentage
    }
    /**
     * Get barriers monitored by this sensor
     */
    getMonitoredBarriers() {
        // This sensor primarily monitors resource_depletion
        return [
            {
                id: 'resource_depletion_barrier',
                type: 'creative',
                subtype: 'resource_depletion',
                name: 'Resource Depletion',
                description: 'Exhaustion of time, energy, or material resources',
                proximity: 0,
                impact: 'irreversible',
                warningThreshold: 0.3,
                indicators: [
                    'Increasing time per decision',
                    'Declining quality of outputs',
                    'Skipping important steps',
                    'Rushed conclusions',
                ],
                avoidanceStrategies: [
                    'Set strict time boxes',
                    'Prioritize high-impact decisions',
                    'Delegate or defer non-critical items',
                    'Build in recovery periods',
                ],
            },
        ];
    }
}
//# sourceMappingURL=resourceMonitor.js.map