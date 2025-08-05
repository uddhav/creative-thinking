/**
 * Tests for LLM Handoff Bridge
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LLMHandoffBridge } from '../../../layers/execution/LLMHandoffBridge.js';
import { SessionManager } from '../../../core/SessionManager.js';
import { MetricsCollector } from '../../../core/MetricsCollector.js';
import type { ParallelResult } from '../../../types/handoff.js';

describe('LLMHandoffBridge', () => {
  let bridge: LLMHandoffBridge;
  let sessionManager: SessionManager;
  let metricsCollector: MetricsCollector;

  beforeEach(() => {
    sessionManager = new SessionManager();
    metricsCollector = new MetricsCollector();
    bridge = new LLMHandoffBridge(sessionManager, metricsCollector);
  });

  describe('prepareHandoff', () => {
    it('should create a complete handoff package', () => {
      const mockResults: ParallelResult[] = [
        {
          planId: 'plan_1',
          technique: 'six_hats',
          results: {
            ideas: ['Idea 1', 'Idea 2'],
            risks: ['Risk 1'],
          },
          insights: ['Blue hat insight', 'Red hat insight'],
          metrics: {
            completedSteps: 6,
            totalSteps: 6,
            confidence: 0.8,
          },
        },
        {
          planId: 'plan_2',
          technique: 'scamper',
          results: {
            modifications: ['Mod 1', 'Mod 2', 'Mod 3'],
          },
          insights: ['SCAMPER insight 1', 'SCAMPER insight 2'],
          metrics: {
            completedSteps: 4,
            totalSteps: 8,
            confidence: 0.6,
          },
        },
      ];

      const handoff = bridge.prepareHandoff(mockResults, 'Test problem');

      expect(handoff).toBeDefined();
      expect(handoff.handoffId).toMatch(/^handoff_/);
      expect(handoff.contextSummary.problem).toBe('Test problem');
      expect(handoff.contextSummary.techniqueCount).toBe(2);
      expect(handoff.structuredResults).toBeDefined();
      expect(handoff.synthesisPrompts.length).toBeGreaterThan(0);
      expect(handoff.visualizations.length).toBeGreaterThan(0);
      expect(handoff.suggestedActions.length).toBeGreaterThan(0);
    });

    it('should handle different structured formats', () => {
      const mockResults: ParallelResult[] = [
        {
          planId: 'plan_1',
          technique: 'po',
          results: { provocations: ['What if...'] },
          insights: ['Provocation insight'],
        },
      ];

      // Test hierarchical format
      const hierarchical = bridge.prepareHandoff(mockResults, 'Test', {
        structuredFormat: 'hierarchical',
      });
      expect(hierarchical.structuredResults.type).toBe('hierarchical');

      // Test flat format
      const flat = bridge.prepareHandoff(mockResults, 'Test', {
        structuredFormat: 'flat',
      });
      expect(flat.structuredResults.type).toBe('flat');

      // Test comparative format
      const comparative = bridge.prepareHandoff(mockResults, 'Test', {
        structuredFormat: 'comparative',
      });
      expect(comparative.structuredResults.type).toBe('comparative');

      // Test narrative format
      const narrative = bridge.prepareHandoff(mockResults, 'Test', {
        structuredFormat: 'narrative',
      });
      expect(narrative.structuredResults.type).toBe('narrative');
    });

    it('should use different prompt strategies', () => {
      const mockResults: ParallelResult[] = [
        {
          planId: 'plan_1',
          technique: 'triz',
          results: { principles: ['Remove harmful functions'] },
          insights: ['TRIZ insight'],
        },
      ];

      const strategies = ['comprehensive', 'focused', 'action_oriented', 'risk_aware'] as const;

      for (const strategy of strategies) {
        const handoff = bridge.prepareHandoff(mockResults, 'Test', {
          promptStrategy: strategy,
        });

        const prompts = handoff.synthesisPrompts;
        expect(prompts.length).toBeGreaterThan(0);

        // Check that prompts match the strategy
        if (strategy === 'risk_aware') {
          expect(prompts.some(p => p.prompt.toLowerCase().includes('risk'))).toBe(true);
        }
        if (strategy === 'action_oriented') {
          expect(prompts.some(p => p.prompt.toLowerCase().includes('action'))).toBe(true);
        }
      }
    });

    it('should handle empty results gracefully', () => {
      const handoff = bridge.prepareHandoff([], 'Empty test');

      expect(handoff).toBeDefined();
      expect(handoff.contextSummary.techniqueCount).toBe(0);
      expect(handoff.structuredResults).toBeDefined();
    });

    it('should include raw results when requested', () => {
      const mockResults: ParallelResult[] = [
        {
          planId: 'plan_1',
          technique: 'random_entry',
          results: { stimulus: 'Random word' },
          insights: ['Random insight'],
        },
      ];

      const handoff = bridge.prepareHandoff(mockResults, 'Test', {
        includeRawData: true,
      });

      expect(handoff.rawResults).toBeDefined();
      expect(handoff.rawResults).toEqual(mockResults);
    });

    it('should handle complex nested results', () => {
      const complexResults: ParallelResult[] = [
        {
          planId: 'plan_1',
          technique: 'design_thinking',
          results: {
            empathy: {
              userNeeds: ['Need 1', 'Need 2'],
              painPoints: ['Pain 1', 'Pain 2'],
            },
            ideation: {
              ideas: [
                { id: '1', description: 'Idea 1', votes: 5 },
                { id: '2', description: 'Idea 2', votes: 3 },
              ],
            },
            prototype: {
              description: 'MVP prototype',
              features: ['Feature 1', 'Feature 2'],
            },
          },
          insights: [
            'User needs focused on simplicity',
            'Rapid prototyping revealed technical constraints',
          ],
          metrics: {
            completedSteps: 5,
            totalSteps: 5,
            confidence: 0.9,
          },
        },
      ];

      const handoff = bridge.prepareHandoff(complexResults, 'Complex test');

      expect(handoff).toBeDefined();
      expect(handoff.metadata.techniquePerformance[0].completeness).toBe(1.0);
      expect(handoff.metadata.qualityIndicators.overall).toBeGreaterThan(0);
    });

    it('should generate appropriate visualizations', () => {
      const mockResults: ParallelResult[] = [
        {
          planId: 'plan_1',
          technique: 'six_hats',
          results: { perspectives: 6 },
          insights: ['Insight 1', 'Insight 2'],
          metrics: { confidence: 0.8 },
        },
        {
          planId: 'plan_2',
          technique: 'scamper',
          results: { modifications: 5 },
          insights: ['Insight 3'],
          metrics: { confidence: 0.6 },
        },
      ];

      const handoff = bridge.prepareHandoff(mockResults, 'Viz test');

      const vizTypes = handoff.visualizations.map(v => v.type);
      expect(vizTypes).toContain('comparison_chart');

      // Should have at least one visualization
      expect(handoff.visualizations.length).toBeGreaterThanOrEqual(1);
    });

    it('should suggest appropriate next actions', () => {
      const mockResults: ParallelResult[] = [
        {
          planId: 'plan_1',
          technique: 'concept_extraction',
          results: {
            concepts: ['Pattern 1', 'Pattern 2'],
            abstractions: ['Abstract concept'],
          },
          insights: [
            'Identified reusable pattern for authentication',
            'Abstract principle can be applied to other domains',
          ],
        },
      ];

      const handoff = bridge.prepareHandoff(mockResults, 'Pattern test');

      const suggestedTools = handoff.suggestedActions.map(a => a.tool);

      // Should suggest memory creation for patterns
      expect(suggestedTools).toContain('mcp__memory__create_entities');
    });

    it('should handle different summary depths', () => {
      const mockResults: ParallelResult[] = [
        {
          planId: 'plan_1',
          technique: 'nine_windows',
          results: {
            matrix: Array(9).fill({ content: 'Cell content' }),
          },
          insights: Array(10).fill('Detailed insight'),
        },
      ];

      const highDepth = bridge.prepareHandoff(mockResults, 'Test', {
        summaryDepth: 'high',
      });
      const lowDepth = bridge.prepareHandoff(mockResults, 'Test', {
        summaryDepth: 'low',
      });

      // High depth should include more details
      expect(highDepth.contextSummary.keyFindings.length).toBeGreaterThanOrEqual(
        lowDepth.contextSummary.keyFindings.length
      );
    });
  });
});
