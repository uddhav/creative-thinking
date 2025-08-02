/**
 * ErgodicityOrchestrator - Handles ergodicity and option generation pipeline
 * Extracted from executeThinkingStep to improve maintainability
 */
import type { ExecuteThinkingStepInput, SessionData } from '../../types/index.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
import type { ErgodicityManager } from '../../ergodicity/index.js';
import type { PathMemory } from '../../ergodicity/types.js';
import type { OptionGenerationResult } from '../../ergodicity/optionGeneration/types.js';
import type { ErgodicityResult } from './ErgodicityResultAdapter.js';
export interface ErgodicityOrchestrationResult {
    ergodicityResult: ErgodicityResult;
    currentFlexibility: number;
    optionGenerationResult?: OptionGenerationResult;
    pathMemory?: PathMemory;
}
export declare class ErgodicityOrchestrator {
    private visualFormatter;
    private ergodicityManager;
    private resultAdapter;
    constructor(visualFormatter: VisualFormatter, ergodicityManager: ErgodicityManager);
    /**
     * Check and display ergodicity prompts
     */
    checkErgodicityPrompts(input: ExecuteThinkingStepInput, techniqueLocalStep: number): void;
    /**
     * Track ergodicity and generate options if needed
     */
    trackErgodicityAndGenerateOptions(input: ExecuteThinkingStepInput, session: SessionData, techniqueLocalStep: number, sessionId?: string): Promise<ErgodicityOrchestrationResult>;
    /**
     * Calculate impact based on technique profile or specific path impact
     */
    private calculateImpact;
    /**
     * Generate options when flexibility is low
     */
    private generateOptions;
}
//# sourceMappingURL=ErgodicityOrchestrator.d.ts.map