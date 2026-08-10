/**
 * ErgodicityOrchestrator - Handles ergodicity and option generation pipeline
 * Extracted from executeThinkingStep to improve maintainability
 */
import type { ExecuteThinkingStepInput, SessionData } from '../../types/index.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
import type { TechniqueHandler } from '../../techniques/types.js';
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
    trackErgodicityAndGenerateOptions(input: ExecuteThinkingStepInput, session: SessionData, techniqueLocalStep: number, sessionId?: string, handler?: TechniqueHandler): Promise<ErgodicityOrchestrationResult>;
    /**
     * What this step commits, for the path record.
     *
     * Returns the ingredients only. `PathMemoryManager.recordPathEvent` derives
     * `flexibilityImpact` from them, so there is one derivation for every caller
     * — deriving it here meant any caller that did not go through this
     * orchestrator recorded steps that cost nothing at all.
     */
    private calculateImpact;
    /**
     * Flexibility after each recorded step, as the engine measures it.
     *
     * The running product of (1 − flexibilityImpact) over the path history —
     * the same quantity `updateFlexibilityMetrics` reports, so every point of
     * the series is the number the gates read at that step. It used to plot
     * SCAMPER's own retention for SCAMPER steps and a straight 1.0 − 0.1·i
     * placeholder for everything else, neither of which anything else used.
     */
    private flexibilitySeries;
    /**
     * Generate options when flexibility is low
     */
    private generateOptions;
}
//# sourceMappingURL=ErgodicityOrchestrator.d.ts.map