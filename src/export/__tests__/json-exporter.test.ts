import { describe, it, expect } from 'vitest';
import { JSONExporter } from '../json-exporter.js';
import type { SessionState } from '../../persistence/types.js';

describe('JSONExporter', () => {
  const exporter = new JSONExporter();

  const createTestSession = (): SessionState => ({
    id: 'test-session-456',
    problem: 'How to reduce customer complaints',
    technique: 'scamper',
    currentStep: 2,
    totalSteps: 7,
    history: [
      {
        step: 1,
        timestamp: '2024-01-15T14:00:00Z',
        input: {
          technique: 'scamper',
          problem: 'How to reduce customer complaints',
          currentStep: 1,
          totalSteps: 7,
          output: 'Substitute: Replace phone support with chat support',
          nextStepNeeded: true,
          scamperAction: 'substitute',
          risks: ['Loss of personal touch'],
          mitigations: ['Train chat agents in empathy'],
        },
        output: {
          technique: 'scamper',
          problem: 'How to reduce customer complaints',
          currentStep: 1,
          totalSteps: 7,
          output: 'Substitute: Replace phone support with chat support',
          nextStepNeeded: true,
          scamperAction: 'substitute',
        },
      },
    ],
    branches: {
      'branch-1': [
        {
          technique: 'scamper',
          problem: 'How to reduce customer complaints',
          currentStep: 2,
          totalSteps: 7,
          output: 'Alternative approach: AI-powered support',
          nextStepNeeded: true,
          branchFromStep: 1,
          branchId: 'branch-1',
        },
      ],
    },
    insights: ['Automation can help scale support'],
    startTime: 1705330800000,
    endTime: 1705332600000,
    metrics: {
      creativityScore: 82,
      risksCaught: 1,
      antifragileFeatures: 2,
    },
    tags: ['customer-service', 'improvement'],
    name: 'Customer Support Enhancement',
  });

  it('should export session to JSON format', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'json' });

    expect(result.content).toBeTruthy();
    expect(result.filename).toMatch(/scamper-.*\.json$/);
    expect(result.mimeType).toBe('application/json');
    expect(result.metadata?.sessionId).toBe('test-session-456');
  });

  it('should include export metadata', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'json' });

    const data = JSON.parse(result.content.toString()) as {
      exportMetadata: {
        exportVersion: string;
        tool: string;
        exportedAt: string;
      };
    };
    expect(data.exportMetadata).toBeDefined();
    expect(data.exportMetadata.exportVersion).toBe('1.0');
    expect(data.exportMetadata.tool).toBe('Creative Thinking MCP Tool');
    expect(data.exportMetadata.exportedAt).toBeDefined();
  });

  it('should include session information', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'json' });

    const data = JSON.parse(result.content.toString()) as {
      sessionId: string;
      problem: string;
      technique: string;
      progress: {
        currentStep: number;
        totalSteps: number;
        percentComplete: number;
      };
    };
    expect(data.sessionId).toBe('test-session-456');
    expect(data.problem).toBe('How to reduce customer complaints');
    expect(data.technique).toBe('scamper');
    expect(data.progress.currentStep).toBe(2);
    expect(data.progress.totalSteps).toBe(7);
    expect(data.progress.percentComplete).toBe(29);
  });

  it('should enhance history entries with all fields', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'json' });

    const data = JSON.parse(result.content.toString()) as {
      history: Array<{
        step: number;
        timestamp: string;
        output: string;
        scamperAction: string;
        risks: string[];
        mitigations: string[];
      }>;
    };
    const historyEntry = data.history[0];

    expect(historyEntry.step).toBe(1);
    expect(historyEntry.timestamp).toBe('2024-01-15T14:00:00Z');
    expect(historyEntry.output).toContain('Substitute');
    expect(historyEntry.scamperAction).toBe('substitute');
    expect(historyEntry.risks).toEqual(['Loss of personal touch']);
    expect(historyEntry.mitigations).toEqual(['Train chat agents in empathy']);
  });

  it('should include metrics with summary', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'json' });

    const data = JSON.parse(result.content.toString()) as {
      metrics: {
        creativityScore: number;
        risksCaught: number;
        summary: {
          overallCreativity: string;
          riskAwareness: string;
        };
      };
    };
    expect(data.metrics.creativityScore).toBe(82);
    expect(data.metrics.risksCaught).toBe(1);
    expect(data.metrics.summary.overallCreativity).toBe('Highly Creative');
    expect(data.metrics.summary.riskAwareness).toBe('Limited Risk Awareness');
  });

  it('should include branch information', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'json' });

    const data = JSON.parse(result.content.toString()) as {
      branches: {
        count: number;
        details: Array<{
          branchId: string;
          stepsInBranch: number;
        }>;
      };
    };
    expect(data.branches.count).toBe(1);
    expect(data.branches.details[0].branchId).toBe('branch-1');
    expect(data.branches.details[0].stepsInBranch).toBe(1);
  });

  it('should generate statistics', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'json' });

    const data = JSON.parse(result.content.toString()) as {
      statistics: {
        totalOutputLength: number;
        averageOutputLength: number;
        uniqueConceptsCount: number;
        revisionCount: number;
        branchingPoints: number;
      };
    };
    expect(data.statistics).toBeDefined();
    expect(data.statistics.totalOutputLength).toBeGreaterThan(0);
    expect(data.statistics.averageOutputLength).toBeGreaterThan(0);
    expect(data.statistics.uniqueConceptsCount).toBe(2); // 2 unique concepts in risks/mitigations
    expect(data.statistics.revisionCount).toBe(0);
    expect(data.statistics.branchingPoints).toBe(1);
  });

  it('should respect export options', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, {
      format: 'json',
      includeHistory: false,
      includeMetrics: false,
      includeBranches: false,
    });

    const data = JSON.parse(result.content.toString()) as {
      history?: any;
      metrics?: any;
      branches?: any;
    };
    expect(data.history).toBeUndefined();
    expect(data.metrics).toBeUndefined();
    expect(data.branches).toBeUndefined();
  });

  it('should handle sessions without metrics', async () => {
    const session = createTestSession();
    delete session.metrics;

    const result = await exporter.export(session, { format: 'json' });
    const data = JSON.parse(result.content.toString()) as {
      metrics?: any;
    };

    expect(data.metrics).toBeUndefined();
  });
});
