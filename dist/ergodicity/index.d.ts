/**
 * Ergodicity awareness and path dependency tracking for creative thinking
 */
export * from './types.js';
export * from './pathMemory.js';
export * from './metrics.js';
export * from './earlyWarning/index.js';
import type { PathMemory, FlexibilityMetrics, PathEvent, ErgodicityWarning } from './types.js';
import type { LateralTechnique, SessionData } from '../index.js';
import type { EarlyWarningState, EscapeProtocol, EarlyWarningConfig } from './earlyWarning/types.js';
/**
 * Main ergodicity manager that coordinates path tracking and metrics
 */
export declare class ErgodicityManager {
    private pathMemoryManager;
    private metricsCalculator;
    private earlyWarningSystem;
    private responseProtocolSystem;
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
     * Analyze a specific technique for its path impact
     */
    analyzeTechniqueImpact(technique: LateralTechnique): {
        typicalReversibility: number;
        typicalCommitment: number;
        riskProfile: string;
    };
}
//# sourceMappingURL=index.d.ts.map