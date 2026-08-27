/**
 * Response Builder
 * Constructs formatted responses for MCP tools
 */

import type { LateralThinkingResponse, SessionData, LateralTechnique } from '../types/index.js';
import { ALL_LATERAL_TECHNIQUES } from '../types/index.js';
import type { DiscoverTechniquesOutput, PlanThinkingSessionOutput } from '../types/planning.js';
import { CreativeThinkingError, ValidationError, ErrorCode } from '../errors/types.js';
import { JsonOptimizer } from '../utils/JsonOptimizer.js';

// Type for execution metadata
export interface ExecutionMetadata {
  /**
   * Audit of a stepReversibility claim: the handler-static prior, what the
   * caller claimed, what was applied after the one-rung clamp, and whether
   * clamping occurred. Present only on steps that sent a valid claim.
   */
  appliedReversibility?: {
    prior: 'high' | 'medium' | 'low' | 'very_low';
    claimed: 'high' | 'medium' | 'low';
    applied: 'high' | 'medium' | 'low' | 'very_low';
    clamped: boolean;
  };
  pathDependenciesCreated: string[];
  flexibilityImpact: number;
  noteworthyMoment?: string;
  futureRelevance?: string;
  errorContext?: {
    providedStep: number;
    validRange: string;
    technique: string;
    techniqueLocalStep: number;
    globalStep: number;
    message: string;
  };
}

export class ResponseBuilder {
  /**
   * Inline ceiling for session exports, which bypass the response optimizer
   * because their contract is "everything whole". Beyond this the export is
   * refused with the CLI file-export alternative rather than truncated.
   */
  private static readonly MAX_EXPORT_BYTES = 4 * 1024 * 1024;

