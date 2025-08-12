/**
 * Reflexivity Tracker
 * Tracks post-action reflexive effects during creative thinking execution
 */

import type { StepType, ReflexiveEffects } from '../techniques/types.js';

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

    // Store action record
    if (!this.actionHistory.has(sessionId)) {
      this.actionHistory.set(sessionId, []);
    }
    const history = this.actionHistory.get(sessionId);
    if (history) {
      history.push(record);
    }

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

    // Check for overconstrained environment (future enhancement point)
    if (existingConstraints > 5 || existingExpectations > 5) {
      // Future: Could trigger warnings about overconstrained solution space
      // For now, we just track this for potential future use
      const isOverconstrained = true;
      if (isOverconstrained) {
        // This flag could be used to adjust reflexivity assessment
        // or provide warnings to the user in future versions
      }
    }

    // Map reflexive effects to reality state changes
    if (effects.realityChanges.length > 0) {
      // Parse reality changes for different categories
      effects.realityChanges.forEach(change => {
        const lowerChange = change.toLowerCase();
        if (
          lowerChange.includes('expectation') ||
          lowerChange.includes('expect') ||
          lowerChange.includes('believes')
        ) {
          if (!changes.stakeholderExpectations) changes.stakeholderExpectations = [];
          changes.stakeholderExpectations.push(change);
        } else if (
          lowerChange.includes('resource') ||
          lowerChange.includes('allocat') ||
          lowerChange.includes('budget')
        ) {
          if (!changes.resourceCommitments) changes.resourceCommitments = [];
          changes.resourceCommitments.push(change);
        } else if (lowerChange.includes('relation') || lowerChange.includes('team')) {
          if (!changes.relationshipDynamics) changes.relationshipDynamics = [];
          changes.relationshipDynamics.push(change);
        } else if (
          lowerChange.includes('technical') ||
          lowerChange.includes('depend') ||
          lowerChange.includes('architecture')
        ) {
          if (!changes.technicalDependencies) changes.technicalDependencies = [];
          changes.technicalDependencies.push(change);
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

    // Merge changes into state
    Object.entries(changes).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const stateKey = key as keyof RealityState;
        // Initialize array if it doesn't exist
        if (!state[stateKey]) {
          // Type-safe initialization for array properties
          if (
            stateKey === 'stakeholderExpectations' ||
            stateKey === 'resourceCommitments' ||
            stateKey === 'relationshipDynamics' ||
            stateKey === 'technicalDependencies' ||
            stateKey === 'pathsForeclosed' ||
            stateKey === 'optionsCreated'
          ) {
            state[stateKey] = [];
          }
        }
        // Add new values if the state property is an array
        const stateValue = state[stateKey];
        if (Array.isArray(stateValue)) {
          stateValue.push(...value);
        }
      }
    });

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
   * Get reflexivity assessment for future actions
   */
  public assessFutureAction(
    sessionId: string,
    proposedAction: string
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
        likelyEffects: ['No prior actions to assess'],
        reversibilityAssessment: 'high',
        recommendation: 'Proceed with awareness that this is the first action',
      };
    }

    const currentConstraints = [
      ...state.pathsForeclosed,
      ...state.stakeholderExpectations,
      ...state.technicalDependencies,
    ];

    // Assess based on action keywords (case-insensitive)
    let reversibilityAssessment: 'high' | 'medium' | 'low' = 'medium';
    const likelyEffects: string[] = [];
    const lowerAction = proposedAction.toLowerCase();

    if (lowerAction.includes('eliminat') || lowerAction.includes('remov')) {
      reversibilityAssessment = 'low';
      likelyEffects.push('Permanent removal of capabilities');
    }
    if (lowerAction.includes('communicat') || lowerAction.includes('announc')) {
      reversibilityAssessment = 'low';
      likelyEffects.push('Creates stakeholder expectations');
    }
    if (lowerAction.includes('test') || lowerAction.includes('experiment')) {
      reversibilityAssessment = 'high';
      likelyEffects.push('Learning without commitment');
    }

    const recommendation = this.generateRecommendation(
      currentConstraints.length,
      reversibilityAssessment
    );

    return {
      currentConstraints,
      likelyEffects,
      reversibilityAssessment,
      recommendation,
    };
  }

  /**
   * Generate recommendation based on current state
   */
  private generateRecommendation(
    constraintCount: number,
    reversibility: 'high' | 'medium' | 'low'
  ): string {
    if (constraintCount > 10 && reversibility === 'low') {
      return 'Caution: Many existing constraints and low reversibility. Consider more flexible approach.';
    }
    if (constraintCount > 5 && reversibility === 'medium') {
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
