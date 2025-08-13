/**
 * Reflexivity Tracker
 * Tracks post-action reflexive effects during creative thinking execution
 */

import type { StepType, ReflexiveEffects } from '../techniques/types.js';
import type { NLPService, ActionAnalysis } from '../nlp/NLPService.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

/**
 * Configuration constants for reflexivity tracking
 */
const REFLEXIVITY_CONFIG = {
  // Memory management
  MAX_TRACKED_SESSIONS: parseInt(process.env.MAX_REFLEXIVITY_SESSIONS || '100', 10),
  SESSION_TTL: parseInt(process.env.REFLEXIVITY_SESSION_TTL || String(24 * 60 * 60 * 1000), 10), // 24 hours
  CLEANUP_INTERVAL: parseInt(
    process.env.REFLEXIVITY_CLEANUP_INTERVAL || String(60 * 60 * 1000),
    10
  ), // 1 hour

  // Constraint thresholds
  WARNING_CONSTRAINT_THRESHOLD: 5,
  CAUTION_CONSTRAINT_THRESHOLD: 10,
} as const;

/**
 * Action keyword patterns for efficient matching
 */
const ACTION_PATTERNS = {
  elimination: /\b(eliminat|remov|delet|discard|abandon)/i,
  communication: /\b(communicat|announc|declar|publish|broadcast)/i,
  experimentation: /\b(test|experiment|trial|pilot|prototype)/i,
} as const;

/**
 * Category patterns for structured classification
 */
interface CategoryPatterns {
  stakeholder: RegExp[];
  resource: RegExp[];
  relationship: RegExp[];
  technical: RegExp[];
  path: RegExp[];
}

