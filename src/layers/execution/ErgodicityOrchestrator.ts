/**
 * ErgodicityOrchestrator - Handles ergodicity and option generation pipeline
 * Extracted from executeThinkingStep to improve maintainability
 */

import type { ExecuteThinkingStepInput, SessionData } from '../../types/index.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type { PathMemory } from '../../ergodicity/types.js';
import type { ReflexivityWarning } from '../../core/ReflexivityTracker.js';
import { getErgodicityPrompt, getErgodicityGuidance } from '../../ergodicity/prompts.js';
import { OptionGenerationEngine } from '../../ergodicity/optionGeneration/engine.js';
import type {
  OptionGenerationContext,
  OptionGenerationResult,
  SessionData as OptionSessionData,
} from '../../ergodicity/optionGeneration/types.js';
import {
  monitorCriticalSectionAsync,
  wrapErgodicityManager,
} from '../../utils/PerformanceIntegration.js';
import { ErgodicityResultAdapter } from './ErgodicityResultAdapter.js';
import type { ErgodicityResult, ErgodicityManagerResult } from './ErgodicityResultAdapter.js';

export interface ErgodicityOrchestrationResult {
  ergodicityResult: ErgodicityResult;
  currentFlexibility: number;
  optionGenerationResult?: OptionGenerationResult;
  pathMemory?: PathMemory;
}

export class ErgodicityOrchestrator {
  private resultAdapter = new ErgodicityResultAdapter();

  constructor(
    private visualFormatter: VisualFormatter,
    private ergodicityManager: ErgodicityManager,
    private sessionManager?: unknown // SessionManager - using unknown to avoid circular dependency
  ) {}

  /**
   * The manager that owns this session's path memory and sensor readings.
   *
   * Path memory and the early-warning sensors are per-session state, but a
   * single manager was constructed once per server and handed to every call —
   * so one session's commitments depressed another's flexibility, and the
   * sensors' five-second reading cache served session B a measurement taken
   * for session A.
   *
   * `SessionData.ergodicityManager` already existed and was already populated;
   * nothing read it. This reads it.
   */
  private managerFor(session: SessionData): ErgodicityManager {
    // Seeded from whatever the session already spent, so a run resumed from
    // disk keeps its path history instead of starting again at 1.0.
    session.ergodicityManager ??= wrapErgodicityManager(
      new ErgodicityManager(undefined, session.pathMemory)
    );
    return session.ergodicityManager;
  }

  /**
   * Check and display ergodicity prompts
   */
  checkErgodicityPrompts(input: ExecuteThinkingStepInput, techniqueLocalStep: number): void {
    const ergodicityPrompt = getErgodicityPrompt(
      input.technique,
      techniqueLocalStep,
      input.problem
    );

    if (ergodicityPrompt) {
      // Add ergodicity check to the operation data
      const inputWithErgodicity = input as ExecuteThinkingStepInput & { ergodicityCheck: unknown };
      inputWithErgodicity.ergodicityCheck = {
        prompt: ergodicityPrompt.promptText,
        followUp: ergodicityPrompt.followUp,
        guidance: getErgodicityGuidance(input.technique),
        ruinCheckRequired: ergodicityPrompt.ruinCheckRequired,
      };

      // Log ergodicity prompt to stderr for user awareness
      if (process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
        process.stderr.write(
          '\n' + this.visualFormatter.formatErgodicityPrompt(ergodicityPrompt) + '\n'
        );
      }
    }
  }

