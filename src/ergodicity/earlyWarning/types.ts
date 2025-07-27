/**
 * Type definitions for the Absorbing Barrier Early Warning System
 */

import type { Barrier } from '../types.js';

/**
 * Warning levels for barrier proximity
 */
export enum BarrierWarningLevel {
  SAFE = 'safe', // > 0.6 distance from barrier
  CAUTION = 'caution', // 0.4-0.6 distance
  WARNING = 'warning', // 0.2-0.4 distance
  CRITICAL = 'critical', // < 0.2 distance
}

/**
 * Types of sensors in the early warning system
 */
export type SensorType =
  | 'resource'
  | 'reputation'
  | 'technical_debt'
  | 'cognitive'
  | 'relationship'
  | 'market'
  | 'compliance';

/**
 * Base sensor reading interface
 */
export interface SensorReading {
  sensorType: SensorType;
  timestamp: string;
  rawValue: number; // 0.0-1.0 normalized reading
  warningLevel: BarrierWarningLevel;
  distance: number; // Distance to barrier (1.0 = far, 0.0 = at barrier)
  approachRate: number; // How fast approaching (-1 to 1, negative = moving away)
  timeToImpact?: number; // Estimated steps until barrier hit
  confidence: number; // Sensor confidence in reading (0.0-1.0)
  indicators: string[]; // Specific indicators detected
  context: Record<string, unknown>; // Sensor-specific context data
}

/**
 * Comprehensive warning with recommendations
 */
export interface BarrierWarning {
  id: string;
  timestamp: string;
  sensor: SensorType;
  barrier: Barrier;
  reading: SensorReading;
  severity: BarrierWarningLevel;
  message: string;
  detailedAnalysis: string;
  recommendations: string[];
  escapeProtocols: EscapeProtocol[];
  visualIndicator: string;
  requiresUserAttention: boolean;
  autoResponseTriggered: boolean;
}

/**
 * Escape protocol definition
 */
export interface EscapeProtocol {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  automaticTrigger: boolean;
  requiredFlexibility: number; // Minimum flexibility to execute
  estimatedFlexibilityGain: number;
  steps: string[];
  risks: string[];
  successProbability: number;
}

/**
 * Sensor calibration settings
 */
export interface SensorCalibration {
  sensitivity: number; // 0.0-1.0, higher = more sensitive
  warningThresholds: {
    caution: number;
    warning: number;
    critical: number;
  };
  noiseFilter: number; // Minimum change to register
  historicalWeight: number; // Weight given to historical patterns
  contextFactors: Record<string, number>; // Context-specific adjustments
}

/**
 * Resource monitoring specific types
 */
export interface ResourceMetrics {
  timeRemaining?: number; // Estimated time units left
  budgetRemaining?: number; // Financial resources left
  energyLevel: number; // Team/individual energy (0.0-1.0)
  burnRate: number; // Rate of resource consumption
  efficiency: number; // Output per resource unit
  reserves: number; // Emergency reserves available
}

/**
 * Reputation tracking specific types
 */
export interface ReputationMetrics {
  trustScore: number; // 0.0-1.0 trust level
  sentimentTrend: number; // -1.0 to 1.0 (negative to positive)
  volatility: number; // How rapidly reputation changes
  recoveryTime: number; // Estimated time to recover from damage
  stakeholderRisks: Record<string, number>; // Risk by stakeholder group
}

/**
 * Technical debt specific types
 */
export interface TechnicalDebtMetrics {
  entropyScore: number; // System disorder (0.0-1.0)
  changeVelocity: number; // Speed of changes possible
  modularityIndex: number; // How modular/flexible the solution is
  couplingScore: number; // Interdependency level
  refactorCost: number; // Estimated cost to clean up
  debtAccumulation: number; // Rate of debt increase
}

/**
 * Cognitive flexibility specific types
 */
export interface CognitiveMetrics {
  perspectiveDiversity: number; // Variety of viewpoints (0.0-1.0)
  assumptionChallengeRate: number; // How often assumptions questioned
  learningVelocity: number; // Rate of new insights
  mentalModelFlexibility: number; // Ability to shift frameworks
  creativeDivergence: number; // Variety in solutions generated
}

/**
 * Relationship health specific types
 */
export interface RelationshipMetrics {
  collaborationIndex: number; // Team collaboration level (0.0-1.0)
  conflictLevel: number; // Current conflict intensity
  trustDynamics: number; // Trust trend (-1.0 to 1.0)
  communicationQuality: number; // Communication effectiveness
  alignmentScore: number; // Goal/vision alignment
  resilience: number; // Relationship stress tolerance
}

/**
 * Market position specific types
 */
export interface MarketMetrics {
  competitivePosition: number; // Market position strength (0.0-1.0)
  innovationLead: number; // Time ahead of competition
  marketShare: number; // Current market share
  customerSatisfaction: number; // Customer happiness level
  adaptabilityScore: number; // Ability to pivot
  opportunityWindow: number; // Time remaining for opportunity
}

/**
 * Compliance/regulatory specific types
 */
export interface ComplianceMetrics {
  complianceScore: number; // Overall compliance (0.0-1.0)
  riskExposure: number; // Regulatory risk level
  auditReadiness: number; // Preparedness for audit
  policyAlignment: number; // Alignment with policies
  ethicalScore: number; // Ethical considerations
  legalVulnerability: number; // Legal risk exposure
}

/**
 * Aggregate early warning state
 */
export interface EarlyWarningState {
  overallRisk: BarrierWarningLevel;
  activeWarnings: BarrierWarning[];
  sensorReadings: Map<SensorType, SensorReading>;
  compoundRisk: boolean; // Multiple barriers approaching
  criticalBarriers: Barrier[]; // Barriers in critical range
  recommendedAction: 'continue' | 'caution' | 'pivot' | 'escape';
  escapeRoutesAvailable: EscapeProtocol[];
}

/**
 * Response to escape protocol execution
 */
export interface EscapeResponse {
  protocol: EscapeProtocol;
  executionTime: string;
  success: boolean;
  flexibilityBefore: number;
  flexibilityAfter: number;
  flexibilityGained: number;
  sideEffects: string[];
  nextSteps: string[];
  newConstraints: string[];
}

/**
 * Historical warning data for pattern analysis
 */
export interface WarningHistory {
  sessionId: string;
  warnings: BarrierWarning[];
  escapesExecuted: EscapeResponse[];
  patterns: WarningPattern[];
  learnings: string[];
}

/**
 * Detected warning patterns
 */
export interface WarningPattern {
  type: 'recurring' | 'escalating' | 'compound' | 'cyclical';
  barriers: Barrier[];
  frequency: number;
  averageTimeToBarrier: number;
  commonTriggers: string[];
  effectiveEscapes: EscapeProtocol[];
}

/**
 * Configuration for the early warning system
 */
export interface EarlyWarningConfig {
  maxHistorySize?: number;
  historyTTL?: number;
  measurementThrottleMs?: number;
  defaultCalibration?: Partial<SensorCalibration>;
  onError?: (error: Error, context: { sensor?: SensorType; operation: string }) => void;
}

/**
 * Sensor error with context
 */
export interface SensorError extends Error {
  sensor: SensorType;
  operation: string;
  recoverable: boolean;
}
