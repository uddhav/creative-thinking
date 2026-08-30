/**
 * SessionCompletionTracker - Tracks session progress and completion status
 * Provides warnings and guidance for incomplete execution flows
 */
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
/**
 * Critical steps that should not be skipped for specific problem types
 */
const CRITICAL_STEPS = {
    risk_analysis: [
        { technique: 'six_hats', step: 'Black Hat', reason: 'Critical risk assessment perspective' },
        { technique: 'triz', step: 'Contradiction', reason: 'Identifies fundamental conflicts' },
        { technique: 'scamper', step: 'Eliminate', reason: 'Explores removal of risky elements' },
    ],
    technical_systems: [
        { technique: 'triz', step: 'All', reason: 'Systematic innovation principles' },
        { technique: 'scamper', step: 'Parameterize', reason: 'Technical parameter optimization' },
    ],
    user_experience: [
        { technique: 'design_thinking', step: 'Empathize', reason: 'User understanding foundation' },
        { technique: 'six_hats', step: 'Red Hat', reason: 'Emotional user responses' },
    ],
};
/**
 * Which run of a repeated technique a history entry belongs to.
 *
 * The executor stamps `techniqueInstance` at write time, when it has the plan
 * and the history in hand (#369). An entry with no stamp is run 0: the
 * pre-stamp world only ever had one run, and a plan with no repeats writes no
 * stamp because there is nothing to disambiguate.
 *
 * This is the single place both readers get the answer from. They previously
 * each decided for themselves, all-or-nothing per session, and disagreed.
 */
function runOf(entry) {
    return entry.techniqueInstance ?? 0;
}
/**
 * Tracks session completion and provides warnings
 */
