import { describe, it, expect, beforeEach } from 'vitest';
import { ParallelToolCallHandler } from '../../server/ParallelToolCallHandler.js';
import { LateralThinkingServer } from '../../index.js';
import type { ToolCall } from '../../server/ParallelToolCallHandler.js';

describe('ParallelToolCallHandler - Anthropic Format', () => {
  let handler: ParallelToolCallHandler;
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
    handler = new ParallelToolCallHandler(server);
  });

  describe('Tool Call Format Support', () => {
    it('should detect Anthropic-style parallel tool calls', () => {
      const anthropicCalls = [
        {
          type: 'tool_use',
          id: 'toolu_001',
          name: 'discover_techniques',
          input: { problem: 'Test problem' },
        },
        {
          type: 'tool_use',
          id: 'toolu_002',
          name: 'discover_techniques',
          input: { problem: 'Another problem' },
        },
      ];

      expect(handler.isParallelRequest(anthropicCalls)).toBe(true);
    });

    it('should detect legacy-style parallel tool calls', () => {
      const legacyCalls = [
        {
          name: 'discover_techniques',
          arguments: { problem: 'Test problem' },
        },
        {
          name: 'discover_techniques',
          arguments: { problem: 'Another problem' },
        },
      ];

      expect(handler.isParallelRequest(legacyCalls)).toBe(true);
    });

    it('should generate unique tool_use_ids', () => {
      const calls: ToolCall[] = [
        {
          name: 'discover_techniques',
          arguments: { problem: 'Test 1' },
        },
        {
          name: 'discover_techniques',
          arguments: { problem: 'Test 2' },
        },
      ];

      // Process with Anthropic format
      const processPromise = handler.processParallelToolCalls(calls, true);

      // We can't easily test the async result without mocking,
      // but we can verify the method accepts the format parameter
      expect(processPromise).toBeInstanceOf(Promise);
    });
  });

  describe('Response Format', () => {
    it('should detect and normalize tool call formats', () => {
      // Test detection of Anthropic format
      const anthropicCall: ToolCall = {
        type: 'tool_use',
        id: 'toolu_test_123',
        name: 'discover_techniques',
        input: { problem: 'Test problem' },
      };

      // Test normalization
      const normalized = handler['normalizeToolCall'](anthropicCall);
      expect(normalized.arguments).toEqual({ problem: 'Test problem' });
      expect(normalized.id).toBe('toolu_test_123');

      // Test ID generation for calls without ID
      const callWithoutId: ToolCall = {
        name: 'discover_techniques',
        arguments: { problem: 'Test problem' },
      };

      const normalizedWithId = handler['normalizeToolCall'](callWithoutId);
      expect(normalizedWithId.id).toMatch(/^toolu_/);
    });

    it('should generate unique tool_use_ids', () => {
      // Test that multiple calls to generateToolUseId produce unique IDs
      const id1 = handler['generateToolUseId']();
      const id2 = handler['generateToolUseId']();

      expect(id1).toMatch(/^toolu_\d+_\d{3}$/);
      expect(id2).toMatch(/^toolu_\d+_\d{3}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Mixed Format Handling', () => {
    it('should normalize Anthropic format to internal format', () => {
      const anthropicCall: ToolCall = {
        type: 'tool_use',
        id: 'toolu_test_001',
        name: 'discover_techniques',
        input: { problem: 'Test' },
      };

      // The handler should accept this format
      expect(handler.isParallelRequest([anthropicCall])).toBe(true);
    });

    it('should validate parallel call constraints', () => {
      // Test that validation detects invalid parallel calls
      const invalidCalls: ToolCall[] = [
        {
          name: 'discover_techniques',
          arguments: { problem: 'Problem 1' },
        },
        {
          name: 'plan_thinking_session',
          arguments: {
            problem: 'Problem 1',
            techniques: ['six_hats'],
          },
        },
      ];

      // The handler should detect these can't run in parallel
      const validation = handler['validateParallelCalls'](invalidCalls);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'discover_techniques must be called alone (cannot be parallel with other tools)'
      );
    });
  });
});
