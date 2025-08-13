/**
 * Reflexivity Tracker
 * Tracks post-action reflexive effects during creative thinking execution
 */
/**
 * Configuration constants for reflexivity tracking
 */
const REFLEXIVITY_CONFIG = {
    // Memory management
    MAX_TRACKED_SESSIONS: parseInt(process.env.MAX_REFLEXIVITY_SESSIONS || '100', 10),
    SESSION_TTL: parseInt(process.env.REFLEXIVITY_SESSION_TTL || String(24 * 60 * 60 * 1000), 10), // 24 hours
    CLEANUP_INTERVAL: parseInt(process.env.REFLEXIVITY_CLEANUP_INTERVAL || String(60 * 60 * 1000), 10), // 1 hour
    // Constraint thresholds
    WARNING_CONSTRAINT_THRESHOLD: 5,
    CAUTION_CONSTRAINT_THRESHOLD: 10,
};
/**
 * Action keyword patterns for efficient matching
 */
const ACTION_PATTERNS = {
    elimination: /\b(eliminat|remov|delet|discard|abandon)/i,
    communication: /\b(communicat|announc|declar|publish|broadcast)/i,
    experimentation: /\b(test|experiment|trial|pilot|prototype)/i,
};
/**
 * Tracks reflexive effects across a session
 */
