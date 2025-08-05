/**
 * SessionCompletionTracker - Tracks session progress and completion status
 * Provides warnings and guidance for incomplete execution flows
 */

import type { SessionData, LateralTechnique } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';

/**
 * Technique completion status
 */
export interface TechniqueCompletionStatus {
  technique: LateralTechnique;
  totalSteps: number;
  completedSteps: number;
  completionPercentage: number;
  skippedSteps: number[];
  criticalStepsSkipped: string[];
}

/**
 * Session completion metadata
 */
export interface SessionCompletionMetadata {
  overallProgress: number;
  totalPlannedSteps: number;
  completedSteps: number;
  techniqueStatuses: TechniqueCompletionStatus[];
  skippedTechniques: LateralTechnique[];
  missedPerspectives: string[];
  criticalGapsIdentified: string[];
  completionWarnings: string[];
  minimumThresholdMet: boolean;
}

/**
 * Critical steps that should not be skipped for specific problem types
 */
const CRITICAL_STEPS: Record<
  string,
  { technique: LateralTechnique; step: string; reason: string }[]
> = {
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
  private readonly DEFAULT_MINIMUM_THRESHOLD = 0.8; // 80% completion recommended
  private readonly WARNING_THRESHOLD = 0.5; // 50% triggers warnings
  private readonly CRITICAL_THRESHOLD = 0.3; // 30% triggers critical warnings

  /**
   * Calculate session completion metadata
   */
  calculateCompletionMetadata(
    session: SessionData,
    plan?: PlanThinkingSessionOutput
  ): SessionCompletionMetadata {
    if (!plan) {
      // No plan means single technique execution
      return this.calculateSingleTechniqueCompletion(session);
    }

    const techniqueStatuses = this.calculateTechniqueStatuses(session, plan);
    const overallProgress = this.calculateOverallProgress(techniqueStatuses, plan);
    const skippedTechniques = this.identifySkippedTechniques(techniqueStatuses);
    const missedPerspectives = this.identifyMissedPerspectives(techniqueStatuses);
    const criticalGaps = this.identifyCriticalGaps(session.problem, techniqueStatuses);
    const warnings = this.generateCompletionWarnings(
      overallProgress,
      techniqueStatuses,
      criticalGaps
    );

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
  canProceedToSynthesis(metadata: SessionCompletionMetadata): {
    allowed: boolean;
    reason?: string;
    requiredActions?: string[];
  } {
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
  formatProgressDisplay(metadata: SessionCompletionMetadata): string {
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
  private calculateTechniqueStatuses(
    session: SessionData,
    plan: PlanThinkingSessionOutput
  ): TechniqueCompletionStatus[] {
    const statuses: TechniqueCompletionStatus[] = [];

    let currentStepIndex = 0;
    for (const workflow of plan.workflow) {
      const techniqueSteps = workflow.steps.length;
      const techniqueHistory = session.history.filter(
        h =>
          h.technique === workflow.technique &&
          h.currentStep > currentStepIndex &&
          h.currentStep <= currentStepIndex + techniqueSteps
      );

      const completedSteps = techniqueHistory.length;
      const skippedSteps: number[] = [];

      // Find skipped steps
      for (let i = 1; i <= techniqueSteps; i++) {
        const stepCompleted = techniqueHistory.some(h => h.currentStep === currentStepIndex + i);
        if (!stepCompleted && completedSteps > 0) {
          skippedSteps.push(i);
        }
      }

      // Identify critical skipped steps
      const criticalSkipped = this.identifyCriticalSkippedSteps(
        workflow.technique,
        skippedSteps,
        session.problem
      );

      statuses.push({
        technique: workflow.technique,
        totalSteps: techniqueSteps,
        completedSteps,
        completionPercentage: techniqueSteps > 0 ? completedSteps / techniqueSteps : 0,
        skippedSteps,
        criticalStepsSkipped: criticalSkipped,
      });

      currentStepIndex += techniqueSteps;
    }

    return statuses;
  }

  /**
   * Calculate overall progress
   */
  private calculateOverallProgress(
    statuses: TechniqueCompletionStatus[],
    plan: PlanThinkingSessionOutput
  ): number {
    const totalSteps = plan.totalSteps;
    const completedSteps = statuses.reduce((sum, s) => sum + s.completedSteps, 0);
    return totalSteps > 0 ? completedSteps / totalSteps : 0;
  }

  /**
   * Identify skipped techniques
   */
  private identifySkippedTechniques(statuses: TechniqueCompletionStatus[]): LateralTechnique[] {
    return statuses.filter(s => s.completedSteps === 0).map(s => s.technique);
  }

  /**
   * Identify missed perspectives
   */
  private identifyMissedPerspectives(statuses: TechniqueCompletionStatus[]): string[] {
    const missed: string[] = [];

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
  private identifyCriticalGaps(problem: string, statuses: TechniqueCompletionStatus[]): string[] {
    const gaps: string[] = [];
    const problemType = this.detectProblemType(problem);
    const criticalSteps = CRITICAL_STEPS[problemType] || [];

    criticalSteps.forEach(critical => {
      const status = statuses.find(s => s.technique === critical.technique);
      if (
        !status ||
        status.completedSteps === 0 ||
        (critical.step !== 'All' && status.criticalStepsSkipped.includes(critical.step))
      ) {
        gaps.push(`Missing ${critical.technique} - ${critical.reason}`);
      }
    });

    return gaps;
  }

  /**
   * Generate completion warnings
   */
  private generateCompletionWarnings(
    overallProgress: number,
    statuses: TechniqueCompletionStatus[],
    criticalGaps: string[]
  ): string[] {
    const warnings: string[] = [];

    // Critical warnings
    if (overallProgress < this.CRITICAL_THRESHOLD) {
      warnings.push(
        `⚠️ CRITICAL: Only ${Math.round(overallProgress * 100)}% complete. ` +
          `Missing ${Math.round((1 - overallProgress) * 100)}% of planned analysis may lead to flawed conclusions.`
      );
    } else if (overallProgress < this.WARNING_THRESHOLD) {
      warnings.push(
        `⚠️ Warning: ${Math.round(overallProgress * 100)}% complete. ` +
          `Consider completing more steps for comprehensive analysis.`
      );
    }

    // Critical gaps warnings
    if (criticalGaps.length > 0) {
      warnings.push(`⚠️ Critical gaps: ${criticalGaps.join(', ')}`);
    }

    // Specific technique warnings
    const blackHatStatus = statuses.find(
      s => s.technique === 'six_hats' && s.criticalStepsSkipped.includes('Black Hat')
    );
    if (blackHatStatus) {
      warnings.push('⚠️ Black Hat thinking skipped - critical risks may be overlooked');
    }

    return warnings;
  }

  /**
   * Create visual progress bar
   */
  private createProgressBar(progress: number, width: number = 20): string {
    const filled = Math.round(progress * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Format technique statuses for display
   */
  private formatTechniqueStatuses(statuses: TechniqueCompletionStatus[]): string {
    return statuses
      .map(s => {
        if (s.completedSteps === 0) return `[✗ ${s.technique}]`;
        if (s.completedSteps === s.totalSteps) return `[✓ ${s.technique}]`;
        return `[◐ ${s.technique}]`;
      })
      .join(' ');
  }

  /**
   * Detect problem type for critical step identification
   */
  private detectProblemType(problem: string): string {
    const lowerProblem = problem.toLowerCase();

    if (
      lowerProblem.includes('risk') ||
      lowerProblem.includes('security') ||
      lowerProblem.includes('safety') ||
      lowerProblem.includes('failure')
    ) {
      return 'risk_analysis';
    }

    if (
      lowerProblem.includes('technical') ||
      lowerProblem.includes('system') ||
      lowerProblem.includes('engineering') ||
      lowerProblem.includes('architecture')
    ) {
      return 'technical_systems';
    }

    if (
      lowerProblem.includes('user') ||
      lowerProblem.includes('experience') ||
      lowerProblem.includes('customer') ||
      lowerProblem.includes('interface')
    ) {
      return 'user_experience';
    }

    return 'general';
  }

  /**
   * Identify critical skipped steps for a technique
   */
  private identifyCriticalSkippedSteps(
    technique: LateralTechnique,
    skippedSteps: number[],
    _problem: string
  ): string[] {
    const critical: string[] = [];

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
  private calculateSingleTechniqueCompletion(session: SessionData): SessionCompletionMetadata {
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
      completionWarnings:
        progress < 0.8
          ? [`Consider completing all ${estimatedTotal} steps for comprehensive analysis`]
          : [],
      minimumThresholdMet: progress >= this.DEFAULT_MINIMUM_THRESHOLD,
    };
  }

  /**
   * Get estimated steps for a technique
   */
  private getEstimatedStepsForTechnique(technique: LateralTechnique): number {
    const stepCounts: Record<LateralTechnique, number> = {
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
  private countCompletedSteps(statuses: TechniqueCompletionStatus[]): number {
    return statuses.reduce((sum, s) => sum + s.completedSteps, 0);
  }
}
