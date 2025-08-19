import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionAdapter } from '../../../adapters/SessionAdapter';
import { VALID_TECHNIQUES } from '../../../constants/techniques';

// Mock the crypto module
let uuidCounter = 0;
let bytesCounter = 0;
vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => `test-uuid-${++uuidCounter}`),
  randomBytes: vi.fn(() => Buffer.from(`test${++bytesCounter}234`)),
}));

// Mock KV namespace
const mockKV = {
  put: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};

describe('SessionAdapter', () => {
  let adapter: SessionAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new SessionAdapter(mockKV as any);
  });

  describe('createSession', () => {
    it('should create a new session with a secure ID', async () => {
      const problem = 'test';
      const session = await adapter.createSession(problem);

      expect(session.id).toMatch(/^session_[a-z0-9]+_[A-Za-z0-9_-]+$/);
      expect(mockKV.put).toHaveBeenCalledWith(
        expect.stringMatching(/^session:/),
        expect.any(String),
        expect.objectContaining({
          expirationTtl: 86400 * 7, // 7 days
        })
      );
    });

    it('should generate unique session IDs', async () => {
      const problem = 'test';
      const session1 = await adapter.createSession(problem);
      const session2 = await adapter.createSession(problem);

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('createPlan', () => {
    it('should create a plan with valid techniques', async () => {
      const problem = 'Test problem';
      const techniques = ['six_hats', 'scamper'];

      const planId = await adapter.createPlan(problem, techniques);

      expect(planId).toMatch(/^plan_[a-z0-9]+_[A-Za-z0-9_-]+$/);
      expect(mockKV.put).toHaveBeenCalledWith(
        expect.stringMatching(/^plan:/),
        expect.stringContaining(problem),
        expect.objectContaining({
          expirationTtl: 86400,
        })
      );
    });

    it('should reject invalid techniques', async () => {
      const problem = 'Test problem';
      const techniques = ['six_hats', 'invalid_technique'];

      await expect(adapter.createPlan(problem, techniques)).rejects.toThrow(
        'Invalid techniques: invalid_technique'
      );
      expect(mockKV.put).not.toHaveBeenCalled();
    });

    it('should validate all techniques before creating plan', async () => {
      const problem = 'Test problem';
      const techniques = ['invalid1', 'invalid2'];

      await expect(adapter.createPlan(problem, techniques)).rejects.toThrow(
        'Invalid techniques: invalid1, invalid2'
      );
      expect(mockKV.put).not.toHaveBeenCalled();
    });

    it('should generate correct steps for techniques', async () => {
      const problem = 'Test problem';
      const techniques = ['po', 'random_entry']; // 4 + 3 = 7 steps

      await adapter.createPlan(problem, techniques);

      const callArgs = mockKV.put.mock.calls[0];
      const planData = JSON.parse(callArgs[1]);

      expect(planData.steps).toHaveLength(7);
      expect(planData.steps[0]).toMatchObject({
        stepNumber: 1,
        technique: 'po',
        techniqueStep: 1,
        totalTechniqueSteps: 4,
      });
      expect(planData.steps[4]).toMatchObject({
        stepNumber: 5,
        technique: 'random_entry',
        techniqueStep: 1,
        totalTechniqueSteps: 3,
      });
    });
  });

  describe('getSession', () => {
    it('should retrieve session from KV', async () => {
      const mockSession = { id: 'session_123', data: 'test' };
      mockKV.get.mockResolvedValue(mockSession);

      const result = await adapter.getSession('session_123');

      expect(result).toEqual(mockSession);
      expect(mockKV.get).toHaveBeenCalledWith('session:session_123', { type: 'json' });
    });

    it('should return null for non-existent session', async () => {
      mockKV.get.mockResolvedValue(null);

      const result = await adapter.getSession('non_existent');

      expect(result).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session with history entry', async () => {
      const sessionId = 'session_123';
      const historyEntry = { step: 1, output: 'test output' };

      // Mock existing session
      mockKV.get.mockResolvedValue({
        id: sessionId,
        history: [],
      });

      await adapter.addToHistory(sessionId, historyEntry);

      expect(mockKV.put).toHaveBeenCalledWith(
        `session:${sessionId}`,
        expect.stringContaining('test output'),
        expect.objectContaining({
          expirationTtl: 86400 * 7, // 7 days
        })
      );
    });
  });

  describe('generatePlanId', () => {
    it('should use crypto.randomUUID for secure random generation', async () => {
      const crypto = await import('node:crypto');

      await adapter.createPlan('test', ['six_hats']);

      expect(crypto.randomUUID).toHaveBeenCalled();
    });

    it('should not use Math.random', async () => {
      const spy = vi.spyOn(Math, 'random');

      await adapter.createPlan('test', ['six_hats']);

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('technique validation', () => {
    it('should accept all valid techniques', async () => {
      for (const technique of VALID_TECHNIQUES) {
        await expect(adapter.createPlan('test', [technique])).resolves.toMatch(/^plan_/);
      }
    });

    it('should provide helpful error message with valid techniques list', async () => {
      try {
        await adapter.createPlan('test', ['invalid']);
      } catch (error: any) {
        expect(error.message).toContain('Invalid techniques: invalid');
      }
    });
  });
});
