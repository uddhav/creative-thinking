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
import { GenericHandler } from './GenericHandler.js';
export class TechniqueRegistry {
    handlers;
    constructor() {
        this.handlers = new Map();
        this.registerHandlers();
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
    }
    getHandler(technique) {
        const handler = this.handlers.get(technique);
        if (!handler) {
            // Return a generic handler for unknown techniques
            return new GenericHandler(technique);
        }
        return handler;
    }
    getAllTechniques() {
        return Array.from(this.handlers.keys());
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