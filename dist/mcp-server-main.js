#!/usr/bin/env node
/**
 * Creative Thinking MCP Server entry point.
 *
 * This file is purely the runtime bootstrap: instantiate the MCP Server,
 * wire request handlers to the LateralThinkingServer class, register
 * shutdown handlers, and connect the transport: stdio by default, or
 * Streamable HTTP with `--transport http` / MCP_TRANSPORT=http (see
 * `./server/httpTransport.ts`). All side effects
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
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { LateralThinkingServer } from './index.js';
import { createMcpServer } from './server/createMcpServer.js';
import { resolveHttpOptions, resolveTransportMode, startHttpServer, } from './server/httpTransport.js';
// Read the transport choice before building anything, so a typo exits at once.
let transportMode;
let httpOptions = null;
try {
    transportMode = resolveTransportMode(process.argv.slice(2), process.env);
    if (transportMode === 'http')
        httpOptions = resolveHttpOptions(process.env);
}
catch (error) {
    console.error(`[Server] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
}
const lateralServer = new LateralThinkingServer();
// stdio keeps one protocol server for the life of the process. HTTP builds one
// per request inside the transport, so it has none here.
let server = null;
let requestHandlers = null;
if (transportMode === 'stdio') {
    ({ server, requestHandlers } = createMcpServer(lateralServer));
}
let httpHandle = null;
function getActiveRequests() {
    return (requestHandlers?.getActiveRequests() ?? 0) + (httpHandle?.activeRequests() ?? 0);
}
let isShuttingDown = false;
let transport = null;
let shutdownTimeout = null;
async function gracefulShutdown(signal) {
    if (isShuttingDown) {
        console.error(`[Server] Already shutting down, ignoring ${signal}`);
        return;
    }
    isShuttingDown = true;
    const totalActiveRequests = getActiveRequests();
    console.error(`[Server] Received ${signal}, starting graceful shutdown...`);
    console.error(`[Server] Active requests: ${totalActiveRequests}`);
    shutdownTimeout = setTimeout(() => {
        console.error('[Server] Shutdown timeout reached, forcing exit');
        process.exit(1);
    }, 5000);
    const waitStart = Date.now();
    let currentActive = getActiveRequests();
    while (currentActive > 0 && Date.now() - waitStart < 2000) {
        console.error(`[Server] Waiting for ${currentActive} active requests...`);
        await new Promise(resolve => setTimeout(resolve, 100));
        currentActive = getActiveRequests();
    }
    if (currentActive > 0) {
        console.error(`[Server] Warning: ${currentActive} requests still active after 2s`);
    }
    try {
        const stdoutWithHandle = process.stdout;
        const stderrWithHandle = process.stderr;
        if (stdoutWithHandle.isTTY && stdoutWithHandle._handle?.setBlocking) {
            try {
                stdoutWithHandle._handle.setBlocking(true);
            }
            catch {
                // setBlocking unavailable
            }
        }
        if (stderrWithHandle.isTTY && stderrWithHandle._handle?.setBlocking) {
            try {
                stderrWithHandle._handle.setBlocking(true);
            }
            catch {
                // setBlocking unavailable
            }
        }
        await lateralServer.shutdown();
        console.error('[Server] Cleaned up server resources');
        if (httpHandle) {
            await httpHandle.close();
            console.error('[Server] Closed HTTP server');
        }
        if (transport) {
            await transport.close();
            console.error('[Server] Closed transport connection');
        }
        if (server) {
            await server.close();
            console.error('[Server] Closed MCP server');
        }
        await new Promise(resolve => {
            if (process.stdout && !process.stdout.writableEnded) {
                process.stdout.end(() => {
                    console.error('[Server] Stdout flushed');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
        await new Promise(resolve => {
            if (process.stderr && !process.stderr.writableEnded) {
                process.stderr.end(() => resolve());
            }
            else {
                resolve();
            }
        });
        console.error('[Server] Graceful shutdown complete');
        await new Promise(resolve => setTimeout(resolve, 100));
        if (shutdownTimeout)
            clearTimeout(shutdownTimeout);
        process.exitCode = 0;
        setTimeout(() => {
            console.error('[Server] Forcing exit after grace period');
            process.exit(0);
        }, 500);
    }
    catch (error) {
        console.error('[Server] Error during graceful shutdown:', error);
        await new Promise(resolve => setTimeout(resolve, 50));
        if (shutdownTimeout)
            clearTimeout(shutdownTimeout);
        process.exitCode = 1;
        setTimeout(() => process.exit(1), 500);
    }
}
async function startStdio(mcpServer) {
    transport = new StdioServerTransport();
    transport.onclose = () => {
        console.error('[Server] Transport closed');
        if (!isShuttingDown) {
            void gracefulShutdown('transport-close');
        }
    };
    transport.onerror = error => {
        console.error('[Server] Transport error:', error);
        if (!isShuttingDown) {
            void gracefulShutdown('transport-error');
        }
    };
    await mcpServer.connect(transport);
    console.error('Creative Thinking MCP server running on stdio');
}
async function startHttp(options) {
    httpHandle = await startHttpServer(lateralServer, options);
    console.error(`Creative Thinking MCP server listening on ${httpHandle.url}`);
    if (!options.authToken && options.host !== '127.0.0.1' && options.host !== 'localhost') {
        console.error('[Server] Warning: no MCP_HTTP_AUTH_TOKEN and not bound to loopback. ' +
            'Anyone who can reach this address can call the tools.');
    }
}
async function main() {
    try {
        if (httpOptions) {
            await startHttp(httpOptions);
        }
        else if (server) {
            await startStdio(server);
        }
        console.error('[Server] Debug mode:', process.env.DEBUG_MCP === 'true' ? 'ENABLED' : 'disabled');
        console.error('[Server] To enable debug logging, set DEBUG_MCP=true');
    }
    catch (error) {
        console.error('[Server] Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGHUP', () => void gracefulShutdown('SIGHUP'));
process.on('uncaughtException', error => {
    console.error('[Server] Uncaught exception:', error);
    void gracefulShutdown('uncaughtException').then(() => {
        process.exitCode = 1;
    });
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled rejection at:', promise, 'reason:', reason);
    void gracefulShutdown('unhandledRejection').then(() => {
        process.exitCode = 1;
    });
});
main().catch(error => {
    console.error('[Server] Fatal error:', error);
    if (!isShuttingDown) {
        void gracefulShutdown('fatal-error').then(() => {
            process.exitCode = 1;
        });
    }
});
//# sourceMappingURL=mcp-server-main.js.map