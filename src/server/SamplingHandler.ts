/**
 * SamplingHandler
 * Handles MCP Sampling integration with the server
 */

import { SamplingManager } from '../sampling/SamplingManager.js';
import type {
  SamplingCapability,
  SamplingRequest,
  SamplingResult,
  SamplingError,
} from '../sampling/types.js';

export class SamplingHandler {
  private samplingManager: SamplingManager;

  constructor() {
    this.samplingManager = new SamplingManager();
  }

  /**
   * Get the sampling manager instance
   */
  getSamplingManager(): SamplingManager {
    return this.samplingManager;
  }

  /**
   * Handle capability notification from client
   * Called when client sends its sampling capabilities
   */
  handleCapabilityNotification(capability: SamplingCapability): void {
    console.error('[SamplingHandler] Received capability notification:', {
      supported: capability.supported,
      models: capability.models?.length || 0,
      maxTokens: capability.maxTokens,
    });

    this.samplingManager.setCapability(capability);
  }

  /**
   * Handle sampling request creation
   * Called when a feature needs to request sampling from client
   */
  async createSamplingRequest(
    request: SamplingRequest,
    feature?: string
  ): Promise<{ requestId: string; request: unknown }> {
    // Get the pending request that SamplingManager creates
    const requestPromise = this.samplingManager.requestSampling(request, feature);

    // Get the request payload that was stored
    const samplingPayload = (globalThis as any).__pendingSamplingRequest;

    if (!samplingPayload) {
      throw new Error('Failed to create sampling request');
    }

    // Clear the global storage
    delete (globalThis as any).__pendingSamplingRequest;

    // Store the promise for later resolution
    const requestId = samplingPayload.id as string;
    (globalThis as any).__pendingSamplingPromises =
      (globalThis as any).__pendingSamplingPromises || {};
    (globalThis as any).__pendingSamplingPromises[requestId] = requestPromise;

    return {
      requestId,
      request: samplingPayload,
    };
  }

  /**
   * Handle sampling response from client
   * Called when client sends back the LLM response
   */
  handleSamplingResponse(requestId: string, response: SamplingResult | SamplingError): void {
    console.error('[SamplingHandler] Received sampling response for request:', requestId);

    // Forward to SamplingManager
    this.samplingManager.handleSamplingResponse(requestId, response);

    // Clean up stored promise
    if ((globalThis as any).__pendingSamplingPromises) {
      delete (globalThis as any).__pendingSamplingPromises[requestId];
    }
  }

  /**
   * Get sampling statistics
   */
  getStats() {
    return this.samplingManager.getStats();
  }

  /**
   * Check if sampling is available
   */
  isAvailable(): boolean {
    return this.samplingManager.isAvailable();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.samplingManager.destroy();

    // Clean up any stored promises
    if ((globalThis as any).__pendingSamplingPromises) {
      for (const requestId in (globalThis as any).__pendingSamplingPromises) {
        delete (globalThis as any).__pendingSamplingPromises[requestId];
      }
    }
  }
}
