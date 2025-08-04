/**
 * ErgodicityResultAdapter - Handles complex type transformations for ergodicity results
 * Extracted from ErgodicityOrchestrator to improve maintainability
 */
export class ErgodicityResultAdapter {
    /**
     * Adapt ergodicity manager result to the expected interface
     */
    adapt(managerResult, currentFlexibility, pathMemory) {
        const result = {
            event: this.adaptEvent(managerResult.event),
            metrics: this.adaptMetrics(managerResult.metrics, currentFlexibility, pathMemory),
            warnings: this.adaptWarnings(managerResult.warnings),
            earlyWarningState: this.adaptEarlyWarningState(managerResult.earlyWarningState),
            escapeRecommendation: this.adaptEscapeRecommendation(managerResult.escapeRecommendation),
            escapeVelocityNeeded: managerResult.escapeVelocityNeeded,
        };
        return result;
    }
    /**
     * Adapt event data
     */
    adaptEvent(event) {
        return {
            type: `${event.technique}_step`,
            timestamp: Date.parse(event.timestamp),
            technique: event.technique,
            step: event.step,
            reversibilityCost: event.reversibilityCost,
            description: event.decision,
        };
    }
    /**
     * Adapt metrics data
     */
    adaptMetrics(metrics, currentFlexibility, pathMemory) {
        // Use path memory to enhance constraint level calculation
        const enhancedConstraintLevel = pathMemory
            ? Math.min(1, (metrics.commitmentDepth || 0.5) + pathMemory.constraints.length * 0.05)
            : metrics.commitmentDepth || 0.5;
        // Use path memory to adjust option space size
        const adjustedOptionSpace = pathMemory
            ? (metrics.optionVelocity || 1.0) * Math.max(0.5, 1 - pathMemory.pathHistory.length * 0.01)
            : metrics.optionVelocity || 1.0;
        return {
            currentFlexibility,
            pathDivergence: metrics.pathDivergence,
            constraintLevel: enhancedConstraintLevel,
            optionSpaceSize: adjustedOptionSpace,
        };
    }
    /**
     * Adapt warnings with severity mapping
     */
    adaptWarnings(warnings) {
        return warnings.map(warning => ({
            type: warning.metric || 'unknown',
            message: warning.message,
            severity: this.mapSeverity(warning.level),
        }));
    }
    /**
     * Adapt early warning state
     */
    adaptEarlyWarningState(earlyWarningState) {
        if (!earlyWarningState)
            return undefined;
        return {
            activeWarnings: earlyWarningState.activeWarnings.map(warning => ({
                type: warning.sensor || 'unknown',
                message: warning.message,
                severity: this.mapSeverityString(warning.severity),
                timestamp: Date.parse(warning.timestamp),
            })),
            overallSeverity: earlyWarningState.overallRisk || 'medium',
        };
    }
    /**
     * Adapt escape recommendation
     */
    adaptEscapeRecommendation(escapeRecommendation) {
        if (!escapeRecommendation)
            return undefined;
        return {
            name: escapeRecommendation.name,
            description: escapeRecommendation.description,
            steps: escapeRecommendation.steps,
            urgency: this.mapUrgency(escapeRecommendation.level),
        };
    }
    /**
     * Map severity levels
     */
    mapSeverity(level) {
        if (level === 'critical')
            return 'critical';
        if (level === 'warning')
            return 'high';
        if (level === 'caution')
            return 'medium';
        return 'low';
    }
    /**
     * Map severity string (for early warning state)
     */
    mapSeverityString(severity) {
        if (severity === 'critical')
            return 'critical';
        if (severity === 'warning')
            return 'high';
        if (severity === 'caution')
            return 'medium';
        return 'low';
    }
    /**
     * Map urgency levels based on numeric level
     */
    mapUrgency(level) {
        if (level >= 4)
            return 'immediate';
        if (level >= 3)
            return 'high';
        if (level >= 2)
            return 'medium';
        return 'low';
    }
}
//# sourceMappingURL=ErgodicityResultAdapter.js.map