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
        error: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: '❌ WORKFLOW ERROR: Plan not found',
                  message: `The planId '${input.planId}' does not exist. You cannot skip the planning step!`,
                  guidance: '⚠️ REQUIRED THREE-STEP WORKFLOW:',
                  workflow: [
                    '1️⃣ Call discover_techniques to analyze your problem',
                    '2️⃣ Call plan_thinking_session to create a plan (returns planId)',
                    '3️⃣ Call execute_thinking_step with the planId from step 2',
                  ],
                  example: {
                    correct_sequence: [
                      {
                        step: 1,
                        tool: 'discover_techniques',
                        args: { problem: 'Your problem here' },
                        returns: 'Recommended techniques',
                      },
                      {
                        step: 2,
                        tool: 'plan_thinking_session',
                        args: { problem: 'Your problem here', techniques: ['six_hats'] },
                        returns: { planId: 'plan_abc123', workflow: '...' },
                      },
                      {
                        step: 3,
                        tool: 'execute_thinking_step',
                        args: {
                          planId: 'plan_abc123', // ← Use the ACTUAL planId from step 2
                          technique: 'six_hats',
                          problem: 'Your problem here',
                          currentStep: 1,
                          totalSteps: 6,
                          output: 'Your thinking here',
                          nextStepNeeded: true,
                        },
                      },
                    ],
                  },
                  your_error: `You tried to use planId '${input.planId}' which doesn't exist`,
                  fix: '👉 Start over with discover_techniques',
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        },
      };
    }

    // Validate technique matches plan
    if (!plan.techniques.includes(input.technique)) {
      return {
        isValid: false,
        error: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: '❌ TECHNIQUE MISMATCH ERROR',
                  message: `You requested technique '${input.technique}' but your plan only includes: ${plan.techniques.join(', ')}`,
                  guidance: 'You must use one of the techniques from your plan',
                  yourPlan: {
                    planId: input.planId,
                    techniques: plan.techniques,
                  },
                  requestedTechnique: input.technique,
                  fix: `Change your technique parameter to one of: ${plan.techniques.join(', ')}`,
                  example: {
                    correct: {
                      planId: input.planId,
                      technique: plan.techniques[0], // Use first technique from plan
                      problem: input.problem,
                      currentStep: 1,
                      totalSteps: this.techniqueRegistry.getTechniqueSteps(plan.techniques[0]),
                      output: 'Your thinking here',
                      nextStepNeeded: true,
                    },
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        },
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
        } catch (error) {
          // Handle session creation errors (e.g. invalid session ID format)
          return {
            error: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      error: {
                        message:
                          'Invalid session ID format: ' +
                          (error instanceof Error
                            ? error.message
                            : 'The provided session ID format is invalid'),
                      },
                      guidance:
                        'Session IDs must be alphanumeric with underscores, hyphens, and dots only, maximum 64 characters',
                      providedSessionId: input.sessionId,
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            },
          };
        }
      } else {
        session = existingSession;
      }
    } else {
      // Create new session with auto-generated ID
      session = this.initializeSession(input, ergodicityManager);
      sessionId = this.sessionManager.createSession(session);
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
