/**
 * Type definitions for metrics and session data
 */

export interface SessionMetrics {
  flexibilityScore: number;
  optionsGenerated: number;
  viableOptions: number;
  discardedOptions: number;
  optionQuality: number;
  pathDependencies: string[];
  irreversibleDecisions: string[];
  lockedDecisions: string[];
  startTime: number;
  completed: boolean;
  history?: number[];
}

export interface MetricsHistoryEntry {
  timestamp: number;
  flexibilityScore: number;
  optionsGenerated: number;
  pathDependencies: number;
}

export interface TechniqueUsageStats {
  technique: string;
  count: number;
  percentage: string;
}

export interface GlobalMetrics {
  totalSessions: number;
  totalIdeasGenerated: number;
  averageFlexibilityScore: number;
  techniqueUsage: Record<string, number>;
}

export interface ErgodicityMetrics {
  isErgodic: boolean;
  pathDependencies: number;
  absorbingBarriers: string[];
  irreversibleDecisions: string[];
  timeAverage: number;
  ensembleAverage: number;
}

export interface FlexibilityMetrics {
  score: number;
  level: 'High' | 'Medium' | 'Low' | 'Critical';
  trend: 'Improving' | 'Declining' | 'Stable' | 'Insufficient data';
  recommendations: string[];
}

export interface Warning {
  type: 'flexibility' | 'path_dependency' | 'options';
  severity: 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
}

export interface OptionsMetrics {
  totalGenerated: number;
  viableOptions: number;
  discardedOptions: number;
  averageQuality: number;
  generationRate: string;
}

export interface SessionState extends SessionMetrics {
  id: string;
  planId?: string;
  currentTechnique?: string;
  currentStep?: number;
  metrics?: SessionMetrics;
}
