/**
 * Execution Layer
 * Handles the execution of thinking steps
 */

import type {
  ExecuteThinkingStepInput,
  SessionData,
  ThinkingOperationData,
  LateralThinkingResponse,
} from '../types/index.js';
import type { PathMemory } from '../ergodicity/types.js';
import type { SessionManager } from '../core/SessionManager.js';
import type { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
import type { VisualFormatter } from '../utils/VisualFormatter.js';
import type { MetricsCollector } from '../core/MetricsCollector.js';
import type { HybridComplexityAnalyzer } from '../complexity/analyzer.js';
import type { ErgodicityManager } from '../ergodicity/index.js';
import { ResponseBuilder } from '../core/ResponseBuilder.js';
import type { ScamperHandler } from '../techniques/ScamperHandler.js';
import { MemoryAnalyzer } from '../core/MemoryAnalyzer.js';
import { RealityIntegration } from '../reality/integration.js';

// Type for the result from ErgodicityManager.recordThinkingStep
interface ErgodicityResult {
  event: unknown;
  metrics: unknown;
  warnings: unknown[];
  earlyWarningState?: unknown;
  escapeRecommendation?: unknown;
  escapeVelocityNeeded?: boolean;
  pathMemory?: PathMemory;
}

// Type guard for ErgodicityResult
function isErgodicityResult(value: unknown): value is ErgodicityResult {
  return (
    value !== null &&
    typeof value === 'object' &&
    'event' in value &&
    'metrics' in value &&
    'warnings' in value &&
    Array.isArray((value as ErgodicityResult).warnings)
  );
}

// Type for complexity analysis suggestions
interface ComplexitySuggestion {
  complexityNote: string;
  suggestedApproach: Record<string, string>;
}

export async function executeThinkingStep(
  input: ExecuteThinkingStepInput,
  sessionManager: SessionManager,
  techniqueRegistry: TechniqueRegistry,
  visualFormatter: VisualFormatter,
  metricsCollector: MetricsCollector,
  complexityAnalyzer: HybridComplexityAnalyzer,
  ergodicityManager: ErgodicityManager
): Promise<LateralThinkingResponse> {
  const responseBuilder = new ResponseBuilder();
  const memoryAnalyzer = new MemoryAnalyzer();

  try {
    // Validate planId if provided
    if (input.planId) {
      const plan = sessionManager.getPlan(input.planId);
      if (!plan) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Invalid planId',
                  message: `Plan ${input.planId} not found. Please create a plan first using plan_thinking_session.`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      // Validate technique matches plan
      if (!plan.techniques.includes(input.technique)) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Technique mismatch',
                  plannedTechniques: plan.techniques,
                  requestedTechnique: input.technique,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    // Get or create session
    let session: SessionData;
    let sessionId = input.sessionId;

    if (sessionId) {
      const existingSession = sessionManager.getSession(sessionId);
      if (!existingSession) {
        throw new Error(`Session ${sessionId} not found`);
      }
      session = existingSession;
    } else {
      // Create new session
      session = initializeSession(input, ergodicityManager);
      sessionId = sessionManager.createSession(session);
    }

    // Update session activity
    sessionManager.touchSession(sessionId);

    // Get technique handler
    const handler = techniqueRegistry.getHandler(input.technique);

    // Validate step
    if (!handler.validateStep(input.currentStep, input)) {
      // Handle invalid step gracefully
      console.error(`Unknown ${input.technique} step ${input.currentStep}`);

      // Still need to record something for the test
      const operationData: ThinkingOperationData = {
        ...input,
        sessionId,
      };

      // Return early with minimal response
      // For invalid steps, we need to get the guidance for what would be the next step
      let nextStepGuidance: string | undefined;
      if (input.nextStepNeeded) {
        // Always return the "Complete the..." message for invalid steps
        nextStepGuidance = handler.getStepGuidance(input.currentStep + 1, input.problem);
      }

      return responseBuilder.buildExecutionResponse(
        sessionId,
        operationData,
        [],
        nextStepGuidance,
        session.history.length
      );
    }

    // Try to get step info, handle invalid steps gracefully
    let stepInfo;
    try {
      stepInfo = handler.getStepInfo(input.currentStep);
    } catch (error) {
      // Handle different error scenarios
      if (error instanceof RangeError) {
        // Step number is out of bounds
        console.warn(
          `Step ${input.currentStep} is out of range for ${input.technique}. Using default guidance.`
        );
        stepInfo = null;
      } else if (error instanceof TypeError) {
        // Handler method issues
        console.error(`Handler method error for ${input.technique}:`, error.message);
        stepInfo = null;
      } else {
        // Unknown error - log and continue
        console.error(`Unexpected error getting step info:`, error);
        stepInfo = null;
      }
    }

    // Get mode indicator
    const modeIndicator = visualFormatter.getModeIndicator(input.technique, input.currentStep);

    // Display visual output
    const visualOutput = visualFormatter.formatOutput(
      input.technique,
      input.problem,
      input.currentStep,
      input.totalSteps,
      stepInfo,
      modeIndicator,
      input
    );

    if (visualOutput && process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
      // Only log if thought logging is enabled
      process.stdout.write(visualOutput);
    }

    // Handle SCAMPER path impact
    if (input.technique === 'scamper' && input.scamperAction) {
      const scamperHandler = handler as ScamperHandler;
      input.pathImpact = scamperHandler.analyzePathImpact(
        input.scamperAction,
        input.output,
        session.history
      );

      // Build modification history from session (previous steps only)
      input.modificationHistory = [];

      // Include previous SCAMPER modifications from history
      session.history.forEach(entry => {
        if (
          entry.technique === 'scamper' &&
          entry.scamperAction &&
          entry.pathImpact &&
          input.modificationHistory
        ) {
          input.modificationHistory.push({
            action: entry.scamperAction,
            modification: entry.output,
            timestamp: entry.timestamp || new Date().toISOString(),
            impact: entry.pathImpact,
            cumulativeFlexibility: entry.flexibilityScore || entry.pathImpact.flexibilityRetention,
          });
        }
      });

      // Add flexibility score to the input
      input.flexibilityScore = input.pathImpact.flexibilityRetention;

      // Generate alternatives if flexibility is low
      if (input.pathImpact.flexibilityRetention < 0.4) {
        input.alternativeSuggestions = scamperHandler.generateAlternatives(
          input.scamperAction,
          input.pathImpact.flexibilityRetention
        );
      }
    }

    // Update ergodicity tracking
    let ergodicityResult:
      | Awaited<ReturnType<typeof ergodicityManager.recordThinkingStep>>
      | undefined;
    if (input.pathImpact) {
      ergodicityResult = await ergodicityManager.recordThinkingStep(
        input.technique,
        input.currentStep,
        input.output,
        {
          optionsClosed: input.pathImpact.optionsClosed,
          optionsOpened: input.pathImpact.optionsOpened,
          reversibilityCost: 1 - input.pathImpact.flexibilityRetention,
          commitmentLevel:
            input.pathImpact.commitmentLevel === 'low'
              ? 0.2
              : input.pathImpact.commitmentLevel === 'medium'
                ? 0.5
                : input.pathImpact.commitmentLevel === 'high'
                  ? 0.8
                  : 1.0,
        },
        session
      );

      // Update session with ergodicity data
      session.pathMemory = ergodicityManager.getPathMemory();
      if (
        ergodicityResult &&
        'earlyWarningState' in ergodicityResult &&
        ergodicityResult.earlyWarningState
      ) {
        session.earlyWarningState = ergodicityResult.earlyWarningState;
      }
      if (
        ergodicityResult &&
        'escapeRecommendation' in ergodicityResult &&
        ergodicityResult.escapeRecommendation
      ) {
        session.escapeRecommendation = ergodicityResult.escapeRecommendation;
      }
    }

    // Record step in history (exclude realityAssessment from operationData to avoid duplication)
    const { realityAssessment: inputRealityAssessment, ...inputWithoutReality } = input;

    // If there's a reality assessment from input, we should handle it separately
    if (inputRealityAssessment) {
      // Reality assessment is handled through realityResult and added to response separately
      // This prevents duplication in the operation data
    }

    const operationData: ThinkingOperationData = {
      ...inputWithoutReality,
      sessionId,
    };
    session.history.push({
      ...operationData,
      timestamp: new Date().toISOString(),
    });

    // Handle revisions and branches
    if (input.isRevision && input.revisesStep !== undefined) {
      if (!input.branchId) {
        input.branchId = `branch_${Date.now()}`;
      }
      if (!session.branches[input.branchId]) {
        session.branches[input.branchId] = [];
      }
      session.branches[input.branchId].push(operationData);
    }

    // Update metrics
    metricsCollector.updateMetrics(session, operationData);

    // Extract insights
    const currentInsights = handler.extractInsights(session.history);
    currentInsights.forEach(insight => {
      if (!session.insights.includes(insight)) {
        session.insights.push(insight);
      }
    });

    // Generate memory-suggestive outputs
    const memoryOutputs = memoryAnalyzer.generateMemoryOutputs(operationData, session);

    // Perform reality assessment
    const realityResult = RealityIntegration.enhanceWithReality(input, input.output);

    // Check complexity and suggest sequential thinking
    const complexityCheck = checkExecutionComplexity(input, session, complexityAnalyzer);

    // Generate next step guidance if needed
    let nextStepGuidance: string | undefined;
    if (input.nextStepNeeded) {
      const nextStep = input.currentStep + 1;
      // Ensure next step is valid
      if (nextStep >= 1 && nextStep <= input.totalSteps) {
        nextStepGuidance = handler.getStepGuidance(nextStep, input.problem);

        // Add contextual guidance for temporal_work
        if (input.technique === 'temporal_work' && nextStep === 3) {
          // Look for pressure points from step 1 in session history
          const step1Data = session.history.find(h => h.currentStep === 1 && h.temporalLandscape);
          if (step1Data && step1Data.temporalLandscape?.pressurePoints) {
            const pressurePoints = step1Data.temporalLandscape.pressurePoints;
            if (pressurePoints.length > 0) {
              nextStepGuidance = `💎 Transform time pressure into creative force. Focus on ${pressurePoints.join(', ')} as creative catalysts. How can these constraints enhance rather than limit?`;
            }
          }
        }
      } else {
        // For invalid next steps, provide generic guidance
        nextStepGuidance = handler.getStepGuidance(9999, input.problem); // This will trigger the "Complete the" message
      }
    }

    // Generate execution metadata for memory context
    const executionMetadata = generateExecutionMetadata(
      input,
      session,
      currentInsights,
      isErgodicityResult(ergodicityResult) ? ergodicityResult.pathMemory : undefined
    );

    // Build response
    const response = responseBuilder.buildExecutionResponse(
      sessionId,
      operationData,
      currentInsights,
      nextStepGuidance,
      session.history.length,
      executionMetadata
    );

    // Add memory outputs to response
    const parsedResponse = JSON.parse(response.content[0].text) as Record<string, unknown>;
    Object.assign(parsedResponse, memoryOutputs);

    // Add reality assessment if present
    if (
      realityResult &&
      typeof realityResult === 'object' &&
      'realityAssessment' in realityResult &&
      realityResult.realityAssessment
    ) {
      parsedResponse.realityAssessment = realityResult.realityAssessment;
    }

    // Add complexity suggestion if needed
    if (
      complexityCheck &&
      typeof complexityCheck === 'object' &&
      'suggestion' in complexityCheck &&
      complexityCheck.suggestion
    ) {
      parsedResponse.sequentialThinkingSuggestion = complexityCheck.suggestion;
    }

    response.content[0].text = JSON.stringify(parsedResponse, null, 2);

    // Handle session completion
    if (!input.nextStepNeeded) {
      session.endTime = Date.now();

      // Final summary
      visualFormatter.formatSessionSummary(
        input.technique,
        input.problem,
        session.insights,
        session.metrics
      );

      // Add completion data
      const completedParsedResponse = JSON.parse(response.content[0].text) as Record<
        string,
        unknown
      >;
      const completedResponse = responseBuilder.addCompletionData(completedParsedResponse, session);
      response.content[0].text = JSON.stringify(completedResponse, null, 2);
    }

    // Auto-save if enabled
    if (input.autoSave) {
      try {
        await sessionManager.saveSessionToPersistence(sessionId);
      } catch (error) {
        // Auto-save error is added to response instead of console logging
        // console.error('Auto-save failed:', error);
        // Add auto-save failure to response
        const parsedResponse = JSON.parse(response.content[0].text) as Record<string, unknown>;
        parsedResponse.autoSaveError = error instanceof Error ? error.message : 'Auto-save failed';
        response.content[0].text = JSON.stringify(parsedResponse, null, 2);
      }
    }

    return response;
  } catch (error) {
    return responseBuilder.buildErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'execution'
    );
  }
}

function initializeSession(
  input: ExecuteThinkingStepInput,
  ergodicityManager: ErgodicityManager
): SessionData {
  const pathMemory = ergodicityManager.getPathMemory();

  return {
    technique: input.technique,
    problem: input.problem,
    history: [],
    branches: {},
    insights: [],
    startTime: Date.now(),
    lastActivityTime: Date.now(),
    pathMemory,
    ergodicityManager,
  };
}

function checkExecutionComplexity(
  input: ExecuteThinkingStepInput,
  session: SessionData,
  complexityAnalyzer: HybridComplexityAnalyzer
): { level: 'low' | 'medium' | 'high'; suggestion?: ComplexitySuggestion } {
  // Analyze current output complexity
  const assessment = complexityAnalyzer.analyze(input.output);

  // Check if complexity is increasing over time
  const recentOutputs = session.history
    .slice(-3)
    .map(h => h.output)
    .join(' ');
  const recentAssessment = complexityAnalyzer.analyze(recentOutputs);

  // Generate suggestion if complexity is high
  if (assessment.level === 'high' || recentAssessment.level === 'high') {
    return {
      level: 'high',
      suggestion: {
        complexityNote: 'High complexity detected in current thinking',
        suggestedApproach: {
          'Break down': 'Consider breaking this into smaller sub-problems',
          'Sequential analysis': 'Analyze each component separately before integration',
          'Visual mapping': 'Create a visual representation of the relationships',
          'Systematic review': 'Review each element systematically',
        },
      },
    };
  }

  return { level: assessment.level };
}

/**
 * Generate execution metadata for memory context
 */
function generateExecutionMetadata(
  input: ExecuteThinkingStepInput,
  session: SessionData,
  insights: string[],
  pathMemory?: PathMemory
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    techniqueEffectiveness: assessTechniqueEffectiveness(input, session, insights),
    pathDependenciesCreated: extractPathDependencies(input, pathMemory),
    flexibilityImpact: calculateFlexibilityImpact(input, session),
  };

  // Add noteworthy moment if something significant happened
  const noteworthyMoment = identifyNoteworthyMoment(input, session, insights);
  if (noteworthyMoment) {
    metadata.noteworthyMoment = noteworthyMoment;
  }

  // Add future relevance for key insights
  const futureRelevance = assessFutureRelevance(input, session);
  if (futureRelevance) {
    metadata.futureRelevance = futureRelevance;
  }

  return metadata;
}

