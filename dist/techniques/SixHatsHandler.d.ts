/**
 * Six Thinking Hats technique handler
 */
import type { SixHatsColor } from '../types/index.js';
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
interface HatInfo {
    name: string;
    focus: string;
    emoji: string;
    enhancedFocus: string;
}
export declare class SixHatsHandler extends BaseTechniqueHandler {
    private readonly hats;
    private readonly hatOrder;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): HatInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: Array<{
        hatColor?: string;
        risks?: string[];
        output?: string;
    }>): string[];
    getHatColor(step: number): SixHatsColor;
    getAllHats(): Record<SixHatsColor, HatInfo>;
}
export {};
//# sourceMappingURL=SixHatsHandler.d.ts.map