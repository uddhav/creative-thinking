/**
 * SessionCompletionTracker - Tracks session progress and completion status
 * Provides warnings and guidance for incomplete execution flows
 */
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
 * Tracks session completion and provides warnings
 */
export class SessionCompletionTracker {
    DEFAULT_MINIMUM_THRESHOLD = 0.8; // 80% completion recommended
    WARNING_THRESHOLD = 0.5; // 50% triggers warnings
    CRITICAL_THRESHOLD = 0.3; // 30% triggers critical warnings
    /**
     * Calculate session completion metadata
     */
    calculateCompletionMetadata(session, plan) {
        if (!plan) {
            // No plan means single technique execution
            return this.calculateSingleTechniqueCompletion(session);
        }
        const techniqueStatuses = this.calculateTechniqueStatuses(session, plan);
        const overallProgress = this.calculateOverallProgress(techniqueStatuses, plan);
        const skippedTechniques = this.identifySkippedTechniques(techniqueStatuses);
        const missedPerspectives = this.identifyMissedPerspectives(techniqueStatuses);
        const criticalGaps = this.identifyCriticalGaps(session.problem, techniqueStatuses);
        const warnings = this.generateCompletionWarnings(overallProgress, techniqueStatuses, criticalGaps);
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
        // Check critical gaps first
        if (metadata.criticalGapsIdentified.length > 0) {
            return {
                allowed: false,
                reason: 'Critical analysis gaps detected',
                requiredActions: metadata.criticalGapsIdentified,
            };
        }
        // Check minimum threshold
        if (!metadata.minimumThresholdMet) {
            return {
                allowed: false,
                reason: `Only ${Math.round(metadata.overallProgress * 100)}% complete. Minimum 80% recommended.`,
                requiredActions: [
                    `Complete ${metadata.totalPlannedSteps - metadata.completedSteps} more steps`,
                    ...metadata.skippedTechniques.map(t => `Execute ${t} technique`),
                ],
            };
        }
        // Check for important missed perspectives
        if (metadata.missedPerspectives.length > 2) {
            return {
                allowed: false,
                reason: 'Too many perspectives missed for comprehensive analysis',
                requiredActions: metadata.missedPerspectives.slice(0, 3).map(p => `Explore ${p}`),
            };
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
    calculateTechniqueStatuses(session, plan) {
        const statuses = [];
        // Optimize: Only create Map for multi-technique workflows
        const isMultiTechnique = plan.workflow.length > 1;
        const historyByTechnique = isMultiTechnique
            ? this.groupHistoryByTechnique(session.history)
            : null;
        let globalStepOffset = 0;
        for (const workflow of plan.workflow) {
            const techniqueSteps = workflow.steps.length;
            // Get the history entries for this technique
            const techniqueHistory = isMultiTechnique
                ? historyByTechnique?.get(workflow.technique) || []
                : session.history.filter(h => h.technique === workflow.technique);
            // Count completed steps and track step numbers
            const { completedStepsForTechnique, completedStepNumbers } = this.countTechniqueCompletedSteps(techniqueHistory, techniqueSteps, plan, globalStepOffset);
            // Find skipped steps (technique-local numbering)
            const skippedSteps = this.findSkippedSteps(techniqueSteps, completedStepNumbers, completedStepsForTechnique);
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
        let completedStepsForTechnique = 0;
        const completedStepNumbers = new Set();
        // Define reasonable bounds for step validation
        const MAX_REASONABLE_STEP = 1000;
        for (const entry of techniqueHistory) {
            // Validate step is within reasonable bounds
            if (entry.currentStep < 1 || entry.currentStep > MAX_REASONABLE_STEP) {
                continue; // Skip invalid step numbers
            }
            if (plan.workflow.length === 1 || plan.executionMode === 'parallel') {
                // Single technique or parallel execution - steps are technique-local
                if (this.isValidStepForTechnique(entry.currentStep, 1, techniqueSteps)) {
                    completedStepsForTechnique++;
                    completedStepNumbers.add(entry.currentStep);
                }
            }
            else {
                // Sequential multi-technique - check if step is in the global range
                const expectedStepMin = globalStepOffset + 1;
                const expectedStepMax = globalStepOffset + techniqueSteps;
                if (this.isValidStepForTechnique(entry.currentStep, expectedStepMin, expectedStepMax)) {
                    completedStepsForTechnique++;
                    // Convert to technique-local step number for tracking
                    completedStepNumbers.add(entry.currentStep - globalStepOffset);
                }
            }
        }
        return { completedStepsForTechnique, completedStepNumbers };
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
    findSkippedSteps(techniqueSteps, completedStepNumbers, completedStepsForTechnique) {
        const skippedSteps = [];
        // Only identify skipped steps if some steps were completed
        if (completedStepsForTechnique > 0) {
            for (let i = 1; i <= techniqueSteps; i++) {
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
     * Identify skipped techniques
     */
    identifySkippedTechniques(statuses) {
        return statuses.filter(s => s.completedSteps === 0).map(s => s.technique);
    }
    /**
     * Identify missed perspectives
     */
    identifyMissedPerspectives(statuses) {
        const missed = [];
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
        // Check other techniques
        statuses.forEach(status => {
            if (status.technique === 'triz' && status.completedSteps === 0) {
                missed.push('Systematic contradiction resolution');
            }
            if (status.technique === 'scamper' && status.completedSteps === 0) {
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
    generateCompletionWarnings(overallProgress, statuses, criticalGaps) {
        const warnings = [];
        // Critical warnings
        if (overallProgress < this.CRITICAL_THRESHOLD) {
            warnings.push(`⚠️ CRITICAL: Only ${Math.round(overallProgress * 100)}% complete. ` +
                `Missing ${Math.round((1 - overallProgress) * 100)}% of planned analysis may lead to flawed conclusions.`);
        }
        else if (overallProgress < this.WARNING_THRESHOLD) {
            warnings.push(`⚠️ Warning: ${Math.round(overallProgress * 100)}% complete. ` +
                `Consider completing more steps for comprehensive analysis.`);
        }
        // Critical gaps warnings
        if (criticalGaps.length > 0) {
            warnings.push(`⚠️ Critical gaps: ${criticalGaps.join(', ')}`);
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
        const filled = Math.round(progress * width);
        const empty = width - filled;
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
     * Get estimated steps for a technique
     */
    getEstimatedStepsForTechnique(technique) {
        const stepCounts = {
            six_hats: 7,
            po: 4,
            random_entry: 3,
            scamper: 8,
            concept_extraction: 4,
            yes_and: 4,
            design_thinking: 5,
            triz: 4,
            neural_state: 4,
            temporal_work: 5,
            cross_cultural: 5,
            collective_intel: 5,
            disney_method: 3,
            nine_windows: 9,
            convergence: 3,
        };
        return stepCounts[technique] || 5;
    }
    /**
     * Count total completed steps
     */
    countCompletedSteps(statuses) {
        return statuses.reduce((sum, s) => sum + s.completedSteps, 0);
    }
}
//# sourceMappingURL=SessionCompletionTracker.js.map