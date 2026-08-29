/**
 * CLI-side plan store — now a thin adapter over the shared one.
 *
 * The implementation moved to `src/core/session/planStore.ts` when the MCP
 * server needed the same durability and had none, so that the same planId
 * behaves the same way whichever binary is holding it (#316). These wrappers
 * remain because the CLI commands hold a `LateralThinkingServer` while the
 * shared functions take a `SessionManager` — core must not import the
 * top-level server class.
 *
 * `persistPlan` is still called from `socketes plan` even though
 * `planThinkingSession` now persists on its own: both are idempotent writes of
 * the same plan, and leaving the CLI call in place means the CLI does not
 * silently depend on where in the shared path the write happens.
 */
import type { LateralThinkingServer } from '../index.js';
export declare function persistPlan(server: LateralThinkingServer, planId: string | undefined): void;
export declare function hydratePlan(server: LateralThinkingServer, planId: string): void;
//# sourceMappingURL=planStore.d.ts.map