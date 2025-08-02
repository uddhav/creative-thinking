/**
 * Ergodicity awareness and path dependency tracking for creative thinking
 */
export * from './types.js';
export * from './pathMemory.js';
export * from './metrics.js';
export * from './earlyWarning/index.js';
export { EscapeVelocitySystem, EscapeLevel, type EscapeAnalysis, type EscapeContext, type EscapeAttemptResult, } from './escapeProtocols/index.js';
export { OptionGenerationEngine, type Option, type OptionGenerationResult, type OptionEvaluation, type OptionGenerationContext, } from './optionGeneration/index.js';
export { RiskDismissalTracker, type RiskEngagementMetrics, type DismissalPattern, } from './riskDismissalTracker.js';
export { EscalationPromptGenerator, type EscalationPrompt } from './escalationPrompts.js';
export { StakesDiscovery, type StakesDeclaration, type ExitCondition } from './stakesDiscovery.js';
import type { PathMemory, FlexibilityMetrics, PathEvent, ErgodicityWarning, FlexibilityState } from './types.js';
import type { LateralTechnique, SessionData } from '../index.js';
import type { EarlyWarningState, EscapeProtocol, EarlyWarningConfig } from './earlyWarning/types.js';
import type { EscapeAnalysis, EscapeAttemptResult, EscapeProtocol as EscapeVelocityProtocol } from './escapeProtocols/types.js';
import { EscapeLevel } from './escapeProtocols/types.js';
import type { Option, OptionGenerationResult, OptionGenerationStrategy } from './optionGeneration/types.js';
/**
 * Main ergodicity manager that coordinates path tracking and metrics
 */
export declare class ErgodicityManager {
    private pathMemoryManager;
    private metricsCalculator;
    private earlyWarningSystem;
    private responseProtocolSystem;
    private escapeVelocitySystem;
    private optionGenerationEngine;
    private lastWarningState;
    private autoEscapeEnabled;
    constructor(warningConfig?: EarlyWarningConfig);
    /**
     * Record a thinking step and its path impacts with early warning monitoring
     */
    recordThinkingStep(technique: LateralTechnique, step: number, decision: string, impact: {
        optionsOpened?: string[];
        optionsClosed?: string[];
        reversibilityCost?: number;
        commitmentLevel?: number;
    }, sessionData?: SessionData): Promise<{
        event: PathEvent;
        metrics: FlexibilityMetrics;
        warnings: ErgodicityWarning[];
        earlyWarningState?: EarlyWarningState;
        escapeRecommendation?: EscapeProtocol;
        escapeVelocityNeeded?: boolean;
    }>;
    /**
     * Get current path memory state
     */
    getPathMemory(): PathMemory;
    /**
     * Get current flexibility metrics
     */
    getMetrics(): FlexibilityMetrics;
    /**
     * Get current flexibility state
     */
    getCurrentFlexibility(): FlexibilityState;
    /**
     * Get current warnings
     */
    getWarnings(): ErgodicityWarning[];
    /**
     * Get escape routes for low flexibility situations
     */
    getEscapeRoutes(): import("./types.js").EscapeRoute[];
    /**
     * Get a formatted summary of ergodicity state
     */
    getErgodicityStatus(): string;
    /**
     * Get current early warning state
     */
    getEarlyWarningState(sessionData: SessionData): Promise<EarlyWarningState | null>;
    /**
     * Execute an escape protocol
     */
    executeEscapeProtocol(protocol: EscapeProtocol, sessionData: SessionData, userConfirmation?: boolean): Promise<import("./earlyWarning/types.js").EscapeResponse>;
    /**
     * Get available escape protocols for current state
     */
    getAvailableEscapeProtocols(): EscapeProtocol[];
    /**
     * Get sensor status
     */
    getSensorStatus(): Map<import("./earlyWarning/types.js").SensorType, unknown>;
    /**
     * Get warning history
     */
    getWarningHistory(sessionId?: string): import("./earlyWarning/types.js").WarningHistory[];
    /**
     * Toggle auto-escape mode
     */
    setAutoEscapeEnabled(enabled: boolean): void;
    /**
     * Reset early warning system
     */
    resetEarlyWarning(): void;
    /**
     * Analyze escape velocity requirements
     */
    analyzeEscapeVelocity(sessionData: SessionData): EscapeAnalysis;
    /**
     * Execute escape velocity protocol
     */
    executeEscapeVelocityProtocol(level: EscapeLevel, sessionData: SessionData, userApproval?: boolean): EscapeAttemptResult;
    /**
     * Get available escape velocity protocols
     */
    getAvailableEscapeVelocityProtocols(currentFlexibility?: number): EscapeVelocityProtocol[];
    /**
     * Check if escape velocity is needed
     */
    isEscapeVelocityNeeded(): boolean;
    /**
     * Get escape urgency level
     */
    getEscapeUrgency(): 'critical' | 'high' | 'medium' | 'low';
    /**
     * Get escape velocity monitoring data
     */
    getEscapeMonitoring(): import("./escapeProtocols/types.js").EscapeMonitoring;
    /**
     * Create escape context from session data
     */
    private createEscapeContext;
    /**
     * Analyze a specific technique for its path impact
     */
    analyzeTechniqueImpact(technique: LateralTechnique): {
        typicalReversibility: number;
        typicalCommitment: number;
        riskProfile: string;
    };
    /**
     * Generate options to increase flexibility
     */
    generateOptions(sessionData: SessionData, targetCount?: number): OptionGenerationResult;
    /**
     * Generate options using specific strategies
     */
    generateOptionsWithStrategies(sessionData: SessionData, strategies: OptionGenerationStrategy[], targetCount?: number): OptionGenerationResult;
    /**
     * Check if option generation is recommended
     */
    shouldGenerateOptions(): boolean;
    /**
     * Get a quick option without full generation
     */
    getQuickOption(sessionData: SessionData): Option | null;
    /**
     * Get available option generation strategies
     */
    getAvailableOptionStrategies(): {
        name: OptionGenerationStrategy;
        description: string;
        typicalGain: {
            min: number;
            max: number;
        };
    }[];
    /**
     * Create option generation context from session data
     */
    private createOptionGenerationContext;
}
//# sourceMappingURL=index.d.ts.map