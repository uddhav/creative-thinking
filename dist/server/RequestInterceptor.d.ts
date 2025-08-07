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
 * Creates a transform stream that intercepts and validates JSON-RPC requests
 * before they reach the MCP SDK's schema validation.
 */
export declare class RequestInterceptor extends Transform {
    private buffer;
    constructor();
    /**
     * Process incoming data chunks
     */
    _transform(chunk: Buffer, _encoding: string, callback: () => void): void;
    /**
     * Process a single JSON-RPC request
     */
    private processRequest;
    /**
     * Handle any remaining data when stream ends
     */
    _flush(callback: () => void): void;
}
/**
 * Creates an intercepted stdin stream for the MCP server
 */
export declare function createInterceptedStdin(): Readable;
//# sourceMappingURL=RequestInterceptor.d.ts.map