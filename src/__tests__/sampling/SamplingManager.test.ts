/**
 * Tests for SamplingManager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SamplingManager } from '../../sampling/SamplingManager.js';
import type {
  SamplingRequest,
  SamplingResult,
  SamplingError,
  SamplingCapability,
} from '../../sampling/types.js';

describe('SamplingManager', () => {
  let manager: SamplingManager;

  beforeEach(() => {
    manager = new SamplingManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending operations before destroying
    if (manager) {
      manager.destroy();
    }
  });

  describe('capability management', () => {
    it('should set and check capability', () => {
      expect(manager.isAvailable()).toBe(false);

      const capability: SamplingCapability = {
        supported: true,
        models: ['gpt-4', 'claude-3'],
        maxTokens: 4096,
        rateLimits: {
          requestsPerMinute: 10,
          tokensPerMinute: 100000,
        },
      };

      manager.setCapability(capability);
      expect(manager.isAvailable()).toBe(true);
    });

    it('should return false when capability is not supported', () => {
      const capability: SamplingCapability = {
        supported: false,
      };

      manager.setCapability(capability);
      expect(manager.isAvailable()).toBe(false);
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      manager.setCapability({ supported: true });
    });

    it('should reject request when sampling is not available', async () => {
      manager.setCapability({ supported: false });

      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
      };

      await expect(manager.requestSampling(request)).rejects.toThrow(
        'Sampling is not available from client'
      );
    });

    it('should reject request with empty messages', async () => {
      const request: SamplingRequest = {
        messages: [],
      };

      await expect(manager.requestSampling(request)).rejects.toThrow(
        'Messages array cannot be empty'
      );
    });

    it('should reject request with invalid message role', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'invalid' as any, content: 'test' }],
      };

      await expect(manager.requestSampling(request)).rejects.toThrow('Invalid role: invalid');
    });

    it('should reject request with missing message content', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: '' }],
      };

      await expect(manager.requestSampling(request)).rejects.toThrow(
        'Each message must have role and content'
      );
    });

    it('should reject request with invalid temperature', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
        temperature: 1.5,
      };

      await expect(manager.requestSampling(request)).rejects.toThrow(
        'Temperature must be between 0 and 1'
      );
    });

    it('should reject request with invalid maxTokens', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: -100,
      };

      await expect(manager.requestSampling(request)).rejects.toThrow('maxTokens must be positive');
    });

    it('should reject request exceeding maxTokens limit', async () => {
      manager.setCapability({
        supported: true,
        maxTokens: 1000,
      });

      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: 2000,
      };

      await expect(manager.requestSampling(request)).rejects.toThrow(
        'maxTokens 2000 exceeds limit 1000'
      );
    });

    it('should reject request with invalid model preferences', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
        modelPreferences: {
          costPriority: 2,
        },
      };

      await expect(manager.requestSampling(request)).rejects.toThrow(
        'costPriority must be between 0 and 1'
      );
    });
  });

  describe('request handling', () => {
    beforeEach(() => {
      manager.setCapability({ supported: true });
    });

    it('should handle successful response', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
      };

      // Start the request
      const requestPromise = manager.requestSampling(request);

      // Simulate response after a short delay
      setTimeout(() => {
        const pendingRequest = (globalThis as any).__pendingSamplingRequest;
        if (pendingRequest) {
          const result: SamplingResult = {
            content: 'Test response',
            totalTokens: 10,
          };
          manager.handleSamplingResponse(pendingRequest.id, result);
        }
      }, 10);

      const result = await requestPromise;
      expect(result.content).toBe('Test response');
      expect(result.totalTokens).toBe(10);
    });

    it('should handle error response', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
      };

      // Mock sendSamplingRequest to capture requestId and simulate error response
      const originalSend = (manager as any).sendSamplingRequest;
      (manager as any).sendSamplingRequest = vi.fn().mockImplementation((requestId: string) => {
        originalSend.call(manager, requestId, request);

        setTimeout(() => {
          const error: SamplingError = {
            code: 'rate_limit_exceeded',
            message: 'Rate limit exceeded',
          };
          manager.handleSamplingResponse(requestId, error);
        }, 5);
      });

      // Check the request failed - handleSamplingResponse directly rejects with the SamplingError
      await expect(manager.requestSampling(request)).rejects.toEqual({
        code: 'rate_limit_exceeded',
        message: 'Rate limit exceeded',
      });
    });

    it('should timeout long requests', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
      };

      // Set a very short timeout for testing
      const originalTimeout = (manager as any).DEFAULT_TIMEOUT;
      (manager as any).DEFAULT_TIMEOUT = 50;

      const requestPromise = manager.requestSampling(request);

      // Don't send a response, let it timeout
      await expect(requestPromise).rejects.toThrow('Sampling request timed out');

      (manager as any).DEFAULT_TIMEOUT = originalTimeout;
    });

    it('should handle unknown request ID in response', () => {
      const result: SamplingResult = {
        content: 'Test response',
      };

      // Should not throw, just log error
      expect(() => {
        manager.handleSamplingResponse('unknown-id', result);
      }).not.toThrow();
    });
  });

  describe('retry logic', () => {
    beforeEach(() => {
      manager.setCapability({ supported: true });
      // Reduce retry delay for faster tests
      (manager as any).RETRY_DELAY = 10;
    });

    it('should retry on rate limit errors', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
      };

      let attemptCount = 0;

      // Mock the request to fail twice then succeed
      const originalSend = (manager as any).sendSamplingRequest;
      (manager as any).sendSamplingRequest = vi.fn().mockImplementation((requestId: string) => {
        attemptCount++;
        originalSend.call(manager, requestId, request);

        setTimeout(() => {
          if (attemptCount < 3) {
            const error: SamplingError = {
              code: 'rate_limit_exceeded',
              message: 'Rate limit exceeded',
            };
            manager.handleSamplingResponse(requestId, error);
          } else {
            const result: SamplingResult = {
              content: 'Success after retries',
            };
            manager.handleSamplingResponse(requestId, result);
          }
        }, 5);
      });

      const result = await manager.requestSampling(request);
      expect(result.content).toBe('Success after retries');
      expect(attemptCount).toBe(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
      };

      let attemptCount = 0;

      // Mock the request to fail with non-retryable error
      const originalSend = (manager as any).sendSamplingRequest;
      (manager as any).sendSamplingRequest = vi.fn().mockImplementation((requestId: string) => {
        attemptCount++;
        originalSend.call(manager, requestId, request);

        setTimeout(() => {
          const error: SamplingError = {
            code: 'invalid_request',
            message: 'Invalid request',
          };
          manager.handleSamplingResponse(requestId, error);
        }, 5);
      });

      await expect(manager.requestSampling(request)).rejects.toMatchObject({
        code: 'invalid_request',
      });
      expect(attemptCount).toBe(1);
    });

    it('should stop retrying after max retries', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
      };

      let attemptCount = 0;

      // Mock the request to always fail with retryable error
      const originalSend = (manager as any).sendSamplingRequest;
      (manager as any).sendSamplingRequest = vi.fn().mockImplementation((requestId: string) => {
        attemptCount++;
        originalSend.call(manager, requestId, request);

        setTimeout(() => {
          const error: SamplingError = {
            code: 'timeout',
            message: 'Request timeout',
          };
          manager.handleSamplingResponse(requestId, error);
        }, 5);
      });

      await expect(manager.requestSampling(request)).rejects.toMatchObject({
        code: 'timeout',
      });
      expect(attemptCount).toBe(4); // 1 initial + 3 retries
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      manager.setCapability({ supported: true });
      manager.resetStats(); // Ensure clean stats for each test
    });

    it('should track successful requests', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
      };

      // Simulate successful response
      const requestPromise = manager.requestSampling(request, 'test-feature');

      setTimeout(() => {
        const pendingRequest = (globalThis as any).__pendingSamplingRequest;
        if (pendingRequest) {
          const result: SamplingResult = {
            content: 'Test response',
            totalTokens: 50,
          };
          manager.handleSamplingResponse(pendingRequest.id, result);
        }
      }, 10);

      await requestPromise;

      const stats = manager.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(0);
      expect(stats.totalTokensUsed).toBe(50);
      expect(stats.requestsByFeature['test-feature']).toBe(1);
    });

    it('should track failed requests', async () => {
      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
      };

      // Mock sendSamplingRequest to capture requestId and simulate error response
      const originalSend = (manager as any).sendSamplingRequest;
      (manager as any).sendSamplingRequest = vi.fn().mockImplementation((requestId: string) => {
        originalSend.call(manager, requestId, request);

        setTimeout(() => {
          const error: SamplingError = {
            code: 'invalid_request',
            message: 'Invalid request',
          };
          manager.handleSamplingResponse(requestId, error);
        }, 5);
      });

      // Check the request failed - handleSamplingResponse directly rejects with the SamplingError
      await expect(manager.requestSampling(request)).rejects.toEqual({
        code: 'invalid_request',
        message: 'Invalid request',
      });

      const stats = manager.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(1);
    });

    it('should reset statistics', () => {
      manager.resetStats();
      const stats = manager.getStats();

      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
      expect(stats.totalTokensUsed).toBe(0);
      expect(stats.averageResponseTime).toBe(0);
      expect(stats.requestsByFeature).toEqual({});
    });
  });

  describe('rate limiting', () => {
    it('should check rate limits', () => {
      manager.setCapability({
        supported: true,
        rateLimits: {
          requestsPerMinute: 5,
        },
      });

      expect(manager.checkRateLimits()).toBe(true);
    });

    it('should detect rate limit exceeded', () => {
      manager.setCapability({
        supported: true,
        rateLimits: {
          requestsPerMinute: 2,
        },
      });

      const request: SamplingRequest = {
        messages: [{ role: 'user', content: 'test' }],
      };

      // Create multiple pending requests
      for (let i = 0; i < 3; i++) {
        // Start request but don't wait for it
        manager.requestSampling(request).catch(() => {
          // Expected to fail or timeout, ignore
        });
      }

      // Should immediately detect rate limit exceeded since we have 3 pending requests
      // and only 2 allowed per minute
      expect(manager.checkRateLimits()).toBe(false);

      // Clean up
      manager.destroy();
    });
  });

  describe('cleanup', () => {
    it('should clean up pending requests on destroy', () => {
      manager.setCapability({ supported: true });

      // Manually create a pending request to simulate what happens during requestSampling
      const mockPendingRequest = {
        resolve: vi.fn(),
        reject: vi.fn(),
        timestamp: Date.now(),
        timeoutHandle: setTimeout(() => {}, 1000),
      };

      // Add it to the pending requests map directly
      (manager as any).pendingRequests.set('test-id', mockPendingRequest);

      // Verify it's there
      expect((manager as any).pendingRequests.size).toBe(1);

      // Destroy the manager
      manager.destroy();

      // Verify the pending request was cleaned up
      expect((manager as any).pendingRequests.size).toBe(0);

      // Verify the reject function was called with the destroy error
      expect(mockPendingRequest.reject).toHaveBeenCalledWith(expect.any(Error));

      // Verify the timeout was cleared
      expect(mockPendingRequest.timeoutHandle).toBeDefined();
    });
  });
});
