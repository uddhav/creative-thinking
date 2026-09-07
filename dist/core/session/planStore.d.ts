/**
 * Plan persistence, shared by both binaries, through the persistence adapter.
 *
 * `PlanManager` keeps plans in an in-memory Map, which is enough for a
 * long-running server that issues and executes a plan in one process, and
 * useless for anything that crosses a process boundary. This mirrors plans to
 * the configured adapter so a plan made in one process, or on one instance,
 * can be executed in another.
 *
 * This began life as `src/cli/planStore.ts`, where it existed because every
 * `socketes` invocation is a fresh process. The MCP server needed the same
 * thing for a different reason — surviving its own restart — and had no
 * equivalent, so the two binaries disagreed about whether a planId outlives the
 * process that issued it (#316). It is shared rather than duplicated so they
 * cannot drift apart again.
 *
 * It was a synchronous side store on the local disk until #358: plans went to
 * `plans/<planId>.json` under every backend, including postgres, so a
 * multi-instance server still lost them, and nothing ever deleted a plan file
 * (#357). Both functions are now async wrappers over `SessionManager`'s
 * persistence, which is the adapter. The filesystem adapter keeps the same
 * bare-JSON `plans/<planId>.json` layout, so directories written before this
 * change load unchanged; postgres gets a `creative_plans` table; retention for
 * both record kinds is `PERSISTENCE_TTL_DAYS`.
 *
 * Persisted iff an adapter came up. That is the predicate sessions already
 * used, and it replaces an env-name gate that had to admit `postgres` by name
 * even though plans did not go there. Under `PERSISTENCE_TYPE=memory` the CLI
 * persists nothing, plans included, as before.
 */
import type { SessionManager } from '../SessionManager.js';
/**
 * Persist the full in-memory plan after planning succeeds.
 *
 * Reads the canonical plan from `PlanManager` through the SYNC accessor:
 * `ResponseBuilder` strips fields the executor needs, `techniques` among them,
 * so the tool response is not the thing to write; and the async `getPlan`
 * would hand `JSON.stringify` a Promise, which serialises as `{}` and would be
 * rejected as malformed on every load.
 */
export declare function persistPlan(sessionManager: SessionManager, planId: string | undefined): Promise<void>;
/**
 * Load a previously persisted plan back into `PlanManager` so callers can find
 * it by id. A no-op without an adapter or without a record.
 *
 * Deliberately does NOT check whether the plan is already in memory, even
 * though that would be the obvious guard. `SessionManager.getPlan` calls this
 * on a miss, so asking it back would recurse. The memory check belongs to the
 * caller, which has already done it.
 */
export declare function hydratePlan(sessionManager: SessionManager, planId: string): Promise<void>;
//# sourceMappingURL=planStore.d.ts.map