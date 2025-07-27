/**
 * Five-level escape protocol implementations
 */
import { EscapeLevel } from './types.js';
import type { EscapeProtocol, EscapeContext, EscapeAttemptResult } from './types.js';
/**
 * Level 1: Pattern Interruption
 * Quick, low-cost interventions to break thinking patterns
 */
export declare class PatternInterruptionProtocol implements EscapeProtocol {
    level: EscapeLevel;
    name: string;
    description: string;
    requiredFlexibility: number;
    estimatedFlexibilityGain: number;
    successProbability: number;
    executionTime: string;
    automaticTrigger: boolean;
    steps: string[];
    risks: string[];
    execute(context: EscapeContext): EscapeAttemptResult;
}
/**
 * Level 2: Resource Reallocation
 * Shift resources to create new paths
 */
export declare class ResourceReallocationProtocol implements EscapeProtocol {
    level: EscapeLevel;
    name: string;
    description: string;
    requiredFlexibility: number;
    estimatedFlexibilityGain: number;
    successProbability: number;
    executionTime: string;
    automaticTrigger: boolean;
    steps: string[];
    risks: string[];
    execute(context: EscapeContext): EscapeAttemptResult;
}
/**
 * Level 3: Stakeholder Reset
 * Renegotiate commitments and expectations
 */
export declare class StakeholderResetProtocol implements EscapeProtocol {
    level: EscapeLevel;
    name: string;
    description: string;
    requiredFlexibility: number;
    estimatedFlexibilityGain: number;
    successProbability: number;
    executionTime: string;
    automaticTrigger: boolean;
    steps: string[];
    risks: string[];
    execute(context: EscapeContext): EscapeAttemptResult;
}
/**
 * Level 4: Technical Refactoring
 * Deep architectural changes to restore flexibility
 */
export declare class TechnicalRefactoringProtocol implements EscapeProtocol {
    level: EscapeLevel;
    name: string;
    description: string;
    requiredFlexibility: number;
    estimatedFlexibilityGain: number;
    successProbability: number;
    executionTime: string;
    automaticTrigger: boolean;
    steps: string[];
    risks: string[];
    execute(context: EscapeContext): EscapeAttemptResult;
}
/**
 * Level 5: Strategic Pivot
 * Fundamental direction change
 */
export declare class StrategicPivotProtocol implements EscapeProtocol {
    level: EscapeLevel;
    name: string;
    description: string;
    requiredFlexibility: number;
    estimatedFlexibilityGain: number;
    successProbability: number;
    executionTime: string;
    automaticTrigger: boolean;
    steps: string[];
    risks: string[];
    execute(context: EscapeContext): EscapeAttemptResult;
}
/**
 * Factory for creating escape protocols
 */
export declare class EscapeProtocolFactory {
    private protocols;
    constructor();
    getProtocol(level: EscapeLevel): EscapeProtocol | undefined;
    getAllProtocols(): EscapeProtocol[];
    getAvailableProtocols(currentFlexibility: number): EscapeProtocol[];
    recommendProtocol(currentFlexibility: number, constraintStrength: number): EscapeProtocol | null;
}
//# sourceMappingURL=protocols.d.ts.map