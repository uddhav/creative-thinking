/**
 * PersonaResolver - Resolves string identifiers to PersonaDefinition objects
 *
 * Supports:
 * - Built-in persona IDs (e.g., "rich_hickey")
 * - Custom persona descriptions (e.g., "custom:Security-minded Rust engineer")
 */
import type { PersonaDefinition, PreferredOutcome } from './types.js';
export declare class PersonaResolver {
    private catalog;
    constructor();
    /**
     * Resolve a persona string to a full PersonaDefinition
     */
    resolve(personaString: string): PersonaDefinition | null;
    /**
     * List all available built-in persona IDs
     */
    listAvailable(): string[];
    /**
     * Get a brief summary of all available personas
     */
    getSummaries(): Array<{
        id: string;
        name: string;
        tagline: string;
        preferredOutcome: PreferredOutcome;
    }>;
    /**
     * Generate a PersonaDefinition from a custom description string.
     *
     * Keyword-based inference is intentionally simple — it provides a convenience
     * shortcut for ad-hoc sessions via the `custom:` prefix. An empty `techniqueBias`
     * is valid and means no technique preference (all techniques scored equally).
     *
     * For precise bias control, use built-in personas or external personas loaded
     * via the `PERSONA_CATALOG_PATH` environment variable.
     */
    private resolveCustom;
}
//# sourceMappingURL=PersonaResolver.d.ts.map