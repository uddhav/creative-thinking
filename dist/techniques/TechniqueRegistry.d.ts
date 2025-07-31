/**
 * Technique Registry
 * Central registry for all technique handlers
 */
import type { LateralTechnique } from '../types/index.js';
import type { TechniqueHandler } from './types.js';
export declare class TechniqueRegistry {
    private handlers;
    constructor();
    private registerHandlers;
    getHandler(technique: string): TechniqueHandler;
    getAllTechniques(): LateralTechnique[];
    getTechniqueInfo(technique: LateralTechnique): import("./types.js").TechniqueInfo;
    getTechniqueSteps(technique: LateralTechnique): number;
    isValidTechnique(technique: string): technique is LateralTechnique;
}
//# sourceMappingURL=TechniqueRegistry.d.ts.map