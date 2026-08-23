/**
 * ErgodicityOrchestrator - Handles ergodicity and option generation pipeline
 * Extracted from executeThinkingStep to improve maintainability
 */
import { ErgodicityManager } from '../../ergodicity/index.js';
import { PathMemoryManager } from '../../ergodicity/pathMemory.js';
import { getErgodicityPrompt, getErgodicityGuidance } from '../../ergodicity/prompts.js';
import { OptionGenerationEngine } from '../../ergodicity/optionGeneration/engine.js';
import { monitorCriticalSectionAsync, wrapErgodicityManager, } from '../../utils/PerformanceIntegration.js';
import { ErgodicityResultAdapter } from './ErgodicityResultAdapter.js';
/**
 * The one cost per declared reversibility rung. Single source for
 * calculateImpact, the caller-claim clamp, and the execution layer's
 * claim-direction check — the ladder reads, most to least reversible:
 * high (0.10) → medium (0.50) → low (0.90) → very_low (0.95).
 */
export const REVERSIBILITY_COSTS = {
    high: 0.1,
    medium: 0.5,
    low: 0.9,
    very_low: 0.95,
};
/** Most-reversible first; adjacent entries are "one rung" apart. */
const REVERSIBILITY_LADDER = ['high', 'medium', 'low', 'very_low'];
/**
 * A caller claim moves the applied rung at most one step from the server's
 * prior — a bounded nudge, never an overwrite. Priors are handler-static, so
 * clamped claims cannot compound across steps.
 */
