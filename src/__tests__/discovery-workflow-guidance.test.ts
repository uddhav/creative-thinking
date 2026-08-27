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
      // Points at the execution graph rather than re-offering the techniques
      // already in suggestedParameters. That sentence read as an alternative
      // back when the suggestion was a three-item slice; now that it carries
      // every recommendation, offering the same list again said nothing.
      expect(response.nextStepGuidance?.alternativeApproach).toContain('executionGraph');
    }
  });

  it('does not put a timeframe in the suggested call', () => {
    // `timeframe` is a plan_thinking_session parameter, not a discovery one,
    // so discovery has nothing to echo and used to derive a value instead.
    // The caller chooses it at plan time; a server guess in the field labelled
    // "your next call" reads as an instruction.
    const input: DiscoverTechniquesInput = {
      problem: 'Urgent deadline for project completion',
      constraints: ['Must complete by end of day'],
    };

    const result = server.discoverTechniques(input);
    const response = JSON.parse(result.content[0].text) as DiscoveryResponse;

    // The signal itself still has to be reported — it is real, and dropping
    // the derived parameter must not take the observation with it.
    expect(response.contextAnalysis?.timeConstraint).toBe(true);
    expect(response.nextStepGuidance?.suggestedParameters.timeframe).toBeUndefined();
  });

  it('does not invent objectives, and still reports that collaboration is needed', () => {
    // Same shape as the timeframe case: `objectives` is not a discovery input.
    // Deriving it from `collaborationNeeded` is what proposed "Achieve team
    // consensus" for a solo planning problem in a production session.
    const input: DiscoverTechniquesInput = {
      problem: 'Team collaboration and stakeholder alignment',
      context: 'Multiple team members need to contribute',
    };

    const result = server.discoverTechniques(input);
    const response = JSON.parse(result.content[0].text) as DiscoveryResponse;

    expect(response.contextAnalysis?.collaborationNeeded).toBe(true);
    expect(response.nextStepGuidance?.suggestedParameters.objectives).toBeUndefined();
  });

  it("echoes the caller's constraints into the suggested call", () => {
    const constraints = ['Must complete by end of day', 'No external vendors'];
    const input: DiscoverTechniquesInput = {
      problem: 'Urgent deadline for project completion',
      constraints,
    };

    const result = server.discoverTechniques(input);
    const response = JSON.parse(result.content[0].text) as DiscoveryResponse;

    // Previously this field was `warnings.filter(w => w.includes('constraint'))`
    // — the server's own remarks about constraints, not the caller's.
    expect(response.nextStepGuidance?.suggestedParameters.constraints).toEqual(constraints);
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
