/**
 * Tests for ResponseBuilder
 * Ensures proper formatting of responses for all MCP tools
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseBuilder } from '../../core/ResponseBuilder.js';
import { CreativeThinkingError, ErrorCode } from '../../errors/types.js';
import type { SessionData, ThinkingOperationData } from '../../types/index.js';
import type { DiscoverTechniquesOutput, PlanThinkingSessionOutput } from '../../types/planning.js';
import {
  parseErrorResponse,
  parseDiscoveryResponse,
  parseComplexObject,
  parseGenericResponse,
  parsePlanningTestResponse,
  parseExecutionTestResponse,
  parseSessionOperationResponse,
  type TestErrorData,
} from '../helpers/json-types.js';

describe('ResponseBuilder', () => {
  let builder: ResponseBuilder;

  beforeEach(() => {
    builder = new ResponseBuilder();
  });

  describe('buildSuccessResponse', () => {
    it('should build a success response with formatted content', () => {
      const content = { message: 'Success', data: [1, 2, 3] };
      const response = builder.buildSuccessResponse(content);

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(content, null, 2),
          },
        ],
      });
    });

    it('should handle null content', () => {
      const response = builder.buildSuccessResponse(null);

      expect(response.content[0].text).toBe('null');
    });

    it('should handle undefined content', () => {
      const response = builder.buildSuccessResponse(undefined);

      expect(response.content[0].text).toBe(undefined);
    });

    it('should handle complex nested objects', () => {
      const complexObject = {
        level1: {
          level2: {
            array: [1, 2, { nested: true }],
            value: 'test',
          },
        },
      };
      const response = builder.buildSuccessResponse(complexObject);

      expect(parseComplexObject(response.content[0].text)).toEqual(complexObject);
    });
  });

  describe('buildErrorResponse', () => {
    it('should build error response for CreativeThinkingError', () => {
      const error = new CreativeThinkingError(ErrorCode.INVALID_INPUT, 'Test error', 'discovery', {
        detail: 'test',
      });
      const response = builder.buildErrorResponse(error, 'discovery');

      expect(response.isError).toBe(true);
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');

      const errorData = parseGenericResponse<TestErrorData>(response.content[0].text);
      expect(errorData.error.code).toBe(ErrorCode.INVALID_INPUT);
      expect(errorData.error.message).toBe('Test error');
      expect(errorData.error.details).toEqual({ detail: 'test' });
      expect(errorData.error.layer).toBe('discovery');
      expect(typeof errorData.error.timestamp).toBe('string');
    });

    it('should build error response for standard Error', () => {
      const error = new Error('Standard error');
      const response = builder.buildErrorResponse(error, 'execution');

      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: {
                  message: 'Standard error',
                  layer: 'execution',
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      });
    });

    it('should handle errors with no message', () => {
      const error = new Error();
      const response = builder.buildErrorResponse(error, 'planning');

      const parsed = parseErrorResponse(response.content[0].text);
      expect(parsed.error.message).toBe('');
      expect(parsed.error.layer).toBe('planning');
    });
  });

  describe('buildDiscoveryResponse', () => {
    it('should build discovery response with all fields', () => {
      const discoveryOutput: DiscoverTechniquesOutput = {
        problem: 'How to improve team creativity',
        recommendations: [
          { technique: 'six_hats', score: 0.9, rationale: 'Good for team discussions' },
          { technique: 'po', score: 0.8, rationale: 'Helps challenge assumptions' },
        ],
        problemCategory: 'team_collaboration',
        warnings: ['Consider time constraints'],
        contextAnalysis: {
          keywords: ['team', 'creativity'],
          domain: 'organizational',
          complexity: 'medium',
        },
        complexityAssessment: {
          score: 0.6,
          factors: ['Multiple stakeholders', 'Abstract problem'],
          suggestedApproach: 'iterative',
        },
        workflow: {
          phases: [
            { name: 'Divergent', techniques: ['six_hats', 'random_entry'] },
            { name: 'Convergent', techniques: ['po'] },
          ],
          estimatedTime: '2 hours',
        },
      };

      const response = builder.buildDiscoveryResponse(discoveryOutput);
      const parsed = parseDiscoveryResponse(response.content[0].text);

      expect(parsed.recommendations).toEqual(discoveryOutput.recommendations);
      expect(parsed.problemCategory).toBe('team_collaboration');
      expect(parsed.warnings).toEqual(['Consider time constraints']);
      expect(parsed.reasoning).toContain('How to improve team creativity');
      expect(parsed.suggestedWorkflow).toContain('Divergent');
      expect(parsed.complexityAssessment).toEqual(discoveryOutput.complexityAssessment);
    });

    it('should handle minimal discovery output', () => {
      const minimalOutput: DiscoverTechniquesOutput = {
        problem: 'Test problem',
        recommendations: [],
      };

      const response = builder.buildDiscoveryResponse(minimalOutput);
      const parsed = parseDiscoveryResponse(response.content[0].text);

      expect(parsed.recommendations).toEqual([]);
      expect(parsed.reasoning).toBe('No specific techniques recommended for this problem.');
      expect(parsed.suggestedWorkflow).toBeUndefined();
    });
  });

  describe('buildPlanningResponse', () => {
    it('should build planning response with flattened workflow', () => {
      const planOutput: PlanThinkingSessionOutput = {
        planId: 'test-plan-123',
        problem: 'How to improve team productivity?',
        techniques: ['six_hats', 'po'],
        workflow: [
          {
            technique: 'six_hats',
            steps: [
              {
                stepNumber: 1,
                description: 'Blue hat thinking',
                expectedOutput: 'Process overview',
                risks: ['May be too abstract'],
              },
              {
                stepNumber: 2,
                description: 'White hat thinking',
                expectedOutput: 'Facts and data',
                risks: [],
              },
            ],
          },
          {
            technique: 'po',
            steps: [
              {
                stepNumber: 1,
                description: 'Create provocation',
                expectedOutput: 'Provocative statement',
                risks: ['May seem unrealistic'],
              },
            ],
          },
        ],
        estimatedSteps: 3,
        totalSteps: 3,
        estimatedTotalTime: '15 minutes',
        objectives: ['Explore problem space', 'Generate ideas'],
        constraints: ['Limited time'],
        successMetrics: ['Number of ideas', 'Feasibility score'],
        createdAt: Date.now(),
      };

      const response = builder.buildPlanningResponse(planOutput);
      const parsed = parsePlanningTestResponse(response.content[0].text);

      expect(parsed.planId).toBe('test-plan-123');
      expect(parsed.workflow).toHaveLength(3);
      expect(parsed.workflow[0]).toEqual({
        stepNumber: 1,
        technique: 'six_hats',
        description: 'Blue hat thinking',
        expectedDuration: '5 minutes',
        riskConsiderations: ['May be too abstract'],
        totalSteps: 2,
        expectedOutputs: ['Process overview'],
      });
      expect(parsed.estimatedSteps).toBe(3);
      expect(parsed.estimatedDuration).toBe('15 minutes');
      expect(parsed.objectives).toEqual(['Explore problem space', 'Generate ideas']);
    });

    it('should handle empty workflow', () => {
      const emptyPlan: PlanThinkingSessionOutput = {
        planId: 'empty-plan',
        problem: 'Empty problem',
        techniques: [],
        workflow: [],
        estimatedSteps: 0,
        totalSteps: 0,
      };

      const response = builder.buildPlanningResponse(emptyPlan);
      const parsed = parsePlanningTestResponse(response.content[0].text);

      expect(parsed.workflow).toEqual([]);
      expect(parsed.estimatedSteps).toBe(0);
    });

    it('should include execution guidance in planning response', () => {
      const planOutput: PlanThinkingSessionOutput = {
        planId: 'test-plan-456',
        problem: 'How to improve team communication?',
        techniques: ['six_hats'],
        workflow: [
          {
            technique: 'six_hats',
            steps: [
              {
                stepNumber: 1,
                description: 'Blue hat: Define the process',
                expectedOutput: 'Process definition',
              },
            ],
            estimatedTime: '30 minutes',
            requiredInputs: ['Problem statement'],
            expectedOutputs: ['Solution'],
          },
        ],
        estimatedSteps: 1,
        totalSteps: 1,
        estimatedTotalTime: '30 minutes',
        createdAt: Date.now(),
      };

      const response = builder.buildPlanningResponse(planOutput);
      const parsed = JSON.parse(response.content[0].text) as Record<string, unknown>;

      // Check that nextSteps guidance is included
      expect(parsed.nextSteps).toBeDefined();
      expect(parsed.nextSteps.instructions).toContain('execute_thinking_step');
      expect(parsed.nextSteps.firstCall).toBeDefined();
      expect(parsed.nextSteps.firstCall.tool).toBe('execute_thinking_step');
      expect(parsed.nextSteps.firstCall.parameters).toBeDefined();
      expect(parsed.nextSteps.firstCall.parameters.planId).toBe('test-plan-456');
      expect(parsed.nextSteps.firstCall.parameters.technique).toBe('six_hats');
      expect(parsed.nextSteps.firstCall.parameters.problem).toBe(
        'How to improve team communication?'
      );
      expect(parsed.nextSteps.firstCall.parameters.currentStep).toBe(1);
      expect(parsed.nextSteps.guidance).toContain('Continue calling execute_thinking_step');
    });

    it('should not include nextSteps for empty techniques array', () => {
      const planOutput: PlanThinkingSessionOutput = {
        planId: 'test-plan-789',
        problem: 'Some problem',
        techniques: [], // Empty techniques
        workflow: [],
        estimatedSteps: 0,
        totalSteps: 0,
        estimatedTotalTime: '0 minutes',
        createdAt: Date.now(),
      };

      const response = builder.buildPlanningResponse(planOutput);
      const parsed = JSON.parse(response.content[0].text) as Record<string, unknown>;

      // Should not include nextSteps when no techniques
      expect(parsed.nextSteps).toBeUndefined();
    });

    it('should properly format nextSteps for multi-technique plans', () => {
      const planOutput: PlanThinkingSessionOutput = {
        planId: 'multi-tech-plan',
        problem: 'Complex problem requiring multiple perspectives',
        techniques: ['six_hats', 'scamper', 'po'],
        workflow: [
          {
            technique: 'six_hats',
            steps: Array(7)
              .fill(null)
              .map((_, i) => ({
                stepNumber: i + 1,
                description: `Step ${i + 1}`,
                expectedOutput: `Output ${i + 1}`,
              })),
            estimatedTime: '30 minutes',
            requiredInputs: ['Problem'],
            expectedOutputs: ['Analysis'],
          },
          {
            technique: 'scamper',
            steps: Array(8)
              .fill(null)
              .map((_, i) => ({
                stepNumber: i + 1,
                description: `SCAMPER step ${i + 1}`,
                expectedOutput: `SCAMPER output ${i + 1}`,
              })),
            estimatedTime: '40 minutes',
            requiredInputs: ['Current solution'],
            expectedOutputs: ['Modifications'],
          },
        ],
        estimatedSteps: 15,
        totalSteps: 15,
        estimatedTotalTime: '70 minutes',
        createdAt: Date.now(),
      };

      const response = builder.buildPlanningResponse(planOutput);
      const parsed = JSON.parse(response.content[0].text) as Record<string, unknown>;

      // First technique should be six_hats with 7 steps
      expect(parsed.nextSteps.firstCall.parameters.technique).toBe('six_hats');
      expect(parsed.nextSteps.firstCall.parameters.totalSteps).toBe(7);
      expect(parsed.nextSteps.firstCall.parameters.problem).toBe(
        'Complex problem requiring multiple perspectives'
      );
    });
  });

  describe('buildExecutionResponse', () => {
    it('should build execution response with technique-specific fields', () => {
      const input: ThinkingOperationData = {
        technique: 'six_hats',
        problem: 'Test problem',
        currentStep: 1,
        totalSteps: 6,
        output: 'Blue hat output',
        nextStepNeeded: true,
        hatColor: 'blue',
        risks: ['Risk 1'],
        mitigations: ['Mitigation 1'],
      };

      const response = builder.buildExecutionResponse(
        'session-123',
        input,
        ['Insight 1', 'Insight 2'],
        'Next, try white hat thinking',
        5
      );

      const parsed = parseExecutionTestResponse(response.content[0].text);

      expect(parsed.sessionId).toBe('session-123');
      expect(parsed.technique).toBe('six_hats');
      expect(parsed.currentStep).toBe(1);
      expect(parsed.insights).toEqual(['Insight 1', 'Insight 2']);
      expect(parsed.hatColor).toBe('blue');
      expect(parsed.risks).toEqual(['Risk 1']);
      expect(parsed.nextStepGuidance).toBe('Next, try white hat thinking');
      expect(parsed.historyLength).toBe(5);
    });

    it('should handle SCAMPER with path impact', () => {
      const scamperInput: ThinkingOperationData = {
        technique: 'scamper',
        problem: 'Improve product',
        currentStep: 1,
        totalSteps: 7,
        output: 'Substitute materials',
        nextStepNeeded: true,
        scamperAction: 'substitute',
        pathImpact: {
          reversibilityCost: 0.3,
          dependencyChains: ['material_choice'],
          flexibilityChange: -0.1,
        },
        flexibilityScore: 0.7,
        alternativeSuggestions: ['Use recycled materials'],
      };

      const response = builder.buildExecutionResponse('session-456', scamperInput, []);
      const parsed = parseExecutionTestResponse(response.content[0].text);

      expect(parsed.scamperAction).toBe('substitute');
      expect(parsed.pathImpact).toEqual(scamperInput.pathImpact);
      expect(parsed.flexibilityScore).toBe(0.7);
      expect(parsed.alternativeSuggestions).toEqual(['Use recycled materials']);
    });

    it('should handle revision fields', () => {
      const revisionInput: ThinkingOperationData = {
        technique: 'po',
        problem: 'Test problem',
        currentStep: 2,
        totalSteps: 4,
        output: 'Revised output',
        nextStepNeeded: true,
        isRevision: true,
        revisesStep: 1,
        branchFromStep: 1,
        branchId: 'branch-123',
      };

      const response = builder.buildExecutionResponse('session-789', revisionInput, []);
      const parsed = parseExecutionTestResponse(response.content[0].text);

      expect(parsed.isRevision).toBe(true);
      expect(parsed.revisesStep).toBe(1);
      expect(parsed.branchFromStep).toBe(1);
      expect(parsed.branchId).toBe('branch-123');
    });
  });

  describe('buildSessionOperationResponse', () => {
    it('should build session operation response', () => {
      const response = builder.buildSessionOperationResponse('save', {
        sessionId: 'session-123',
        timestamp: Date.now(),
      });

      const parsed = parseSessionOperationResponse(response.content[0].text);

      expect(parsed.operation).toBe('save');
      expect(parsed.success).toBe(true);
      expect(parsed.result).toHaveProperty('sessionId');
    });
  });

  describe('addCompletionData', () => {
    it('should add completion data with all metrics', () => {
      const session: SessionData = {
        technique: 'six_hats',
        problem: 'Test problem',
        history: Array.from({ length: 6 }, (_, i) => ({
          output: 'Step output',
          currentStep: i + 1,
          totalSteps: 6,
          technique: 'six_hats' as const,
          problem: 'Test',
          nextStepNeeded: i < 5,
          timestamp: new Date().toISOString(),
        })),
        branches: {},
        insights: ['Insight 1', 'Insight 2', 'Insight 3'],
        lastActivityTime: Date.now(),
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        metrics: {
          creativityScore: 8.5,
          risksCaught: 5,
          antifragileFeatures: 3,
        },
        pathMemory: {
          pathHistory: [
            {
              timestamp: new Date().toISOString(),
              technique: 'six_hats' as const,
              step: 1,
              decision: 'Critical decision',
              optionsOpened: [],
              optionsClosed: ['option1'],
              reversibilityCost: 0.8,
              commitmentLevel: 0.8,
              constraintsCreated: ['1'],
            },
            {
              timestamp: new Date().toISOString(),
              technique: 'six_hats' as const,
              step: 2,
              decision: 'Minor choice',
              optionsOpened: ['option2'],
              optionsClosed: [],
              reversibilityCost: 0.2,
              commitmentLevel: 0.2,
              constraintsCreated: [],
            },
          ],
          constraints: [
            {
              id: '1',
              type: 'resource' as const,
              description: 'Time limit',
              createdAt: new Date().toISOString(),
              createdBy: {
                timestamp: new Date().toISOString(),
                technique: 'six_hats' as const,
                step: 1,
                decision: 'Set time constraint',
                optionsOpened: [],
                optionsClosed: [],
                reversibilityCost: 0.5,
                commitmentLevel: 0.5,
                constraintsCreated: [],
              },
              strength: 0.5,
              affectedOptions: [],
              reversibilityCost: 0.5,
            },
          ],
          foreclosedOptions: [],
          availableOptions: [],
          currentFlexibility: {
            flexibilityScore: 0.6,
            reversibilityIndex: 0.5,
            pathDivergence: 0.3,
            barrierProximity: [],
            optionVelocity: 0,
            commitmentDepth: 0.5,
          },
          absorbingBarriers: [],
          criticalDecisions: [],
          escapeRoutes: [],
        },
        earlyWarningState: {
          overallRisk: 'MEDIUM' as const,
          activeWarnings: [
            {
              severity: 'MEDIUM' as const,
              message: 'Approaching decision lock-in',
              barrierId: 'barrier-1',
              barrierName: 'Decision Lock-in',
              proximity: 0.6,
              recommendedActions: ['Consider alternatives'],
            },
          ],
          sensorReadings: new Map(),
          compoundRisk: false,
          criticalBarriers: [],
          recommendedAction: 'caution' as const,
          escapeRoutesAvailable: [],
        },
        escapeRecommendation: {
          name: 'Temporal Unbinding',
          steps: ['Step 1', 'Step 2', 'Step 3', 'Step 4'],
          priority: 'high',
          prerequisites: [],
          timeToImplement: '1 hour',
          risks: [],
        },
      };

      const originalResponse = { sessionId: 'test-123' };
      const enhanced = builder.addCompletionData(originalResponse, session);

      expect(enhanced.sessionComplete).toBe(true);
      expect(enhanced.completed).toBe(true);
      expect(enhanced.techniqueUsed).toBe('six_hats');
      expect(enhanced.insights).toEqual(session.insights);
      expect(enhanced.metrics).toEqual(session.metrics);
      expect(enhanced.summary).toEqual({
        technique: 'six_hats',
        problem: 'Test problem',
        stepsCompleted: 6,
        insightsGenerated: 3,
        creativityScore: 8.5,
        risksCaught: 5,
      });
      expect(enhanced.pathAnalysis).toEqual({
        decisionsLocked: 1,
        flexibilityScore: 0.6,
        constraints: ['Time limit'],
      });
      expect(enhanced.warnings).toEqual(['MEDIUM: Approaching decision lock-in']);
      expect(enhanced.escapeOptions).toEqual({
        protocol: 'Temporal Unbinding',
        steps: ['Step 1', 'Step 2', 'Step 3'],
      });
    });

    it('should handle session without optional data', () => {
      const minimalSession: SessionData = {
        technique: 'po',
        problem: 'Test',
        history: [],
        branches: {},
        insights: [],
        lastActivityTime: Date.now(),
      };

      const response = { sessionId: 'test' };
      const enhanced = builder.addCompletionData(response, minimalSession);

      expect(enhanced.sessionComplete).toBe(true);
      expect(enhanced.metrics).toBeUndefined();
      expect(enhanced.pathAnalysis).toBeUndefined();
      expect(enhanced.warnings).toBeUndefined();
      expect(enhanced.escapeOptions).toBeUndefined();
    });
  });

  describe('formatSessionList', () => {
    it('should format session list for display', () => {
      const sessions = [
        {
          id: 'session-1',
          data: {
            technique: 'six_hats' as const,
            problem:
              'How to improve team communication in remote work environments with multiple time zones',
            history: Array.from({ length: 5 }, (_, i) => ({
              technique: 'six_hats' as const,
              problem: 'Test problem',
              currentStep: i + 1,
              totalSteps: 6,
              output: `Step ${i + 1} output`,
              nextStepNeeded: i < 4,
              timestamp: new Date().toISOString(),
            })),
            branches: {},
            insights: ['Insight 1', 'Insight 2'],
            lastActivityTime: Date.now(),
            startTime: Date.now() - 3600000,
            endTime: Date.now(),
            name: 'Team Communication Session',
            tags: ['team', 'remote'],
          } as SessionData,
        },
        {
          id: 'session-2',
          data: {
            technique: 'po' as const,
            problem: 'Short problem',
            history: Array.from({ length: 3 }, (_, i) => ({
              technique: 'po' as const,
              problem: 'Short problem',
              currentStep: i + 1,
              totalSteps: 4,
              output: `Step ${i + 1} output`,
              nextStepNeeded: true,
              timestamp: new Date().toISOString(),
            })),
            branches: {},
            insights: [],
            lastActivityTime: Date.now() - 1800000,
            startTime: Date.now() - 7200000,
          } as SessionData,
        },
      ];

      const formatted = builder.formatSessionList(sessions) as {
        count: number;
        sessions: Array<{
          id: string;
          name: string;
          technique: string;
          problem: string;
          created: string;
          lastActivity: string;
          steps: number;
          complete: boolean;
          insights: number;
          tags: string[];
        }>;
      };

      expect(formatted.count).toBe(2);
      expect(formatted.sessions).toHaveLength(2);
      expect(formatted.sessions[0]).toEqual({
        id: 'session-1',
        name: 'Team Communication Session',
        technique: 'six_hats',
        problem:
          'How to improve team communication in remote work environments with multiple time zones',
        created: expect.stringMatching(/\d{4}-\d{2}-\d{2}/) as string,
        lastActivity: expect.stringMatching(/\d{4}-\d{2}-\d{2}/) as string,
        steps: 5,
        complete: true,
        insights: 2,
        tags: ['team', 'remote'],
      });
      const secondSession = formatted.sessions[1];
      expect(secondSession?.name).toBe('po - Short problem...');
      expect(secondSession?.complete).toBe(false);
    });

    it('should handle empty session list', () => {
      const formatted = builder.formatSessionList([]);

      expect(formatted.count).toBe(0);
      expect(formatted.sessions).toEqual([]);
    });
  });

  describe('formatExportData', () => {
    const mockSession: SessionData = {
      technique: 'six_hats',
      problem: 'Test problem',
      history: [
        {
          technique: 'six_hats',
          problem: 'Test problem',
          currentStep: 1,
          totalSteps: 6,
          output: 'Blue hat output',
          nextStepNeeded: true,
          risks: ['Risk 1'],
          mitigations: ['Mitigation 1'],
          timestamp: new Date().toISOString(),
        },
      ],
      branches: {},
      insights: ['Key insight'],
      lastActivityTime: Date.now(),
      startTime: Date.now() - 3600000,
    };

    it('should format as JSON', () => {
      const json = builder.formatExportData(mockSession, 'json');
      const parsed = parseGenericResponse<SessionData>(json);

      expect(parsed).toEqual(mockSession);
    });

    it('should format as Markdown', () => {
      const markdown = builder.formatExportData(mockSession, 'markdown');

      expect(markdown).toContain('# Creative Thinking Session');
      expect(markdown).toContain('**Technique:** six_hats');
      expect(markdown).toContain('**Problem:** Test problem');
      expect(markdown).toContain('## Steps');
      expect(markdown).toContain('### Step 1');
      expect(markdown).toContain('**Output:** Blue hat output');
      expect(markdown).toContain('**Risks:** Risk 1');
      expect(markdown).toContain('**Mitigations:** Mitigation 1');
      expect(markdown).toContain('## Insights');
      expect(markdown).toContain('- Key insight');
    });

    it('should format as CSV', () => {
      const csv = builder.formatExportData(mockSession, 'csv');
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Step,Technique,Output,Risks,Mitigations');
      expect(lines[1]).toContain('1,six_hats,"Blue hat output","Risk 1","Mitigation 1"');
    });

    it('should handle CSV with quotes in content', () => {
      const sessionWithQuotes: SessionData = {
        ...mockSession,
        history: [
          {
            ...mockSession.history[0],
            output: 'Output with "quotes" inside',
            risks: ['Risk with "danger"'],
          },
        ],
      };

      const csv = builder.formatExportData(sessionWithQuotes, 'csv');
      expect(csv).toContain('"Output with ""quotes"" inside"');
      expect(csv).toContain('"Risk with ""danger"""');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        builder.formatExportData(mockSession, 'pdf' as never);
      }).toThrow('Unsupported export format: pdf');
    });
  });

  describe('extractTechniqueSpecificFields', () => {
    it('should extract all technique-specific fields', () => {
      // Test each technique type
      const techniques: Array<[string, ThinkingOperationData, Record<string, unknown>]> = [
        [
          'six_hats',
          {
            technique: 'six_hats' as const,
            hatColor: 'blue' as const,
            problem: 'test',
            currentStep: 1,
            totalSteps: 6,
            output: 'test',
            nextStepNeeded: true,
          } satisfies ThinkingOperationData,
          { hatColor: 'blue' },
        ],
        [
          'po',
          {
            technique: 'po' as const,
            provocation: 'PO: Cars have square wheels',
            principles: ['P1'],
            problem: 'test',
            currentStep: 1,
            totalSteps: 4,
            output: 'test',
            nextStepNeeded: true,
          } satisfies ThinkingOperationData,
          { provocation: 'PO: Cars have square wheels', principles: ['P1'] },
        ],
        [
          'random_entry',
          {
            technique: 'random_entry' as const,
            randomStimulus: 'Apple',
            connections: ['Red', 'Round'],
            problem: 'test',
            currentStep: 1,
            totalSteps: 3,
            output: 'test',
            nextStepNeeded: true,
          } satisfies ThinkingOperationData,
          { randomStimulus: 'Apple', connections: ['Red', 'Round'] },
        ],
        [
          'neural_state',
          {
            technique: 'neural_state' as const,
            dominantNetwork: 'dmn' as const,
            suppressionDepth: 5,
            problem: 'test',
            currentStep: 1,
            totalSteps: 4,
            output: 'test',
            nextStepNeeded: true,
          } satisfies ThinkingOperationData,
          { dominantNetwork: 'dmn', suppressionDepth: 5 },
        ],
      ];

      techniques.forEach(([_technique, input, expected]) => {
        const response = builder.buildExecutionResponse('test', input, []);
        const parsed = parseExecutionTestResponse(response.content[0].text);

        Object.entries(expected).forEach(([key, value]) => {
          expect(parsed[key]).toEqual(value);
        });
      });
    });

    it('should include risk/adversarial fields', () => {
      const input: ThinkingOperationData = {
        technique: 'triz',
        problem: 'Test',
        currentStep: 1,
        totalSteps: 4,
        output: 'Output',
        nextStepNeeded: true,
        risks: ['Risk 1'],
        failureModes: ['Failure 1'],
        mitigations: ['Mitigation 1'],
        antifragileProperties: ['Redundancy'],
        blackSwans: ['Unexpected event'],
      };

      const response = builder.buildExecutionResponse('test', input, []);
      const parsed = parseExecutionTestResponse(response.content[0].text);

      expect(parsed.risks).toEqual(['Risk 1']);
      expect(parsed.failureModes).toEqual(['Failure 1']);
      expect(parsed.mitigations).toEqual(['Mitigation 1']);
      expect(parsed.antifragileProperties).toEqual(['Redundancy']);
      expect(parsed.blackSwans).toEqual(['Unexpected event']);
    });
  });
});
