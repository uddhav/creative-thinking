/**
 * Escape Velocity Calculator
 * Calculates requirements for breaking free from constraints
 */

import type {
  EscapeAnalysis,
  EscapeTrajectory,
  EscapeExecutionPlan,
  ResourceInventory,
  ConstraintAnalysis,
  ConstraintItem,
  EscapeContext,
  EscapePhase,
  EscapeProtocol,
} from './types.js';
import { EscapeProtocolFactory } from './protocols.js';
import { EscapeLevel } from './types.js';

export class EscapeVelocityCalculator {
  private protocolFactory = new EscapeProtocolFactory();
  private readonly safetyFactor = 1.2; // 20% safety margin

  /**
   * Calculate escape requirements based on current state
   */
  calculateEscapeRequirements(context: EscapeContext): EscapeAnalysis {
    const constraintAnalysis = this.analyzeConstraints(context);
    const escapeForceNeeded = constraintAnalysis.totalStrength * this.safetyFactor;
    const resourceInventory = this.inventoryResources(context);
    const availableResources = this.calculateTotalResources(resourceInventory);

    const trajectory = this.optimizeEscapePath(
      constraintAnalysis,
      resourceInventory,
      context.currentFlexibility.flexibilityScore
    );

    const feasibility = availableResources >= escapeForceNeeded;
    const resourceGap = Math.max(0, escapeForceNeeded - availableResources);
    const successProbability = this.calculateSuccessOdds(
      trajectory,
      availableResources,
      escapeForceNeeded
    );

    const executionPlan = this.generateEscapePlan(trajectory, constraintAnalysis);

    const warnings = this.generateWarnings(
      feasibility,
      resourceGap,
      successProbability,
      constraintAnalysis
    );

    return {
      currentFlexibility: context.currentFlexibility.flexibilityScore,
      constraintStrength: constraintAnalysis.totalStrength,
      escapeForceNeeded,
      availableResources,
      feasibility,
      resourceGap,
      optimalTrajectory: trajectory,
      successProbability,
      executionPlan,
      warnings,
    };
  }

  /**
   * Analyze constraints affecting the current state
   */
  private analyzeConstraints(context: EscapeContext): ConstraintAnalysis {
    const constraints: ConstraintItem[] = [];

    // Technical constraints
    if (context.pathMemory.constraints.length > 0) {
      constraints.push({
        id: 'technical_constraints',
        type: 'technical',
        name: 'Technical Dependencies',
        strength: Math.min(context.pathMemory.constraints.length * 0.1, 1),
        flexibility: 0.3,
        breakCost: 0.4,
        dependencies: context.pathMemory.constraints.map(c => c.id),
      });
    }

    // Cognitive constraints
    const cognitiveRigidity = this.assessCognitiveRigidity(context);
    if (cognitiveRigidity > 0.3) {
      constraints.push({
        id: 'cognitive_lock_in',
        type: 'cognitive',
        name: 'Mental Model Lock-in',
        strength: cognitiveRigidity,
        flexibility: 0.2,
        breakCost: 0.3,
        dependencies: ['assumptions', 'mental_models'],
      });
    }

    // Social constraints
    const socialCommitments = this.assessSocialCommitments(context);
    if (socialCommitments > 0.2) {
      constraints.push({
        id: 'social_commitments',
        type: 'social',
        name: 'Stakeholder Commitments',
        strength: socialCommitments,
        flexibility: 0.4,
        breakCost: 0.5,
        dependencies: ['stakeholder_expectations', 'public_commitments'],
      });
    }

    // Financial constraints
    const financialLimitations = this.assessFinancialConstraints(context);
    if (financialLimitations > 0.3) {
      constraints.push({
        id: 'financial_limits',
        type: 'financial',
        name: 'Resource Limitations',
        strength: financialLimitations,
        flexibility: 0.1,
        breakCost: 0.7,
        dependencies: ['budget', 'resource_allocation'],
      });
    }

    // Calculate total strength including interaction effects
    const baseStrength =
      constraints.reduce((sum, c) => sum + c.strength, 0) / Math.max(constraints.length, 1);
    const interactionEffects = this.calculateInteractionEffects(constraints);
    const totalStrength = Math.min(baseStrength * (1 + interactionEffects), 1);

    // Find dominant constraint
    const dominantConstraint = constraints.reduce(
      (max, c) => (c.strength > max.strength ? c : max),
      constraints[0] || this.createDefaultConstraint()
    );

    // Calculate breakability
    const breakabilityScore =
      constraints.length > 0
        ? constraints.reduce((sum, c) => sum + c.flexibility, 0) / constraints.length
        : 0.5;

    return {
      constraints,
      totalStrength,
      dominantConstraint,
      interactionEffects,
      breakabilityScore,
    };
  }

