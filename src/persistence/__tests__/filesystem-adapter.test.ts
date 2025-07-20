import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FilesystemAdapter } from '../filesystem-adapter.js';
import { PersistenceError } from '../types.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { tmpdir } from 'os';

describe('FilesystemAdapter', () => {
  let adapter: FilesystemAdapter;
  let testBasePath: string;

  beforeEach(() => {
    // Create a temporary directory for tests
    testBasePath = path.join(tmpdir(), `creative-thinking-test-${Date.now()}`);
    adapter = new FilesystemAdapter();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testBasePath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('initialize', () => {
    it('should initialize successfully with valid path', async () => {
      await adapter.initialize({
        adapter: 'filesystem',
        options: { path: testBasePath },
      });

      // Check that directories were created
      const sessionDir = path.join(testBasePath, 'sessions');
      const metadataDir = path.join(testBasePath, 'metadata');

      const sessionDirExists = await fs
        .stat(sessionDir)
        .then(() => true)
        .catch(() => false);
      const metadataDirExists = await fs
        .stat(metadataDir)
        .then(() => true)
        .catch(() => false);

      expect(sessionDirExists).toBe(true);
      expect(metadataDirExists).toBe(true);
    });

    it('should throw error on path traversal attempt', async () => {
      await expect(
        adapter.initialize({
          adapter: 'filesystem',
          options: { path: '../../../etc/passwd' },
        })
      ).rejects.toThrow(PersistenceError);
    });

    it('should throw error if already initialized', async () => {
      await adapter.initialize({
        adapter: 'filesystem',
        options: { path: testBasePath },
      });

      await expect(
        adapter.initialize({
          adapter: 'filesystem',
          options: { path: testBasePath },
        })
      ).rejects.toThrow('Adapter already initialized');
    });
  });

  describe('session ID validation', () => {
    beforeEach(async () => {
      await adapter.initialize({
        adapter: 'filesystem',
        options: { path: testBasePath },
      });
    });

    it('should accept valid session IDs', async () => {
      const validIds = ['session_123', 'session-abc-def', 'SESSION_XYZ_789', 'test_session-123'];

      for (const id of validIds) {
        const testState = {
          id,
          problem: 'test',
          technique: 'six_hats' as const,
          currentStep: 1,
          totalSteps: 6,
          history: [],
          branches: {},
          insights: [],
        };

        await expect(adapter.save(id, testState)).resolves.not.toThrow();
      }
    });

    it('should reject invalid session IDs', async () => {
      const invalidIds = [
        '../evil',
        'session/../../etc',
        'session\x00null',
        '',
        'a'.repeat(256), // Too long
        'session with spaces',
        'session@special#chars',
      ];

      for (const id of invalidIds) {
        const testState = {
          id,
          problem: 'test',
          technique: 'six_hats' as const,
          currentStep: 1,
          totalSteps: 6,
          history: [],
          branches: {},
          insights: [],
        };

        await expect(adapter.save(id, testState)).rejects.toThrow(PersistenceError);
      }
    });
  });

  describe('save and load', () => {
    beforeEach(async () => {
      await adapter.initialize({
        adapter: 'filesystem',
        options: { path: testBasePath },
      });
    });

    it('should save and load session correctly', async () => {
      const sessionId = 'test-session-123';
      const testState = {
        id: sessionId,
        problem: 'How to improve team collaboration',
        technique: 'six_hats' as const,
        currentStep: 3,
        totalSteps: 6,
        history: [
          {
            step: 1,
            timestamp: new Date().toISOString(),
            input: {
              technique: 'six_hats' as const,
              problem: 'How to improve team collaboration',
              currentStep: 1,
              totalSteps: 6,
              output: 'Blue hat thinking...',
              nextStepNeeded: true,
              hatColor: 'blue',
            },
            output: {
              technique: 'six_hats' as const,
              problem: 'How to improve team collaboration',
              currentStep: 1,
              totalSteps: 6,
              output: 'Blue hat thinking...',
              nextStepNeeded: true,
              hatColor: 'blue',
            },
          },
        ],
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

      await adapter.save(sessionId, testState);
      const loaded = await adapter.load(sessionId);

      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe(sessionId);
      expect(loaded?.problem).toBe(testState.problem);
      expect(loaded?.technique).toBe(testState.technique);
      expect(loaded?.currentStep).toBe(testState.currentStep);
      expect(loaded?.history).toHaveLength(1);
      expect(loaded?.tags).toEqual(testState.tags);
      expect(loaded?.name).toBe(testState.name);
    });

    it('should enforce file size limit', async () => {
      const sessionId = 'large-session';
      const largeOutput = 'x'.repeat(1024 * 1024); // 1MB string

      const testState = {
        id: sessionId,
        problem: 'test',
        technique: 'six_hats' as const,
        currentStep: 1,
        totalSteps: 6,
        history: Array(15)
          .fill(null)
          .map((_, i) => ({
            step: i + 1,
            timestamp: new Date().toISOString(),
            input: {
              technique: 'six_hats' as const,
              problem: 'test',
              currentStep: i + 1,
              totalSteps: 6,
              output: largeOutput,
              nextStepNeeded: true,
            },
            output: {
              technique: 'six_hats' as const,
              problem: 'test',
              currentStep: i + 1,
              totalSteps: 6,
              output: largeOutput,
              nextStepNeeded: true,
            },
          })),
        branches: {},
        insights: [],
      };

      await expect(adapter.save(sessionId, testState)).rejects.toThrow('Session data too large');
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await adapter.initialize({
        adapter: 'filesystem',
        options: { path: testBasePath },
      });
    });

    it('should list sessions with filtering', async () => {
      // Save multiple test sessions
      const sessions = [
        {
          id: 'session-1',
          problem: 'Problem 1',
          technique: 'six_hats' as const,
          currentStep: 6,
          totalSteps: 6,
          history: [],
          branches: {},
          insights: [],
          endTime: Date.now(),
          tags: ['tag1', 'tag2'],
        },
        {
          id: 'session-2',
          problem: 'Problem 2',
          technique: 'scamper' as const,
          currentStep: 3,
          totalSteps: 7,
          history: [],
          branches: {},
          insights: [],
          tags: ['tag2', 'tag3'],
        },
        {
          id: 'session-3',
          problem: 'Problem 3',
          technique: 'six_hats' as const,
          currentStep: 2,
          totalSteps: 6,
          history: [],
          branches: {},
          insights: [],
          tags: ['tag1'],
        },
      ];

      for (const session of sessions) {
        await adapter.save(session.id, session);
      }

      // Test listing all
      const allSessions = await adapter.list({});
      expect(allSessions).toHaveLength(3);

      // Test filtering by technique
      const sixHatsSessions = await adapter.list({
        filter: { technique: 'six_hats' },
      });
      expect(sixHatsSessions).toHaveLength(2);

      // Test filtering by status
      const completedSessions = await adapter.list({
        filter: { status: 'completed' },
      });
      expect(completedSessions).toHaveLength(1);

      // Test filtering by tags
      const tag1Sessions = await adapter.list({
        filter: { tags: ['tag1'] },
      });
      expect(tag1Sessions).toHaveLength(2);

      // Test limit
      const limitedSessions = await adapter.list({ limit: 2 });
      expect(limitedSessions).toHaveLength(2);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await adapter.initialize({
        adapter: 'filesystem',
        options: { path: testBasePath },
      });
    });

    it('should delete session and metadata', async () => {
      const sessionId = 'delete-test';
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

      await adapter.save(sessionId, testState);

      // Verify it exists
      const loaded = await adapter.load(sessionId);
      expect(loaded).toBeDefined();

      // Delete it
      const result = await adapter.delete(sessionId);
      expect(result).toBe(true);

      // Verify it's gone
      const afterDelete = await adapter.load(sessionId);
      expect(afterDelete).toBeNull();
    });

    it('should return false for non-existent session', async () => {
      const result = await adapter.delete('non-existent');
      expect(result).toBe(false);
    });
  });
});
