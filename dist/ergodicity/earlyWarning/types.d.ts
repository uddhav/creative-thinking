/**
 * Type definitions for the Absorbing Barrier Early Warning System
 */
import type { Barrier } from '../types.js';
/**
 * Warning levels for barrier proximity
 */
export declare enum BarrierWarningLevel {
    SAFE = "safe",// > 0.6 distance from barrier
    CAUTION = "caution",// 0.4-0.6 distance
    WARNING = "warning",// 0.2-0.4 distance
    CRITICAL = "critical"
}
/**
 * Types of sensors in the early warning system
 */
export type SensorType = 'resource' | 'reputation' | 'technical_debt' | 'cognitive' | 'relationship' | 'market' | 'compliance';
/**
 * Base sensor reading interface
 */
export interface SensorReading {
    sensorType: SensorType;
    timestamp: string;
    rawValue: number;
    warningLevel: BarrierWarningLevel;
    distance: number;
    approachRate: number;
    timeToImpact?: number;
    confidence: number;
    indicators: string[];
    context: Record<string, unknown>;
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
    requiredFlexibility: number;
    estimatedFlexibilityGain: number;
    steps: string[];
    risks: string[];
    successProbability: number;
}
/**
 * Sensor calibration settings
 */
export interface SensorCalibration {
    sensitivity: number;
    warningThresholds: {
        caution: number;
        warning: number;
        critical: number;
    };
    noiseFilter: number;
    historicalWeight: number;
    contextFactors: Record<string, number>;
}
/**
 * Resource monitoring specific types
 */
export interface ResourceMetrics {
    timeRemaining?: number;
    budgetRemaining?: number;
    energyLevel: number;
    burnRate: number;
    efficiency: number;
    reserves: number;
}
/**
 * Reputation tracking specific types
 */
export interface ReputationMetrics {
    trustScore: number;
    sentimentTrend: number;
    volatility: number;
    recoveryTime: number;
    stakeholderRisks: Record<string, number>;
}
/**
 * Technical debt specific types
 */
export interface TechnicalDebtMetrics {
    entropyScore: number;
    changeVelocity: number;
    modularityIndex: number;
    couplingScore: number;
    refactorCost: number;
    debtAccumulation: number;
}
/**
 * Cognitive flexibility specific types
 */
export interface CognitiveMetrics {
    perspectiveDiversity: number;
    assumptionChallengeRate: number;
    learningVelocity: number;
    mentalModelFlexibility: number;
    creativeDivergence: number;
}
/**
 * Relationship health specific types
 */
export interface RelationshipMetrics {
    collaborationIndex: number;
    conflictLevel: number;
    trustDynamics: number;
    communicationQuality: number;
    alignmentScore: number;
    resilience: number;
}
/**
 * Market position specific types
 */
export interface MarketMetrics {
    competitivePosition: number;
    innovationLead: number;
    marketShare: number;
    customerSatisfaction: number;
    adaptabilityScore: number;
    opportunityWindow: number;
}
/**
 * Compliance/regulatory specific types
 */
export interface ComplianceMetrics {
    complianceScore: number;
    riskExposure: number;
    auditReadiness: number;
    policyAlignment: number;
    ethicalScore: number;
    legalVulnerability: number;
}
/**
 * Aggregate early warning state
 */
export interface EarlyWarningState {
    overallRisk: BarrierWarningLevel;
    activeWarnings: BarrierWarning[];
    sensorReadings: Map<SensorType, SensorReading>;
    compoundRisk: boolean;
    criticalBarriers: Barrier[];
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
    onError?: (error: Error, context: {
        sensor?: SensorType;
        operation: string;
    }) => void;
}
/**
 * Sensor error with context
 */
export interface SensorError extends Error {
    sensor: SensorType;
    operation: string;
    recoverable: boolean;
}
//# sourceMappingURL=types.d.ts.map