  /**
   * Inventory available resources
   */
  private inventoryResources(context: EscapeContext): ResourceInventory {
    // Calculate based on session state and flexibility
    const flexibility = context.currentFlexibility.flexibilityScore;

    return {
      timeAvailable: this.estimateTimeResource(context),
      attentionBudget: flexibility * 0.8,
      socialCapital: this.estimateSocialCapital(context),
      technicalCapacity: this.estimateTechnicalCapacity(context),
      financialResources: 0.5, // Default medium resources
      organizationalSupport: flexibility * 0.6,
    };
  }

  /**
   * Calculate total available resources
   */
  private calculateTotalResources(inventory: ResourceInventory): number {
    const weights = {
      time: 0.2,
      attention: 0.2,
      social: 0.15,
      technical: 0.2,
      financial: 0.15,
      organizational: 0.1,
    };

    return (
      inventory.timeAvailable * weights.time +
      inventory.attentionBudget * weights.attention +
      inventory.socialCapital * weights.social +
      inventory.technicalCapacity * weights.technical +
      inventory.financialResources * weights.financial +
      inventory.organizationalSupport * weights.organizational
    );
  }

  /**
   * Optimize escape path based on constraints and resources
   */
  private optimizeEscapePath(
    constraints: ConstraintAnalysis,
    resources: ResourceInventory,
    currentFlexibility: number
  ): EscapeTrajectory {
    // Get recommended protocol
    const protocol = this.protocolFactory.recommendProtocol(
      currentFlexibility,
      constraints.totalStrength
    );

    if (!protocol) {
      // Flexibility too low for any protocol - use emergency pattern interruption
      const emergencyProtocol = this.protocolFactory.getProtocol(EscapeLevel.PATTERN_INTERRUPTION)!;
      return this.createEmergencyTrajectory(emergencyProtocol);
    }

    // Create phases based on protocol
    const phases = this.createEscapePhases(protocol, constraints, resources);

    // Calculate critical path
    const criticalPath = phases.filter(p => p.successCriteria.length > 2).map(p => p.name);

    // Identify dependencies
    const dependencies = this.identifyEscapeDependencies(constraints, protocol);

    return {
      protocol,
      phases,
      totalDuration: protocol.executionTime,
      criticalPath,
      dependencies,
    };
  }

