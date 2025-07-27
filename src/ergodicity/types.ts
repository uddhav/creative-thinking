/**
 * Core types for ergodicity awareness and path dependency tracking
 */

import type { LateralTechnique } from '../index.js';

/**
 * Represents a constraint created by a past decision that limits future options
 */
export interface Constraint {
  id: string;
  type:
    | 'technical'
    | 'resource'
    | 'cognitive'
    | 'relational'
    | 'market'
    | 'regulatory'
    | 'creative';
  description: string;
  createdAt: string;
  createdBy: PathEvent;
  strength: number; // 0.0-1.0, how strongly it constrains
  affectedOptions: string[]; // Options that are no longer available
  reversibilityCost: number; // Cost to reverse this constraint (0 = easy, 1 = impossible)
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
  reversibilityCost: number; // 0.0-1.0, where 1.0 is irreversible
  commitmentLevel: number; // 0.0-1.0, how much this commits future paths
  constraintsCreated: string[]; // IDs of constraints created by this event
  flexibilityImpact?: number; // Impact on overall flexibility
}

/**
 * Types of absorbing barriers in creative/critical thinking
 */
export type BarrierType = 'creative' | 'critical';

/**
 * Specific barrier categories
 */
export type CreativeBarrier =
  | 'reputational_ruin'
  | 'resource_depletion'
  | 'cognitive_lock_in'
  | 'relationship_loss'
  | 'market_foreclosure'
  | 'technical_debt'
  | 'brand_association';

export type CriticalBarrier =
  | 'analysis_paralysis'
  | 'cynicism'
  | 'over_optimization'
  | 'trust_destruction'
  | 'perfectionism'
  | 'risk_aversion'
  | 'defensive_rigidity';

/**
 * Represents an absorbing barrier - a state from which no recovery is possible
 */
export interface Barrier {
  id: string;
  type: BarrierType;
  subtype: CreativeBarrier | CriticalBarrier;
  name: string;
  description: string;
  proximity: number; // 0.0-1.0, where 1.0 means we've hit the barrier
  impact: 'recoverable' | 'difficult' | 'irreversible';
  warningThreshold: number; // Proximity level that triggers warnings
  avoidanceStrategies: string[];
  indicators: string[]; // Signs that we're approaching this barrier
}

/**
 * Metrics for measuring path flexibility and ergodicity
 */
export interface FlexibilityMetrics {
  flexibilityScore: number; // 0.0-1.0, measure of remaining options
  reversibilityIndex: number; // % of decisions that can be undone
  pathDivergence: number; // How far from initial state (0.0+)
  barrierProximity: BarrierProximity[];
  optionVelocity: number; // Rate of option creation vs. destruction
  commitmentDepth: number; // Average commitment level of decisions
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
  distance: number; // 0.0-1.0, where 0.0 is at the barrier
  approachRate: number; // How fast we're moving toward it
  estimatedTimeToImpact?: number; // In thinking steps
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
  criticalDecisions: PathEvent[]; // High commitment/low reversibility decisions
  escapeRoutes: EscapeRoute[]; // Potential ways to regain flexibility
}

/**
 * Represents a potential escape route from current constraints
 */
export interface EscapeRoute {
  id: string;
  name: string;
  description: string;
  feasibility: number; // 0.0-1.0
  cost: number; // Resource/effort required
  flexibilityGain: number; // How much flexibility this would restore
  requiredActions: string[];
  risks: string[];
}

/**
 * Warning levels for ergodicity awareness
 */
export enum ErgodicityWarningLevel {
  INFO = 'info', // > 0.6 flexibility
  CAUTION = 'caution', // 0.4-0.6 flexibility
  WARNING = 'warning', // 0.2-0.4 flexibility
  CRITICAL = 'critical', // < 0.2 flexibility
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