export function clampReversibilityClaim(prior, claimed) {
    const priorIndex = REVERSIBILITY_LADDER.indexOf(prior);
    const claimedIndex = REVERSIBILITY_LADDER.indexOf(claimed);
    const applied = Math.max(priorIndex - 1, Math.min(priorIndex + 1, claimedIndex));
    return REVERSIBILITY_LADDER[applied];
}
export class ErgodicityOrchestrator {
    visualFormatter;
    ergodicityManager;
    sessionManager;
    resultAdapter = new ErgodicityResultAdapter();
    constructor(visualFormatter, ergodicityManager, sessionManager // SessionManager - using unknown to avoid circular dependency
    ) {
        this.visualFormatter = visualFormatter;
        this.ergodicityManager = ergodicityManager;
        this.sessionManager = sessionManager;
    }
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
    managerFor(session) {
        // Seeded from whatever the session already spent, so a run resumed from
        // disk keeps its path history instead of starting again at 1.0.
        session.ergodicityManager ??= wrapErgodicityManager(new ErgodicityManager(undefined, session.pathMemory));
        return session.ergodicityManager;
    }
    /**
     * Check and display ergodicity prompts
     */
    checkErgodicityPrompts(input, techniqueLocalStep) {
        const ergodicityPrompt = getErgodicityPrompt(input.technique, techniqueLocalStep, input.problem);
        if (ergodicityPrompt) {
            // Add ergodicity check to the operation data
            const inputWithErgodicity = input;
            inputWithErgodicity.ergodicityCheck = {
                prompt: ergodicityPrompt.promptText,
                followUp: ergodicityPrompt.followUp,
                guidance: getErgodicityGuidance(input.technique),
                ruinCheckRequired: ergodicityPrompt.ruinCheckRequired,
            };
            // Log ergodicity prompt to stderr for user awareness
            if (process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                process.stderr.write('\n' + this.visualFormatter.formatErgodicityPrompt(ergodicityPrompt) + '\n');
            }
        }
    }
    /**
     * Track ergodicity and generate options if needed
     */
    async trackErgodicityAndGenerateOptions(input, session, techniqueLocalStep, sessionId = 'unknown', 
    // The technique's own handler, for what its steps declare about
    // reversibility. Optional so the ~20 existing call sites keep working; a
    // step with nothing declared falls back to the most reversible reading,
    // which costs the least rather than the most.
    handler) {
        // Calculate impact
        const impact = this.calculateImpact(input, handler, techniqueLocalStep);
        // Track ergodicity
        const ergodicityResult = await monitorCriticalSectionAsync('ergodicity_tracking', () => this.managerFor(session).recordThinkingStep(input.technique, techniqueLocalStep, input.output, impact, session), { technique: input.technique, step: techniqueLocalStep });
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
        const adaptedErgodicityResult = this.resultAdapter.adapt(ergodicityResult, currentFlexibility, session.pathMemory);
        // Record what the monitoring actually found, from the raw result.
        //
        // The note that stood here said session state was not updated "due to type
        // incompatibility between simplified adapted types and full SessionData
        // interface requirements". True of the adapted result, and beside the
        // point: `recordThinkingStep` returns `EarlyWarningState` and
        // `EscapeProtocol` already — exactly the types `SessionData` declares — and
        // the adapter is what flattens them, dropping sensor readings, compound
        // risk, critical barriers and the available escape routes.
        //
        // So the subsystem computed a warning state on every step and assigned it
        // nowhere. `ResponseBuilder`, `ExecutionResponseBuilder.addWarnings` and
        // `MetricsCollector` all read these fields and all read undefined, which is
        // why a session could reach `escape` internally and report nothing. Every
        // reader below has been complete this whole time; none of them was ever
        // given anything to read.
        if (ergodicityResult.earlyWarningState) {
            session.earlyWarningState = ergodicityResult.earlyWarningState;
        }
        // Assigned or cleared, never left behind. With no else-branch a protocol
        // outlived the condition that produced it: once escape fired at step 15,
        // step 19 reported `recommendedAction: 'pivot'` with the escape protocol
        // still attached — the response contradicting itself about what the
        // session should do.
        session.escapeRecommendation = ergodicityResult.escapeRecommendation;
        // Display flexibility warning if needed
        if (currentFlexibility < 0.4 && process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
            const flexibilityWarning = this.visualFormatter.formatFlexibilityWarning(currentFlexibility, input.alternativeSuggestions);
            if (flexibilityWarning) {
                process.stderr.write('\n' + flexibilityWarning + '\n');
            }
        }
        // Reflexivity warnings are emitted from the execution layer, which
        // receives the edge-triggered warning as trackStep's return value. This
        // used to recompute threshold state here, one step behind the response's
        // own copy.
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
        // Generate options only on the DOWNWARD CROSSING of the 0.4 threshold,
        // not on every step below it. Flexibility is a monotone-decreasing
        // product for ordinary steps, so a state-based gate re-emitted the same
        // canned block on every remaining step of the session; a re-fire now
        // requires genuine recovery above 0.4 (an escape credit) followed by a
        // fresh descent.
        let optionGenerationResult;
        if (currentFlexibility < 0.4 && this.previousFlexibility(session) >= 0.4) {
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
     * The session's flexibility as of the PREVIOUS step. The current step's
     * path event is already in pathHistory at gate time (recordThinkingStep
     * runs first), so "previous" is the product over all but the last event —
     * recomputed with the same clamped, finite-guarded recurrence the live
     * score uses. Derived from persisted pathMemory, so the crossing gate works
     * identically across the CLI's process-per-step model.
     */
    previousFlexibility(session) {
        const history = session.pathMemory?.pathHistory ?? [];
        return PathMemoryManager.computeFlexibilityScore(history.slice(0, -1));
    }
    /**
     * What this step commits, for the path record.
     *
     * Returns the ingredients only. `PathMemoryManager.recordPathEvent` derives
     * `flexibilityImpact` from them, so there is one derivation for every caller
     * — deriving it here meant any caller that did not go through this
     * orchestrator recorded steps that cost nothing at all.
     */
    calculateImpact(input, handler, techniqueLocalStep) {
        // What the step declares about itself, not what its prose happens to say.
        //
        // This used to read the caller's output for six words — eliminate, remove,
        // delete, commit, invest, permanent — as a plain substring match, and that
        // one boolean carried the entire dynamic range of the measure: 0.160 a
        // step against 0.005. It had no word boundaries and no notion of negation,
        // so "we should NOT remove the fallback" and "the committee met" both read
        // as maximal commitment while "signed the three-year lease, no way back"
        // read as idle exploration. The server's own step guidance uses those six
        // stems throughout, and SCAMPER's sixth step is named Eliminate, so a
        // model echoing its own prompt tripped the gate.
        //
        // Every step now declares how hard it is to undo, so the cost of a session
        // is a property of the steps it ran rather than of the words it chose. Two
        // sessions running the same technique cost the same, which is the honest
        // consequence: the server cannot read commitment out of prose, so it no
        // longer pretends to.
        const stepInfo = handler?.getStepInfo(techniqueLocalStep);
        const declared = stepInfo?.reversibility ?? stepInfo?.reflexiveEffects?.reversibility ?? 'high';
        // A caller may nudge the declared rung with `stepReversibility` — the
        // semantics the static tables cannot see (eliminating a lock-in ADDS real
        // freedom, yet every ELIMINATE is declared 'low'). The claim is bounded on
        // every axis that made the retired caller-assertion holes dangerous: one
        // rung at most, per step not aggregate, non-compounding (the prior is
        // handler-static), and only with an on-record rationale, echoed back as
        // an audit trail. An upward claim is a bounded refund, not control: an
        // upward-claimed eliminate still costs ~0.16 against 0.30, a chain of
        // claims still decays monotonically, and the 0.4 gates stay reachable.
        const claim = input.stepReversibility;
        let applied = declared;
        if (claim && claim.rationale?.trim()) {
            applied = clampReversibilityClaim(declared, claim.level);
            input.appliedReversibility = {
                prior: declared,
                claimed: claim.level,
                applied,
                clamped: applied !== claim.level,
            };
        }
        // Undoing is hard in inverse proportion to how reversible the step is.
        const reversibilityCost = REVERSIBILITY_COSTS[applied];
        // A thinking step binds nothing; an action step binds in proportion to how
        // hard it is to undo.
        const commitmentLevel = stepInfo?.type === 'action' ? Math.max(0.2, reversibilityCost) : 0.2;
        // SCAMPER's option lists are derived by its own handler — `execute`
        // overwrites whatever the caller sent — so they are the one path-impact
        // signal the measure can trust. A caller-supplied pathImpact is ignored:
        // twenty entries in `optionsOpened` used to pin flexibility at 1.0 through
        // maximally committal prose, which is the same hole the retired
        // `flexibilityScore` field opened, wearing a different name.
        // `execute` replaces `input.pathImpact` with the handler's own analysis
        // only when a `scamperAction` is present, so that is the one condition
        // under which this field is the server's own reading rather than the
        // caller's. Without the action, a caller could hand SCAMPER twenty
        // invented `optionsOpened` and buy back the cost of the step.
        const serverDerived = input.technique === 'scamper' && input.scamperAction ? input.pathImpact : undefined;
        // The echoed retention reads the same ladder the session actually
        // charges (1 − applied cost), replacing the verb-static degradation
        // product the handler used to compute — a history-length artifact that
        // reported near-zero retention regardless of what the step did.
        if (serverDerived) {
            serverDerived.flexibilityRetention = Math.max(0, 1 - reversibilityCost);
        }
        return {
            optionsClosed: serverDerived?.optionsClosed,
            optionsOpened: serverDerived?.optionsOpened,
            reversibilityCost,
            commitmentLevel,
            // The caller says whether this step reworks an earlier one, and until now
            // that statement stopped at `session.history`. `perfectionism` is the
            // barrier for revision without progress and it is the only consumer, so
            // without this the barrier had to infer rework from something else and
            // read a session that never revised as maximally perfectionist.
            isRevision: input.isRevision === true,
        };
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
    flexibilitySeries(session) {
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
    generateOptions(input, session, currentFlexibility, sessionId = 'unknown') {
        try {
            const optionEngine = new OptionGenerationEngine();
            const optionSessionData = {
                sessionId,
                startTime: session.startTime || Date.now(),
                problemStatement: input.problem,
                techniquesUsed: [input.technique],
                totalSteps: input.totalSteps,
                insights: session.insights,
                pathDependencyMetrics: {
                    optionSpaceSize: 100 * currentFlexibility,
                    // The measured value, not an invented 1 − flexibility: divergence
                    // and flexibility are different quantities under one field name.
                    pathDivergence: session.pathMemory?.currentFlexibility?.pathDivergence ?? 0,
                    commitmentDepth: session.pathMemory?.pathHistory?.length || session.history.length,
                    reversibilityIndex: currentFlexibility,
                },
            };
            const optionContext = {
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
                    // Fallback only (no pathMemory yet): an empty history has zero
                    // divergence, which is what the shared formula reports for it.
                    pathDivergence: 0,
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
            if (optionGenerationResult.options.length > 0 &&
                process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                process.stderr.write(`\n🔄 Option Generation activated (flexibility: ${currentFlexibility.toFixed(2)})\n`);
                process.stderr.write(`   Generated ${optionGenerationResult.options.length} options to increase flexibility\n\n`);
            }
            return optionGenerationResult;
        }
        catch (error) {
            console.error('Option generation failed:', error);
            // Continue without options rather than failing the whole step
            return undefined;
        }
    }
}
//# sourceMappingURL=ErgodicityOrchestrator.js.map