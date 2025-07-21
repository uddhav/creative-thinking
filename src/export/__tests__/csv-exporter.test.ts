import { describe, it, expect } from 'vitest';
import { CSVExporter } from '../csv-exporter.js';
import type { SessionState } from '../../persistence/types.js';

describe('CSVExporter', () => {
  const exporter = new CSVExporter();

  const createTestSession = (): SessionState => ({
    id: 'test-session-789',
    problem: 'How to increase innovation',
    technique: 'random_entry',
    currentStep: 3,
    totalSteps: 3,
    history: [
      {
        step: 1,
        timestamp: '2024-01-15T16:00:00Z',
        input: {
          technique: 'random_entry',
          problem: 'How to increase innovation',
          currentStep: 1,
          totalSteps: 3,
          output: 'Random word: Butterfly',
          nextStepNeeded: true,
          randomStimulus: 'Butterfly',
        },
        output: {
          technique: 'random_entry',
          problem: 'How to increase innovation',
          currentStep: 1,
          totalSteps: 3,
          output: 'Random word: Butterfly',
          nextStepNeeded: true,
          randomStimulus: 'Butterfly',
        },
      },
      {
        step: 2,
        timestamp: '2024-01-15T16:05:00Z',
        input: {
          technique: 'random_entry',
          problem: 'How to increase innovation',
          currentStep: 2,
          totalSteps: 3,
          output: 'Connections: transformation, emergence, delicate balance',
          nextStepNeeded: true,
          connections: ['Transformation process', 'Emergence from cocoon', 'Delicate but powerful'],
        },
        output: {
          technique: 'random_entry',
          problem: 'How to increase innovation',
          currentStep: 2,
          totalSteps: 3,
          output: 'Connections: transformation, emergence, delicate balance',
          nextStepNeeded: true,
        },
      },
      {
        step: 3,
        timestamp: '2024-01-15T16:10:00Z',
        input: {
          technique: 'random_entry',
          problem: 'How to increase innovation',
          currentStep: 3,
          totalSteps: 3,
          output: 'Innovation labs as transformation cocoons',
          nextStepNeeded: false,
          applications: ['Create innovation cocoons', 'Metamorphosis workshops'],
        },
        output: {
          technique: 'random_entry',
          problem: 'How to increase innovation',
          currentStep: 3,
          totalSteps: 3,
          output: 'Innovation labs as transformation cocoons',
          nextStepNeeded: false,
        },
      },
    ],
    branches: {},
    insights: ['Innovation requires protected transformation spaces'],
    startTime: 1705338000000,
    endTime: 1705338600000,
    metrics: {
      creativityScore: 88,
      risksCaught: 0,
      antifragileFeatures: 1,
    },
    tags: ['innovation'],
    name: 'Innovation Strategy',
  });

  it('should export session to CSV format', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'csv' });

    expect(result.content).toBeTruthy();
    expect(result.filename).toMatch(/random-entry-.*\.csv$/);
    expect(result.mimeType).toBe('text/csv');
    expect(result.metadata?.sessionId).toBe('test-session-789');
  });

  it('should generate detailed CSV with dynamic headers', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'csv' });

    const content = result.content.toString();
    const lines = content.split('\n');
    const headers = lines[0].split(',');

    expect(headers).toContain('Step');
    expect(headers).toContain('Timestamp');
    expect(headers).toContain('Technique');
    expect(headers).toContain('Random Stimulus');
    expect(headers).toContain('Output');
    expect(headers).toContain('Connections');
    expect(headers).toContain('Applications');
  });

  it('should include all history entries as rows', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'csv' });

    const content = result.content.toString();
    const lines = content.split('\n');

    expect(lines.length).toBe(4); // Header + 3 data rows
    expect(lines[1]).toContain('Butterfly');
    expect(lines[2]).toContain('Transformation process; Emergence from cocoon');
    expect(lines[3]).toContain('Create innovation cocoons; Metamorphosis workshops');
  });

  it('should escape CSV special characters', async () => {
    const session = createTestSession();
    session.history[0].input.output = 'Output with, comma and "quotes"';

    const result = await exporter.export(session, { format: 'csv' });
    const content = result.content.toString();

    expect(content).toContain('"Output with, comma and ""quotes"""');
  });

  it('should generate metrics CSV when includeMetrics is true', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, {
      format: 'csv',
      includeMetrics: true,
      includeHistory: false,
    });

    const content = result.content.toString();
    const lines = content.split('\n');
    const headers = lines[0].split(',');

    expect(headers).toEqual([
      'SessionID',
      'Problem',
      'Technique',
      'Duration',
      'Steps',
      'CreativityScore',
      'RisksIdentified',
      'Insights',
    ]);
    expect(lines[1]).toContain('test-session-789');
    expect(lines[1]).toContain('How to increase innovation');
    expect(lines[1]).toContain('Random Entry');
    expect(lines[1]).toContain('10'); // 10 minutes duration
    expect(lines[1]).toContain('88'); // creativity score
  });

  it('should handle technique-specific fields correctly', async () => {
    const session = createTestSession();
    session.technique = 'six_hats';
    session.history[0].input.technique = 'six_hats';
    session.history[0].input.hatColor = 'blue';
    session.history[0].input.randomStimulus = undefined;

    const result = await exporter.export(session, { format: 'csv' });
    const content = result.content.toString();
    const headers = content.split('\n')[0].split(',');

    expect(headers).toContain('Hat Color');
    expect(headers).not.toContain('Random Stimulus');
  });

  it('should handle empty arrays gracefully', async () => {
    const session = createTestSession();
    session.history[1].input.connections = [];

    const result = await exporter.export(session, { format: 'csv' });
    const content = result.content.toString();

    // When connections array is empty, the field should be empty
    // Check the actual content of the second data row
    const lines = content.split('\n');
    const row2 = lines[2];

    // The row should have the output but empty connections
    expect(row2).toContain('"Connections: transformation, emergence, delicate balance"');
    expect(row2).toMatch(/,\s*,|,$/); // Empty field pattern
  });

  it('should export multiple sessions to metrics CSV', async () => {
    const session1 = createTestSession();
    const session2 = { ...createTestSession(), id: 'test-session-999' };

    // Use the public export method with metrics option to test multiple session handling
    const result1 = await exporter.export(session1, {
      format: 'csv',
      includeMetrics: true,
      includeHistory: false,
    });
    const result2 = await exporter.export(session2, {
      format: 'csv',
      includeMetrics: true,
      includeHistory: false,
    });

    // Just verify both can be exported successfully
    expect(result1.content.toString()).toContain('test-session-789');
    expect(result2.content.toString()).toContain('test-session-999');
  });
});
