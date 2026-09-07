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
export const PLAN_CACHE_TTL_MS = 4 * 60 * 60 * 1000;

export class PlanManager {
  private plans: Map<string, PlanThinkingSessionOutput> = new Map();

  /**
   * Save a plan
   */
  savePlan(planId: string, plan: PlanThinkingSessionOutput): void {
    this.plans.set(planId, plan);
  }

  /**
   * Get a plan by ID
   */
  getPlan(planId: string): PlanThinkingSessionOutput | undefined {
    return this.plans.get(planId);
  }

  /**
   * Get all plans
   */
  getAllPlans(): Map<string, PlanThinkingSessionOutput> {
    return this.plans;
  }

  /**
   * Get the number of plans
   */
  getPlanCount(): number {
    return this.plans.size;
  }

  /**
   * Evict plans past the cache horizon from memory. Called from the cleaner
   * tick; a plan with no createdAt is treated as expired, as it always was.
   */
  cleanupExpiredPlans(): string[] {
    const now = Date.now();
    const plansToDelete: string[] = [];

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
  clearAllPlans(): void {
    this.plans.clear();
  }
}
