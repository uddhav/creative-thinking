/**
 * ParallelToolCallHandler - Handles Anthropic-style parallel tool calls
 * Manages concurrent execution of multiple tool calls and technique parallelization
 */
import type { LateralThinkingServer } from '../index.js';
import type { LateralTechnique, LateralThinkingResponse } from '../types/index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';
/**
 * Represents a single tool call in a parallel batch
 * Supports both legacy format and Anthropic's tool_use format
 */
export interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
    id?: string;
    type?: 'tool_use';
    input?: Record<string, unknown>;
}
/**
 * Anthropic-style tool result
 */
export interface ToolResult {
    type: 'tool_result';
    tool_use_id: string;
    output?: unknown;
    is_error?: boolean;
    error?: {
        message: string;
        code?: string;
    };
}
/**
 * Execution group for parallel technique execution
 */
export interface ExecutionGroup {
    techniques: LateralTechnique[];
    canRunInParallel: boolean;
    stepDependencies?: Array<[number, number]>;
    parallelSteps?: boolean;
}
/**
 * Handles parallel tool calls following Anthropic's pattern
 */
export declare class ParallelToolCallHandler {
    private lateralServer;
    private parallelismValidator;
    private maxParallelCalls;
    private toolCallCounter;
    constructor(lateralServer: LateralThinkingServer, maxParallelCalls?: number);
    /**
     * Check if the request contains parallel tool calls
     */
    isParallelRequest(params: unknown): params is ToolCall[];
    /**
     * Generate unique tool_use_id
     */
    private generateToolUseId;
    /**
     * Normalize tool call to common format
     */
    private normalizeToolCall;
    /**
     * Process parallel tool calls
     */
    processParallelToolCalls(calls: ToolCall[], useAnthropicFormat?: boolean): Promise<LateralThinkingResponse>;
    /**
     * Process parallel execute_thinking_step calls
     */
    private processParallelExecutions;
    /**
     * Process calls sequentially (for non-parallelizable operations)
     */
    private processSequentialCalls;
    /**
     * Validate parallel tool calls
     */
    private validateParallelCalls;
    /**
     * Validate parallel execute_thinking_step calls
     */
    private validateParallelExecutions;
    /**
     * Create execution groups for a plan
     */
    createExecutionGroups(plan: PlanThinkingSessionOutput): ExecutionGroup[];
    /**
     * Determine if a technique's steps can run in parallel
     */
    private canTechniqueStepsRunInParallel;
}
//# sourceMappingURL=ParallelToolCallHandler.d.ts.map