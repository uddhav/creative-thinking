/**
 * Type definitions for parallel session management
 */
import type { LateralTechnique } from './index.js';
import type { ConvergenceOptions } from './planning.js';
/**
 * Result from a single parallel execution session
 */
export interface ParallelExecutionResult {
    sessionId: string;
    planId: string;
    technique: LateralTechnique;
    problem: string;
    insights: string[];
    results: Record<string, unknown>;
    metrics?: {
        executionTime: number;
        completedSteps: number;
        totalSteps: number;
        confidence?: number;
        flexibility?: number;
        pathDependencies?: number;
    };
    status: 'completed' | 'failed' | 'partial';
    error?: string;
}
/**
 * Metadata for parallel sessions
 */
export interface ParallelMetadata {
    planId: string;
    techniques: LateralTechnique[];
    canExecuteIndependently: boolean;
}
/**
 * Extended metadata for parallel groups
 */
export interface ParallelGroupMetadata {
    totalPlans: number;
    totalSteps: number;
    techniques: LateralTechnique[];
    startTime: number;
    estimatedCompletion?: number;
}
/**
 * Shared context between parallel sessions
 */
export interface SharedContext {
    groupId: string;
    sharedInsights: string[];
    sharedThemes: Record<string, number>;
    sharedMetrics: Record<string, number>;
    lastUpdate: number;
    updateCount: number;
}
/**
 * Update to shared context
 */
export interface ContextUpdate {
    groupId: string;
    sessionId: string;
    update: ContextUpdateData;
    timestamp: number;
}
export interface ContextUpdateData {
    insights?: string[];
    themes?: Array<{
        theme: string;
        weight: number;
    }>;
    metrics?: Record<string, number>;
    type: 'immediate' | 'batched' | 'checkpoint';
}
/**
 * Progress tracking for individual sessions
 */
export interface SessionProgress {
    sessionId: string;
    totalSteps: number;
    completedSteps: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startTime?: number;
    estimatedCompletion?: number;
    lastUpdate?: number;
}
/**
 * Progress tracking for parallel groups
 */
export interface GroupProgress {
    groupId: string;
    totalSteps: number;
    completedSteps: number;
    sessionProgress: Map<string, SessionProgress>;
    startTime: number;
    estimatedCompletion?: number;
    status: 'in_progress' | 'completed' | 'failed' | 'partial_success';
}
/**
 * Summary of group progress
 */
export interface ProgressSummary {
    percentage: number;
    status: string;
    activeSessions?: number;
    completedSessions?: number;
    estimatedTimeRemaining?: number;
}
/**
 * Result of partial completion handling
 */
export interface PartialCompletionResult {
    strategy: 'proceed_with_available' | 'retry_critical' | 'fallback_convergence' | 'abort_group';
    canContinue: boolean;
    availableResults: ParallelExecutionResult[];
    warnings: string[];
    recommendations: string[];
    retryPlanIds?: string[];
    fallbackPlan?: {
        planId: string;
        technique: 'convergence';
        estimatedSteps: number;
    };
}
/**
 * Categorized sessions for partial completion
 */
export interface CategorizedSessions {
    completed: string[];
    failed: string[];
    pending: string[];
    critical: string[];
    optional: string[];
}
/**
 * Enhanced parallel session group with all required fields
 */
export interface ParallelSessionGroup {
    groupId: string;
    sessionIds: string[];
    parentProblem: string;
    executionMode: 'sequential' | 'parallel' | 'auto';
    status: 'active' | 'converging' | 'completed' | 'failed' | 'partial_success';
    convergenceOptions?: ConvergenceOptions;
    startTime: number;
    completedSessions: Set<string>;
    metadata: ParallelGroupMetadata;
}
/**
 * Persisted state for parallel sessions
 */
export interface PersistedParallelState {
    sessions: Array<{
        sessionId: string;
        data: Record<string, unknown>;
    }>;
    parallelGroups: Array<{
        groupId: string;
        group: Omit<ParallelSessionGroup, 'completedSessions'> & {
            completedSessions: string[];
        };
    }>;
    sharedContexts: Array<{
        groupId: string;
        context: Omit<SharedContext, 'sharedThemes'> & {
            sharedThemes: Array<[string, number]>;
        };
    }>;
    progressData: Array<{
        groupId: string;
        progress: Omit<GroupProgress, 'sessionProgress'> & {
            sessionProgress: Array<[string, SessionProgress]>;
        };
    }>;
}
/**
 * Index entry for fast lookups
 */
export interface IndexEntry {
    sessionId: string;
    groupId?: string;
    techniques: LateralTechnique[];
    dependencies: string[];
    status: 'pending' | 'active' | 'completed' | 'failed';
}
/**
 * Subscription for context updates
 */
export interface Subscription {
    unsubscribe: () => void;
}
//# sourceMappingURL=parallel-session.d.ts.map