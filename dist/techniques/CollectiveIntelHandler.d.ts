/**
 * Collective Intelligence technique handler with reflexivity tracking
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class CollectiveIntelHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Report what each step actually recorded, labelled by the step.
     *
     * This reads `entry.output`. Reading only the structured fields meant a full
     * five-step session returned nothing but a completion banner, because the CLI
     * flag path never populates them — and the step indices were off by one
     * against the step names, so a "Find Patterns" output was labelled Synergy.
     * The structured fields still report when a caller supplies them.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        wisdomSources?: string[];
        emergentPatterns?: string[];
        synergyCombinations?: string[];
        collectiveInsights?: string[];
        output?: string;
    }>): string[];
}
//# sourceMappingURL=CollectiveIntelHandler.d.ts.map