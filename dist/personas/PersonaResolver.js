/**
 * PersonaResolver - Resolves string identifiers to PersonaDefinition objects
 *
 * Supports:
 * - Built-in persona IDs (e.g., "rich_hickey")
 * - Custom persona descriptions (e.g., "custom:Security-minded Rust engineer")
 */
import { createHash } from 'crypto';
import { getMergedCatalog } from './catalog.js';
/** Maximum description length for custom personas */
const MAX_CUSTOM_DESCRIPTION_LENGTH = 1000;
export class PersonaResolver {
    catalog;
    constructor() {
        this.catalog = getMergedCatalog();
    }
    /**
     * Resolve a persona string to a full PersonaDefinition
     */
    resolve(personaString) {
        if (!personaString || typeof personaString !== 'string') {
            return null;
        }
        // Check for custom: prefix
        if (personaString.startsWith('custom:')) {
            return this.resolveCustom(personaString.slice(7).trim());
        }
        // Look up in merged catalog
        const normalized = personaString.toLowerCase().replace(/[\s-]/g, '_');
        return this.catalog[normalized] ?? null;
    }
    /**
     * List all available built-in persona IDs
     */
    listAvailable() {
        return Object.keys(this.catalog);
    }
    /**
     * Get a brief summary of all available personas
     */
    getSummaries() {
        return Object.values(this.catalog).map(p => ({
            id: p.id,
            name: p.name,
            tagline: p.tagline,
            preferredOutcome: p.preferredOutcome,
        }));
    }
    /**
     * Generate a PersonaDefinition from a custom description string
     * Uses keyword analysis to infer technique biases and thinking style
     */
    resolveCustom(description) {
        // Enforce reasonable length limit to prevent DoS
        if (description.length > MAX_CUSTOM_DESCRIPTION_LENGTH) {
            description = description.substring(0, MAX_CUSTOM_DESCRIPTION_LENGTH);
        }
        const lower = description.toLowerCase();
        const hash = createHash('sha256').update(description).digest('hex').slice(0, 8);
        const id = `custom_${description
            .replace(/[^a-zA-Z0-9]/g, '_')
            .toLowerCase()
            .slice(0, 32)}_${hash}`;
        // Infer preferred outcome from keywords
        let preferredOutcome = 'systematic';
        if (lower.includes('creative') || lower.includes('innovati')) {
            preferredOutcome = 'innovative';
        }
        else if (lower.includes('security') || lower.includes('risk') || lower.includes('safe')) {
            preferredOutcome = 'risk-aware';
        }
        else if (lower.includes('team') || lower.includes('collaborat') || lower.includes('design')) {
            preferredOutcome = 'collaborative';
        }
        else if (lower.includes('analytic') || lower.includes('data') || lower.includes('research')) {
            preferredOutcome = 'analytical';
        }
        // Infer technique biases from domain keywords
        const techniqueBias = {};
        if (lower.includes('first principle') || lower.includes('fundamental')) {
            techniqueBias.first_principles = 0.9;
        }
        if (lower.includes('security') || lower.includes('threat')) {
            techniqueBias.competing_hypotheses = 0.9;
            techniqueBias.criteria_based_analysis = 0.85;
        }
        if (lower.includes('design') || lower.includes('user') || lower.includes('ux')) {
            techniqueBias.design_thinking = 0.9;
            techniqueBias.yes_and = 0.8;
        }
        if (lower.includes('creative') || lower.includes('art')) {
            techniqueBias.random_entry = 0.9;
            techniqueBias.disney_method = 0.85;
        }
        if (lower.includes('system') || lower.includes('architect')) {
            techniqueBias.triz = 0.85;
            techniqueBias.nine_windows = 0.8;
        }
        if (lower.includes('biolog') || lower.includes('natur') || lower.includes('organic')) {
            techniqueBias.biomimetic_path = 0.9;
        }
        if (lower.includes('behavior') || lower.includes('psycholog')) {
            techniqueBias.perception_optimization = 0.9;
            techniqueBias.context_reframing = 0.85;
        }
        return {
            id,
            name: description,
            tagline: `Custom: ${description.slice(0, 30)}`,
            perspective: `Approaching problems as a ${description}`,
            techniqueBias,
            preferredOutcome,
            keyPrinciples: [`Think as a ${description} would`],
            evaluationCriteria: [`Does this meet the standards of a ${description}?`],
            challengeQuestions: [`What would a ${description} challenge about this approach?`],
            thinkingStyle: {
                approach: `Custom perspective: ${description}`,
                strengths: [`Domain expertise as ${description}`],
                blindSpots: ['Custom persona — blind spots not pre-mapped'],
            },
        };
    }
}
//# sourceMappingURL=PersonaResolver.js.map