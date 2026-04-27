/**
 * CLI-side plan store.
 *
 * The core PlanManager is in-memory only — fine for a long-running MCP
 * server but useless for a one-shot CLI where every invocation starts a
 * fresh process. We mirror plans to disk under PERSISTENCE_PATH/plans/ so
 * a `socketes plan` in one process can be looked up by `socketes execute`
 * in a later process. Sessions already persist via the existing filesystem
 * adapter; this fills the matching gap for plans.
 */
import type { LateralThinkingServer } from '../index.js';
/**
 * Persist the full in-memory plan after `socketes plan` succeeds.
 *
 * We can't use the unwrapped MCP response because ResponseBuilder strips
 * fields the executor needs (notably `techniques`). Read the canonical
 * plan from PlanManager instead.
 */
export declare function persistPlan(server: LateralThinkingServer, planId: string | undefined): void;
/**
 * Inject a previously-persisted plan into the in-memory PlanManager so
 * the execution layer can look it up by ID. Idempotent — if the plan is
 * already in memory or the file doesn't exist, this is a no-op.
 */
export declare function hydratePlan(server: LateralThinkingServer, planId: string): void;
//# sourceMappingURL=planStore.d.ts.map