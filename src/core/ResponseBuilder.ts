/**
 * Response Builder
 * Constructs formatted responses for MCP tools
 */

import type {
  LateralThinkingResponse,
  SessionData,
  ThinkingOperationData,
  LateralTechnique,
} from '../types/index.js';
import type { DiscoverTechniquesOutput, PlanThinkingSessionOutput } from '../types/planning.js';
import { CreativeThinkingError } from '../errors/types.js';

export class ResponseBuilder {
  /**
   * Build a success response with formatted content
   */
  public buildSuccessResponse(content: unknown): LateralThinkingResponse {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(content, null, 2),
        },
      ],
    };
  }

  /**
   * Build an error response
   */
  public buildErrorResponse(error: Error, layer: string): LateralThinkingResponse {
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
          text: JSON.stringify(
            {
              error: {
                message: error.message,
                layer,
              },
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  /**
   * Build a discovery response
   */
  public buildDiscoveryResponse(output: DiscoverTechniquesOutput): LateralThinkingResponse {
    // Transform the output to match the expected format
    const transformedOutput: Record<string, unknown> = {
      recommendations: output.recommendations,
      reasoning: this.buildReasoningString(output),
      suggestedWorkflow: this.buildSuggestedWorkflow(output),
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
  public buildPlanningResponse(output: PlanThinkingSessionOutput): LateralThinkingResponse {
    // Transform the output to match test expectations
    interface WorkflowStep {
      stepNumber: number;
      technique: LateralTechnique;
      description: string;
      expectedDuration: string;
      riskConsiderations?: string[];
      totalSteps: number;
      expectedOutputs: string[];
    }
    const flatWorkflow: WorkflowStep[] = [];
    let overallStepNumber = 1;

    // Flatten the nested workflow structure
    output.workflow.forEach(techniqueWorkflow => {
      const techniqueSteps = techniqueWorkflow.steps.length;
      techniqueWorkflow.steps.forEach(step => {
        flatWorkflow.push({
          stepNumber: overallStepNumber++,
          technique: techniqueWorkflow.technique,
          description: step.description,
          expectedDuration: '5 minutes', // Default duration per step
          riskConsiderations: step.risks,
          totalSteps: techniqueSteps,
          expectedOutputs: [step.expectedOutput],
        });
      });
    });

    const transformedOutput: Record<string, unknown> = {
      planId: output.planId,
      workflow: flatWorkflow,
      estimatedSteps: output.totalSteps,
      estimatedDuration: output.estimatedTotalTime,
      successCriteria: output.successMetrics || [],
      createdAt: new Date(output.createdAt || Date.now()).toISOString(),
      // Include other fields that might be needed
      objectives: output.objectives,
      constraints: output.constraints,
      planningInsights: output.planningInsights,
      complexityAssessment: output.complexityAssessment,
    };

    return this.buildSuccessResponse(transformedOutput);
  }

  /**
   * Build an execution response
   */
  public buildExecutionResponse(
    sessionId: string,
    input: ThinkingOperationData,
    insights: string[],
    nextStepGuidance?: string,
    historyLength?: number,
    executionMetadata?: Record<string, unknown>
  ): LateralThinkingResponse {
    const response: Record<string, unknown> = {
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
  public buildSessionOperationResponse(
    operation: string,
    result: unknown
  ): LateralThinkingResponse {
    return this.buildSuccessResponse({
      operation,
      success: true,
      result,
    });
  }

  /**
   * Add completion data to a response
   */
  public addCompletionData(
    response: Record<string, unknown>,
    session: SessionData
  ): Record<string, unknown> {
    const completionData: Record<string, unknown> = {
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
      completionData.warnings = session.earlyWarningState.activeWarnings.map(
        w => `${w.severity}: ${w.message}`
      );
    }

    if (session.escapeRecommendation) {
      completionData.escapeOptions = {
        protocol: session.escapeRecommendation.name,
        steps: session.escapeRecommendation.steps.slice(0, 3),
      };
    }

    return { ...response, ...completionData };
  }

  /**
   * Format session list for display
   */
  public formatSessionList(
    sessions: Array<{ id: string; data: SessionData }>
  ): Record<string, unknown> {
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
  public formatExportData(session: SessionData, format: 'json' | 'markdown' | 'csv'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(session, null, 2);

      case 'markdown':
        return this.formatAsMarkdown(session);

      case 'csv':
        return this.formatAsCSV(session);

      default:
        throw new Error(`Unsupported export format: ${format as string}`);
    }
  }

  /**
   * Extract technique-specific fields from input
   */
  private extractTechniqueSpecificFields(input: ThinkingOperationData): Record<string, unknown> {
    const fields: Record<string, unknown> = {};

    // Add technique-specific fields based on the technique
    switch (input.technique) {
      case 'six_hats':
        if (input.hatColor) fields.hatColor = input.hatColor;
        break;

      case 'po':
        if (input.provocation) fields.provocation = input.provocation;
        if (input.principles) fields.principles = input.principles;
        break;

      case 'random_entry':
        if (input.randomStimulus) fields.randomStimulus = input.randomStimulus;
        if (input.connections) fields.connections = input.connections;
        break;

      case 'scamper':
        if (input.scamperAction) fields.scamperAction = input.scamperAction;
        if (input.pathImpact) fields.pathImpact = input.pathImpact;
        if (input.flexibilityScore !== undefined) fields.flexibilityScore = input.flexibilityScore;
        if (input.alternativeSuggestions)
          fields.alternativeSuggestions = input.alternativeSuggestions;
        if (input.modificationHistory) fields.modificationHistory = input.modificationHistory;
        break;

      case 'concept_extraction':
        if (input.successExample) fields.successExample = input.successExample;
        if (input.extractedConcepts) fields.extractedConcepts = input.extractedConcepts;
        if (input.abstractedPatterns) fields.abstractedPatterns = input.abstractedPatterns;
        if (input.applications) fields.applications = input.applications;
        break;

      case 'yes_and':
        if (input.initialIdea) fields.initialIdea = input.initialIdea;
        if (input.additions) fields.additions = input.additions;
        if (input.evaluations) fields.evaluations = input.evaluations;
        if (input.synthesis) fields.synthesis = input.synthesis;
        break;

      case 'design_thinking':
        if (input.designStage) fields.designStage = input.designStage;
        if (input.empathyInsights) fields.empathyInsights = input.empathyInsights;
        if (input.problemStatement) fields.problemStatement = input.problemStatement;
        if (input.ideaList) fields.ideaList = input.ideaList;
        if (input.prototypeDescription) fields.prototypeDescription = input.prototypeDescription;
        if (input.userFeedback) fields.userFeedback = input.userFeedback;
        break;

      case 'triz':
        if (input.contradiction) fields.contradiction = input.contradiction;
        if (input.inventivePrinciples) fields.inventivePrinciples = input.inventivePrinciples;
        if (input.viaNegativaRemovals) fields.viaNegativaRemovals = input.viaNegativaRemovals;
        if (input.minimalSolution) fields.minimalSolution = input.minimalSolution;
        break;

      case 'neural_state':
        if (input.dominantNetwork) fields.dominantNetwork = input.dominantNetwork;
        if (input.suppressionDepth !== undefined) fields.suppressionDepth = input.suppressionDepth;
        if (input.switchingRhythm) fields.switchingRhythm = input.switchingRhythm;
        if (input.integrationInsights) fields.integrationInsights = input.integrationInsights;
        break;

      case 'temporal_work':
        if (input.temporalLandscape) fields.temporalLandscape = input.temporalLandscape;
        if (input.circadianAlignment) fields.circadianAlignment = input.circadianAlignment;
        if (input.pressureTransformation)
          fields.pressureTransformation = input.pressureTransformation;
        if (input.asyncSyncBalance) fields.asyncSyncBalance = input.asyncSyncBalance;
        if (input.temporalEscapeRoutes) fields.temporalEscapeRoutes = input.temporalEscapeRoutes;
        break;

      case 'cross_cultural':
        if (input.culturalFrameworks) fields.culturalFrameworks = input.culturalFrameworks;
        if (input.bridgeBuilding) fields.bridgeBuilding = input.bridgeBuilding;
        if (input.respectfulSynthesis) fields.respectfulSynthesis = input.respectfulSynthesis;
        if (input.parallelPaths) fields.parallelPaths = input.parallelPaths;
        break;

      case 'collective_intel':
        if (input.wisdomSources) fields.wisdomSources = input.wisdomSources;
        if (input.emergentPatterns) fields.emergentPatterns = input.emergentPatterns;
        if (input.synergyCombinations) fields.synergyCombinations = input.synergyCombinations;
        if (input.collectiveInsights) fields.collectiveInsights = input.collectiveInsights;
        break;
    }

    // Add common risk/adversarial fields if present
    if (input.risks) fields.risks = input.risks;
    if (input.failureModes) fields.failureModes = input.failureModes;
    if (input.mitigations) fields.mitigations = input.mitigations;
    if (input.antifragileProperties) fields.antifragileProperties = input.antifragileProperties;
    if (input.blackSwans) fields.blackSwans = input.blackSwans;

    // Add revision fields if present
    if (input.isRevision) fields.isRevision = input.isRevision;
    if (input.revisesStep !== undefined) fields.revisesStep = input.revisesStep;
    if (input.branchFromStep !== undefined) fields.branchFromStep = input.branchFromStep;
    if (input.branchId) fields.branchId = input.branchId;

    // Add reality assessment if present
    if (input.realityAssessment) fields.realityAssessment = input.realityAssessment;

    return fields;
  }

  /**
   * Format session as markdown
   */
  private formatAsMarkdown(session: SessionData): string {
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
  private formatAsCSV(session: SessionData): string {
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
  private buildReasoningString(output: DiscoverTechniquesOutput): string {
    if (output.recommendations.length === 0) {
      return 'No specific techniques recommended for this problem.';
    }

    const topTechniques = output.recommendations
      .slice(0, 3)
      .map(r => r.technique)
      .join(', ');

    return (
      `Based on your problem involving "${output.problem.substring(0, 100)}..."` +
      `, I recommend these techniques: ${topTechniques}. ` +
      `The problem appears to be ${output.problemCategory} in nature.`
    );
  }

  /**
   * Build suggested workflow from discovery output
   */
  private buildSuggestedWorkflow(output: DiscoverTechniquesOutput): string | undefined {
    if (!output.workflow || !output.workflow.phases) {
      return undefined;
    }

    const phases = output.workflow.phases
      .map(phase => `${phase.name}: ${phase.techniques.join(', ')}`)
      .join(' → ');

    return `Suggested workflow: ${phases}`;
  }
}
