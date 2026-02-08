/**
 * DebateSynthesizer - Formats and structures debate outcomes
 *
 * Extracts positions from each persona's completed session,
 * structures agreements, disagreements, key arguments, and evidence,
 * and generates an actionable synthesis.
 */
import type { PersonaDefinition } from './types.js';
export interface PersonaPosition {
    personaId: string;
    personaName: string;
    keyArguments: string[];
    evidence: string[];
    proposedSolution: string;
}
export interface DebateOutcome {
    topic: string;
    positions: PersonaPosition[];
    agreements: string[];
    disagreements: string[];
    blindSpots: string[];
    actionableSynthesis: string;
}
export declare class DebateSynthesizer {
    /**
     * Create a structured debate outcome from persona positions
     */
    synthesize(topic: string, positions: PersonaPosition[], personas: PersonaDefinition[]): DebateOutcome;
    /**
     * Find areas where multiple personas agree
     */
    private findAgreements;
    /**
     * Find areas of disagreement between personas
     */
    private findDisagreements;
    /**
     * Identify blind spots from persona definitions
     */
    private findBlindSpots;
    /**
     * Generate actionable synthesis text
     */
    private generateSynthesis;
    /**
     * Extract keyword set from an argument string (cached per call)
     */
    private extractKeywords;
    /**
     * Find overlapping themes between two argument lists using keyword matching.
     * Pre-computes keyword sets for args2 to avoid redundant work.
     */
    private findOverlappingThemes;
}
//# sourceMappingURL=DebateSynthesizer.d.ts.map