/**
 * Streamable HTTP transport, end to end over a real socket.
 *
 * The in-process half drives `startHttpServer` with the SDK's own HTTP client,
 * the same client a remote MCP host uses. The spawned half runs the BUILT
 * entry point (`dist/mcp-server-main.js --transport http`), so the flag
 * parsing and startup path are covered too. stdio behaviour is covered by
 * mcp-client-integration.test.ts and is unchanged.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'child_process';
import { request } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import { LateralThinkingServer } from '../../index.js';
import {
  bearerToken,
  resolveHttpOptions,
  resolveTransportMode,
  startHttpServer,
  type HttpServerHandle,
} from '../../server/httpTransport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_MAIN = path.join(__dirname, '../../../dist/mcp-server-main.js');
const PROBLEM = 'How might a small team run better retrospectives?';

function textJson(result: unknown): Record<string, unknown> {
  const content = (result as { content: Array<{ type: string; text: string }> }).content;
  return JSON.parse(content[0].text) as Record<string, unknown>;
}

async function connectClient(url: string, headers?: Record<string, string>): Promise<Client> {
  const client = new Client({ name: 'http-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL(url),
    headers ? { requestInit: { headers } } : undefined
  );
  await client.connect(transport);
  return client;
}

interface HttpCallResult {
  status: number;
  header(name: string): string | undefined;
  json(): unknown;
}

/**
 * A fetch-shaped call on node:http. node:http also lets a test set the Host
 * header, which fetch forbids.
 */
function httpCall(
  url: string | URL,
  init: { method?: string; headers?: Record<string, string>; body?: string; chunked?: boolean } = {}
): Promise<HttpCallResult> {
  const headers = { ...init.headers };
  // Like fetch, declare the length; `chunked` sends the body without one.
  if (init.body !== undefined && !init.chunked) {
    headers['Content-Length'] = String(Buffer.byteLength(init.body));
  }
  return new Promise((resolve, reject) => {
    const req = request(url, { method: init.method ?? 'GET', headers }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c: string) => (body += c));
      res.on('end', () =>
        resolve({
          status: res.statusCode ?? 0,
          header: name => {
            const value = res.headers[name.toLowerCase()];
            return Array.isArray(value) ? value.join(', ') : value;
          },
          json: () => JSON.parse(body) as unknown,
        })
      );
    });
    req.on('error', reject);
    if (init.body) req.write(init.body);
    req.end();
  });
}

const INIT_BODY = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'raw', version: '1' },
  },
});
const POST_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/event-stream',
};

