/**
 * Escape Velocity Calculator
 * Calculates requirements for breaking free from constraints
 */
import type { EscapeAnalysis, EscapeContext } from './types.js';
export declare class EscapeVelocityCalculator {
    private protocolFactory;
    private readonly safetyFactor;
    /**
     * Calculate escape requirements based on current state
     */
    calculateEscapeRequirements(context: EscapeContext): EscapeAnalysis;
    /**
     * Analyze constraints affecting the current state
     */
    private analyzeConstraints;
    /**
     * Inventory available resources
     */
    private inventoryResources;
    /**
     * Calculate total available resources
     */
    private calculateTotalResources;
    /**
     * Optimize escape path based on constraints and resources
     */
    private optimizeEscapePath;
    /**
     * Create escape phases for a protocol
     */
    private createEscapePhases;
    /**
     * Calculate success probability
     */
    private calculateSuccessOdds;
    /**
     * Generate execution plan
     */
    private generateEscapePlan;
    /**
     * Generate warnings based on analysis
     */
    private generateWarnings;
    private assessCognitiveRigidity;
    private assessSocialCommitments;
    private assessFinancialConstraints;
    private estimateTimeResource;
    private estimateSocialCapital;
    private estimateTechnicalCapacity;
    private calculateInteractionEffects;
    private createDefaultConstraint;
    private createEmergencyTrajectory;
    private identifyEscapeDependencies;
}
//# sourceMappingURL=calculator.d.ts.map