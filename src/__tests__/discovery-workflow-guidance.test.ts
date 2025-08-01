/**
 * Tests for discovery workflow guidance (Issue #112)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type { DiscoverTechniquesInput } from '../types/planning.js';

interface DiscoveryResponse {
  recommendations: Array<{
    technique: string;
    reasoning: string;
    effectiveness: number;
  }>;
  reasoning: string;
  suggestedWorkflow?: string;
  nextStepGuidance?: {
    message: string;
    nextTool: string;
    suggestedParameters: {
      problem: string;
      techniques: string[];
      objectives?: string[];
      constraints?: string[];
      timeframe?: string;
    };
    example: {
      tool: string;
      parameters: {
        problem: string;
        techniques: string[];
        objectives?: string[];
        timeframe?: string;
      };
    };
    alternativeApproach?: string;
  };
  problemCategory: string;
  warnings?: string[];
  contextAnalysis?: {
    complexity: string;
    timeConstraint: boolean;
    collaborationNeeded: boolean;
    flexibilityScore?: number;
  };
}

describe('Discovery Workflow Guidance', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  it('should provide next step guidance for single technique recommendation', () => {
    const input: DiscoverTechniquesInput = {
      problem: 'How to improve team dynamics',
    };

    const result = server.discoverTechniques(input);
    expect(result.isError).toBeFalsy();

    const response = JSON.parse(result.content[0].text) as DiscoveryResponse;

    // Verify next step guidance exists
    expect(response.nextStepGuidance).toBeDefined();
    expect(response.nextStepGuidance?.message).toContain('plan_thinking_session');
    expect(response.nextStepGuidance?.nextTool).toBe('plan_thinking_session');

    // Verify suggested parameters
    expect(response.nextStepGuidance?.suggestedParameters).toBeDefined();
    expect(response.nextStepGuidance?.suggestedParameters.problem).toBe(input.problem);
    expect(response.nextStepGuidance?.suggestedParameters.techniques).toBeInstanceOf(Array);
    expect(response.nextStepGuidance?.suggestedParameters.techniques.length).toBeGreaterThan(0);

    // Verify example is provided
    expect(response.nextStepGuidance?.example).toBeDefined();
    expect(response.nextStepGuidance?.example.tool).toBe('plan_thinking_session');
    expect(response.nextStepGuidance?.example.parameters.problem).toBe(input.problem);
  });

  it('should provide guidance for multiple technique recommendations', () => {
    const input: DiscoverTechniquesInput = {
      problem: 'Complex challenge requiring creative solutions and systematic analysis',
      preferredOutcome: 'systematic',
    };

    const result = server.discoverTechniques(input);
    const response = JSON.parse(result.content[0].text) as DiscoveryResponse;

    expect(response.nextStepGuidance).toBeDefined();
    if (response.recommendations.length > 1) {
      expect(response.nextStepGuidance?.message).toContain('these techniques');
      expect(response.nextStepGuidance?.alternativeApproach).toBeDefined();
      expect(response.nextStepGuidance?.alternativeApproach).toContain('multiple techniques');
    }
  });

  it('should adjust timeframe based on time constraints', () => {
    const input: DiscoverTechniquesInput = {
      problem: 'Urgent deadline for project completion',
      constraints: ['Must complete by end of day'],
    };

    const result = server.discoverTechniques(input);
    const response = JSON.parse(result.content[0].text) as DiscoveryResponse;

    expect(response.contextAnalysis?.timeConstraint).toBe(true);
    expect(response.nextStepGuidance?.suggestedParameters.timeframe).toBe('quick');
  });

  it('should suggest collaborative objectives when needed', () => {
    const input: DiscoverTechniquesInput = {
      problem: 'Team collaboration and stakeholder alignment',
      context: 'Multiple team members need to contribute',
    };

    const result = server.discoverTechniques(input);
    const response = JSON.parse(result.content[0].text) as DiscoveryResponse;

    expect(response.contextAnalysis?.collaborationNeeded).toBe(true);
    expect(response.nextStepGuidance?.suggestedParameters.objectives).toContain(
      'Achieve team consensus'
    );
    expect(response.nextStepGuidance?.suggestedParameters.objectives).toContain(
      'Generate diverse perspectives'
    );
  });

  it('should not provide guidance when no techniques are recommended', () => {
    // This is a edge case - in practice, we always recommend something
    // But we'll test with an empty mock response
    const mockDiscoveryOutput = {
      problem: 'Test problem',
      problemCategory: 'general',
      recommendations: [],
    };

    const builder = server['responseBuilder'];
    const response = builder.buildDiscoveryResponse(mockDiscoveryOutput as any);
    const parsed = JSON.parse(response.content[0].text) as DiscoveryResponse;

    expect(parsed.nextStepGuidance).toBeUndefined();
  });

  it('should include all recommended techniques in suggested parameters', () => {
    const input: DiscoverTechniquesInput = {
      problem: 'Design a new user experience for our product',
      preferredOutcome: 'innovative',
    };

    const result = server.discoverTechniques(input);
    const response = JSON.parse(result.content[0].text) as DiscoveryResponse;

    const recommendedTechniques = response.recommendations.map(r => r.technique);
    const suggestedTechniques = response.nextStepGuidance?.suggestedParameters.techniques || [];

    // All suggested techniques should be from recommendations
    suggestedTechniques.forEach(tech => {
      expect(recommendedTechniques).toContain(tech);
    });

    // Should include top recommendations (up to 3)
    expect(suggestedTechniques.length).toBeLessThanOrEqual(3);
    expect(suggestedTechniques.length).toBeLessThanOrEqual(recommendedTechniques.length);
  });
});
