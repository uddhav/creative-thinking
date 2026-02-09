/**
 * DebateOrchestrator - Creates debate execution structure for multi-persona sessions
 *
 * For each persona, selects 1-2 techniques matching their techniqueBias,
 * creates parallel plans per persona, and creates a synthesis plan.
 */
import type { PersonaDefinition, DebateFormat } from './types.js';
import type { ParallelPlan, CoordinationStrategy } from '../types/planning.js';
import type { LateralTechnique } from '../types/index.js';
import type { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
export interface DebateStructure {
    personaPlans: ParallelPlan[];
    synthesisPlan: ParallelPlan;
    coordinationStrategy: CoordinationStrategy;
}
export declare class DebateOrchestrator {
    /**
     * Create a complete debate structure for the given personas
     */
    createDebateStructure(problem: string, personas: PersonaDefinition[], techniqueRegistry: TechniqueRegistry, format?: DebateFormat, availableTechniques?: LateralTechnique[]): DebateStructure;
    /**
     * Create a plan for a single persona, selecting their preferred techniques
     */
    private createPersonaPlan;
    /**
     * Select 1-2 techniques that best match a persona's biases
     */
    private selectPersonaTechniques;
    /**
     * Generate persona-injected steps for a technique
     */
    private generatePersonaSteps;
    /**
     * Create synthesis plan using competing_hypotheses technique
     */
    private createSynthesisPlan;
    /**
     * Create coordination strategy for debate execution
     */
    private createCoordinationStrategy;
}
//# sourceMappingURL=DebateOrchestrator.d.ts.map