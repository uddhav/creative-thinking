/**
 * Response Builder
 * Constructs formatted responses for MCP tools
 */
import { CreativeThinkingError, ValidationError, ErrorCode } from '../errors/types.js';
import { JsonOptimizer } from '../utils/JsonOptimizer.js';
export class ResponseBuilder {
    // Performance optimization: Cache for expensive session metric calculations
    metricsCache = new Map();
    // JSON optimizer for response size management
    jsonOptimizer;
    constructor() {
        this.jsonOptimizer = new JsonOptimizer({
            maxArrayLength: 100,
            maxStringLength: 1000,
            maxDepth: 10,
            maxResponseSize: 1024 * 1024, // 1MB
        });
    }
    /**
     * Build a success response with formatted content
     */
    buildSuccessResponse(content) {
        // Use optimizer for all responses
        return this.jsonOptimizer.buildOptimizedResponse(content);
    }
    /**
     * Build an error response
     */
    buildErrorResponse(error, layer) {
        // Handle CreativeThinkingError specially to preserve error structure
        if (error instanceof CreativeThinkingError) {
            const errorResponse = error.toResponse();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ error: errorResponse.error }, null, 2),
                    },
                ],
                isError: true,
            };
        }
        // For other errors, use standard format compatible with tests
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: {
                            message: error.message,
                            layer,
                        },
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
    /**
     * Build a discovery response
     */
    buildDiscoveryResponse(output) {
        // Transform the output to match the expected format
        const transformedOutput = {
            recommendations: output.recommendations,
            reasoning: this.buildReasoningString(output),
            suggestedWorkflow: this.buildSuggestedWorkflow(output),
            nextStepGuidance: this.buildNextStepGuidance(output),
            // Include all available techniques for LLM reference
            availableTechniques: [
                'six_hats',
                'po',
                'random_entry',
                'scamper',
                'concept_extraction',
                'yes_and',
                'design_thinking',
                'triz',
                'neural_state',
                'temporal_work',
                'cross_cultural',
                'collective_intel',
                'disney_method',
                'nine_windows',
            ],
            workflowReminder: {
                currentStep: 1,
                totalSteps: 3,
                steps: [
                    '1. discover_techniques (current) - Analyze problem and find suitable techniques',
                    '2. plan_thinking_session (next) - Create a structured plan',
                    '3. execute_thinking_step - Work through the plan step by step',
                ],
            },
            // Include other fields that might be expected
            problemCategory: output.problemCategory,
            warnings: output.warnings,
            contextAnalysis: output.contextAnalysis,
            complexityAssessment: output.complexityAssessment,
            problemAnalysis: output.problemAnalysis,
        };
        return this.buildSuccessResponse(transformedOutput);
    }
    /**
     * Build a planning response
     */
    buildPlanningResponse(output) {
        const flatWorkflow = [];
        let overallStepNumber = 1;
        // Flatten the nested workflow structure
        output.workflow.forEach(techniqueWorkflow => {
            const techniqueSteps = techniqueWorkflow.steps.length;
            techniqueWorkflow.steps.forEach(step => {
                flatWorkflow.push({
                    stepNumber: overallStepNumber++,
                    technique: techniqueWorkflow.technique,
                    description: step.description,
                    riskConsiderations: step.risks,
                    totalSteps: techniqueSteps,
                    expectedOutputs: [step.expectedOutput],
                });
            });
        });
        // Build parallel execution groups if parallel mode is enabled
        const parallelExecutionGroups = output.executionMode === 'parallel' ? this.buildParallelExecutionGroups(output) : undefined;
        const transformedOutput = {
            planId: output.planId,
            workflow: flatWorkflow,
            estimatedSteps: output.totalSteps,
            successCriteria: output.successMetrics || [],
            createdAt: new Date(output.createdAt || Date.now()).toISOString(),
            // Include other fields that might be needed
            objectives: output.objectives,
            constraints: output.constraints,
            planningInsights: output.planningInsights,
            complexityAssessment: output.complexityAssessment,
            executionMode: output.executionMode,
            // Add execution graph for DAG-based parallel execution
            executionGraph: output.executionGraph,
            // Add parallel execution groups for Anthropic-style parallel tool calls
            parallelExecutionGroups,
            // Add execution guidance to help LLMs proceed
            nextSteps: output.techniques && output.techniques.length > 0 && output.problem
                ? output.executionMode === 'parallel' && parallelExecutionGroups
                    ? {
                        instructions: 'To execute this plan, use PARALLEL tool calls for techniques that can run concurrently.',
                        parallelCalls: parallelExecutionGroups[0]?.techniques.map(technique => ({
                            tool: 'execute_thinking_step',
                            parameters: {
                                planId: output.planId,
                                technique,
                                problem: output.problem,
                                currentStep: 1,
                                totalSteps: output.workflow.find(w => w.technique === technique)?.steps.length || 0,
                                output: `[Your thinking output for ${technique} step 1]`,
                                nextStepNeeded: true,
                            },
                        })),
                        guidance: 'Execute techniques in parallel groups as indicated. Techniques in the same group should be called simultaneously in a single parallel tool call. Continue until all steps are complete.',
                        important: 'Use Anthropic-style parallel tool calls for techniques in the same execution group. This significantly improves performance.',
                    }
                    : {
                        instructions: 'To execute this plan, use the execute_thinking_step tool with the planId and follow the workflow steps.',
                        firstCall: {
                            tool: 'execute_thinking_step',
                            parameters: {
                                planId: output.planId,
                                technique: output.techniques[0],
                                problem: output.problem,
                                currentStep: 1,
                                totalSteps: output.workflow[0]?.steps.length || 0,
                                output: '[Your thinking output for step 1]',
                                nextStepNeeded: true,
                            },
                        },
                        guidance: 'Continue calling execute_thinking_step for each step, incrementing currentStep until nextStepNeeded is false. Note: currentStep uses cumulative numbering across all techniques (e.g., if six_hats has 7 steps, temporal_work starts at step 8).',
                        important: 'Always use the planId returned from this response. Do not skip this step or create your own planId.',
                    }
                : undefined,
            workflowReminder: {
                currentStep: 2,
                totalSteps: 3,
                steps: [
                    '1. discover_techniques (completed) - Found suitable techniques',
                    '2. plan_thinking_session (current) - Created structured plan',
                    '3. execute_thinking_step (next) - Execute the plan step by step',
                ],
            },
        };
        return this.buildSuccessResponse(transformedOutput);
    }
    /**
     * Build an execution response
     */
    buildExecutionResponse(sessionId, input, insights, nextStepGuidance, historyLength, executionMetadata) {
        const response = {
            sessionId,
            technique: input.technique,
            problem: input.problem,
            currentStep: input.currentStep,
            totalSteps: input.totalSteps,
            nextStepNeeded: input.nextStepNeeded,
            insights,
            ...this.extractTechniqueSpecificFields(input),
        };
        // Add historyLength if provided
        if (historyLength !== undefined) {
            response.historyLength = historyLength;
        }
        // Add next step guidance if provided
        if (nextStepGuidance) {
            response.nextStepGuidance = nextStepGuidance;
        }
        // Add execution metadata for memory context
        if (executionMetadata) {
            response.executionMetadata = executionMetadata;
        }
        return this.buildSuccessResponse(response);
    }
    /**
     * Build a session operation response
     */
    buildSessionOperationResponse(operation, result) {
        return this.buildSuccessResponse({
            operation,
            success: true,
            result,
        });
    }
    /**
     * Add completion data to a response
     */
    addCompletionData(response, session) {
        // Performance optimization: Check cache first
        const cacheKey = `completion-${session.technique}-${session.history.length}`;
        const cached = this.metricsCache.get(cacheKey);
        if (cached && cached.historyLength === session.history.length) {
            return { ...response, ...cached.value };
        }
        const completionData = {
            sessionComplete: true,
            completed: true, // Add for backward compatibility
            // Don't override totalSteps - keep the original from the response
            techniqueUsed: session.technique,
            insights: session.insights,
            message: 'Lateral thinking session completed',
            metrics: session.metrics,
            summary: {
                technique: session.technique,
                problem: session.problem,
                stepsCompleted: session.history.length,
                insightsGenerated: session.insights.length,
                creativityScore: session.metrics?.creativityScore || 0,
                risksCaught: session.metrics?.risksCaught || 0,
            },
        };
        if (session.pathMemory) {
            completionData.pathAnalysis = {
                decisionsLocked: session.pathMemory.pathHistory.filter(e => e.reversibilityCost > 0.7)
                    .length,
                flexibilityScore: session.pathMemory.currentFlexibility.flexibilityScore,
                constraints: session.pathMemory.constraints.map(c => c.description),
            };
        }
        if (session.earlyWarningState) {
            completionData.warnings = session.earlyWarningState.activeWarnings.map(w => `${w.severity}: ${w.message}`);
        }
        if (session.escapeRecommendation) {
            completionData.escapeOptions = {
                protocol: session.escapeRecommendation.name,
                steps: session.escapeRecommendation.steps.slice(0, 3),
            };
        }
        // Cache the computed result
        this.metricsCache.set(cacheKey, {
            value: completionData,
            historyLength: session.history.length,
        });
        return { ...response, ...completionData };
    }
    /**
     * Format session list for display
     */
    formatSessionList(sessions) {
        return {
            count: sessions.length,
            sessions: sessions.map(({ id, data }) => ({
                id,
                name: data.name || `${data.technique} - ${data.problem.slice(0, 50)}...`,
                technique: data.technique,
                problem: data.problem.slice(0, 100) + (data.problem.length > 100 ? '...' : ''),
                created: new Date(data.startTime || 0).toISOString(),
                lastActivity: new Date(data.lastActivityTime).toISOString(),
                steps: data.history.length,
                complete: data.endTime ? true : false,
                insights: data.insights.length,
                tags: data.tags || [],
            })),
        };
    }
    /**
     * Format export data based on format type
     */
    formatExportData(session, format) {
        switch (format) {
            case 'json':
                return JSON.stringify(session, null, 2);
            case 'markdown':
                return this.formatAsMarkdown(session);
            case 'csv':
                return this.formatAsCSV(session);
            default:
                throw new ValidationError(ErrorCode.INVALID_FIELD_VALUE, `Unsupported export format: ${format}`, 'format', { providedFormat: format });
        }
    }
    /**
     * Extract technique-specific fields from input
     */
    extractTechniqueSpecificFields(input) {
        const fields = {};
        // Add technique-specific fields based on the technique
        switch (input.technique) {
            case 'six_hats':
                if (input.hatColor)
                    fields.hatColor = input.hatColor;
                break;
            case 'po':
                if (input.provocation)
                    fields.provocation = input.provocation;
                if (input.principles)
                    fields.principles = input.principles;
                break;
            case 'random_entry':
                if (input.randomStimulus)
                    fields.randomStimulus = input.randomStimulus;
                if (input.connections)
                    fields.connections = input.connections;
                break;
            case 'scamper':
                if (input.scamperAction)
                    fields.scamperAction = input.scamperAction;
                if (input.pathImpact)
                    fields.pathImpact = input.pathImpact;
                if (input.flexibilityScore !== undefined)
                    fields.flexibilityScore = input.flexibilityScore;
                if (input.alternativeSuggestions)
                    fields.alternativeSuggestions = input.alternativeSuggestions;
                if (input.modificationHistory)
                    fields.modificationHistory = input.modificationHistory;
                break;
            case 'concept_extraction':
                if (input.successExample)
                    fields.successExample = input.successExample;
                if (input.extractedConcepts)
                    fields.extractedConcepts = input.extractedConcepts;
                if (input.abstractedPatterns)
                    fields.abstractedPatterns = input.abstractedPatterns;
                if (input.applications)
                    fields.applications = input.applications;
                break;
            case 'yes_and':
                if (input.initialIdea)
                    fields.initialIdea = input.initialIdea;
                if (input.additions)
                    fields.additions = input.additions;
                if (input.evaluations)
                    fields.evaluations = input.evaluations;
                if (input.synthesis)
                    fields.synthesis = input.synthesis;
                break;
            case 'design_thinking':
                if (input.designStage)
                    fields.designStage = input.designStage;
                if (input.empathyInsights)
                    fields.empathyInsights = input.empathyInsights;
                if (input.problemStatement)
                    fields.problemStatement = input.problemStatement;
                if (input.ideaList)
                    fields.ideaList = input.ideaList;
                if (input.prototypeDescription)
                    fields.prototypeDescription = input.prototypeDescription;
                if (input.userFeedback)
                    fields.userFeedback = input.userFeedback;
                break;
            case 'triz':
                if (input.contradiction)
                    fields.contradiction = input.contradiction;
                if (input.inventivePrinciples)
                    fields.inventivePrinciples = input.inventivePrinciples;
                if (input.viaNegativaRemovals)
                    fields.viaNegativaRemovals = input.viaNegativaRemovals;
                if (input.minimalSolution)
                    fields.minimalSolution = input.minimalSolution;
                break;
            case 'neural_state':
                if (input.dominantNetwork)
                    fields.dominantNetwork = input.dominantNetwork;
                if (input.suppressionDepth !== undefined)
                    fields.suppressionDepth = input.suppressionDepth;
                if (input.switchingRhythm)
                    fields.switchingRhythm = input.switchingRhythm;
                if (input.integrationInsights)
                    fields.integrationInsights = input.integrationInsights;
                break;
            case 'temporal_work':
                if (input.temporalLandscape)
                    fields.temporalLandscape = input.temporalLandscape;
                if (input.circadianAlignment)
                    fields.circadianAlignment = input.circadianAlignment;
                if (input.pressureTransformation)
                    fields.pressureTransformation = input.pressureTransformation;
                if (input.asyncSyncBalance)
                    fields.asyncSyncBalance = input.asyncSyncBalance;
                if (input.temporalEscapeRoutes)
                    fields.temporalEscapeRoutes = input.temporalEscapeRoutes;
                break;
            case 'cross_cultural':
                if (input.culturalFrameworks)
                    fields.culturalFrameworks = input.culturalFrameworks;
                if (input.bridgeBuilding)
                    fields.bridgeBuilding = input.bridgeBuilding;
                if (input.respectfulSynthesis)
                    fields.respectfulSynthesis = input.respectfulSynthesis;
                if (input.parallelPaths)
                    fields.parallelPaths = input.parallelPaths;
                break;
            case 'collective_intel':
                if (input.wisdomSources)
                    fields.wisdomSources = input.wisdomSources;
                if (input.emergentPatterns)
                    fields.emergentPatterns = input.emergentPatterns;
                if (input.synergyCombinations)
                    fields.synergyCombinations = input.synergyCombinations;
                if (input.collectiveInsights)
                    fields.collectiveInsights = input.collectiveInsights;
                break;
        }
        // Add common risk/adversarial fields if present
        if (input.risks)
            fields.risks = input.risks;
        if (input.failureModes)
            fields.failureModes = input.failureModes;
        if (input.mitigations)
            fields.mitigations = input.mitigations;
        if (input.antifragileProperties)
            fields.antifragileProperties = input.antifragileProperties;
        if (input.blackSwans)
            fields.blackSwans = input.blackSwans;
        // Add revision fields if present
        if (input.isRevision)
            fields.isRevision = input.isRevision;
        if (input.revisesStep !== undefined)
            fields.revisesStep = input.revisesStep;
        if (input.branchFromStep !== undefined)
            fields.branchFromStep = input.branchFromStep;
        if (input.branchId)
            fields.branchId = input.branchId;
        // Add reality assessment if present
        if (input.realityAssessment)
            fields.realityAssessment = input.realityAssessment;
        // Add synthesis for convergence
        if (input.synthesis)
            fields.synthesis = input.synthesis;
        return fields;
    }
    /**
     * Format session as markdown
     */
    formatAsMarkdown(session) {
        let markdown = `# Creative Thinking Session\n\n`;
        markdown += `**Technique:** ${session.technique}\n`;
        markdown += `**Problem:** ${session.problem}\n`;
        markdown += `**Date:** ${new Date(session.startTime || Date.now()).toISOString()}\n\n`;
        markdown += `## Steps\n\n`;
        session.history.forEach((step, index) => {
            markdown += `### Step ${index + 1}\n`;
            markdown += `**Output:** ${step.output}\n`;
            if (step.risks && step.risks.length > 0) {
                markdown += `**Risks:** ${step.risks.join(', ')}\n`;
            }
            if (step.mitigations && step.mitigations.length > 0) {
                markdown += `**Mitigations:** ${step.mitigations.join(', ')}\n`;
            }
            markdown += '\n';
        });
        if (session.insights.length > 0) {
            markdown += `## Insights\n\n`;
            session.insights.forEach(insight => {
                markdown += `- ${insight}\n`;
            });
        }
        return markdown;
    }
    /**
     * Format session as CSV
     */
    formatAsCSV(session) {
        const headers = ['Step', 'Technique', 'Output', 'Risks', 'Mitigations'];
        const rows = [headers.join(',')];
        session.history.forEach((step, index) => {
            const row = [
                index + 1,
                session.technique,
                `"${step.output.replace(/"/g, '""')}"`,
                `"${(step.risks || []).join('; ').replace(/"/g, '""')}"`,
                `"${(step.mitigations || []).join('; ').replace(/"/g, '""')}"`,
            ];
            rows.push(row.join(','));
        });
        return rows.join('\n');
    }
    /**
     * Build reasoning string from discovery output
     */
    buildReasoningString(output) {
        if (output.recommendations.length === 0) {
            return 'No specific techniques recommended for this problem.';
        }
        const topTechniques = output.recommendations
            .slice(0, 3)
            .map(r => r.technique)
            .join(', ');
        return (`Based on your problem involving "${output.problem.substring(0, 100)}..."` +
            `, I recommend these techniques: ${topTechniques}. ` +
            `The problem appears to be ${output.problemCategory} in nature.`);
    }
    /**
     * Build suggested workflow from discovery output
     */
    buildSuggestedWorkflow(output) {
        if (!output.workflow || !output.workflow.phases) {
            return undefined;
        }
        const phases = output.workflow.phases
            .map(phase => `${phase.name}: ${phase.techniques.join(', ')}`)
            .join(' → ');
        return `Suggested workflow: ${phases}`;
    }
    /**
     * Build next step guidance from discovery output
     */
    buildNextStepGuidance(output) {
        if (output.recommendations.length === 0) {
            return undefined;
        }
        const topRecommendations = output.recommendations.slice(0, 3);
        const selectedTechniques = topRecommendations.map(r => r.technique);
        return {
            message: `To apply ${selectedTechniques.length > 1 ? 'these techniques' : 'this technique'}, use the plan_thinking_session tool next.`,
            nextTool: 'plan_thinking_session',
            suggestedParameters: {
                problem: output.problem,
                techniques: selectedTechniques,
                objectives: output.contextAnalysis?.collaborationNeeded
                    ? ['Achieve team consensus', 'Generate diverse perspectives']
                    : ['Generate innovative solutions', 'Identify potential risks'],
                constraints: output.warnings?.filter(w => w.includes('constraint')) || undefined,
                timeframe: output.contextAnalysis?.timeConstraint ? 'quick' : 'thorough',
                executionMode: selectedTechniques.length > 1 ? 'parallel' : 'sequential',
            },
            example: {
                tool: 'plan_thinking_session',
                parameters: {
                    problem: output.problem,
                    techniques: [selectedTechniques[0]],
                    objectives: ['Generate innovative solutions'],
                    timeframe: 'thorough',
                },
            },
            alternativeApproach: selectedTechniques.length > 1
                ? `You can also plan with multiple techniques: ${selectedTechniques.join(', ')}. The planning tool will create an integrated workflow.`
                : undefined,
        };
    }
    /**
     * Build parallel execution groups for planning response
     */
    buildParallelExecutionGroups(output) {
        if (!output.parallelGroupIds || output.parallelGroupIds.length === 0) {
            // Create groups based on technique dependencies
            const groups = [];
            // Group 1: Techniques that can run in parallel
            const parallelTechniques = output.techniques.filter(t => !['disney_method', 'design_thinking', 'triz'].includes(t));
            if (parallelTechniques.length > 0) {
                groups.push({
                    groupNumber: 1,
                    techniques: parallelTechniques,
                    canRunInParallel: true,
                    description: 'These techniques can be executed simultaneously using parallel tool calls',
                });
            }
            // Group 2: Sequential techniques
            const sequentialTechniques = output.techniques.filter(t => ['disney_method', 'design_thinking', 'triz'].includes(t));
            sequentialTechniques.forEach(technique => {
                groups.push({
                    groupNumber: groups.length + 1,
                    techniques: [technique],
                    canRunInParallel: false,
                    description: `${technique} must be executed sequentially (steps depend on each other)`,
                });
            });
            // Add convergence as final group if applicable
            if (output.convergenceConfig) {
                groups.push({
                    groupNumber: groups.length + 1,
                    techniques: ['convergence'],
                    canRunInParallel: false,
                    description: 'Final synthesis of all technique results',
                });
            }
            return groups.length > 0 ? groups : undefined;
        }
        // Use existing parallel group IDs if available
        return output.parallelGroupIds.map((groupId, index) => ({
            groupNumber: index + 1,
            techniques: output.techniques.filter((_, i) => output.parallelGroupIds?.[i] === groupId),
            canRunInParallel: true,
            description: `Parallel execution group ${groupId}`,
        }));
    }
}
//# sourceMappingURL=ResponseBuilder.js.map