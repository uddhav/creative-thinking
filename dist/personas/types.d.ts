/**
 * Persona system type definitions
 * Enables thinking personalities and debate teams within the three-tool constraint
 */
import type { LateralTechnique } from '../types/index.js';
export type PreferredOutcome = 'innovative' | 'systematic' | 'risk-aware' | 'collaborative' | 'analytical';
export interface PersonaDefinition {
    id: string;
    name: string;
    tagline: string;
    perspective: string;
    techniqueBias: Partial<Record<LateralTechnique, number>>;
    preferredOutcome: PreferredOutcome;
    keyPrinciples: string[];
    evaluationCriteria: string[];
    challengeQuestions: string[];
    thinkingStyle: {
        approach: string;
        strengths: string[];
        blindSpots: string[];
    };
}
export type DebateFormat = 'structured' | 'adversarial' | 'collaborative';
export interface DebateConfig {
    personas: string[];
    topic: string;
    format: DebateFormat;
    synthesisApproach: LateralTechnique;
}
export interface PersonaStepContext {
    personaId: string;
    personaName: string;
    voiceGuidance: string;
    principlesReminder: string;
    challengeQuestion: string;
}
//# sourceMappingURL=types.d.ts.map