/**
 * Module-level cache for technique data
 * Provides optimized access to frequently used technique information
 */
import { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
// Eagerly initialized at module load time
const registry = TechniqueRegistry.getInstance();
const techniques = Object.freeze(registry.getAllTechniques());
const techniqueSet = new Set(techniques);
export const TechniqueCache = {
    /**
     * Get all available techniques (cached)
     */
    getAllTechniques() {
        return techniques;
    },
    /**
     * Check if a technique is valid (O(1) lookup)
     */
    isValidTechnique(technique) {
        return techniqueSet.has(technique);
    },
    /**
     * Get the underlying registry instance
     */
    getRegistry() {
        return registry;
    },
};
//# sourceMappingURL=techniqueCache.js.map