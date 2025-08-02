/**
 * ExecutionResponseBuilder - Handles response building and enhancement
 * Extracted from executeThinkingStep to improve maintainability
 */
import { ResponseBuilder } from '../../core/ResponseBuilder.js';
import { MemoryAnalyzer } from '../../core/MemoryAnalyzer.js';
import { RealityIntegration } from '../../reality/integration.js';
import { monitorCriticalSection } from '../../utils/PerformanceIntegration.js';
export class ExecutionResponseBuilder {
    complexityAnalyzer;
    escalationGenerator;
    techniqueRegistry;
    responseBuilder = new ResponseBuilder();
    memoryAnalyzer = new MemoryAnalyzer();
    constructor(complexityAnalyzer, escalationGenerator, techniqueRegistry) {
        this.complexityAnalyzer = complexityAnalyzer;
        this.escalationGenerator = escalationGenerator;
        this.techniqueRegistry = techniqueRegistry;
    }
    /**
     * Build comprehensive execution response
     */
    buildResponse(input, session, sessionId, handler, techniqueLocalStep, techniqueIndex, plan, currentFlexibility, optionGenerationResult) {
        // Extract insights
        const currentInsights = this.extractInsights(handler, session, input);
        // Generate memory outputs
        const memoryOutputs = this.memoryAnalyzer.generateMemoryOutputs(this.createOperationData(input, sessionId), session);
        // Generate next step guidance
        const nextStepGuidance = this.generateNextStepGuidance(input, session, handler, techniqueLocalStep, techniqueIndex, plan);
        // Generate execution metadata
        const executionMetadata = this.generateExecutionMetadata(input, session, currentInsights, session.pathMemory, currentFlexibility);
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
        // Build base response
        const operationData = this.createOperationData(input, sessionId);
        const response = this.responseBuilder.buildExecutionResponse(sessionId, operationData, currentInsights, nextStepGuidance, session.history.length, executionMetadata);
        // Parse response for enhancement
        const parsedResponse = JSON.parse(response.content[0].text);
        // Add all enhancements
        this.addMemoryOutputs(parsedResponse, memoryOutputs);
        this.addTechniqueProgress(parsedResponse, techniqueProgress);
        this.addFlexibilityInfo(parsedResponse, currentFlexibility, input.alternativeSuggestions);
        this.addPathAnalysis(parsedResponse, session.pathMemory, currentFlexibility);
        this.addWarnings(parsedResponse, session);
        this.addRealityAssessment(parsedResponse, input);
        this.addComplexityAnalysis(parsedResponse, input, session);
        this.addRiskAssessments(parsedResponse, input);
        this.addReflectionRequirement(parsedResponse, session, input);
        this.addOptionGeneration(parsedResponse, currentFlexibility, optionGenerationResult);
        // Finalize response
        response.content[0].text = JSON.stringify(parsedResponse, null, 2);
        // Handle session completion
        if (!input.nextStepNeeded) {
            this.handleSessionCompletion(response, session);
        }
        return response;
    }
    extractInsights(handler, session, input) {
        const currentInsights = monitorCriticalSection('extract_insights', () => handler.extractInsights(session.history), { technique: input.technique, historyLength: session.history.length });
        currentInsights.forEach((insight) => {
            if (!session.insights.includes(insight)) {
                session.insights.push(insight);
            }
        });
        return currentInsights;
    }
    createOperationData(input, sessionId) {
        // Remove realityAssessment to avoid duplication
        const { realityAssessment: _inputRealityAssessment, ...inputWithoutReality } = input;
        return {
            ...inputWithoutReality,
            sessionId,
        };
    }
    generateNextStepGuidance(input, session, handler, techniqueLocalStep, techniqueIndex, plan) {
        if (!input.nextStepNeeded)
            return undefined;
        const nextStep = input.currentStep + 1;
        // Ensure next step is valid
        if (nextStep < 1 || nextStep > input.totalSteps) {
            return `Complete the ${handler.getTechniqueInfo().name} process`;
        }
        // Check if we're transitioning to a new technique
        const currentTechniqueSteps = plan?.workflow[techniqueIndex]?.steps.length || handler.getTechniqueInfo().totalSteps;
        if (techniqueLocalStep >= currentTechniqueSteps) {
            // We're at the last step of current technique, next step is first step of next technique
            if (techniqueIndex + 1 < (plan?.techniques.length || 1)) {
                const nextTechnique = plan?.techniques[techniqueIndex + 1];
                if (nextTechnique) {
                    const nextHandler = this.techniqueRegistry?.getHandler(nextTechnique);
                    return nextHandler
                        ? `Transitioning to ${nextTechnique}. ${nextHandler.getStepGuidance(1, input.problem)}`
                        : `Transitioning to ${nextTechnique}`;
                }
            }
        }
        else {
            // Still in the same technique
            const nextLocalStep = techniqueLocalStep + 1;
            let guidance = handler.getStepGuidance(nextLocalStep, input.problem);
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
    generateExecutionMetadata(input, session, insights, pathMemory, currentFlexibility) {
        const metadata = {
            techniqueEffectiveness: this.assessTechniqueEffectiveness(input, session, insights),
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
    addWarnings(parsedResponse, session) {
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
        const completedParsedResponse = JSON.parse(response.content[0].text);
        const completedResponse = this.responseBuilder.addCompletionData(completedParsedResponse, session);
        response.content[0].text = JSON.stringify(completedResponse, null, 2);
    }
    // Helper methods for metadata generation
    assessTechniqueEffectiveness(input, session, insights) {
        let effectiveness = 0.5; // Base effectiveness
        if (insights.length > 3)
            effectiveness += 0.2;
        else if (insights.length > 1)
            effectiveness += 0.1;
        if (input.risks && input.risks.length > 0)
            effectiveness += 0.1;
        if (input.antifragileProperties && input.antifragileProperties.length > 0) {
            effectiveness += 0.15;
        }
        if (input.technique === 'scamper' && input.pathImpact) {
            if (input.pathImpact.flexibilityRetention > 0.5)
                effectiveness += 0.1;
        }
        if (input.provocation && input.principles)
            effectiveness += 0.2;
        return Math.min(1, effectiveness);
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
        if (input.flexibilityScore !== undefined) {
            return -(1 - input.flexibilityScore);
        }
        if (input.pathImpact) {
            return -(1 - input.pathImpact.flexibilityRetention);
        }
        if (session.pathMemory && session.pathMemory.currentFlexibility) {
            const currentFlex = session.pathMemory.currentFlexibility.flexibilityScore || 1;
            return -(1 - currentFlex) * 0.1;
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
        if (input.technique === 'cross_cultural') {
            if (input.culturalFrameworks && input.culturalFrameworks.length > 2) {
                return 'These cultural patterns provide templates for diverse problem contexts';
            }
            // Check for parallel paths implementation
            if (input.parallelPaths && input.parallelPaths.length > 0) {
                return 'Parallel implementation patterns can be adapted across different contexts';
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
        const hasGeneratedOptions = (currentFlexibility < 0.4 && session.history.length > 5) ||
            session.history.some(h => h.flexibilityScore !== undefined && h.flexibilityScore < 0.4);
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