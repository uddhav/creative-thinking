/**
 * Dynamic Escalation Prompts
 *
 * Generates behavioral prompts based on dismissal patterns,
 * not domain categories. References the LLM's own discoveries.
 */
import type { RiskEngagementMetrics, DismissalPattern } from './riskDismissalTracker.js';
import type { SessionData } from '../types/index.js';
export interface EscalationPrompt {
    level: number;
    prompt: string;
    requiresResponse: boolean;
    minimumConfidence?: number;
    locksProgress?: boolean;
}
export declare class EscalationPromptGenerator {
    /**
     * Generate appropriate escalation prompt based on metrics and patterns
     */
    generatePrompt(metrics: RiskEngagementMetrics, patterns: DismissalPattern[], sessionData: SessionData): EscalationPrompt | null;
    /**
     * Level 2: Pattern recognition with contextual awareness
     */
    private generateLevel2Prompt;
    /**
     * Level 3: Behavioral lock with self-referential requirements
     */
    private generateLevel3Prompt;
    /**
     * Level 4: High-stakes personal declaration
     */
    private generateLevel4Prompt;
    /**
     * Extract risks discovered by the LLM from session history
     */
    private extractDiscoveredRisks;
    /**
     * Extract proposed actions from session
     */
    private extractProposedActions;
    /**
     * Find contradictions between discoveries and actions
     */
    private findContradictions;
    /**
     * Generate calculation requirements based on discovered risks
     */
    private generateCalculationRequirements;
    /**
     * Generate reflection requirements
     */
    generateReflectionRequirement(sessionData: SessionData, currentStep: number): string | null;
}
//# sourceMappingURL=escalationPrompts.d.ts.map