  /**
   * Create escape phases for a protocol
   */
  private createEscapePhases(
    protocol: EscapeProtocol,
    constraints: ConstraintAnalysis,
    resources: ResourceInventory
  ): EscapePhase[] {
    const phases: EscapePhase[] = [];

    // Phase 1: Preparation
    phases.push({
      name: 'Preparation',
      actions: [
        'Assess current state',
        'Identify key constraints',
        'Rally resources',
        'Communicate intent',
      ],
      duration: '30 minutes',
      requiredResources: ['attention', 'communication_channels'],
      successCriteria: ['Clear constraint map', 'Resource commitment', 'Stakeholder awareness'],
      rollbackPlan: 'Return to current state with learnings',
    });

    // Phase 2: Execution
    phases.push({
      name: 'Execution',
      actions: protocol.steps.slice(0, 4),
      duration: protocol.executionTime,
      requiredResources: Object.keys(resources).filter(
        r => resources[r as keyof ResourceInventory] > 0.5
      ),
      successCriteria: [
        'Constraint reduction > 30%',
        'New options created',
        'Flexibility increased',
      ],
      rollbackPlan: 'Gradual retreat with partial gains',
    });

    // Phase 3: Consolidation
    phases.push({
      name: 'Consolidation',
      actions: ['Secure gains', 'Document learnings', 'Establish new baseline', 'Plan next steps'],
      duration: '1 hour',
      requiredResources: ['attention', 'documentation'],
      successCriteria: ['Gains protected', 'Learnings captured', 'Team aligned'],
      rollbackPlan: 'Maintain current gains',
    });

    return phases;
  }

  /**
   * Calculate success probability
   */
  private calculateSuccessOdds(
    trajectory: EscapeTrajectory,
    availableResources: number,
    requiredResources: number
  ): number {
    const resourceRatio = availableResources / requiredResources;
    const protocolSuccess = trajectory.protocol.successProbability;
    const complexityPenalty = Math.max(0, 1 - trajectory.phases.length * 0.1);

    return Math.min(
      resourceRatio * protocolSuccess * complexityPenalty,
      0.95 // Cap at 95% to reflect inherent uncertainty
    );
  }

  /**
   * Generate execution plan
   */
  private generateEscapePlan(
    trajectory: EscapeTrajectory,
    _constraints: ConstraintAnalysis
  ): EscapeExecutionPlan {
    const contingencies = new Map<string, string[]>();

    // Add contingencies for major risks
    contingencies.set('resource_shortage', [
      'Reduce scope to critical constraints',
      'Seek additional resources',
      'Extend timeline',
    ]);

    contingencies.set('stakeholder_resistance', [
      'Enhanced communication plan',
      'Phased approach',
      'Success story demonstration',
    ]);

    contingencies.set('technical_failure', [
      'Fallback to simpler protocol',
      'External expertise',
      'Incremental approach',
    ]);

    return {
      immediateActions: trajectory.phases[0].actions,
      shortTermActions: trajectory.protocol.steps.slice(0, 3),
      mediumTermActions: trajectory.protocol.steps.slice(3),
      monitoringPlan: [
        'Track flexibility score changes',
        'Monitor constraint strength',
        'Measure option creation rate',
        'Assess stakeholder sentiment',
      ],
      successMetrics: [
        'Flexibility increase > 30%',
        'Constraint reduction > 40%',
        'New viable options > 5',
        'Team morale maintained',
      ],
      contingencyPlans: contingencies,
    };
  }

  /**
   * Generate warnings based on analysis
   */
  private generateWarnings(
    feasibility: boolean,
    resourceGap: number,
    successProbability: number,
    constraints: ConstraintAnalysis
  ): string[] {
    const warnings: string[] = [];

    if (!feasibility) {
      warnings.push(`Resource gap of ${(resourceGap * 100).toFixed(0)}% - escape may be difficult`);
    }

    if (successProbability < 0.5) {
      warnings.push('Low success probability - consider incremental approach');
    }

    if (constraints.totalStrength > 0.8) {
      warnings.push('Very high constraint strength - multiple escape attempts may be needed');
    }

    if (constraints.interactionEffects > 0.3) {
      warnings.push('High constraint coupling - removing one may affect others');
    }

    if (constraints.breakabilityScore < 0.3) {
      warnings.push('Constraints are rigid - flexibility gains may be limited');
    }

    return warnings;
  }

  // Helper methods

