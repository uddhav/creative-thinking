/**
 * SamplingHandler
 * Handles MCP Sampling integration with the server
 */
import { SamplingManager } from '../sampling/SamplingManager.js';
import type { SamplingCapability, SamplingRequest, SamplingResult, SamplingError } from '../sampling/types.js';
export declare class SamplingHandler {
    private samplingManager;
    constructor();
    /**
     * Get the sampling manager instance
     */
    getSamplingManager(): SamplingManager;
    /**
     * Handle capability notification from client
     * Called when client sends its sampling capabilities
     */
    handleCapabilityNotification(capability: SamplingCapability): void;
    /**
     * Handle sampling request creation
     * Called when a feature needs to request sampling from client
     */
    createSamplingRequest(request: SamplingRequest, feature?: string): {
        requestId: string;
        request: unknown;
    };
    /**
     * Handle sampling response from client
     * Called when client sends back the LLM response
     */
    handleSamplingResponse(requestId: string, response: SamplingResult | SamplingError): void;
    /**
     * Get sampling statistics
     */
    getStats(): import("../sampling/types.js").SamplingStats;
    /**
     * Check if sampling is available
     */
    isAvailable(): boolean;
    /**
     * Clean up resources
     */
    destroy(): void;
}
//# sourceMappingURL=SamplingHandler.d.ts.map