describe('HTTP transport (in process)', () => {
  let engine: LateralThinkingServer;
  let open: HttpServerHandle;
  let guarded: HttpServerHandle;

  beforeAll(async () => {
    engine = new LateralThinkingServer();
    const base = { host: '127.0.0.1', port: 0, mcpPath: '/mcp', maxBodyBytes: 64 * 1024 };
    open = await startHttpServer(engine, base);
    guarded = await startHttpServer(engine, {
      ...base,
      mcpPath: '/secret-path',
      authToken: 'test-token',
    });
  });

  afterAll(async () => {
    await open.close();
    await guarded.close();
    await engine.shutdown();
  });

  it('initializes and lists the three tools', async () => {
    const client = await connectClient(open.url);
    expect(client.getServerVersion()?.name).toBe('creative-thinking');
    expect(client.getServerCapabilities()?.tools).toBeDefined();
    const { tools } = await client.listTools();
    expect(tools.map(t => t.name).sort()).toEqual([
      'discover_techniques',
      'execute_thinking_step',
      'plan_thinking_session',
    ]);
    await client.close();
  });

  it('runs discover, plan and execute end to end, across two clients', async () => {
    const a = await connectClient(open.url);
    const b = await connectClient(open.url);

    const discovered = textJson(
      await a.callTool({ name: 'discover_techniques', arguments: { problem: PROBLEM } })
    );
    expect(Array.isArray(discovered.recommendations)).toBe(true);

    const plan = textJson(
      await a.callTool({
        name: 'plan_thinking_session',
        arguments: { problem: PROBLEM, techniques: ['six_hats'] },
      })
    );
    expect(String(plan.planId)).toMatch(/^plan_/);

    // A different client executes the plan: stateless HTTP means no call
    // depends on which connection, or which protocol server, came before.
    const stepResult = await b.callTool({
      name: 'execute_thinking_step',
      arguments: {
        planId: plan.planId,
        technique: 'six_hats',
        problem: PROBLEM,
        currentStep: 1,
        totalSteps: 6,
        output: 'Blue hat: agree the goal and the order of hats first.',
        nextStepNeeded: true,
        hatColor: 'blue',
      },
    });
    expect(stepResult.isError).not.toBe(true);
    const step = textJson(stepResult);
    expect(step.technique).toBe('six_hats');
    expect(String(step.sessionId)).toBeTruthy();

    await a.close();
    await b.close();
  });

  it('serves /health without auth', async () => {
    const res = await httpCall(new URL('/health', guarded.url));
    expect(res.status).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body).toMatchObject({ status: 'ok', name: 'creative-thinking' });
    expect(typeof body.version).toBe('string');
  });

  it('answers GET and DELETE on the MCP path with 405', async () => {
    for (const method of ['GET', 'DELETE']) {
      const res = await httpCall(open.url, { method });
      expect(res.status).toBe(405);
      expect(res.header('allow')).toBe('POST');
    }
  });

  it('returns 404 off the MCP path', async () => {
    const res = await httpCall(new URL('/mcp-not-here', open.url), {
      method: 'POST',
      headers: POST_HEADERS,
      body: INIT_BODY,
    });
    expect(res.status).toBe(404);
  });

  it('rejects a body that is not JSON', async () => {
    const res = await httpCall(open.url, { method: 'POST', headers: POST_HEADERS, body: '{oops' });
    expect(res.status).toBe(400);
    const body = res.json() as { error: { code: number } };
    expect(body.error.code).toBe(-32700);
  });

  it('rejects a body over the size limit, with or without a declared length', async () => {
    for (const chunked of [false, true]) {
      const res = await httpCall(open.url, {
        method: 'POST',
        headers: POST_HEADERS,
        body: JSON.stringify({ pad: 'x'.repeat(70 * 1024) }),
        chunked,
      });
      expect(res.status).toBe(413);
    }
  });

  it('refuses a non-loopback Host header while bound to loopback (DNS rebinding)', async () => {
    const res = await httpCall(open.url, {
      method: 'POST',
      headers: { ...POST_HEADERS, Host: 'evil.example:80' },
      body: INIT_BODY,
    });
    expect(res.status).toBe(403);
  });

  it('requires the bearer token when one is set', async () => {
    const none = await httpCall(guarded.url, {
      method: 'POST',
      headers: POST_HEADERS,
      body: INIT_BODY,
    });
    expect(none.status).toBe(401);
    expect(none.header('www-authenticate')).toBe('Bearer');

    const wrong = await httpCall(guarded.url, {
      method: 'POST',
      headers: { ...POST_HEADERS, Authorization: 'Bearer nope' },
      body: INIT_BODY,
    });
    expect(wrong.status).toBe(401);

    const client = await connectClient(guarded.url, { Authorization: 'bearer  test-token ' });
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(3);
    await client.close();
  });
});

