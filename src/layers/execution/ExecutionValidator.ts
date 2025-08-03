/**
 * ExecutionValidator - Handles validation logic for thinking step execution
 * Extracted from executeThinkingStep to improve maintainability
 */

import type {
  ExecuteThinkingStepInput,
  SessionData,
  LateralThinkingResponse,
} from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import type { SessionManager } from '../../core/SessionManager.js';
import type { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import type { TechniqueHandler } from '../../techniques/types.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
import type { ErgodicityManager } from '../../ergodicity/index.js';
import { ErrorContextBuilder } from '../../core/ErrorContextBuilder.js';
import { TelemetryCollector } from '../../telemetry/TelemetryCollector.js';

export interface ValidationResult {
  isValid: boolean;
  error?: LateralThinkingResponse;
  plan?: PlanThinkingSessionOutput;
  session?: SessionData;
  sessionId?: string;
  techniqueLocalStep?: number;
  techniqueIndex?: number;
  stepsBeforeThisTechnique?: number;
  handler?: TechniqueHandler;
  stepInfo?: { name: string; focus: string; emoji: string } | null;
}

export class ExecutionValidator {
  private errorBuilder = new ErrorContextBuilder();
  private telemetry = TelemetryCollector.getInstance();

  constructor(
    private sessionManager: SessionManager,
    private techniqueRegistry: TechniqueRegistry,
    private visualFormatter: VisualFormatter
  ) {}

  /**
   * Validate plan exists and technique matches
   */
  validatePlan(input: ExecuteThinkingStepInput): {
    isValid: boolean;
    error?: LateralThinkingResponse;
    plan?: PlanThinkingSessionOutput;
  } {
    if (!input.planId) {
      return { isValid: true }; // Plan is optional
    }

    const plan = this.sessionManager.getPlan(input.planId);
    if (!plan) {
      return {
        isValid: false,
        error: this.errorBuilder.buildWorkflowError('plan_not_found', {
          planId: input.planId,
        }),
      };
    }

    // Validate technique matches plan
    if (!plan.techniques.includes(input.technique)) {
      return {
        isValid: false,
        error: this.errorBuilder.buildWorkflowError('technique_mismatch', {
          planId: input.planId,
          technique: input.technique,
          expectedTechniques: plan.techniques,
        }),
        plan,
      };
    }

    return { isValid: true, plan };
  }

  /**
   * Get or create session
   */
  validateAndGetSession(
    input: ExecuteThinkingStepInput,
    ergodicityManager: ErgodicityManager
  ): {
    session?: SessionData;
    sessionId?: string;
    error?: LateralThinkingResponse;
  } {
    let session: SessionData;
    let sessionId = input.sessionId;

    if (sessionId) {
      const existingSession = this.sessionManager.getSession(sessionId);
      if (!existingSession) {
        // Create new session with the user-provided ID
        session = this.initializeSession(input, ergodicityManager);
        try {
          sessionId = this.sessionManager.createSession(session, sessionId);
          console.error(`Created new session with user-provided ID: ${sessionId}`);

          // Track session start and technique start
          this.telemetry.trackSessionStart(sessionId, input.problem.length).catch(console.error);
          this.telemetry.trackTechniqueStart(sessionId, input.technique).catch(console.error);
        } catch (error) {
          // Handle session creation errors (e.g. invalid session ID format)
          return {
            error: this.errorBuilder.buildSessionError({
              sessionId: input.sessionId,
              errorType: 'invalid_format',
              message:
                'Invalid session ID format: ' +
                (error instanceof Error
                  ? error.message
                  : 'The provided session ID format is invalid'),
            }),
          };
        }
      } else {
        session = existingSession;

        // Track technique start if this is the first step
        if (input.currentStep === 1) {
          this.telemetry.trackTechniqueStart(sessionId, input.technique).catch(console.error);
        }
      }
    } else {
      // Create new session with auto-generated ID
      session = this.initializeSession(input, ergodicityManager);
      sessionId = this.sessionManager.createSession(session);

      // Track session start and technique start
      this.telemetry.trackSessionStart(sessionId, input.problem.length).catch(console.error);
      this.telemetry.trackTechniqueStart(sessionId, input.technique).catch(console.error);
    }

    // Update session activity
    this.sessionManager.touchSession(sessionId);

    return { session, sessionId };
  }

  /**
   * Calculate technique-local step from cumulative step
   */
  calculateTechniqueLocalStep(
    input: ExecuteThinkingStepInput,
    plan?: PlanThinkingSessionOutput
  ): {
    techniqueLocalStep: number;
    techniqueIndex: number;
    stepsBeforeThisTechnique: number;
  } {
    let techniqueLocalStep = input.currentStep;
    let techniqueIndex = 0;
    let stepsBeforeThisTechnique = 0;

    if (input.planId && plan) {
      // Find which technique we're on and calculate local step
      for (let i = 0; i < plan.workflow.length; i++) {
        if (plan.workflow[i].technique === input.technique) {
          techniqueIndex = i;
          break;
        }
        stepsBeforeThisTechnique += plan.workflow[i].steps.length;
      }

      // Convert cumulative step to local step
      techniqueLocalStep = input.currentStep - stepsBeforeThisTechnique;
    }

    return { techniqueLocalStep, techniqueIndex, stepsBeforeThisTechnique };
  }

  /**
   * Validate step and get step info
   */
  validateStepAndGetInfo(
    input: ExecuteThinkingStepInput,
    techniqueLocalStep: number,
    handler: TechniqueHandler
  ): {
    isValid: boolean;
    stepInfo?: { name: string; focus: string; emoji: string } | null;
    normalizedStep: number;
  } {
    // Store original step for error reporting
    const originalLocalStep = techniqueLocalStep;

    // Check if the original step is invalid
    const isOriginalStepInvalid = !handler.validateStep(originalLocalStep, input);

    if (isOriginalStepInvalid) {
      // Handle invalid step - visual formatter expects this
      const modeIndicator = this.visualFormatter.getModeIndicator(
        input.technique,
        originalLocalStep
      );

      // Call visual formatter to trigger "Unknown" message output
      this.visualFormatter.formatOutput(
        input.technique,
        input.problem,
        originalLocalStep, // Use original invalid step
        input.totalSteps,
        null, // No stepInfo for invalid steps
        modeIndicator,
        input
      );

      return {
        isValid: false,
        stepInfo: null,
        normalizedStep: Math.max(1, techniqueLocalStep), // Ensure at least 1
      };
    }

    // Ensure techniqueLocalStep is at least 1 for validation
    const normalizedStep = techniqueLocalStep < 1 ? 1 : techniqueLocalStep;

    // Try to get step info, handle invalid steps gracefully
    let stepInfo;
    try {
      stepInfo = handler.getStepInfo(normalizedStep);
    } catch (error) {
      // Handle different error scenarios
      if (error instanceof RangeError) {
        console.warn(
          `Step ${normalizedStep} is out of range for ${input.technique}. Using default guidance.`
        );
        stepInfo = null;
      } else if (error instanceof TypeError) {
        console.error(`Handler method error for ${input.technique}:`, error.message);
        stepInfo = null;
      } else {
        console.error(`Unexpected error getting step info:`, error);
        stepInfo = null;
      }
    }

    return {
      isValid: true,
      stepInfo,
      normalizedStep,
    };
  }

  /**
   * Validate convergence technique usage
   */
  validateConvergenceTechnique(input: ExecuteThinkingStepInput): ValidationResult {
    if (input.technique === 'convergence') {
      // Convergence technique requires parallel results
      if (!input.parallelResults) {
        return {
          isValid: false,
          error: this.errorBuilder.buildGenericError(
            'Convergence technique requires parallel results',
            {
              technique: input.technique,
              hasParallelResults: false,
            }
          ),
        };
      }

      // Ensure parallel results is not empty
      if (input.parallelResults.length === 0) {
        return {
          isValid: false,
          error: this.errorBuilder.buildGenericError(
            'Convergence technique requires at least one parallel result',
            {
              technique: input.technique,
              parallelResultsCount: 0,
            }
          ),
        };
      }
    } else {
      // Non-convergence techniques should not have parallel-specific fields
      if (input.parallelResults) {
        return {
          isValid: false,
          error: this.errorBuilder.buildGenericError(
            'Non-convergence techniques should not have parallel results',
            {
              technique: input.technique,
              hasParallelResults: true,
            }
          ),
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Initialize a new session
   */
  private initializeSession(
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
}
