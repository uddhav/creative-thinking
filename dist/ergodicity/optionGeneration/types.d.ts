/**
 * Core types for the Option Generation Engine
 */
import type { SessionState } from '../../persistence/types.js';
import type { PathMemory, FlexibilityState } from '../types.js';
/**
 * Represents a generated option for increasing flexibility
 */
export interface Option {
    id: string;
    name: string;
    description: string;
    strategy: OptionGenerationStrategy;
    category: OptionCategory;
    actions: string[];
    prerequisites: string[];
    flexibilityGain?: number;
    implementationCost?: number;
    reversibility?: number;
    synergyScore?: number;
    timeToValue?: number;
    generatedAt: string;
    expiresAt?: string;
    constraints?: string[];
}
/**
 * Categories of options
 */
export type OptionCategory = 'structural' | 'temporal' | 'relational' | 'resource' | 'capability' | 'conceptual' | 'process' | 'technical';
/**
 * Generation strategies available
 */
export type OptionGenerationStrategy = 'decomposition' | 'recombination' | 'abstraction' | 'inversion' | 'temporal' | 'stakeholder' | 'resource' | 'capability';
/**
 * Evaluation of an option's potential impact
 */
export interface OptionEvaluation {
    optionId: string;
    flexibilityGain: number;
    implementationCost: number;
    reversibility: number;
    synergyScore: number;
    timeToValue: number;
    overallScore: number;
    recommendation: 'highly_recommended' | 'recommended' | 'viable' | 'last_resort';
    reasoning: string;
}
/**
 * Context for option generation
 */
export interface OptionGenerationContext {
    sessionState: SessionState;
    pathMemory: PathMemory;
    currentFlexibility: FlexibilityState;
    targetOptionCount: number;
    preferredStrategies?: OptionGenerationStrategy[];
    constraints?: GenerationConstraint[];
}
/**
 * Constraints on option generation
 */
export interface GenerationConstraint {
    type: 'exclude_category' | 'min_reversibility' | 'max_cost' | 'time_limit';
    value: string | number;
}
/**
 * Result of option generation
 */
export interface OptionGenerationResult {
    options: Option[];
    evaluations: OptionEvaluation[];
    topRecommendation: Option | null;
    strategiesUsed: OptionGenerationStrategy[];
    generationTime: number;
    context: {
        initialFlexibility: number;
        projectedFlexibility: number;
        criticalConstraints: string[];
    };
}
/**
 * Tracking for implemented options
 */
export interface ImplementedOption {
    optionId: string;
    implementedAt: string;
    actualFlexibilityGain: number;
    actualCost: number;
    actualTimeToValue: number;
    success: boolean;
    learnings: string[];
}
/**
 * Major commitment that could be decomposed
 */
export interface DecomposableCommitment {
    id: string;
    description: string;
    currentStructure: string;
    decomposable: boolean;
    suggestedModules: string[];
    flexibilityGainPotential: number;
    effort: 'low' | 'medium' | 'high';
}
/**
 * Time-sensitive decision or option
 */
export interface TemporalOpportunity {
    id: string;
    description: string;
    currentDeadline: string;
    canDelay: boolean;
    delayBenefit: string;
    canAccelerate: boolean;
    accelerationBenefit: string;
    flexibilityImpact: number;
}
/**
 * Current assumption that could be inverted
 */
export interface InvertibleAssumption {
    id: string;
    assumption: string;
    domain: string;
    inversion: string;
    potentialBenefit: string;
    riskLevel: 'low' | 'medium' | 'high';
    exampleApplication: string;
}
//# sourceMappingURL=types.d.ts.map