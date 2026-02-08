/**
 * Tests for PromptsHandler - MCP prompts functionality
 */

import { describe, it, expect } from 'vitest';
import { PromptsHandler } from '../../server/PromptsHandler.js';

describe('PromptsHandler', () => {
  describe('getPrompts', () => {
    it('should return all available prompts', () => {
      const handler = new PromptsHandler();
      const prompts = handler.getPrompts();

      expect(prompts).toHaveLength(9);

      // Check first prompt structure
      const problemDiscovery = prompts[0];
      expect(problemDiscovery.name).toBe('problem-discovery');
      expect(problemDiscovery.description).toContain(
        'Discover the best lateral thinking techniques'
      );
      expect(problemDiscovery.arguments).toHaveLength(4);

      // Check required argument
      const problemArg = problemDiscovery.arguments?.find(a => a.name === 'problem');
      expect(problemArg).toBeDefined();
      expect(problemArg?.required).toBe(true);

      // Check optional argument
      const contextArg = problemDiscovery.arguments?.find(a => a.name === 'context');
      expect(contextArg).toBeDefined();
      expect(contextArg?.required).toBe(false);
    });

    it('should include all expected prompt types', () => {
      const handler = new PromptsHandler();
      const prompts = handler.getPrompts();
      const promptNames = prompts.map(p => p.name);

      expect(promptNames).toContain('problem-discovery');
      expect(promptNames).toContain('creative-brainstorming');
      expect(promptNames).toContain('risk-analysis');
      expect(promptNames).toContain('complete-session');
      expect(promptNames).toContain('quantum-thinking');
      expect(promptNames).toContain('temporal-creativity');
      expect(promptNames).toContain('persona-thinking');
      expect(promptNames).toContain('persona-debate');
      expect(promptNames).toContain('rory-mode');
    });
  });

  describe('getPrompt', () => {
    it('should return detailed prompt data for problem-discovery', () => {
      const handler = new PromptsHandler();
      const prompt = handler.getPrompt('problem-discovery');

      expect(prompt).not.toBeNull();
      expect(prompt?.description).toBeDefined();
      expect(prompt?.messages).toHaveLength(2);

      // Check user message
      const userMessage = prompt?.messages[0];
      expect(userMessage?.role).toBe('user');
      expect(userMessage?.content.type).toBe('text');
      expect(userMessage?.content.text).toContain('{{problem}}');

      // Check assistant message
      const assistantMessage = prompt?.messages[1];
      expect(assistantMessage?.role).toBe('assistant');
      expect(assistantMessage?.content.text).toContain('analyze your problem');
    });

    it('should return detailed prompt data for risk-analysis', () => {
      const handler = new PromptsHandler();
      const prompt = handler.getPrompt('risk-analysis');

      expect(prompt).not.toBeNull();
      expect(prompt?.messages).toHaveLength(2);

      const userMessage = prompt?.messages[0];
      expect(userMessage?.content.text).toContain('{{problem}}');
      expect(userMessage?.content.text).toContain('{{solution_context}}');
    });

    it('should return null for unknown prompt', () => {
      const handler = new PromptsHandler();
      const prompt = handler.getPrompt('unknown-prompt');

      expect(prompt).toBeNull();
    });

    it('should include template variables in all prompts', () => {
      const handler = new PromptsHandler();
      const promptNames = [
        'problem-discovery',
        'creative-brainstorming',
        'risk-analysis',
        'complete-session',
        'quantum-thinking',
        'temporal-creativity',
        'persona-thinking',
        'persona-debate',
        'rory-mode',
      ];

      promptNames.forEach(name => {
        const prompt = handler.getPrompt(name);
        expect(prompt).not.toBeNull();

        // All prompts should have template variables
        const userMessage = prompt?.messages[0];
        expect(userMessage?.content.text).toMatch(/\{\{[^}]+\}\}/);
      });
    });
  });
});
