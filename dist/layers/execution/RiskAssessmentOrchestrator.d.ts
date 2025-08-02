/**
 * RiskAssessmentOrchestrator - Handles risk assessment pipeline
 * Extracted from executeThinkingStep to improve maintainability
 */
import type { ExecuteThinkingStepInput, SessionData, LateralThinkingResponse } from '../../types/index.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
import type { RuinRiskAssessment } from '../../ergodicity/prompts.js';
import type { DomainAssessment, RiskDiscovery, ValidationResult } from '../../core/RuinRiskDiscovery.js';
import type { EscalationPrompt } from '../../ergodicity/escalationPrompts.js';
export interface RiskAssessmentResult {
    requiresIntervention: boolean;
    interventionResponse?: LateralThinkingResponse;
    ruinRiskAssessment?: RuinRiskAssessment;
    domainAssessment?: DomainAssessment;
    discoveredRisks?: RiskDiscovery;
    validation?: ValidationResult;
    escalationPrompt?: EscalationPrompt;
    behavioralFeedback?: string;
}
export declare class RiskAssessmentOrchestrator {
    private visualFormatter;
    private dismissalTracker;
    private escalationGenerator;
    private riskDiscovery;
    constructor(visualFormatter: VisualFormatter);
    /**
     * Perform comprehensive risk assessment
     */
    assessRisks(input: ExecuteThinkingStepInput, session: SessionData): RiskAssessmentResult;
    /**
     * Perform ruin risk assessment with escalation handling
     */
    private performRuinAssessment;
    /**
     * Perform dynamic risk discovery
     */
    private performRiskDiscovery;
}
//# sourceMappingURL=RiskAssessmentOrchestrator.d.ts.map