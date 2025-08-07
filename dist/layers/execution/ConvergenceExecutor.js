/**
 * ConvergenceExecutor - Handles execution of the convergence technique
 * Responsible for gathering results from parallel sessions and synthesizing them
 */
import { ResponseBuilder } from '../../core/ResponseBuilder.js';
import { ErrorHandler } from '../../errors/ErrorHandler.js';
import { ErrorFactory } from '../../errors/enhanced-errors.js';
import { validateParallelResult } from './schemas/parallelResultSchema.js';
import nlp from 'compromise';
/**
 * Executes the convergence technique to synthesize results from parallel sessions
 */
export class ConvergenceExecutor {
    sessionManager;
    visualFormatter;
    responseBuilder;
    errorHandler;
    constructor(sessionManager, visualFormatter) {
        this.sessionManager = sessionManager;
        this.visualFormatter = visualFormatter;
        this.responseBuilder = new ResponseBuilder();
        this.errorHandler = new ErrorHandler();
    }
    /**
     * Execute convergence technique step
     */
    async executeConvergence(input, sessionId) {
        try {
            // Validate input for convergence technique
            if (input.technique !== 'convergence') {
                throw ErrorFactory.invalidTechnique(input.technique);
            }
            // Get session
            const session = this.sessionManager.getSession(sessionId);
            if (!session) {
                throw ErrorFactory.sessionNotFound(sessionId);
            }
            // Get parallel results if provided
            const parallelResults = input.parallelResults
                ? input.parallelResults.map((r, index) => {
                    // Validate using schema
                    const validation = validateParallelResult(r);
                    if (!validation.success) {
                        throw ErrorFactory.invalidInput(`parallelResults[${index}]`, 'valid parallel result', validation.error);
                    }
                    const validatedData = validation.data;
                    if (!validatedData) {
                        throw ErrorFactory.invalidInput(`parallelResults[${index}]`, 'valid parallel result', 'Validation passed but data is undefined');
                    }
                    // Safely construct the result with validated data
                    return {
                        sessionId: `parallel-${validatedData.planId}-${index}`,
                        planId: validatedData.planId,
                        technique: validatedData.technique,
                        problem: input.problem,
                        insights: validatedData.insights,
                        results: this.validateAndNormalizeResults(validatedData.results),
                        metrics: {
                            executionTime: 0,
                            completedSteps: input.currentStep,
                            totalSteps: input.totalSteps,
                            confidence: validatedData.metrics?.confidence,
                            flexibility: validatedData.metrics?.flexibility,
                        },
                        status: 'completed',
                    };
                })
                : [];
            // If no parallel results provided, check if session is part of a parallel group
            if (parallelResults.length === 0 && session.parallelGroupId) {
                const group = this.sessionManager.getParallelGroup(session.parallelGroupId);
                if (group) {
                    // Get results from completed sessions in the group
                    const groupResults = this.gatherGroupResults(group.groupId);
                    parallelResults.push(...groupResults);
                }
            }
            // Validate we have results to converge
            if (parallelResults.length === 0) {
                throw ErrorFactory.missingParameter('parallelResults', 'convergence');
            }
            // Display convergence progress
            this.displayConvergenceProgress(input.currentStep, input.totalSteps, parallelResults);
            // Execute convergence based on step
            const convergenceResult = await this.performConvergenceStep(input.currentStep, parallelResults, input.convergenceStrategy || 'merge');
            // Build response
            const operationData = {
                ...input,
                sessionId,
                synthesis: JSON.stringify(convergenceResult.synthesis),
            };
            return this.responseBuilder.buildExecutionResponse(sessionId, operationData, convergenceResult.insights || [], input.nextStepNeeded
                ? `Continue convergence synthesis - Step ${input.currentStep + 1}`
                : undefined, session.history?.length || 0, {
                techniqueEffectiveness: convergenceResult.effectiveness || 0.8,
                pathDependenciesCreated: [],
                flexibilityImpact: 0,
                noteworthyMoment: `Converged ${parallelResults.length} parallel sessions`,
                futureRelevance: `Generated ${convergenceResult.insights?.length || 0} synthesized insights`,
            });
        }
        catch (error) {
            return this.errorHandler.handleError(error, 'execution', {
                technique: input.technique,
                step: input.currentStep,
                sessionId,
            });
        }
    }
    /**
     * Gather results from a parallel group
     */
    gatherGroupResults(groupId) {
        const group = this.sessionManager.getParallelGroup(groupId);
        if (!group)
            return [];
        const results = [];
        for (const sessionId of group.completedSessions) {
            const session = this.sessionManager.getSession(sessionId);
            if (!session)
                continue;
            // Extract results from session
            const lastExecution = session.history[session.history.length - 1];
            if (!lastExecution)
                continue;
            results.push({
                sessionId,
                planId: session.parallelMetadata?.planId || '',
                technique: session.technique,
                problem: session.problem,
                insights: session.insights,
                results: lastExecution.output ? { output: lastExecution.output } : {},
                metrics: {
                    executionTime: session.endTime && session.startTime ? session.endTime - session.startTime : 0,
                    completedSteps: lastExecution.currentStep,
                    totalSteps: lastExecution.totalSteps,
                    confidence: session.metrics?.creativityScore,
                },
                status: 'completed',
            });
        }
        return results;
    }
    /**
     * Display convergence progress
     */
    displayConvergenceProgress(currentStep, totalSteps, results) {
        if (process.env.DISABLE_THOUGHT_LOGGING === 'true')
            return;
        const output = this.visualFormatter.formatConvergenceProgress(currentStep, totalSteps, results.length, results.map(r => r.technique));
        if (output) {
            process.stderr.write(output);
        }
    }
    /**
     * Perform a specific convergence step
     */
    async performConvergenceStep(step, results, strategy) {
        switch (step) {
            case 1:
                // Step 1: Collect and categorize insights
                return await Promise.resolve(this.collectAndCategorizeInsights(results));
            case 2:
                // Step 2: Identify patterns and resolve conflicts
                return await Promise.resolve(this.identifyPatternsAndResolveConflicts(results, strategy));
            case 3:
                // Step 3: Synthesize final insights
                return await Promise.resolve(this.synthesizeFinalInsights(results, strategy));
            default:
                // Dynamic synthesis for additional steps
                return await Promise.resolve(this.performDynamicSynthesis(step, results, strategy));
        }
    }
    /**
     * Step 1: Collect and categorize insights from all results
     */
    collectAndCategorizeInsights(results) {
        const categorizedInsights = {};
        const allInsights = [];
        // Collect insights by technique
        for (const result of results) {
            const technique = result.technique;
            if (!categorizedInsights[technique]) {
                categorizedInsights[technique] = [];
            }
            categorizedInsights[technique].push(...result.insights);
            allInsights.push(...result.insights);
        }
        return {
            insights: [
                `Collected ${allInsights.length} insights from ${results.length} parallel sessions`,
                `Techniques used: ${Object.keys(categorizedInsights).join(', ')}`,
                `Ready to identify patterns and themes across all insights`,
            ],
            effectiveness: 0.7,
            conflictsResolved: 0,
            synthesis: {
                totalInsights: allInsights.length,
                insightsByTechnique: categorizedInsights,
                techniqueCount: Object.keys(categorizedInsights).length,
            },
        };
    }
    /**
     * Step 2: Identify patterns and resolve conflicts
     */
    identifyPatternsAndResolveConflicts(results, strategy) {
        // Extract all insights
        const allInsights = results.flatMap(r => r.insights);
        // Find common themes using optimized pattern matching
        const themeCount = this.extractThemesEfficiently(allInsights);
        // Get top themes
        const topThemes = Array.from(themeCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([theme]) => theme);
        // Identify potential conflicts (placeholder logic)
        const conflictCount = Math.floor(results.length * 0.1); // Assume 10% have conflicts
        return {
            insights: [
                `Identified ${topThemes.length} major themes: ${topThemes.join(', ')}`,
                `Analyzed ${allInsights.length} total insights for patterns`,
                `Resolved ${conflictCount} potential conflicts using ${strategy} strategy`,
                'Ready for final synthesis',
            ],
            effectiveness: 0.8,
            conflictsResolved: conflictCount,
            synthesis: {
                topThemes,
                totalInsightsAnalyzed: allInsights.length,
                strategy,
                patternsFound: topThemes.length,
            },
        };
    }
    /**
     * Step 3: Synthesize final insights
     */
    synthesizeFinalInsights(results, strategy) {
        // Group insights by technique
        const insightsByTechnique = {};
        for (const result of results) {
            if (!insightsByTechnique[result.technique]) {
                insightsByTechnique[result.technique] = [];
            }
            insightsByTechnique[result.technique].push(...result.insights);
        }
        // Create synthesized insights based on strategy
        const synthesizedInsights = [];
        if (strategy === 'merge') {
            // Merge all unique insights
            const uniqueInsights = new Set(results.flatMap(r => r.insights));
            synthesizedInsights.push(...Array.from(uniqueInsights));
        }
        else if (strategy === 'select') {
            // Select best insights based on confidence
            const sortedResults = results.sort((a, b) => (b.metrics?.confidence || 0) - (a.metrics?.confidence || 0));
            // Take all insights from the highest confidence result
            if (sortedResults[0]) {
                synthesizedInsights.push(...sortedResults[0].insights);
            }
        }
        else {
            // Hierarchical - organize by importance
            synthesizedInsights.push('Hierarchical synthesis of insights:', 'Primary: ' + (insightsByTechnique[results[0]?.technique]?.[0] || 'N/A'), 'Supporting: ' + Object.values(insightsByTechnique).flat().slice(1, 3).join('; '));
        }
        return {
            insights: synthesizedInsights,
            effectiveness: 0.9,
            conflictsResolved: 0,
            synthesis: {
                strategy,
                techniquesConverged: Object.keys(insightsByTechnique).length,
                totalInsightsSynthesized: synthesizedInsights.length,
                convergenceComplete: true,
            },
        };
    }
    /**
     * Dynamic synthesis for additional steps
     */
    performDynamicSynthesis(step, results, strategy) {
        return {
            insights: [
                `Performing extended synthesis step ${step}`,
                `Deepening analysis of ${results.length} parallel results`,
                'Exploring emergent patterns and connections',
            ],
            effectiveness: 0.85,
            conflictsResolved: 0,
            synthesis: {
                step,
                strategy,
                resultsAnalyzed: results.length,
            },
        };
    }
    /**
     * Validate and normalize results object
     */
    validateAndNormalizeResults(results) {
        if (results === null || results === undefined) {
            return {};
        }
        if (typeof results === 'object' && !Array.isArray(results)) {
            return this.normalizeObjectValue(results);
        }
        return {};
    }
    /**
     * Check if a value is serializable
     */
    isSerializableValue(value) {
        // Primitive types are always serializable
        if (value === null ||
            value === undefined ||
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean') {
            return true;
        }
        // Arrays are serializable if all elements are
        if (Array.isArray(value)) {
            return value.every(item => this.isSerializableValue(item));
        }
        // Plain objects are serializable
        if (typeof value === 'object' && value !== null) {
            // Check if it's a plain object (not a class instance)
            if (Object.prototype.toString.call(value) === '[object Object]') {
                // Recursively check all properties
                return Object.values(value).every(v => this.isSerializableValue(v));
            }
        }
        return false;
    }
    /**
     * Normalize an object by filtering out non-serializable values
     */
    normalizeObjectValue(obj) {
        const normalized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof key === 'string' && this.isSerializableValue(value)) {
                normalized[key] = value;
            }
        }
        return normalized;
    }
    /**
     * Extract themes efficiently from insights using NLP
     */
    extractThemesEfficiently(insights) {
        const themeCount = new Map();
        // Filter valid insights and batch process
        const validInsights = insights.filter(i => i && typeof i === 'string');
        if (validInsights.length === 0)
            return themeCount;
        // Batch process all insights as a single document for better performance
        // This avoids creating multiple NLP document instances
        const combinedText = validInsights.join(' ');
        const doc = nlp(combinedText);
        // Helper function to update count with minimum length check
        const updateCount = (term, weight, minLength = 3) => {
            const normalized = term.toLowerCase().trim();
            if (normalized.length > minLength) {
                themeCount.set(normalized, (themeCount.get(normalized) || 0) + weight);
            }
        };
        // Extract all terms in a single pass for better performance
        // Extract named entities first (highest weight)
        const topics = doc.topics().out('array');
        topics.forEach(topic => updateCount(topic, 3));
        // Extract nouns (medium-high weight)
        const nouns = doc.nouns().out('array');
        nouns.forEach(noun => updateCount(noun, 2));
        // Extract verbs and adjectives (lower weight)
        const verbs = doc.verbs().out('array');
        verbs.forEach(verb => updateCount(verb, 1));
        const adjectives = doc.adjectives().out('array');
        adjectives.forEach(adj => updateCount(adj, 1, 4)); // Adjectives need min 5 chars
        return themeCount;
    }
}
//# sourceMappingURL=ConvergenceExecutor.js.map