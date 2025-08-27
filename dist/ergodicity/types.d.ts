/**
 * Core types for ergodicity awareness and path dependency tracking
 */
import type { LateralTechnique } from '../index.js';
/**
 * Represents a constraint created by a past decision that limits future options
 */
export interface Constraint {
    id: string;
    type: 'technical' | 'resource' | 'cognitive' | 'relational' | 'market' | 'regulatory' | 'creative' | 'strategic' | 'behavioral' | 'perceptual' | 'observational';
    description: string;
    createdAt: string;
    createdBy: PathEvent;
    strength: number;
    affectedOptions: string[];
    reversibilityCost: number;
}
/**
 * Represents a decision or action that creates path dependencies
 */
export interface PathEvent {
    id?: string;
    timestamp: string;
    technique: LateralTechnique;
    step: number;
    decision: string;
    optionsOpened: string[];
    optionsClosed: string[];
    reversibilityCost: number;
    commitmentLevel: number;
    constraintsCreated: string[];
    flexibilityImpact?: number;
}
/**
 * Types of absorbing barriers in creative/critical thinking
 */
export type BarrierType = 'creative' | 'critical';
/**
 * Specific barrier categories
 */
export type CreativeBarrier = 'reputational_ruin' | 'resource_depletion' | 'cognitive_lock_in' | 'relationship_loss' | 'market_foreclosure' | 'technical_debt' | 'brand_association';
export type CriticalBarrier = 'analysis_paralysis' | 'cynicism' | 'over_optimization' | 'trust_destruction' | 'perfectionism' | 'risk_aversion' | 'defensive_rigidity';
/**
 * Represents an absorbing barrier - a state from which no recovery is possible
 */
export interface Barrier {
    id: string;
    type: BarrierType;
    subtype: CreativeBarrier | CriticalBarrier;
    name: string;
    description: string;
    proximity: number;
    impact: 'recoverable' | 'difficult' | 'irreversible';
    warningThreshold: number;
    avoidanceStrategies: string[];
    indicators: string[];
}
/**
 * Metrics for measuring path flexibility and ergodicity
 */
export interface FlexibilityMetrics {
    flexibilityScore: number;
    reversibilityIndex: number;
    pathDivergence: number;
    barrierProximity: BarrierProximity[];
    optionVelocity: number;
    commitmentDepth: number;
}
/**
 * Current flexibility state (alias for FlexibilityMetrics)
 */
export type FlexibilityState = FlexibilityMetrics;
/**
 * Proximity to a specific barrier
 */
export interface BarrierProximity {
    barrier: Barrier;
    distance: number;
    approachRate: number;
    estimatedTimeToImpact?: number;
}
/**
 * Complete path memory for a thinking session
 */
export interface PathMemory {
    constraints: Constraint[];
    pathHistory: PathEvent[];
    foreclosedOptions: string[];
    availableOptions: string[];
    currentFlexibility: FlexibilityMetrics;
    absorbingBarriers: Barrier[];
    criticalDecisions: PathEvent[];
    escapeRoutes: EscapeRoute[];
}
/**
 * Represents a potential escape route from current constraints
 */
export interface EscapeRoute {
    id: string;
    name: string;
    description: string;
    feasibility: number;
    cost: number;
    flexibilityGain: number;
    requiredActions: string[];
    risks: string[];
}
/**
 * Warning levels for ergodicity awareness
 */
export declare enum ErgodicityWarningLevel {
    INFO = "info",// > 0.6 flexibility
    CAUTION = "caution",// 0.4-0.6 flexibility
    WARNING = "warning",// 0.2-0.4 flexibility
    CRITICAL = "critical"
}
/**
 * Ergodicity warning with context
 */
export interface ErgodicityWarning {
    level: ErgodicityWarningLevel;
    message: string;
    metric: keyof FlexibilityMetrics;
    value: number;
    threshold: number;
    recommendations: string[];
}
//# sourceMappingURL=types.d.ts.map