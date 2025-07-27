/**
 * Types for the Escape Velocity Protocol System
 */
import type { SessionData } from '../../index.js';
import type { PathMemory, FlexibilityState } from '../types.js';
/**
 * Five levels of escape protocols
 */
export declare enum EscapeLevel {
    PATTERN_INTERRUPTION = 1,
    RESOURCE_REALLOCATION = 2,
    STAKEHOLDER_RESET = 3,
    TECHNICAL_REFACTORING = 4,
    STRATEGIC_PIVOT = 5
}
/**
 * Base escape protocol interface
 */
export interface EscapeProtocol {
    level: EscapeLevel;
    name: string;
    description: string;
    requiredFlexibility: number;
    estimatedFlexibilityGain: number;
    successProbability: number;
    steps: string[];
    risks: string[];
    executionTime: string;
    automaticTrigger: boolean;
    execute(context: EscapeContext): EscapeAttemptResult;
}
/**
 * Escape velocity analysis result
 */
export interface EscapeAnalysis {
    currentFlexibility: number;
    constraintStrength: number;
    escapeForceNeeded: number;
    availableResources: number;
    feasibility: boolean;
    resourceGap: number;
    optimalTrajectory: EscapeTrajectory;
    successProbability: number;
    executionPlan: EscapeExecutionPlan;
    warnings: string[];
}
/**
 * Trajectory for escaping constraints
 */
export interface EscapeTrajectory {
    protocol: EscapeProtocol;
    phases: EscapePhase[];
    totalDuration: string;
    criticalPath: string[];
    dependencies: string[];
}
/**
 * Phase in escape execution
 */
export interface EscapePhase {
    name: string;
    actions: string[];
    duration: string;
    requiredResources: string[];
    successCriteria: string[];
    rollbackPlan: string;
}
/**
 * Execution plan for escape
 */
export interface EscapeExecutionPlan {
    immediateActions: string[];
    shortTermActions: string[];
    mediumTermActions: string[];
    monitoringPlan: string[];
    successMetrics: string[];
    contingencyPlans: Map<string, string[]>;
}
/**
 * Escape attempt result
 */
export interface EscapeAttemptResult {
    protocol: EscapeProtocol;
    success: boolean;
    flexibilityBefore: number;
    flexibilityAfter: number;
    flexibilityGained: number;
    constraintsRemoved: string[];
    newOptionsCreated: string[];
    executionNotes: string[];
    timestamp: string;
    duration: number;
}
/**
 * Escape execution context
 */
export interface EscapeContext {
    pathMemory: PathMemory;
    sessionData: SessionData;
    currentFlexibility: FlexibilityState;
    triggerReason: string;
    userApproval: boolean;
    automaticMode: boolean;
}
/**
 * Resource inventory for escape
 */
export interface ResourceInventory {
    timeAvailable: number;
    attentionBudget: number;
    socialCapital: number;
    technicalCapacity: number;
    financialResources: number;
    organizationalSupport: number;
}
/**
 * Constraint analysis
 */
export interface ConstraintAnalysis {
    constraints: ConstraintItem[];
    totalStrength: number;
    dominantConstraint: ConstraintItem;
    interactionEffects: number;
    breakabilityScore: number;
}
/**
 * Individual constraint
 */
export interface ConstraintItem {
    id: string;
    type: 'technical' | 'social' | 'financial' | 'cognitive' | 'organizational';
    name: string;
    strength: number;
    flexibility: number;
    breakCost: number;
    dependencies: string[];
}
/**
 * Escape monitoring data
 */
export interface EscapeMonitoring {
    attemptCount: number;
    successCount: number;
    averageFlexibilityGain: number;
    mostEffectiveProtocol: EscapeLevel;
    commonFailureReasons: string[];
    learnings: string[];
}
//# sourceMappingURL=types.d.ts.map