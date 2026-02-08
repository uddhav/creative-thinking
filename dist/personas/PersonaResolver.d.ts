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
     * Generate a PersonaDefinition from a custom description string
     * Uses keyword analysis to infer technique biases and thinking style
     */
    private resolveCustom;
}
//# sourceMappingURL=PersonaResolver.d.ts.map