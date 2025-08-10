/**
 * Module-level cache for technique data
 * Provides optimized access to frequently used technique information
 */
import { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
import type { LateralTechnique } from '../types/index.js';
export declare const TechniqueCache: {
    /**
     * Get all available techniques (cached)
     */
    readonly getAllTechniques: () => readonly LateralTechnique[];
    /**
     * Check if a technique is valid (O(1) lookup)
     */
    readonly isValidTechnique: (technique: string) => technique is LateralTechnique;
    /**
     * Get the underlying registry instance
     */
    readonly getRegistry: () => TechniqueRegistry;
};
//# sourceMappingURL=techniqueCache.d.ts.map