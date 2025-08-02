/**
 * ErgodicityResultAdapter - Handles complex type transformations for ergodicity results
 * Extracted from ErgodicityOrchestrator to improve maintainability
 */
export class ErgodicityResultAdapter {
    /**
     * Adapt ergodicity manager result to the expected interface
     */
    adapt(managerResult, currentFlexibility, _pathMemory) {
        return {
            event: this.adaptEvent(managerResult.event),
            metrics: this.adaptMetrics(managerResult.metrics, currentFlexibility),
            warnings: this.adaptWarnings(managerResult.warnings),
            earlyWarningState: this.adaptEarlyWarningState(managerResult.earlyWarningState),
            escapeRecommendation: this.adaptEscapeRecommendation(managerResult.escapeRecommendation),
            escapeVelocityNeeded: managerResult.escapeVelocityNeeded,
        };
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
    adaptMetrics(metrics, currentFlexibility) {
        return {
            currentFlexibility,
            pathDivergence: metrics.pathDivergence,
            constraintLevel: metrics.commitmentDepth || 0.5,
            optionSpaceSize: metrics.optionVelocity || 1.0,
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