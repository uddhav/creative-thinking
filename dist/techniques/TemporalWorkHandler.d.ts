/**
 * Temporal Work technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
export declare class TemporalWorkHandler extends BaseTechniqueHandler {
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
    getStepGuidance(step: number, problem: string): string;
    extractInsights(history: Array<{
        currentStep?: number;
        temporalLandscape?: {
            fixedDeadlines?: string[];
            kairosOpportunities?: string[];
        };
        temporalEscapeRoutes?: string[];
        nextStepNeeded?: boolean;
        output?: string;
    }>): string[];
}
//# sourceMappingURL=TemporalWorkHandler.d.ts.map