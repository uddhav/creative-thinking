/**
 * RequestInterceptor - Intercepts and validates JSON-RPC requests before MCP SDK processing
 *
 * This interceptor handles cases where the MCP SDK's schema validation would silently
 * reject requests, causing connection termination without proper error messages.
 * Specifically handles array-formatted tool calls which violate MCP protocol.
 */

import type { Readable } from 'stream';
import { Transform } from 'stream';

/**
 * JSON-RPC 2.0 Request structure
 */
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: unknown;
}

/**
 * JSON-RPC 2.0 Error Response
 */
interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * Creates a transform stream that intercepts and validates JSON-RPC requests
 * before they reach the MCP SDK's schema validation.
 */
export class RequestInterceptor extends Transform {
  private buffer = '';

  constructor() {
    super();
  }

  /**
   * Process incoming data chunks
   */
  _transform(chunk: Buffer, _encoding: string, callback: () => void): void {
    this.buffer += chunk.toString();

    // Process complete lines
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        this.processRequest(line);
      }
    }

    callback();
  }

  /**
   * Process a single JSON-RPC request
   */
  private processRequest(line: string): void {
    try {
      const request = JSON.parse(line) as JsonRpcRequest;

      // Check if this is a tools/call request with array params
      if (request.method === 'tools/call' && Array.isArray(request.params)) {
        // Log the violation
        console.error('[RequestInterceptor] Array format detected in tools/call request');
        console.error('[RequestInterceptor] Array length:', request.params.length);
        console.error(
          '[RequestInterceptor] First item:',
          request.params[0] ? JSON.stringify(request.params[0]).substring(0, 200) : 'empty'
        );

        // Send error response directly to stdout
        const errorResponse: JsonRpcErrorResponse = {
          jsonrpc: '2.0',
          id: request.id ?? null,
          error: {
            code: -32602, // Invalid params per JSON-RPC spec
            message: 'MCP protocol violation: Array format not supported',
            data: {
              error:
                'The MCP protocol expects single tool calls with {name: string, arguments: object} format.',
              received: 'Array of tool calls',
              solution: 'Send individual tool call requests sequentially instead of arrays.',
              note: 'Parallel execution should be handled by making concurrent requests, not by sending arrays.',
            },
          },
        };

        // Write error response to stdout (bypassing the SDK)
        // eslint-disable-next-line no-restricted-syntax -- Must write JSON-RPC error to stdout
        process.stdout.write(JSON.stringify(errorResponse) + '\n');

        // Log to stderr for visibility
        console.error(
          '\n⚠️  PROTOCOL VIOLATION INTERCEPTED\n' +
            '='.repeat(50) +
            '\n' +
            'MCP protocol expects single tool calls.\n' +
            'Received array format which is not supported.\n' +
            'Returned error response to client.\n' +
            '='.repeat(50) +
            '\n'
        );

        // Don't forward this request to the SDK
        return;
      }

      // Forward valid requests to the SDK
      this.push(line + '\n');
    } catch {
      // If JSON parsing fails or other errors, forward as-is
      // Let the SDK handle malformed JSON
      this.push(line + '\n');
    }
  }

  /**
   * Handle any remaining data when stream ends
   */
  _flush(callback: () => void): void {
    if (this.buffer.trim()) {
      this.processRequest(this.buffer);
    }
    callback();
  }
}

/**
 * Creates an intercepted stdin stream for the MCP server
 */
export function createInterceptedStdin(): Readable {
  const interceptor = new RequestInterceptor();

  // Pipe stdin through the interceptor
  process.stdin.pipe(interceptor);

  // Return the interceptor as the new stdin for the server
  return interceptor;
}
