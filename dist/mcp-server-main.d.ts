#!/usr/bin/env node
/**
 * Creative Thinking MCP Server entry point.
 *
 * This file is purely the runtime bootstrap: instantiate the MCP Server,
 * wire request handlers to the LateralThinkingServer class, register
 * shutdown handlers, and connect the stdio transport. All side effects
 * live here so importing the class from `./index.js` (e.g. from the
 * socketes CLI in `./cli.ts`) cannot accidentally start a server.
 *
 * The previous `isMcpEntryPoint` guard at the bottom of `./index.ts`
 * relied on `import.meta.url === file://process.argv[1]`, which works
 * under plain `node dist/index.js` but collapses under bundlers that
 * inline modules (notably `bun build --compile`, which makes every
 * module's `import.meta.url` resolve to the bundle's entry URL). With a
 * dedicated entry file, no detection is needed.
 */
export {};
//# sourceMappingURL=mcp-server-main.d.ts.map