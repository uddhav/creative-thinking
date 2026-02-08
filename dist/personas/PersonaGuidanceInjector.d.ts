/**
 * PersonaGuidanceInjector - Injects persona voice into step guidance
 *
 * Prepends persona context to existing technique step guidance so the LLM
 * embodies the persona's thinking style, principles, and challenge questions.
 * All methods are static — this class is stateless.
 */
import type { PersonaDefinition, PersonaStepContext } from './types.js';
export declare class PersonaGuidanceInjector {
    /**
     * Create a PersonaStepContext for a given persona and step
     */
    static createStepContext(persona: PersonaDefinition, step: number, _totalSteps: number): PersonaStepContext;
    /**
     * Inject persona context into existing step guidance
     */
    static injectGuidance(originalGuidance: string, persona: PersonaDefinition, step: number, totalSteps: number): string;
    /**
     * Create a debate synthesis header when multiple personas are involved
     */
    static createDebateSynthesisHeader(personas: PersonaDefinition[]): string;
}
//# sourceMappingURL=PersonaGuidanceInjector.d.ts.map