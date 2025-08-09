/**
 * PromptsHandler - MCP prompts for guided lateral thinking sessions
 * Provides pre-configured prompts to help users effectively use the server
 */
import type { Prompt } from '@modelcontextprotocol/sdk/types.js';
export declare class PromptsHandler {
    /**
     * Get all available prompts
     */
    getPrompts(): Prompt[];
    /**
     * Get a specific prompt by name
     */
    getPrompt(name: string): {
        description: string;
        messages: Array<{
            role: 'user' | 'assistant';
            content: {
                type: 'text' | 'resource';
                text?: string;
                resource?: {
                    uri: string;
                    mimeType?: string;
                };
            };
        }>;
    } | null;
}
//# sourceMappingURL=PromptsHandler.d.ts.map