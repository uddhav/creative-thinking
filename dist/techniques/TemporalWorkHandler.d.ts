/**
 * Temporal Work technique handler
 */
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
export declare class TemporalWorkHandler extends BaseTechniqueHandler {
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    /**
     * Report what each step actually recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array: `execute`
     * appends a history entry for every call including revisions, so one revision
     * shifts every later entry. Keying on the step also means a revision
     * supersedes the entry it revises rather than reporting twice.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        temporalLandscape?: {
            fixedDeadlines?: string[];
            flexibleWindows?: string[];
            pressurePoints?: string[];
            deadZones?: string[];
            kairosOpportunities?: string[];
        };
        circadianAlignment?: string[];
        pressureTransformation?: string[];
        asyncSyncBalance?: string[];
        temporalEscapeRoutes?: string[];
        output?: string;
    }>): string[];
}
//# sourceMappingURL=TemporalWorkHandler.d.ts.map