/**
 * Technique Registry
 * Central registry for all technique handlers
 */
import { SixHatsHandler } from './SixHatsHandler.js';
import { ScamperHandler } from './ScamperHandler.js';
import { POHandler } from './POHandler.js';
import { RandomEntryHandler } from './RandomEntryHandler.js';
import { ConceptExtractionHandler } from './ConceptExtractionHandler.js';
import { YesAndHandler } from './YesAndHandler.js';
import { DesignThinkingHandler } from './DesignThinkingHandler.js';
import { TRIZHandler } from './TRIZHandler.js';
import { NeuralStateHandler } from './NeuralStateHandler.js';
import { TemporalWorkHandler } from './TemporalWorkHandler.js';
import { CrossCulturalHandler } from './CrossCulturalHandler.js';
import { CollectiveIntelHandler } from './CollectiveIntelHandler.js';
import { DisneyMethodHandler } from './DisneyMethodHandler.js';
import { NineWindowsHandler } from './NineWindowsHandler.js';
import { QuantumSuperpositionHandler } from './QuantumSuperpositionHandler.js';
import { TemporalCreativityHandler } from './TemporalCreativityHandler.js';
import { ParadoxicalProblemHandler } from './ParadoxicalProblemHandler.js';
// Removed unused imports - GenericHandler and ConvergenceHandler
export class TechniqueRegistry {
    static instance;
    handlers;
    cachedTechniques = null;
    constructor() {
        this.handlers = new Map();
        this.registerHandlers();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new TechniqueRegistry();
        }
        return this.instance;
    }
    registerHandlers() {
        this.handlers.set('six_hats', new SixHatsHandler());
        this.handlers.set('scamper', new ScamperHandler());
        this.handlers.set('po', new POHandler());
        this.handlers.set('random_entry', new RandomEntryHandler());
        this.handlers.set('concept_extraction', new ConceptExtractionHandler());
        this.handlers.set('yes_and', new YesAndHandler());
        this.handlers.set('design_thinking', new DesignThinkingHandler());
        this.handlers.set('triz', new TRIZHandler());
        this.handlers.set('neural_state', new NeuralStateHandler());
        this.handlers.set('temporal_work', new TemporalWorkHandler());
        this.handlers.set('cross_cultural', new CrossCulturalHandler());
        this.handlers.set('collective_intel', new CollectiveIntelHandler());
        this.handlers.set('disney_method', new DisneyMethodHandler());
        this.handlers.set('nine_windows', new NineWindowsHandler());
        this.handlers.set('quantum_superposition', new QuantumSuperpositionHandler());
        this.handlers.set('temporal_creativity', new TemporalCreativityHandler());
        this.handlers.set('paradoxical_problem', new ParadoxicalProblemHandler());
    }
    getHandler(technique) {
        const handler = this.handlers.get(technique);
        if (!handler) {
            const validTechniques = Array.from(this.handlers.keys());
            throw new Error(`Invalid technique: '${technique}'. ` +
                `Valid techniques are: ${validTechniques.join(', ')}. ` +
                `Did you mean to call discover_techniques first to find suitable techniques?`);
        }
        return handler;
    }
    getAllTechniques() {
        if (!this.cachedTechniques) {
            this.cachedTechniques = Array.from(this.handlers.keys());
        }
        return this.cachedTechniques;
    }
    getTechniqueInfo(technique) {
        const handler = this.getHandler(technique);
        return handler.getTechniqueInfo();
    }
    getTechniqueSteps(technique) {
        const handler = this.getHandler(technique);
        return handler.getTechniqueInfo().totalSteps;
    }
    isValidTechnique(technique) {
        return this.handlers.has(technique);
    }
}
//# sourceMappingURL=TechniqueRegistry.js.map