const CHANGE_CATEGORY_PATTERNS: CategoryPatterns = {
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
 * Represents the state of reality after actions have been taken
 */
export interface RealityState {
  stakeholderExpectations: string[];
  resourceCommitments: string[];
  relationshipDynamics: string[];
  technicalDependencies: string[];
  pathsForeclosed: string[];
  optionsCreated: string[];
  lastModified: number;
  constraintCount: number; // Cache for performance
  lastConstraintUpdate: number; // Track when count was last updated
}

/**
 * Represents an action taken and its reflexive impact
 */
export interface ActionRecord {
  sessionId: string;
  technique: string;
  step: number;
  stepType: StepType;
  actionDescription: string;
  timestamp: number;
  reflexiveEffects?: ReflexiveEffects;
  realityChanges: Partial<RealityState>;
}

/**
 * Tracks reflexive effects across a session
 */
export class ReflexivityTracker {
  private realityStates: Map<string, RealityState> = new Map();
  private actionHistory: Map<string, ActionRecord[]> = new Map();
  private sessionTimestamps: Map<string, number> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private nlpService: NLPService;
  private actionAnalysisCache: Map<string, ActionAnalysis & { timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(nlpService: NLPService) {
    this.nlpService = nlpService;
    this.startCleanupTimer();
  }

  /**
   * Validate input parameters for security and correctness
   */
  private validateTrackingInput(
    sessionId: string,
    technique: string,
    actionDescription: string
  ): void {
    // Validate sessionId
    if (!sessionId?.trim() || sessionId.length > 100) {
      throw new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Invalid sessionId: must be non-empty string under 100 chars',
        'sessionId'
      );
    }

    // Validate technique
    if (!technique?.trim() || technique.length > 50) {
      throw new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Invalid technique: must be non-empty string under 50 chars',
        'technique'
      );
    }

    // Validate and sanitize actionDescription
    if (!actionDescription?.trim()) {
      throw new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Invalid actionDescription: cannot be empty',
        'actionDescription'
      );
    }

    if (actionDescription.length > 1000) {
      throw new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Action description too long: max 1000 characters',
        'actionDescription'
      );
    }

    // Basic XSS prevention - remove script tags
    if (/<script|javascript:|on\w+=/i.test(actionDescription)) {
      throw new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Invalid actionDescription: contains potentially unsafe content',
        'actionDescription'
      );
    }
  }

  /**
   * Start periodic cleanup of old sessions
   */
  private startCleanupTimer(): void {
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
  private cleanupOldSessions(): void {
    const now = Date.now();
    const ttl = REFLEXIVITY_CONFIG.SESSION_TTL;
    const sessionsToDelete: string[] = [];

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
      const sortedSessions = Array.from(this.sessionTimestamps.entries()).sort(
        (a, b) => a[1] - b[1]
      );

      const toRemove = sortedSessions.slice(
        0,
        this.realityStates.size - REFLEXIVITY_CONFIG.MAX_TRACKED_SESSIONS
      );

      toRemove.forEach(([sessionId]) => {
        this.clearSession(sessionId);
      });
    }
  }

  /**
   * Stop the cleanup timer
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Categorize a change using pattern matching
   */
  private categorizeChange(change: string): {
    category: keyof CategoryPatterns | null;
    confidence: number;
  } {
    let bestMatch: { category: keyof CategoryPatterns | null; score: number } = {
      category: null,
      score: 0,
    };

    for (const [category, patterns] of Object.entries(CHANGE_CATEGORY_PATTERNS)) {
      let score = 0;
      for (const pattern of patterns as RegExp[]) {
        if (pattern.test(change)) {
          score++;
        }
      }

      if (score > bestMatch.score) {
        bestMatch = {
          category: category as keyof CategoryPatterns,
          score,
        };
      }
    }

    const confidence =
      bestMatch.score /
      (bestMatch.category ? CHANGE_CATEGORY_PATTERNS[bestMatch.category].length : 1);

    return {
      category: bestMatch.category,
      confidence,
    };
  }

  /**
   * Get or initialize reality state for a session
   */
  private getOrInitRealityState(sessionId: string): RealityState {
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
   * Track a step execution and assess reflexivity
   */
  public trackStep(
    sessionId: string,
    technique: string,
    step: number,
    stepType: StepType,
    actionDescription: string,
    reflexiveEffects?: ReflexiveEffects
  ): ActionRecord {
    // Validate inputs for security and correctness
    this.validateTrackingInput(sessionId, technique, actionDescription);

    const record: ActionRecord = {
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
  private assessReflexiveImpact(
    effects: ReflexiveEffects,
    currentState: RealityState
  ): Partial<RealityState> {
    const changes: Partial<RealityState> = {};

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
    if (
      existingConstraints > REFLEXIVITY_CONFIG.WARNING_CONSTRAINT_THRESHOLD ||
      existingExpectations > REFLEXIVITY_CONFIG.WARNING_CONSTRAINT_THRESHOLD
    ) {
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
              if (!changes.stakeholderExpectations) changes.stakeholderExpectations = [];
              changes.stakeholderExpectations.push(change);
              break;
            case 'resource':
              if (!changes.resourceCommitments) changes.resourceCommitments = [];
              changes.resourceCommitments.push(change);
              break;
            case 'relationship':
              if (!changes.relationshipDynamics) changes.relationshipDynamics = [];
              changes.relationshipDynamics.push(change);
              break;
            case 'technical':
              if (!changes.technicalDependencies) changes.technicalDependencies = [];
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
        return (
          lower.includes('cannot') ||
          lower.includes('closed') ||
          lower.includes('foreclosed') ||
          lower.includes('must') ||
          lower.includes('constrain') ||
          lower.includes('require')
        );
      });
      changes.optionsCreated = effects.futureConstraints.filter(c => {
        const lower = c.toLowerCase();
        return (
          lower.includes('can now') ||
          lower.includes('enabled') ||
          lower.includes('possible') ||
          lower.includes('flexibility') ||
          lower.includes('allow')
        );
      });
    }

    return changes;
  }

  /**
   * Update the reality state with changes from an action
   */
  private updateRealityState(sessionId: string, changes: Partial<RealityState>): void {
    const state = this.getOrInitRealityState(sessionId);
    let deltaConstraints = 0;

    // Type-safe helper to check if a key is an array property
    const isArrayProperty = (
      key: string
    ): key is keyof Omit<
      RealityState,
      'lastModified' | 'constraintCount' | 'lastConstraintUpdate'
    > => {
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
        // Add new values - state[key] is definitely an array after initialization
        const stateArray = state[key];
        stateArray.push(...value);

        // Update constraint count for relevant arrays
        if (constraintArrays.includes(key)) {
          deltaConstraints += value.length;
        }
      }
    });

    // Update cached constraint count
    state.constraintCount = (state.constraintCount || 0) + deltaConstraints;
    state.lastConstraintUpdate = Date.now();
    state.lastModified = Date.now();
  }

  /**
   * Get current reality state for a session
   */
  public getRealityState(sessionId: string): RealityState | undefined {
    return this.realityStates.get(sessionId);
  }

  /**
   * Get action history for a session
   */
  public getActionHistory(sessionId: string): ActionRecord[] {
    return this.actionHistory.get(sessionId) || [];
  }

  /**
   * Analyze action with timeout protection
   */
  private async analyzeActionWithTimeout(
    proposedAction: string,
    timeout: number = 5000
  ): Promise<ActionAnalysis> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('NLP service timeout')), timeout)
    );

    try {
      return await Promise.race([
        this.nlpService.analyzeActionSemantics(proposedAction),
        timeoutPromise,
      ]);
    } catch (error) {
      // Fallback to local pattern matching
      console.warn('NLP service unavailable, using local patterns:', error);
      return this.localActionAnalysis(proposedAction);
    }
  }

  /**
   * Local action analysis fallback using patterns
   */
  private localActionAnalysis(proposedAction: string): ActionAnalysis {
    let reversibility: 'high' | 'medium' | 'low' = 'medium';
    const likelyEffects: string[] = [];
    const stakeholderImpact: string[] = [];
    let temporalScope: 'immediate' | 'short-term' | 'long-term' | 'permanent' = 'short-term';

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
  public async assessFutureAction(
    sessionId: string,
    proposedAction: string
  ): Promise<{
    currentConstraints: string[];
    likelyEffects: string[];
    reversibilityAssessment: 'high' | 'medium' | 'low';
    recommendation: string;
  }> {
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
  public assessFutureActionSync(
    sessionId: string,
    proposedAction: string
  ): {
    currentConstraints: string[];
    likelyEffects: string[];
    reversibilityAssessment: 'high' | 'medium' | 'low';
    recommendation: string;
  } {
    // Use local analysis patterns as fallback
    let reversibilityAssessment: 'high' | 'medium' | 'low' = 'medium';
    const likelyEffects: string[] = [];

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

    const currentConstraints =
      constraintCount > 0
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
  private buildAssessment(
    sessionId: string,
    actionAnalysis: ActionAnalysis
  ): {
    currentConstraints: string[];
    likelyEffects: string[];
    reversibilityAssessment: 'high' | 'medium' | 'low';
    recommendation: string;
  } {
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

    const recommendation = this.generateRecommendation(
      constraintCount,
      actionAnalysis.reversibility
    );

    // Use lazy evaluation to avoid unnecessary array creation
    const currentConstraints =
      constraintCount > 0 ? Array.from(this.getConstraintsIterator(state)) : [];

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
  private cleanActionCache(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

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
  private *getConstraintsIterator(state: RealityState): Generator<string> {
    yield* state.pathsForeclosed;
    yield* state.stakeholderExpectations;
    yield* state.technicalDependencies;
  }

  /**
   * Generate recommendation based on current state
   */
  private generateRecommendation(
    constraintCount: number,
    reversibility: 'high' | 'medium' | 'low'
  ): string {
    if (
      constraintCount > REFLEXIVITY_CONFIG.CAUTION_CONSTRAINT_THRESHOLD &&
      reversibility === 'low'
    ) {
      return 'Caution: Many existing constraints and low reversibility. Consider more flexible approach.';
    }
    if (
      constraintCount > REFLEXIVITY_CONFIG.WARNING_CONSTRAINT_THRESHOLD &&
      reversibility === 'medium'
    ) {
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
  public clearSession(sessionId: string): void {
    this.realityStates.delete(sessionId);
    this.actionHistory.delete(sessionId);
    this.sessionTimestamps.delete(sessionId);

    // Clear cached action analyses for this session
    const keysToDelete: string[] = [];
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
  public getSessionSummary(sessionId: string): {
    totalActions: number;
    thinkingSteps: number;
    actionSteps: number;
    currentConstraints: number;
    optionsCreated: number;
    overallReversibility: 'high' | 'medium' | 'low';
  } {
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
    const overallReversibility: 'high' | 'medium' | 'low' =
      avgReversibility > 0.7 ? 'high' : avgReversibility > 0.3 ? 'medium' : 'low';

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
