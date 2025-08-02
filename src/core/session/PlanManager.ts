/**
 * PlanManager - Handles plan storage and retrieval
 * Extracted from SessionManager to improve maintainability
 */

import type { PlanThinkingSessionOutput } from '../../types/planning.js';

export class PlanManager {
  private plans: Map<string, PlanThinkingSessionOutput> = new Map();
  private readonly PLAN_TTL = 4 * 60 * 60 * 1000; // 4 hours for plans

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
   * Delete a plan
   */
  deletePlan(planId: string): boolean {
    return this.plans.delete(planId);
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
   * Clean up expired plans
   */
  cleanupExpiredPlans(): string[] {
    const now = Date.now();
    const plansToDelete: string[] = [];

    for (const [planId, plan] of this.plans.entries()) {
      if (!plan.createdAt || now - plan.createdAt > this.PLAN_TTL) {
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

  /**
   * Check if a plan exists
   */
  hasPlan(planId: string): boolean {
    return this.plans.has(planId);
  }

  /**
   * Get plan age in milliseconds
   */
  getPlanAge(planId: string): number | null {
    const plan = this.plans.get(planId);
    if (!plan || !plan.createdAt) return null;
    return Date.now() - plan.createdAt;
  }

  /**
   * Get plans sorted by creation time (newest first)
   */
  getPlansByCreationTime(): Array<{ planId: string; plan: PlanThinkingSessionOutput }> {
    const plansArray = Array.from(this.plans.entries()).map(([planId, plan]) => ({
      planId,
      plan,
    }));

    return plansArray.sort((a, b) => {
      const aTime = a.plan.createdAt || 0;
      const bTime = b.plan.createdAt || 0;
      return bTime - aTime;
    });
  }

  /**
   * Get plan memory usage
   */
  getPlanMemoryUsage(): number {
    let total = 0;
    for (const plan of this.plans.values()) {
      try {
        total += JSON.stringify(plan).length * 2; // UTF-16 characters
      } catch {
        // Skip plans that can't be stringified
      }
    }
    return total;
  }
}
