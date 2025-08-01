/**
 * Path dependency analysis for execution layer
 * Tracks how decisions affect future possibilities
 */
export class PathAnalyzer {
    /**
     * Analyze path dependencies based on current step
     */
    static analyzePath(input, ergodicityResult) {
        let currentFlexibility = 1.0;
        const pathConstraints = [];
        const futureOptions = [];
        const criticalDecisions = [];
        // Check ergodicity result for path memory
        if (ergodicityResult?.pathMemory) {
            const memory = ergodicityResult.pathMemory;
            // Extract flexibility from path memory
            if (memory.currentFlexibility?.flexibilityScore !== undefined) {
                currentFlexibility = memory.currentFlexibility.flexibilityScore;
            }
            // Extract constraints from absorbing barriers
            if (memory.absorbingBarriers && memory.absorbingBarriers.length > 0) {
                pathConstraints.push(...memory.absorbingBarriers.map(b => b.description));
            }
            // Extract critical decisions
            if (memory.criticalDecisions && memory.criticalDecisions.length > 0) {
                criticalDecisions.push(...memory.criticalDecisions.map(cd => cd.decision));
            }
        }
        // Analyze based on technique and step
        switch (input.technique) {
            case 'scamper':
                if (input.scamperAction === 'eliminate') {
                    currentFlexibility *= 0.8;
                    pathConstraints.push('Elimination reduces future combination options');
                }
                if (input.scamperAction === 'reverse') {
                    futureOptions.push('Reversal opens new perspective paths');
                }
                break;
            case 'design_thinking':
                if (input.designStage === 'define') {
                    criticalDecisions.push('Problem definition shapes all subsequent ideation');
                }
                if (input.designStage === 'prototype') {
                    pathConstraints.push('Prototype choices create implementation constraints');
                }
                break;
            case 'triz':
                if (input.contradiction) {
                    criticalDecisions.push(`Resolving contradiction: ${input.contradiction}`);
                }
                break;
            case 'six_hats':
                if (input.hatColor === 'black' && input.risks && input.risks.length > 2) {
                    currentFlexibility *= 0.9;
                    pathConstraints.push('Multiple risks identified limit aggressive options');
                }
                break;
        }
        // Add future options based on flexibility
        if (currentFlexibility > 0.7) {
            futureOptions.push('High flexibility allows technique switching');
            futureOptions.push('Can explore radical alternatives');
        }
        else if (currentFlexibility > 0.4) {
            futureOptions.push('Moderate flexibility for variations');
            futureOptions.push('Can adjust approach within constraints');
        }
        else {
            futureOptions.push('Limited flexibility - focus on optimization');
            pathConstraints.push('Path dependencies limit major pivots');
        }
        // Add revision and branching options
        if (input.isRevision) {
            futureOptions.push('Revision path allows correcting previous decisions');
        }
        if (input.branchId) {
            futureOptions.push('Branch exploration maintains main path integrity');
        }
        return {
            currentFlexibility,
            pathConstraints,
            futureOptions,
            criticalDecisions,
        };
    }
    /**
     * Get path flexibility description
     */
    static getFlexibilityDescription(flexibility) {
        if (flexibility > 0.8)
            return 'Very High - Multiple paths available';
        if (flexibility > 0.6)
            return 'High - Good options remaining';
        if (flexibility > 0.4)
            return 'Moderate - Some constraints emerging';
        if (flexibility > 0.2)
            return 'Low - Significant path dependencies';
        return 'Very Low - Near absorbing barrier';
    }
}
//# sourceMappingURL=pathAnalyzer.js.map