/**
 * ExecutionResponseBuilder - Handles response building and enhancement
 * Extracted from executeThinkingStep to improve maintainability
 */
import { ResponseBuilder } from '../../core/ResponseBuilder.js';
import { MemoryAnalyzer } from '../../core/MemoryAnalyzer.js';
/**
 * Carry forward the flags that change what the next step should say. Without
 * this, random_entry's Rory Mode guidance was unreachable: the branch took a
 * third argument no call site supplied.
 */
function guidanceContext(input) {
    return { roryMode: input.roryMode };
}
import { RealityIntegration } from '../../reality/integration.js';
import { JsonOptimizer } from '../../utils/JsonOptimizer.js';
import { monitorCriticalSection } from '../../utils/PerformanceIntegration.js';
import { TelemetryCollector } from '../../telemetry/TelemetryCollector.js';
import { SessionCompletionTracker } from '../../core/session/SessionCompletionTracker.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
export class ExecutionResponseBuilder {
    complexityAnalyzer;
    escalationGenerator;
    techniqueRegistry;
    sessionManager;
    responseBuilder = new ResponseBuilder();
    memoryAnalyzer = new MemoryAnalyzer();
    jsonOptimizer;
    telemetry = TelemetryCollector.getInstance();
    completionTracker = new SessionCompletionTracker();
    metricsCollector = new MetricsCollector();
    constructor(complexityAnalyzer, escalationGenerator, techniqueRegistry, sessionManager) {
        this.complexityAnalyzer = complexityAnalyzer;
        this.escalationGenerator = escalationGenerator;
        this.techniqueRegistry = techniqueRegistry;
        this.sessionManager = sessionManager;
        this.jsonOptimizer = new JsonOptimizer({
            maxArrayLength: 50, // Limit array sizes for history, path memory
            maxStringLength: 800, // Reasonable string length
            maxDepth: 8, // Prevent deep nesting issues
            maxResponseSize: 512 * 1024, // 512KB limit
        });
    }
    /**
     * Build comprehensive execution response
     */
    buildResponse(input, session, sessionId, handler, techniqueLocalStep, techniqueIndex, plan, currentFlexibility, optionGenerationResult) {
        // Track technique step
        this.telemetry
            .trackTechniqueStep(sessionId, input.technique, input.currentStep, input.totalSteps, {
            techniqueStep: techniqueLocalStep,
            techniqueTotalSteps: handler.getTechniqueInfo().totalSteps,
            flexibilityScore: currentFlexibility,
            problemLength: input.problem.length,
            outputLength: input.output.length,
        })
            .catch(console.error);
        // Build core response object (not JSON) with insights and metadata
        const { responseData, currentInsights } = this.buildCoreResponseData(input, session, sessionId, handler, techniqueLocalStep, techniqueIndex, plan, currentFlexibility);
        // buildCoreResponseData is where this step's insights land in the session,
        // so the completeness metric is only current once it has returned. The
        // completion summary and the session-complete telemetry below both read it.
        this.metricsCollector.refreshOutputCompleteness(session);
        // Track insights if generated
        if (currentInsights.length > 0) {
            this.telemetry
                .trackInsight(sessionId, input.technique, currentInsights.length)
                .catch(console.error);
        }
        // Track risks if identified
        if (input.risks && input.risks.length > 0) {
            this.telemetry.trackRisk(sessionId, input.technique, input.risks.length).catch(console.error);
        }
        // Monitor memory usage periodically (every 10 steps, but not on the first step)
        if (session.history.length > 0 && session.history.length % 10 === 0 && this.sessionManager) {
            // Use type-safe public API to get reflexivity memory stats
            const memStats = this.sessionManager.getReflexivityMemoryStats();
            // Warn if memory usage is high
            const MB = 1024 * 1024;
            if (memStats.estimatedMemoryBytes > 10 * MB) {
                console.warn(`[Memory Warning] High memory usage detected: ${(memStats.estimatedMemoryBytes / MB).toFixed(2)}MB across ${memStats.sessionCount} sessions`);
            }
            // Log memory stats for monitoring (telemetry doesn't have trackMemoryUsage yet)
            // Using console.error for DEBUG logging as it's allowed by lint rules
            if (process.env.LOG_LEVEL === 'DEBUG') {
                console.error('[Memory Stats]', {
                    sessionId,
                    estimatedBytes: memStats.estimatedMemoryBytes,
                    sessionCount: memStats.sessionCount,
                    totalActions: memStats.totalActions,
                    totalConstraints: memStats.totalConstraints,
                });
            }
        }
        // Enhance response object directly (no parsing needed)
        this.enhanceWithMemoryAndProgress(responseData, input, session, sessionId, handler, techniqueLocalStep, techniqueIndex, plan);
        // Enhance with flexibility and warnings
        this.enhanceWithFlexibilityAndWarnings(responseData, currentFlexibility, input, session, sessionId);
        // Track flexibility warnings
        if (currentFlexibility < 0.4) {
            const warningLevel = currentFlexibility < 0.2 ? 'critical' : currentFlexibility < 0.3 ? 'high' : 'medium';
            this.telemetry
                .trackFlexibilityWarning(sessionId, currentFlexibility, warningLevel)
                .catch(console.error);
        }
        // Enhance with analysis and options
        this.enhanceWithAnalysisAndOptions(responseData, input, session, currentFlexibility, optionGenerationResult);
        // Track option generation if occurred
        if (optionGenerationResult && optionGenerationResult.options.length > 0) {
            this.telemetry
                .trackOptionGeneration(sessionId, optionGenerationResult.options.length, currentFlexibility)
                .catch(console.error);
        }
        // Build optimized response with single JSON stringify
        const response = this.jsonOptimizer.buildOptimizedResponse(responseData);
        // Handle session completion
        if (!input.nextStepNeeded) {
            this.handleSessionCompletion(response, session);
            // Track technique completion
            const effectiveness = this.assessOutputCompleteness(input, session, currentInsights);
            this.telemetry
                .trackTechniqueComplete(sessionId, input.technique, effectiveness, {
                insightCount: currentInsights.length,
                riskCount: input.risks?.length || 0,
                duration: Date.now() - (session.startTime || Date.now()),
                revisionCount: session.history.filter(h => h.isRevision).length,
                branchCount: Object.keys(session.branches).length,
            })
                .catch(console.error);
        }
        return response;
    }
    /**
     * Build core response data object with insights and metadata
     */
    buildCoreResponseData(input, session, sessionId, handler, techniqueLocalStep, techniqueIndex, plan, currentFlexibility) {
        // Extract insights
        const currentInsights = this.extractInsights(handler, session, input);
        // Generate next step guidance
        const nextStepGuidance = this.generateNextStepGuidance(input, session, handler, techniqueLocalStep, techniqueIndex, plan);
        // Generate execution metadata
        const executionMetadata = this.generateExecutionMetadata(input, session, currentInsights, session.pathMemory, currentFlexibility);
        // Build response data object
        const operationData = this.createOperationData(input, sessionId);
        const responseData = {
            sessionId,
            technique: operationData.technique,
            problem: operationData.problem,
            currentStep: operationData.currentStep,
            totalSteps: operationData.totalSteps,
            output: operationData.output, // Include the output field
            nextStepNeeded: operationData.nextStepNeeded,
            insights: currentInsights,
            ...this.extractTechniqueSpecificFields(operationData),
            historyLength: session.history.length,
        };
        // Add persona context if present (truncate to prevent payload bloat)
        if (input.persona) {
            responseData.persona = input.persona.slice(0, 200);
        }
        // Add optional fields
        if (nextStepGuidance) {
            responseData.nextStepGuidance = nextStepGuidance;
        }
        if (executionMetadata) {
            responseData.executionMetadata = executionMetadata;
        }
        // Add reflexivity data for ANY technique that has tracked action steps
        // Only show reflexivity data if there have been action steps
        if (this.sessionManager) {
            const reflexivityData = this.sessionManager.getSessionReflexivity(sessionId);
            // Only include reflexivity if there have been action steps (actionSteps > 0)
            if (reflexivityData && reflexivityData.summary && reflexivityData.summary.actionSteps > 0) {
                responseData.reflexivity = {
                    summary: reflexivityData.summary,
                    currentConstraints: reflexivityData.realityState?.pathsForeclosed || [],
                    activeExpectations: reflexivityData.realityState?.stakeholderExpectations || [],
                };
            }
        }
        return { responseData, currentInsights };
    }
    /**
     * Build core response with insights and metadata
     */
    buildCoreResponse(input, session, sessionId, handler, techniqueLocalStep, techniqueIndex, plan, currentFlexibility) {
        // Extract insights
        const currentInsights = this.extractInsights(handler, session, input);
        // Generate next step guidance
        const nextStepGuidance = this.generateNextStepGuidance(input, session, handler, techniqueLocalStep, techniqueIndex, plan);
        // Generate execution metadata
        const executionMetadata = this.generateExecutionMetadata(input, session, currentInsights, session.pathMemory, currentFlexibility);
        // Build base response
        const operationData = this.createOperationData(input, sessionId);
        // Enable session encoding for resilience (encode if we have a plan)
        const shouldEncodeSession = !!plan;
        const response = this.responseBuilder.buildExecutionResponse(sessionId, operationData, currentInsights, nextStepGuidance, session.history.length, executionMetadata, shouldEncodeSession, plan?.planId || input.planId);
        return { response, currentInsights };
    }
    /**
     * Enhance response with memory outputs and technique progress
     */
    enhanceWithMemoryAndProgress(parsedResponse, input, session, sessionId, handler, techniqueLocalStep, techniqueIndex, plan) {
        // Optimization: Skip or simplify memory analysis for deep revision chains
        const revisionCount = session.history.filter(h => h.isRevision).length;
        const skipMemoryAnalysis = input.isRevision && revisionCount > 30 && revisionCount % 5 !== 0;
        const memoryOutputs = skipMemoryAnalysis
            ? {} // Skip memory analysis for performance
            : this.memoryAnalyzer.generateMemoryOutputs(this.createOperationData(input, sessionId), session);
        // Build technique progress info
        const techniqueProgress = {
            techniqueStep: techniqueLocalStep,
            techniqueTotalSteps: plan?.workflow[techniqueIndex]?.steps.length || handler.getTechniqueInfo().totalSteps,
            globalStep: input.currentStep,
            globalTotalSteps: input.totalSteps,
            currentTechnique: input.technique,
            techniqueIndex: techniqueIndex + 1,
            totalTechniques: plan?.techniques.length || 1,
        };
        this.addMemoryOutputs(parsedResponse, memoryOutputs);
        this.addTechniqueProgress(parsedResponse, techniqueProgress);
        // Add completion tracking metadata
        const completionMetadata = this.completionTracker.calculateCompletionMetadata(session, plan, !input.nextStepNeeded);
        this.addCompletionMetadata(parsedResponse, completionMetadata);
    }
    /**
     * Enhance response with flexibility and warnings
     */
    enhanceWithFlexibilityAndWarnings(parsedResponse, currentFlexibility, input, session, sessionId) {
        this.addFlexibilityInfo(parsedResponse, currentFlexibility, input.alternativeSuggestions);
        this.addPathAnalysis(parsedResponse, session.pathMemory, currentFlexibility);
        this.addWarnings(parsedResponse, session, sessionId);
    }
    /**
     * Enhance response with analysis and option generation
     */
    enhanceWithAnalysisAndOptions(parsedResponse, input, session, currentFlexibility, optionGenerationResult) {
        this.addRealityAssessment(parsedResponse, input);
        this.addComplexityAnalysis(parsedResponse, input, session);
        this.addRiskAssessments(parsedResponse, input);
        this.addReflectionRequirement(parsedResponse, session, input);
        this.addOptionGeneration(parsedResponse, currentFlexibility, optionGenerationResult);
    }
    extractInsights(handler, session, input) {
        // Only this technique's own steps. Handlers label insights by position —
        // `this.steps[index]` — so in a multi-technique plan the preceding
        // technique's entries shift every label onto the wrong step and push the
        // final step off the end of the array, discarding it. A session running
        // disney_method before keeper_test reported keeper_test's "Reconstruct the
        // Fence" output under "Decide and Set the Trigger" and dropped the verdict.
        const techniqueHistory = this.ownHistory(session, input.technique);
        const currentInsights = monitorCriticalSection('extract_insights', () => handler.extractInsights(techniqueHistory), { technique: input.technique, historyLength: techniqueHistory.length });
        // Rebuild rather than append. `extractInsights` returns the technique's
        // complete current reading — one entry per step, latest wins — so a
        // revision supersedes inside the handler. Appending undid that: the
        // superseded text had already been pushed by the earlier call and nothing
        // took it back out, so a revised session reported both readings and ended
        // with more insights than it had steps.
        //
        // session.insights is a view of the history, not a log of what was said
        // along the way, so every technique in the session is re-read each step.
        session.insights = this.readInsightsFromHistory(session, currentInsights, input);
        return currentInsights;
    }
    /**
     * One technique's own entries, each presented under its technique-local step.
     *
     * Handlers key on `currentStep` so a revision supersedes the entry it
     * revises, but `currentStep` may count across the whole plan. For any
     * technique that is not first, that number falls outside the technique's own
     * step range and the step vanishes.
     */
    ownHistory(session, technique) {
        return session.history
            .filter(entry => entry.technique === technique)
            .map(entry => entry.techniqueLocalStep === undefined
            ? entry
            : { ...entry, currentStep: entry.techniqueLocalStep });
    }
    /**
     * Every technique's current reading of its own steps, in the order the
     * techniques were first used.
     */
    readInsightsFromHistory(session, currentInsights, input) {
        const seen = [];
        const techniques = [];
        for (const entry of session.history) {
            if (entry.technique && !techniques.includes(entry.technique)) {
                techniques.push(entry.technique);
            }
        }
        for (const technique of techniques) {
            const insights = technique === input.technique
                ? currentInsights
                : this.readTechniqueInsights(session, technique);
            for (const insight of insights) {
                if (!seen.includes(insight))
                    seen.push(insight);
            }
        }
        // Deliberately no carry-over of whatever was already in session.insights:
        // that is exactly the superseded text this rebuild exists to drop. Every
        // technique in the history came from this registry, so each one is re-read
        // above; one that cannot be resolved contributes nothing rather than
        // preserving a stale reading.
        return seen;
    }
    readTechniqueInsights(session, technique) {
        const handler = this.techniqueRegistry?.tryGetHandler(technique);
        if (!handler)
            return [];
        try {
            return handler.extractInsights(this.ownHistory(session, technique));
        }
        catch {
            return [];
        }
    }
    createOperationData(input, sessionId) {
        // Remove realityAssessment to avoid duplication
        const inputCopy = { ...input };
        delete inputCopy.realityAssessment;
        return {
            ...inputCopy,
            sessionId,
        };
    }
    generateNextStepGuidance(input, session, handler, techniqueLocalStep, techniqueIndex, plan) {
        if (!input.nextStepNeeded)
            return undefined;
        const nextStep = input.currentStep + 1;
        // Ensure next step is valid
        if (nextStep < 1 || nextStep > input.totalSteps) {
            // Same contract the handlers use for an out-of-range step, so callers see
            // one shape rather than two near-identical ones.
            return `Complete the ${handler.getTechniqueInfo().name} process for: "${input.problem}"`;
        }
        // No completion nag here. This function returns early unless
        // input.nextStepNeeded is true, so anything it emits fires mid-session by
        // definition — and it fired below 50% progress, i.e. on the opening steps of
        // every session, prefixing "MANDATORY: Only 14% complete" onto the guidance
        // for a step being taken exactly on plan. It was invisible because it also
        // carried a NODE_ENV/VITEST exemption, so no test could ever see it.
        //
        // Incompleteness is reported once, where it means something: on the
        // terminating step, via SessionCompletionTracker's warnings.
        // Check if we're transitioning to a new technique
        const currentTechniqueSteps = plan?.workflow[techniqueIndex]?.steps.length || handler.getTechniqueInfo().totalSteps;
        if (techniqueLocalStep >= currentTechniqueSteps) {
            // We're at the last step of current technique, next step is first step of next technique
            if (techniqueIndex + 1 < (plan?.techniques.length || 1)) {
                const nextTechnique = plan?.techniques[techniqueIndex + 1];
                if (nextTechnique) {
                    // Track workflow transition
                    this.telemetry
                        .trackWorkflowTransition(input.sessionId || '', input.technique, nextTechnique)
                        .catch(console.error);
                    // tryGetHandler, not getHandler: the fallback below is the whole point
                    // of this branch, and getHandler throws on an unknown id. With a plan
                    // naming a technique the registry does not hold, throwing here fails
                    // the *previous* technique's final step, which had already succeeded.
                    const nextHandler = this.techniqueRegistry?.tryGetHandler(nextTechnique);
                    return nextHandler
                        ? `Transitioning to ${nextTechnique}. ${nextHandler.getStepGuidance(1, input.problem, guidanceContext(input))}`
                        : `Transitioning to ${nextTechnique}`;
                }
            }
        }
        else {
            // Still in the same technique
            const nextLocalStep = techniqueLocalStep + 1;
            let guidance = handler.getStepGuidance(nextLocalStep, input.problem, guidanceContext(input));
            // Add contextual guidance for temporal_work
            if (input.technique === 'temporal_work' && nextStep === 3) {
                const step1Data = session.history.find(h => h.currentStep === 1 && h.temporalLandscape);
                if (step1Data && step1Data.temporalLandscape?.pressurePoints) {
                    const pressurePoints = step1Data.temporalLandscape.pressurePoints;
                    if (pressurePoints.length > 0) {
                        guidance = `💎 Transform time pressure into creative force. Focus on ${pressurePoints.join(', ')} as creative catalysts. How can these constraints enhance rather than limit?`;
                    }
                }
            }
            return guidance;
        }
        return undefined;
    }
    getBaseGuidance(handler, nextLocalStep, input) {
        return handler.getStepGuidance(nextLocalStep, input.problem, guidanceContext(input));
    }
    generateExecutionMetadata(input, session, insights, pathMemory, currentFlexibility) {
        const metadata = {
            stepCompleteness: this.assessOutputCompleteness(input, session, insights),
            pathDependenciesCreated: this.extractPathDependencies(input, pathMemory),
            flexibilityImpact: this.calculateFlexibilityImpact(input, session),
        };
        const noteworthyMoment = this.identifyNoteworthyMoment(input, session, insights);
        if (noteworthyMoment) {
            metadata.noteworthyMoment = noteworthyMoment;
        }
        const futureRelevance = this.assessFutureRelevance(input, session, currentFlexibility);
        if (futureRelevance) {
            metadata.futureRelevance = futureRelevance;
        }
        return metadata;
    }
    addMemoryOutputs(parsedResponse, memoryOutputs) {
        Object.assign(parsedResponse, memoryOutputs);
    }
    addTechniqueProgress(parsedResponse, techniqueProgress) {
        parsedResponse.techniqueProgress = techniqueProgress;
    }
    addCompletionMetadata(parsedResponse, completionMetadata) {
        // Add completion metadata
        parsedResponse.completionMetadata = {
            overallProgress: completionMetadata.overallProgress,
            totalPlannedSteps: completionMetadata.totalPlannedSteps,
            completedSteps: completionMetadata.completedSteps,
            techniqueStatuses: completionMetadata.techniqueStatuses.map(status => ({
                technique: status.technique,
                completionPercentage: status.completionPercentage,
                skippedSteps: status.skippedSteps,
            })),
            skippedTechniques: completionMetadata.skippedTechniques,
            missedPerspectives: completionMetadata.missedPerspectives,
            completionWarnings: completionMetadata.completionWarnings,
            minimumThresholdMet: completionMetadata.minimumThresholdMet,
        };
        // Add visual progress indicator
        if (completionMetadata.overallProgress < 0.8) {
            parsedResponse.progressDisplay =
                this.completionTracker.formatProgressDisplay(completionMetadata);
        }
    }
    addFlexibilityInfo(parsedResponse, currentFlexibility, alternativeSuggestions) {
        if (currentFlexibility < 0.7) {
            parsedResponse.flexibilityScore = currentFlexibility;
            if (currentFlexibility < 0.2) {
                parsedResponse.flexibilityMessage =
                    '⚠️ Critical: Very limited options remain. Consider immediate alternatives.';
            }
            else if (currentFlexibility < 0.4) {
                parsedResponse.flexibilityMessage =
                    '⚠️ Warning: Flexibility is low. Generate options to avoid lock-in.';
            }
            else {
                parsedResponse.flexibilityMessage =
                    '📊 Note: Flexibility decreasing. Monitor commitments carefully.';
            }
        }
        if (alternativeSuggestions && alternativeSuggestions.length > 0) {
            parsedResponse.alternativeSuggestions = alternativeSuggestions;
        }
    }
    addPathAnalysis(parsedResponse, pathMemory, currentFlexibility) {
        if (pathMemory &&
            pathMemory.currentFlexibility &&
            currentFlexibility &&
            currentFlexibility < 0.5) {
            parsedResponse.pathAnalysis = {
                flexibilityScore: pathMemory.currentFlexibility.flexibilityScore,
                reversibilityIndex: pathMemory.currentFlexibility.reversibilityIndex || currentFlexibility,
                interpretation: currentFlexibility < 0.3
                    ? 'Most decisions are now irreversible. Proceed with extreme caution.'
                    : 'Some decisions are becoming harder to reverse. Consider preserving options.',
            };
        }
    }
    addWarnings(parsedResponse, session, sessionId) {
        if (session.earlyWarningState && session.earlyWarningState.activeWarnings.length > 0) {
            parsedResponse.earlyWarningState = {
                activeWarnings: session.earlyWarningState.activeWarnings.map(w => ({
                    level: w.severity,
                    message: w.message,
                })),
                summary: `${session.earlyWarningState.activeWarnings.length} warning(s) active. Review before continuing.`,
            };
        }
        if (session.escapeRecommendation) {
            parsedResponse.escapeRecommendation = {
                protocol: session.escapeRecommendation.name,
                steps: session.escapeRecommendation.steps.slice(0, 3),
                recommendation: 'Consider these alternative approaches to regain flexibility.',
            };
        }
        // Add reflexivity warnings if available
        if (this.sessionManager && process.env.DISABLE_REFLEXIVITY_WARNINGS !== 'true') {
            try {
                // Using type guard to safely access reflexivityTracker
                const sessionManagerWithTracker = this.sessionManager;
                const reflexivityTracker = sessionManagerWithTracker.reflexivityTracker;
                if (reflexivityTracker && typeof reflexivityTracker.generateWarning === 'function') {
                    const reflexivityWarning = reflexivityTracker.generateWarning(sessionId);
                    if (reflexivityWarning) {
                        parsedResponse.reflexivityWarning = {
                            level: reflexivityWarning.level,
                            type: reflexivityWarning.type,
                            message: reflexivityWarning.message,
                            constraintCount: reflexivityWarning.currentConstraints,
                            pathsForeclosed: reflexivityWarning.pathsForeclosed.slice(0, 5), // Limit to first 5
                            suggestions: reflexivityWarning.suggestions,
                        };
                    }
                }
            }
            catch {
                // Silently ignore errors to avoid breaking response building
                // Warnings are informational only
            }
        }
    }
    addRealityAssessment(parsedResponse, input) {
        const realityResult = RealityIntegration.enhanceWithReality(input, input.output);
        if (realityResult &&
            typeof realityResult === 'object' &&
            'realityAssessment' in realityResult &&
            realityResult.realityAssessment) {
            parsedResponse.realityAssessment = realityResult.realityAssessment;
        }
    }
    addComplexityAnalysis(parsedResponse, input, session) {
        const complexityCheck = monitorCriticalSection('complexity_check', () => this.checkExecutionComplexity(input, session), { outputLength: input.output.length });
        if (complexityCheck &&
            typeof complexityCheck === 'object' &&
            'suggestion' in complexityCheck &&
            complexityCheck.suggestion) {
            parsedResponse.sequentialThinkingSuggestion = complexityCheck.suggestion;
        }
    }
    addRiskAssessments(parsedResponse, input) {
        const inputWithChecks = input;
        if (inputWithChecks.ergodicityCheck) {
            parsedResponse.ergodicityCheck = inputWithChecks.ergodicityCheck;
        }
        if (inputWithChecks.ruinAssessment) {
            parsedResponse.ruinAssessment = inputWithChecks.ruinAssessment;
        }
    }
    addReflectionRequirement(parsedResponse, session, input) {
        if (session.riskEngagementMetrics && session.riskEngagementMetrics.escalationLevel >= 2) {
            const reflectionRequirement = this.escalationGenerator.generateReflectionRequirement(session, input.currentStep);
            if (reflectionRequirement) {
                parsedResponse.reflectionRequired = reflectionRequirement;
            }
        }
    }
    addOptionGeneration(parsedResponse, currentFlexibility, optionGenerationResult) {
        if (optionGenerationResult && optionGenerationResult.options.length > 0) {
            parsedResponse.optionGeneration = {
                triggered: true,
                flexibility: currentFlexibility,
                optionsGenerated: optionGenerationResult.options.length,
                strategies: optionGenerationResult.strategiesUsed,
                topOptions: optionGenerationResult.options.slice(0, 3).map(opt => ({
                    name: opt.name,
                    description: opt.description,
                    flexibilityGain: opt.flexibilityGain,
                    recommendation: optionGenerationResult.evaluations.find(e => e.optionId === opt.id)
                        ?.recommendation,
                })),
                recommendation: optionGenerationResult.topRecommendation?.name || 'Consider implementing top options',
            };
        }
    }
    handleSessionCompletion(response, session) {
        session.endTime = Date.now();
        // Recompute once more now that endTime is set: completion is one of the
        // metric's four factors, and it is only true from this line onward. Both
        // the completion summary built below and the effectiveness reported to
        // telemetry read the stored value, so computing it before this point
        // reported every finished session as unfinished.
        this.metricsCollector.refreshOutputCompleteness(session);
        // Optimize: Parse once, modify, and use optimizer to stringify
        const responseData = JSON.parse(response.content[0].text);
        const completedData = this.responseBuilder.addCompletionData(responseData, session);
        // Use optimizer for final response
        response.content[0].text = this.jsonOptimizer.optimizeResponse(completedData);
        // Track session completion
        const sessionId = responseData.sessionId || '';
        this.telemetry
            .trackSessionComplete(sessionId, {
            duration: session.endTime - (session.startTime || Date.now()),
            insightCount: session.insights.length,
            riskCount: session.history.reduce((sum, h) => sum + (h.risks?.length || 0), 0),
            totalSteps: session.history.length,
            completedSteps: session.history.length,
            revisionCount: session.history.filter(h => h.isRevision).length,
            branchCount: Object.keys(session.branches).length,
            flexibilityScore: session.pathMemory?.currentFlexibility?.flexibilityScore,
            // effectiveness is 0-1 throughout this file (cf. assessOutputCompleteness).
            // 0.5 is the fallback for sessions persisted before outputCompleteness existed.
            effectiveness: session.metrics?.outputCompleteness ?? 0.5,
        })
            .catch(console.error);
    }
    /**
     * Extract technique-specific fields from input
     */
    extractTechniqueSpecificFields(input) {
        const fields = {};
        // Cast input to ExecuteThinkingStepInput to access all fields
        const stepInput = input;
        // Add technique-specific fields based on the technique
        switch (input.technique) {
            case 'six_hats':
                if (stepInput.hatColor)
                    fields.hatColor = stepInput.hatColor;
                break;
            case 'po':
                if (stepInput.provocation)
                    fields.provocation = stepInput.provocation;
                if (stepInput.principles)
                    fields.principles = stepInput.principles;
                break;
            case 'random_entry':
                if (stepInput.randomStimulus)
                    fields.randomStimulus = stepInput.randomStimulus;
                if (stepInput.connections)
                    fields.connections = stepInput.connections;
                break;
            case 'scamper':
                if (stepInput.scamperAction)
                    fields.scamperAction = stepInput.scamperAction;
                if (stepInput.pathImpact)
                    fields.pathImpact = stepInput.pathImpact;
                if (stepInput.alternativeSuggestions)
                    fields.alternativeSuggestions = stepInput.alternativeSuggestions;
                if (stepInput.modificationHistory)
                    fields.modificationHistory = stepInput.modificationHistory;
                break;
            case 'disney_method':
                if (stepInput.disneyRole)
                    fields.disneyRole = stepInput.disneyRole;
                break;
            case 'nine_windows':
                if (stepInput.currentCell)
                    fields.currentCell = stepInput.currentCell;
                break;
        }
        // Add common risk/adversarial fields if present
        if (stepInput.risks)
            fields.risks = stepInput.risks;
        if (stepInput.failureModes)
            fields.failureModes = stepInput.failureModes;
        if (stepInput.mitigations)
            fields.mitigations = stepInput.mitigations;
        return fields;
    }
    /**
     * How completely a step filled in the outputs its technique asks for.
     *
     * This counts whether optional fields were populated — insights, risks,
     * antifragile properties, provocation/principles. It is a COMPLETENESS
     * measure, not a quality one: four vacuous insights score higher than two
     * excellent ones, and nothing here inspects what was actually written.
     * Named accordingly so it is not mistaken for evidence that a technique
     * worked. Measuring real quality needs the guidance eval, not this.
     */
    assessOutputCompleteness(input, session, insights) {
        let completeness = 0.5; // Base: a step that produced output at all
        if (insights.length > 3)
            completeness += 0.2;
        else if (insights.length > 1)
            completeness += 0.1;
        if (input.risks && input.risks.length > 0)
            completeness += 0.1;
        if (input.antifragileProperties && input.antifragileProperties.length > 0) {
            completeness += 0.15;
        }
        if (input.provocation && input.principles)
            completeness += 0.2;
        return Math.min(1, completeness);
    }
    extractPathDependencies(input, pathMemory) {
        const dependencies = [];
        if (input.pathImpact && input.pathImpact.dependenciesCreated) {
            dependencies.push(...input.pathImpact.dependenciesCreated);
        }
        if (input.pathImpact && input.pathImpact.commitmentLevel === 'high') {
            dependencies.push(`commitment to ${input.scamperAction || input.technique} approach`);
        }
        if (pathMemory &&
            'pathHistory' in pathMemory &&
            Array.isArray(pathMemory.pathHistory) &&
            pathMemory.pathHistory.length > 0) {
            const latestEvent = pathMemory.pathHistory[pathMemory.pathHistory.length - 1];
            if ('constraintsCreated' in latestEvent &&
                Array.isArray(latestEvent.constraintsCreated) &&
                latestEvent.constraintsCreated.length > 0) {
                dependencies.push(...latestEvent.constraintsCreated);
            }
        }
        return dependencies;
    }
    calculateFlexibilityImpact(input, session) {
        // What this step cost, as the engine recorded it. SCAMPER used to report
        // `-(1 - flexibilityRetention)` here — a cumulative total published under
        // a per-step name, four to five times the actual step cost and
        // non-monotonic — while every other technique reported an unrelated
        // `-(1 - currentFlexibility) * 0.1`. Two formulas, one field name.
        const lastEvent = session.pathMemory?.pathHistory?.at(-1);
        if (lastEvent?.flexibilityImpact !== undefined) {
            // Rounded: this is a 0-1 fraction, and publishing it raw put sixteen
            // significant figures of binary residue on the wire — 0.005 serialised
            // as -0.004999999999999999.
            return Number((-lastEvent.flexibilityImpact).toFixed(4));
        }
        return -0.05;
    }
    identifyNoteworthyMoment(input, session, insights) {
        if (input.provocation && input.principles && input.principles.length >= 2) {
            return 'Provocation challenged multiple core assumptions';
        }
        if (input.technique === 'scamper' && input.scamperAction === 'parameterize') {
            return 'Parameter analysis revealed hidden coupling';
        }
        if (input.antifragileProperties && input.antifragileProperties.length >= 3) {
            return 'Multiple antifragile properties discovered';
        }
        if (insights.length > 3 && session.history.length > 5) {
            const recentInsightGrowth = insights.length / session.history.length;
            if (recentInsightGrowth > 0.5) {
                return 'High insight generation rate detected';
            }
        }
        // Temporal work: pressure transformation
        if (input.technique === 'temporal_work' &&
            input.currentStep === 3 &&
            input.pressureTransformation &&
            input.pressureTransformation.length > 0) {
            return 'Time pressure successfully transformed into creative catalyst';
        }
        // Disney method: role transitions
        if (input.technique === 'disney_method' &&
            input.disneyRole === 'realist' &&
            session.history.some(h => h.disneyRole === 'dreamer')) {
            return 'Successful transition from dreamer to realist perspective';
        }
        // Nine windows: cross-cell insights
        if (input.technique === 'nine_windows' &&
            input.currentCell &&
            session.history.length >= 3 &&
            input.interdependencies &&
            input.interdependencies.length > 2) {
            return 'Multiple system interdependencies discovered across time-space matrix';
        }
        // Temporal kairos moments
        if (input.technique === 'temporal_work' &&
            input.temporalLandscape?.kairosOpportunities &&
            input.temporalLandscape.kairosOpportunities.length > 0) {
            return 'Kairos opportunities identified';
        }
        return undefined;
    }
    assessFutureRelevance(input, session, currentFlexibility) {
        if (input.technique === 'scamper' && input.scamperAction === 'parameterize') {
            return 'This parameter coupling pattern appears in many system designs';
        }
        if (input.technique === 'triz' && input.contradiction) {
            return 'This contradiction type commonly appears in technical systems';
        }
        if (input.antifragileProperties && input.antifragileProperties.length > 0) {
            return 'These antifragile properties can be applied to other systems';
        }
        // Cross-cultural insights have broad applicability
        if (input.technique === 'cultural_integration') {
            if (input.culturalFrameworks && input.culturalFrameworks.length > 2) {
                return 'These cultural patterns provide templates for diverse problem contexts';
            }
            // Check for implementation paths
            if (input.parallelPaths && input.parallelPaths.length > 0) {
                return 'Implementation patterns can be adapted across different contexts';
            }
        }
        // Collective intelligence patterns
        if (input.technique === 'collective_intel' &&
            input.wisdomSources &&
            input.wisdomSources.length > 3) {
            return 'These collective intelligence patterns can enhance future group decisions';
        }
        // Neural state switching techniques
        if (input.technique === 'neural_state' && input.dominantNetwork === 'ecn') {
            return 'This attention management technique improves creative problem-solving capacity';
        }
        // Option generation creates reusable strategies
        // Check if we have generated options in this step (passed as parameter)
        // or if flexibility is low enough that options would have been generated
        // The second arm scanned history for a caller-typed flexibilityScore.
        // The engine's own measurement is what currentFlexibility now carries.
        const hasGeneratedOptions = currentFlexibility < 0.4 && session.history.length > 5;
        if (hasGeneratedOptions) {
            return 'The option generation strategies used here apply to many constrained situations';
        }
        return undefined;
    }
    checkExecutionComplexity(input, session) {
        const assessment = this.complexityAnalyzer.analyze(input.output);
        const recentOutputs = session.history
            .slice(-3)
            .map(h => h.output)
            .join(' ');
        const recentAssessment = this.complexityAnalyzer.analyze(recentOutputs);
        if (assessment.level === 'high' || recentAssessment.level === 'high') {
            const techniqueSpecificSuggestions = this.getComplexitySuggestions(input.technique, assessment.factors);
            return {
                level: 'high',
                suggestion: {
                    complexityNote: this.generateComplexityNote(assessment.factors, input.technique),
                    suggestedApproach: techniqueSpecificSuggestions,
                },
            };
        }
        return { level: assessment.level };
    }
    getComplexitySuggestions(technique, factors) {
        const baseSuggestions = {
            Decompose: 'Break this complex problem into 3-5 manageable sub-problems',
            Prioritize: 'Focus on the most critical aspect first, defer others',
        };
        const techniqueSpecific = {
            six_hats: {
                'Use White Hat': 'List only facts and data to clarify the situation',
                'Apply Black Hat': 'Focus on one specific risk at a time',
                'Switch to Blue': 'Step back and reorganize your thinking process',
            },
            scamper: {
                'Simplify first': 'Apply "Eliminate" to remove non-essential elements',
                'One action at a time': 'Focus on a single SCAMPER action before combining',
                Parameterize: 'Identify the key parameters driving complexity',
            },
            triz: {
                'Identify core contradiction': 'Strip away details to find the fundamental conflict',
                'Use separation principles': 'Separate in time, space, or condition',
                'Apply inventive principles': 'Try segmentation or asymmetry principles',
            },
        };
        const specific = techniqueSpecific[technique] || {};
        if (factors.includes('multipleInteractingElements')) {
            baseSuggestions['Systems diagram'] = 'Create a simple diagram showing key interactions';
        }
        if (factors.includes('conflictingRequirements')) {
            baseSuggestions['Prioritize conflicts'] = 'Rank conflicts by impact and address the top one';
        }
        return { ...baseSuggestions, ...specific };
    }
    generateComplexityNote(factors, technique) {
        const factorDescriptions = {
            multipleInteractingElements: 'multiple interacting elements',
            conflictingRequirements: 'conflicting requirements',
            highUncertainty: 'high uncertainty',
            multipleStakeholders: 'multiple stakeholders',
            systemComplexity: 'system-level complexity',
            timePressure: 'time pressure',
        };
        const detectedFactors = factors
            .map(f => factorDescriptions[f] || f)
            .filter(Boolean)
            .slice(0, 3);
        if (detectedFactors.length === 0) {
            return 'High complexity detected in current thinking';
        }
        return `High complexity detected due to ${detectedFactors.join(', ')}. The ${technique.replace(/_/g, ' ')} technique can help by focusing on specific aspects.`;
    }
}
//# sourceMappingURL=ExecutionResponseBuilder.js.map