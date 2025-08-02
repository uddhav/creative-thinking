/**
 * PlanManager - Handles plan storage and retrieval
 * Extracted from SessionManager to improve maintainability
 */
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
export declare class PlanManager {
    private plans;
    private readonly PLAN_TTL;
    /**
     * Save a plan
     */
    savePlan(planId: string, plan: PlanThinkingSessionOutput): void;
    /**
     * Get a plan by ID
     */
    getPlan(planId: string): PlanThinkingSessionOutput | undefined;
    /**
     * Delete a plan
     */
    deletePlan(planId: string): boolean;
    /**
     * Get all plans
     */
    getAllPlans(): Map<string, PlanThinkingSessionOutput>;
    /**
     * Get the number of plans
     */
    getPlanCount(): number;
    /**
     * Clean up expired plans
     */
    cleanupExpiredPlans(): string[];
    /**
     * Clear all plans
     */
    clearAllPlans(): void;
    /**
     * Check if a plan exists
     */
    hasPlan(planId: string): boolean;
    /**
     * Get plan age in milliseconds
     */
    getPlanAge(planId: string): number | null;
    /**
     * Get plans sorted by creation time (newest first)
     */
    getPlansByCreationTime(): Array<{
        planId: string;
        plan: PlanThinkingSessionOutput;
    }>;
    /**
     * Get plan memory usage
     */
    getPlanMemoryUsage(): number;
}
//# sourceMappingURL=PlanManager.d.ts.map