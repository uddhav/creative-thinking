/**
 * DebateOrchestrator - Creates debate execution structure for multi-persona sessions
 *
 * For each persona, selects 1-2 techniques matching their techniqueBias,
 * creates parallel plans per persona, and creates a synthesis plan.
 */
import { randomUUID } from 'crypto';
import { PersonaGuidanceInjector } from './PersonaGuidanceInjector.js';
import { logger } from '../utils/Logger.js';
/** Default fallback techniques when persona bias yields no matches */
const DEFAULT_DEBATE_TECHNIQUES = ['six_hats', 'first_principles'];
/** Fallback step count when competing_hypotheses handler is unavailable */
const COMPETING_HYPOTHESES_DEFAULT_STEPS = 8;
export class DebateOrchestrator {
    /**
     * Create a complete debate structure for the given personas
     */
    createDebateStructure(problem, personas, techniqueRegistry, format = 'structured', availableTechniques) {
        // Create individual plans per persona
        const personaPlans = personas.map(persona => this.createPersonaPlan(problem, persona, techniqueRegistry, availableTechniques));
        // Create synthesis plan using competing_hypotheses
        const synthesisPlan = this.createSynthesisPlan(problem, personas, techniqueRegistry);
        // Create coordination strategy
        const coordinationStrategy = this.createCoordinationStrategy(personaPlans, synthesisPlan, format);
        return {
            personaPlans,
            synthesisPlan,
            coordinationStrategy,
        };
    }
    /**
     * Create a plan for a single persona, selecting their preferred techniques
     */
    createPersonaPlan(problem, persona, techniqueRegistry, availableTechniques) {
        const planId = `debate_${persona.id}_${randomUUID().slice(0, 12)}`;
        // Select 1-2 techniques that match this persona's bias
        const selectedTechniques = this.selectPersonaTechniques(persona, techniqueRegistry, availableTechniques);
        // Build workflow for each technique
        const workflow = selectedTechniques.map(technique => {
            const handler = techniqueRegistry.getHandler(technique);
            const info = handler.getTechniqueInfo();
            const steps = this.generatePersonaSteps(problem, persona, technique, info.totalSteps, handler);
            return {
                technique,
                steps,
                requiredInputs: [`Problem: ${problem}`, `Persona: ${persona.name}`],
                expectedOutputs: [`${persona.name}'s analysis and position`],
            };
        });
        const totalSteps = workflow.reduce((sum, w) => sum + w.steps.length, 0);
        return {
            planId,
            problem,
            techniques: selectedTechniques,
            workflow,
            canExecuteIndependently: true,
            metadata: {
                techniqueCount: selectedTechniques.length,
                totalSteps,
                complexity: totalSteps > 10 ? 'high' : totalSteps > 5 ? 'medium' : 'low',
            },
        };
    }
    /**
     * Select 1-2 techniques that best match a persona's biases
     */
    selectPersonaTechniques(persona, techniqueRegistry, availableTechniques) {
        const biasEntries = Object.entries(persona.techniqueBias)
            .filter(([technique]) => {
            // Only select techniques that exist in the registry
            if (!techniqueRegistry.isValidTechnique(technique)) {
                return false;
            }
            // If available techniques specified, filter to those
            if (availableTechniques) {
                return availableTechniques.includes(technique);
            }
            return true;
        })
            .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
        // Take top 1-2 techniques
        const count = biasEntries.length >= 2 ? 2 : 1;
        const selected = biasEntries
            .slice(0, count)
            .map(([technique]) => technique);
        // Fallback to defaults if no bias matches
        if (selected.length === 0) {
            const fallback = DEFAULT_DEBATE_TECHNIQUES.filter(t => techniqueRegistry.isValidTechnique(t) &&
                (!availableTechniques || availableTechniques.includes(t)));
            return fallback.slice(0, 1);
        }
        return selected;
    }
    /**
     * Generate persona-injected steps for a technique
     */
    generatePersonaSteps(problem, persona, technique, totalSteps, handler) {
        const steps = [];
        for (let i = 1; i <= totalSteps; i++) {
            const originalGuidance = handler.getStepGuidance(i, problem);
            const injectedGuidance = PersonaGuidanceInjector.injectGuidance(originalGuidance, persona, i, totalSteps);
            steps.push({
                stepNumber: i,
                description: injectedGuidance,
                expectedOutput: `${persona.name}'s perspective on step ${i}`,
            });
        }
        return steps;
    }
    /**
     * Create synthesis plan using competing_hypotheses technique
     */
    createSynthesisPlan(problem, personas, techniqueRegistry) {
        const planId = `debate_synthesis_${randomUUID().slice(0, 12)}`;
        const technique = 'competing_hypotheses';
        let handler = null;
        let totalSteps;
        if (techniqueRegistry.isValidTechnique(technique)) {
            handler = techniqueRegistry.getHandler(technique);
            totalSteps = handler.getTechniqueInfo().totalSteps;
        }
        else {
            // Fallback if competing_hypotheses handler isn't available
            totalSteps = COMPETING_HYPOTHESES_DEFAULT_STEPS;
            logger.warn(`competing_hypotheses handler not found in registry; using default ${COMPETING_HYPOTHESES_DEFAULT_STEPS} steps for synthesis plan`);
        }
        const synthesisHeader = PersonaGuidanceInjector.createDebateSynthesisHeader(personas);
        const steps = [];
        for (let i = 1; i <= totalSteps; i++) {
            const guidance = handler
                ? handler.getStepGuidance(i, problem)
                : `Synthesis step ${i}: Integrate and compare persona positions`;
            steps.push({
                stepNumber: i,
                description: `${synthesisHeader}\n${guidance}`,
                expectedOutput: i === totalSteps
                    ? 'Final debate synthesis with actionable recommendations'
                    : `Synthesis step ${i} output`,
            });
        }
        return {
            planId,
            problem,
            techniques: [technique],
            workflow: [{ technique, steps }],
            canExecuteIndependently: false,
            dependencies: [], // Will be populated by coordination strategy
            metadata: {
                techniqueCount: 1,
                totalSteps,
                complexity: 'medium',
            },
        };
    }
    /**
     * Create coordination strategy for debate execution
     */
    createCoordinationStrategy(personaPlans, synthesisPlan, format) {
        // Synthesis depends on all persona plans completing
        synthesisPlan.dependencies = personaPlans.map(p => p.planId);
        const syncPoints = [
            {
                afterPlanIds: personaPlans.map(p => p.planId),
                action: 'merge_context',
            },
        ];
        // For adversarial format, add a checkpoint after each persona
        if (format === 'adversarial') {
            for (const plan of personaPlans) {
                syncPoints.push({
                    afterPlanIds: [plan.planId],
                    action: 'checkpoint',
                });
            }
        }
        return {
            syncPoints,
            sharedContext: {
                enabled: true,
                updateStrategy: format === 'collaborative' ? 'immediate' : 'checkpoint',
            },
            errorHandling: 'partial_results',
        };
    }
}
//# sourceMappingURL=DebateOrchestrator.js.map