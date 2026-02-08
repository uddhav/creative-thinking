/**
 * Persona Catalog - Built-in personas and external loading
 *
 * Hybrid approach: TypeScript const for built-in personas with type safety,
 * optional JSON file for external personas loaded via PERSONA_CATALOG_PATH env var.
 */
import type { PersonaDefinition } from './types.js';
export declare const BUILTIN_PERSONAS: Record<string, PersonaDefinition>;
/**
 * Load and validate external personas from a JSON file.
 * Includes path traversal protection and input sanitization.
 */
export declare function loadExternalPersonas(path: string): Record<string, PersonaDefinition>;
/**
 * Get the merged catalog: built-in + external (external overrides built-in on same ID).
 * Result is cached after first load. Call invalidateCatalogCache() to force reload.
 */
export declare function getMergedCatalog(): Record<string, PersonaDefinition>;
/**
 * Invalidate the cached catalog. Useful for testing or when external file changes.
 */
export declare function invalidateCatalogCache(): void;
//# sourceMappingURL=catalog.d.ts.map