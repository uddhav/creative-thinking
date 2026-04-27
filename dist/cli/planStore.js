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
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
function plansDir() {
    const base = process.env.PERSISTENCE_PATH || join(homedir(), '.creative-thinking');
    return join(base, 'plans');
}
function planFile(planId) {
    return join(plansDir(), `${planId}.json`);
}
/**
 * Persist the full in-memory plan after `socketes plan` succeeds.
 *
 * We can't use the unwrapped MCP response because ResponseBuilder strips
 * fields the executor needs (notably `techniques`). Read the canonical
 * plan from PlanManager instead.
 */
export function persistPlan(server, planId) {
    if (!planId)
        return;
    const plan = server.getSessionManager().getPlan(planId);
    if (!plan)
        return;
    try {
        mkdirSync(plansDir(), { recursive: true });
        writeFileSync(planFile(planId), JSON.stringify(plan), 'utf8');
    }
    catch (err) {
        process.stderr.write(`[socketes] Warning: failed to persist plan ${planId}: ${err.message}\n`);
    }
}
/**
 * Inject a previously-persisted plan into the in-memory PlanManager so
 * the execution layer can look it up by ID. Idempotent — if the plan is
 * already in memory or the file doesn't exist, this is a no-op.
 */
export function hydratePlan(server, planId) {
    if (!planId)
        return;
    const sessionManager = server.getSessionManager();
    if (sessionManager.getPlan(planId))
        return;
    const path = planFile(planId);
    if (!existsSync(path))
        return;
    try {
        const raw = readFileSync(path, 'utf8');
        const plan = JSON.parse(raw);
        if (plan && plan.planId === planId) {
            sessionManager.savePlan(planId, plan);
        }
    }
    catch (err) {
        process.stderr.write(`[socketes] Warning: failed to load plan ${planId}: ${err.message}\n`);
    }
}
//# sourceMappingURL=planStore.js.map