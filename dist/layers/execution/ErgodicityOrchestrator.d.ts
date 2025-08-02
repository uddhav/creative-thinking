/**
 * ErgodicityOrchestrator - Handles ergodicity and option generation pipeline
 * Extracted from executeThinkingStep to improve maintainability
 */
import type { ExecuteThinkingStepInput, SessionData } from '../../types/index.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
import type { ErgodicityManager } from '../../ergodicity/index.js';
import type { PathMemory } from '../../ergodicity/types.js';
import type { OptionGenerationResult } from '../../ergodicity/optionGeneration/types.js';
export interface ErgodicityOrchestrationResult {
    ergodicityResult: ErgodicityResult;
    currentFlexibility: number;
    optionGenerationResult?: OptionGenerationResult;
    pathMemory?: PathMemory;
}
interface ErgodicityResult {
    event: {
        type: string;
        timestamp: number;
        technique: string;
        step: number;
        reversibilityCost: number;
        description: string;
    };
    metrics: {
        currentFlexibility: number;
        pathDivergence: number;
        constraintLevel: number;
        optionSpaceSize: number;
    };
    warnings: Array<{
        type: string;
        message: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    earlyWarningState?: {
        activeWarnings: Array<{
            type: string;
            message: string;
            severity: string;
            timestamp: number;
        }>;
        overallSeverity: string;
    };
    escapeRecommendation?: {
        name: string;
        description: string;
        steps: string[];
        urgency: 'low' | 'medium' | 'high' | 'immediate';
    };
    escapeVelocityNeeded?: boolean;
}
export declare class ErgodicityOrchestrator {
    private visualFormatter;
    private ergodicityManager;
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
export {};
//# sourceMappingURL=ErgodicityOrchestrator.d.ts.map