/**
 * Meta-Learning from Path Integration technique handler with reflexivity
 * Improves integration capabilities by learning from path patterns across all techniques
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class MetaLearningHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    getPromptContext(step: number): Record<string, unknown>;
}
//# sourceMappingURL=MetaLearningHandler.d.ts.map