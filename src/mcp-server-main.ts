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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { LateralThinkingServer } from './index.js';
import { RequestHandlers } from './server/RequestHandlers.js';

const server = new Server(
  {
    name: 'creative-thinking',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

const lateralServer = new LateralThinkingServer();
const requestHandlers = new RequestHandlers(server, lateralServer);
requestHandlers.setupHandlers();

const activeRequests = 0;

function getActiveRequests(): number {
  return requestHandlers.getActiveRequests() + activeRequests;
}

let isShuttingDown = false;
let transport: StdioServerTransport | null = null;
let shutdownTimeout: NodeJS.Timeout | null = null;

async function gracefulShutdown(signal: string): Promise<void> {
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
    interface StreamWithHandle extends NodeJS.WriteStream {
      _handle?: { setBlocking?: (blocking: boolean) => void };
    }

    const stdoutWithHandle = process.stdout as StreamWithHandle;
    const stderrWithHandle = process.stderr as StreamWithHandle;

    if (stdoutWithHandle.isTTY && stdoutWithHandle._handle?.setBlocking) {
      try {
        stdoutWithHandle._handle.setBlocking(true);
      } catch {
        // setBlocking unavailable
      }
    }
    if (stderrWithHandle.isTTY && stderrWithHandle._handle?.setBlocking) {
      try {
        stderrWithHandle._handle.setBlocking(true);
      } catch {
        // setBlocking unavailable
      }
    }

    lateralServer.destroy();
    console.error('[Server] Cleaned up server resources');

    if (transport) {
      await transport.close();
      console.error('[Server] Closed transport connection');
    }

    await server.close();
    console.error('[Server] Closed MCP server');

    await new Promise<void>(resolve => {
      if (process.stdout && !process.stdout.writableEnded) {
        process.stdout.end(() => {
          console.error('[Server] Stdout flushed');
          resolve();
        });
      } else {
        resolve();
      }
    });

    await new Promise<void>(resolve => {
      if (process.stderr && !process.stderr.writableEnded) {
        process.stderr.end(() => resolve());
      } else {
        resolve();
      }
    });

    console.error('[Server] Graceful shutdown complete');
    await new Promise(resolve => setTimeout(resolve, 100));

    if (shutdownTimeout) clearTimeout(shutdownTimeout);
    process.exitCode = 0;

    setTimeout(() => {
      console.error('[Server] Forcing exit after grace period');
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error('[Server] Error during graceful shutdown:', error);
    await new Promise(resolve => setTimeout(resolve, 50));

    if (shutdownTimeout) clearTimeout(shutdownTimeout);
    process.exitCode = 1;

    setTimeout(() => process.exit(1), 500);
  }
}

async function main(): Promise<void> {
  try {
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

    await server.connect(transport);
    console.error('Creative Thinking MCP server running on stdio');
    console.error(
      '[Server] Debug mode:',
      process.env.DEBUG_MCP === 'true' ? 'ENABLED' : 'disabled'
    );
    console.error('[Server] To enable debug logging, set DEBUG_MCP=true');
  } catch (error) {
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
