/**
 * Execution Layer
 * Handles the execution of thinking steps
 */
import { ErrorCode, PersistenceError, ValidationError } from '../errors/types.js';
import { monitorCriticalSectionAsync, addPerformanceSummary, } from '../utils/PerformanceIntegration.js';
import { ErrorContextBuilder } from '../core/ErrorContextBuilder.js';
import { ErrorHandler } from '../errors/ErrorHandler.js';
import { ErrorFactory } from '../errors/enhanced-errors.js';
// Risk and option generation imports are now handled by orchestrators
// Import new orchestrators
import { ExecutionValidator } from './execution/ExecutionValidator.js';
import { RiskAssessmentOrchestrator } from './execution/RiskAssessmentOrchestrator.js';
import { ErgodicityOrchestrator, REVERSIBILITY_COSTS } from './execution/ErgodicityOrchestrator.js';
import { ExecutionResponseBuilder } from './execution/ExecutionResponseBuilder.js';
import { EscalationPromptGenerator } from '../ergodicity/escalationPrompts.js';
// Import completion tracking components
import { CompletionGatekeeper } from './execution/CompletionGatekeeper.js';
import { evaluateAdvisoryGates } from './execution/advisoryGates.js';
import { attachSteeringFields } from './execution/attachSteeringFields.js';
/**
 * Cells of a nine_windows matrix the caller marked irreversible, as declared
 * constraints.
 *
 * The second content-provenance producer (#310). `nineWindowsMatrix[]` already
 * carries `irreversible: boolean` per cell — caller-supplied, validated cell by
 * cell by `ObjectFieldValidator` — and marking a cell irreversible is the same
 * shape as a downward `stepReversibility` claim: the caller declaring the world
 * is more committed than the server assumed. It reached `extractInsights` as
 * prose and never reached `pathsForeclosed`, which is the asymmetry this
 * closes.
 *
 * `past` cells are excluded. They describe what the system used to be, which is
 * history rather than a commitment made in this session; `present` and `future`
 * both count. The text is the cell's own `content` plus its `pathDependencies`,
 * matching the existing producer's use of the caller's own words and the
 * insight line `NineWindowsHandler` already emits for the same cell.
 *
 * Only reaches the reality state on ACTION steps — `trackStep` gates on that,
 * and nine_windows steps 7-9 are the action ones. A caller who marks cells on
 * the present row at steps 4-6 has them computed and discarded.
 *
 * Two things about counting, stated precisely because an earlier version of
 * this comment overclaimed and the overclaim was wrong.
 *
 * Within one matrix, cells are deduplicated here by their coordinates, last one
 * winning. `ReflexivityTracker` filters an incoming batch against the array as
 * it stood BEFORE the push, not against the batch itself, so three identical
 * cells in one call recorded three constraints — measured, `pathsForeclosed`
 * held the same string three times and `contentConstraintCount` read 3. Nothing
 * had exercised that path before, because the only other content producer emits
 * exactly one string per call and a batch of one cannot contain duplicates.
 *
 * Across calls, dedup is exact string equality, so repeating an unchanged
 * matrix on steps 7, 8 and 9 counts once — but a cell whose wording changes
 * between steps is a new string and counts again. That is why the step number
 * is deliberately NOT part of this text, though the sibling producer includes
 * it: adding it would make every repeat a new string and defeat the dedup
 * entirely.
 */
