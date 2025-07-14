import { describe, it, expect } from 'vitest';
import { MarkdownExporter } from '../markdown-exporter.js';
import { SessionState } from '../../persistence/types.js';

describe('MarkdownExporter', () => {
  const exporter = new MarkdownExporter();

  const createTestSession = (): SessionState => ({
    id: 'test-session-123',
    problem: 'How to improve team collaboration',
    technique: 'six_hats',
    currentStep: 3,
    totalSteps: 6,
    history: [
      {
        step: 1,
        timestamp: '2024-01-15T10:00:00Z',
        input: {
          technique: 'six_hats',
          problem: 'How to improve team collaboration',
          currentStep: 1,
          totalSteps: 6,
          output: 'We need to analyze our collaboration systematically...',
          nextStepNeeded: true,
          hatColor: 'blue'
        },
        output: {
          technique: 'six_hats',
          problem: 'How to improve team collaboration',
          currentStep: 1,
          totalSteps: 6,
          output: 'We need to analyze our collaboration systematically...',
          nextStepNeeded: true,
          hatColor: 'blue'
        }
      },
      {
        step: 2,
        timestamp: '2024-01-15T10:05:00Z',
        input: {
          technique: 'six_hats',
          problem: 'How to improve team collaboration',
          currentStep: 2,
          totalSteps: 6,
          output: 'Current facts: 8 team members, 3 time zones, 2 weekly meetings',
          nextStepNeeded: true,
          hatColor: 'white',
          risks: ['Communication delays', 'Meeting fatigue'],
          mitigations: ['Async communication tools', 'Meeting recordings']
        },
        output: {
          technique: 'six_hats',
          problem: 'How to improve team collaboration',
          currentStep: 2,
          totalSteps: 6,
          output: 'Current facts: 8 team members, 3 time zones, 2 weekly meetings',
          nextStepNeeded: true,
          hatColor: 'white'
        }
      }
    ],
    branches: {},
    insights: ['Async communication is critical', 'Time zone awareness needed'],
    startTime: 1705316400000,
    metrics: {
      creativityScore: 75,
      risksCaught: 2,
      antifragileFeatures: 1
    },
    tags: ['collaboration', 'remote-work'],
    name: 'Team Collaboration Analysis'
  });

  it('should export session to markdown format', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, {
      format: 'markdown',
      includeMetadata: true,
      includeHistory: true,
      includeInsights: true,
      includeMetrics: true
    });

    expect(result.content).toBeTruthy();
    expect(result.filename).toMatch(/six-hats-.*\.md$/);
    expect(result.mimeType).toBe('text/markdown');
    expect(result.metadata?.sessionId).toBe('test-session-123');
  });

  it('should include session metadata in markdown', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'markdown' });
    
    const content = result.content.toString();
    expect(content).toContain('# How to improve team collaboration');
    expect(content).toContain('Six Thinking Hats');
    expect(content).toContain('**Session ID**: test-session-123');
    expect(content).toContain('**Steps Completed**: 3/6');
  });

  it('should format history entries with technique-specific details', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'markdown' });
    
    const content = result.content.toString();
    expect(content).toContain('🔵 Step 1');
    expect(content).toContain('BLUE HAT - Process Control');
    expect(content).toContain('⚪ Step 2');
    expect(content).toContain('WHITE HAT - Facts & Information');
  });

  it('should include risks and mitigations when present', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'markdown' });
    
    const content = result.content.toString();
    expect(content).toContain('⚠️ Risks Identified');
    expect(content).toContain('Communication delays');
    expect(content).toContain('✅ Mitigations');
    expect(content).toContain('Async communication tools');
  });

  it('should include insights section', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { format: 'markdown' });
    
    const content = result.content.toString();
    expect(content).toContain('## Key Insights');
    expect(content).toContain('Async communication is critical');
    expect(content).toContain('Time zone awareness needed');
  });

  it('should include metrics when enabled', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { 
      format: 'markdown',
      includeMetrics: true 
    });
    
    const content = result.content.toString();
    expect(content).toContain('## Performance Metrics');
    expect(content).toContain('**Creativity Score**: 75');
    expect(content).toContain('**Risks Identified**: 2');
  });

  it('should handle empty insights gracefully', async () => {
    const session = createTestSession();
    session.insights = [];
    const result = await exporter.export(session, { format: 'markdown' });
    
    const content = result.content.toString();
    expect(content).not.toContain('## Key Insights');
  });

  it('should respect export options', async () => {
    const session = createTestSession();
    const result = await exporter.export(session, { 
      format: 'markdown',
      includeHistory: false,
      includeInsights: false,
      includeMetrics: false
    });
    
    const content = result.content.toString();
    expect(content).not.toContain('## Thinking Process');
    expect(content).not.toContain('## Key Insights');
    expect(content).not.toContain('## Performance Metrics');
  });
});