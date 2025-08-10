/**
 * Module-level cache for technique data
 * Provides optimized access to frequently used technique information
 */

import { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
import type { LateralTechnique } from '../types/index.js';

// Eagerly initialized at module load time
const registry = TechniqueRegistry.getInstance();
const techniques: readonly LateralTechnique[] = Object.freeze(registry.getAllTechniques());
const techniqueSet: ReadonlySet<string> = new Set(techniques);

export const TechniqueCache = {
  /**
   * Get all available techniques (cached)
   */
  getAllTechniques(): readonly LateralTechnique[] {
    return techniques;
  },

  /**
   * Check if a technique is valid (O(1) lookup)
   */
  isValidTechnique(technique: string): technique is LateralTechnique {
    return techniqueSet.has(technique);
  },

  /**
   * Get the underlying registry instance
   */
  getRegistry(): TechniqueRegistry {
    return registry;
  },
} as const;
