/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PostgresAdapter } from '../postgres-adapter.js';
import { PersistenceError } from '../types.js';
import type { Pool, PoolClient, QueryResult } from 'pg';

// Mock pg module
vi.mock('pg', () => {
  const createMockClient = () => ({
    query: vi.fn(),
    release: vi.fn(),
  });

  const createMockPool = () => ({
    connect: vi.fn().mockResolvedValue(createMockClient()),
    query: vi.fn(),
    end: vi.fn().mockResolvedValue(undefined),
  });

  return {
    default: {
      Pool: vi.fn().mockImplementation(createMockPool),
    },
  };
});

describe('PostgresAdapter', () => {
  let adapter: PostgresAdapter;
  let mockPool: Pool;
  let mockClient: PoolClient;

  beforeEach(() => {
    adapter = new PostgresAdapter();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    try {
      await adapter.close();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('initialize', () => {
    it('should initialize successfully with connection string', async () => {
      const connectionString = 'postgres://localhost/test';

      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString },
      });

      // Verify connection was established
      expect(adapter).toBeDefined();
    });

    it('should initialize with DATABASE_URL env var', async () => {
      process.env.DATABASE_URL = 'postgres://localhost/test';

      await adapter.initialize({
        adapter: 'postgres',
        options: {},
      });

      delete process.env.DATABASE_URL;
      expect(adapter).toBeDefined();
    });

    it('should throw error without connection string', async () => {
      await expect(
        adapter.initialize({
          adapter: 'postgres',
          options: {},
        })
      ).rejects.toThrow(PersistenceError);
    });

    it('should only initialize once', async () => {
      const connectionString = 'postgres://localhost/test';

      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString },
      });

      // Second initialization should be no-op
      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString },
      });

      expect(adapter).toBeDefined();
    });
  });

  describe('save and load', () => {
    beforeEach(async () => {
      // Initialize adapter
      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString: 'postgres://localhost/test' },
      });

      // Get mock pool instance
      mockPool = (adapter as any).pool;
    });

    it('should save session correctly', async () => {
      const sessionId = 'test-session-123';
      const testState = {
        id: sessionId,
        problem: 'How to improve team collaboration',
        technique: 'six_hats' as const,
        currentStep: 3,
        totalSteps: 6,
        history: [],
        branches: {},
        insights: ['Initial insight'],
        startTime: Date.now(),
        metrics: {
          creativityScore: 5,
          risksCaught: 2,
          antifragileFeatures: 1,
        },
        tags: ['teamwork', 'productivity'],
        name: 'Team Collaboration Session',
      };

      // Mock successful query
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as unknown as QueryResult);

      await adapter.save(sessionId, testState);

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should load session correctly', async () => {
      const sessionId = 'test-session-123';
      const testState = {
        id: sessionId,
        problem: 'How to improve team collaboration',
        technique: 'six_hats' as const,
        currentStep: 3,
        totalSteps: 6,
        history: [],
        branches: {},
        insights: ['Initial insight'],
      };

      // Mock query result
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [{ state: testState }],
        rowCount: 1,
      } as unknown as QueryResult);

      const loaded = await adapter.load(sessionId);

      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe(sessionId);
      expect(loaded?.problem).toBe(testState.problem);
      expect(loaded?.technique).toBe(testState.technique);
    });

    it('should return null for non-existent session', async () => {
      // Mock empty result
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as unknown as QueryResult);

      const loaded = await adapter.load('non-existent');

      expect(loaded).toBeNull();
    });

    it('should handle save errors', async () => {
      const sessionId = 'error-session';
      const testState = {
        id: sessionId,
        problem: 'test',
        technique: 'six_hats' as const,
        currentStep: 1,
        totalSteps: 6,
        history: [],
        branches: {},
        insights: [],
      };

      // Mock query error
      vi.mocked(mockPool.query).mockRejectedValue(new Error('Database error'));

      await expect(adapter.save(sessionId, testState)).rejects.toThrow(PersistenceError);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString: 'postgres://localhost/test' },
      });

      mockPool = (adapter as any).pool;
    });

    it('should delete session successfully', async () => {
      const sessionId = 'delete-test';

      // Mock successful deletion
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as unknown as QueryResult);

      const result = await adapter.delete(sessionId);

      expect(result).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      // Mock no rows deleted
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as unknown as QueryResult);

      const result = await adapter.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString: 'postgres://localhost/test' },
      });

      mockPool = (adapter as any).pool;
    });

    it('should return true for existing session', async () => {
      // Mock session exists
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [{ exists: true }],
        rowCount: 1,
      } as unknown as QueryResult);

      const exists = await adapter.exists('existing-session');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      // Mock session doesn't exist
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as unknown as QueryResult);

      const exists = await adapter.exists('non-existent');

      expect(exists).toBe(false);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString: 'postgres://localhost/test' },
      });

      mockPool = (adapter as any).pool;
    });

    it('should list sessions with filtering', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          name: 'Session 1',
          problem: 'Problem 1',
          technique: 'six_hats',
          status: 'completed',
          created_at: new Date(),
          updated_at: new Date(),
          completed_at: new Date(),
          steps_completed: 6,
          total_steps: 6,
          insights_count: 3,
          branches_count: 1,
          tags: ['tag1', 'tag2'],
          metrics: {},
        },
        {
          id: 'session-2',
          name: 'Session 2',
          problem: 'Problem 2',
          technique: 'scamper',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
          completed_at: null,
          steps_completed: 3,
          total_steps: 7,
          insights_count: 1,
          branches_count: 0,
          tags: ['tag2', 'tag3'],
          metrics: {},
        },
      ];

      // Mock query result
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: mockSessions,
        rowCount: mockSessions.length,
      } as unknown as QueryResult);

      const sessions = await adapter.list({ limit: 10 });

      expect(sessions).toHaveLength(2);
      expect(sessions[0].id).toBe('session-1');
    });

    it('should apply filters correctly', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as unknown as QueryResult);

      await adapter.list({
        filter: {
          technique: 'six_hats',
          status: 'completed',
          tags: ['tag1'],
        },
      });

      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString: 'postgres://localhost/test' },
      });

      mockPool = (adapter as any).pool;
    });

    it('should search by problem text', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as unknown as QueryResult);

      await adapter.search({
        problem: 'collaboration',
      });

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should search by outputs', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as unknown as QueryResult);

      await adapter.search({
        outputs: 'innovation',
      });

      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should support matchAll option', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as unknown as QueryResult);

      await adapter.search({
        problem: 'team',
        outputs: 'collaboration',
        matchAll: true,
      });

      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('batch operations', () => {
    beforeEach(async () => {
      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString: 'postgres://localhost/test' },
      });

      mockPool = (adapter as any).pool;

      // Mock client for transactions
      mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
        release: vi.fn(),
      } as unknown as PoolClient;

      vi.mocked(mockPool.connect).mockResolvedValue(mockClient);
    });

    it('should save multiple sessions in batch', async () => {
      const sessions = new Map([
        [
          'session-1',
          {
            id: 'session-1',
            problem: 'Problem 1',
            technique: 'six_hats' as const,
            currentStep: 1,
            totalSteps: 6,
            history: [],
            branches: {},
            insights: [],
          },
        ],
        [
          'session-2',
          {
            id: 'session-2',
            problem: 'Problem 2',
            technique: 'scamper' as const,
            currentStep: 1,
            totalSteps: 7,
            history: [],
            branches: {},
            insights: [],
          },
        ],
      ]);

      // Mock save to use mockPool.query directly
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as unknown as QueryResult);

      await adapter.saveBatch(sessions);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback on batch save error', async () => {
      const sessions = new Map([
        [
          'session-1',
          {
            id: 'session-1',
            problem: 'Problem 1',
            technique: 'six_hats' as const,
            currentStep: 1,
            totalSteps: 6,
            history: [],
            branches: {},
            insights: [],
          },
        ],
      ]);

      // Mock error after BEGIN
      vi.mocked(mockClient.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as unknown as QueryResult) // BEGIN
        .mockRejectedValueOnce(new Error('Save failed'));

      await expect(adapter.saveBatch(sessions)).rejects.toThrow(PersistenceError);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should delete multiple sessions in batch', async () => {
      const sessionIds = ['session-1', 'session-2', 'session-3'];

      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 3,
      } as unknown as QueryResult);

      const deletedCount = await adapter.deleteBatch(sessionIds);

      expect(deletedCount).toBe(3);
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('export and import', () => {
    beforeEach(async () => {
      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString: 'postgres://localhost/test' },
      });

      mockPool = (adapter as any).pool;
    });

    it('should export session as JSON', async () => {
      const sessionId = 'export-test';
      const testState = {
        id: sessionId,
        problem: 'test',
        technique: 'six_hats' as const,
        currentStep: 1,
        totalSteps: 6,
        history: [],
        branches: {},
        insights: [],
      };

      // Mock load
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [{ state: testState }],
        rowCount: 1,
      } as unknown as QueryResult);

      const exported = await adapter.export(sessionId, 'json');

      expect(exported).toBeInstanceOf(Buffer);
      const parsed = JSON.parse(exported.toString());
      expect(parsed.id).toBe(sessionId);
    });

    it('should throw error for non-existent session export', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as unknown as QueryResult);

      await expect(adapter.export('non-existent', 'json')).rejects.toThrow(PersistenceError);
    });

    it('should import session from JSON', async () => {
      const testState = {
        id: 'import-test',
        problem: 'test',
        technique: 'six_hats' as const,
        currentStep: 1,
        totalSteps: 6,
        history: [],
        branches: {},
        insights: [],
      };

      const data = Buffer.from(JSON.stringify(testState));

      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as unknown as QueryResult);

      const importedId = await adapter.import(data, 'json');

      expect(importedId).toBe('import-test');
    });
  });

  describe('stats and cleanup', () => {
    beforeEach(async () => {
      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString: 'postgres://localhost/test' },
      });

      mockPool = (adapter as any).pool;
    });

    it('should get storage stats', async () => {
      const now = new Date();
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [
          {
            total: '10',
            oldest: now,
            newest: now,
            size: '1024000',
          },
        ],
        rowCount: 1,
      } as unknown as QueryResult);

      const stats = await adapter.getStats();

      expect(stats.totalSessions).toBe(10);
      expect(stats.totalSize).toBe(1024000);
      expect(stats.oldestSession).toBeDefined();
      expect(stats.newestSession).toBeDefined();
    });

    it('should cleanup old sessions', async () => {
      const olderThan = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        rowCount: 5,
      } as unknown as QueryResult);

      const deletedCount = await adapter.cleanup(olderThan);

      expect(deletedCount).toBe(5);
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close pool connection', async () => {
      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString: 'postgres://localhost/test' },
      });

      mockPool = (adapter as any).pool;

      await adapter.close();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle double close gracefully', async () => {
      await adapter.initialize({
        adapter: 'postgres',
        options: { connectionString: 'postgres://localhost/test' },
      });

      await adapter.close();
      await adapter.close(); // Should not throw

      expect(adapter).toBeDefined();
    });
  });
});
