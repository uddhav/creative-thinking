/**
 * PartialCompletionHandler - Handles scenarios where some parallel sessions fail
 * Provides strategies for continuing with partial results or retrying critical sessions
 */
/**
 * Handles partial completion scenarios in parallel execution
 */
export class PartialCompletionHandler {
    /**
     * Handle partial completion of a parallel group
     */
    handlePartialCompletion(group, failedSessions, sessionManager) {
        const completedSessions = Array.from(group.completedSessions);
        const allSessions = group.sessionIds;
        // Categorize sessions
        const categorized = this.categorizeSessions(allSessions, completedSessions, failedSessions, sessionManager);
        // Determine strategy based on completion percentage and critical sessions
        const completionRate = completedSessions.length / allSessions.length;
        const strategy = this.determineStrategy(completionRate, categorized, group.convergenceOptions);
        // Apply strategy
        switch (strategy) {
            case 'proceed_with_available':
                return this.proceedWithAvailable(group, categorized, sessionManager);
            case 'retry_critical':
                return this.retryCriticalSessions(group, categorized, sessionManager);
            case 'fallback_convergence':
                return this.fallbackConvergence(group, categorized, sessionManager);
            case 'abort_group':
                return this.abortGroup(group, categorized, sessionManager);
            default:
                return this.defaultStrategy(group, categorized, sessionManager);
        }
    }
    /**
     * Categorize sessions by status and criticality
     */
    categorizeSessions(allSessions, completedSessions, failedSessions, sessionManager) {
        const completed = completedSessions;
        const failed = Array.from(failedSessions);
        const pending = [];
        const critical = [];
        const optional = [];
        // Categorize remaining sessions
        for (const sessionId of allSessions) {
            if (!completedSessions.includes(sessionId) && !failedSessions.has(sessionId)) {
                pending.push(sessionId);
            }
            // Determine criticality based on dependencies
            if (this.isCriticalSession(sessionId, allSessions, sessionManager)) {
                critical.push(sessionId);
            }
            else {
                optional.push(sessionId);
            }
        }
        return { completed, failed, pending, critical, optional };
    }
    /**
     * Determine if a session is critical (has many dependents)
     */
    isCriticalSession(sessionId, groupSessions, sessionManager) {
        // Get all sessions that depend on this one
        const dependents = this.getDependentSessions(sessionId, groupSessions, sessionManager);
        // Critical if more than 30% of group depends on it
        return dependents.length > groupSessions.length * 0.3;
    }
    /**
     * Get sessions that depend on a given session
     */
    getDependentSessions(sessionId, groupSessions, sessionManager) {
        const dependents = [];
        for (const otherSessionId of groupSessions) {
            if (otherSessionId === sessionId)
                continue;
            const session = sessionManager.getSession(otherSessionId);
            if (session?.dependsOn?.includes(sessionId)) {
                dependents.push(otherSessionId);
            }
        }
        return dependents;
    }
    /**
     * Determine strategy based on completion rate and criticality
     */
    determineStrategy(completionRate, categorized, convergenceOptions) {
        // If too few sessions completed, abort
        if (completionRate < 0.3) {
            return 'abort_group';
        }
        // If critical sessions failed, retry them
        const criticalFailed = categorized.critical.filter(id => categorized.failed.includes(id));
        if (criticalFailed.length > 0 && completionRate < 0.8) {
            return 'retry_critical';
        }
        // If we have enough for convergence, proceed
        const minRequired = convergenceOptions?.convergencePlan?.metadata?.minSessionsRequired ||
            Math.ceil(categorized.completed.length * 0.5);
        if (categorized.completed.length >= minRequired) {
            return 'proceed_with_available';
        }
        // Otherwise, try fallback convergence
        return 'fallback_convergence';
    }
    /**
     * Strategy: Proceed with available results
     */
    proceedWithAvailable(group, categorized, sessionManager) {
        // Update group to proceed with partial results
        sessionManager.updateParallelGroupStatus(group.groupId, 'partial_success');
        // Get available results
        const availableResults = this.getCompletedResults(categorized.completed, sessionManager);
        // Check if convergence can proceed
        const canConverge = this.canProceedWithConvergence(group, categorized.completed.length, availableResults);
        const missingTechniques = this.getMissingTechniques(group, categorized, sessionManager);
        return {
            strategy: 'proceed_with_available',
            canContinue: canConverge,
            availableResults,
            warnings: [
                `Proceeding with ${categorized.completed.length}/${group.sessionIds.length} completed sessions`,
                `Missing techniques: ${missingTechniques.join(', ')}`,
                `Failed sessions: ${categorized.failed.length}`,
            ],
            recommendations: this.generatePartialRecommendations(availableResults),
        };
    }
    /**
     * Strategy: Retry critical sessions
     */
    retryCriticalSessions(group, categorized, sessionManager) {
        const criticalFailed = categorized.critical.filter(id => categorized.failed.includes(id));
        // Get available results for context
        const availableResults = this.getCompletedResults(categorized.completed, sessionManager);
        return {
            strategy: 'retry_critical',
            canContinue: false, // Need to wait for retries
            availableResults,
            warnings: [
                `Critical sessions failed: ${criticalFailed.length}`,
                `Retrying critical sessions before proceeding`,
            ],
            recommendations: [
                'Retry failed critical sessions with adjusted parameters',
                'Consider simplifying the problem for failed techniques',
                'Monitor resource usage during retry',
            ],
            retryPlanIds: criticalFailed,
        };
    }
    /**
     * Strategy: Fallback to simplified convergence
     */
    fallbackConvergence(group, categorized, sessionManager) {
        const availableResults = this.getCompletedResults(categorized.completed, sessionManager);
        // Create a simplified convergence plan
        const fallbackPlan = {
            planId: `fallback_${group.groupId}`,
            technique: 'convergence',
            estimatedSteps: 2, // Simplified convergence
        };
        return {
            strategy: 'fallback_convergence',
            canContinue: true,
            availableResults,
            warnings: [
                `Using simplified convergence due to ${categorized.failed.length} failed sessions`,
                'Results may be less comprehensive than originally planned',
            ],
            recommendations: [
                'Focus on common themes from available results',
                'Acknowledge limitations in the synthesis',
                'Consider manual review of failed techniques',
            ],
            fallbackPlan,
        };
    }
    /**
     * Strategy: Abort the group
     */
    abortGroup(group, categorized, sessionManager) {
        sessionManager.updateParallelGroupStatus(group.groupId, 'failed');
        const availableResults = this.getCompletedResults(categorized.completed, sessionManager);
        return {
            strategy: 'abort_group',
            canContinue: false,
            availableResults,
            warnings: [
                `Aborting group execution: only ${categorized.completed.length}/${group.sessionIds.length} sessions completed`,
                'Insufficient results for meaningful synthesis',
            ],
            recommendations: [
                'Review failed sessions for common issues',
                'Consider sequential execution for problematic techniques',
                'Adjust problem statement or constraints',
            ],
        };
    }
    /**
     * Default strategy (shouldn't reach here)
     */
    defaultStrategy(group, categorized, sessionManager) {
        return this.proceedWithAvailable(group, categorized, sessionManager);
    }
    /**
     * Get completed results from sessions
     */
    getCompletedResults(completedSessionIds, sessionManager) {
        const results = [];
        for (const sessionId of completedSessionIds) {
            const session = sessionManager.getSession(sessionId);
            if (!session)
                continue;
            // Extract result from session
            const lastExecution = session.history[session.history.length - 1];
            const resultData = lastExecution?.output || {};
            results.push({
                sessionId,
                planId: session.parallelMetadata?.planId || '',
                technique: session.technique,
                problem: session.problem,
                insights: session.insights,
                results: typeof resultData === 'object' ? resultData : {},
                metrics: {
                    executionTime: session.endTime && session.startTime ? session.endTime - session.startTime : 0,
                    completedSteps: lastExecution?.currentStep || 0,
                    totalSteps: lastExecution?.totalSteps || 0,
                    confidence: session.metrics?.creativityScore,
                    flexibility: session.pathMemory?.currentFlexibility?.flexibilityScore,
                },
                status: 'completed',
            });
        }
        return results;
    }
    /**
     * Check if we can proceed with convergence
     */
    canProceedWithConvergence(group, completedCount, results) {
        // Minimum threshold for convergence
        const minThreshold = group.convergenceOptions?.convergencePlan?.metadata?.minSessionsRequired ||
            Math.ceil(group.sessionIds.length * 0.5);
        if (completedCount < minThreshold)
            return false;
        // Check if we have enough diversity
        const techniques = new Set(results.map(r => r.technique));
        const minTechniques = group.convergenceOptions?.convergencePlan?.metadata?.minTechniquesRequired || 2;
        return techniques.size >= minTechniques;
    }
    /**
     * Get missing techniques from failed/pending sessions
     */
    getMissingTechniques(group, categorized, sessionManager) {
        const missingTechniques = new Set();
        // Add techniques from failed sessions
        for (const sessionId of categorized.failed) {
            const session = sessionManager.getSession(sessionId);
            if (session) {
                missingTechniques.add(session.technique);
            }
        }
        // Add techniques from pending sessions
        for (const sessionId of categorized.pending) {
            const session = sessionManager.getSession(sessionId);
            if (session) {
                missingTechniques.add(session.technique);
            }
        }
        return Array.from(missingTechniques);
    }
    /**
     * Generate recommendations for partial results
     */
    generatePartialRecommendations(results) {
        const recommendations = [];
        // Analyze available results
        const totalInsights = results.reduce((sum, r) => sum + r.insights.length, 0);
        const avgConfidence = results.reduce((sum, r) => sum + (r.metrics?.confidence || 0), 0) / results.length;
        if (totalInsights < 10) {
            recommendations.push('Limited insights available - consider manual exploration of key themes');
        }
        if (avgConfidence < 0.5) {
            recommendations.push('Low average confidence - results should be validated carefully');
        }
        // Check for technique diversity
        const uniqueTechniques = new Set(results.map(r => r.technique));
        if (uniqueTechniques.size < 3) {
            recommendations.push('Limited technique diversity - consider additional perspectives');
        }
        // Always include these
        recommendations.push('Focus synthesis on areas with strongest consensus', 'Acknowledge gaps from missing techniques in final output');
        return recommendations;
    }
}
//# sourceMappingURL=PartialCompletionHandler.js.map