export class ReflexivityTracker {
    realityStates = new Map();
    actionHistory = new Map();
    sessionTimestamps = new Map();
    cleanupTimer = null;
    nlpService;
    actionAnalysisCache = new Map();
    cacheTimeout = 5 * 60 * 1000; // 5 minutes
    constructor(nlpService) {
        this.nlpService = nlpService;
        this.startCleanupTimer();
    }
    /**
     * Start periodic cleanup of old sessions
     */
    startCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.cleanupTimer = setInterval(() => {
            this.cleanupOldSessions();
        }, REFLEXIVITY_CONFIG.CLEANUP_INTERVAL);
    }
    /**
     * Clean up sessions older than TTL
     */
    cleanupOldSessions() {
        const now = Date.now();
        const ttl = REFLEXIVITY_CONFIG.SESSION_TTL;
        const sessionsToDelete = [];
        this.sessionTimestamps.forEach((timestamp, sessionId) => {
            if (now - timestamp > ttl) {
                sessionsToDelete.push(sessionId);
            }
        });
        sessionsToDelete.forEach(sessionId => {
            this.clearSession(sessionId);
        });
        // Enforce max sessions limit
        if (this.realityStates.size > REFLEXIVITY_CONFIG.MAX_TRACKED_SESSIONS) {
            const sortedSessions = Array.from(this.sessionTimestamps.entries()).sort((a, b) => a[1] - b[1]);
            const toRemove = sortedSessions.slice(0, this.realityStates.size - REFLEXIVITY_CONFIG.MAX_TRACKED_SESSIONS);
            toRemove.forEach(([sessionId]) => {
                this.clearSession(sessionId);
            });
        }
    }
    /**
     * Stop the cleanup timer
     */
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
    /**
     * Get or initialize reality state for a session
     */
    getOrInitRealityState(sessionId) {
        if (!this.realityStates.has(sessionId)) {
            this.realityStates.set(sessionId, {
                stakeholderExpectations: [],
                resourceCommitments: [],
                relationshipDynamics: [],
                technicalDependencies: [],
                pathsForeclosed: [],
                optionsCreated: [],
                lastModified: Date.now(),
            });
        }
        const state = this.realityStates.get(sessionId);
        if (!state) {
            throw new Error(`Reality state not found for session ${sessionId}`);
        }
        return state;
    }
    /**
     * Track a step execution and assess reflexivity
     */
    trackStep(sessionId, technique, step, stepType, actionDescription, reflexiveEffects) {
        const record = {
            sessionId,
            technique,
            step,
            stepType,
            actionDescription,
            timestamp: Date.now(),
            reflexiveEffects,
            realityChanges: {},
        };
        // Only process reflexivity for action steps
        if (stepType === 'action' && reflexiveEffects) {
            const realityState = this.getOrInitRealityState(sessionId);
            const changes = this.assessReflexiveImpact(reflexiveEffects, realityState);
            record.realityChanges = changes;
            // Update reality state
            this.updateRealityState(sessionId, changes);
        }
        // Store action record and update timestamp
        if (!this.actionHistory.has(sessionId)) {
            this.actionHistory.set(sessionId, []);
        }
        const history = this.actionHistory.get(sessionId);
        if (history) {
            history.push(record);
        }
        // Update session timestamp for cleanup tracking
        this.sessionTimestamps.set(sessionId, Date.now());
        return record;
    }
    /**
     * Assess how an action's reflexive effects change reality
     */
    assessReflexiveImpact(effects, currentState) {
        const changes = {};
        // Use current state to determine incremental changes
        // This will be useful for future enhancements like:
        // - Detecting when expectations are already set
        // - Avoiding duplicate path foreclosures
        // - Calculating cumulative resource commitments
        const existingConstraints = currentState.pathsForeclosed.length;
        const existingExpectations = currentState.stakeholderExpectations.length;
        // Check for overconstrained environment
        // This information is used in assessFutureAction to provide appropriate warnings
        // Future enhancement: Could trigger real-time warnings during execution
        if (existingConstraints > REFLEXIVITY_CONFIG.WARNING_CONSTRAINT_THRESHOLD ||
            existingExpectations > REFLEXIVITY_CONFIG.WARNING_CONSTRAINT_THRESHOLD) {
            // Currently just noted for future use in warning systems
            // The actual warning logic is in assessFutureAction
        }
        // Map reflexive effects to reality state changes
        if (effects.realityChanges.length > 0) {
            // Parse reality changes for different categories
            effects.realityChanges.forEach(change => {
                const lowerChange = change.toLowerCase();
                if (lowerChange.includes('expectation') ||
                    lowerChange.includes('expect') ||
                    lowerChange.includes('believes')) {
                    if (!changes.stakeholderExpectations)
                        changes.stakeholderExpectations = [];
                    changes.stakeholderExpectations.push(change);
                }
                else if (lowerChange.includes('resource') ||
                    lowerChange.includes('allocat') ||
                    lowerChange.includes('budget')) {
                    if (!changes.resourceCommitments)
                        changes.resourceCommitments = [];
                    changes.resourceCommitments.push(change);
                }
                else if (lowerChange.includes('relation') || lowerChange.includes('team')) {
                    if (!changes.relationshipDynamics)
                        changes.relationshipDynamics = [];
                    changes.relationshipDynamics.push(change);
                }
                else if (lowerChange.includes('technical') ||
                    lowerChange.includes('depend') ||
                    lowerChange.includes('architecture')) {
                    if (!changes.technicalDependencies)
                        changes.technicalDependencies = [];
                    changes.technicalDependencies.push(change);
                }
            });
        }
        // Track foreclosed paths and new options
        if (effects.futureConstraints && effects.futureConstraints.length > 0) {
            changes.pathsForeclosed = effects.futureConstraints.filter(c => {
                const lower = c.toLowerCase();
                return (lower.includes('cannot') ||
                    lower.includes('closed') ||
                    lower.includes('foreclosed') ||
                    lower.includes('must') ||
                    lower.includes('constrain') ||
                    lower.includes('require'));
            });
            changes.optionsCreated = effects.futureConstraints.filter(c => {
                const lower = c.toLowerCase();
                return (lower.includes('can now') ||
                    lower.includes('enabled') ||
                    lower.includes('possible') ||
                    lower.includes('flexibility') ||
                    lower.includes('allow'));
            });
        }
        return changes;
    }
    /**
     * Update the reality state with changes from an action
     */
    updateRealityState(sessionId, changes) {
        const state = this.getOrInitRealityState(sessionId);
        // Type-safe helper to check if a key is an array property
        const isArrayProperty = (key) => {
            return [
                'stakeholderExpectations',
                'resourceCommitments',
                'relationshipDynamics',
                'technicalDependencies',
                'pathsForeclosed',
                'optionsCreated',
            ].includes(key);
        };
        // Merge changes into state with proper type checking
        Object.entries(changes).forEach(([key, value]) => {
            if (Array.isArray(value) && isArrayProperty(key)) {
                // Initialize array if it doesn't exist
                if (!state[key]) {
                    state[key] = [];
                }
                // Add new values - state[key] is definitely an array after initialization
                const stateArray = state[key];
                stateArray.push(...value);
            }
        });
        state.lastModified = Date.now();
    }
    /**
     * Get current reality state for a session
     */
    getRealityState(sessionId) {
        return this.realityStates.get(sessionId);
    }
    /**
     * Get action history for a session
     */
    getActionHistory(sessionId) {
        return this.actionHistory.get(sessionId) || [];
    }
    /**
     * Get reflexivity assessment for future actions using NLP analysis
     */
    async assessFutureAction(sessionId, proposedAction) {
        // Check cache first
        const cacheKey = `${sessionId}:${proposedAction}`;
        const cached = this.actionAnalysisCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return this.buildAssessment(sessionId, cached);
        }
        // Use NLP service for semantic analysis
        const actionAnalysis = await this.nlpService.analyzeActionSemantics(proposedAction);
        // Cache the analysis
        this.actionAnalysisCache.set(cacheKey, {
            ...actionAnalysis,
            timestamp: Date.now(),
        });
        // Clean old cache entries periodically
        if (this.actionAnalysisCache.size > 100) {
            this.cleanActionCache();
        }
        return this.buildAssessment(sessionId, actionAnalysis);
    }
    /**
     * Synchronous version for backward compatibility (uses local NLP only)
     */
    assessFutureActionSync(sessionId, proposedAction) {
        // Use local analysis patterns as fallback
        let reversibilityAssessment = 'medium';
        const likelyEffects = [];
        if (ACTION_PATTERNS.elimination.test(proposedAction)) {
            reversibilityAssessment = 'low';
            likelyEffects.push('Permanent removal of capabilities');
        }
        if (ACTION_PATTERNS.communication.test(proposedAction)) {
            reversibilityAssessment = 'low';
            likelyEffects.push('Creates stakeholder expectations');
        }
        if (ACTION_PATTERNS.experimentation.test(proposedAction)) {
            reversibilityAssessment = 'high';
            likelyEffects.push('Learning without commitment');
        }
        const state = this.getRealityState(sessionId);
        if (!state) {
            if (likelyEffects.length === 0) {
                likelyEffects.push('No prior actions to assess');
            }
            return {
                currentConstraints: [],
                likelyEffects,
                reversibilityAssessment,
                recommendation: 'Proceed with awareness that this is the first action',
            };
        }
        const constraintCount = state.pathsForeclosed.length +
            state.stakeholderExpectations.length +
            state.technicalDependencies.length;
        const recommendation = this.generateRecommendation(constraintCount, reversibilityAssessment);
        const currentConstraints = constraintCount > 0
            ? [
                ...state.pathsForeclosed,
                ...state.stakeholderExpectations,
                ...state.technicalDependencies,
            ]
            : [];
        return {
            currentConstraints,
            likelyEffects,
            reversibilityAssessment,
            recommendation,
        };
    }
    /**
     * Build assessment from action analysis
     */
    buildAssessment(sessionId, actionAnalysis) {
        const state = this.getRealityState(sessionId);
        if (!state) {
            return {
                currentConstraints: [],
                likelyEffects: actionAnalysis.likelyEffects,
                reversibilityAssessment: actionAnalysis.reversibility,
                recommendation: 'Proceed with awareness that this is the first action',
            };
        }
        const constraintCount = state.pathsForeclosed.length +
            state.stakeholderExpectations.length +
            state.technicalDependencies.length;
        const recommendation = this.generateRecommendation(constraintCount, actionAnalysis.reversibility);
        // Use lazy evaluation to avoid unnecessary array creation
        const currentConstraints = constraintCount > 0 ? Array.from(this.getConstraintsIterator(state)) : [];
        return {
            currentConstraints,
            likelyEffects: actionAnalysis.likelyEffects,
            reversibilityAssessment: actionAnalysis.reversibility,
            recommendation,
        };
    }
    /**
     * Clean old entries from action analysis cache
     */
    cleanActionCache() {
        const now = Date.now();
        const entriesToDelete = [];
        this.actionAnalysisCache.forEach((value, key) => {
            if (now - value.timestamp > this.cacheTimeout) {
                entriesToDelete.push(key);
            }
        });
        entriesToDelete.forEach(key => this.actionAnalysisCache.delete(key));
    }
    /**
     * Lazily iterate over all constraints without creating arrays
     */
    *getConstraintsIterator(state) {
        yield* state.pathsForeclosed;
        yield* state.stakeholderExpectations;
        yield* state.technicalDependencies;
    }
    /**
     * Generate recommendation based on current state
     */
    generateRecommendation(constraintCount, reversibility) {
        if (constraintCount > REFLEXIVITY_CONFIG.CAUTION_CONSTRAINT_THRESHOLD &&
            reversibility === 'low') {
            return 'Caution: Many existing constraints and low reversibility. Consider more flexible approach.';
        }
        if (constraintCount > REFLEXIVITY_CONFIG.WARNING_CONSTRAINT_THRESHOLD &&
            reversibility === 'medium') {
            return 'Awareness: Moderate constraints exist. Design with exit strategies.';
        }
        if (reversibility === 'high') {
            return 'Safe to proceed: Action is highly reversible.';
        }
        return 'Proceed with reflexivity awareness.';
    }
    /**
     * Clear data for a session
     */
    clearSession(sessionId) {
        this.realityStates.delete(sessionId);
        this.actionHistory.delete(sessionId);
        this.sessionTimestamps.delete(sessionId);
        // Clear cached action analyses for this session
        const keysToDelete = [];
        this.actionAnalysisCache.forEach((_, key) => {
            if (key.startsWith(`${sessionId}:`)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.actionAnalysisCache.delete(key));
    }
    /**
     * Get reflexivity summary for a session
     */
    getSessionSummary(sessionId) {
        const history = this.getActionHistory(sessionId);
        const state = this.getRealityState(sessionId);
        const actionSteps = history.filter(h => h.stepType === 'action').length;
        const thinkingSteps = history.filter(h => h.stepType === 'thinking').length;
        // Calculate overall reversibility based on action history
        let reversibilityScore = 0;
        history.forEach(record => {
            if (record.reflexiveEffects) {
                switch (record.reflexiveEffects.reversibility) {
                    case 'high':
                        reversibilityScore += 1;
                        break;
                    case 'medium':
                        reversibilityScore += 0.5;
                        break;
                    case 'low':
                        reversibilityScore += 0;
                        break;
                }
            }
        });
        const avgReversibility = actionSteps > 0 ? reversibilityScore / actionSteps : 1;
        const overallReversibility = avgReversibility > 0.7 ? 'high' : avgReversibility > 0.3 ? 'medium' : 'low';
        return {
            totalActions: history.length,
            thinkingSteps,
            actionSteps,
            currentConstraints: state?.pathsForeclosed?.length || 0,
            optionsCreated: state?.optionsCreated?.length || 0,
            overallReversibility,
        };
    }
}
//# sourceMappingURL=ReflexivityTracker.js.map