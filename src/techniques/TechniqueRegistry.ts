/**
 * Technique Registry
 * Central registry for all technique handlers
 */

import type { LateralTechnique } from '../types/index.js';
import type { TechniqueHandler } from './types.js';
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
import { MetaLearningHandler } from './MetaLearningHandler.js';
import { BiomimeticPathHandler } from './BiomimeticPathHandler.js';
import { FirstPrinciplesHandler } from './FirstPrinciplesHandler.js';
import { CulturalPathHandler } from './CulturalPathHandler.js';
import { NeuroComputationalHandler } from './NeuroComputationalHandler.js';
// Removed unused imports - GenericHandler and ConvergenceHandler

export class TechniqueRegistry {
  private static instance: TechniqueRegistry;
  private handlers: Map<LateralTechnique, TechniqueHandler>;
  private readonly techniques: LateralTechnique[]; // Eagerly initialized

  private constructor() {
    this.handlers = new Map();
    this.registerHandlers();
    // Cache techniques array once during construction
    this.techniques = Array.from(this.handlers.keys());
  }

  static getInstance(): TechniqueRegistry {
    if (!this.instance) {
      this.instance = new TechniqueRegistry();
    }
    return this.instance;
  }

  private registerHandlers(): void {
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
    this.handlers.set('meta_learning', new MetaLearningHandler());
    this.handlers.set('biomimetic_path', new BiomimeticPathHandler());
    this.handlers.set('first_principles', new FirstPrinciplesHandler());
    this.handlers.set('cultural_path', new CulturalPathHandler());
    this.handlers.set('neuro_computational', new NeuroComputationalHandler());
  }

  getHandler(technique: string): TechniqueHandler {
    const handler = this.handlers.get(technique as LateralTechnique);
    if (!handler) {
      const validTechniques = Array.from(this.handlers.keys());
      throw new Error(
        `Invalid technique: '${technique}'. ` +
          `Valid techniques are: ${validTechniques.join(', ')}. ` +
          `Did you mean to call discover_techniques first to find suitable techniques?`
      );
    }
    return handler;
  }

  getAllTechniques(): LateralTechnique[] {
    // Direct return - no conditional checks
    return this.techniques;
  }

  getTechniqueInfo(technique: LateralTechnique) {
    const handler = this.getHandler(technique);
    return handler.getTechniqueInfo();
  }

  getTechniqueSteps(technique: LateralTechnique): number {
    const handler = this.getHandler(technique);
    return handler.getTechniqueInfo().totalSteps;
  }

  isValidTechnique(technique: string): technique is LateralTechnique {
    return this.handlers.has(technique as LateralTechnique);
  }
}
