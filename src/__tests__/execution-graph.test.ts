/**
 * Tests for DAG-based execution graph generation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LateralThinkingServer } from '../index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';

describe('Execution Graph Generation', () => {
  let server: LateralThinkingServer;

  beforeEach(() => {
    server = new LateralThinkingServer();
  });

  it('should generate execution graph with parallel nodes for Six Hats', () => {
    const planInput = {
      problem: 'How to improve team communication?',
      techniques: ['six_hats' as any],
    };

    const result = server.planThinkingSession(planInput);
    const response = JSON.parse(result.content[0].text) as PlanThinkingSessionOutput;

    expect(response.executionGraph).toBeDefined();
    expect(response.executionGraph?.nodes).toHaveLength(7); // 7 hats (includes Purple Hat)

    // All Six Hats nodes should have no dependencies (can run in parallel)
    response.executionGraph?.nodes.forEach(node => {
      expect(node.dependencies).toEqual([]);
      expect(node.technique).toBe('six_hats');
      expect(node.parameters.planId).toBe(response.planId);
      expect(node.parameters.problem).toBe(planInput.problem);
    });

    // Check metadata
    expect(response.executionGraph?.metadata.maxParallelism).toBe(7);
    expect(response.executionGraph?.metadata.totalNodes).toBe(7);

    // Check instructions
    expect(response.executionGraph?.instructions.forInvoker).toContain('DAG');
    expect(response.executionGraph?.instructions.forInvoker).toContain('parallel');
    expect(response.executionGraph?.instructions.executionStrategy).toBe('parallel-capable');
  });

  it('should generate execution graph with sequential nodes for Design Thinking', () => {
    const planInput = {
      problem: 'Design a new mobile app',
      techniques: ['design_thinking' as any],
    };

    const result = server.planThinkingSession(planInput);
    const response = JSON.parse(result.content[0].text) as PlanThinkingSessionOutput;

    expect(response.executionGraph).toBeDefined();
    expect(response.executionGraph?.nodes).toHaveLength(5); // 5 stages

    // Design Thinking nodes should have sequential dependencies
    response.executionGraph?.nodes.forEach((node, index) => {
      if (index === 0) {
        expect(node.dependencies).toEqual([]);
      } else {
        expect(node.dependencies).toEqual([`node-${index}`]);
      }
      expect(node.technique).toBe('design_thinking');
    });

    // Check metadata
    expect(response.executionGraph?.metadata.maxParallelism).toBe(1);
    expect(response.executionGraph?.metadata.criticalPath).toHaveLength(5);
  });

  it('should include complete parameters for each node', () => {
    const planInput = {
      problem: 'Brainstorm product improvements',
      techniques: ['scamper' as any],
    };

    const result = server.planThinkingSession(planInput);
    const response = JSON.parse(result.content[0].text) as PlanThinkingSessionOutput;

    expect(response.executionGraph).toBeDefined();

    // Check that SCAMPER nodes have proper action parameters
    const scamperActions = [
      'substitute',
      'combine',
      'adapt',
      'modify',
      'put_to_other_use',
      'eliminate',
      'reverse',
      'parameterize',
    ];

    response.executionGraph?.nodes.forEach((node, index) => {
      expect(node.parameters.planId).toBe(response.planId);
      expect(node.parameters.technique).toBe('scamper');
      expect(node.parameters.problem).toBe(planInput.problem);
      expect(node.parameters.currentStep).toBe(index + 1);
      expect(node.parameters.totalSteps).toBe(8);
      expect(node.parameters.scamperAction).toBe(scamperActions[index]);
      expect(node.parameters.nextStepNeeded).toBe(index < 7);
    });
  });

  it('should generate parallelizable groups correctly', () => {
    const planInput = {
      problem: 'Analyze system from multiple perspectives',
      techniques: ['nine_windows' as any],
    };

    const result = server.planThinkingSession(planInput);
    const response = JSON.parse(result.content[0].text) as PlanThinkingSessionOutput;

    expect(response.executionGraph).toBeDefined();
    expect(response.executionGraph?.nodes).toHaveLength(9); // 3x3 matrix

    // All Nine Windows nodes should be parallelizable
    const groups = response.executionGraph?.metadata.parallelizableGroups;
    expect(groups).toBeDefined();
    expect(groups?.[0]).toHaveLength(9); // All 9 nodes in one parallel group

    // Verify each node has the correct cell parameters
    response.executionGraph?.nodes.forEach(node => {
      expect(node.parameters.currentCell).toBeDefined();
      expect(node.parameters.currentCell.systemLevel).toMatch(/^(sub-system|system|super-system)$/);
      expect(node.parameters.currentCell.timeFrame).toMatch(/^(past|present|future)$/);
    });
  });

  it('should handle multiple techniques in one plan', () => {
    const planInput = {
      problem: 'Complex problem requiring multiple approaches',
      techniques: ['po' as any, 'random_entry' as any],
    };

    const result = server.planThinkingSession(planInput);
    const response = JSON.parse(result.content[0].text) as PlanThinkingSessionOutput;

    expect(response.executionGraph).toBeDefined();

    // PO has 4 steps, Random Entry has 3 steps
    expect(response.executionGraph?.nodes).toHaveLength(7);

    // Check that nodes are properly numbered
    let poCount = 0;
    let randomEntryCount = 0;

    response.executionGraph?.nodes.forEach(node => {
      if (node.technique === 'po') poCount++;
      if (node.technique === 'random_entry') randomEntryCount++;

      // All nodes should have sequential step numbers
      expect(node.stepNumber).toBeGreaterThan(0);
      expect(node.stepNumber).toBeLessThanOrEqual(7);
    });

    expect(poCount).toBe(4);
    expect(randomEntryCount).toBe(3);
  });
});
