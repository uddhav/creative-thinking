/**
 * Response Protocols for Absorbing Barrier Early Warning System
 * Implements escape and mitigation strategies
 */

// Removed unused import
import { BarrierWarningLevel } from './types.js';
import type { EscapeProtocol, EscapeResponse, BarrierWarning } from './types.js';
import type { PathMemory } from '../types.js';
import type { SessionData } from '../../index.js';
import { getSecureRandomFloat, getSecureRandomBoolean } from '../../utils/secureRandom.js';

export class ResponseProtocolSystem {
  private protocolHistory: EscapeResponse[] = [];

  /**
   * Get all available response protocols
   */
  getAvailableProtocols(): EscapeProtocol[] {
    return [
      this.getPatternInterruptionProtocol(),
      this.getResourceReallocationProtocol(),
      this.getStakeholderResetProtocol(),
      this.getTechnicalRefactoringProtocol(),
      this.getStrategicPivotProtocol(),
    ];
  }

  /**
   * Level 1: Pattern Interruption Protocol
   */
  private getPatternInterruptionProtocol(): EscapeProtocol {
    return {
      level: 1,
      name: 'Pattern Interruption',
      description: 'Break current thinking patterns with random stimulus',
      automaticTrigger: false,
      requiredFlexibility: 0.1,
      estimatedFlexibilityGain: 0.3,
      steps: [
        'Stop current thinking approach immediately',
        'Use Random Entry technique with unrelated stimulus',
        'Challenge all current assumptions explicitly',
        'Seek opposite or contradictory perspectives',
        'Generate 5 wild alternatives without judgment',
      ],
      risks: [
        'May feel disorienting initially',
        'Could lose some current progress',
        'Team may resist sudden change',
      ],
      successProbability: 0.85,
    };
  }

  /**
   * Level 2: Resource Reallocation Protocol
   */
  private getResourceReallocationProtocol(): EscapeProtocol {
    return {
      level: 2,
      name: 'Resource Reallocation',
      description: 'Shift resources from commitment to exploration',
      automaticTrigger: false,
      requiredFlexibility: 0.2,
      estimatedFlexibilityGain: 0.25,
      steps: [
        'Identify all current resource commitments',
        'Classify as critical vs nice-to-have',
        'Free up 30-50% of resources from nice-to-have',
        'Create explicit exploration budget',
        'Invest freed resources in option generation',
        'Set up option portfolio tracking',
      ],
      risks: [
        'May slow current progress',
        'Stakeholder pushback possible',
        'Short-term productivity dip',
      ],
      successProbability: 0.75,
    };
  }

  /**
   * Level 3: Stakeholder Reset Protocol
   */
  private getStakeholderResetProtocol(): EscapeProtocol {
    return {
      level: 3,
      name: 'Stakeholder Reset',
      description: 'Renegotiate commitments and expectations',
      automaticTrigger: false,
      requiredFlexibility: 0.3,
      estimatedFlexibilityGain: 0.4,
      steps: [
        'Document current constraint situation clearly',
        'Prepare flexibility recovery plan',
        'Schedule stakeholder alignment session',
        'Present path dependency analysis',
        'Negotiate relaxed constraints',
        'Reset success criteria to enable flexibility',
        'Create new shared narrative',
        'Document new agreements',
      ],
      risks: [
        'Potential loss of stakeholder confidence',
        'May require significant time investment',
        'Political capital expenditure',
        'Possible scope/timeline impacts',
      ],
      successProbability: 0.65,
    };
  }

  /**
   * Level 4: Technical Refactoring Protocol
   */
  private getTechnicalRefactoringProtocol(): EscapeProtocol {
    return {
      level: 4,
      name: 'Technical Refactoring',
      description: 'Architectural renewal to restore flexibility',
      automaticTrigger: false,
      requiredFlexibility: 0.4,
      estimatedFlexibilityGain: 0.5,
      steps: [
        'Assess current technical debt comprehensively',
        'Identify coupling points and rigidities',
        'Design modular target architecture',
        'Create refactoring roadmap',
        'Implement interface abstractions',
        'Decouple tightly bound components',
        'Introduce flexibility points',
        'Build in future option value',
        'Test and validate new architecture',
      ],
      risks: [
        'Significant time investment required',
        'Temporary feature freeze possible',
        'Risk of introducing new bugs',
        'Team learning curve',
      ],
      successProbability: 0.7,
    };
  }

