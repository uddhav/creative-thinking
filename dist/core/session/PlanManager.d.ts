/**
 * PlanManager - Handles plan storage and retrieval
 * Extracted from SessionManager to improve maintainability
 */
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
/**
 * How long a plan stays in process memory after it was created. This is a
 * cache horizon, not retention: a plan evicted here is reloaded from the
 * persistence adapter on the next `SessionManager.getPlan`, so it is a
 * lifetime only when no adapter is configured (the default MCP server). Disk
 * and database retention is `PERSISTENCE_TTL_DAYS` (#357). Defined once;
 * `SessionCleaner` used to carry its own copy of this number.
 */
export declare const PLAN_CACHE_TTL_MS: number;
export declare class PlanManager {
    private plans;
    /**
     * Save a plan
     */
    savePlan(planId: string, plan: PlanThinkingSessionOutput): void;
    /**
     * Get a plan by ID
     */
    getPlan(planId: string): PlanThinkingSessionOutput | undefined;
    /**
     * Get all plans
     */
    getAllPlans(): Map<string, PlanThinkingSessionOutput>;
    /**
     * Get the number of plans
     */
    getPlanCount(): number;
    /**
     * Evict plans past the cache horizon from memory. Called from the cleaner
     * tick; a plan with no createdAt is treated as expired, as it always was.
     */
    cleanupExpiredPlans(): string[];
    /**
     * Clear all plans
     */
    clearAllPlans(): void;
}
//# sourceMappingURL=PlanManager.d.ts.map