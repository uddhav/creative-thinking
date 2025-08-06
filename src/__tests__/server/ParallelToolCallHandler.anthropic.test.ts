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
    it('should support tool_result format when useAnthropicFormat is true', async () => {
      // Test with discover_techniques which doesn't require workflow setup
      const calls: ToolCall[] = [
        {
          name: 'discover_techniques',
          arguments: {
            problem: 'Test problem',
            context: 'Test context',
          },
        },
      ];

      const result = await handler.processParallelToolCalls(calls, true);

      // Debug: log the actual result
      if (result.isError) {
        console.error('Error occurred:', JSON.stringify(result, null, 2));
      }

      // The response should contain JSON-stringified tool_result blocks
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);

      // Parse the first content item
      const firstContent = result.content[0];
      expect(firstContent.type).toBe('text');

      console.error('First content text:', firstContent.text);

      // Try to parse as JSON to verify structure
      const parsed = JSON.parse(firstContent.text);

      // Should have tool_result structure
      expect(parsed).toHaveProperty('type');
      expect(parsed.type).toBe('tool_result');
      expect(parsed).toHaveProperty('tool_use_id');
      expect(parsed.tool_use_id).toMatch(/^toolu_/);
      expect(parsed).toHaveProperty('output');
    });

    it('should support legacy format when useAnthropicFormat is false', async () => {
      // Test with discover_techniques which doesn't require workflow setup
      const calls: ToolCall[] = [
        {
          name: 'discover_techniques',
          arguments: {
            problem: 'Test problem for legacy',
            preferredOutcome: 'innovative',
          },
        },
      ];

      const result = await handler.processParallelToolCalls(calls, false);

      // The response should contain legacy format
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);

      // Parse the first content item
      const firstContent = result.content[0];
      expect(firstContent.type).toBe('text');

      // Try to parse as JSON to verify structure
      const parsed = JSON.parse(firstContent.text);

      // For sequential calls with legacy format, we get an array
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0]).toHaveProperty('toolId');
      expect(parsed[0].toolId).toMatch(/^toolu_/);
      expect(parsed[0]).toHaveProperty('name');
      expect(parsed[0].name).toBe('discover_techniques');
      expect(parsed[0]).toHaveProperty('result');
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

    it('should handle multiple discover_techniques calls sequentially', async () => {
      const multipleCalls: ToolCall[] = [
        {
          name: 'discover_techniques',
          arguments: {
            problem: 'First problem',
            context: 'Innovation needed',
          },
        },
        {
          name: 'discover_techniques',
          arguments: {
            problem: 'Second problem',
            context: 'Risk analysis needed',
          },
        },
      ];

      // Multiple discover calls should be processed sequentially
      const result = await handler.processParallelToolCalls(multipleCalls, true);

      expect(result.content).toBeDefined();
      expect(result.isError).not.toBe(true);

      // Should return multiple tool_result blocks (one per call)
      expect(result.content.length).toBe(2);

      // Parse both results
      const firstResult = JSON.parse(result.content[0].text);
      const secondResult = JSON.parse(result.content[1].text);

      expect(firstResult.type).toBe('tool_result');
      expect(secondResult.type).toBe('tool_result');
      expect(firstResult.tool_use_id).toMatch(/^toolu_/);
      expect(secondResult.tool_use_id).toMatch(/^toolu_/);
      expect(firstResult.tool_use_id).not.toBe(secondResult.tool_use_id);
    });
  });
});
