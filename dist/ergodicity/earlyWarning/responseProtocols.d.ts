/**
 * Response Protocols for Absorbing Barrier Early Warning System
 * Implements escape and mitigation strategies
 */
import type { EscapeProtocol, EscapeResponse, BarrierWarning } from './types.js';
import type { PathMemory } from '../types.js';
import type { SessionData } from '../../index.js';
export declare class ResponseProtocolSystem {
    private protocolHistory;
    /**
     * Get all available response protocols
     */
    getAvailableProtocols(): EscapeProtocol[];
    /**
     * Level 1: Pattern Interruption Protocol
     */
    private getPatternInterruptionProtocol;
    /**
     * Level 2: Resource Reallocation Protocol
     */
    private getResourceReallocationProtocol;
    /**
     * Level 3: Stakeholder Reset Protocol
     */
    private getStakeholderResetProtocol;
    /**
     * Level 4: Technical Refactoring Protocol
     */
    private getTechnicalRefactoringProtocol;
    /**
     * Level 5: Strategic Pivot Protocol
     */
    private getStrategicPivotProtocol;
    /**
     * Execute an escape protocol
     */
    executeProtocol(protocol: EscapeProtocol, pathMemory: PathMemory, sessionData: SessionData, userConfirmation?: boolean): Promise<EscapeResponse>;
    /**
     * Generate side effects from protocol execution
     */
    private generateSideEffects;
    /**
     * Generate next steps after protocol execution
     */
    private generateNextSteps;
    /**
     * Generate new constraints from protocol
     */
    private generateNewConstraints;
    /**
     * Recommend protocol based on warning
     */
    recommendProtocol(warning: BarrierWarning, pathMemory: PathMemory): EscapeProtocol | null;
    /**
     * Get protocol execution history
     */
    getProtocolHistory(): EscapeResponse[];
    /**
     * Calculate protocol success rate
     */
    getProtocolSuccessRate(): Map<number, number>;
    /**
     * Get emergency response plan
     */
    getEmergencyResponsePlan(warnings: BarrierWarning[], pathMemory: PathMemory): {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
}
//# sourceMappingURL=responseProtocols.d.ts.map