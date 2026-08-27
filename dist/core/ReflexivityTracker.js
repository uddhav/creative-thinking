/**
 * Reflexivity Tracker
 * Tracks post-action reflexive effects during creative thinking execution
 */
import { ValidationError, ErrorCode } from '../errors/types.js';
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
const CHANGE_CATEGORY_PATTERNS = {
    stakeholder: [
        /\b(expectation|expect|believes?|assumes?|stakeholder|requirement)\b/i,
        /\b(customer|client|user|partner|vendor)\b/i,
        /\b(commit|promise|guarantee|assure)\b/i,
    ],
    resource: [
        /\b(resource|allocat|budget|cost|fund|capacity|bandwidth)\b/i,
        /\b(invest|spend|consume|utilize|deploy)\b/i,
        /\b(time|money|personnel|equipment)\b/i,
    ],
    relationship: [
        /\b(relation|team|collaborate|partner|trust|communication)\b/i,
        /\b(coordinate|align|integrate|sync|cooperate)\b/i,
        /\b(conflict|tension|harmony|culture)\b/i,
    ],
    technical: [
        /\b(technical|depend|architecture|system|infrastructure|api)\b/i,
        /\b(interface|protocol|framework|library|component)\b/i,
        /\b(compatibility|integration|migration|upgrade)\b/i,
    ],
    path: [
        /\b(cannot|closed|foreclosed|must|constrain|require|prevent)\b/i,
        /\b(lock|restrict|limit|bound|confine)\b/i,
        /\b(irreversible|permanent|commit|dedicate)\b/i,
    ],
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
     * Validate input parameters for security and correctness
     */
    validateTrackingInput(sessionId, technique, actionDescription) {
        // Validate sessionId
        if (!sessionId?.trim() || sessionId.length > 100) {
            throw new ValidationError(ErrorCode.INVALID_INPUT, 'Invalid sessionId: must be non-empty string under 100 chars', 'sessionId');
        }
        // Validate technique
        if (!technique?.trim() || technique.length > 50) {
            throw new ValidationError(ErrorCode.INVALID_INPUT, 'Invalid technique: must be non-empty string under 50 chars', 'technique');
        }
        // Validate and sanitize actionDescription
        if (!actionDescription?.trim()) {
            throw new ValidationError(ErrorCode.INVALID_INPUT, 'Invalid actionDescription: cannot be empty', 'actionDescription');
        }
        if (actionDescription.length > 1000) {
            throw new ValidationError(ErrorCode.INVALID_INPUT, 'Action description too long: max 1000 characters', 'actionDescription');
        }
        // Basic XSS prevention - remove script tags
        if (/<script|javascript:|on\w+=/i.test(actionDescription)) {
            throw new ValidationError(ErrorCode.INVALID_INPUT, 'Invalid actionDescription: contains potentially unsafe content', 'actionDescription');
        }
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
     * Categorize a change using pattern matching
     */
    categorizeChange(change) {
        let bestMatch = {
            category: null,
            score: 0,
        };
        for (const [category, patterns] of Object.entries(CHANGE_CATEGORY_PATTERNS)) {
            let score = 0;
            for (const pattern of patterns) {
                if (pattern.test(change)) {
                    score++;
                }
            }
            if (score > bestMatch.score) {
                bestMatch = {
                    category: category,
                    score,
                };
            }
        }
        const confidence = bestMatch.score /
            (bestMatch.category ? CHANGE_CATEGORY_PATTERNS[bestMatch.category].length : 1);
        return {
            category: bestMatch.category,
            confidence,
        };
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
                constraintCount: 0,
                contentConstraintCount: 0,
                templateConstraintCount: 0,
                lastConstraintUpdate: Date.now(),
            });
        }
        const state = this.realityStates.get(sessionId);
        if (!state) {
            throw new Error(`Reality state not found for session ${sessionId}`);
        }
        return state;
    }
    /**
     * Track a step execution and assess reflexivity.
     *
     * Returns the record plus an edge-triggered warning, computed here — the
     * one place that knows both the pre-step and post-step state. It used to be
     * a separate `generateWarning(sessionId)` that reported the threshold
     * STATE, so once a session crossed a threshold, an identical "critical"
     * fired on every remaining step; two call sites also read it at different
     * points in the step and could disagree by one step.
     */
    trackStep(sessionId, technique, step, stepType, actionDescription, reflexiveEffects, provenance = 'template', 
    // Caller-declared commitments (e.g. a downward stepReversibility claim).
    // Always content-provenance, and written into pathsForeclosed directly —
    // deliberately bypassing the wording filter in assessReflexiveImpact,
    // which would silently drop "we've signed the lease" for carrying none
    // of its six stems.
    callerConstraints) {
        // Validate inputs for security and correctness
        this.validateTrackingInput(sessionId, technique, actionDescription);
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
        let warning = null;
        const declaredConstraints = callerConstraints?.filter(c => c.trim().length > 0) ?? [];
        // Only process reflexivity for action steps
        if (stepType === 'action' && (reflexiveEffects || declaredConstraints.length > 0)) {
            const realityState = this.getOrInitRealityState(sessionId);
            // realityState is a live reference that updateRealityState mutates in
            // place — the pre-step readings must be captured before those calls.
            const previousContentCount = realityState.contentConstraintCount || 0;
            const alreadyForeclosed = new Set(realityState.pathsForeclosed);
            const changes = reflexiveEffects
                ? this.assessReflexiveImpact(reflexiveEffects, realityState)
                : {};
            record.realityChanges = changes;
            // Update reality state
            if (reflexiveEffects) {
                this.updateRealityState(sessionId, changes, provenance);
            }
            if (declaredConstraints.length > 0) {
                this.updateRealityState(sessionId, { pathsForeclosed: declaredConstraints }, 'content');
            }
            // Only genuinely new entries fire the composition warning: the state
            // arrays deduplicate, so a re-declared commitment (revision, or a step
            // re-sent after a gatekeeper veto) neither counts again nor re-warns.
            const newlyForeclosed = [
                ...(provenance === 'content' ? (changes.pathsForeclosed ?? []) : []),
                ...declaredConstraints,
            ].filter(entry => !alreadyForeclosed.has(entry));
            warning = this.computeEdgeWarning(previousContentCount, realityState.contentConstraintCount || 0, newlyForeclosed);
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
        return { record, warning };
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
        // Map reflexive effects to reality state changes using pattern-based classification
        if (effects.realityChanges.length > 0) {
            effects.realityChanges.forEach(change => {
                const classification = this.categorizeChange(change);
                // Only categorize with reasonable confidence (>33% pattern match)
                if (classification.category && classification.confidence > 0.33) {
                    switch (classification.category) {
                        case 'stakeholder':
                            if (!changes.stakeholderExpectations)
                                changes.stakeholderExpectations = [];
                            changes.stakeholderExpectations.push(change);
                            break;
                        case 'resource':
                            if (!changes.resourceCommitments)
                                changes.resourceCommitments = [];
                            changes.resourceCommitments.push(change);
                            break;
                        case 'relationship':
                            if (!changes.relationshipDynamics)
                                changes.relationshipDynamics = [];
                            changes.relationshipDynamics.push(change);
                            break;
                        case 'technical':
                            if (!changes.technicalDependencies)
                                changes.technicalDependencies = [];
                            changes.technicalDependencies.push(change);
                            break;
                        case 'path':
                            // Path constraints are handled separately in futureConstraints
                            break;
                    }
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
    updateRealityState(sessionId, changes, provenance = 'template') {
        const state = this.getOrInitRealityState(sessionId);
        let deltaConstraints = 0;
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
        // Track constraint-related arrays for count update
        const constraintArrays = [
            'stakeholderExpectations',
            'technicalDependencies',
            'pathsForeclosed',
        ];
        // Merge changes into state with proper type checking
        Object.entries(changes).forEach(([key, value]) => {
            if (Array.isArray(value) && isArrayProperty(key)) {
                // Initialize array if it doesn't exist
                if (!state[key]) {
                    state[key] = [];
                }
                const stateArray = state[key];
                // Deduplicate against what the state already holds: the same
                // declaration re-arriving (a revision, or a re-sent step after a
                // gatekeeper veto) is one fact about the world, not N constraints —
                // counting it N times rebuilt the manufactured-warning storm one
                // layer down.
                const newValues = value.filter(item => !stateArray.includes(item));
                stateArray.push(...newValues);
                // Update constraint count for relevant arrays
                if (constraintArrays.includes(key)) {
                    deltaConstraints += newValues.length;
                }
            }
        });
        // Update cached constraint counts, split by who authored the constraint
        state.constraintCount = (state.constraintCount || 0) + deltaConstraints;
        if (provenance === 'content') {
            state.contentConstraintCount = (state.contentConstraintCount || 0) + deltaConstraints;
        }
        else {
            state.templateConstraintCount = (state.templateConstraintCount || 0) + deltaConstraints;
        }
        state.lastConstraintUpdate = Date.now();
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
     * Snapshot a session's tracker state for persistence, or undefined if the
     * session has neither half yet.
     *
     * Gated on EITHER half being present, not on `realityState` alone. That
     * earlier gate discarded `actionHistory` for every step before the first
     * action step — `trackStep` records all of them, but only creates a reality
     * state once a step carries effects or a declared constraint. A five-step
     * session run one process per step came back reporting three tracked steps
     * where one process reports five, and the guard that was meant to catch it
     * asserted only `> 1`, which three satisfies.
     */
    exportSessionState(sessionId) {
        const realityState = this.realityStates.get(sessionId);
        const history = this.actionHistory.get(sessionId) ?? [];
        if (!realityState && history.length === 0) {
            return undefined;
        }
        return {
            ...(realityState ? { realityState: { ...realityState } } : {}),
            actionHistory: history.map(record => ({
                technique: record.technique,
                step: record.step,
                stepType: record.stepType,
                timestamp: record.timestamp,
                ...(record.reflexiveEffects
                    ? { reversibility: record.reflexiveEffects.reversibility }
                    : {}),
            })),
        };
    }
    /**
     * Restore a session's tracker state after a restart.
     *
     * Refuses to overwrite state this process has already built. A load can
     * arrive after tracking has begun — the execution layer hydrates a session
     * mid-request — and the in-memory state is then strictly newer than the file.
     * Dropping a stale restore loses nothing; applying it would roll the session
     * back to the last save and re-open commitments the caller has already made.
     */
    importSessionState(sessionId, state) {
        // Either map having an entry means this process has already tracked this
        // session, so the file is the older copy. Checking both, not just
        // `realityStates`: history exists on its own before the first action step.
        if (!state || this.realityStates.has(sessionId) || this.actionHistory.has(sessionId)) {
            return;
        }
        if (state.realityState) {
            this.realityStates.set(sessionId, { ...state.realityState });
        }
        this.actionHistory.set(sessionId, (state.actionHistory ?? []).map(record => ({
            sessionId,
            technique: record.technique,
            step: record.step,
            stepType: record.stepType,
            // trackStep builds exactly this string; a restored record has to read
            // the same as one that never left the process.
            actionDescription: `${record.technique} step ${record.step}`,
            timestamp: record.timestamp,
            ...(record.reversibility
                ? { reflexiveEffects: { reversibility: record.reversibility } }
                : {}),
            // Already folded into realityState above; kept empty rather than
            // reconstructed, since nothing reads a past step's deltas.
            realityChanges: {},
        })));
        this.sessionTimestamps.set(sessionId, Date.now());
    }
    /**
     * Bucket index for the content-constraint count: 0 below the warning
     * threshold, 1 up to the caution threshold, then geometric (×1.25) — a
     * stateless encoding of "re-fire only on a material increase".
     */
    constraintBucket(count) {
        if (count <= REFLEXIVITY_CONFIG.WARNING_CONSTRAINT_THRESHOLD)
            return 0;
        if (count <= REFLEXIVITY_CONFIG.CAUTION_CONSTRAINT_THRESHOLD)
            return 1;
        return (2 +
            Math.floor(Math.log(count / REFLEXIVITY_CONFIG.CAUTION_CONSTRAINT_THRESHOLD) / Math.log(1.25)));
    }
    /**
     * Edge-triggered warning: fires when the content-derived constraint count
     * crosses a bucket boundary, or when this step forecloses new paths from
     * caller content — never merely for the count being above a threshold.
     * The tracker emits at most 'warning'; escalation to 'critical' is the
     * execution layer's call, made only when the server holds a stop-worthy
     * verdict (an escape recommendation or a pivot/escape early warning).
     */
    computeEdgeWarning(previousCount, newCount, newlyForeclosed) {
        const crossed = this.constraintBucket(newCount) > this.constraintBucket(previousCount);
        if (!crossed && newlyForeclosed.length === 0) {
            return null;
        }
        if (crossed) {
            return {
                level: 'warning',
                type: 'constraint_threshold',
                message: `Warning: ${newCount} content-derived constraints accumulated. Path dependencies building.`,
                currentConstraints: newCount,
                pathsForeclosed: newlyForeclosed.slice(0, 5),
                suggestions: [
                    'Generate alternative approaches before committing further',
                    'Review recent decisions for irreversibility',
                    'Consider parallel exploration of options',
                ],
            };
        }
        return {
            level: 'warning',
            type: 'path_foreclosed',
            message: `${newlyForeclosed.length} new path${newlyForeclosed.length === 1 ? '' : 's'} foreclosed by declared commitments.`,
            currentConstraints: newCount,
            pathsForeclosed: newlyForeclosed.slice(0, 5),
            suggestions: ['Review whether the commitment can stay reversible'],
        };
    }
    /**
     * Analyze action with timeout protection
     */
    async analyzeActionWithTimeout(proposedAction, timeout = 5000) {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('NLP service timeout')), timeout));
        try {
            return await Promise.race([
                this.nlpService.analyzeActionSemantics(proposedAction),
                timeoutPromise,
            ]);
        }
        catch (error) {
            // Fallback to local pattern matching
            console.warn('NLP service unavailable, using local patterns:', error);
            return this.localActionAnalysis(proposedAction);
        }
    }
    /**
     * Local action analysis fallback using patterns
     */
    localActionAnalysis(proposedAction) {
        let reversibility = 'medium';
        const likelyEffects = [];
        const stakeholderImpact = [];
        let temporalScope = 'short-term';
        // Check action patterns
        if (ACTION_PATTERNS.elimination.test(proposedAction)) {
            reversibility = 'low';
            temporalScope = 'permanent';
            likelyEffects.push('Permanent removal of capabilities');
        }
        if (ACTION_PATTERNS.communication.test(proposedAction)) {
            reversibility = 'low';
            temporalScope = 'long-term';
            likelyEffects.push('Stakeholder expectations will be set');
            stakeholderImpact.push('External expectations established');
        }
        if (ACTION_PATTERNS.experimentation.test(proposedAction)) {
            reversibility = 'high';
            temporalScope = 'short-term';
            likelyEffects.push('Learning opportunity with minimal commitment');
        }
        return {
            actionType: 'manual-classification',
            reversibility,
            likelyEffects,
            stakeholderImpact,
            temporalScope,
            confidence: 0.5, // Lower confidence for local analysis
        };
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
        // Use NLP service with timeout protection
        const actionAnalysis = await this.analyzeActionWithTimeout(proposedAction);
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
        // Use cached constraint count for performance
        const constraintCount = state.constraintCount || 0;
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
        // Use cached constraint count for performance
        const constraintCount = state.constraintCount || 0;
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
            // The same three-array count the warning thresholds use — this used to
            // count only pathsForeclosed while the thresholds counted three arrays.
            currentConstraints: state?.constraintCount || 0,
            optionsCreated: state?.optionsCreated?.length || 0,
            overallReversibility,
        };
    }
    /**
     * Get memory statistics for monitoring
     */
    getMemoryStats() {
        const sessionCount = this.realityStates.size;
        let totalActions = 0;
        let totalConstraints = 0;
        let oldestSession = Date.now();
        let newestSession = 0;
        // Calculate totals
        this.actionHistory.forEach(history => {
            totalActions += history.length;
        });
        this.realityStates.forEach(state => {
            totalConstraints += state.constraintCount || 0;
            if (state.lastModified < oldestSession) {
                oldestSession = state.lastModified;
            }
            if (state.lastModified > newestSession) {
                newestSession = state.lastModified;
            }
        });
        // Estimate memory usage (rough approximation)
        const avgActionSize = 500; // bytes per action record
        const avgConstraintSize = 100; // bytes per constraint
        const baseOverhead = 1024; // base overhead per session
        const estimatedMemoryBytes = sessionCount * baseOverhead +
            totalActions * avgActionSize +
            totalConstraints * avgConstraintSize +
            this.actionAnalysisCache.size * 1000; // cache entries
        return {
            sessionCount,
            totalActions,
            totalConstraints,
            estimatedMemoryBytes,
            oldestSession,
            newestSession,
        };
    }
}
//# sourceMappingURL=ReflexivityTracker.js.map