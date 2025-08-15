/**
 * Temporal Creativity with Path Memory Integration technique handler
 * Extends temporal thinking with deep path memory and option preservation
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
interface PathMemoryEntry {
    timestamp: number;
    decision: string;
    constraintsCreated: string[];
    optionsClosed: string[];
    flexibilityImpact: number;
}
export declare class TemporalCreativityHandler extends BaseTechniqueHandler {
    private readonly steps;
    private readonly stepsWithReflexivity;
    private pathMemory;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    validateStep(step: number, data: unknown): boolean;
    extractInsights(history: Array<{
        output?: string;
        pathHistory?: Array<{
            decision: string;
            impact: string;
        }>;
        decisionPatterns?: string[];
        currentConstraints?: string[];
        activeOptions?: string[];
        timelineProjections?: Record<string, unknown>;
        lessonIntegration?: string[];
        preservedOptions?: string[];
    }>): string[];
    /**
     * Track a decision in path memory
     */
    trackDecision(decision: string, constraintsCreated?: string[], optionsClosed?: string[], flexibilityImpact?: number): void;
    /**
     * Analyze path memory for patterns
     */
    analyzePathMemory(): {
        totalDecisions: number;
        totalConstraintsCreated: number;
        totalOptionsClosed: number;
        currentFlexibility: number;
        criticalDecisions: PathMemoryEntry[];
    };
    /**
     * Project future flexibility based on current path
     */
    projectFutureFlexibility(horizons?: number[]): Record<number, number>;
}
export {};
//# sourceMappingURL=TemporalCreativityHandler.d.ts.map