  private assessCognitiveRigidity(context: EscapeContext): number {
    const pathHistory = context.pathMemory.pathHistory;
    if (pathHistory.length < 5) return 0.2;

    // Check for repetitive patterns
    const techniques = pathHistory.slice(-10).map(p => p.technique);
    const uniqueTechniques = new Set(techniques).size;
    const repetitionScore = 1 - uniqueTechniques / techniques.length;

    return Math.min(repetitionScore * 1.5, 1);
  }

  private assessSocialCommitments(context: EscapeContext): number {
    // Based on commitment levels in path history
    const recentCommitments = context.pathMemory.pathHistory.slice(-10).map(p => p.commitmentLevel);

    if (recentCommitments.length === 0) return 0.1;

    return recentCommitments.reduce((sum, c) => sum + c, 0) / recentCommitments.length;
  }

  private assessFinancialConstraints(_context: EscapeContext): number {
    // Simplified assessment - could be enhanced with actual resource tracking
    return 0.4; // Default moderate financial constraints
  }

  private estimateTimeResource(context: EscapeContext): number {
    const sessionDuration = context.sessionData.endTime
      ? context.sessionData.endTime - (context.sessionData.startTime || Date.now())
      : Date.now() - (context.sessionData.startTime || Date.now());

    // More time in session = less time resource available
    const hoursSpent = sessionDuration / (1000 * 60 * 60);
    return Math.max(0.1, 1 - hoursSpent / 4); // Assume 4 hour max session
  }

  private estimateSocialCapital(context: EscapeContext): number {
    // Based on stakeholder resets already used
    const resetsUsed = context.pathMemory.pathHistory.filter(
      p =>
        p.decision.toLowerCase().includes('reset') ||
        p.decision.toLowerCase().includes('renegotiate')
    ).length;

    return Math.max(0.1, 1 - resetsUsed * 0.2);
  }

  private estimateTechnicalCapacity(context: EscapeContext): number {
    // Based on technical debt and complexity
    const constraints = context.pathMemory.constraints.length;
    const complexity = Math.min(constraints * 0.1, 1);

    return Math.max(0.2, 1 - complexity);
  }

  private calculateInteractionEffects(constraints: ConstraintItem[]): number {
    if (constraints.length < 2) return 0;

    // Constraints of different types interact less
    const types = new Set(constraints.map(c => c.type));
    const typeDiversity = types.size / constraints.length;

    // More diversity = less interaction
    return Math.max(0, 0.5 - typeDiversity);
  }

  private createDefaultConstraint(): ConstraintItem {
    return {
      id: 'default',
      type: 'cognitive',
      name: 'General Rigidity',
      strength: 0.3,
      flexibility: 0.5,
      breakCost: 0.3,
      dependencies: [],
    };
  }

  private createEmergencyTrajectory(protocol: EscapeProtocol): EscapeTrajectory {
    return {
      protocol,
      phases: [
        {
          name: 'Emergency Pattern Break',
          actions: ['STOP everything', 'Random stimulus injection', 'Perspective inversion'],
          duration: '15 minutes',
          requiredResources: ['attention'],
          successCriteria: ['Mental state shifted', 'New perspective gained'],
          rollbackPlan: 'None - commit to change',
        },
      ],
      totalDuration: '15 minutes',
      criticalPath: ['Emergency Pattern Break'],
      dependencies: ['Willingness to change'],
    };
  }

  private identifyEscapeDependencies(
    constraints: ConstraintAnalysis,
    protocol: EscapeProtocol
  ): string[] {
    const dependencies: string[] = [];

    // Protocol-specific dependencies
    if (protocol.level >= EscapeLevel.STAKEHOLDER_RESET) {
      dependencies.push('Stakeholder availability');
    }

    if (protocol.level >= EscapeLevel.TECHNICAL_REFACTORING) {
      dependencies.push('Technical resources');
    }

    // Constraint-based dependencies
    constraints.constraints.forEach(c => {
      dependencies.push(...c.dependencies);
    });

    return [...new Set(dependencies)]; // Remove duplicates
  }
}
