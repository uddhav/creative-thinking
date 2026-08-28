/**
 * ErgodicityResultAdapter - Handles complex type transformations for ergodicity results
 * Extracted from ErgodicityOrchestrator to improve maintainability
 */
import type { PathMemory } from '../../ergodicity/types.js';
export interface ErgodicityManagerResult {
    event: {
        technique: string;
        step: number;
        timestamp: string;
        decision: string;
        reversibilityCost: number;
    };
    metrics: {
        pathDivergence: number;
        commitmentDepth?: number;
        optionVelocity?: number;
    };
    warnings: Array<{
        metric?: string;
        message: string;
        level: string;
    }>;
    earlyWarningState?: {
        activeWarnings: Array<{
            sensor?: string;
            message: string;
            severity: string;
            timestamp: string;
        }>;
        overallRisk?: string;
    };
    escapeRecommendation?: {
        name: string;
        description: string;
        steps: string[];
        level: number;
    };
    escapeVelocityNeeded?: boolean;
}
export interface ErgodicityResult {
    event: {
        type: string;
        timestamp: number;
        technique: string;
        step: number;
        reversibilityCost: number;
        description: string;
    };
    metrics: {
        currentFlexibility: number;
        pathDivergence: number;
        constraintLevel: number;
        /** Absent when nothing measured it — only SCAMPER reports options. */
        optionSpaceSize?: number;
    };
    warnings: Array<{
        type: string;
        message: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    earlyWarningState?: {
        activeWarnings: Array<{
            type: string;
            message: string;
            severity: string;
            timestamp: number;
        }>;
        overallSeverity: string;
    };
    escapeRecommendation?: {
        name: string;
        description: string;
        steps: string[];
        urgency: 'low' | 'medium' | 'high' | 'immediate';
    };
    escapeVelocityNeeded?: boolean;
}
export declare class ErgodicityResultAdapter {
    /**
     * Adapt ergodicity manager result to the expected interface
     */
    adapt(managerResult: ErgodicityManagerResult, currentFlexibility: number, pathMemory?: PathMemory): ErgodicityResult;
    /**
     * Adapt event data
     */
    private adaptEvent;
    /**
     * Adapt metrics data
     *
     * `constraintLevel` used to add two different clocks together and treat a
     * missing reading as a middling one:
     *
     *     Math.min(1, (metrics.commitmentDepth || 0.5) + constraints.length * 0.05)
     *
     * `commitmentDepth` is a mean over the last five steps — a state a session
     * can leave — while `constraints.length` counts every constraint since step 1
     * and only grows, so the sum answered no single question about any moment.
     * Worse, the two count the same steps: `createConstraint` fires on
     * `commitmentLevel > 0.5`, which is exactly what `commitmentDepth` averages,
     * so a committing step was charged twice — the same double charge the
     * flexibility score shed when its own constraint penalty came off. And the
     * `|| 0.5` turned a depth of 0, a session that has committed to nothing, into
     * a reading halfway to fully constrained; 0 is a measurement, not a gap.
     *
     * One clock, the five-step window, and zero meaning zero.
     */
    private adaptMetrics;
    /**
     * Adapt warnings with severity mapping
     */
    private adaptWarnings;
    /**
     * Adapt early warning state
     */
    private adaptEarlyWarningState;
    /**
     * Adapt escape recommendation
     */
    private adaptEscapeRecommendation;
    /**
     * Map severity levels
     */
    private mapSeverity;
    /**
     * Map severity string (for early warning state)
     */
    private mapSeverityString;
    /**
     * Map urgency levels based on numeric level
     */
    private mapUrgency;
}
//# sourceMappingURL=ErgodicityResultAdapter.d.ts.map