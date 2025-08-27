/**
 * TechniqueScorer - Multi-factor scoring system for technique selection
 * Provides intelligent technique recommendations based on multiple factors
 */

import type { LateralTechnique } from '../../types/index.js';

export interface ScoringFactors {
  categoryFit: number;
  complexityMatch: number;
  constraintCompatibility: number;
  outcomeAlignment: number;
}

export interface ScoringWeights {
  categoryFit: number;
  complexityMatch: number;
  constraintCompatibility: number;
  outcomeAlignment: number;
}

export interface TechniqueMetadata {
  complexity: 'low' | 'medium' | 'high';
  handlesTimeConstraints: boolean;
  handlesResourceConstraints: boolean;
  handlesCollaborationNeeds: boolean;
  outcomeProfiles: {
    innovative: number;
    systematic: number;
    riskAware: number;
    collaborative: number;
    analytical: number;
  };
  stepCount: number;
}

export interface ProblemContext {
  category: string;
  complexity: 'low' | 'medium' | 'high';
  hasTimeConstraints: boolean;
  hasResourceConstraints: boolean;
  needsCollaboration: boolean;
  preferredOutcome?: string;
}

export class TechniqueScorer {
  private readonly DEFAULT_WEIGHTS: ScoringWeights = {
    categoryFit: 0.4,
    complexityMatch: 0.2,
    constraintCompatibility: 0.2,
    outcomeAlignment: 0.2,
  };

