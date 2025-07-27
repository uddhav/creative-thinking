/**
 * Main export for escape velocity protocols
 */
export * from './types.js';
export * from './protocols.js';
export * from './calculator.js';
import type { EscapeContext, EscapeAnalysis, EscapeAttemptResult, EscapeMonitoring } from './types.js';
import { EscapeLevel } from './types.js';
/**
 * Main escape velocity system
 */
export declare class EscapeVelocitySystem {
    private calculator;
    private protocolFactory;
    private monitoring;
    /**
     * Analyze escape requirements
     */
    analyzeEscapeNeeds(context: EscapeContext): EscapeAnalysis;
    /**
     * Get available protocols based on current flexibility
     */
    getAvailableProtocols(currentFlexibility: number): import("./types.js").EscapeProtocol[];
    /**
     * Execute escape protocol
     */
    executeProtocol(level: EscapeLevel, context: EscapeContext): EscapeAttemptResult;
    /**
     * Get recommended protocol based on current state
     */
    recommendProtocol(currentFlexibility: number, constraintStrength: number): import("./types.js").EscapeProtocol | null;
    /**
     * Check if escape is needed
     */
    isEscapeNeeded(flexibility: number): boolean;
    /**
     * Get escape urgency level
     */
    getEscapeUrgency(flexibility: number): 'critical' | 'high' | 'medium' | 'low';
    /**
     * Get monitoring data
     */
    getMonitoringData(): EscapeMonitoring;
    /**
     * Update monitoring with attempt result
     */
    private updateMonitoring;
    /**
     * Reset monitoring data
     */
    resetMonitoring(): void;
}
//# sourceMappingURL=index.d.ts.map