/**
 * Common types and interfaces for technique handlers
 */
export interface TechniqueInfo {
    name: string;
    emoji: string;
    totalSteps: number;
    description: string;
    focus?: string;
    enhancedFocus?: string;
}
export interface TechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
    }>): string[];
}
export declare abstract class BaseTechniqueHandler implements TechniqueHandler {
    abstract getTechniqueInfo(): TechniqueInfo;
    abstract getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
    abstract getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, _data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
    }>): string[];
}
//# sourceMappingURL=types.d.ts.map