/**
 * Latticework of Mental Models technique handler
 *
 * A 7-step multidisciplinary technique distilled from Charlie Munger's
 * 2008 Caltech lecture: "grab all the big ideas in all the disciplines"
 * so you become a man with multiple tools, rather than the man with a
 * hammer to whom every problem looks like a nail. Forces a problem through
 * four named disciplinary lenses, then synthesizes where they agree,
 * conflict, or stack.
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class LatticeworkHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
        output?: string;
    }>): string[];
}
//# sourceMappingURL=LatticeworkHandler.d.ts.map