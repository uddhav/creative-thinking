/**
 * SCAMPER technique handler with Path Dependency Analysis and Reflexivity
 */
import type { ScamperAction, ScamperPathImpact } from '../types/index.js';
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
interface ScamperActionInfo {
    description: string;
    emoji: string;
    riskQuestion: string;
    pathIndicator: string;
    commitmentLevel: 'low' | 'medium' | 'high' | 'irreversible';
    typicalReversibilityCost: number;
}
export declare class ScamperHandler extends BaseTechniqueHandler {
    private readonly actions;
    private readonly actionOrder;
    private readonly steps;
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): StepInfo;
    getStepGuidance(step: number, problem: string): string;
    analyzePathImpact(action: ScamperAction, modification: string, history: Array<{
        scamperAction?: string;
    }>): ScamperPathImpact;
    private identifyDependencies;
    private identifyClosedOptions;
    /**
     * Options this action opens.
     *
     * Every entry is a consequence of the action itself. A word-count test used
     * to add "Complex transformation opportunities" to any modification longer
     * than five words, so a step written in a full sentence was recorded as
     * having opened an option that a terser one had not — and once options
     * entered the flexibility measure, that handed every realistic SCAMPER step
     * a credit for its prose length.
     */
    private identifyOpenedOptions;
    private calculateCumulativeCommitment;
    private generateRecoveryPath;
    generateAlternatives(action: ScamperAction, currentFlexibility: number): string[];
    /**
     * Report what each modification was, labelled by its action.
     *
     * SCAMPER was the only technique with no extraction of its own, so it fell
     * through to the base class: any output under fifty characters dropped, the
     * rest split naively at the first `.` so "cut it by approx. 40%" became "cut
     * it by approx", unlabelled, in call order, and duplicated rather than
     * superseded when a step was revised.
     *
     * The action is derived from the step rather than demanded, the same way the
     * hat is for six_hats: `validateStep` accepts `scamperAction` only when it
     * matches `actionOrder[step - 1]`, so the step already determines it.
     */
    extractInsights(history: Array<{
        currentStep?: number;
        scamperAction?: string;
        modifications?: string[];
        pathImpact?: ScamperPathImpact;
        output?: string;
    }>): string[];
    getAction(step: number): ScamperAction;
    getAllActions(): Record<ScamperAction, ScamperActionInfo>;
}
export {};
//# sourceMappingURL=ScamperHandler.d.ts.map