function irreversibleMatrixCells(input) {
    // Only for the technique the field belongs to. `nineWindowsMatrix` sits on
    // the shared input type, and its cell-by-cell validation in
    // `ValidationStrategies` sits under `case 'nine_windows'` — so on any other
    // technique the field is neither validated nor rejected. Measured before
    // adding this: a matrix sent on a scamper step recorded
    // "Caller-declared (nine_windows future system): …" against a scamper
    // session, from cells `ObjectFieldValidator` had never seen.
    if (input.technique !== 'nine_windows')
        return [];
    // The field is declared on the input type; every value below is still checked
    // at runtime, because it is caller input.
    const cells = input.nineWindowsMatrix;
    if (!Array.isArray(cells))
        return [];
    // Caller constraints deliberately bypass `validateTrackingInput`, which caps
    // actionDescription at 1000 characters — the bypass exists so a commitment
    // phrased without the tracker's six stems is not silently dropped. Nothing
    // else bounds them: `content` has no maxLength in the tool schema or the
    // validator, and the matrix has no length limit. These constraints are
    // persisted on every autosave and echoed into warnings, so cap both here.
    const MAX_CONTENT = 500;
    const MAX_CELLS = 64;
    // Keyed by cell coordinates so a matrix that repeats or restates a cell
    // contributes it once; later entries win, which keeps the newest wording.
    const byCoordinate = new Map();
    for (const raw of cells.slice(0, MAX_CELLS)) {
        const cell = raw;
        if (cell?.irreversible !== true)
            continue;
        if (cell.timeFrame !== 'present' && cell.timeFrame !== 'future')
            continue;
        if (typeof cell.content !== 'string' || cell.content.trim().length === 0)
            continue;
        const dependencies = Array.isArray(cell.pathDependencies)
            ? cell.pathDependencies
                .filter((d) => typeof d === 'string' && d.trim().length > 0)
                .map(d => d.trim())
            : [];
        const suffix = dependencies.length > 0 ? ` (path dependencies: ${dependencies.join(', ')})` : '';
        const where = typeof cell.systemLevel === 'string'
            ? `${cell.timeFrame} ${cell.systemLevel}`
            : cell.timeFrame;
        const content = cell.content.trim().slice(0, MAX_CONTENT);
        byCoordinate.set(where, `Caller-declared (nine_windows ${where}): ${content}${suffix}`.slice(0, MAX_CONTENT * 2));
    }
    return [...byCoordinate.values()];
}
/**
 * Which run of a repeated technique this step belongs to, or undefined.
 *
 * Undefined whenever the executor cannot know — a plan without repeats has
 * nothing to disambiguate. The reader gives an absent stamp the run of the
 * nearest stamped entry before it, else run 0 (see `runsOf` in
 * SessionCompletionTracker). So an entry written under a non-repeating plan in
 * the middle of run 1 stays in run 1, rather than being read as run 0 and
 * reported as a hole at a step the caller had sent. An earlier reader pooled
 * the whole session on any absence, which latched it back to the original
 * gap-masking; before that, inferring instead of stamping produced false
 * blocks in four measured shapes (#301).
 */
