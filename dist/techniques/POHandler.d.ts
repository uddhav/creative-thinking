/**
 * PO (Provocative Operation) technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
export declare class POHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: any[]): string[];
}
//# sourceMappingURL=POHandler.d.ts.map