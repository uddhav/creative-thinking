/**
 * Streamable HTTP transport for the MCP server.
 *
 * Stateless by design: each POST gets a fresh SDK `Server` and transport, and
 * both share one `LateralThinkingServer` engine. MCP session ids would live in
 * one process's memory, so a restart or a second instance (Cloud Run, Fly)
 * would answer every client with "session not found". Nothing here needs a
 * stream back to the client either: the server sends no notifications and
 * makes no requests of the client. Thinking plans and sessions are keyed by
 * their own ids and live in the persistence adapter, which is what makes
 * them survive restarts (set PERSISTENCE_TYPE).
 *
 * Plain `node:http`, not express. The SDK transport takes Node's request and
 * response directly, and keeping express off the runtime path keeps its
 * dependency advisories off it too.
 *
 * No side effects: importing this module starts nothing.
 */
import type { LateralThinkingServer } from '../index.js';
export interface HttpTransportOptions {
    /** Interface to bind. Loopback by default; containers set 0.0.0.0. */
    host: string;
    /** Port to bind. 0 picks a free port. */
    port: number;
    /** Path that serves MCP. A long random path works as a capability URL. */
    mcpPath: string;
    /** When set, MCP requests must send `Authorization: Bearer <token>`. */
    authToken?: string;
    /** Largest accepted request body, in bytes. */
    maxBodyBytes: number;
}
export interface HttpServerHandle {
    /** Full URL of the MCP endpoint, with the bound port. */
    url: string;
    port: number;
    /** HTTP requests still being answered. */
    activeRequests(): number;
    /** Stop accepting connections and wait for open requests to finish. */
    close(): Promise<void>;
}
export type TransportMode = 'stdio' | 'http';
/**
 * Pick the transport: `--transport <mode>` (or `--transport=<mode>`) wins over
 * MCP_TRANSPORT, and stdio is the default. Throws on an unknown mode.
 */
export declare function resolveTransportMode(argv: readonly string[], env?: NodeJS.ProcessEnv): TransportMode;
/**
 * Read HTTP options from the environment. Throws on a value that cannot be
 * used, so a typo fails at startup rather than on the first request.
 */
export declare function resolveHttpOptions(env?: NodeJS.ProcessEnv): HttpTransportOptions;
/**
 * Start the HTTP server. Resolves once it is listening.
 */
export declare function startHttpServer(lateralServer: LateralThinkingServer, options: HttpTransportOptions): Promise<HttpServerHandle>;
//# sourceMappingURL=httpTransport.d.ts.map