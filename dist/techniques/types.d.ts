/**
 * Common types and interfaces for technique handlers
 */
/**
 * Step types for reflexivity tracking
 */
export type StepType = 'thinking' | 'action';
/**
 * Reflexive effects that occur after action steps
 */
export interface ReflexiveEffects {
    triggers: string[];
    realityChanges: string[];
    futureConstraints: string[];
    reversibility: 'high' | 'medium' | 'low' | 'very_low';
}
/**
 * Enhanced step information with reflexivity awareness
 */
export interface StepInfo {
    name: string;
    focus: string;
    emoji: string;
    type?: StepType;
    reflexiveEffects?: ReflexiveEffects;
}
export interface TechniqueInfo {
    name: string;
    emoji: string;
    totalSteps: number;
    description: string;
    focus?: string;
    enhancedFocus?: string;
    parallelSteps?: {
        canParallelize: boolean;
        dependencies?: Array<[number, number]>;
        description?: string;
    };
    reflexivityProfile?: {
        primaryCommitmentType: 'relationship' | 'path' | 'structural' | 'behavioral' | 'technical' | 'strategic' | 'environmental' | 'perceptual' | 'exploratory' | 'observational';
        overallReversibility: 'high' | 'medium' | 'low' | 'very_low';
        riskLevel: 'low' | 'medium' | 'high';
    };
}
export interface TechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
    }>): string[];
}
export declare abstract class BaseTechniqueHandler implements TechniqueHandler {
    abstract getTechniqueInfo(): TechniqueInfo;
    abstract getStepInfo(step: number): StepInfo;
    abstract getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, _data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
    }>): string[];
}
//# sourceMappingURL=types.d.ts.map