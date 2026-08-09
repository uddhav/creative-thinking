/**
 * Technique Registry
 * Central registry for all technique handlers
 */
import type { LateralTechnique } from '../types/index.js';
import type { TechniqueHandler } from './types.js';
export declare class TechniqueRegistry {
    private static instance;
    private handlers;
    private readonly techniques;
    private constructor();
    static getInstance(): TechniqueRegistry;
    private registerHandlers;
    /**
     * Look up a handler without throwing when the id is unknown.
     *
     * `getHandler` throws, which is right where a missing handler means the
     * request cannot be served. Callers that already have a fallback path — a
     * transition hint that degrades to naming the technique, say — need the miss
     * to be a value rather than an exception, so one unknown id does not fail the
     * step that was otherwise complete.
     */
    tryGetHandler(technique: string): TechniqueHandler | undefined;
    getHandler(technique: string): TechniqueHandler;
    getAllTechniques(): LateralTechnique[];
    getTechniqueInfo(technique: LateralTechnique): import("./types.js").TechniqueInfo;
    getTechniqueSteps(technique: LateralTechnique): number;
    isValidTechnique(technique: string): technique is LateralTechnique;
}
//# sourceMappingURL=TechniqueRegistry.d.ts.map