function resolveTechniqueInstance(plan, session, input, techniqueLocalStep) {
    if (!plan)
        return undefined;
    const instances = plan.workflow
        .map((w, i) => ({ index: i, technique: w.technique, steps: w.steps.length }))
        .filter(w => w.technique === input.technique);
    if (instances.length < 2)
        return undefined;
    // Plan-wide numbering resolves exactly: each run owns a distinct global
    // range, so the step number alone says which. Offsets are summed over the
    // whole workflow, not just this technique's entries.
    const planTotal = plan.workflow.reduce((sum, w) => sum + w.steps.length, 0);
    if (input.totalSteps === planTotal && planTotal !== instances[0].steps) {
        let offset = 0;
        for (const w of plan.workflow) {
            if (w.technique === input.technique && input.currentStep > offset) {
                if (input.currentStep <= offset + w.steps.length) {
                    return instances.findIndex(i => i.index === plan.workflow.indexOf(w));
                }
            }
            offset += w.steps.length;
        }
        return undefined;
    }
    // Technique-local numbering: a run begins at step 1, so the cursor advances
    // when step 1 arrives for a run that already holds one.
    //
    // Two earlier rules failed in opposite directions and both are worth naming,
    // because the shape that breaks each is the other one's normal case.
    //
    // Advancing on ANY recurring number mistook a re-sent step for a new run, so
    // a session where every step had actually executed was refused with "2 steps
    // were skipped" — a hard block on working input.
    //
    // Advancing only once a run held EVERY step never advanced past an
    // *incomplete* run, so a run 1 of 1,2,4 stamped run 2's entries as run 1.
    // That was worse than it sounds: the guidance that exists to catch a hole was
    // then reading the wrong run, precisely when a hole was present.
    //
    // Keying on step 1 separates them. A re-sent step 2 is not a run boundary; a
    // step 1 arriving for a run that already has one is, whether or not that run
    // finished. The case still ambiguous is a caller re-sending step 1 itself,
    // which reads as a new run — genuinely undecidable from the input, and rarer
    // than either shape above.
    let cursor = 0;
    let held = new Set();
    const advance = (local) => local === 1 && held.has(1) && cursor < instances.length - 1;
    for (const entry of session.history) {
        if (entry.technique !== input.technique)
            continue;
        const local = entry.techniqueLocalStep ?? entry.currentStep;
        if (advance(local)) {
            cursor += 1;
            held = new Set();
        }
        held.add(local);
    }
    // The step being stamped has not been pushed yet, so it is considered last.
    if (advance(techniqueLocalStep)) {
        cursor += 1;
    }
    return cursor;
}
export async function executeThinkingStep(input, sessionManager, techniqueRegistry, visualFormatter, metricsCollector, complexityAnalyzer, ergodicityManager, validationWarnings) {
    const errorContextBuilder = new ErrorContextBuilder();
    const errorHandler = new ErrorHandler();
    const sessionLock = sessionManager.getSessionLock();
    // Initialize orchestrators
    const executionValidator = new ExecutionValidator(sessionManager, techniqueRegistry, visualFormatter);
    const riskAssessmentOrchestrator = new RiskAssessmentOrchestrator(visualFormatter);
    const ergodicityOrchestrator = new ErgodicityOrchestrator(visualFormatter, ergodicityManager, sessionManager);
    const executionResponseBuilder = new ExecutionResponseBuilder(complexityAnalyzer, new EscalationPromptGenerator(), techniqueRegistry, sessionManager);
    // Initialize completion gatekeeper
    const completionGatekeeper = new CompletionGatekeeper();
    try {
        // Validate plan if provided
        const planValidation = executionValidator.validatePlan(input);
        if (!planValidation.isValid && planValidation.error) {
            return planValidation.error;
        }
        const plan = planValidation.plan;
        // A named session the server has not got in memory may be on disk. Try to
        // load it before the validator decides it does not exist.
        //
        // Without this, `ExecutionValidator` creates a NEW session under the id the
        // caller supplied and reports success. Measured across two server processes
        // sharing one PERSISTENCE_PATH: six committing steps saved with
        // flexibility 0.475 and a six-event path history, then a step in the second
        // process naming that same sessionId came back `historyLength: 1` and
        // flexibility 0.975. The stored work was on disk, intact, and ignored — and
        // the caller was told the step had succeeded.
        //
        // The CLI already does this in `hydrateSession` before calling in, which is
        // why `socketes` resumes and the MCP server does not. Doing it here covers
        // both, and leaves the CLI's own attempt harmless: it returns early when
        // the session is already in memory.
        if (input.sessionId && !sessionManager.getSession(input.sessionId)) {
            try {
                await sessionManager.loadSessionFromPersistence(input.sessionId);
            }
            catch {
                // Not on disk. The validator's existing behaviour takes over from here.
            }
        }
        // Get or create session (this will determine the sessionId we need to lock)
        const sessionValidation = executionValidator.validateAndGetSession(input, ergodicityManager);
        if (sessionValidation.error) {
            return sessionValidation.error;
        }
        const { session, sessionId } = sessionValidation;
        if (!session || !sessionId) {
            throw ErrorFactory.sessionNotFound(input.sessionId || 'unknown');
        }
        // Serialise same-technique steps on one session; different techniques get
        // different keys and advance concurrently, which is what the lock was
        // built for (#185).
        //
        // VERDICT, decided rather than assumed (#354): this lock is DEFENSIVE.
        // Three independent observable hunts could not tell it from a no-op —
        // history shape, ergodicityMetrics (which sits directly on the pathMemory
        // read/write spanning the await below), and persistence/insights/metrics/
        // reflexivity ordering — and the whole suite stays green with the acquire
        // replaced by `() => {}`. It also does not protect the shape that actually
        // races: concurrent CLI processes on one session are last-writer-wins,
        // measured losing a step five runs of five, because each process has its
        // own lock instance.
        //
        // It is kept because single-threaded atomicity of `history.push` is a
        // property of today's code, not a contract, and the stale-read window
        // between the ergodicity await and the push is real even though no probe
        // has caught it. Do not delete it on the strength of the negative results
        // above — and if you do, session-lock-is-acquired.test.ts goes red, which
        // is that test's entire job.
        const releaseLock = await sessionLock.acquireLock(sessionId, input.technique);
        try {
            // Get technique handler
            const handler = techniqueRegistry.getHandler(input.technique);
            // Calculate technique-local step
            const { techniqueLocalStep: calculatedTechniqueLocalStep, techniqueIndex, stepsBeforeThisTechnique, originalStep, wasNormalized, } = executionValidator.calculateTechniqueLocalStep(input, plan);
            // Validate step and get step info
            const stepValidation = executionValidator.validateStepAndGetInfo(input, calculatedTechniqueLocalStep, handler);
            // Check if we need to handle invalid step - either validation failed or step was normalized
            if (!stepValidation.isValid || wasNormalized) {
                // Handle invalid step gracefully with detailed context
                const techniqueInfo = handler.getTechniqueInfo();
                // Provide more detailed error message based on the scenario
                // Use originalStep from calculateTechniqueLocalStep for accurate checking
                let errorMessage = '';
                if (stepValidation.failure === 'data') {
                    // The step number is fine — the technique refused the step's data.
                    // Reported as a range error, this sent callers to fix a step number
                    // that was already correct: sending vacantSpaces as the strings the
                    // schema used to describe got "Step 2 is invalid for Reverse
                    // Benchmarking. Valid range is 1-5" for a step that is inside 1-5.
                    const named = stepValidation.rejectedFields ?? [];
                    const culprit = named.length > 0
                        ? `The problem is ${named.join(' or ')} — check the shape against the tool schema.`
                        : 'Check the fields this technique defines for this step against the tool schema.';
                    errorMessage = `Step ${originalStep} of ${techniqueInfo.name} rejected the data it was given. The step number is valid. ${culprit}`;
                }
                else if (originalStep < 1) {
                    errorMessage = `Step ${originalStep} is invalid. Steps must be positive integers starting from 1.`;
                }
                else if (originalStep > input.totalSteps) {
                    errorMessage = `Step ${originalStep} exceeds total steps (${input.totalSteps}) for the plan.`;
                }
                else {
                    // Derive the global range from where this technique's block actually
                    // starts. Multiplying the block index by this technique's own step
                    // count assumes every technique in the plan is the same length, so a
                    // plan of mixed techniques reported a range the step could never fall
                    // in — the second block of ['triz','scamper','triz'] was reported as
                    // 9-12 when it is really 13-16.
                    errorMessage = `Step ${originalStep} is invalid for ${techniqueInfo.name}. Valid range is 1-${techniqueInfo.totalSteps} (technique-local) or ${stepsBeforeThisTechnique + 1}-${stepsBeforeThisTechnique + techniqueInfo.totalSteps} (global).`;
                }
                const errorContext = errorContextBuilder.buildStepErrorContext({
                    providedStep: input.currentStep,
                    validRange: `1-${techniqueInfo.totalSteps}`,
                    technique: input.technique,
                    techniqueLocalStep: calculatedTechniqueLocalStep,
                    globalStep: input.currentStep,
                    message: errorMessage,
                });
                // Fail, rather than record nothing and report success.
                //
                // This used to return a success-shaped response with the problem buried
                // in executionMetadata.errorContext, while the history push further down
                // never ran. The caller saw exit 0, their output was discarded, the
                // session could never reach complete, and progress rendered above 100%
                // for the steps that had been saved. A step count that shrinks between
                // runs lands here — a technique trimmed, or a plan hydrated from disk by
                // a newer build.
                const isDataFailure = stepValidation.failure === 'data';
                throw new ValidationError(isDataFailure ? ErrorCode.INVALID_FIELD_VALUE : ErrorCode.INVALID_STEP, errorMessage, isDataFailure ? (stepValidation.rejectedFields?.[0] ?? 'stepData') : 'currentStep', {
                    ...errorContext,
                    technique: input.technique,
                    providedStep: input.currentStep,
                    validRange: `1-${techniqueInfo.totalSteps}`,
                    ...(isDataFailure ? { rejectedFields: stepValidation.rejectedFields } : {}),
                });
            }
            const { stepInfo, normalizedStep: techniqueLocalStep } = stepValidation;
            // Check for ergodicity prompts
            ergodicityOrchestrator.checkErgodicityPrompts(input, techniqueLocalStep);
            // Perform comprehensive risk assessment
            const riskAssessment = riskAssessmentOrchestrator.assessRisks(input, session);
            if (riskAssessment.requiresIntervention && riskAssessment.interventionResponse) {
                return riskAssessment.interventionResponse;
            }
            // Get mode indicator
            const modeIndicator = visualFormatter.getModeIndicator(input.technique, techniqueLocalStep);
            // Display visual output
            const visualOutput = visualFormatter.formatOutput(input.technique, input.problem, techniqueLocalStep, input.totalSteps, stepInfo, modeIndicator, input, session, plan);
            if (visualOutput && process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                // Only log if thought logging is enabled
                // IMPORTANT: Use stderr for visual output - stdout is reserved for JSON-RPC
                process.stderr.write(visualOutput);
            }
            // Handle SCAMPER path impact
            if (input.technique === 'scamper' && input.scamperAction) {
                const scamperHandler = handler;
                input.pathImpact = scamperHandler.analyzePathImpact(input.scamperAction, input.output, session.history);
                // Build modification history from session (previous steps only).
                // Each entry carries the action and its impact, not the prior step's
                // output text: the caller wrote that text, it lives in history, and
                // the session export returns it whole — re-echoing an 800-char
                // truncated copy of every prior output on every step was most of the
                // response's weight.
                input.modificationHistory = [];
                // Include previous SCAMPER modifications from history
                session.history.forEach(entry => {
                    if (entry.technique === 'scamper' &&
                        entry.scamperAction &&
                        entry.pathImpact &&
                        input.modificationHistory) {
                        input.modificationHistory.push({
                            action: entry.scamperAction,
                            timestamp: entry.timestamp || new Date().toISOString(),
                            impact: entry.pathImpact,
                            cumulativeFlexibility: entry.pathImpact.flexibilityRetention,
                        });
                    }
                });
                // Generate alternatives if flexibility is low.
                //
                // Read from the engine, not from `pathImpact.flexibilityRetention`:
                // that figure is SCAMPER's own running total, computed with its own
                // degradation factors, and it is not monotonic — so this second 0.4
                // gate disagreed with every other 0.4 gate in the codebase.
                const flexibilityBeforeStep = session.pathMemory?.currentFlexibility?.flexibilityScore ?? 1;
                if (flexibilityBeforeStep < 0.4) {
                    input.alternativeSuggestions = scamperHandler.generateAlternatives(input.scamperAction, flexibilityBeforeStep);
                }
            }
            // Track ergodicity and generate options if needed.
            //
            // `ergodicityResult.metrics` is taken as well as the flexibility score:
            // the adapter measures constraintLevel, optionSpaceSize and
            // pathDivergence on every step, and this call site used to drop all
            // three on the floor.
            const { currentFlexibility, optionGenerationResult, ergodicityResult } = await ergodicityOrchestrator.trackErgodicityAndGenerateOptions(input, session, techniqueLocalStep, sessionId, handler);
            // Record step in history. realityAssessment is excluded to avoid
            // duplication (it travels via realityResult); modificationHistory is
            // excluded because it is REBUILT from history on every step — storing
            // each step's copy made session growth quadratic, and nothing reads
            // the stored copies (the rebuild reads scamperAction/pathImpact).
            // advisoryFindings is stripped for a different reason than the other
            // two: it is SERVER-AUTHORED. The history entry is the audit record of
            // what the server flagged, so a caller-supplied array must never reach
            // it — otherwise a caller could forge the record that exists to catch
            // callers deviating.
            const { realityAssessment: inputRealityAssessment, modificationHistory: _rebuiltEachStep, advisoryFindings: _serverAuthoredOnly, ...inputWithoutReality } = input;
            // If there's a reality assessment from input, we should handle it separately
            if (inputRealityAssessment) {
                // Reality assessment is handled through realityResult and added to response separately
                // This prevents duplication in the operation data
            }
            const operationData = {
                ...inputWithoutReality,
                sessionId,
            };
            // Kept as a named reference: advisory findings are recorded onto this
            // entry after the gates run (the push spreads operationData, so
            // mutating operationData later would touch a different object).
            const historyEntry = {
                ...operationData,
                // The step within this technique, not within the plan. `currentStep`
                // is the global step, and handlers index their own step tables by it —
                // so a technique running second in a plan looked up positions past the
                // end of its own table and reported nothing at all. Recorded here
                // because this is where the offset is already known.
                techniqueLocalStep,
                // Which run of this technique the step belongs to, when the plan names
                // it more than once. Recorded HERE, at write time, with the plan and
                // the history both in hand — rather than inferred later from step
                // numbers, which cannot be done without false positives: a caller
                // re-sending a step without `isRevision` looks exactly like the start
                // of a new run, and inferring it that way blocked sessions in which
                // every step had in fact been executed (#301).
                //
                // Absent on entries written before this, and on plans with no repeat.
                // The reader gives an absent stamp the run of the nearest stamped entry
                // before it, else run 0 — see `runsOf`. It must NOT read absence as a
                // literal 0: an entry written under a non-repeating plan mid-run-1 would
                // then be reported as a hole in run 1 at a step the caller had sent.
                techniqueInstance: resolveTechniqueInstance(plan, session, input, techniqueLocalStep),
                timestamp: new Date().toISOString(),
            };
            session.history.push(historyEntry);
            // Track reflexivity for ANY technique that provides reflexivity data.
            // The tracker returns an edge-triggered warning (bucket crossing or new
            // content-derived foreclosure); it is emitted exactly once from here —
            // to stderr and into the response — so both surfaces always agree.
            let reflexivityWarning = null;
            try {
                const stepDetails = handler.getStepInfo(techniqueLocalStep);
                // Track if the handler provides reflexivity data (type field indicates StepInfo)
                if ('type' in stepDetails) {
                    const reflexiveEffects = 'reflexiveEffects' in stepDetails ? stepDetails.reflexiveEffects : undefined;
                    // A DOWNWARD reversibility claim (more committing than the server's
                    // prior) is real, caller-declared information about the world — the
                    // first content-provenance constraint producer. An upward claim
                    // reduces constraint and records nothing.
                    const audit = input.appliedReversibility;
                    const reversibilityConstraint = audit &&
                        input.stepReversibility &&
                        REVERSIBILITY_COSTS[audit.claimed] > REVERSIBILITY_COSTS[audit.prior]
                        ? [
                            `Caller-declared (${input.technique} step ${techniqueLocalStep}): ${input.stepReversibility.rationale}`,
                        ]
                        : [];
                    const callerConstraints = [...reversibilityConstraint, ...irreversibleMatrixCells(input)];
                    // Handler-declared effects are server-authored templates.
                    reflexivityWarning = sessionManager.trackReflexivity(sessionId, input.technique, techniqueLocalStep, stepDetails.type, reflexiveEffects, 'template', callerConstraints);
                }
            }
            catch {
                // Handler doesn't support StepInfo interface yet - skip reflexivity tracking
            }
            if (reflexivityWarning) {
                // 'critical' is reserved for steps where the server itself holds a
                // stop-worthy verdict; the tracker alone never escalates past
                // 'warning'.
                const recommendedAction = session.earlyWarningState?.recommendedAction;
                if (session.escapeRecommendation ||
                    recommendedAction === 'pivot' ||
                    recommendedAction === 'escape') {
                    reflexivityWarning = { ...reflexivityWarning, level: 'critical' };
                }
                if (process.env.DISABLE_REFLEXIVITY_WARNINGS !== 'true' &&
                    process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                    const warningDisplay = visualFormatter.formatReflexivityWarning(reflexivityWarning);
                    if (warningDisplay) {
                        process.stderr.write('\n' + warningDisplay + '\n');
                    }
                }
            }
            // Handle revisions and branches
            if (input.isRevision && input.revisesStep !== undefined) {
                // Performance monitoring for revision chains
                const revisionCount = session.history.filter(h => h.isRevision).length;
                if (revisionCount > 0 && revisionCount % 10 === 0) {
                    // Log performance warning every 10 revisions
                    const sessionDuration = Date.now() - (session.startTime || Date.now());
                    const avgRevisionTime = sessionDuration / revisionCount;
                    if (process.env.LOG_LEVEL === 'DEBUG' || process.env.NODE_ENV === 'development') {
                        process.stderr.write(`[Performance] Deep revision chain detected: ${revisionCount} revisions, avg time: ${avgRevisionTime.toFixed(2)}ms\n`);
                    }
                }
                if (!input.branchId) {
                    input.branchId = `branch_${Date.now()}`;
                }
                if (!session.branches[input.branchId]) {
                    session.branches[input.branchId] = [];
                }
                session.branches[input.branchId].push(operationData);
            }
            // Update metrics (recomputed from history; the step is already pushed)
            metricsCollector.updateMetrics(session);
            // Advisory findings (P1): the server's substance judgments, surfaced
            // instead of discarded. Never blocks; capped; omitted when empty.
            // Computed BEFORE the gatekeeper so a blocked termination still carries
            // them, and recorded onto the history entry so persistence and session
            // export can audit follow-vs-deviate after the fact.
            const advisoryFindings = evaluateAdvisoryGates(input, techniqueLocalStep, plan, validationWarnings);
            if (advisoryFindings.length > 0) {
                historyEntry.advisoryFindings = advisoryFindings;
            }
            const attachFindings = (target) => attachSteeringFields(target, advisoryFindings.length > 0 ? { advisoryFindings } : {});
            // The gatekeeper must vet a termination BEFORE the response is built:
            // buildResponse finalizes the session on nextStepNeeded=false (endTime,
            // completion telemetry, sessionComplete payload), endTime is never
            // cleared, and persistence reads endTime as status 'completed' — so a
            // vetoed termination must not reach any of that.
            const completionCheck = completionGatekeeper.canProceedToNextStep(input, session, plan);
            if (!completionCheck.allowed && completionCheck.response) {
                // Save before returning. The step is already in session.history, and
                // the veto is a decision about the shape of the response, not a
                // rollback — it happened either way. Returning here used to jump over
                // the autoSave block below, which a long-running server survives
                // because the next call saves the step, and the CLI does not: the
                // process exits and the caller has to re-send work the server accepted
                // (#307).
                //
                // Saving here cannot mark the session complete. buildResponse is what
                // sets endTime, and it has not run — this writes an active session.
                if (input.autoSave) {
                    try {
                        await monitorCriticalSectionAsync('session_autosave', () => sessionManager.saveSessionToPersistence(sessionId), { sessionId });
                    }
                    catch (error) {
                        // Report it the same way the success path does. An earlier version
                        // swallowed this, reasoning that a blocking response has no room
                        // for save status — but `attachFindings` below writes to this very
                        // object, and a silent failure is worst exactly where this fix
                        // matters: the CLI caller is told the step was refused, cannot tell
                        // it was also not saved, and loses it on exit anyway.
                        attachSteeringFields(completionCheck.response, error instanceof PersistenceError &&
                            error.code === ErrorCode.PERSISTENCE_NOT_AVAILABLE
                            ? {
                                autoSaveStatus: 'disabled',
                                autoSaveMessage: 'Persistence is not configured. Session data is stored in memory only.',
                            }
                            : {
                                autoSaveStatus: 'failed',
                                autoSaveError: error instanceof Error ? error.message : 'Auto-save failed',
                            });
                    }
                }
                // The blocking response is steering output too — findings ride it.
                attachFindings(completionCheck.response);
                return completionCheck.response;
            }
            // Build comprehensive execution response
            const response = executionResponseBuilder.buildResponse(input, session, sessionId, handler, techniqueLocalStep, techniqueIndex, plan, currentFlexibility, optionGenerationResult, ergodicityResult.metrics, reflexivityWarning);
            // Attached after buildResponse the same way the autoSave fields are —
            // deliberately past the verbosity filter, since findings are steering,
            // not echo.
            attachFindings(response);
            // Final summary for a completed session. buildResponse has already set
            // endTime and refreshed session.insights/metrics; this only renders them.
            if (!input.nextStepNeeded) {
                const summary = visualFormatter.formatSessionSummary(input.technique, input.problem, session.insights, session.metrics);
                if (summary && process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                    // IMPORTANT: Use stderr for visual output - stdout is reserved for JSON-RPC
                    process.stderr.write(`${summary}\n`);
                }
            }
            // Auto-save if enabled
            if (input.autoSave) {
                try {
                    await monitorCriticalSectionAsync('session_autosave', () => sessionManager.saveSessionToPersistence(sessionId), { sessionId });
                }
                catch (error) {
                    // Auto-save status rides the same past-the-verbosity-filter attach
                    // point as advisory findings — one mechanism, named once.
                    attachSteeringFields(response, error instanceof PersistenceError && error.code === ErrorCode.PERSISTENCE_NOT_AVAILABLE
                        ? {
                            autoSaveStatus: 'disabled',
                            autoSaveMessage: 'Persistence is not configured. Session data is stored in memory only.',
                        }
                        : {
                            autoSaveStatus: 'failed',
                            autoSaveError: error instanceof Error ? error.message : 'Auto-save failed',
                        });
                }
            }
            // Add performance summary if profiling is enabled
            return addPerformanceSummary(response);
        }
        finally {
            // Always release the session lock
            releaseLock();
        }
    }
    catch (error) {
        // Use standard error handler
        return errorHandler.handleError(error, 'execution', {
            technique: input.technique,
            step: input.currentStep,
            sessionId: input.sessionId,
        });
    }
}
//# sourceMappingURL=execution.js.map