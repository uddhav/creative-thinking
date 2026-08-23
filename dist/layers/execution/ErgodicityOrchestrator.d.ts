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
export type ReversibilityLevel = 'very_low' | 'low' | 'medium' | 'high';
/**
 * The one cost per declared reversibility rung. Single source for
 * calculateImpact, the caller-claim clamp, and the execution layer's
 * claim-direction check — the ladder reads, most to least reversible:
 * high (0.10) → medium (0.50) → low (0.90) → very_low (0.95).
 */
export declare const REVERSIBILITY_COSTS: Record<ReversibilityLevel, number>;
/**
 * A caller claim moves the applied rung at most one step from the server's
 * prior — a bounded nudge, never an overwrite. Priors are handler-static, so
 * clamped claims cannot compound across steps. A claim value outside the
 * ladder returns the prior unchanged: schema enums are not enforced at
 * runtime by every transport, and an unrecognized string (indexOf −1) would
 * otherwise read as claiming maximal reversibility.
 */
export declare function clampReversibilityClaim(prior: ReversibilityLevel, claimed: ReversibilityLevel): ReversibilityLevel;
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
     * The session's flexibility as of the PREVIOUS step. The current step's
     * path event is already in pathHistory at gate time (recordThinkingStep
     * runs first), so "previous" is the product over all but the last event —
     * recomputed with the same clamped, finite-guarded recurrence the live
     * score uses. Derived from persisted pathMemory, so the crossing gate works
     * identically across the CLI's process-per-step model.
     */
    private previousFlexibility;
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