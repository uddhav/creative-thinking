/**
 * Meta-Learning from Path Integration technique handler
 * Improves integration capabilities by learning from path patterns across all techniques
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
interface MetaLearningStep {
    name: string;
    focus: string;
    emoji: string;
}
export declare class MetaLearningHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): MetaLearningStep;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    getPromptContext(step: number): Record<string, unknown>;
}
export {};
//# sourceMappingURL=MetaLearningHandler.d.ts.map