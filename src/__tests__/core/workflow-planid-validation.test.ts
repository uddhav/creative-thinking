/**
 * Test that WorkflowGuard correctly validates planId existence
 * and doesn't reject valid sessions after the time window
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowGuard } from '../../core/WorkflowGuard.js';
import { SessionManager } from '../../core/SessionManager.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';

describe('WorkflowGuard PlanId Validation', () => {
  let workflowGuard: WorkflowGuard;
  let sessionManager: SessionManager;

  beforeEach(() => {
    workflowGuard = new WorkflowGuard();
    sessionManager = new SessionManager();
    workflowGuard.setSessionManager(sessionManager);
  });

  it('should accept execute_thinking_step with valid planId even without recent calls', () => {
    // Create a plan directly in SessionManager (simulating an existing session)
    const planId = 'plan_test_12345';
    const plan: PlanThinkingSessionOutput = {
      planId,
      problem: 'Test problem',
      techniques: ['six_hats'],
      recommendedStrategy: 'sequential',
      executionGraph: {
        nodes: [],
        edges: [],
        entryNodes: [],
        exitNodes: [],
      },
      estimatedTime: {
        sequential: 30,
        parallel: 30,
      },
      createdAt: Date.now(),
    };

    sessionManager.storePlan(planId, plan);

    // Try to execute without any recent discovery/planning calls
    const args = {
      planId,
      technique: 'six_hats',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 6,
      output: 'Test output',
      nextStepNeeded: true,
    };

    const violation = workflowGuard.checkWorkflowViolation('execute_thinking_step', args);

    // Should NOT have a violation since the planId exists
    expect(violation).toBeNull();
  });

  it('should reject execute_thinking_step with invalid planId and no recent calls', () => {
    // Try to execute with a fake planId and no recent calls
    const args = {
      planId: 'plan_fake_99999',
      technique: 'six_hats',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 6,
      output: 'Test output',
      nextStepNeeded: true,
    };

    const violation = workflowGuard.checkWorkflowViolation('execute_thinking_step', args);

    // Should have a violation since the planId doesn't exist and no recent calls
    expect(violation).not.toBeNull();
    expect(violation?.type).toBe('skipped_discovery');
  });

  it('should accept execute_thinking_step after recording discovery and planning', () => {
    // Record discovery and planning calls
    workflowGuard.recordCall('discover_techniques', { problem: 'Test problem' });
    workflowGuard.recordCall('plan_thinking_session', {
      problem: 'Test problem',
      techniques: ['six_hats'],
    });

    // Try to execute even without a valid planId in SessionManager
    const args = {
      planId: 'plan_new_12345',
      technique: 'six_hats',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 6,
      output: 'Test output',
      nextStepNeeded: true,
    };

    const violation = workflowGuard.checkWorkflowViolation('execute_thinking_step', args);

    // Should NOT have a violation since recent calls exist
    expect(violation).toBeNull();
  });

  it('should handle missing SessionManager gracefully', () => {
    // Create a new WorkflowGuard without SessionManager
    const guardWithoutManager = new WorkflowGuard();

    // Try to execute with a planId but no SessionManager
    const args = {
      planId: 'plan_test_12345',
      technique: 'six_hats',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 6,
      output: 'Test output',
      nextStepNeeded: true,
    };

    const violation = guardWithoutManager.checkWorkflowViolation('execute_thinking_step', args);

    // Should have a violation since no SessionManager and no recent calls
    expect(violation).not.toBeNull();
    expect(violation?.type).toBe('skipped_discovery');
  });

  it('should validate technique even with valid planId', () => {
    // Create a plan in SessionManager
    const planId = 'plan_test_12345';
    const plan: PlanThinkingSessionOutput = {
      planId,
      problem: 'Test problem',
      techniques: ['six_hats'],
      recommendedStrategy: 'sequential',
      executionGraph: {
        nodes: [],
        edges: [],
        entryNodes: [],
        exitNodes: [],
      },
      estimatedTime: {
        sequential: 30,
        parallel: 30,
      },
      createdAt: Date.now(),
    };

    sessionManager.storePlan(planId, plan);

    // Try to execute with invalid technique
    const args = {
      planId,
      technique: 'invalid_technique',
      problem: 'Test problem',
      currentStep: 1,
      totalSteps: 6,
      output: 'Test output',
      nextStepNeeded: true,
    };

    const violation = workflowGuard.checkWorkflowViolation('execute_thinking_step', args);

    // Should have a violation for invalid technique
    expect(violation).not.toBeNull();
    expect(violation?.type).toBe('invalid_technique');
  });
});
