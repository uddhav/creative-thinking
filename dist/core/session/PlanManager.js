/**
 * PlanManager - Handles plan storage and retrieval
 * Extracted from SessionManager to improve maintainability
 */
/**
 * How long a plan stays in process memory after it was created. This is a
 * cache horizon, not retention: a plan evicted here is reloaded from the
 * persistence adapter on the next `SessionManager.getPlan`, so it is a
 * lifetime only when no adapter is configured (the default MCP server). Disk
 * and database retention is `PERSISTENCE_TTL_DAYS` (#357). Defined once;
 * `SessionCleaner` used to carry its own copy of this number.
 */
export const PLAN_CACHE_TTL_MS = 4 * 60 * 60 * 1000;
export class PlanManager {
    plans = new Map();
    /**
     * Save a plan
     */
    savePlan(planId, plan) {
        this.plans.set(planId, plan);
    }
    /**
     * Get a plan by ID
     */
    getPlan(planId) {
        return this.plans.get(planId);
    }
    /**
     * Get all plans
     */
    getAllPlans() {
        return this.plans;
    }
    /**
     * Get the number of plans
     */
    getPlanCount() {
        return this.plans.size;
    }
    /**
     * Evict plans past the cache horizon from memory. Called from the cleaner
     * tick; a plan with no createdAt is treated as expired, as it always was.
     */
    cleanupExpiredPlans() {
        const now = Date.now();
        const plansToDelete = [];
        for (const [planId, plan] of this.plans.entries()) {
            if (!plan.createdAt || now - plan.createdAt > PLAN_CACHE_TTL_MS) {
                plansToDelete.push(planId);
            }
        }
        for (const planId of plansToDelete) {
            this.plans.delete(planId);
        }
        return plansToDelete;
    }
    /**
     * Clear all plans
     */
    clearAllPlans() {
        this.plans.clear();
    }
}
//# sourceMappingURL=PlanManager.js.map