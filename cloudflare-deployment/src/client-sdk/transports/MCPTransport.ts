/**
 * MCP Transport
 *
 * Native MCP protocol transport (for direct MCP connections)
 */

import { BaseTransport } from './BaseTransport.js';
import type { ClientConfig, ClientOptions } from '../types.js';

export class MCPTransport extends BaseTransport {
  constructor(config: ClientConfig) {
    super(config as any);
  }

  /**
   * Send a request (delegates to request method)
   */
  async send(method: string, params: any): Promise<any> {
    return this.request(method, params);
  }

  /**
   * Connect via native MCP protocol
   */
  async connect(): Promise<void> {
    // This would connect directly via MCP protocol
    // Implementation depends on the specific MCP client library
    throw new Error('MCP transport not yet implemented');
  }

  /**
   * Disconnect from MCP
   */
  async disconnect(): Promise<void> {
    this.setState('disconnected');
    this.cleanup();
  }

  /**
   * Send MCP request
   */
  async request<T = any>(method: string, params?: any, options?: ClientOptions): Promise<T> {
    throw new Error('MCP transport not yet implemented');
  }
}