  /**
   * Level 5: Strategic Pivot Protocol
   */
  private getStrategicPivotProtocol(): EscapeProtocol {
    return {
      level: 5,
      name: 'Strategic Pivot',
      description: 'Fundamental change in approach or direction',
      automaticTrigger: false,
      requiredFlexibility: 0.5,
      estimatedFlexibilityGain: 0.7,
      steps: [
        'Acknowledge current path is not viable',
        'Return to fundamental objectives',
        'Question core assumptions about approach',
        'Explore radically different solution spaces',
        'Evaluate pivot options systematically',
        'Build coalition for new direction',
        'Create transition plan',
        'Communicate pivot rationale clearly',
        'Execute pivot with commitment',
        'Monitor and adjust new path',
      ],
      risks: [
        'High switching costs',
        'Significant stakeholder resistance',
        'Loss of sunk investments',
        'Team morale impact',
        'Market/competitive risks',
      ],
      successProbability: 0.5,
    };
  }

  /**
   * Execute an escape protocol
   */
  executeProtocol(
    protocol: EscapeProtocol,
    pathMemory: PathMemory,
    sessionData: SessionData,
    userConfirmation: boolean = true
  ): Promise<EscapeResponse> {
    const flexibilityBefore = pathMemory.currentFlexibility.flexibilityScore;

    // Check if user confirmation is required for high-level protocols
    if (!userConfirmation && protocol.level >= 4) {
      return Promise.resolve({
        protocol,
        executionTime: new Date().toISOString(),
        success: false,
        flexibilityBefore,
        flexibilityAfter: flexibilityBefore,
        flexibilityGained: 0,
        sideEffects: ['User confirmation required for high-impact protocols'],
        nextSteps: ['Obtain user confirmation before proceeding'],
        newConstraints: [],
      });
    }

    // Check if protocol can be executed
    if (flexibilityBefore < protocol.requiredFlexibility) {
      return Promise.resolve({
        protocol,
        executionTime: new Date().toISOString(),
        success: false,
        flexibilityBefore,
        flexibilityAfter: flexibilityBefore,
        flexibilityGained: 0,
        sideEffects: ['Insufficient flexibility to execute protocol'],
        nextSteps: ['Try lower-level protocol first'],
        newConstraints: [],
      });
    }

    // Simulate protocol execution
    const success = getSecureRandomBoolean(protocol.successProbability);
    const flexibilityGained = success
      ? protocol.estimatedFlexibilityGain * getSecureRandomFloat(0.8, 1.2)
      : 0;
    const flexibilityAfter = Math.min(1, flexibilityBefore + flexibilityGained);

    // Generate side effects
    const sideEffects = this.generateSideEffects(protocol, success, sessionData);

    // Generate next steps
    const nextSteps = this.generateNextSteps(protocol, success, sessionData);

    // Generate new constraints
    const newConstraints = this.generateNewConstraints(protocol, success);

    const response: EscapeResponse = {
      protocol,
      executionTime: new Date().toISOString(),
      success,
      flexibilityBefore,
      flexibilityAfter,
      flexibilityGained,
      sideEffects,
      nextSteps,
      newConstraints,
    };

    // Record in history
    this.protocolHistory.push(response);

    return Promise.resolve(response);
  }

  /**
   * Generate side effects from protocol execution
   */
  private generateSideEffects(
    protocol: EscapeProtocol,
    success: boolean,
    sessionData: SessionData
  ): string[] {
    const effects: string[] = [];

    if (success) {
      switch (protocol.level) {
        case 1:
          effects.push('Mental model shift achieved');
          effects.push('Some disorientation in team');
          if (sessionData.technique) {
            effects.push(`Interrupted ${sessionData.technique} technique`);
          }
          break;
        case 2:
          effects.push('Resources successfully reallocated');
          effects.push('Temporary productivity decrease');
          break;
        case 3:
          effects.push('Stakeholder alignment achieved');
          effects.push('Political capital spent');
          break;
        case 4:
          effects.push('Architecture improved');
          effects.push('Technical debt reduced');
          break;
        case 5:
          effects.push('Strategic direction changed');
          effects.push('Organization realigned');
          break;
      }
    } else {
      effects.push('Protocol execution failed');
      effects.push(...protocol.risks.slice(0, 2));
    }

    return effects;
  }

