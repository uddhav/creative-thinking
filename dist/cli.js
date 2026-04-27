#!/usr/bin/env node
/**
 * socketes — single-turn CLI for the Creative Thinking three-tool workflow.
 *
 * Each invocation does exactly one operation (`discover`, `plan`, `execute`,
 * or a `session` op) and exits. State lives on the local filesystem under
 * PERSISTENCE_PATH so a session can span days across many invocations.
 *
 * Contract mirrors the MCP tool surface in src/index.ts so an LLM driving
 * the CLI from a skill can keep the same discover → plan → execute mental
 * model used over MCP.
 */
import { applyCliDefaults } from './cli/server.js';
// Set default env vars BEFORE any module observes them
// (SessionPersistence snapshots PERSISTENCE_TYPE on first init).
applyCliDefaults();
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { registerDiscover } from './cli/commands/discover.js';
import { registerPlan } from './cli/commands/plan.js';
import { registerExecute } from './cli/commands/execute.js';
import { registerSession } from './cli/commands/session.js';
async function main() {
    let parser = yargs(hideBin(process.argv))
        .scriptName('socketes')
        .usage('$0 <command> [options]')
        .epilogue('Sessions persist to PERSISTENCE_PATH (default ~/.creative-thinking).\n' +
        'Run `socketes <command> --help` for command-specific options.\n' +
        'Most commands also accept a JSON object on stdin; flags override stdin fields.')
        .strict()
        .demandCommand(1, 'Specify a command: discover, plan, execute, or session')
        .recommendCommands()
        .help()
        .alias('h', 'help')
        .version();
    parser = registerDiscover(parser);
    parser = registerPlan(parser);
    parser = registerExecute(parser);
    parser = registerSession(parser);
    await parser.parseAsync();
}
main().catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${JSON.stringify({ error: message }, null, 2)}\n`);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map