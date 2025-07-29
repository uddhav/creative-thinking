/**
 * Main export for escape velocity protocols
 */
export * from './types.js';
export * from './protocols.js';
export * from './calculator.js';
import { EscapeVelocityCalculator } from './calculator.js';
import { EscapeProtocolFactory } from './protocols.js';
import { EscapeLevel } from './types.js';
/**
 * Main escape velocity system
 */
export class EscapeVelocitySystem {
    calculator = new EscapeVelocityCalculator();
    protocolFactory = new EscapeProtocolFactory();
    monitoring = {
        attemptCount: 0,
        successCount: 0,
        averageFlexibilityGain: 0,
        mostEffectiveProtocol: EscapeLevel.PATTERN_INTERRUPTION,
        commonFailureReasons: [],
        learnings: [],
    };
    /**
     * Analyze escape requirements
     */
    analyzeEscapeNeeds(context) {
        return this.calculator.calculateEscapeRequirements(context);
    }
    /**
     * Get available protocols based on current flexibility
     */
    getAvailableProtocols(currentFlexibility) {
        return this.protocolFactory.getAvailableProtocols(currentFlexibility);
    }
    /**
     * Execute escape protocol
     */
    executeProtocol(level, context) {
        const protocol = this.protocolFactory.getProtocol(level);
        if (!protocol) {
            throw new Error(`Unknown escape protocol level: ${level}`);
        }
        if (protocol.requiredFlexibility > context.currentFlexibility.flexibilityScore) {
            throw new Error(`Insufficient flexibility for ${protocol.name}. ` +
                `Required: ${protocol.requiredFlexibility}, Current: ${context.currentFlexibility.flexibilityScore}`);
        }
        // Execute the protocol
        const result = protocol.execute(context);
        // Update monitoring
        this.updateMonitoring(result);
        return result;
    }
    /**
     * Get recommended protocol based on current state
     */
    recommendProtocol(currentFlexibility, constraintStrength) {
        return this.protocolFactory.recommendProtocol(currentFlexibility, constraintStrength);
    }
    /**
     * Check if escape is needed
     */
    isEscapeNeeded(flexibility) {
        return flexibility < 0.3;
    }
    /**
     * Get escape urgency level
     */
    getEscapeUrgency(flexibility) {
        if (flexibility < 0.1)
            return 'critical';
        if (flexibility < 0.2)
            return 'high';
        if (flexibility < 0.3)
            return 'medium';
        return 'low';
    }
    /**
     * Get monitoring data
     */
    getMonitoringData() {
        return { ...this.monitoring };
    }
    /**
     * Update monitoring with attempt result
     */
    updateMonitoring(result) {
        this.monitoring.attemptCount++;
        if (result.success) {
            this.monitoring.successCount++;
        }
        // Update average flexibility gain
        const totalGain = this.monitoring.averageFlexibilityGain * (this.monitoring.attemptCount - 1) +
            result.flexibilityGained;
        this.monitoring.averageFlexibilityGain = totalGain / this.monitoring.attemptCount;
        // Track most effective protocol
        if (result.flexibilityGained > 0.3) {
            this.monitoring.mostEffectiveProtocol = result.protocol.level;
        }
        // Extract learnings
        if (result.executionNotes && result.executionNotes.length > 0) {
            this.monitoring.learnings.push(`${result.protocol.name}: ${result.executionNotes[0]}`);
        }
    }
    /**
     * Reset monitoring data
     */
    resetMonitoring() {
        this.monitoring = {
            attemptCount: 0,
            successCount: 0,
            averageFlexibilityGain: 0,
            mostEffectiveProtocol: EscapeLevel.PATTERN_INTERRUPTION,
            commonFailureReasons: [],
            learnings: [],
        };
    }
}
//# sourceMappingURL=index.js.map