  /**
   * Track ergodicity and generate options if needed
   */
  async trackErgodicityAndGenerateOptions(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    techniqueLocalStep: number,
    sessionId: string = 'unknown'
  ): Promise<ErgodicityOrchestrationResult> {
    // Calculate impact
    const impact = this.calculateImpact(input);

    // Track ergodicity
    const ergodicityResult = await monitorCriticalSectionAsync(
      'ergodicity_tracking',
      () =>
        this.managerFor(session).recordThinkingStep(
          input.technique,
          techniqueLocalStep,
          input.output,
          impact,
          session
        ),
      { technique: input.technique, step: techniqueLocalStep }
    );

    // Update session with ergodicity data
    session.pathMemory = this.managerFor(session).getPathMemory();

    // Calculate current flexibility.
    //
    // Measured, not accepted. `input.flexibilityScore` used to win over the
    // engine's own number, which meant a caller could type 0.05 and trip every
    // barrier warning in the codebase, or type 1.0 and silence them — and,
    // since the engine measured nothing for thirty-one of thirty-two
    // techniques, typing it was the only way any of those gates ever fired.
    const currentFlexibility = session.pathMemory?.currentFlexibility?.flexibilityScore ?? 1.0;

    // Adapt the result to the expected format
    const adaptedErgodicityResult = this.resultAdapter.adapt(
      ergodicityResult as ErgodicityManagerResult,
      currentFlexibility,
      session.pathMemory
    );

    // Note: Not updating session state with adapted ergodicity data
    // due to type incompatibility between simplified adapted types
    // and full SessionData interface requirements

    // Display flexibility warning if needed
    if (currentFlexibility < 0.4 && process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
      const flexibilityWarning = this.visualFormatter.formatFlexibilityWarning(
        currentFlexibility,
        input.alternativeSuggestions
      );
      if (flexibilityWarning) {
        process.stderr.write('\n' + flexibilityWarning + '\n');
      }
    }

    // Display reflexivity warning if available and not disabled
    if (
      this.sessionManager &&
      process.env.DISABLE_REFLEXIVITY_WARNINGS !== 'true' &&
      process.env.DISABLE_THOUGHT_LOGGING !== 'true'
    ) {
      try {
        // Access reflexivity tracker through sessionManager
        // Using type guard to safely access reflexivityTracker
        const sessionManagerWithTracker = this.sessionManager as unknown as {
          reflexivityTracker?: {
            generateWarning: (sessionId: string) => ReflexivityWarning | null;
          };
        };
        const reflexivityTracker = sessionManagerWithTracker.reflexivityTracker;
        if (reflexivityTracker && typeof reflexivityTracker.generateWarning === 'function') {
          const reflexivityWarning: ReflexivityWarning | null =
            reflexivityTracker.generateWarning(sessionId);
          if (reflexivityWarning) {
            const warningDisplay =
              this.visualFormatter.formatReflexivityWarning(reflexivityWarning);
            if (warningDisplay) {
              process.stderr.write('\n' + warningDisplay + '\n');
            }
          }
        }
      } catch {
        // Silently ignore errors to avoid breaking execution
        // Warnings are informational only
      }
    }

    // Display escape recommendations if available
    if (session.escapeRecommendation && process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
      const escapeRoutes = session.escapeRecommendation.steps.slice(0, 3).map((step, i) => ({
        name: `Step ${i + 1}`,
        description: step,
      }));
      const escapeDisplay = this.visualFormatter.formatEscapeRecommendations(escapeRoutes);
      if (escapeDisplay) {
        process.stderr.write('\n' + escapeDisplay + '\n');
      }
    }

    // Generate options if flexibility is low
    let optionGenerationResult: OptionGenerationResult | undefined;
    if (currentFlexibility < 0.4) {
      optionGenerationResult = this.generateOptions(input, session, currentFlexibility, sessionId);
    }

    return {
      ergodicityResult: adaptedErgodicityResult,
      currentFlexibility,
      optionGenerationResult,
      pathMemory: session.pathMemory,
    };
  }

  /**
   * Does what the step says it did read as a commitment?
   *
   * A blunt lexical signal, and the only content-sensitivity in the whole
   * measurement. It used to be applied to thirty-one techniques and withheld
   * from SCAMPER, whose costs came entirely from a fixed action table — so a
   * SCAMPER run of all eight actions produced an identical curve whether its
   * modifications were sketches or irreversible commitments, and could not
   * reach the 0.4 gate on any wording at all.
   */
  private outputSignalsCommitment(output: string): boolean {
    const outputLower = output.toLowerCase();
    const highCommitmentWords = ['eliminate', 'remove', 'delete', 'commit', 'invest', 'permanent'];
    return highCommitmentWords.some(word => outputLower.includes(word));
  }

  /**
   * What this step commits, for the path record.
   *
   * Returns the ingredients only. `PathMemoryManager.recordPathEvent` derives
   * `flexibilityImpact` from them, so there is one derivation for every caller
   * — deriving it here meant any caller that did not go through this
   * orchestrator recorded steps that cost nothing at all.
   */
  private calculateImpact(input: ExecuteThinkingStepInput): {
    optionsClosed?: string[];
    optionsOpened?: string[];
    reversibilityCost?: number;
    commitmentLevel?: number;
  } {
    if (input.pathImpact) {
      // Use specific path impact from SCAMPER
      const pathImpact = input.pathImpact;

      // Both per-step facts about this one modification. Deliberately NOT
      // `flexibilityRetention`: `ScamperHandler.analyzePathImpact` computes
      // that from the whole prior history — a cumulative-commitment factor, a
      // penalty per high-commitment action already taken, and a further factor
      // per step — so it is a running total, not a step's cost. Feeding it to
      // a running total drove a four-step session to 0.005, and dividing it by
      // the previous reading only traded that for a ratchet, because the
      // handler's retention is not monotonic: `adapt` after `combine` reports
      // more retention than `combine` did.
      //
      // `reversible` and `commitmentLevel` describe this modification alone,
      // which is what the product over the path history needs. SCAMPER is then
      // measured on exactly the same bounded scale as every other technique.
      const fromAction =
        pathImpact.commitmentLevel === 'low'
          ? 0.2
          : pathImpact.commitmentLevel === 'medium'
            ? 0.5
            : pathImpact.commitmentLevel === 'high'
              ? 0.8
              : 1.0;

      // The more severe of what the action is and what the step says it did.
      // The action table is fixed, so on the action alone SCAMPER's curve is
      // identical for every session running the same eight actions.
      const hasHighCommitment = this.outputSignalsCommitment(input.output);
      const reversibilityCost = Math.max(
        pathImpact.reversible ? 0.3 : 0.9,
        hasHighCommitment ? 0.8 : 0
      );
      const commitmentLevel = Math.max(fromAction, hasHighCommitment ? 0.8 : 0);

      return {
        optionsClosed: pathImpact.optionsClosed,
        optionsOpened: pathImpact.optionsOpened,
        reversibilityCost,
        commitmentLevel,
      };
    } else {
      // Use technique profile for ergodicity tracking
      // Shared instance is correct here: analyzeTechniqueImpact is a pure lookup table.
      const techniqueProfile = this.ergodicityManager.analyzeTechniqueImpact(input.technique);

      const hasHighCommitment = this.outputSignalsCommitment(input.output);

      const reversibilityCost = hasHighCommitment ? 0.8 : 1 - techniqueProfile.typicalReversibility;
      const commitmentLevel = hasHighCommitment ? 0.8 : techniqueProfile.typicalCommitment;

      return {
        reversibilityCost,
        commitmentLevel,
      };
    }
  }

