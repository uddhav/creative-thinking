/**
 * RequestHandlers - MCP request handlers for the creative thinking server
 * Extracted from index.ts to improve maintainability
 */
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { workflowGuard } from '../core/WorkflowGuard.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
import { getAllTools } from './ToolDefinitions.js';
export class RequestHandlers {
    server;
    lateralServer;
    constructor(server, lateralServer) {
        this.server = server;
        this.lateralServer = lateralServer;
    }
    /**
     * Set up all request handlers
     */
    setupHandlers() {
        this.setupListToolsHandler();
        this.setupCallToolHandler();
    }
    /**
     * Handle tool listing requests
     */
    setupListToolsHandler() {
        this.server.setRequestHandler(ListToolsRequestSchema, () => ({
            tools: getAllTools(),
        }));
    }
    /**
     * Handle tool call requests
     */
    setupCallToolHandler() {
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                // Record the tool call for workflow tracking
                workflowGuard.recordCall(name, args);
                // Check for workflow violations before executing
                const violation = workflowGuard.checkWorkflowViolation(name, args);
                if (violation) {
                    const violationError = workflowGuard.getViolationError(violation);
                    // Since ErrorFactory returns CreativeThinkingError which implements EnhancedError
                    const enhancedError = violationError;
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    error: enhancedError.message,
                                    code: enhancedError.code,
                                    recovery: enhancedError.recovery,
                                }, null, 2),
                            },
                        ],
                    };
                }
                let result;
                switch (name) {
                    case 'discover_techniques':
                        result = this.lateralServer.discoverTechniques(args);
                        break;
                    case 'plan_thinking_session':
                        result = this.lateralServer.planThinkingSession(args);
                        break;
                    case 'execute_thinking_step':
                        result = await this.lateralServer.executeThinkingStep(args);
                        break;
                    default:
                        throw new ValidationError(ErrorCode.INVALID_INPUT, `Unknown tool: ${name}`, 'toolName', {
                            providedTool: name,
                        });
                }
                // MCP expects the content array directly
                return {
                    content: result.content,
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        },
                    ],
                };
            }
        });
    }
}
//# sourceMappingURL=RequestHandlers.js.map