/**
 * Assess technique effectiveness based on insights generated
 */
function assessTechniqueEffectiveness(
  input: ExecuteThinkingStepInput,
  session: SessionData,
  insights: string[]
): number {
  let effectiveness = 0.5; // Base effectiveness

  // More insights = higher effectiveness
  if (insights.length > 3) effectiveness += 0.2;
  else if (insights.length > 1) effectiveness += 0.1;

  // Risk awareness adds effectiveness
  if (input.risks && input.risks.length > 0) effectiveness += 0.1;

  // Antifragile properties increase effectiveness
  if (input.antifragileProperties && input.antifragileProperties.length > 0) {
    effectiveness += 0.15;
  }

  // Path impact analysis for SCAMPER
  if (input.technique === 'scamper' && input.pathImpact) {
    if (input.pathImpact.flexibilityRetention > 0.5) effectiveness += 0.1;
  }

  // Breakthrough moments
  if (input.provocation && input.principles) effectiveness += 0.2;

  return Math.min(1, effectiveness);
}

/**
 * Extract path dependencies created in this step
 */
function extractPathDependencies(
  input: ExecuteThinkingStepInput,
  pathMemory?: PathMemory
): string[] {
  const dependencies: string[] = [];

  // SCAMPER path dependencies
  if (input.pathImpact && input.pathImpact.dependenciesCreated) {
    dependencies.push(...input.pathImpact.dependenciesCreated);
  }

  // High commitment decisions
  if (input.pathImpact && input.pathImpact.commitmentLevel === 'high') {
    dependencies.push(`commitment to ${input.scamperAction || input.technique} approach`);
  }

  // Constraint creation
  if (
    pathMemory &&
    'pathHistory' in pathMemory &&
    Array.isArray(pathMemory.pathHistory) &&
    pathMemory.pathHistory.length > 0
  ) {
    const latestEvent = pathMemory.pathHistory[
      pathMemory.pathHistory.length - 1
    ] as unknown as Record<string, unknown>;
    if (
      'constraintsCreated' in latestEvent &&
      Array.isArray(latestEvent.constraintsCreated) &&
      latestEvent.constraintsCreated.length > 0
    ) {
      dependencies.push(...(latestEvent.constraintsCreated as string[]));
    }
  }

  return dependencies;
}

