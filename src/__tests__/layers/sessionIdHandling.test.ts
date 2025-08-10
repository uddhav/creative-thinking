import { describe, it, expect, beforeEach } from 'vitest';
import { executeThinkingStep } from '../../layers/execution.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type { ExecuteThinkingStepInput } from '../../types/index.js';

describe('Session ID Handling', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let visualFormatter: VisualFormatter;
  let metricsCollector: MetricsCollector;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  let ergodicityManager: ErgodicityManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
    techniqueRegistry = TechniqueRegistry.getInstance();
    visualFormatter = new VisualFormatter(true); // Disable visual output
    metricsCollector = new MetricsCollector();
    complexityAnalyzer = new HybridComplexityAnalyzer();
    ergodicityManager = new ErgodicityManager();
  });

  describe('User-provided session IDs', () => {
    it('should create a new session with user-provided ID when session does not exist', async () => {
      const userSessionId = 'my-custom-session-123';
      const input: ExecuteThinkingStepInput = {
        sessionId: userSessionId,
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 7,
        output: 'Blue hat thinking...',
        nextStepNeeded: true,
      };

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // Verify response is successful
      expect(response.isError).toBeUndefined();
      const responseData = JSON.parse(response.content[0].text) as { sessionId: string };
      expect(responseData.sessionId).toBe(userSessionId);

      // Verify session was created with the provided ID
      const session = sessionManager.getSession(userSessionId);
      expect(session).toBeDefined();
      expect(session?.technique).toBe('six_hats');
    });

    it('should use existing session when user-provided ID exists', async () => {
      const userSessionId = 'existing-session';

      // First call creates the session
      const input1: ExecuteThinkingStepInput = {
        sessionId: userSessionId,
        technique: 'po',
        problem: 'Initial problem',
        currentStep: 1,
        totalSteps: 4,
        output: 'Po: Cars have square wheels',
        nextStepNeeded: true,
      };

      await executeThinkingStep(
        input1,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // Second call should use the same session
      const input2: ExecuteThinkingStepInput = {
        sessionId: userSessionId,
        technique: 'po',
        problem: 'Initial problem',
        currentStep: 2,
        totalSteps: 4,
        output: 'Movement: What if wheels adapted their shape...',
        nextStepNeeded: true,
      };

      const response2 = await executeThinkingStep(
        input2,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      const responseData = JSON.parse(response2.content[0].text) as {
        sessionId: string;
        historyLength: number;
      };
      expect(responseData.sessionId).toBe(userSessionId);
      expect(responseData.historyLength).toBe(2); // Should have 2 steps in history
    });

    it('should validate session ID format', async () => {
      const invalidSessionId = 'invalid session id with spaces!@#';
      const input: ExecuteThinkingStepInput = {
        sessionId: invalidSessionId,
        technique: 'scamper',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 8,
        output: 'Substitute...',
        nextStepNeeded: true,
      };

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // Should get an error response
      expect(response.isError).toBe(true);
      const errorData = JSON.parse(response.content[0].text) as { error: { message: string } };
      expect(errorData.error.message).toContain("Invalid input for 'sessionId'");
    });

    it('should generate session ID when not provided', async () => {
      const input: ExecuteThinkingStepInput = {
        // No sessionId provided
        technique: 'random_entry',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 3,
        output: 'Random word: elephant',
        nextStepNeeded: true,
      };

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      const responseData = JSON.parse(response.content[0].text) as { sessionId: string };

      // Should have a generated session ID
      expect(responseData.sessionId).toBeDefined();
      expect(responseData.sessionId).toMatch(/^session_[a-f0-9-]+$/);
    });

    it('should handle valid session ID formats', async () => {
      const validSessionIds = [
        'simple-session',
        'session_123',
        'user.session.456',
        'my-session_2024.01',
        'ABC123xyz',
      ];

      for (const sessionId of validSessionIds) {
        const input: ExecuteThinkingStepInput = {
          sessionId,
          technique: 'yes_and',
          problem: 'Test problem',
          currentStep: 1,
          totalSteps: 4,
          output: 'Initial idea...',
          nextStepNeeded: true,
        };

        const response = await executeThinkingStep(
          input,
          sessionManager,
          techniqueRegistry,
          visualFormatter,
          metricsCollector,
          complexityAnalyzer,
          ergodicityManager
        );

        expect(response.isError).toBeUndefined();
        const responseData = JSON.parse(response.content[0].text) as { sessionId: string };
        expect(responseData.sessionId).toBe(sessionId);
      }
    });
  });
});
