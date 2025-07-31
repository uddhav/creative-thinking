/**
 * SCAMPER technique handler with Path Dependency Analysis
 */
import type { ScamperAction, ScamperPathImpact } from '../types/index.js';
import { BaseTechniqueHandler, type TechniqueInfo } from './types.js';
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
    getTechniqueInfo(): TechniqueInfo;
    getStepInfo(step: number): {
        name: string;
        focus: string;
        emoji: string;
    };
    getStepGuidance(step: number, problem: string): string;
    analyzePathImpact(action: ScamperAction, modification: string, history: any[]): ScamperPathImpact;
    private identifyDependencies;
    private identifyClosedOptions;
    private identifyOpenedOptions;
    private calculateCumulativeCommitment;
    private generateRecoveryPath;
    generateAlternatives(action: ScamperAction, currentFlexibility: number): string[];
    getAction(step: number): ScamperAction;
    getAllActions(): Record<ScamperAction, ScamperActionInfo>;
}
export {};
//# sourceMappingURL=ScamperHandler.d.ts.map