  /**
   * Flexibility after each recorded step, as the engine measures it.
   *
   * The running product of (1 − flexibilityImpact) over the path history —
   * the same quantity `updateFlexibilityMetrics` reports, so every point of
   * the series is the number the gates read at that step. It used to plot
   * SCAMPER's own retention for SCAMPER steps and a straight 1.0 − 0.1·i
   * placeholder for everything else, neither of which anything else used.
   */
  private flexibilitySeries(
    session: SessionData
  ): Array<{ step: number; score: number; timestamp: number }> {
    const history = session.pathMemory?.pathHistory ?? [];
    let product = 1;
    return history.map(event => {
      product *= 1 - (event.flexibilityImpact ?? 0);
      return {
        step: event.step,
        score: product,
        timestamp: Date.parse(event.timestamp) || Date.now(),
      };
    });
  }

  /**
   * Generate options when flexibility is low
   */
  private generateOptions(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    currentFlexibility: number,
    sessionId: string = 'unknown'
  ): OptionGenerationResult | undefined {
    try {
      const optionEngine = new OptionGenerationEngine();
      const optionSessionData: OptionSessionData = {
        sessionId,
        startTime: session.startTime || Date.now(),
        problemStatement: input.problem,
        techniquesUsed: [input.technique],
        totalSteps: input.totalSteps,
        insights: session.insights,
        pathDependencyMetrics: {
          optionSpaceSize: 100 * currentFlexibility,
          pathDivergence: 1 - currentFlexibility,
          commitmentDepth: session.pathMemory?.pathHistory?.length || session.history.length,
          reversibilityIndex: currentFlexibility,
        },
      };

      const optionContext: OptionGenerationContext = {
        sessionState: {
          id: sessionId,
          problem: input.problem,
          technique: input.technique,
          currentStep: input.currentStep,
          totalSteps: input.totalSteps,
          history: session.history.map(h => ({
            step: h.currentStep,
            timestamp: h.timestamp || new Date().toISOString(),
            input: h,
            output: h,
          })),
          branches: session.branches,
          insights: session.insights,
          startTime: session.startTime,
          endTime: session.endTime,
          metrics: session.metrics,
        },
        currentFlexibility: session.pathMemory?.currentFlexibility || {
          flexibilityScore: currentFlexibility,
          pathDivergence: 1 - currentFlexibility,
          reversibilityIndex: currentFlexibility,
          barrierProximity: [],
          optionVelocity: 0,
          commitmentDepth: session.history.length,
        },
        pathMemory: {
          pathHistory: session.history.map(h => ({
            timestamp: h.timestamp || new Date().toISOString(),
            technique: h.technique,
            step: h.currentStep,
            decision: h.output,
            optionsOpened: [],
            optionsClosed: [],
            reversibilityCost: 0.5,
            commitmentLevel: 0.5,
            constraintsCreated: [],
          })),
          constraints: session.pathMemory?.constraints || [],
          // The running product the engine actually measures, so the series
          // and the number the gates read are the same quantity. This plotted
          // SCAMPER's own retention for SCAMPER steps and a straight
          // 1.0 − 0.1·i placeholder for everything else, neither of which the
          // rest of the system uses for anything.
          flexibilityOverTime: this.flexibilitySeries(session),
          absorbingBarriers: session.pathMemory?.absorbingBarriers || [],
        },
        sessionData: optionSessionData,
      };

      const optionGenerationResult = optionEngine.generateOptions(optionContext);

      // Log to stderr for visibility
      if (
        optionGenerationResult.options.length > 0 &&
        process.env.DISABLE_THOUGHT_LOGGING !== 'true'
      ) {
        process.stderr.write(
          `\n🔄 Option Generation activated (flexibility: ${currentFlexibility.toFixed(2)})\n`
        );
        process.stderr.write(
          `   Generated ${optionGenerationResult.options.length} options to increase flexibility\n\n`
        );
      }

      return optionGenerationResult;
    } catch (error) {
      console.error('Option generation failed:', error);
      // Continue without options rather than failing the whole step
      return undefined;
    }
  }
}
