/**
 * Collective Intelligence technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
export declare class CollectiveIntelHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: any[]): string[];
}
//# sourceMappingURL=CollectiveIntelHandler.d.ts.map