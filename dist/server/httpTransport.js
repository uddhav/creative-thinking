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
import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { getVersion } from '../version.js';
import { createMcpServer } from './createMcpServer.js';
/**
 * Pick the transport: `--transport <mode>` (or `--transport=<mode>`) wins over
 * MCP_TRANSPORT, and stdio is the default. Throws on an unknown mode.
 */
export function resolveTransportMode(argv, env = process.env) {
    let value;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--transport') {
            value = argv[i + 1];
            if (value === undefined)
                throw new Error('--transport needs a value: stdio or http');
            i++;
        }
        else if (arg.startsWith('--transport=')) {
            value = arg.slice('--transport='.length);
        }
    }
    value = (value ?? (env.MCP_TRANSPORT?.trim() || 'stdio')).trim().toLowerCase();
    if (value === 'stdio' || value === 'http')
        return value;
    throw new Error(`Unknown transport "${value}". Use stdio or http.`);
}
const DEFAULT_PORT = 8080;
const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;
const LOOPBACK_BIND_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const LOOPBACK_HOST_HEADERS = new Set(['127.0.0.1', 'localhost', '[::1]']);
/**
 * Read HTTP options from the environment. Throws on a value that cannot be
 * used, so a typo fails at startup rather than on the first request.
 */
export function resolveHttpOptions(env = process.env) {
    const portText = env.PORT?.trim();
    const port = portText ? Number(portText) : DEFAULT_PORT;
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
        throw new Error(`PORT must be a whole number from 0 to 65535, got "${env.PORT}"`);
    }
    const mcpPath = env.MCP_HTTP_PATH?.trim() || '/mcp';
    if (!mcpPath.startsWith('/') || mcpPath === '/health') {
        throw new Error(`MCP_HTTP_PATH must start with "/" and must not be "/health", got "${mcpPath}"`);
    }
    const maxText = env.MCP_HTTP_MAX_BODY_BYTES?.trim();
    const maxBodyBytes = maxText ? Number(maxText) : DEFAULT_MAX_BODY_BYTES;
    if (!Number.isInteger(maxBodyBytes) || maxBodyBytes <= 0) {
        throw new Error(`MCP_HTTP_MAX_BODY_BYTES must be a positive whole number, got "${maxText}"`);
    }
    const authToken = env.MCP_HTTP_AUTH_TOKEN?.trim();
    return {
        host: env.HOST?.trim() || '127.0.0.1',
        port,
        mcpPath,
        maxBodyBytes,
        ...(authToken ? { authToken } : {}),
    };
}
function sendJson(res, status, body, headers = {}) {
    if (res.headersSent) {
        res.end();
        return;
    }
    res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify(body));
}
function sendJsonRpcError(res, status, code, message, headers = {}) {
    sendJson(res, status, { jsonrpc: '2.0', error: { code, message }, id: null }, headers);
}
/** Hostname from a Host header, without the port. Keeps IPv6 brackets. */
function hostnameOf(hostHeader) {
    if (hostHeader.startsWith('[')) {
        const end = hostHeader.indexOf(']');
        return end === -1 ? hostHeader : hostHeader.slice(0, end + 1);
    }
    const colon = hostHeader.indexOf(':');
    return (colon === -1 ? hostHeader : hostHeader.slice(0, colon)).toLowerCase();
}
/** Compare tokens in constant time. Hashing first hides the length. */
function tokenMatches(given, expected) {
    const a = createHash('sha256').update(given).digest();
    const b = createHash('sha256').update(expected).digest();
    return timingSafeEqual(a, b);
}
class BodyTooLargeError extends Error {
}
function readBody(req, limit) {
    return new Promise((resolve, reject) => {
        const declared = Number(req.headers['content-length']);
        if (Number.isFinite(declared) && declared > limit) {
            reject(new BodyTooLargeError());
            return;
        }
        const chunks = [];
        let size = 0;
        let tooLarge = false;
        req.on('data', (chunk) => {
            if (tooLarge)
                return;
            size += chunk.length;
            if (size > limit) {
                // Stop keeping data but leave the socket alone, so the client still
                // gets the 413. That reply sends Connection: close, which ends it.
                tooLarge = true;
                chunks.length = 0;
                reject(new BodyTooLargeError());
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}
/**
 * Start the HTTP server. Resolves once it is listening.
 */
export async function startHttpServer(lateralServer, options) {
    // A server bound to loopback must only answer to loopback names. Otherwise a
    // web page can rebind its own domain to 127.0.0.1 and drive the server from
    // the browser (DNS rebinding). Behind a public bind the proxy in front owns
    // the Host header, so the check would only get in the way.
    const checkHost = LOOPBACK_BIND_HOSTS.has(options.host);
    let active = 0;
    async function handleMcp(req, res) {
        if (req.method !== 'POST') {
            // Stateless: no standalone SSE stream (GET) and no session to end (DELETE).
            sendJsonRpcError(res, 405, -32000, 'Method not allowed. This server accepts POST only.', {
                Allow: 'POST',
            });
            return;
        }
        if (options.authToken) {
            const header = req.headers.authorization ?? '';
            const match = /^Bearer\s+(.+)$/i.exec(header);
            if (!match || !tokenMatches(match[1].trim(), options.authToken)) {
                sendJsonRpcError(res, 401, -32001, 'Unauthorized', {
                    'WWW-Authenticate': 'Bearer',
                });
                return;
            }
        }
        let parsed;
        try {
            parsed = JSON.parse(await readBody(req, options.maxBodyBytes));
        }
        catch (error) {
            if (error instanceof BodyTooLargeError) {
                sendJsonRpcError(res, 413, -32000, `Request body exceeds ${options.maxBodyBytes} bytes`, {
                    Connection: 'close',
                });
            }
            else {
                sendJsonRpcError(res, 400, -32700, 'Parse error: body is not valid JSON');
            }
            return;
        }
        const { server } = createMcpServer(lateralServer);
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true,
        });
        res.on('close', () => {
            void transport.close();
            void server.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, parsed);
    }
    async function handle(req, res) {
        if (checkHost && !LOOPBACK_HOST_HEADERS.has(hostnameOf(req.headers.host ?? ''))) {
            sendJsonRpcError(res, 403, -32000, 'Forbidden: Host header is not a loopback name');
            return;
        }
        const pathname = new URL(req.url ?? '/', 'http://placeholder').pathname;
        if (pathname === '/health') {
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'GET, HEAD' });
                return;
            }
            sendJson(res, 200, {
                status: 'ok',
                name: 'creative-thinking',
                version: getVersion(),
                transport: 'streamable-http',
            });
            return;
        }
        if (pathname === options.mcpPath) {
            await handleMcp(req, res);
            return;
        }
        sendJson(res, 404, { error: 'Not found' });
    }
    const httpServer = createServer((req, res) => {
        active++;
        res.on('close', () => {
            active--;
        });
        handle(req, res).catch((error) => {
            console.error('[HTTP] Request failed:', error);
            sendJsonRpcError(res, 500, -32603, 'Internal server error');
        });
    });
    await new Promise((resolve, reject) => {
        httpServer.once('error', reject);
        httpServer.listen(options.port, options.host, () => {
            httpServer.off('error', reject);
            resolve();
        });
    });
    const { port } = httpServer.address();
    const urlHost = options.host.includes(':') ? `[${options.host}]` : options.host;
    return {
        url: `http://${urlHost}:${port}${options.mcpPath}`,
        port,
        activeRequests: () => active,
        close: () => new Promise((resolve, reject) => {
            httpServer.close(error => (error ? reject(error) : resolve()));
            httpServer.closeIdleConnections();
        }),
    };
}
//# sourceMappingURL=httpTransport.js.map