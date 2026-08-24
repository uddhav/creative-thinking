/**
 * Minimal MCP stdio client for the replay harness.
 *
 * Deliberately NOT the test suite's MCPClientTestHelper: that helper throws on
 * error-shaped responses, which is right for tests and wrong for replay — a
 * recorded refusal must replay as a refusal and be captured verbatim. This
 * client returns every response, error-shaped or not, exactly as received.
 *
 * Plain .mjs on purpose: tsconfig excludes __tests__ from dist/, so the test
 * helper never ships in a build; this file needs no build at all.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class ReplayClient {
  constructor({ serverPath, env = {} }) {
    this.serverPath = serverPath;
    this.env = env;
    this.client = new Client({ name: 'replay-harness', version: '1.0.0' });
    this.client.onerror = () => {}; // errors are data here, not failures
  }

  async connect() {
    this.transport = new StdioClientTransport({
      command: 'node',
      args: [this.serverPath],
      env: {
        ...process.env,
        ...this.env,
        DISABLE_THOUGHT_LOGGING: 'true',
      },
      stderr: 'ignore',
    });
    await this.client.connect(this.transport);
  }

  /** Returns { rawText, parsed, isError } without ever throwing on tool errors. */
  async call(name, args) {
    let result;
    try {
      result = await this.client.callTool({ name, arguments: args });
    } catch (err) {
      // Protocol-level rejection (e.g. schema validation before dispatch).
      return { rawText: String(err?.message ?? err), parsed: null, isError: true };
    }
    const content = result.content?.[0];
    const rawText = content?.type === 'text' ? content.text : JSON.stringify(result);
    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Non-JSON text stays raw; parsed remains null.
    }
    const isError = Boolean(result.isError) || Boolean(parsed?.error);
    return { rawText, parsed, isError };
  }

  async close() {
    if (this.transport) await this.transport.close();
  }
}
