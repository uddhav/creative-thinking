/**
 * Tests for FilesystemPersistenceAdapter
 * Focuses on export/import functionality and filesystem operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FilesystemAdapter } from '../../persistence/filesystem-adapter.js';
import { PersistenceError, PersistenceErrorCode } from '../../persistence/types.js';
import type { SessionState, ExportFormat } from '../../persistence/types.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import os from 'os';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    access: vi.fn(),
    unlink: vi.fn(),
  },
}));

// Mock the export factory
vi.mock('../../export/export-factory.js', () => ({
  ExportFactory: {
    export: vi.fn(),
  },
}));

describe('FilesystemAdapter', () => {
  let adapter: FilesystemAdapter;
  let mockSession: SessionState;
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), 'creative-thinking-test');
    adapter = new FilesystemAdapter();

    const fixedTime = 1753922143575;

    mockSession = {
      id: 'test-session',
      problem: 'Test Problem',
      technique: 'six_hats',
      currentStep: 3,
      totalSteps: 6,
      history: [
        {
          step: 1,
          timestamp: '2025-01-01T00:00:00Z',
          input: {
            technique: 'six_hats',
            problem: 'Test Problem',
            currentStep: 1,
            totalSteps: 6,
            output: 'Step 1 output',
            nextStepNeeded: true,
          },
          output: {
            success: true,
            response: 'Step 1 response',
          },
        },
      ],
      branches: {},
      insights: ['Insight 1', 'Insight 2'],
      startTime: fixedTime,
      metrics: {
        creativityScore: 7.5,
        risksCaught: 3,
        antifragileFeatures: 2,
      },
      tags: ['test', 'example'],
      name: 'Test Session',
    };

    // Setup default mock behaviors
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({
        version: '1.0.0',
        format: 'json',
        compressed: false,
        encrypted: false,
        data: mockSession,
      })
    );
    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Export Functionality', () => {
    it('should export session to JSON format', async () => {
      const { ExportFactory } = await import('../../export/export-factory.js');
      const mockExportResult = {
        content: JSON.stringify(mockSession, null, 2),
        filename: 'test-session.json',
        mimeType: 'application/json',
      };
      vi.mocked(ExportFactory).export.mockResolvedValue(mockExportResult);

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      await adapter.save(mockSession.id, mockSession);

      const result = await adapter.export(mockSession.id, 'json');

      expect(vi.mocked(ExportFactory).export).toHaveBeenCalledWith(mockSession, 'json');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe(mockExportResult.content);
    });

    it('should export session to CSV format', async () => {
      const { ExportFactory } = await import('../../export/export-factory.js');
      const mockCSVContent = 'Step,Output\n1,"Step 1 output"';
      const mockExportResult = {
        content: mockCSVContent,
        filename: 'test-session.csv',
        mimeType: 'text/csv',
      };
      vi.mocked(ExportFactory).export.mockResolvedValue(mockExportResult);

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      await adapter.save(mockSession.id, mockSession);

      const result = await adapter.export(mockSession.id, 'csv');

      expect(vi.mocked(ExportFactory).export).toHaveBeenCalledWith(mockSession, 'csv');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe(mockCSVContent);
    });

    it('should export session to Markdown format', async () => {
      const { ExportFactory } = await import('../../export/export-factory.js');
      const mockMarkdownContent = '# Test Session\n\n## Problem\nTest Problem';
      const mockExportResult = {
        content: mockMarkdownContent,
        filename: 'test-session.md',
        mimeType: 'text/markdown',
      };
      vi.mocked(ExportFactory).export.mockResolvedValue(mockExportResult);

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      await adapter.save(mockSession.id, mockSession);

      const result = await adapter.export(mockSession.id, 'markdown');

      expect(vi.mocked(ExportFactory).export).toHaveBeenCalledWith(mockSession, 'markdown');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe(mockMarkdownContent);
    });

    it('should handle Buffer content from ExportFactory', async () => {
      const { ExportFactory } = await import('../../export/export-factory.js');
      const bufferContent = Buffer.from('Buffer content');
      const mockExportResult = {
        content: bufferContent,
        filename: 'test-session.bin',
        mimeType: 'application/octet-stream',
      };
      vi.mocked(ExportFactory).export.mockResolvedValue(mockExportResult);

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      await adapter.save(mockSession.id, mockSession);

      const result = await adapter.export(mockSession.id, 'json');

      expect(result).toBe(bufferContent);
    });

    it('should throw error if session not found', async () => {
      // Mock readFile to throw ENOENT for non-existent session
      vi.mocked(fs.readFile).mockRejectedValueOnce({ code: 'ENOENT' });

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });

      await expect(adapter.export('non-existent', 'json')).rejects.toThrow(
        new PersistenceError('Session non-existent not found', PersistenceErrorCode.NOT_FOUND)
      );
    });

    it('should throw error if export fails', async () => {
      const { ExportFactory } = await import('../../export/export-factory.js');
      vi.mocked(ExportFactory).export.mockRejectedValue(new Error('Export failed'));

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      await adapter.save(mockSession.id, mockSession);

      await expect(adapter.export(mockSession.id, 'json')).rejects.toThrow(
        new PersistenceError('Export failed: Export failed', PersistenceErrorCode.EXPORT_FAILED)
      );
    });

    it('should throw error if not initialized', async () => {
      await expect(adapter.export(mockSession.id, 'json')).rejects.toThrow(PersistenceError);
    });
  });

  describe('Import Functionality', () => {
    it('should import JSON session data', async () => {
      const jsonData = Buffer.from(JSON.stringify(mockSession));

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      const newSessionId = await adapter.import(jsonData, 'json');

      expect(newSessionId).toMatch(/^session_[a-f0-9-]+$/);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(newSessionId),
        expect.any(String),
        'utf8'
      );
    });

    it('should generate new ID for imported session', async () => {
      const jsonData = Buffer.from(JSON.stringify(mockSession));

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      const newSessionId1 = await adapter.import(jsonData, 'json');
      const newSessionId2 = await adapter.import(jsonData, 'json');

      expect(newSessionId1).not.toBe(newSessionId2);
      expect(newSessionId1).not.toBe(mockSession.id);
    });

    it('should throw error for unsupported import format', async () => {
      const data = Buffer.from('Some data');

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });

      await expect(adapter.import(data, 'csv' as ExportFormat)).rejects.toThrow(PersistenceError);
    });

    it('should throw error for invalid JSON data', async () => {
      const invalidJson = Buffer.from('{ invalid json }');

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });

      await expect(adapter.import(invalidJson, 'json')).rejects.toThrow(PersistenceError);
    });

    it('should throw error if not initialized', async () => {
      const jsonData = Buffer.from(JSON.stringify(mockSession));

      await expect(adapter.import(jsonData, 'json')).rejects.toThrow(PersistenceError);
    });
  });

  describe('Save and Load Operations', () => {
    it('should save session with metadata', async () => {
      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      await adapter.save(mockSession.id, mockSession);

      // Should save both session and metadata files
      expect(fs.writeFile).toHaveBeenCalledTimes(2);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(tempDir, 'sessions', 'test-session.json'),
        JSON.stringify(
          {
            version: '1.0.0',
            format: 'json',
            compressed: false,
            encrypted: false,
            data: mockSession,
          },
          null,
          2
        ),
        'utf8'
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(tempDir, 'metadata', 'test-session.json'),
        expect.any(String),
        'utf8'
      );
    });

    it('should load session from filesystem', async () => {
      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      const loaded = await adapter.load(mockSession.id);

      expect(loaded).toEqual(mockSession);
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(tempDir, 'sessions', 'test-session.json'),
        'utf8'
      );
    });

    it('should return null for non-existent session', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      const loaded = await adapter.load('non-existent');

      expect(loaded).toBeNull();
    });

    it('should validate session ID to prevent path traversal', async () => {
      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });

      await expect(adapter.save('../../../etc/passwd', mockSession)).rejects.toThrow(
        new PersistenceError(
          'Invalid session ID: Must contain only alphanumeric characters, underscores, and hyphens',
          PersistenceErrorCode.INVALID_FORMAT
        )
      );

      await expect(adapter.load('../../sensitive-file')).rejects.toThrow(
        new PersistenceError(
          'Invalid session ID: Must contain only alphanumeric characters, underscores, and hyphens',
          PersistenceErrorCode.INVALID_FORMAT
        )
      );
    });
  });

  describe('List and Search Operations', () => {
    it('should list sessions with filtering', async () => {
      // Reset the readFile mock for this test
      vi.mocked(fs.readFile).mockReset();
      const metadata1 = {
        id: 'session1',
        name: 'Session 1',
        problem: 'Problem 1',
        technique: 'six_hats' as const,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        status: 'completed' as const,
        stepsCompleted: 6,
        totalSteps: 6,
        tags: ['test'],
        insights: 3,
        branches: 0,
      };

      const metadata2 = {
        id: 'session2',
        name: 'Session 2',
        problem: 'Problem 2',
        technique: 'po' as const,
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date('2025-01-04'),
        status: 'active' as const,
        stepsCompleted: 2,
        totalSteps: 4,
        tags: ['example'],
        insights: 1,
        branches: 1,
      };

      vi.mocked(fs.readdir).mockResolvedValue(['session1.json', 'session2.json']);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(
          JSON.stringify({
            ...metadata1,
            createdAt: metadata1.createdAt.toISOString(),
            updatedAt: metadata1.updatedAt.toISOString(),
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            ...metadata2,
            createdAt: metadata2.createdAt.toISOString(),
            updatedAt: metadata2.updatedAt.toISOString(),
          })
        );

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      const result = await adapter.list({
        filter: { technique: 'six_hats' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].technique).toBe('six_hats');
    });

    it('should search sessions by text', async () => {
      // Reset the readFile mock for this test
      vi.mocked(fs.readFile).mockReset();
      const searchSession = {
        ...mockSession,
        problem: 'Find innovative solutions',
        insights: ['Innovative idea 1', 'Creative solution 2'],
      };

      vi.mocked(fs.readdir).mockResolvedValue(['test-session.json']);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(
          JSON.stringify({
            id: 'test-session',
            name: 'Test Session',
            problem: searchSession.problem,
            technique: searchSession.technique,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            stepsCompleted: 3,
            totalSteps: 6,
            tags: searchSession.tags || [],
            insights: searchSession.insights.length,
            branches: 0,
          })
        ) // metadata
        .mockResolvedValueOnce(
          JSON.stringify({
            version: '1.0.0',
            format: 'json',
            compressed: false,
            encrypted: false,
            data: searchSession,
          })
        ); // session

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      const results = await adapter.search({ text: 'innovative' });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-session');
    });

    it('should apply sorting to list results', async () => {
      // Reset the readFile mock for this test
      vi.mocked(fs.readFile).mockReset();
      const metadata = [
        {
          id: 'session1',
          name: 'A Session',
          problem: 'Problem',
          technique: 'six_hats' as const,
          createdAt: new Date('2025-01-03'),
          updatedAt: new Date('2025-01-03'),
          status: 'active' as const,
          stepsCompleted: 1,
          totalSteps: 6,
          tags: [],
          insights: 0,
          branches: 0,
        },
        {
          id: 'session2',
          name: 'B Session',
          problem: 'Problem',
          technique: 'po' as const,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          status: 'active' as const,
          stepsCompleted: 1,
          totalSteps: 4,
          tags: [],
          insights: 0,
          branches: 0,
        },
      ];

      vi.mocked(fs.readdir).mockResolvedValue(['session1.json', 'session2.json']);
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(
          JSON.stringify({
            ...metadata[0],
            createdAt: metadata[0].createdAt.toISOString(),
            updatedAt: metadata[0].updatedAt.toISOString(),
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            ...metadata[1],
            createdAt: metadata[1].createdAt.toISOString(),
            updatedAt: metadata[1].updatedAt.toISOString(),
          })
        );

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      const result = await adapter.list({
        sortBy: 'created',
        sortOrder: 'asc',
      });

      expect(result[0].id).toBe('session2'); // Created earlier
      expect(result[1].id).toBe('session1');
    });
  });

  describe('Batch Operations', () => {
    it('should save multiple sessions in batch', async () => {
      const sessions = new Map([
        ['session1', { ...mockSession, id: 'session1' }],
        ['session2', { ...mockSession, id: 'session2' }],
      ]);

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      await adapter.saveBatch(sessions);

      // 2 sessions * 2 files (session + metadata) = 4 writes
      expect(fs.writeFile).toHaveBeenCalledTimes(4);
    });

    it('should delete multiple sessions in batch', async () => {
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      const deletedCount = await adapter.deleteBatch(['session1', 'session2', 'session3']);

      expect(fs.unlink).toHaveBeenCalledTimes(6); // 3 sessions * 2 files each
      expect(deletedCount).toBe(3);
    });

    it('should handle partial batch deletion failures', async () => {
      vi.mocked(fs.unlink)
        .mockResolvedValueOnce(undefined) // session1 session file
        .mockResolvedValueOnce(undefined) // session1 metadata file
        .mockRejectedValueOnce({ code: 'ENOENT' }) // session2 session file
        .mockRejectedValueOnce({ code: 'ENOENT' }) // session2 metadata file
        .mockResolvedValueOnce(undefined) // session3 session file
        .mockResolvedValueOnce(undefined); // session3 metadata file

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });
      const deletedCount = await adapter.deleteBatch(['session1', 'session2', 'session3']);

      expect(deletedCount).toBe(2); // Only session1 and session3 deleted
    });
  });

  describe('Error Handling', () => {
    it('should handle filesystem errors gracefully', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });

      await expect(adapter.save(mockSession.id, mockSession)).rejects.toThrow(PersistenceError);
    });

    it('should validate paths to prevent traversal attacks', async () => {
      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });

      const maliciousIds = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        'session/../../../secret',
        './../../sensitive',
        'session\x00.json', // Null byte injection
      ];

      for (const id of maliciousIds) {
        await expect(adapter.save(id, mockSession)).rejects.toThrow(
          new PersistenceError(
            'Invalid session ID: Must contain only alphanumeric characters, underscores, and hyphens',
            PersistenceErrorCode.INVALID_FORMAT
          )
        );
      }
    });

    it('should handle JSON parsing errors', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('{ invalid json }');

      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });

      await expect(adapter.load(mockSession.id)).rejects.toThrow(PersistenceError);
    });
  });

  describe('Initialization', () => {
    it('should create necessary directories on init', async () => {
      await adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } });

      expect(fs.mkdir).toHaveBeenCalledWith(path.join(tempDir, 'sessions'), { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(path.join(tempDir, 'metadata'), { recursive: true });
    });

    it('should handle init errors gracefully', async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Permission denied'));

      await expect(
        adapter.initialize({ adapter: 'filesystem', options: { path: tempDir } })
      ).rejects.toThrow(PersistenceError);
    });

    it('should prevent operations before initialization', async () => {
      await expect(adapter.save(mockSession.id, mockSession)).rejects.toThrow(PersistenceError);

      await expect(adapter.load(mockSession.id)).rejects.toThrow(PersistenceError);

      await expect(adapter.list()).rejects.toThrow(PersistenceError);
    });
  });
});
