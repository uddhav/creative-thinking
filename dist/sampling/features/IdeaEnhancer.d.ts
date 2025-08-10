/**
 * IdeaEnhancer
 * Uses MCP Sampling to enhance creative ideas with AI
 */
import type { SamplingManager } from '../SamplingManager.js';
import type { EnhancedIdea } from '../types.js';
export declare class IdeaEnhancer {
    private samplingManager;
    constructor(samplingManager: SamplingManager);
    /**
     * Enhance an idea using AI
     */
    enhance(idea: string, technique: string, context?: string): Promise<EnhancedIdea>;
    /**
     * Enhance multiple ideas in batch
     */
    enhanceBatch(ideas: Array<{
        idea: string;
        technique: string;
    }>, context?: string): Promise<EnhancedIdea[]>;
    /**
     * Build system prompt for enhancement
     */
    private buildSystemPrompt;
    /**
     * Build user prompt for enhancement
     */
    private buildUserPrompt;
    /**
     * Parse AI response into structured enhancement
     */
    private parseEnhancement;
    /**
     * Parse sections from AI response
     */
    private parseSections;
    /**
     * Extract bullet points from text
     */
    private extractBulletPoints;
    /**
     * Extract first meaningful paragraph
     */
    private extractFirstParagraph;
    /**
     * Fallback enhancement when AI is not available
     */
    private fallbackEnhancement;
    /**
     * Handle enhancement errors
     */
    private handleError;
    /**
     * Generate enhancement prompt for specific technique
     */
    getTechniqueSpecificPrompt(technique: string): string;
}
//# sourceMappingURL=IdeaEnhancer.d.ts.map