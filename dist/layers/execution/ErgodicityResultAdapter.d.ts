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
        optionSpaceSize: number;
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