  /**
   * Generate next steps after protocol execution
   */
  private generateNextSteps(
    protocol: EscapeProtocol,
    success: boolean,
    sessionData: SessionData
  ): string[] {
    const baseSteps = success
      ? [
          'Monitor flexibility metrics closely',
          'Avoid high-commitment decisions temporarily',
          'Build on recovered flexibility',
          'Document lessons learned',
          'Prepare for potential regression',
        ]
      : [
          'Analyze failure reasons',
          'Consider lower-level protocol',
          'Address blocking factors',
          'Prepare for retry with modifications',
        ];

    // Add context-aware step based on current session
    const lastOperation = sessionData.history[sessionData.history.length - 1];
    if (lastOperation && lastOperation.currentStep < lastOperation.totalSteps && success) {
      baseSteps.push(`Resume ${sessionData.technique} from step ${lastOperation.currentStep + 1}`);
    }

    return baseSteps;
  }

  /**
   * Generate new constraints from protocol
   */
  private generateNewConstraints(protocol: EscapeProtocol, success: boolean): string[] {
    if (!success) return [];

    const constraints: string[] = [];

    switch (protocol.level) {
      case 3:
        constraints.push('New stakeholder agreements in place');
        break;
      case 4:
        constraints.push('Architecture must maintain modularity');
        break;
      case 5:
        constraints.push('Cannot return to previous strategic direction');
        break;
    }

    return constraints;
  }

  /**
   * Recommend protocol based on warning
   */
  recommendProtocol(warning: BarrierWarning, pathMemory: PathMemory): EscapeProtocol | null {
    const flexibility = pathMemory.currentFlexibility.flexibilityScore;
    const protocols = this.getAvailableProtocols();

    // Filter by flexibility requirement
    const viableProtocols = protocols.filter(p => p.requiredFlexibility <= flexibility);

    if (viableProtocols.length === 0) return null;

    // Select based on warning severity
    switch (warning.severity) {
      case BarrierWarningLevel.CRITICAL:
        // Use highest level viable protocol
        return viableProtocols.reduce((best, current) =>
          current.level > best.level ? current : best
        );
      case BarrierWarningLevel.WARNING:
        // Use mid-level protocol
        return viableProtocols.find(p => p.level === 2 || p.level === 3) || viableProtocols[0];
      default:
        // Use lowest level protocol
        return viableProtocols[0];
    }
  }

  /**
   * Get protocol execution history
   */
  getProtocolHistory(): EscapeResponse[] {
    return [...this.protocolHistory];
  }

  /**
   * Calculate protocol success rate
   */
  getProtocolSuccessRate(): Map<number, number> {
    const rates = new Map<number, number>();

    for (let level = 1; level <= 5; level++) {
      const attempts = this.protocolHistory.filter(r => r.protocol.level === level);
      if (attempts.length > 0) {
        const successes = attempts.filter(r => r.success).length;
        rates.set(level, successes / attempts.length);
      }
    }

    return rates;
  }

  /**
   * Get emergency response plan
   */
  getEmergencyResponsePlan(
    warnings: BarrierWarning[],
    pathMemory: PathMemory
  ): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const criticalWarnings = warnings.filter(w => w.severity === BarrierWarningLevel.CRITICAL);
    const currentFlexibility = pathMemory.currentFlexibility.flexibilityScore;

    const immediate = [
      'Stop all high-commitment decisions',
      'Execute Pattern Interruption Protocol',
      'Gather emergency response team',
      'Assess available flexibility',
    ];

    // Add urgency if multiple critical warnings
    if (criticalWarnings.length > 1) {
      immediate.unshift(`URGENT: ${criticalWarnings.length} critical barriers detected`);
    }

    const shortTerm = [
      'Implement Resource Reallocation',
      'Begin stakeholder communications',
      'Create flexibility recovery plan',
      'Monitor all barrier distances',
    ];

    // Add flexibility-specific guidance
    if (currentFlexibility < 0.2) {
      shortTerm.push('Priority: Recover flexibility above 20%');
    }

    return {
      immediate,
      shortTerm,
      longTerm: [
        'Consider Technical Refactoring',
        'Evaluate need for Strategic Pivot',
        'Build systematic flexibility reserves',
        'Implement continuous monitoring',
      ],
    };
  }
}
