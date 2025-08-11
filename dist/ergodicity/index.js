/**
 * Ergodicity awareness and path dependency tracking for creative thinking
 */
export * from './types.js';
export * from './pathMemory.js';
export * from './metrics.js';
export * from './earlyWarning/index.js';
export { EscapeVelocitySystem, EscapeLevel, } from './escapeProtocols/index.js';
export { OptionGenerationEngine, } from './optionGeneration/index.js';
export { RiskDismissalTracker, } from './riskDismissalTracker.js';
export { EscalationPromptGenerator } from './escalationPrompts.js';
export { StakesDiscovery } from './stakesDiscovery.js';
import { PathMemoryManager } from './pathMemory.js';
import { MetricsCalculator } from './metrics.js';
import { AbsorbingBarrierEarlyWarning, ResponseProtocolSystem } from './earlyWarning/index.js';
import { EscapeVelocitySystem } from './escapeProtocols/index.js';
import { OptionGenerationEngine } from './optionGeneration/index.js';
import { ErgodicityWarningLevel } from './types.js';
import { EscapeLevel } from './escapeProtocols/types.js';
/**
 * Main ergodicity manager that coordinates path tracking and metrics
 */
export class ErgodicityManager {
    pathMemoryManager;
    metricsCalculator;
    earlyWarningSystem;
    responseProtocolSystem;
    escapeVelocitySystem;
    optionGenerationEngine;
    lastWarningState = null;
    autoEscapeEnabled = true;
    constructor(warningConfig) {
        this.pathMemoryManager = new PathMemoryManager();
        this.metricsCalculator = new MetricsCalculator();
        this.earlyWarningSystem = new AbsorbingBarrierEarlyWarning(warningConfig);
        this.responseProtocolSystem = new ResponseProtocolSystem();
        this.escapeVelocitySystem = new EscapeVelocitySystem();
        this.optionGenerationEngine = new OptionGenerationEngine();
    }
    /**
     * Record a thinking step and its path impacts with early warning monitoring
     */
    async recordThinkingStep(technique, step, decision, impact, sessionData) {
        // Record the path event
        const event = this.pathMemoryManager.recordPathEvent(technique, step, decision, impact);
        // Get updated metrics
        const pathMemory = this.pathMemoryManager.getPathMemory();
        const metrics = this.metricsCalculator.calculateMetrics(pathMemory);
        // Generate traditional warnings
        const warnings = this.metricsCalculator.generateWarnings(metrics);
        // Run early warning system if session data available
        let earlyWarningState;
        let escapeRecommendation;
        if (sessionData) {
            earlyWarningState = await this.earlyWarningSystem.continuousMonitoring(pathMemory, sessionData);
            this.lastWarningState = earlyWarningState;
            // Check if escape protocol is needed
            if (earlyWarningState.recommendedAction === 'escape' &&
                earlyWarningState.activeWarnings.length > 0) {
                const criticalWarning = earlyWarningState.activeWarnings[0];
                const recommendation = this.responseProtocolSystem.recommendProtocol(criticalWarning, pathMemory);
                if (recommendation !== null) {
                    escapeRecommendation = recommendation;
                }
            }
        }
        // Also check escape velocity if flexibility is critically low
        let escapeVelocityNeeded = false;
        if (metrics.flexibilityScore < 0.2) {
            escapeVelocityNeeded = true;
            // Add warning if not already present
            const velocityWarning = {
                level: ErgodicityWarningLevel.CRITICAL,
                message: `Critical flexibility (${(metrics.flexibilityScore * 100).toFixed(0)}%) - Escape velocity protocol recommended`,
                metric: 'flexibilityScore',
                value: metrics.flexibilityScore,
                threshold: 0.2,
                recommendations: [
                    'Execute Pattern Interruption protocol immediately',
                    'Consider Resource Reallocation if flexibility > 0.2',
                    'Prepare for Strategic Pivot if other protocols fail',
                    `Urgency: ${this.getEscapeUrgency()}`,
                ],
            };
            warnings.push(velocityWarning);
        }
        return {
            event,
            metrics,
            warnings,
            earlyWarningState,
            escapeRecommendation,
            escapeVelocityNeeded,
        };
    }
    /**
     * Get current path memory state
     */
    getPathMemory() {
        return this.pathMemoryManager.getPathMemory();
    }
    /**
     * Get current flexibility metrics
     */
    getMetrics() {
        const pathMemory = this.pathMemoryManager.getPathMemory();
        return this.metricsCalculator.calculateMetrics(pathMemory);
    }
    /**
     * Get current flexibility state
     */
    getCurrentFlexibility() {
        return this.getMetrics();
    }
    /**
     * Get current warnings
     */
    getWarnings() {
        const metrics = this.getMetrics();
        return this.metricsCalculator.generateWarnings(metrics);
    }
    /**
     * Get escape routes for low flexibility situations
     */
    getEscapeRoutes() {
        return this.pathMemoryManager.generateEscapeRoutes();
    }
    /**
     * Get a formatted summary of ergodicity state
     */
    getErgodicityStatus() {
        const metrics = this.getMetrics();
        const warnings = this.pathMemoryManager.getWarnings();
        const metricsSummary = this.metricsCalculator.getMetricsSummary(metrics);
        let status = metricsSummary;
        // Include early warning state if available
        if (this.lastWarningState) {
            const { activeWarnings, recommendedAction } = this.lastWarningState;
            if (activeWarnings.length > 0) {
                status += '\n\n🚨 Absorbing Barrier Warnings:';
                activeWarnings.slice(0, 3).forEach(warning => {
                    status += `\n├─ ${warning.visualIndicator} ${warning.message}`;
                    if (warning.reading.timeToImpact) {
                        status += ` (Impact in ~${warning.reading.timeToImpact} steps)`;
                    }
                });
                if (recommendedAction !== 'continue') {
                    const actionEmoji = {
                        caution: '⚡',
                        pivot: '🔄',
                        escape: '🚨',
                    }[recommendedAction] || '❓';
                    status += `\n└─ ${actionEmoji} Recommended Action: ${recommendedAction.toUpperCase()}`;
                }
            }
        }
        if (warnings.length > 0) {
            status += '\n\n⚠️ Path Dependency Warnings:';
            warnings.forEach(warning => {
                status += `\n├─ ${warning}`;
            });
        }
        const escapeRoutes = this.pathMemoryManager.generateEscapeRoutes();
        if (escapeRoutes.length > 0 && metrics.flexibilityScore < 0.4) {
            status += '\n\n🚪 Escape Routes Available:';
            escapeRoutes.forEach(route => {
                status += `\n├─ ${route.name} (feasibility: ${Math.round(route.feasibility * 100)}%)`;
            });
        }
        return status;
    }
    /**
     * Get current early warning state
     */
    async getEarlyWarningState(sessionData) {
        if (!sessionData)
            return this.lastWarningState;
        const pathMemory = this.pathMemoryManager.getPathMemory();
        const state = await this.earlyWarningSystem.continuousMonitoring(pathMemory, sessionData);
        this.lastWarningState = state;
        return state;
    }
    /**
     * Execute an escape protocol
     */
    async executeEscapeProtocol(protocol, sessionData, userConfirmation = true) {
        const pathMemory = this.pathMemoryManager.getPathMemory();
        return await this.responseProtocolSystem.executeProtocol(protocol, pathMemory, sessionData, userConfirmation);
    }
    /**
     * Get available escape protocols for current state
     */
    getAvailableEscapeProtocols() {
        return this.responseProtocolSystem.getAvailableProtocols();
    }
    /**
     * Get sensor status
     */
    getSensorStatus() {
        return this.earlyWarningSystem.getSensorStatus();
    }
    /**
     * Get warning history
     */
    getWarningHistory(sessionId) {
        return this.earlyWarningSystem.getWarningHistory(sessionId);
    }
    /**
     * Toggle auto-escape mode
     */
    setAutoEscapeEnabled(enabled) {
        this.autoEscapeEnabled = enabled;
    }
    /**
     * Reset early warning system
     */
    resetEarlyWarning() {
        this.earlyWarningSystem.reset();
        this.lastWarningState = null;
    }
    /**
     * Analyze escape velocity requirements
     */
    analyzeEscapeVelocity(sessionData) {
        const context = this.createEscapeContext(sessionData);
        return this.escapeVelocitySystem.analyzeEscapeNeeds(context);
    }
    /**
     * Execute escape velocity protocol
     */
    executeEscapeVelocityProtocol(level, sessionData, userApproval = true) {
        const context = this.createEscapeContext(sessionData);
        if (!userApproval && level > EscapeLevel.RESOURCE_REALLOCATION) {
            throw new Error('User approval required for protocols above Level 2');
        }
        const result = this.escapeVelocitySystem.executeProtocol(level, context);
        // Update path memory with escape results
        if (result.success) {
            const event = {
                timestamp: result.timestamp,
                technique: 'escape_protocol',
                step: 0,
                decision: `Executed ${result.protocol.name}`,
                commitmentLevel: 0.1,
                reversibilityCost: 0.1,
                optionsOpened: result.newOptionsCreated,
                optionsClosed: [],
                constraintsCreated: [],
                flexibilityImpact: result.flexibilityGained,
            };
            this.pathMemoryManager.recordEvent(event);
        }
        return result;
    }
    /**
     * Get available escape velocity protocols
     */
    getAvailableEscapeVelocityProtocols(currentFlexibility) {
        const flexibility = currentFlexibility ?? this.getCurrentFlexibility().flexibilityScore;
        return this.escapeVelocitySystem.getAvailableProtocols(flexibility);
    }
    /**
     * Check if escape velocity is needed
     */
    isEscapeVelocityNeeded() {
        const flexibility = this.getCurrentFlexibility().flexibilityScore;
        return this.escapeVelocitySystem.isEscapeNeeded(flexibility);
    }
    /**
     * Get escape urgency level
     */
    getEscapeUrgency() {
        const flexibility = this.getCurrentFlexibility().flexibilityScore;
        return this.escapeVelocitySystem.getEscapeUrgency(flexibility);
    }
    /**
     * Get escape velocity monitoring data
     */
    getEscapeMonitoring() {
        return this.escapeVelocitySystem.getMonitoringData();
    }
    /**
     * Create escape context from session data
     */
    createEscapeContext(sessionData) {
        return {
            pathMemory: this.pathMemoryManager.getPathMemory(),
            sessionData,
            currentFlexibility: this.getCurrentFlexibility(),
            triggerReason: 'User requested',
            userApproval: true,
            automaticMode: false,
        };
    }
    /**
     * Analyze a specific technique for its path impact
     */
    analyzeTechniqueImpact(technique) {
        const profiles = {
            six_hats: {
                typicalReversibility: 0.9,
                typicalCommitment: 0.2,
                riskProfile: 'Low - Exploration without commitment',
            },
            po: {
                typicalReversibility: 0.8,
                typicalCommitment: 0.3,
                riskProfile: 'Low - Provocations are exploratory',
            },
            random_entry: {
                typicalReversibility: 0.9,
                typicalCommitment: 0.1,
                riskProfile: 'Very Low - Pure exploration',
            },
            scamper: {
                typicalReversibility: 0.6,
                typicalCommitment: 0.5,
                riskProfile: 'Medium - Some modifications hard to reverse',
            },
            concept_extraction: {
                typicalReversibility: 0.7,
                typicalCommitment: 0.4,
                riskProfile: 'Low-Medium - Depends on application',
            },
            yes_and: {
                typicalReversibility: 0.5,
                typicalCommitment: 0.6,
                riskProfile: 'Medium - Builds commitments incrementally',
            },
            design_thinking: {
                typicalReversibility: 0.4,
                typicalCommitment: 0.7,
                riskProfile: 'Medium-High - User research creates expectations',
            },
            triz: {
                typicalReversibility: 0.5,
                typicalCommitment: 0.6,
                riskProfile: 'Medium - Technical solutions may lock in',
            },
            neural_state: {
                typicalReversibility: 0.8,
                typicalCommitment: 0.3,
                riskProfile: 'Low - Cognitive patterns are adaptable',
            },
            temporal_work: {
                typicalReversibility: 0.6,
                typicalCommitment: 0.4,
                riskProfile: 'Medium - Time structures create dependencies',
            },
            cross_cultural: {
                typicalReversibility: 0.8,
                typicalCommitment: 0.3,
                riskProfile: 'Low - Cultural exploration is adaptable',
            },
            collective_intel: {
                typicalReversibility: 0.7,
                typicalCommitment: 0.4,
                riskProfile: 'Low-Medium - Synthesis requires some commitment',
            },
            disney_method: {
                typicalReversibility: 0.5,
                typicalCommitment: 0.7,
                riskProfile: 'Medium-High - Sequential implementation commitment',
            },
            nine_windows: {
                typicalReversibility: 0.8,
                typicalCommitment: 0.3,
                riskProfile: 'Low - Analysis without action commitment',
            },
            quantum_superposition: {
                typicalReversibility: 0.95,
                typicalCommitment: 0.1,
                riskProfile: 'Very Low - Maintains all options until collapse',
            },
            temporal_creativity: {
                typicalReversibility: 0.85,
                typicalCommitment: 0.2,
                riskProfile: 'Low - Actively preserves flexibility through time',
            },
            paradoxical_problem: {
                typicalReversibility: 0.7,
                typicalCommitment: 0.5,
                riskProfile: 'Medium - Path synthesis creates commitments',
            },
            meta_learning: {
                typicalReversibility: 0.9,
                typicalCommitment: 0.2,
                riskProfile: 'Low - Learning and adaptation are reversible',
            },
            biomimetic_path: {
                typicalReversibility: 0.7,
                typicalCommitment: 0.4,
                riskProfile: 'Medium - Biological patterns require implementation',
            },
            first_principles: {
                typicalReversibility: 0.6,
                typicalCommitment: 0.5,
                riskProfile: 'Medium - Fundamental redesign may require significant changes',
            },
            cultural_path: {
                typicalReversibility: 0.7,
                typicalCommitment: 0.4,
                riskProfile: 'Low-Medium - Cultural navigation allows flexible adaptation',
            },
            cultural_creativity: {
                typicalReversibility: 0.8,
                typicalCommitment: 0.3,
                riskProfile: 'Low - Cultural creativity encourages diverse perspectives',
            },
            neuro_computational: {
                typicalReversibility: 0.5,
                typicalCommitment: 0.6,
                riskProfile: 'Medium - Computational optimization creates dependencies',
            },
        };
        return profiles[technique];
    }
    /**
     * Generate options to increase flexibility
     */
    generateOptions(sessionData, targetCount = 10) {
        const context = this.createOptionGenerationContext(sessionData);
        return this.optionGenerationEngine.generateOptions(context, targetCount);
    }
    /**
     * Check if option generation is recommended
     */
    shouldGenerateOptions() {
        // Create a minimal SessionState for checking if options are needed
        const mockSessionState = {
            id: 'check_' + Date.now(),
            problem: 'Unknown',
            technique: 'six_hats',
            currentStep: 1,
            totalSteps: 1,
            history: [],
            branches: {},
            insights: [],
        };
        const pathMemory = this.getPathMemory();
        const context = {
            sessionState: mockSessionState,
            pathMemory: {
                constraints: pathMemory.constraints,
                pathHistory: pathMemory.pathHistory,
                flexibilityOverTime: [],
                availableOptions: pathMemory.availableOptions,
            },
            currentFlexibility: this.getCurrentFlexibility(),
            targetOptionCount: 10,
        };
        return this.optionGenerationEngine.shouldGenerateOptions(context);
    }
    /**
     * Get a quick option without full generation
     */
    getQuickOption(sessionData) {
        const context = this.createOptionGenerationContext(sessionData);
        return this.optionGenerationEngine.getQuickOption(context);
    }
    /**
     * Get available option generation strategies
     */
    getAvailableOptionStrategies() {
        return this.optionGenerationEngine.getAvailableStrategies();
    }
    /**
     * Create option generation context from session data
     */
    createOptionGenerationContext(sessionData) {
        // Convert SessionData to SessionState format
        const sessionState = {
            id: 'temp_' + Date.now(),
            problem: sessionData.problem || 'Unknown problem',
            technique: sessionData.technique || 'six_hats',
            currentStep: sessionData.history.length || 1,
            totalSteps: 10, // Default estimate
            history: sessionData.history.map((h, index) => ({
                step: index + 1,
                timestamp: h.timestamp,
                input: h,
                output: h,
            })),
            branches: {},
            insights: sessionData.insights || [],
            startTime: sessionData.startTime,
            endTime: sessionData.endTime,
        };
        const pathMemory = this.getPathMemory();
        return {
            sessionState,
            pathMemory: {
                constraints: pathMemory.constraints,
                pathHistory: pathMemory.pathHistory,
                flexibilityOverTime: [],
                availableOptions: pathMemory.availableOptions,
            },
            currentFlexibility: this.getCurrentFlexibility(),
            targetOptionCount: 10,
        };
    }
}
//# sourceMappingURL=index.js.map