/**
 * Execution Mode Controller
 * Central controller for execution mode decisions
 */
/**
 * Controller for determining execution mode based on various inputs
 */
export class ExecutionModeController {
    detector;
    validator;
    constructor(detector, validator) {
        this.detector = detector;
        this.validator = validator;
    }
    /**
     * Determine the execution mode for a set of techniques
     */
    determineExecutionMode(input, recommendedTechniques) {
        // 1. Check explicit mode
        if (input.executionMode && input.executionMode !== 'auto') {
            return this.validateExplicitMode(input.executionMode, recommendedTechniques, input);
        }
        // 2. Detect from problem text
        const detection = this.detector.detectExecutionMode(input.problem, input.context);
        // 3. Auto mode decision
        if (detection.executionMode === 'parallel' || input.executionMode === 'auto') {
            // Validate parallel execution
            const validation = this.validator.validateParallelRequest(recommendedTechniques, input.maxParallelism);
            if (!validation.isValid && detection.executionMode === 'parallel') {
                // User wants parallel but it's not valid
                return {
                    mode: 'sequential',
                    reason: `Parallel execution not possible: ${validation.errors[0]}`,
                    warnings: [
                        ...validation.errors,
                        ...validation.warnings,
                        'Falling back to sequential execution',
                    ],
                    confidence: 0.3,
                };
            }
            if (validation.isValid &&
                (detection.executionMode === 'parallel' ||
                    (input.executionMode === 'auto' &&
                        this.shouldAutoSelectParallel(input, recommendedTechniques)))) {
                // Valid parallel execution
                const convergenceOptions = this.determineConvergence(input);
                return {
                    mode: 'parallel',
                    reason: detection.detectedKeywords.length > 0
                        ? `Detected parallel intent: ${detection.detectedKeywords.join(', ')}`
                        : 'Auto-selected parallel mode for optimal exploration',
                    warnings: validation.warnings,
                    confidence: detection.confidence,
                    convergenceOptions,
                };
            }
        }
        // Default to sequential
        return {
            mode: 'sequential',
            reason: detection.detectedKeywords.length === 0
                ? 'No parallel execution indicators detected'
                : 'Sequential execution selected',
            confidence: 1.0,
        };
    }
    /**
     * Validate an explicitly requested execution mode
     */
    validateExplicitMode(mode, techniques, input) {
        if (mode === 'sequential') {
            return {
                mode: 'sequential',
                reason: 'Explicitly requested sequential execution',
                confidence: 1.0,
            };
        }
        if (mode === 'parallel') {
            const validation = this.validator.validateParallelRequest(techniques, input.maxParallelism);
            if (!validation.isValid) {
                return {
                    mode: 'sequential',
                    reason: `Cannot execute in parallel: ${validation.errors[0]}`,
                    warnings: [...validation.errors, 'Falling back to sequential execution'],
                    confidence: 0.2,
                };
            }
            const convergenceOptions = this.determineConvergence(input);
            return {
                mode: 'parallel',
                reason: 'Explicitly requested parallel execution',
                warnings: validation.warnings,
                confidence: 1.0,
                convergenceOptions,
            };
        }
        // Should not reach here, but default to sequential
        return {
            mode: 'sequential',
            reason: 'Unknown execution mode, defaulting to sequential',
            confidence: 0.5,
        };
    }
    /**
     * Determine if auto mode should select parallel execution
     */
    shouldAutoSelectParallel(input, techniques) {
        // Check if user mentioned auto mode keywords
        if (this.detector.detectAutoMode(input.problem, input.context)) {
            // Auto mode explicitly requested, check if parallel makes sense
            if (techniques.length >= 3) {
                return true; // Multiple techniques benefit from parallel
            }
        }
        // Check complexity and technique count
        if (techniques.length >= 4) {
            return true; // Many techniques suggest broad exploration needed
        }
        // Check for exploration-focused outcome
        if (input.preferredOutcome === 'innovative' && techniques.length >= 2) {
            return true; // Innovation benefits from parallel exploration
        }
        // Check for time pressure (parallel can be faster)
        const hasTimePressure = input.constraints?.some(c => c.toLowerCase().includes('time') ||
            c.toLowerCase().includes('quick') ||
            c.toLowerCase().includes('fast'));
        if (hasTimePressure && techniques.length >= 2) {
            return true;
        }
        return false;
    }
    /**
     * Determine convergence options for parallel execution
     */
    determineConvergence(input) {
        const convergenceDetection = this.detector.detectConvergenceIntent(input.problem, input.context);
        return {
            method: convergenceDetection.method,
            // Convergence plan will be created in planning phase
            // For now, just pass the method and let planning layer handle details
        };
    }
    /**
     * Get execution mode analysis (detailed information for debugging)
     */
    analyzeExecutionMode(input, recommendedTechniques) {
        const detection = this.detector.detectExecutionMode(input.problem, input.context);
        const validation = this.validator.validateParallelRequest(recommendedTechniques, input.maxParallelism);
        const decision = this.determineExecutionMode(input, recommendedTechniques);
        return {
            mode: decision.mode,
            confidence: decision.confidence,
            reason: decision.reason,
            warnings: decision.warnings,
            detectedKeywords: detection.detectedKeywords,
            validationResult: validation,
        };
    }
}
//# sourceMappingURL=ExecutionModeController.js.map