  private readonly techniqueMetadata: Record<LateralTechnique, TechniqueMetadata> = {
    // Creative Techniques
    six_hats: {
      complexity: 'medium',
      handlesTimeConstraints: true,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: true,
      outcomeProfiles: {
        innovative: 0.7,
        systematic: 0.9,
        riskAware: 1.0, // Black hat provides excellent risk analysis
        collaborative: 0.8,
        analytical: 0.7,
      },
      stepCount: 7,
    },
    po: {
      complexity: 'medium',
      handlesTimeConstraints: true,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.9,
        systematic: 0.4,
        riskAware: 0.5,
        collaborative: 0.3,
        analytical: 0.4,
      },
      stepCount: 4,
    },
    random_entry: {
      complexity: 'low',
      handlesTimeConstraints: true,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 1.0,
        systematic: 0.2,
        riskAware: 0.3,
        collaborative: 0.4,
        analytical: 0.2,
      },
      stepCount: 3,
    },
    scamper: {
      complexity: 'medium',
      handlesTimeConstraints: true,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: true,
      outcomeProfiles: {
        innovative: 0.8,
        systematic: 0.9,
        riskAware: 0.6,
        collaborative: 0.6,
        analytical: 0.5,
      },
      stepCount: 8,
    },
    concept_extraction: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.7,
        systematic: 0.7,
        riskAware: 0.4,
        collaborative: 0.3,
        analytical: 0.9,
      },
      stepCount: 4,
    },
    yes_and: {
      complexity: 'low',
      handlesTimeConstraints: true,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: true,
      outcomeProfiles: {
        innovative: 0.6,
        systematic: 0.3,
        riskAware: 0.2,
        collaborative: 1.0,
        analytical: 0.2,
      },
      stepCount: 4,
    },
    design_thinking: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: false,
      handlesCollaborationNeeds: true,
      outcomeProfiles: {
        innovative: 0.8,
        systematic: 0.8,
        riskAware: 0.6,
        collaborative: 0.9,
        analytical: 0.6,
      },
      stepCount: 5,
    },
    triz: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.7,
        systematic: 1.0,
        riskAware: 0.7,
        collaborative: 0.3,
        analytical: 0.8,
      },
      stepCount: 4,
    },
    disney_method: {
      complexity: 'medium',
      handlesTimeConstraints: true,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: true,
      outcomeProfiles: {
        innovative: 0.8,
        systematic: 0.6,
        riskAware: 0.7, // Critic role
        collaborative: 0.7,
        analytical: 0.5,
      },
      stepCount: 3,
    },
    nine_windows: {
      complexity: 'medium',
      handlesTimeConstraints: false,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.5,
        systematic: 1.0,
        riskAware: 0.6,
        collaborative: 0.4,
        analytical: 0.9,
      },
      stepCount: 9,
    },

    // Advanced Techniques
    neural_state: {
      complexity: 'medium',
      handlesTimeConstraints: true,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.6,
        systematic: 0.5,
        riskAware: 0.4,
        collaborative: 0.2,
        analytical: 0.7,
      },
      stepCount: 4,
    },
    temporal_work: {
      complexity: 'high',
      handlesTimeConstraints: true,
      handlesResourceConstraints: false,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.7,
        systematic: 0.8,
        riskAware: 0.6,
        collaborative: 0.3,
        analytical: 0.7,
      },
      stepCount: 5,
    },
    cultural_integration: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: false,
      handlesCollaborationNeeds: true,
      outcomeProfiles: {
        innovative: 0.7,
        systematic: 0.6,
        riskAware: 0.5,
        collaborative: 1.0,
        analytical: 0.5,
      },
      stepCount: 5,
    },
    collective_intel: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: false,
      handlesCollaborationNeeds: true,
      outcomeProfiles: {
        innovative: 0.7,
        systematic: 0.6,
        riskAware: 0.5,
        collaborative: 1.0,
        analytical: 0.6,
      },
      stepCount: 5,
    },
    quantum_superposition: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.9,
        systematic: 0.7,
        riskAware: 0.5,
        collaborative: 0.2,
        analytical: 0.8,
      },
      stepCount: 6,
    },
    temporal_creativity: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.8,
        systematic: 0.7,
        riskAware: 0.6,
        collaborative: 0.3,
        analytical: 0.7,
      },
      stepCount: 6,
    },
    paradoxical_problem: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.9,
        systematic: 0.5,
        riskAware: 0.5,
        collaborative: 0.3,
        analytical: 0.7,
      },
      stepCount: 5,
    },
    meta_learning: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.6,
        systematic: 0.7,
        riskAware: 0.5,
        collaborative: 0.3,
        analytical: 0.9,
      },
      stepCount: 5,
    },
    biomimetic_path: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: false,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.9,
        systematic: 0.7,
        riskAware: 0.6,
        collaborative: 0.3,
        analytical: 0.6,
      },
      stepCount: 6,
    },
    first_principles: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.7,
        systematic: 0.9,
        riskAware: 0.7,
        collaborative: 0.3,
        analytical: 1.0,
      },
      stepCount: 5,
    },
    neuro_computational: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: false,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.8,
        systematic: 0.8,
        riskAware: 0.5,
        collaborative: 0.2,
        analytical: 0.9,
      },
      stepCount: 6,
    },

    // Analytical Verification Techniques
    criteria_based_analysis: {
      complexity: 'medium',
      handlesTimeConstraints: true,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.2,
        systematic: 0.8,
        riskAware: 0.9,
        collaborative: 0.3,
        analytical: 1.0,
      },
      stepCount: 5,
    },
    linguistic_forensics: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.3,
        systematic: 0.7,
        riskAware: 0.8,
        collaborative: 0.2,
        analytical: 1.0,
      },
      stepCount: 6,
    },
    competing_hypotheses: {
      complexity: 'high',
      handlesTimeConstraints: false,
      handlesResourceConstraints: false,
      handlesCollaborationNeeds: true,
      outcomeProfiles: {
        innovative: 0.4,
        systematic: 0.9,
        riskAware: 0.9,
        collaborative: 0.5,
        analytical: 1.0,
      },
      stepCount: 8,
    },

    // Behavioral Economics Techniques
    reverse_benchmarking: {
      complexity: 'medium',
      handlesTimeConstraints: true,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.9,
        systematic: 0.6,
        riskAware: 0.5,
        collaborative: 0.3,
        analytical: 0.6,
      },
      stepCount: 5,
    },
    context_reframing: {
      complexity: 'medium',
      handlesTimeConstraints: true,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.7,
        systematic: 0.5,
        riskAware: 0.4,
        collaborative: 0.4,
        analytical: 0.5,
      },
      stepCount: 5,
    },
    perception_optimization: {
      complexity: 'medium',
      handlesTimeConstraints: true,
      handlesResourceConstraints: false,
      handlesCollaborationNeeds: false,
      outcomeProfiles: {
        innovative: 0.8,
        systematic: 0.4,
        riskAware: 0.3,
        collaborative: 0.3,
        analytical: 0.5,
      },
      stepCount: 5,
    },
    anecdotal_signal: {
      complexity: 'medium',
      handlesTimeConstraints: false,
      handlesResourceConstraints: true,
      handlesCollaborationNeeds: true,
      outcomeProfiles: {
        innovative: 0.8,
        systematic: 0.5,
        riskAware: 0.7,
        collaborative: 0.6,
        analytical: 0.6,
      },
      stepCount: 6,
    },
  };

  constructor(weights?: ScoringWeights) {
    // Store weights internally, using defaults if not provided
    this.weights = weights ? { ...weights } : { ...this.DEFAULT_WEIGHTS };

    // Normalize weights to ensure they sum to 1
    const sum =
      this.weights.categoryFit +
      this.weights.complexityMatch +
      this.weights.constraintCompatibility +
      this.weights.outcomeAlignment;

    if (Math.abs(sum - 1.0) > 0.01) {
      // Auto-normalize if weights don't sum to 1
      this.weights.categoryFit /= sum;
      this.weights.complexityMatch /= sum;
      this.weights.constraintCompatibility /= sum;
      this.weights.outcomeAlignment /= sum;
    }
  }

  private weights: ScoringWeights;

  /**
   * Calculate multi-factor score for a technique given the problem context
   */
  calculateScore(
    technique: LateralTechnique,
    context: ProblemContext,
    categoryScore: number // Base category fit score from existing logic
  ): number {
    const metadata = this.techniqueMetadata[technique];
    if (!metadata) {
      return categoryScore; // Fallback to simple category score
    }

    const factors: ScoringFactors = {
      categoryFit: this.normalizScore(categoryScore),
      complexityMatch: this.calculateComplexityMatch(metadata.complexity, context.complexity),
      constraintCompatibility: this.calculateConstraintCompatibility(metadata, context),
      outcomeAlignment: this.calculateOutcomeAlignment(metadata, context.preferredOutcome),
    };

    // Calculate weighted average
    return (
      factors.categoryFit * this.weights.categoryFit +
      factors.complexityMatch * this.weights.complexityMatch +
      factors.constraintCompatibility * this.weights.constraintCompatibility +
      factors.outcomeAlignment * this.weights.outcomeAlignment
    );
  }

  /**
   * Get detailed scoring breakdown for debugging/transparency
   */
  getScoreBreakdown(
    technique: LateralTechnique,
    context: ProblemContext,
    categoryScore: number
  ): ScoringFactors & { final: number } {
    const metadata = this.techniqueMetadata[technique];
    if (!metadata) {
      const normalized = this.normalizScore(categoryScore);
      return {
        categoryFit: normalized,
        complexityMatch: normalized,
        constraintCompatibility: normalized,
        outcomeAlignment: normalized,
        final: normalized,
      };
    }

    const factors: ScoringFactors = {
      categoryFit: this.normalizScore(categoryScore),
      complexityMatch: this.calculateComplexityMatch(metadata.complexity, context.complexity),
      constraintCompatibility: this.calculateConstraintCompatibility(metadata, context),
      outcomeAlignment: this.calculateOutcomeAlignment(metadata, context.preferredOutcome),
    };

    const final =
      factors.categoryFit * this.weights.categoryFit +
      factors.complexityMatch * this.weights.complexityMatch +
      factors.constraintCompatibility * this.weights.constraintCompatibility +
      factors.outcomeAlignment * this.weights.outcomeAlignment;

    return { ...factors, final };
  }

  /**
   * Calculate complexity match score
   */
  private calculateComplexityMatch(
    techniqueComplexity: 'low' | 'medium' | 'high',
    problemComplexity: 'low' | 'medium' | 'high'
  ): number {
    const complexityMap = { low: 1, medium: 2, high: 3 };
    const techniquLevel = complexityMap[techniqueComplexity];
    const problemLevel = complexityMap[problemComplexity];

    // Perfect match = 1.0
    if (techniquLevel === problemLevel) return 1.0;

    // Technique too simple for problem = lower score
    if (techniquLevel < problemLevel) {
      const diff = problemLevel - techniquLevel;
      return Math.max(0.3, 1.0 - diff * 0.3);
    }

    // Technique too complex for problem = moderate penalty
    const diff = techniquLevel - problemLevel;
    return Math.max(0.5, 1.0 - diff * 0.2);
  }

  /**
   * Calculate constraint compatibility score
   */
  private calculateConstraintCompatibility(
    metadata: TechniqueMetadata,
    context: ProblemContext
  ): number {
    let score = 1.0;
    let constraintCount = 0;

    if (context.hasTimeConstraints) {
      constraintCount++;
      if (!metadata.handlesTimeConstraints) {
        score -= 0.3;
      }
    }

    if (context.hasResourceConstraints) {
      constraintCount++;
      if (!metadata.handlesResourceConstraints) {
        score -= 0.3;
      }
    }

    if (context.needsCollaboration) {
      constraintCount++;
      if (!metadata.handlesCollaborationNeeds) {
        score -= 0.4; // Collaboration is more critical
      }
    }

    // No constraints = all techniques equally good
    if (constraintCount === 0) return 0.8;

    return Math.max(0.1, score);
  }

  /**
   * Calculate outcome alignment score
   */
  private calculateOutcomeAlignment(
    metadata: TechniqueMetadata,
    preferredOutcome?: string
  ): number {
    if (!preferredOutcome) {
      // No preference = neutral score
      return 0.6;
    }

    const outcomeKey = preferredOutcome as keyof typeof metadata.outcomeProfiles;
    return metadata.outcomeProfiles[outcomeKey] ?? 0.5;
  }

  /**
   * Normalize score to 0-1 range
   */
  private normalizScore(score: number): number {
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get technique metadata for external use
   */
  getTechniqueMetadata(technique: LateralTechnique): TechniqueMetadata | undefined {
    return this.techniqueMetadata[technique];
  }

  /**
   * Estimate execution time based on complexity and step count
   */
  estimateExecutionTime(technique: LateralTechnique): 'quick' | 'moderate' | 'extensive' {
    const metadata = this.techniqueMetadata[technique];
    if (!metadata) return 'moderate';

    const complexityScore = { low: 1, medium: 2, high: 3 }[metadata.complexity];
    const stepScore = metadata.stepCount <= 4 ? 1 : metadata.stepCount <= 6 ? 2 : 3;
    const totalScore = complexityScore + stepScore;

    if (totalScore <= 3) return 'quick';
    if (totalScore <= 5) return 'moderate';
    return 'extensive';
  }
}
