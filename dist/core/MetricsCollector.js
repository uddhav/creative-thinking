/**
 * Metrics Collector
 * Handles metrics tracking and analysis for sessions
 */
export class MetricsCollector {
    /**
     * Update session metrics based on new input.
     *
     * Callers invoke this AFTER pushing the current step onto `session.history`,
     * so a whole-session recomputation here already accounts for the step being
     * recorded. That is why `outputCompleteness` is derived from the session
     * rather than accumulated per call.
     */
    updateMetrics(session, input) {
        if (!session.metrics) {
            session.metrics = {
                outputCompleteness: 0,
                risksCaught: 0,
                antifragileFeatures: 0,
            };
        }
        // Update risks caught
        if (input.risks && input.risks.length > 0) {
            session.metrics.risksCaught = (session.metrics.risksCaught || 0) + input.risks.length;
        }
        // Update antifragile features
        if (input.antifragileProperties && input.antifragileProperties.length > 0) {
            session.metrics.antifragileFeatures =
                (session.metrics.antifragileFeatures || 0) + input.antifragileProperties.length;
        }
        // Recompute last: it reads risksCaught / antifragileFeatures updated above.
        session.metrics.outputCompleteness = this.calculateOutputCompleteness(session);
        return session.metrics;
    }
    /**
     * Count risks identified in the session
     */
    countRisks(risks) {
        return risks.length;
    }
    /**
     * Count antifragile properties
     */
    countAntifragileFeatures(properties) {
        return properties.length;
    }
    /**
     * Get detailed metrics for a session
     */
    getDetailedMetrics(session) {
        const basicMetrics = session.metrics || {
            outputCompleteness: 0,
            risksCaught: 0,
            antifragileFeatures: 0,
        };
        const revisionsCount = session.history.filter(h => h.isRevision).length;
        const branchesCount = Object.keys(session.branches).length;
        const insightsGenerated = session.insights.length;
        // Calculate completion time if available
        let completionTime;
        if (session.startTime && session.endTime) {
            completionTime = session.endTime - session.startTime;
        }
        // Get flexibility score from path memory if available
        let flexibilityScore;
        let constraintsIdentified;
        if (session.pathMemory) {
            flexibilityScore = session.pathMemory.currentFlexibility.flexibilityScore;
            constraintsIdentified = session.pathMemory.constraints.length;
        }
        // Check if escape plan was generated
        const escapePlanGenerated = session.escapeRecommendation !== undefined;
        // How fully the session's outputs were populated (coverage, not quality).
        // Recomputed rather than read off session.metrics so sessions restored from
        // disk before this field existed still report a value instead of undefined.
        const outputCompleteness = this.calculateOutputCompleteness(session);
        return {
            ...basicMetrics,
            totalSteps: session.history.length,
            revisionsCount,
            branchesCount,
            insightsGenerated,
            flexibilityScore,
            constraintsIdentified,
            escapePlanGenerated,
            completionTime,
            outputCompleteness,
        };
    }
    /**
     * How completely a session populated the outputs its techniques ask for.
     * Returns 0-1.
     *
     * This measures VOLUME and COVERAGE, not quality: it counts insights per
     * step and whether risk/antifragile fields were filled in. It cannot tell a
     * sharp insight from a padded one, so it must not be read as evidence that
     * the thinking was good — only that the session was filled in.
     *
     * This replaced a `creativityScore` that was
     * `min(lexicalDiversity * log(words+1) * 0.1, 0.2)` accumulated per step.
     * That measured vocabulary variety and verbosity — not creativity — and was
     * rendered as `X/10` on a scale it could not reach (a 7-step session topped
     * out near 1.4). Coverage of the fields a technique asks for is at least a
     * claim the data supports.
     *
     * A previous `revisionRate` factor scored sessions DOWN for containing
     * revisions. That penalised the exact behaviour this tool exists to
     * encourage — structured reconsideration — so it has been removed rather
     * than reweighted, and the remaining factors carry its weight.
     */
    /**
     * Recompute the derived completeness metric from the session as it stands.
     *
     * Separate from `updateMetrics` because the counters it reads and the
     * insights it counts are written at different points in a step: risks and
     * antifragile features arrive with the input, but insights are extracted
     * later, while the response is being built. Computed once with the counters,
     * the metric always reported the previous step's insight count — a completed
     * three-insight session read 0.67 where it should read 0.8.
     *
     * `updateMetrics` cannot simply be called again: it increments the risk and
     * antifragile counters, so a second call would double them.
     */
    refreshOutputCompleteness(session) {
        if (!session.metrics) {
            return 0;
        }
        session.metrics.outputCompleteness = this.calculateOutputCompleteness(session);
        return session.metrics.outputCompleteness;
    }
    calculateOutputCompleteness(session) {
        const factors = {
            insightsPerStep: session.insights.length / Math.max(session.history.length, 1),
            risksIdentified: (session.metrics?.risksCaught || 0) > 0 ? 1 : 0,
            antifragileFeatures: (session.metrics?.antifragileFeatures || 0) > 0 ? 1 : 0,
            completed: session.endTime !== undefined ? 1 : 0,
        };
        // Weight the factors (sums to 1.0)
        const score = factors.insightsPerStep * 0.4 +
            factors.risksIdentified * 0.2 +
            factors.antifragileFeatures * 0.2 +
            factors.completed * 0.2;
        // insightsPerStep is unbounded, so clamp rather than trust the weights.
        return Math.min(score, 1);
    }
    /**
     * Generate metrics summary for display
     */
    generateMetricsSummary(metrics) {
        const summary = [];
        summary.push(`Total Steps: ${metrics.totalSteps}`);
        summary.push(`Insights Generated: ${metrics.insightsGenerated}`);
        if (metrics.risksCaught && metrics.risksCaught > 0) {
            summary.push(`Risks Identified: ${metrics.risksCaught}`);
        }
        if (metrics.antifragileFeatures && metrics.antifragileFeatures > 0) {
            summary.push(`Antifragile Features: ${metrics.antifragileFeatures}`);
        }
        if (metrics.revisionsCount > 0) {
            summary.push(`Revisions Made: ${metrics.revisionsCount}`);
        }
        if (metrics.flexibilityScore !== undefined) {
            summary.push(`Flexibility Score: ${(metrics.flexibilityScore * 100).toFixed(0)}%`);
        }
        if (metrics.completionTime !== undefined) {
            const minutes = Math.floor(metrics.completionTime / 60000);
            const seconds = Math.floor((metrics.completionTime % 60000) / 1000);
            summary.push(`Completion Time: ${minutes}m ${seconds}s`);
        }
        if (metrics.outputCompleteness !== undefined) {
            // 0-1 fraction, shown as a percentage so it is not mistaken for a rating.
            summary.push(`Output Completeness: ${(metrics.outputCompleteness * 100).toFixed(0)}%`);
        }
        return summary;
    }
    /**
     * Compare two sessions' metrics
     */
    compareMetrics(session1, session2) {
        const comparison = {};
        // Calculate percentage differences
        if (session1.risksCaught !== undefined && session2.risksCaught !== undefined) {
            const base = Math.max(session1.risksCaught, 1);
            comparison.risksCaughtDiff = ((session2.risksCaught - session1.risksCaught) / base) * 100;
        }
        if (session1.insightsGenerated && session2.insightsGenerated) {
            comparison.insightsGeneratedDiff =
                ((session2.insightsGenerated - session1.insightsGenerated) / session1.insightsGenerated) *
                    100;
        }
        if (session1.outputCompleteness !== undefined && session2.outputCompleteness !== undefined) {
            comparison.effectivenessDiff =
                ((session2.outputCompleteness - session1.outputCompleteness) /
                    session1.outputCompleteness) *
                    100;
        }
        return comparison;
    }
    /**
     * Aggregate metrics across multiple sessions
     */
    aggregateMetrics(sessions) {
        if (sessions.length === 0) {
            return {
                totalSessions: 0,
                averageMetrics: {
                    totalSteps: 0,
                    revisionsCount: 0,
                    branchesCount: 0,
                    insightsGenerated: 0,
                },
                techniqueDistribution: {},
                successRate: 0,
            };
        }
        // Collect all metrics
        const allMetrics = sessions.map(s => this.getDetailedMetrics(s));
        // Calculate averages
        const averageMetrics = {
            totalSteps: 0,
            revisionsCount: 0,
            branchesCount: 0,
            insightsGenerated: 0,
            risksCaught: 0,
            antifragileFeatures: 0,
        };
        let flexibilityTotal = 0;
        let flexibilityCount = 0;
        let completenessTotal = 0;
        let completenessCount = 0;
        allMetrics.forEach(m => {
            averageMetrics.totalSteps += m.totalSteps;
            averageMetrics.revisionsCount += m.revisionsCount;
            averageMetrics.branchesCount += m.branchesCount;
            averageMetrics.insightsGenerated += m.insightsGenerated;
            // These are initialized to 0 above, so they're always defined
            if (averageMetrics.risksCaught !== undefined) {
                averageMetrics.risksCaught += m.risksCaught || 0;
            }
            if (averageMetrics.antifragileFeatures !== undefined) {
                averageMetrics.antifragileFeatures += m.antifragileFeatures || 0;
            }
            if (m.flexibilityScore !== undefined) {
                flexibilityTotal += m.flexibilityScore;
                flexibilityCount++;
            }
            if (m.outputCompleteness !== undefined) {
                completenessTotal += m.outputCompleteness;
                completenessCount++;
            }
        });
        // Calculate averages
        const count = sessions.length;
        averageMetrics.totalSteps /= count;
        averageMetrics.revisionsCount /= count;
        averageMetrics.branchesCount /= count;
        averageMetrics.insightsGenerated /= count;
        // These are initialized to 0 above, so they're always defined
        if (averageMetrics.risksCaught !== undefined) {
            averageMetrics.risksCaught /= count;
        }
        if (averageMetrics.antifragileFeatures !== undefined) {
            averageMetrics.antifragileFeatures /= count;
        }
        if (flexibilityCount > 0) {
            averageMetrics.flexibilityScore = flexibilityTotal / flexibilityCount;
        }
        if (completenessCount > 0) {
            averageMetrics.outputCompleteness = completenessTotal / completenessCount;
        }
        // Calculate technique distribution
        const techniqueDistribution = {};
        sessions.forEach(s => {
            techniqueDistribution[s.technique] = (techniqueDistribution[s.technique] || 0) + 1;
        });
        // Calculate success rate (sessions that were completed)
        const completedSessions = sessions.filter(s => s.endTime !== undefined).length;
        const successRate = (completedSessions / count) * 100;
        return {
            totalSessions: count,
            averageMetrics,
            techniqueDistribution,
            successRate,
        };
    }
}
//# sourceMappingURL=MetricsCollector.js.map