/**
 * Calculate flexibility impact of current step
 */
function calculateFlexibilityImpact(input: ExecuteThinkingStepInput, session: SessionData): number {
  // Direct flexibility score from SCAMPER
  if (input.flexibilityScore !== undefined) {
    return -(1 - input.flexibilityScore);
  }

  // Path impact based flexibility
  if (input.pathImpact) {
    return -(1 - input.pathImpact.flexibilityRetention);
  }

  // Check session's path memory for current flexibility
  if (session.pathMemory && session.pathMemory.currentFlexibility) {
    const currentFlex = session.pathMemory.currentFlexibility.flexibilityScore || 1;
    return -(1 - currentFlex) * 0.1; // Small impact based on current flexibility
  }

  // Default small negative impact
  return -0.05;
}

/**
 * Identify noteworthy moments in execution
 */
function identifyNoteworthyMoment(
  input: ExecuteThinkingStepInput,
  session: SessionData,
  insights: string[]
): string | undefined {
  // Breakthrough with provocation
  if (input.provocation && input.principles && input.principles.length >= 2) {
    return 'Provocation challenged multiple core assumptions';
  }

  // Parameter analysis in SCAMPER
  if (input.technique === 'scamper' && input.scamperAction === 'parameterize') {
    return 'Parameter analysis revealed hidden coupling';
  }

  // High antifragility discovery
  if (input.antifragileProperties && input.antifragileProperties.length >= 3) {
    return 'Multiple antifragile properties discovered';
  }

  // Critical risk identification
  if (input.risks && input.risks.length >= 5) {
    return 'Comprehensive risk analysis revealed critical vulnerabilities';
  }

  // Deep neural state work
  if (input.technique === 'neural_state' && input.suppressionDepth && input.suppressionDepth >= 8) {
    return 'Deep neural state suppression achieved';
  }

  // Temporal kairos moments
  if (
    input.technique === 'temporal_work' &&
    input.temporalLandscape?.kairosOpportunities &&
    input.temporalLandscape.kairosOpportunities.length > 0
  ) {
    return 'Kairos opportunities identified';
  }

  // Check if session history shows pattern of increasing insights
  if (insights.length > 3 && session.history.length > 5) {
    const recentInsightGrowth = insights.length / session.history.length;
    if (recentInsightGrowth > 0.5) {
      return 'High insight generation rate detected';
    }
  }

  // Check for flexibility recovery in session
  if (session.pathMemory && session.pathMemory.currentFlexibility) {
    const currentFlex = session.pathMemory.currentFlexibility.flexibilityScore || 0;
    if (currentFlex > 0.8 && session.history.length > 10) {
      return 'Maintained high flexibility despite complex exploration';
    }
  }

  return undefined;
}

