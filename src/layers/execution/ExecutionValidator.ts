/**
 * ExecutionValidator - Handles validation logic for thinking step execution
 * Extracted from executeThinkingStep to improve maintainability
 */

import type {
  ExecuteThinkingStepInput,
  SessionData,
  LateralThinkingResponse,
  LateralTechnique,
} from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import type { SessionManager } from '../../core/SessionManager.js';
import type { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import type { TechniqueHandler } from '../../techniques/types.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import { wrapErgodicityManager } from '../../utils/PerformanceIntegration.js';
import { ErrorContextBuilder } from '../../core/ErrorContextBuilder.js';
import { TelemetryCollector } from '../../telemetry/TelemetryCollector.js';
import { applyAssignedStimulus } from '../../techniques/decks/assignment.js';
import { ErrorFactory } from '../../errors/enhanced-errors.js';
import { ErrorHandler } from '../../errors/ErrorHandler.js';
import { SessionEncoder } from '../../core/session/SessionEncoder.js';

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
  private errorHandler = new ErrorHandler();

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

    // Check if planId is a base64 encoded session
    if (SessionEncoder.isEncodedSession(input.planId)) {
      // Validate the encoded session
      if (SessionEncoder.isValid(input.planId)) {
        // Decode the session and create a minimal plan from it
        const decodedSession = SessionEncoder.decode(input.planId);
        if (decodedSession) {
          const techniques =
            decodedSession.techniques || ([decodedSession.technique] as LateralTechnique[]);

          // Rebuild a minimal workflow rather than shipping `workflow: []` —
          // an empty workflow silently disabled the whole stimulus apparatus
          // (mismatch gate, 🎲 guidance) on resumed sessions, letting a
          // random_entry/po session re-roll freely after a restart. The
          // assignment is a pure function of `planId:technique:index`, so the
          // original draw is RECOVERABLE — but only when the encoding carries
          // the plan's ORDERED technique list. `techniques` is optional in the
          // encoded shape, and a single-technique fallback would rebuild at
          // index 0 and re-derive a DIFFERENT word than a plan that ran the
          // technique later, producing a false mismatch against a caller who
          // used the value the plan actually gave them. When the order is
          // unknown, assign nothing: a missing gate beats a lying one.
          const orderKnown = Array.isArray(decodedSession.techniques);
          const workflow = techniques.map((technique, techniqueIndex) => {
            let stepCount = 0;
            try {
              stepCount = this.techniqueRegistry
                .getHandler(technique)
                .getTechniqueInfo().totalSteps;
            } catch {
              stepCount = 0;
            }
            const steps = Array.from({ length: stepCount }, (_, i) => ({
              stepNumber: i + 1,
              description: '',
              expectedOutput: '',
            }));
            if (orderKnown) {
              applyAssignedStimulus(technique, techniqueIndex, decodedSession.planId, steps);
            }
            return { technique, steps };
          });

          const minimalPlan: PlanThinkingSessionOutput = {
            planId: decodedSession.planId,
            problem: decodedSession.problem,
            techniques,
            workflow,
            totalSteps: decodedSession.totalSteps,
            objectives: decodedSession.objectives,
            constraints: decodedSession.constraints,
            executionMode: 'sequential',
          };

          // Allow execution as the session is valid
          return { isValid: true, plan: minimalPlan };
        }
      }

      // Check why it's invalid for better error messages
      const decoded = SessionEncoder.decode(input.planId);
      const enhancedError = ErrorFactory.planNotFound(input.planId);

      if (decoded) {
        const age = Date.now() - decoded.timestamp;
        const expiryTime = 30 * 24 * 60 * 60 * 1000; // 30 days

        if (age > expiryTime) {
          // Session expired
          const daysAgo = Math.floor(age / (24 * 60 * 60 * 1000));
          return {
            isValid: false,
            error: this.errorHandler.handleError(enhancedError, 'planning', {
              planId: input.planId.substring(0, 20) + '...',
              message: `Session expired ${daysAgo} days ago (sessions expire after 30 days)`,
              suggestion: 'Please create a new plan to continue.',
            }),
          };
        } else if (decoded.currentStep > decoded.totalSteps) {
          // Invalid step
          return {
            isValid: false,
            error: this.errorHandler.handleError(enhancedError, 'planning', {
              planId: input.planId.substring(0, 20) + '...',
              message: `Invalid step ${decoded.currentStep} (max: ${decoded.totalSteps})`,
              suggestion: 'Session data may be corrupted. Please create a new plan.',
            }),
          };
        }
      }

      // Corrupted or invalid format
      return {
        isValid: false,
        error: this.errorHandler.handleError(enhancedError, 'planning', {
          message: 'Invalid session data format',
          suggestion: 'The session data appears corrupted. Please create a new plan.',
        }),
      };
    }

    // Regular planId. `getPlan` falls back to disk for a plan this process did
    // not issue, so a restart does not lose what was being executed (#316).
    const plan = this.sessionManager.getPlan(input.planId);
    if (!plan) {
      const enhancedError = ErrorFactory.planNotFound(input.planId);
      return {
        isValid: false,
        error: this.errorHandler.handleError(enhancedError, 'planning', {
          planId: input.planId,
        }),
      };
    }

    // Validate technique matches plan
    if (!plan.techniques.includes(input.technique)) {
      const planTechnique = plan.techniques[0]; // Use first technique as the expected one
      const enhancedError = ErrorFactory.techniqueMismatch(
        planTechnique,
        input.technique,
        input.planId
      );
      return {
        isValid: false,
        error: this.errorHandler.handleError(enhancedError, 'planning', {
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
      // Check if sessionId is base64 encoded
      if (SessionEncoder.isEncodedSessionId(sessionId)) {
        // Validate the encoded session
        if (SessionEncoder.isValidSession(sessionId)) {
          // Decode the session and create minimal session from it
          const decodedSession = SessionEncoder.decodeSession(sessionId);
          if (decodedSession) {
            // Extract the original sessionId
            const originalSessionId = decodedSession.sessionId;

            // Check if we have this session in memory
            const existingSession = this.sessionManager.getSession(originalSessionId);
            if (existingSession) {
              // Use existing session if found
              session = existingSession;
              sessionId = originalSessionId;
            } else {
              // Create minimal session from decoded state
              session = this.initializeSession(input, ergodicityManager);
              // Update session with decoded state
              session.problem = decodedSession.problem;
              session.technique = decodedSession.technique as LateralTechnique;
              // Restore history length if provided
              if (decodedSession.historyLength) {
                // Create placeholder history entries
                for (let i = 0; i < decodedSession.historyLength; i++) {
                  session.history.push({
                    currentStep: i + 1,
                    totalSteps: decodedSession.totalSteps,
                    technique: decodedSession.technique as LateralTechnique,
                    problem: decodedSession.problem,
                    output: decodedSession.lastOutput || `Step ${i + 1} output`,
                    nextStepNeeded: i + 1 < decodedSession.totalSteps,
                    timestamp: new Date().toISOString(),
                  });
                }
              }

              // Create session with original ID
              sessionId = this.sessionManager.createSession(session, originalSessionId);
              console.error(`Restored session from encoded state: ${originalSessionId}`);
            }

            // Track activity
            if (input.currentStep === 1) {
              this.telemetry.trackTechniqueStart(sessionId, input.technique).catch(console.error);
            }
          } else {
            // Invalid encoded session
            const enhancedError = ErrorFactory.sessionNotFound(sessionId);
            return {
              error: this.errorHandler.handleError(enhancedError, 'execution', {
                sessionId: 'Invalid or expired encoded session',
                suggestion: 'The encoded session may have expired. Please start a new session.',
              }),
            };
          }
        } else {
          // Expired or invalid encoded session
          const enhancedError = ErrorFactory.sessionNotFound(sessionId);
          return {
            error: this.errorHandler.handleError(enhancedError, 'execution', {
              sessionId: 'Expired encoded session',
              suggestion: 'The encoded session has expired. Please start a new session.',
            }),
          };
        }
      } else {
        // Regular sessionId - existing logic
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
            const message =
              error instanceof Error ? error.message : 'The provided session ID format is invalid';
            const enhancedError = ErrorFactory.invalidInput(
              'sessionId',
              'valid session ID format',
              input.sessionId
            );
            return {
              error: this.errorHandler.handleError(enhancedError, 'discovery', {
                sessionId: input.sessionId,
                errorType: 'invalid_format',
                message,
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
      }
    } else {
      // When no sessionId is provided but planId exists, derive sessionId from planId
      // This ensures parallel execution shares the same session
      if (input.planId) {
        // Use plan-derived sessionId for consistency across parallel calls
        sessionId = `session_${input.planId}`;

        // Check if this session already exists
        const existingSession = this.sessionManager.getSession(sessionId);
        if (existingSession) {
          session = existingSession;
          // Track technique start for this parallel execution
          if (input.currentStep === 1) {
            this.telemetry.trackTechniqueStart(sessionId, input.technique).catch(console.error);
          }
        } else {
          // Create new session with plan-derived ID
          session = this.initializeSession(input, ergodicityManager);
          sessionId = this.sessionManager.createSession(session, sessionId);

          // Track session start and technique start
          this.telemetry.trackSessionStart(sessionId, input.problem.length).catch(console.error);
          this.telemetry.trackTechniqueStart(sessionId, input.technique).catch(console.error);
        }
      } else {
        // Create new session with auto-generated ID (no planId provided)
        session = this.initializeSession(input, ergodicityManager);
        sessionId = this.sessionManager.createSession(session);

        // Track session start and technique start
        this.telemetry.trackSessionStart(sessionId, input.problem.length).catch(console.error);
        this.telemetry.trackTechniqueStart(sessionId, input.technique).catch(console.error);
      }
    }

    // Update session activity
    // Note: Don't await touchSession here to avoid deadlock since we'll lock in executeThinkingStep
    this.sessionManager.touchSession(sessionId).catch(console.error);

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
    originalStep: number;
    wasNormalized: boolean;
  } {
    const originalStep = input.currentStep;
    let techniqueLocalStep = input.currentStep;
    let techniqueIndex = 0;
    let stepsBeforeThisTechnique = 0;
    let wasNormalized = false;

    if (input.planId && plan) {
      // Collect every block this technique occupies, with where each one starts.
      //
      // A plan may name the same technique twice — planThinkingSession accepts
      // it and lays out separate blocks for each. The previous walk assigned
      // techniqueIndex on every match, so it ended on the *last* occurrence,
      // while stepsBeforeThisTechnique stopped accumulating at the *first*. The
      // two halves then described different blocks, and a step in the second
      // one landed in neither range: ['triz','scamper','triz'] produced a
      // 16-step workflow whose steps 13-16 could not be executed at all.
      const occurrences: Array<{ index: number; stepsBefore: number; steps: number }> = [];
      let totalPlanSteps = 0;

      for (let i = 0; i < plan.workflow.length; i++) {
        const steps = plan.workflow[i].steps.length;
        if (plan.workflow[i].technique === input.technique) {
          occurrences.push({ index: i, stepsBefore: totalPlanSteps, steps });
        }
        totalPlanSteps += steps;
      }

      // Prefer the block whose global range contains this step. A technique-local
      // number cannot distinguish one occurrence from another — nothing in the
      // input says which — so it resolves to the first, which is also what a
      // plan naming the technique once has always done.
      const containing = occurrences.find(
        o => input.currentStep > o.stepsBefore && input.currentStep <= o.stepsBefore + o.steps
      );
      const block = containing ?? occurrences[0];
      techniqueIndex = block?.index ?? 0;
      stepsBeforeThisTechnique = block?.stepsBefore ?? 0;

      // Determine if input.currentStep is global or technique-local
      // Global steps are in range 1 to totalPlanSteps
      // Technique-local steps are in range 1 to technique's step count
      const currentTechniqueSteps = plan.workflow[techniqueIndex]?.steps.length || 0;

      // Check if this could be a global step number
      // A step is global if it falls within the global range for this technique
      const globalStartForTechnique = stepsBeforeThisTechnique + 1;
      const globalEndForTechnique = stepsBeforeThisTechnique + currentTechniqueSteps;

      // `totalSteps` says which numbering the caller is using, and it is the
      // only thing that can. For any technique after the first, the two ranges
      // overlap — with a 3-step block ahead of a 5-step one, local 4 and 5 are
      // also global 4 and 5 — and guessing from `currentStep` alone resolved
      // both to the global reading, folding local steps 4 and 5 back onto 1
      // and 2. A caller numbering within the technique sends that technique's
      // own step count; a caller numbering across the plan sends the plan's.
      const callerNumbersWithinTechnique =
        currentTechniqueSteps > 0 &&
        input.totalSteps === currentTechniqueSteps &&
        input.totalSteps !== totalPlanSteps;

      // An explicit `numbering` is taken at its word, including when the step
      // it names is out of range. Routing it through the inference ladder
      // below would silently re-read a declared technique-local step as a
      // plan-wide one the moment it exceeded the technique's length — turning
      // a statement into another guess, which is the opposite of why the
      // parameter exists. An out-of-range step is then caught and reported by
      // step validation, where a wrong number belongs.
      if (input.numbering === 'technique') {
        techniqueLocalStep = input.currentStep;
      } else if (input.numbering === 'plan') {
        techniqueLocalStep = input.currentStep - stepsBeforeThisTechnique;
      } else if (
        callerNumbersWithinTechnique &&
        input.currentStep >= 1 &&
        input.currentStep <= currentTechniqueSteps
      ) {
        techniqueLocalStep = input.currentStep;
      } else if (
        input.currentStep >= globalStartForTechnique &&
        input.currentStep <= globalEndForTechnique &&
        input.currentStep <= totalPlanSteps
      ) {
        // This is a global step number for this technique
        techniqueLocalStep = input.currentStep - stepsBeforeThisTechnique;
      } else if (input.currentStep >= 1 && input.currentStep <= currentTechniqueSteps) {
        // This is a technique-local step number
        // Only treat as local if it's not in the global range
        // (avoids ambiguity when local and global ranges overlap)
        techniqueLocalStep = input.currentStep;
      } else if (input.currentStep > totalPlanSteps) {
        // Step number exceeds total plan steps
        console.error(`Step ${input.currentStep} exceeds total plan steps ${totalPlanSteps}`);
        techniqueLocalStep = Math.max(1, Math.min(input.currentStep, currentTechniqueSteps));
        wasNormalized = true;
      } else {
        // Step is outside this technique's range
        if (input.currentStep < globalStartForTechnique) {
          console.error(
            `Step ${input.currentStep} is before technique ${input.technique} which starts at global step ${globalStartForTechnique}`
          );
          techniqueLocalStep = 1;
          wasNormalized = true;
        } else {
          console.error(
            `Step ${input.currentStep} is after technique ${input.technique} which ends at global step ${globalEndForTechnique}`
          );
          techniqueLocalStep = currentTechniqueSteps;
          wasNormalized = true;
        }
      }
    }

    // Ensure techniqueLocalStep is never negative
    if (techniqueLocalStep < 1) {
      techniqueLocalStep = Math.max(1, techniqueLocalStep);
      wasNormalized = true;
    }

    return {
      techniqueLocalStep,
      techniqueIndex,
      stepsBeforeThisTechnique,
      originalStep,
      wasNormalized,
    };
  }

  /**
   * Name the fields a rejected step objected to.
   *
   * `validateStep` returns a bare boolean, so a handler that rejects
   * `vacantSpaces` for a missing `whyVacant` cannot say so. It is a pure
   * function of (step, data) though, so asking it again with one field removed
   * at a time identifies the culprit: a field whose absence makes the step
   * validate is a field whose value the handler refused.
   *
   * Only ever runs on the error path, and only over the fields the caller
   * actually sent. A handler that throws instead of returning false already
   * reports its own field, so a throw here just means "not this one".
   */
  private findRejectedFields(
    handler: TechniqueHandler,
    step: number,
    input: ExecuteThinkingStepInput
  ): string[] {
    const candidates = Object.keys(input).filter(key => {
      if (key === 'technique' || key === 'currentStep') return false;
      const value = input[key as keyof typeof input];
      return value !== null && value !== undefined;
    });

    return candidates.filter(field => {
      const withoutField = { ...input } as Record<string, unknown>;
      delete withoutField[field];
      try {
        return handler.validateStep(step, withoutField);
      } catch {
        return false;
      }
    });
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
    /**
     * Which of the two ways a step can fail. `range` is a step number outside
     * the technique; `data` is a step number the technique accepts carrying
     * fields it does not. Both used to be reported as `range`, so a mis-shaped
     * field produced "Valid range is 1-5" for a step that was already in 1-5 —
     * advice the caller could follow forever without getting anywhere.
     */
    failure?: 'range' | 'data';
    /** Fields whose removal makes the step validate. See findRejectedFields. */
    rejectedFields?: string[];
  } {
    // Store original step for error reporting before normalization
    const originalLocalStep = techniqueLocalStep;
    let wasNormalized = false;

    // Get technique info for validation
    const techniqueInfo = handler.getTechniqueInfo();
    const maxSteps = techniqueInfo.totalSteps;

    // Add validation to prevent negative step numbers
    if (techniqueLocalStep < 1) {
      console.error(
        `Invalid technique-local step ${techniqueLocalStep} for ${input.technique}. Step must be >= 1. Using step 1 as fallback.`
      );
      techniqueLocalStep = 1;
      wasNormalized = true;
    }

    // Check if step is out of bounds
    if (techniqueLocalStep > maxSteps) {
      console.error(
        `Step ${techniqueLocalStep} exceeds maximum steps (${maxSteps}) for ${input.technique}. Using last step as fallback.`
      );
      techniqueLocalStep = maxSteps;
      wasNormalized = true;
    }

    // Check if the original step is invalid (including negative or out of bounds)
    const rejectedByHandler = !wasNormalized && !handler.validateStep(originalLocalStep, input);
    const isOriginalStepInvalid = wasNormalized || rejectedByHandler;

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
        failure: rejectedByHandler ? 'data' : 'range',
        rejectedFields: rejectedByHandler
          ? this.findRejectedFields(handler, originalLocalStep, input)
          : undefined,
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
    _sharedErgodicityManager: ErgodicityManager
  ): SessionData {
    // A session gets its own manager. Reading the shared one here handed every
    // session the same live PathMemory object — not merely the same values, the
    // same object identity — so sessions aliased each other's commitments before
    // a single step ran. The shared instance is still accepted so the call
    // signature and its ~20 test call sites are unchanged; it is simply not the
    // one this session records into.
    const ergodicityManager = wrapErgodicityManager(new ErgodicityManager());
    const pathMemory = ergodicityManager.getPathMemory();

    const sessionData: SessionData = {
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

    // Add planId if provided
    if (input.planId) {
      sessionData.planId = input.planId;
    }

    return sessionData;
  }
}