describe('transport configuration', () => {
  it('reads a bearer token in linear time', () => {
    expect(bearerToken('Bearer abc')).toBe('abc');
    expect(bearerToken('bearer   abc  ')).toBe('abc');
    expect(bearerToken('Basic abc')).toBeUndefined();
    expect(bearerToken('Bearer    ')).toBeUndefined();
    expect(bearerToken(undefined)).toBeUndefined();
    // A regex like /^Bearer\s+(.+)$/ backtracks quadratically here (CodeQL
    // js/polynomial-redos): over a second at this length.
    const started = Date.now();
    expect(bearerToken(`Bearer ${' '.repeat(50_000)}\n`)).toBeUndefined();
    expect(Date.now() - started).toBeLessThan(200);
  });

  it('defaults to stdio', () => {
    expect(resolveTransportMode([], {})).toBe('stdio');
    expect(resolveTransportMode([], { MCP_TRANSPORT: '' })).toBe('stdio');
  });

  it('takes the flag over the environment', () => {
    expect(resolveTransportMode(['--transport', 'http'], {})).toBe('http');
    expect(resolveTransportMode(['--transport=http'], { MCP_TRANSPORT: 'stdio' })).toBe('http');
    expect(resolveTransportMode(['--transport', 'stdio'], { MCP_TRANSPORT: 'http' })).toBe('stdio');
    expect(resolveTransportMode([], { MCP_TRANSPORT: 'HTTP' })).toBe('http');
  });

  it('rejects unknown or missing values', () => {
    expect(() => resolveTransportMode(['--transport', 'sse'], {})).toThrow(/Unknown transport/);
    expect(() => resolveTransportMode(['--transport'], {})).toThrow(/needs a value/);
  });

  it('reads HTTP options with safe defaults', () => {
    expect(resolveHttpOptions({})).toEqual({
      host: '127.0.0.1',
      port: 8080,
      mcpPath: '/mcp',
      maxBodyBytes: 1024 * 1024,
    });
    expect(
      resolveHttpOptions({
        HOST: '0.0.0.0',
        PORT: '9000',
        MCP_HTTP_PATH: '/x',
        MCP_HTTP_AUTH_TOKEN: 't',
      })
    ).toMatchObject({ host: '0.0.0.0', port: 9000, mcpPath: '/x', authToken: 't' });
  });

  it('rejects unusable HTTP options', () => {
    expect(() => resolveHttpOptions({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => resolveHttpOptions({ PORT: '70000' })).toThrow(/PORT/);
    expect(() => resolveHttpOptions({ MCP_HTTP_PATH: 'mcp' })).toThrow(/MCP_HTTP_PATH/);
    expect(() => resolveHttpOptions({ MCP_HTTP_PATH: '/health' })).toThrow(/MCP_HTTP_PATH/);
    expect(() => resolveHttpOptions({ MCP_HTTP_MAX_BODY_BYTES: '0' })).toThrow(/MAX_BODY/);
  });
});

describe('HTTP transport (built binary)', () => {
  let child: ChildProcess;
  let url: string;

  beforeAll(async () => {
    child = spawn('node', [SERVER_MAIN, '--transport', 'http'], {
      env: { ...process.env, PORT: '0', HOST: '127.0.0.1', DISABLE_THOUGHT_LOGGING: 'true' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    url = await new Promise<string>((resolve, reject) => {
      let stderr = '';
      const timer = setTimeout(() => reject(new Error(`no listen line:\n${stderr}`)), 8000);
      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
        const match = /listening on (http:\/\/\S+)/.exec(stderr);
        if (match) {
          clearTimeout(timer);
          resolve(match[1]);
        }
      });
      child.on('exit', code => reject(new Error(`exited ${code}:\n${stderr}`)));
    });
  }, 10000);

  afterAll(() => {
    if (child.exitCode === null) child.kill('SIGKILL');
  });

  it('serves MCP and health, then shuts down cleanly on SIGTERM', async () => {
    const health = await httpCall(new URL('/health', url));
    expect(health.status).toBe(200);

    const client = await connectClient(url);
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(3);
    await client.close();

    const exitCode = await new Promise<number | null>(resolve => {
      child.once('exit', code => resolve(code));
      child.kill('SIGTERM');
    });
    expect(exitCode).toBe(0);
  });

  it('exits non-zero on an unknown transport', async () => {
    const bad = spawn('node', [SERVER_MAIN, '--transport', 'carrier-pigeon'], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    bad.stderr?.on('data', (c: Buffer) => (stderr += c.toString()));
    const code = await new Promise<number | null>(resolve => bad.once('exit', resolve));
    expect(code).toBe(1);
    expect(stderr).toMatch(/Unknown transport "carrier-pigeon"/);
  });
});
