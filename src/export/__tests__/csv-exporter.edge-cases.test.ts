/**
 * Edge case tests for CSVExporter
 * Focuses on uncovered functionality and boundary conditions
 */

import { describe, it, expect } from 'vitest';
import { CSVExporter } from '../csv-exporter.js';
import type { SessionState } from '../../persistence/types.js';

describe('CSVExporter - Edge Cases', () => {
  const exporter = new CSVExporter();

  const createMinimalSession = (): SessionState => ({
    id: 'minimal-session',
    problem: 'Minimal test',
    technique: 'po',
    currentStep: 0,
    totalSteps: 4,
    history: [],
    branches: {},
    insights: [],
  });

  const createComplexSession = (): SessionState => ({
    id: 'complex-session',
    problem: 'Complex problem with special characters: "quotes", commas, and\nnewlines',
    technique: 'scamper',
    currentStep: 8,
    totalSteps: 8,
    history: [
      {
        step: 1,
        timestamp: '2024-01-15T10:00:00Z',
        input: {
          technique: 'scamper',
          problem: 'Complex problem',
          currentStep: 1,
          totalSteps: 8,
          output: 'Substitute: Replace traditional methods',
          nextStepNeeded: true,
          scamperAction: 'substitute',
          risks: ['Risk 1: "High cost"', 'Risk 2, complexity'],
          mitigations: ['Mitigation A', 'Mitigation B'],
        },
        output: {},
      },
      {
        step: 2,
        timestamp: '2024-01-15T10:05:00Z',
        input: {
          technique: 'scamper',
          problem: 'Complex problem',
          currentStep: 2,
          totalSteps: 8,
          output: 'Combine multiple approaches',
          nextStepNeeded: true,
          scamperAction: 'combine',
          isRevision: true,
          revisesStep: 1,
        },
        output: {},
      },
      {
        step: 3,
        timestamp: '2024-01-15T10:10:00Z',
        input: {
          technique: 'scamper',
          problem: 'Complex problem',
          currentStep: 3,
          totalSteps: 8,
          output: 'Branch exploration',
          nextStepNeeded: true,
          scamperAction: 'adapt',
          branchFromStep: 2,
          branchId: 'branch-alpha',
        },
        output: {},
      },
    ],
    branches: {
      'branch-alpha': {
        id: 'branch-alpha',
        fromStep: 2,
        createdAt: '2024-01-15T10:10:00Z',
        state: {} as SessionState,
      },
    },
    insights: ['Key insight 1', 'Key insight 2', 'Key insight 3'],
    startTime: 1705318800000,
    endTime: 1705320600000,
    metrics: {
      creativityScore: 95,
      risksCaught: 5,
      antifragileFeatures: 3,
    },
    tags: ['innovation', 'risk-analysis'],
    name: 'Complex SCAMPER Session',
  });

  it('should handle empty session history', async () => {
    const session = createMinimalSession();
    const result = await exporter.export(session, { format: 'csv' });

    const content = result.content.toString();
    const lines = content.split('\n');

    // Should have headers but no data rows
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('Step,Timestamp,Technique,Output');
  });

  it('should handle all technique-specific fields', async () => {
    const techniques = [
      { technique: 'six_hats', field: 'hatColor', value: 'blue', header: 'Hat Color' },
      {
        technique: 'scamper',
        field: 'scamperAction',
        value: 'substitute',
        header: 'SCAMPER Action',
      },
      { technique: 'po', field: 'provocation', value: 'What if we...', header: 'Provocation' },
      {
        technique: 'random_entry',
        field: 'randomStimulus',
        value: 'Cloud',
        header: 'Random Stimulus',
      },
      {
        technique: 'concept_extraction',
        field: 'successExample',
        value: 'Example',
        header: 'Success Example',
      },
      { technique: 'yes_and', field: 'initialIdea', value: 'Initial', header: 'Initial Idea' },
    ];

    for (const { technique, field, value, header } of techniques) {
      const session: SessionState = {
        id: `${technique}-session`,
        problem: 'Test',
        technique: technique as any,
        currentStep: 1,
        totalSteps: 1,
        history: [
          {
            step: 1,
            timestamp: new Date().toISOString(),
            input: {
              technique: technique as any,
              problem: 'Test',
              currentStep: 1,
              totalSteps: 1,
              output: 'Test output',
              nextStepNeeded: false,
              [field]: value,
            },
            output: {},
          },
        ],
        branches: {},
        insights: [],
      };

      const result = await exporter.export(session, { format: 'csv' });
      const content = result.content.toString();

      expect(content).toContain(header);
      if (
        (technique === 'six_hats' && field === 'hatColor') ||
        (technique === 'scamper' && field === 'scamperAction')
      ) {
        // Hat color and SCAMPER action are uppercased in the CSV
        expect(content).toContain(value.toUpperCase());
      } else {
        expect(content).toContain(value);
      }
    }
  });

  it('should handle all array fields', async () => {
    const session: SessionState = {
      id: 'array-test',
      problem: 'Test arrays',
      technique: 'po',
      currentStep: 1,
      totalSteps: 1,
      history: [
        {
          step: 1,
          timestamp: new Date().toISOString(),
          input: {
            technique: 'po',
            problem: 'Test',
            currentStep: 1,
            totalSteps: 1,
            output: 'Test',
            nextStepNeeded: false,
            principles: ['Principle 1', 'Principle 2'],
            extractedConcepts: ['Concept A', 'Concept B', 'Concept C'],
            applications: ['App 1', 'App 2'],
          },
          output: {},
        },
      ],
      branches: {},
      insights: [],
    };

    const result = await exporter.export(session, { format: 'csv' });
    const content = result.content.toString();

    expect(content).toContain('Principles');
    expect(content).toContain('Concepts');
    expect(content).toContain('Applications');
    expect(content).toContain('Principle 1; Principle 2');
    expect(content).toContain('Concept A; Concept B; Concept C');
    expect(content).toContain('App 1; App 2');
  });

  it('should handle revision and branching information', async () => {
    const session = createComplexSession();
    const result = await exporter.export(session, { format: 'csv' });

    const content = result.content.toString();
    const lines = content.split('\n');

    // Check headers include revision/branch columns
    expect(lines[0]).toContain('Is Revision');
    expect(lines[0]).toContain('Revises Step');
    expect(lines[0]).toContain('Branch From');
    expect(lines[0]).toContain('Branch ID');

    // Check revision data
    expect(lines[2]).toContain('Yes'); // Is Revision
    expect(lines[2]).toContain('1'); // Revises Step

    // Check branch data
    expect(lines[3]).toContain('2'); // Branch From
    expect(lines[3]).toContain('branch-alpha'); // Branch ID
  });

  it('should escape all CSV special characters correctly', async () => {
    const testCases = [
      'Simple text',
      'Text with, comma',
      'Text with "quotes"',
      'Text with both, "comma and quotes"',
      'Text with\nnewline',
      'Text with\r\nCRLF',
      'Text with\ttab',
      '"Already quoted"',
      'Multiple ""quotes"" here',
      '', // Empty string
    ];

    for (const testCase of testCases) {
      const session: SessionState = {
        id: 'escape-test',
        problem: testCase,
        technique: 'po',
        currentStep: 1,
        totalSteps: 1,
        history: [
          {
            step: 1,
            timestamp: new Date().toISOString(),
            input: {
              technique: 'po',
              problem: testCase,
              currentStep: 1,
              totalSteps: 1,
              output: testCase,
              nextStepNeeded: false,
              provocation: testCase,
            },
            output: {},
          },
        ],
        branches: {},
        insights: [testCase],
      };

      const result = await exporter.export(session, { format: 'csv' });
      const content = result.content.toString();

      // CSV should be parseable without errors
      const lines = content.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2);

      // Special characters should be properly escaped
      if (testCase.includes(',') || testCase.includes('"') || testCase.includes('\n')) {
        expect(content).toContain('"');
      }
    }
  });

  it('should handle metrics CSV with missing optional fields', async () => {
    const session: SessionState = {
      id: 'metrics-test',
      problem: 'Test',
      technique: 'six_hats',
      currentStep: 3,
      totalSteps: 6,
      history: [],
      branches: {},
      insights: [],
      // No startTime, endTime, or metrics
    };

    const result = await exporter.export(session, {
      format: 'csv',
      includeMetrics: true,
      includeHistory: false,
    });

    const content = result.content.toString();
    const lines = content.split('\n');

    expect(lines.length).toBe(2); // Header + 1 data row
    expect(lines[1]).toContain('0'); // Duration should be 0
    expect(lines[1]).toContain('3/6'); // Steps progress
    expect(lines[1]).toContain('0'); // Default creativity score
  });

  it('should use exportMultiple for comparative analysis', () => {
    const sessions: SessionState[] = [
      createMinimalSession(),
      createComplexSession(),
      {
        ...createMinimalSession(),
        id: 'third-session',
        metrics: {
          creativityScore: 75,
          risksCaught: 2,
          antifragileFeatures: 1,
        },
      },
    ];

    const result = exporter.exportMultiple(sessions, { format: 'csv' });

    expect(result.filename).toMatch(/creative-thinking-sessions-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(result.mimeType).toBe('text/csv');
    expect(result.metadata?.sessionCount).toBe(3);

    const content = result.content.toString();
    const lines = content.split('\n');

    // May have an empty line at the end
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(content).toContain('minimal-session');
    expect(content).toContain('complex-session');
    expect(content).toContain('third-session');
  });

  it('should format dates consistently', async () => {
    const session = createMinimalSession();
    session.history = [
      {
        step: 1,
        timestamp: '2024-01-15T14:30:45.123Z',
        input: {
          technique: 'po',
          problem: 'Test',
          currentStep: 1,
          totalSteps: 4,
          output: 'Test',
          nextStepNeeded: true,
        },
        output: {},
      },
    ];

    const result = await exporter.export(session, { format: 'csv' });
    const content = result.content.toString();

    // Should contain formatted date (without checking exact format)
    expect(content).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('should handle technique display names correctly', async () => {
    // From BaseExporter.getTechniqueDisplayName()
    const techniqueMap = {
      six_hats: 'Six Thinking Hats',
      po: 'Provocative Operation (PO)',
      random_entry: 'Random Entry',
      scamper: 'SCAMPER',
      concept_extraction: 'Concept Extraction',
      yes_and: 'Yes, And...',
      // Others use technique.replace(/_/g, ' ').toUpperCase()
      design_thinking: 'DESIGN THINKING',
      triz: 'TRIZ',
      neural_state: 'NEURAL STATE',
      temporal_work: 'TEMPORAL WORK',
      cross_cultural: 'CROSS CULTURAL',
      collective_intel: 'COLLECTIVE INTEL',
      disney_method: 'DISNEY METHOD',
      nine_windows: 'NINE WINDOWS',
    };

    for (const [technique, displayName] of Object.entries(techniqueMap)) {
      const session: SessionState = {
        id: 'display-test',
        problem: 'Test',
        technique: technique as any,
        currentStep: 1,
        totalSteps: 1,
        history: [
          {
            step: 1,
            timestamp: new Date().toISOString(),
            input: {
              technique: technique as any,
              problem: 'Test',
              currentStep: 1,
              totalSteps: 1,
              output: 'Test',
              nextStepNeeded: false,
            },
            output: {},
          },
        ],
        branches: {},
        insights: [],
      };

      const result = await exporter.export(session, { format: 'csv' });
      const content = result.content.toString();

      expect(content).toContain(displayName);
    }
  });

  it('should handle very large sessions efficiently', async () => {
    const largeSession: SessionState = {
      id: 'large-session',
      problem: 'Large session test',
      technique: 'nine_windows',
      currentStep: 100,
      totalSteps: 100,
      history: [],
      branches: {},
      insights: [],
    };

    // Generate 100 history entries
    for (let i = 1; i <= 100; i++) {
      largeSession.history.push({
        step: i,
        timestamp: new Date(Date.now() + i * 60000).toISOString(),
        input: {
          technique: 'nine_windows',
          problem: 'Large session test',
          currentStep: i,
          totalSteps: 100,
          output: `Step ${i} output with some content`,
          nextStepNeeded: i < 100,
          risks: Array(5).fill(`Risk ${i}`),
          mitigations: Array(5).fill(`Mitigation ${i}`),
        },
        output: {},
      });
    }

    const startTime = Date.now();
    const result = await exporter.export(largeSession, { format: 'csv' });
    const exportTime = Date.now() - startTime;

    expect(exportTime).toBeLessThan(1000); // Should complete in under 1 second

    const content = result.content.toString();
    const lines = content.split('\n');

    expect(lines.length).toBe(101); // Header + 100 rows
    expect(content).toContain('Step 1 output');
    expect(content).toContain('Step 100 output');
  });

  it('should handle different export options combinations', async () => {
    const session = createComplexSession();

    const optionsCombinations = [
      { format: 'csv' },
      { format: 'csv', includeHistory: true },
      { format: 'csv', includeMetrics: false },
      { format: 'csv', includeHistory: true, includeMetrics: false },
    ];

    for (const options of optionsCombinations) {
      const result = await exporter.export(session, options);
      expect(result.content).toBeTruthy();
      expect(result.mimeType).toBe('text/csv');
    }
  });
});
