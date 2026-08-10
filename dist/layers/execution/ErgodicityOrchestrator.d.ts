/**
 * ErgodicityOrchestrator - Handles ergodicity and option generation pipeline
 * Extracted from executeThinkingStep to improve maintainability
 */
import type { ExecuteThinkingStepInput, SessionData } from '../../types/index.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
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
    private sessionManager?;
    private resultAdapter;
    constructor(visualFormatter: VisualFormatter, ergodicityManager: ErgodicityManager, sessionManager?: unknown | undefined);
    /**
     * The manager that owns this session's path memory and sensor readings.
     *
     * Path memory and the early-warning sensors are per-session state, but a
     * single manager was constructed once per server and handed to every call —
     * so one session's commitments depressed another's flexibility, and the
     * sensors' five-second reading cache served session B a measurement taken
     * for session A.
     *
     * `SessionData.ergodicityManager` already existed and was already populated;
     * nothing read it. This reads it.
     */
    private managerFor;
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