/**
 * Memory pattern detection for execution layer
 * Identifies recurring patterns and learning opportunities
 */
import type { ExecuteThinkingStepInput } from '../../types/index.js';
import type { SessionManager } from '../../core/SessionManager.js';
interface MemoryPattern {
    patternType: 'recurring' | 'breakthrough' | 'blockage' | 'synergy';
    description: string;
    frequency?: number;
    relatedTechniques?: string[];
    suggestion?: string;
}
export declare class MemoryPatternDetector {
    /**
     * Detect patterns across session history
     */
    static detectPatterns(input: ExecuteThinkingStepInput, sessionId: string, sessionManager: SessionManager): MemoryPattern | null;
    /**
     * Detect recurring themes in thinking
     */
    private static detectRecurringThemes;
    /**
     * Detect breakthrough moments
     */
    private static detectBreakthroughs;
    /**
     * Detect thinking blockages
     */
    private static detectBlockages;
    /**
     * Detect technique synergies
     */
    private static detectSynergies;
}
export {};
//# sourceMappingURL=memoryPatternDetector.d.ts.map