export class SessionCompletionTracker {
    DEFAULT_MINIMUM_THRESHOLD = 0.8; // 80% completion recommended
    WARNING_THRESHOLD = 0.5; // 50% triggers warnings
    CRITICAL_THRESHOLD = 0.3; // 30% triggers critical warnings
    /**
     * Calculate session completion metadata
     */
    /**
     * @param isTerminating whether this step ends the session. Incompleteness is
     * only a problem when there will be no further steps; mid-session it is just
     * progress, and saying otherwise on every early step taught callers to ignore
     * the warnings entirely.
     */
    calculateCompletionMetadata(session, plan, isTerminating = false) {
        if (!plan) {
            // No plan means single technique execution
            return this.calculateSingleTechniqueCompletion(session);
        }
        const techniqueStatuses = this.calculateTechniqueStatuses(session, plan, isTerminating);
        const overallProgress = this.calculateOverallProgress(techniqueStatuses, plan);
        const skippedTechniques = this.identifySkippedTechniques(techniqueStatuses);
        const missedPerspectives = this.identifyMissedPerspectives(techniqueStatuses, skippedTechniques);
        const criticalGaps = this.identifyCriticalGaps(session.problem, techniqueStatuses);
        const warnings = this.generateCompletionWarnings(overallProgress, techniqueStatuses, criticalGaps, isTerminating);
        return {
            overallProgress,
            totalPlannedSteps: plan.totalSteps,
            completedSteps: this.countCompletedSteps(techniqueStatuses),
            techniqueStatuses,
            skippedTechniques,
            missedPerspectives,
            criticalGapsIdentified: criticalGaps,
            completionWarnings: warnings,
            minimumThresholdMet: overallProgress >= this.DEFAULT_MINIMUM_THRESHOLD,
        };
    }
    /**
     * Check if session should be allowed to proceed to synthesis
     */
    canProceedToSynthesis(metadata) {
        // No test-environment exemption. Suppressing this under vitest meant the
        // suite could never observe the block, which is exactly how a guard rots.
        const totalSkippedSteps = metadata.techniqueStatuses.reduce((sum, s) => sum + s.skippedSteps.length, 0);
        if (totalSkippedSteps > 0) {
            return {
                allowed: false,
                reason: `❌ BLOCKED: ${totalSkippedSteps} steps were skipped. ALL steps MUST be executed sequentially.`,
                requiredActions: [
                    `MANDATORY: Execute ALL skipped steps`,
                    ...metadata.techniqueStatuses
                        .filter(s => s.skippedSteps.length > 0)
                        .map(s => `Complete ${s.technique} steps: ${s.skippedSteps.join(', ')}`),
                ],
            };
        }
        // Check critical gaps
        if (metadata.criticalGapsIdentified.length > 0) {
            return {
                allowed: false,
                reason: '❌ BLOCKED: Critical analysis gaps detected. These MUST be addressed.',
                requiredActions: metadata.criticalGapsIdentified,
            };
        }
        // Check minimum threshold with stricter enforcement
        if (!metadata.minimumThresholdMet) {
            return {
                allowed: false,
                reason: `❌ BLOCKED: Only ${Math.round(metadata.overallProgress * 100)}% complete. MINIMUM 80% REQUIRED.`,
                requiredActions: [
                    `MANDATORY: Complete ${metadata.totalPlannedSteps - metadata.completedSteps} remaining steps`,
                    `DO NOT skip any steps - each builds on previous insights`,
                    ...metadata.skippedTechniques.map(t => `Execute ALL steps for ${t} technique`),
                ],
            };
        }
        // Check for important missed perspectives with stricter limit
        if (metadata.missedPerspectives.length > 1) {
            return {
                allowed: false,
                reason: '⚠️ INSUFFICIENT COVERAGE: Critical perspectives missing for valid analysis',
                requiredActions: [
                    `REQUIRED: Address these perspectives`,
                    ...metadata.missedPerspectives.map(p => `• ${p}`),
                ],
            };
        }
        // Final check - warn only if below 90% but still allow
        if (metadata.overallProgress < 0.9) {
            // For backward compatibility with tests, only add reason if explicitly needed
            // The warning is already in the completionWarnings array
            return { allowed: true };
        }
        return { allowed: true };
    }
    /**
     * Generate progress display string
     */
    formatProgressDisplay(metadata) {
        const progressBar = this.createProgressBar(metadata.overallProgress);
        const percentage = Math.round(metadata.overallProgress * 100);
        const stepsDisplay = `${metadata.completedSteps}/${metadata.totalPlannedSteps} steps`;
        let display = `Progress: ${progressBar} ${percentage}% (${stepsDisplay})\n`;
        display += 'Techniques: ' + this.formatTechniqueStatuses(metadata.techniqueStatuses);
        if (metadata.completionWarnings.length > 0) {
            display += '\n' + metadata.completionWarnings[0]; // Show most important warning
        }
        return display;
    }
    /**
     * Calculate statuses for each technique
     */
    calculateTechniqueStatuses(session, plan, isTerminating = false) {
        const statuses = [];
        // Optimize: Only create Map for multi-technique workflows
        const isMultiTechnique = plan.workflow.length > 1;
        const historyByTechnique = isMultiTechnique
            ? this.groupHistoryByTechnique(session.history)
            : null;
        // A plan may name the same technique twice, and those are two runs rather
        // than one pool. Grouping by technique NAME handed both workflow entries
        // the same history, so one instance's steps filled the other's holes:
        // measured on ['po','triz','po'] with instance 2 missing step 3, the union
        // of {1,2,3,4} and {1,2,4} has no gap, and the session ended reporting
        // completed with skippedSteps empty (#301).
        //
        // Instances are filled in order. The input cannot identify them — under
        // technique-local numbering `po` step 1 is the same request for either
        // instance — so a new instance is taken to begin when a step number recurs,
        // step numbers restarting being what separates one run from the next.
        //
        // Cost of that choice: a caller genuinely interleaving two instances gets
        // them attributed by arrival order, so a gap is still caught but may be
        // named against the wrong instance.
        const instanceCursor = new Map();
        const repeatCounts = new Map();
        for (const w of plan.workflow) {
            repeatCounts.set(w.technique, (repeatCounts.get(w.technique) ?? 0) + 1);
        }
        let globalStepOffset = 0;
        for (const workflow of plan.workflow) {
            const techniqueSteps = workflow.steps.length;
            // Get the history entries for this technique
            const pooled = isMultiTechnique
                ? historyByTechnique?.get(workflow.technique) || []
                : session.history.filter(h => h.technique === workflow.technique);
            // Repeated techniques: read the instance the EXECUTOR stamped, rather
            // than inferring one from step numbers. Inference cannot be done without
            // false positives — a step re-sent without `isRevision` looks exactly
            // like the start of a new run — and blocked sessions in which every step
            // had actually been executed (#301).
            //
            // An entry without a stamp is run 0. The pre-stamp world only ever had
            // one run, so that is what an unstamped entry always was — and a session
            // started under a plan with no repeats, then resumed under one that has
            // them, carries exactly that mix. Treating the stamp as all-or-nothing
            // latched such a session back to pooling, so a single unstamped entry
            // disabled instance tracking for the whole session and run 2's gap was
            // masked by run 1 again — the original #301 defect, reachable today.
            const repeats = repeatCounts.get(workflow.technique) ?? 0;
            let techniqueHistory = pooled;
            if (repeats > 1) {
                const index = instanceCursor.get(workflow.technique) ?? 0;
                instanceCursor.set(workflow.technique, index + 1);
                techniqueHistory = pooled.filter(h => runOf(h) === index);
            }
            // Count completed steps and track step numbers
            const { completedStepsForTechnique, completedStepNumbers } = this.countTechniqueCompletedSteps(techniqueHistory, techniqueSteps, plan, globalStepOffset);
            // Find skipped steps (technique-local numbering)
            const skippedSteps = this.findSkippedSteps(techniqueSteps, completedStepNumbers, completedStepsForTechnique, isTerminating);
            // Identify critical skipped steps
            const criticalSkipped = this.identifyCriticalSkippedSteps(workflow.technique, skippedSteps, session.problem);
            statuses.push({
                technique: workflow.technique,
                totalSteps: techniqueSteps,
                completedSteps: completedStepsForTechnique,
                completionPercentage: techniqueSteps > 0 ? completedStepsForTechnique / techniqueSteps : 0,
                skippedSteps,
                criticalStepsSkipped: criticalSkipped,
            });
            globalStepOffset += techniqueSteps;
        }
        return statuses;
    }
    /**
     * Group history entries by technique (only when needed for performance)
     */
    /**
     * Split one technique's history into its separate runs.
     *
     * A new instance begins where a step number recurs, because step numbers
     * restart per run: `1,2,3,4,1,2,4` is a complete run followed by one missing
     * step 3, not a single run of seven.
     *
     * Revisions are the case that makes this more than a `Set` check. A revision
     * re-sends a step number it has already sent, and that must NOT open a new
     * instance — so a repeat only counts as a boundary when the step number is
     * one the run has seen AND the run has moved past it, i.e. the number is not
     * simply the previous entry repeated.
     */
    groupHistoryByTechnique(history) {
        const historyByTechnique = new Map();
        for (const entry of history) {
            let techniqueArray = historyByTechnique.get(entry.technique);
            if (!techniqueArray) {
                techniqueArray = [];
                historyByTechnique.set(entry.technique, techniqueArray);
            }
            techniqueArray.push(entry);
        }
        return historyByTechnique;
    }
    /**
     * Count completed steps for a technique with proper validation
     */
    countTechniqueCompletedSteps(techniqueHistory, techniqueSteps, plan, globalStepOffset) {
        const completedStepNumbers = new Set();
        const submissionsByStep = new Map();
        const record = (localStep) => {
            completedStepNumbers.add(localStep);
            submissionsByStep.set(localStep, (submissionsByStep.get(localStep) ?? 0) + 1);
        };
        // Define reasonable bounds for step validation
        const MAX_REASONABLE_STEP = 1000;
        for (const entry of techniqueHistory) {
            // Validate step is within reasonable bounds
            if (entry.currentStep < 1 || entry.currentStep > MAX_REASONABLE_STEP) {
                continue; // Skip invalid step numbers
            }
            if (plan.workflow.length === 1) {
                // Single technique - steps are technique-local
                if (this.isValidStepForTechnique(entry.currentStep, 1, techniqueSteps)) {
                    record(entry.currentStep);
                }
            }
            else {
                // Multi-technique. The execution validator accepts BOTH numbering
                // conventions — plan-wide and technique-local, disambiguated by
                // totalSteps — and this counter accepted only plan-wide. A session
                // numbered per technique (six_hats 1-7 behind triz's 4) had its later
                // steps fall outside the expected global range, so a fully-run session
                // read as riddled with skips, and once the completion gate checked
                // every termination that false reading BLOCKED legitimate endings.
                // Two components disagreeing about the same convention, again; the
                // entry's own totalSteps says which one its currentStep uses, exactly
                // as it does for the validator.
                const planTotal = plan.workflow.reduce((sum, w) => sum + w.steps.length, 0);
                const entryIsLocal = entry.totalSteps === techniqueSteps && entry.totalSteps !== planTotal
                    ? true
                    : entry.totalSteps === planTotal
                        ? false
                        : entry.currentStep >= 1 && entry.currentStep <= techniqueSteps;
                const localStep = entryIsLocal ? entry.currentStep : entry.currentStep - globalStepOffset;
                if (this.isValidStepForTechnique(localStep, 1, techniqueSteps)) {
                    record(localStep);
                }
            }
        }
        // DISTINCT steps, not history entries. Counting entries let a duplicate
        // submission inflate the tally: seven calls covering six distinct steps
        // reported "7/7 steps, 100%" and painted a ✓ while the completion gate
        // was simultaneously blocking the ending for the step that was skipped —
        // one response asserting completeness and incompleteness at once.
        return {
            completedStepsForTechnique: completedStepNumbers.size,
            completedStepNumbers,
            submissionsByStep,
        };
    }
    /**
     * Technique-local progress for one technique of a plan, for callers outside
     * this tracker — notably next-step guidance, which needs to know whether an
     * earlier step was passed over before pointing the caller further ahead.
     *
     * This is the ONLY sanctioned way to read per-technique step coverage from
     * outside: it reuses the same numbering-convention disambiguation as the
     * completion metadata (the validator carries the third copy), so a fourth
     * hand-rolled copy cannot drift.
     */
    techniqueLocalProgress(session, plan, technique, techniqueIndex) {
        const workflow = plan.workflow[techniqueIndex];
        const techniqueSteps = workflow?.steps.length ?? 0;
        const globalStepOffset = plan.workflow
            .slice(0, techniqueIndex)
            .reduce((sum, w) => sum + w.steps.length, 0);
        // Read the RUN being guided, not every run of this technique. Pooling by
        // name meant the second run of a repeated technique saw the first run's
        // step numbers as its own, and both outputs went wrong in opposite
        // directions: a legitimate first step was called a duplicate, and a genuine
        // hole went unreported while the guidance steered past it (#371) — which is
        // the exact failure the caller was written to prevent.
        //
        // The run is taken from the CURRENT step's own stamp, read off the last
        // entry for this technique — the step being guided has already been pushed
        // by the time guidance is built.
        //
        // `techniqueIndex` cannot supply it. `ExecutionValidator` resolves that to
        // the FIRST occurrence under technique-local numbering, saying so in its own
        // comment: a technique-local number "cannot distinguish one occurrence from
        // another — nothing in the input says which". Deriving the run from it
        // therefore reads run 1 while guiding run 2, which is the bug wearing a
        // different hat. The executor's stamp is the only thing that knows, because
        // it had the history in hand when it wrote the entry.
        //
        // An unstamped entry is run 0 — see `runOf`. This used to require EVERY
        // entry to carry a stamp before separating runs at all, which latched any
        // session with one unstamped entry back to pooling for good: a session
        // started under a single-technique plan and resumed under a repeating one
        // was called a duplicate on run 2's first step, permanently.
        const pooled = session.history.filter(h => h.technique === technique);
        const repeats = plan.workflow.filter(w => w.technique === technique).length > 1;
        const last = pooled[pooled.length - 1];
        const currentRun = last ? runOf(last) : 0;
        const techniqueHistory = repeats ? pooled.filter(h => runOf(h) === currentRun) : pooled;
        const { completedStepNumbers, submissionsByStep } = this.countTechniqueCompletedSteps(techniqueHistory, techniqueSteps, plan, globalStepOffset);
        return { completedStepNumbers, submissionsByStep, techniqueSteps };
    }
    /**
     * Check if a step number is valid for a technique
     */
    isValidStepForTechnique(stepNumber, minStep, maxStep) {
        return stepNumber >= minStep && stepNumber <= maxStep;
    }
    /**
     * Find skipped steps in technique execution
     */
    findSkippedSteps(techniqueSteps, completedStepNumbers, completedStepsForTechnique, isTerminating = false) {
        const skippedSteps = [];
        // A step is skipped when the session has gone PAST it without running it.
        // A step ahead of the furthest one reached has not been skipped; it has not
        // been reached.
        //
        // Every incomplete step used to count, so step 1 of a seven-step technique
        // reported the other six as skipped and the response told the caller
        // "Black Hat thinking skipped - critical risks may be overlooked" before
        // the session had any opportunity to run it. That is the same shape as the
        // completion nag removed earlier: true of every session at that point
        // whatever its quality, and so carrying no information while training the
        // reader to discount warnings that do.
        // Once the session is ending, a step that has not run never will, so the
        // whole technique counts. Mid-session only what was passed over does — the
        // steps ahead are pending, and calling them skipped is what told a caller
        // on step 1 of seven that Black Hat had been skipped.
        if (completedStepsForTechnique > 0 || isTerminating) {
            const limit = isTerminating ? techniqueSteps + 1 : Math.max(...completedStepNumbers, 0);
            for (let i = 1; i < limit; i++) {
                if (!completedStepNumbers.has(i)) {
                    skippedSteps.push(i);
                }
            }
        }
        return skippedSteps;
    }
    /**
     * Calculate overall progress
     */
    calculateOverallProgress(statuses, plan) {
        const totalSteps = plan.totalSteps;
        const completedSteps = statuses.reduce((sum, s) => sum + s.completedSteps, 0);
        return totalSteps > 0 ? completedSteps / totalSteps : 0;
    }
    /**
     * Identify skipped techniques.
     *
     * Returns every unstarted technique, mid-run included. That is deliberate
     * and guarded by completion-warning-timing.test.ts: the completion
     * gatekeeper reads this data, and withholding it here would change
     * enforcement rather than presentation.
     *
     * "No steps yet" is not the same as "skipped" for a CALLER, though — the
     * first step of a two-technique plan reported the second one skipped. That
     * is suppressed where the response is built, not here, so the data stays
     * whole for the gatekeeper. See ExecutionResponseBuilder.addCompletionMetadata.
     */
    identifySkippedTechniques(statuses) {
        return statuses.filter(s => s.completedSteps === 0).map(s => s.technique);
    }
    /**
     * Identify missed perspectives.
     *
     * Gated on the same condition as skipped techniques, and for the same
     * reason: a perspective a session has not reached yet has not been missed.
     * Reported unconditionally, this named "Systematic modification strategies"
     * as missed on the first step of a plan whose second technique was scamper.
     */
    identifyMissedPerspectives(statuses, skipped) {
        const missed = [];
        const isSkipped = new Set(skipped);
        // Check Six Hats
        const sixHats = statuses.find(s => s.technique === 'six_hats');
        if (sixHats && sixHats.skippedSteps.length > 0) {
            const hatNames = ['Blue', 'White', 'Red', 'Yellow', 'Black', 'Green', 'Purple'];
            sixHats.skippedSteps.forEach(step => {
                if (step <= hatNames.length) {
                    missed.push(`${hatNames[step - 1]} Hat thinking`);
                }
            });
        }
        // Check other techniques. `isSkipped` rather than `completedSteps === 0`:
        // a technique the session has not reached is pending, not missed.
        statuses.forEach(status => {
            if (status.technique === 'triz' && isSkipped.has('triz')) {
                missed.push('Systematic contradiction resolution');
            }
            if (status.technique === 'scamper' && isSkipped.has('scamper')) {
                missed.push('Systematic modification strategies');
            }
            if (status.technique === 'design_thinking' && status.skippedSteps.includes(1)) {
                missed.push('Empathy and user understanding');
            }
        });
        return missed;
    }
    /**
     * Identify critical gaps based on problem type
     */
    identifyCriticalGaps(problem, statuses) {
        const gaps = [];
        const problemType = this.detectProblemType(problem);
        const criticalSteps = CRITICAL_STEPS[problemType] || [];
        criticalSteps.forEach(critical => {
            const status = statuses.find(s => s.technique === critical.technique);
            if (!status ||
                status.completedSteps === 0 ||
                (critical.step !== 'All' && status.criticalStepsSkipped.includes(critical.step))) {
                gaps.push(`Missing ${critical.technique} - ${critical.reason}`);
            }
        });
        return gaps;
    }
    /**
     * Generate completion warnings
     */
    generateCompletionWarnings(overallProgress, statuses, criticalGaps, isTerminating) {
        const warnings = [];
        // Incompleteness is only a fault when the session is ending. On step 1 of a
        // seven-step technique, progress is 14% and the session is proceeding
        // exactly as planned — telling the caller it has CRITICALLY FAILED there,
        // every time, is how these warnings came to be routinely ignored.
        //
        // The technique-specific warnings below are NOT gated: "Black Hat skipped"
        // is true whenever it is true, and acting on it mid-session is the point.
        if (isTerminating) {
            // Critical warnings with stronger language
            if (overallProgress < this.CRITICAL_THRESHOLD) {
                warnings.push(`⚠️ CRITICAL FAILURE: Only ${Math.round(overallProgress * 100)}% complete! ` +
                    `YOU MUST COMPLETE ALL STEPS. ` +
                    `Missing ${Math.round((1 - overallProgress) * 100)}% will result in INVALID analysis. ` +
                    `DO NOT proceed to synthesis until ALL steps are complete.`);
            }
            else if (overallProgress < this.WARNING_THRESHOLD) {
                warnings.push(`⚠️ MANDATORY ACTION: Only ${Math.round(overallProgress * 100)}% complete. ` +
                    `You MUST complete remaining steps. Incomplete execution violates thinking process requirements.`);
            }
            else if (overallProgress < this.DEFAULT_MINIMUM_THRESHOLD) {
                warnings.push(`⚠️ WARNING: ${Math.round(overallProgress * 100)}% complete. ` +
                    `Minimum 80% required. Complete remaining steps before synthesis.`);
            }
            // Critical gaps had no progress gate at all, so this fired on step 1 of
            // every multi-technique plan: identifyCriticalGaps counts any technique
            // with zero completed steps, and at the start that is nearly all of them.
            if (criticalGaps.length > 0) {
                warnings.push(`❌ CRITICAL GAPS DETECTED: ${criticalGaps.join(', ')}. ` +
                    `These MUST be addressed for valid analysis.`);
            }
        }
        // Specific technique warnings
        const blackHatStatus = statuses.find(s => s.technique === 'six_hats' && s.criticalStepsSkipped.includes('Black Hat'));
        if (blackHatStatus) {
            warnings.push('⚠️ Black Hat thinking skipped - critical risks may be overlooked');
        }
        return warnings;
    }
    /**
     * Create visual progress bar
     */
    createProgressBar(progress, width = 20) {
        // Ensure progress is between 0 and 1
        const clampedProgress = Math.max(0, Math.min(1, progress));
        const filled = Math.round(clampedProgress * width);
        const empty = Math.max(0, width - filled);
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
    /**
     * Format technique statuses for display
     */
    formatTechniqueStatuses(statuses) {
        return statuses
            .map(s => {
            if (s.completedSteps === 0)
                return `[✗ ${s.technique}]`;
            if (s.completedSteps === s.totalSteps)
                return `[✓ ${s.technique}]`;
            return `[◐ ${s.technique}]`;
        })
            .join(' ');
    }
    /**
     * Detect problem type for critical step identification
     */
    detectProblemType(problem) {
        const lowerProblem = problem.toLowerCase();
        if (lowerProblem.includes('risk') ||
            lowerProblem.includes('security') ||
            lowerProblem.includes('safety') ||
            lowerProblem.includes('failure')) {
            return 'risk_analysis';
        }
        if (lowerProblem.includes('technical') ||
            lowerProblem.includes('system') ||
            lowerProblem.includes('engineering') ||
            lowerProblem.includes('architecture')) {
            return 'technical_systems';
        }
        if (lowerProblem.includes('user') ||
            lowerProblem.includes('experience') ||
            lowerProblem.includes('customer') ||
            lowerProblem.includes('interface')) {
            return 'user_experience';
        }
        return 'general';
    }
    /**
     * Identify critical skipped steps for a technique
     */
    identifyCriticalSkippedSteps(technique, skippedSteps, _problem) {
        const critical = [];
        if (technique === 'six_hats' && skippedSteps.includes(5)) {
            critical.push('Black Hat');
        }
        if (technique === 'triz' && skippedSteps.includes(1)) {
            critical.push('Contradiction');
        }
        if (technique === 'design_thinking' && skippedSteps.includes(1)) {
            critical.push('Empathize');
        }
        return critical;
    }
    /**
     * Calculate completion for single technique execution
     */
    calculateSingleTechniqueCompletion(session) {
        const technique = session.technique;
        const steps = session.history.length;
        // Estimate total steps based on technique
        const estimatedTotal = this.getEstimatedStepsForTechnique(technique);
        const progress = estimatedTotal > 0 ? steps / estimatedTotal : 0;
        return {
            overallProgress: progress,
            totalPlannedSteps: estimatedTotal,
            completedSteps: steps,
            techniqueStatuses: [
                {
                    technique,
                    totalSteps: estimatedTotal,
                    completedSteps: steps,
                    completionPercentage: progress,
                    skippedSteps: [],
                    criticalStepsSkipped: [],
                },
            ],
            skippedTechniques: [],
            missedPerspectives: [],
            criticalGapsIdentified: [],
            completionWarnings: progress < 0.8
                ? [`Consider completing all ${estimatedTotal} steps for comprehensive analysis`]
                : [],
            minimumThresholdMet: progress >= this.DEFAULT_MINIMUM_THRESHOLD,
        };
    }
    /**
     * Get the step count for a technique.
     *
     * Asks the registry. This used to be a hand-copied table of every technique's
     * totalSteps, which nothing compared against the handlers — a technique whose
     * step count changed left the table stale, and the `|| 5` fallback turned a
     * missing entry into a plausible wrong number rather than an error. Progress
     * is reported as completedSteps / this, so a stale entry silently misreports
     * how far along a session is.
     */
    getEstimatedStepsForTechnique(technique) {
        const registry = TechniqueRegistry.getInstance();
        // A persisted session can name a technique this build no longer registers;
        // report a neutral estimate rather than throwing on load.
        return registry.isValidTechnique(technique) ? registry.getTechniqueSteps(technique) : 5;
    }
    /**
     * Count total completed steps
     */
    countCompletedSteps(statuses) {
        return statuses.reduce((sum, s) => sum + s.completedSteps, 0);
    }
}
//# sourceMappingURL=SessionCompletionTracker.js.map