  // JSON optimizer for response size management
  private jsonOptimizer: JsonOptimizer;

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
  public buildSuccessResponse(content: unknown): LateralThinkingResponse {
    try {
      // Use optimizer for all responses
      const response = this.jsonOptimizer.buildOptimizedResponse(content);

      // Validate response structure
      if (!response.content || !Array.isArray(response.content)) {
        console.error('[ResponseBuilder] Invalid response structure detected:', {
          hasContent: !!response.content,
          contentType: typeof response.content,
        });

        // Return a safe fallback response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(content),
            },
          ],
        };
      }

      // Ensure all content items have required fields
      for (let i = 0; i < response.content.length; i++) {
        const item = response.content[i];
        if (!item || typeof item !== 'object' || !('type' in item)) {
          console.error(`[ResponseBuilder] Invalid content item at index ${i}:`, item);
          // Replace with valid item
          response.content[i] = {
            type: 'text',
            text: String(item),
          };
        }
      }

      return response;
    } catch (error) {
      console.error('[ResponseBuilder] Error building response:', error);
      // Return a safe fallback response
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(content),
          },
        ],
      };
    }
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
      nextStepGuidance: this.buildNextStepGuidance(output),
      // Include all available techniques for LLM reference. Read from the
      // source of truth rather than copied: the copy this replaced had drifted
      // to 14 entries, so the discovery response told the model that 18 of the
      // techniques it is allowed to plan with did not exist.
      availableTechniques: [...ALL_LATERAL_TECHNIQUES],
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
      evidenceBreadth: output.evidenceBreadth,
      crux: output.crux,
      cruxDeclared: output.cruxDeclared,
      warnings: output.warnings,
      contextAnalysis: output.contextAnalysis,
      complexityAssessment: output.complexityAssessment,
      problemAnalysis: output.problemAnalysis,
      qualityCoverage: output.qualityCoverage,
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
      riskConsiderations?: string[];
      totalSteps: number;
      expectedOutputs: string[];
      stimulus?: string;
      stimulusSource?: 'assigned';
    }
    const flatWorkflow: WorkflowStep[] = [];
    let overallStepNumber = 1;

    // Flatten the nested workflow structure. This flattener is an allowlist:
    // a ThinkingStep field not copied here never reaches the caller — which
    // is how the assigned stimulus would have shipped dark.
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
          ...(step.stimulus !== undefined && {
            stimulus: step.stimulus,
            stimulusSource: step.stimulusSource,
          }),
        });
      });
    });

    const transformedOutput: Record<string, unknown> = {
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
      strictness: output.strictness,
      warnings: output.warnings,
      qualityCoverage: output.qualityCoverage,
      // Add execution graph for DAG-based parallel execution documentation
      executionGraph: output.executionGraph,
      // Persona and debate mode. `planThinkingSession` builds all four of these
      // — DebateOrchestrator runs, produces a plan per persona plus a synthesis
      // plan, and writes them onto the plan object — and this allowlist dropped
      // every one of them, so a caller asking for a two-persona structured
      // debate got back an ordinary single-technique plan with no indication
      // that anything of the sort had been computed. Measured before the fix:
      // two personas and debateFormat 'structured' returned no debate key, no
      // parallelPlans, and neither persona's voice in the step guidance.
      personaContext: output.personaContext,
      debateOutline: output.debateOutline,
      parallelPlans: output.parallelPlans,
      coordinationStrategy: output.coordinationStrategy,
      // Add execution guidance to help LLMs proceed
      nextSteps:
        output.techniques && output.techniques.length > 0 && output.problem
          ? {
              instructions:
                output.executionMode === 'parallel'
                  ? 'To execute this plan, you may use parallel tool calls for techniques that can run concurrently. Check the executionGraph for parallelizable groups.'
                  : 'To execute this plan, use the execute_thinking_step tool with the planId and follow the workflow steps.',
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
              guidance:
                output.executionMode === 'parallel'
                  ? 'For parallel execution, you can call execute_thinking_step multiple times in a single message for techniques that have no dependencies. The executionGraph shows which techniques can run in parallel.'
                  : 'Continue calling execute_thinking_step for each step, incrementing currentStep; send nextStepNeeded: false only on the final step of the final technique. Number steps within each technique (as firstCall does — currentStep 1 against the first technique’s own step count); plan-wide cumulative numbering is equally accepted, and totalSteps tells the server which convention currentStep is using.',
              important:
                'Always use the planId returned from this response. Do not skip this step or create your own planId.',
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
   * Build a session operation response
   */
  public buildSessionOperationResponse(
    operation: string,
    result: unknown
  ): LateralThinkingResponse {
    if (operation === 'export') {
      // Export's contract is "returns everything whole" — the optimizer's
      // string cap was truncating result.data at 1000 chars, silently
      // contradicting it. Exports bypass the optimizer, but not without a
      // ceiling: an unbounded message can exceed a client's tool-result limit
      // or swamp the model's context, and half a transcript delivered as a
      // wall of JSON is worse than a refusal that names the alternative.
      const text = JSON.stringify({ operation, success: true, result }, null, 2);
      if (Buffer.byteLength(text, 'utf8') <= ResponseBuilder.MAX_EXPORT_BYTES) {
        return { content: [{ type: 'text', text }] };
      }
      const mb = (Buffer.byteLength(text, 'utf8') / (1024 * 1024)).toFixed(1);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                operation,
                success: false,
                error: {
                  message: `Export is ${mb} MB, over the ${ResponseBuilder.MAX_EXPORT_BYTES / (1024 * 1024)} MB inline limit. Exports are never truncated, so this one is refused rather than silently cut.`,
                  recovery: [
                    'Write it to a file with the CLI: socketes session export --session-id <id> --format markdown > session.md',
                    "Try a more compact format ('csv' or 'markdown' instead of 'json')",
                  ],
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
    return this.buildSuccessResponse({
      operation,
      success: true,
      result,
    });
  }

  /**
   * Add completion data to a response.
   *
   * Builds the block fresh every time. It used to be memoised under
   * `completion-${technique}-${history.length}` — a key that named nothing
   * about whose session it was, while the value carried that session's
   * insights, problem, metrics and summary. Two sessions agreeing on technique
   * and history length, which any two full six_hats runs do, were the same
   * entry as far as the map was concerned (#313).
   *
   * Nothing had leaked: `executeThinkingStep` constructs its
   * `ExecutionResponseBuilder`, and with it this class, once per tool call, so
   * the map was written on the way out and dropped with the object. That also
   * means the memoisation never returned a single hit — this method is called
   * once per session, at the end. It was a cache that could not help and could
   * only ever be wrong, so it is gone rather than re-keyed: the block is an
   * object literal over state already in memory, and removing it takes the
   * only cross-session mutable state in this class with it.
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
        outputCompleteness: session.metrics?.outputCompleteness || 0,
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
        throw new ValidationError(
          ErrorCode.INVALID_FIELD_VALUE,
          `Unsupported export format: ${format as string}`,
          'format',
          { providedFormat: format }
        );
    }
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

  /**
   * Build next step guidance from discovery output
   */
  private buildNextStepGuidance(
    output: DiscoverTechniquesOutput
  ): Record<string, unknown> | undefined {
    if (output.recommendations.length === 0) {
      return undefined;
    }

    // Every recommendation, not a prefix of the array. This took
    // `.slice(0, 3)`, which selects by POSITION — and `fillCoverageGaps`
    // appends quality-coverage picks after the sort, so the highest-scoring
    // entries sit at the end and were exactly what the slice cut. The field
    // labelled "here is your next call" proposed the three weakest, against a
    // `scoreProvenance` in the same response saying otherwise.
    const selectedTechniques = output.recommendations.map(r => r.technique);

    return {
      message: `To apply ${selectedTechniques.length > 1 ? 'these techniques' : 'this technique'}, use the plan_thinking_session tool next.`,
      nextTool: 'plan_thinking_session',
      suggestedParameters: {
        problem: output.problem,
        techniques: selectedTechniques,
        // The caller's own, verbatim. This filtered `warnings` for the
        // substring "constraint", which returned the server's warnings about
        // constraints rather than the constraints the caller declared.
        constraints: output.constraints,
        executionMode: selectedTechniques.length > 1 ? 'parallel' : 'sequential',
        // `objectives` and `timeframe` are deliberately absent: neither is an
        // input to discover_techniques, so any value here would be invented.
        // Filling them is what proposed "Achieve team consensus" for a solo
        // planning problem. They are real parameters of plan_thinking_session,
        // where the caller supplies them.
      },
      example: {
        tool: 'plan_thinking_session',
        note: 'Illustrates the call shape only. The techniques to plan with are in suggestedParameters above, not here.',
        parameters: {
          problem: output.problem,
          techniques: [selectedTechniques[0]],
          objectives: ['<your objectives for this session>'],
          timeframe: 'thorough',
        },
      },
      alternativeApproach:
        selectedTechniques.length > 1
          ? `These ${selectedTechniques.length} techniques have no ordering dependency between them; the planning tool returns an executionGraph showing which can run concurrently.`
          : undefined,
    };
  }
}
