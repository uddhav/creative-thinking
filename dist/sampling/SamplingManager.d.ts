/**
 * SamplingManager
 * Manages MCP Sampling requests to client for LLM completions
 */
import type { SamplingRequest, SamplingResult, SamplingError, SamplingCapability, SamplingStats } from './types.js';
export declare class SamplingManager {
    private pendingRequests;
    private capability;
    private stats;
    private requestTimes;
    private readonly DEFAULT_TIMEOUT;
    private readonly MAX_RETRIES;
    private readonly RETRY_DELAY;
    /**
     * Set the sampling capability from client
     */
    setCapability(capability: SamplingCapability): void;
    /**
     * Check if sampling is available
     */
    isAvailable(): boolean;
    /**
     * Request sampling from client
     */
    requestSampling(request: SamplingRequest, feature?: string, retryCount?: number): Promise<SamplingResult>;
    /**
     * Handle sampling response from client
     */
    handleSamplingResponse(requestId: string, result: SamplingResult | SamplingError): void;
    /**
     * Validate sampling request
     */
    private validateRequest;
    /**
     * Create a pending request
     */
    private createPendingRequest;
    /**
     * Send sampling request via transport
     */
    private sendSamplingRequest;
    /**
     * Wait for response with timeout
     */
    private waitForResponse;
    /**
     * Clean up pending request
     */
    private cleanupPendingRequest;
    /**
     * Update success statistics
     */
    private updateSuccessStats;
    /**
     * Extract SamplingError from unknown error
     */
    private extractSamplingError;
    /**
     * Check if request should be retried
     */
    private shouldRetry;
    /**
     * Create sampling error
     */
    private createError;
    /**
     * Delay helper for retries
     */
    private delay;
    /**
     * Get sampling statistics
     */
    getStats(): SamplingStats;
    /**
     * Reset statistics
     */
    resetStats(): void;
    /**
     * Check rate limits
     */
    checkRateLimits(): boolean;
    /**
     * Clean up manager
     */
    destroy(): void;
}
//# sourceMappingURL=SamplingManager.d.ts.map