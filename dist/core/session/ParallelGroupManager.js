/**
 * ParallelGroupManager - Manages the lifecycle of parallel session groups
 * Handles group creation, status tracking, and completion management
 */
import { randomUUID } from 'crypto';
import { ErrorFactory } from '../../errors/enhanced-errors.js';
/**
 * Manages parallel session groups and their lifecycle
 */
export class ParallelGroupManager {
    parallelGroups = new Map();
    sessionIndex;
    parallelContext;
    constructor(sessionIndex) {
        this.sessionIndex = sessionIndex;
    }
    /**
     * Set the parallel execution context for metrics and monitoring
     */
    setParallelContext(context) {
        this.parallelContext = context;
    }
    /**
     * Create a new parallel session group
     */
    createParallelSessionGroup(problem, plans, convergenceOptions, sessions = new Map()) {
        if (!plans || plans.length === 0) {
            throw new Error('Cannot create group with no plans');
        }
        const groupId = `group_${randomUUID()}`;
        const sessionIds = [];
        // Create sessions for each plan
        for (const plan of plans) {
            const sessionId = this.createParallelSession(plan, groupId, problem, sessions);
            sessionIds.push(sessionId);
        }
        // Create group metadata
        const metadata = {
            totalPlans: plans.length,
            totalSteps: plans.reduce((sum, p) => sum + (p.metadata?.totalSteps || 0), 0),
            techniques: this.extractUniqueTechniques(plans),
            startTime: Date.now(),
            estimatedCompletion: this.estimateGroupCompletion(plans),
        };
        // Create the group
        const group = {
            groupId,
            sessionIds,
            parentProblem: problem,
            executionMode: 'parallel',
            status: 'active',
            convergenceOptions,
            startTime: Date.now(),
            completedSessions: new Set(),
            metadata,
        };
        // Store and index the group
        this.parallelGroups.set(groupId, group);
        this.sessionIndex.indexGroup(group);
        // Start metrics tracking if parallel context is available
        if (this.parallelContext) {
            const metrics = this.parallelContext.getExecutionMetrics();
            // Extract strategy from convergence options if available
            const metricsOptions = convergenceOptions?.convergencePlan?.metadata?.synthesisStrategy
                ? { strategy: convergenceOptions.convergencePlan.metadata.synthesisStrategy }
                : undefined;
            metrics.startGroup(groupId, sessionIds.length, metricsOptions);
        }
        return { groupId, sessionIds };
    }
    /**
     * Create a parallel session from a plan
     */
    createParallelSession(plan, groupId, problem, sessions) {
        const sessionId = `session_${randomUUID()}`;
        // Create parallel metadata
        const parallelMetadata = {
            planId: plan.planId,
            techniques: plan.techniques,
            canExecuteIndependently: plan.canExecuteIndependently,
        };
        // Create session data
        const sessionData = {
            technique: plan.techniques[0], // Primary technique
            problem: plan.problem || problem,
            history: [],
            branches: {},
            insights: [],
            lastActivityTime: Date.now(),
            startTime: Date.now(),
            // Parallel execution fields
            parallelGroupId: groupId,
            isConvergenceSession: plan.techniques.includes('convergence'),
            dependsOn: plan.dependencies,
            parallelMetadata,
        };
        // Store the session
        sessions.set(sessionId, sessionData);
        this.sessionIndex.indexSession(sessionId, sessionData);
        // Set up dependency tracking
        if (plan.dependencies && plan.dependencies.length > 0) {
            this.sessionIndex.addDependencies(sessionId, plan.dependencies);
        }
        return sessionId;
    }
    /**
     * Mark a session as complete
     */
    markSessionComplete(sessionId, sessions) {
        const session = sessions.get(sessionId);
        if (!session) {
            throw ErrorFactory.sessionNotFound(sessionId);
        }
        // Update session index status
        this.sessionIndex.updateSessionStatus(sessionId, 'completed');
        if (session.parallelGroupId) {
            const group = this.parallelGroups.get(session.parallelGroupId);
            if (group) {
                // Add to completed sessions
                group.completedSessions.add(sessionId);
                // Check and enable dependent sessions
                this.checkAndEnableDependentSessions(sessionId, group);
                // Update group status if all sessions complete
                if (group.completedSessions.size === group.sessionIds.length) {
                    group.status = 'completed';
                    this.handleGroupCompletion(group);
                }
            }
        }
        // Update session status
        session.endTime = Date.now();
    }
    /**
     * Check if dependent sessions can now start
     */
    checkAndEnableDependentSessions(completedSessionId, group) {
        const dependentSessionIds = this.sessionIndex.getDependentSessions(completedSessionId);
        for (const dependentId of dependentSessionIds) {
            // Check if this dependent session belongs to the same group
            if (group.sessionIds.includes(dependentId)) {
                // Check if all dependencies are met
                if (this.sessionIndex.canSessionStart(dependentId, group.completedSessions)) {
                    // Update session status to allow execution
                    this.sessionIndex.updateSessionStatus(dependentId, 'active');
                    // Notify that session can start (would trigger execution in practice)
                    console.error(`[ParallelGroupManager] Session ${dependentId} can now start`);
                }
            }
        }
    }
    /**
     * Handle group completion
     */
    handleGroupCompletion(group) {
        console.error(`[ParallelGroupManager] Group ${group.groupId} completed with ${group.completedSessions.size} sessions`);
        // Calculate final metrics
        const executionTime = Date.now() - group.startTime;
        console.error(`[ParallelGroupManager] Total execution time: ${executionTime}ms`);
        // Complete group in metrics if parallel context is available
        if (this.parallelContext) {
            const metrics = this.parallelContext.getExecutionMetrics();
            metrics.completeGroup(group.groupId);
        }
    }
    /**
     * Get parallel results for a group
     */
    getParallelResults(groupId, sessions) {
        const group = this.parallelGroups.get(groupId);
        if (!group) {
            throw new Error(`Parallel group ${groupId} not found`);
        }
        const results = [];
        for (const sessionId of group.sessionIds) {
            const session = sessions.get(sessionId);
            if (!session || session.isConvergenceSession)
                continue;
            const result = this.extractSessionResult(sessionId, session);
            results.push(result);
        }
        return results;
    }
    /**
     * Extract result from a session
     */
    extractSessionResult(sessionId, session) {
        // Get the last execution state from history
        const lastExecution = session.history[session.history.length - 1];
        const results = lastExecution?.output || {};
        return {
            sessionId,
            planId: session.parallelMetadata?.planId || '',
            technique: session.technique,
            problem: session.problem,
            insights: session.insights,
            results: typeof results === 'object' ? results : {},
            metrics: {
                executionTime: session.endTime && session.startTime ? session.endTime - session.startTime : 0,
                completedSteps: lastExecution?.currentStep || 0,
                totalSteps: lastExecution?.totalSteps || 0,
                confidence: session.metrics?.creativityScore,
                flexibility: session.pathMemory?.currentFlexibility?.flexibilityScore,
                pathDependencies: session.pathMemory?.pathHistory?.length || 0,
            },
            status: session.endTime ? 'completed' : 'partial',
        };
    }
    /**
     * Get a parallel group by ID
     */
    getGroup(groupId) {
        return this.parallelGroups.get(groupId);
    }
    /**
     * Update group status
     */
    updateGroupStatus(groupId, status) {
        const group = this.parallelGroups.get(groupId);
        if (group) {
            group.status = status;
        }
    }
    /**
     * Check if a session can start based on dependencies
     */
    canSessionStart(sessionId, groupId) {
        const group = this.parallelGroups.get(groupId);
        if (!group)
            return false;
        return this.sessionIndex.canSessionStart(sessionId, group.completedSessions);
    }
    /**
     * Get all active groups
     */
    getActiveGroups() {
        return Array.from(this.parallelGroups.values()).filter(group => group.status === 'active' || group.status === 'converging');
    }
    /**
     * Clean up completed groups older than TTL
     */
    cleanupOldGroups(ttlMs) {
        const now = Date.now();
        let cleaned = 0;
        for (const [groupId, group] of this.parallelGroups.entries()) {
            if ((group.status === 'completed' || group.status === 'failed') &&
                now - group.startTime > ttlMs) {
                this.parallelGroups.delete(groupId);
                cleaned++;
            }
        }
        return cleaned;
    }
    /**
     * Extract unique techniques from plans
     */
    extractUniqueTechniques(plans) {
        const techniques = new Set();
        for (const plan of plans) {
            for (const technique of plan.techniques) {
                techniques.add(technique);
            }
        }
        return Array.from(techniques);
    }
    /**
     * Estimate group completion time
     */
    estimateGroupCompletion(plans) {
        // In parallel execution, completion time is the max of individual times
        let maxTime = 0;
        for (const plan of plans) {
            const timeMatch = plan.estimatedTime.match(/(\d+)/);
            if (timeMatch) {
                maxTime = Math.max(maxTime, parseInt(timeMatch[1], 10));
            }
        }
        // Add some buffer for coordination overhead
        const bufferMs = maxTime * 60 * 1000 * 0.1; // 10% buffer
        return Date.now() + maxTime * 60 * 1000 + bufferMs;
    }
    /**
     * Get statistics about parallel groups
     */
    getStats() {
        let activeGroups = 0;
        let completedGroups = 0;
        let failedGroups = 0;
        let totalSessions = 0;
        let totalCompletionTime = 0;
        let completedCount = 0;
        for (const group of this.parallelGroups.values()) {
            totalSessions += group.sessionIds.length;
            switch (group.status) {
                case 'active':
                case 'converging':
                    activeGroups++;
                    break;
                case 'completed':
                    completedGroups++;
                    if (group.metadata.startTime) {
                        totalCompletionTime += Date.now() - group.metadata.startTime;
                        completedCount++;
                    }
                    break;
                case 'failed':
                    failedGroups++;
                    break;
            }
        }
        return {
            totalGroups: this.parallelGroups.size,
            activeGroups,
            completedGroups,
            failedGroups,
            averageSessionsPerGroup: this.parallelGroups.size > 0 ? totalSessions / this.parallelGroups.size : 0,
            averageCompletionTime: completedCount > 0 ? totalCompletionTime / completedCount : 0,
        };
    }
    /**
     * Clear all groups
     */
    clear() {
        this.parallelGroups.clear();
    }
}
//# sourceMappingURL=ParallelGroupManager.js.map