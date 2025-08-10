/**
 * SamplingHandler
 * Handles MCP Sampling integration with the server
 */
import { SamplingManager } from '../sampling/SamplingManager.js';
export class SamplingHandler {
    samplingManager;
    constructor() {
        this.samplingManager = new SamplingManager();
    }
    /**
     * Get the sampling manager instance
     */
    getSamplingManager() {
        return this.samplingManager;
    }
    /**
     * Handle capability notification from client
     * Called when client sends its sampling capabilities
     */
    handleCapabilityNotification(capability) {
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
    createSamplingRequest(request, feature) {
        // Get the pending request that SamplingManager creates
        const requestPromise = this.samplingManager.requestSampling(request, feature);
        // Get the request payload that was stored
        const global = globalThis;
        const samplingPayload = global.__pendingSamplingRequest;
        if (!samplingPayload) {
            throw new Error('Failed to create sampling request');
        }
        // Clear the global storage
        delete global.__pendingSamplingRequest;
        // Store the promise for later resolution
        const requestId = samplingPayload.id;
        if (!global.__pendingSamplingPromises) {
            global.__pendingSamplingPromises = {};
        }
        global.__pendingSamplingPromises[requestId] = requestPromise;
        return {
            requestId,
            request: samplingPayload,
        };
    }
    /**
     * Handle sampling response from client
     * Called when client sends back the LLM response
     */
    handleSamplingResponse(requestId, response) {
        console.error('[SamplingHandler] Received sampling response for request:', requestId);
        // Forward to SamplingManager
        this.samplingManager.handleSamplingResponse(requestId, response);
        // Clean up stored promise
        const global = globalThis;
        if (global.__pendingSamplingPromises) {
            delete global.__pendingSamplingPromises[requestId];
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
    isAvailable() {
        return this.samplingManager.isAvailable();
    }
    /**
     * Clean up resources
     */
    destroy() {
        this.samplingManager.destroy();
        // Clean up any stored promises
        const global = globalThis;
        if (global.__pendingSamplingPromises) {
            for (const requestId in global.__pendingSamplingPromises) {
                delete global.__pendingSamplingPromises[requestId];
            }
        }
    }
}
//# sourceMappingURL=SamplingHandler.js.map