/**
 * Assess future relevance of current insights
 */
function assessFutureRelevance(
  input: ExecuteThinkingStepInput,
  session: SessionData
): string | undefined {
  // Parameter patterns are widely applicable
  if (input.technique === 'scamper' && input.scamperAction === 'parameterize') {
    return 'This parameter coupling pattern appears in many system designs';
  }

  // Contradiction patterns repeat
  if (input.technique === 'triz' && input.contradiction) {
    return 'This contradiction type commonly appears in technical systems';
  }

  // Antifragile patterns are valuable
  if (input.antifragileProperties && input.antifragileProperties.length > 0) {
    return 'These antifragile properties can be applied to other systems';
  }

  // Cross-cultural patterns
  if (input.technique === 'cross_cultural' && input.parallelPaths) {
    return 'Parallel implementation patterns useful for diverse contexts';
  }

  // Check if session has generated reusable patterns
  if (session.insights && session.insights.length > 5) {
    const hasPatternWords = session.insights.some(
      insight =>
        insight.toLowerCase().includes('pattern') ||
        insight.toLowerCase().includes('principle') ||
        insight.toLowerCase().includes('framework')
    );
    if (hasPatternWords) {
      return 'Session has identified reusable patterns and principles';
    }
  }

  // Check for high-value technique combinations in session history
  const techniqueSequence = session.history.map(h => h.technique).slice(-3);
  if (techniqueSequence.length >= 3 && new Set(techniqueSequence).size >= 2) {
    return 'Multi-technique exploration pattern can be reused for similar problems';
  }

  return undefined;
}
