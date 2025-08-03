/**
 * Parallelism Validation System
 * Validates that requested parallel execution is safe and appropriate
 */
/**
 * Validates parallel execution requests for safety and appropriateness
 */
export class ParallelismValidator {
    /**
     * Maximum number of parallel techniques by default
     */
    static MAX_DEFAULT_PARALLELISM = 5;
    /**
     * Pairs of techniques that have dependencies
     * First technique should generally complete before second
     */
    static DEPENDENT_TECHNIQUE_PAIRS = [
        ['design_thinking', 'triz'], // TRIZ often needs problem definition from design thinking
        ['concept_extraction', 'yes_and'], // Yes,And builds on extracted concepts
        ['six_hats', 'disney_method'], // Disney method benefits from initial analysis
        ['scamper', 'concept_extraction'], // Concept extraction can use SCAMPER outputs
        ['random_entry', 'po'], // PO can build on random stimuli
    ];
    /**
     * Resource-intensive techniques that need special consideration
     */
    static RESOURCE_INTENSIVE_TECHNIQUES = {
        design_thinking: 5, // Full design thinking process
        triz: 4, // Complex problem solving
        nine_windows: 3, // 9 different perspectives
        collective_intel: 3, // Multiple source synthesis
        cross_cultural: 3, // Multiple cultural frameworks
    };
    /**
     * Validate a parallel execution request
     */
    validateParallelRequest(techniques, maxParallelism) {
        const errors = [];
        const warnings = [];
        const recommendations = [];
        // Check technique count
        if (techniques.length < 2) {
            errors.push('Parallel execution requires at least 2 techniques');
        }
        // Check max parallelism
        const effectiveMax = maxParallelism || ParallelismValidator.MAX_DEFAULT_PARALLELISM;
        if (techniques.length > effectiveMax) {
            errors.push(`Requested ${techniques.length} parallel techniques exceeds maximum of ${effectiveMax}`);
            recommendations.push(`Consider running techniques in batches of ${effectiveMax} or less`);
        }
        // Check for duplicate techniques
        const uniqueTechniques = new Set(techniques);
        if (uniqueTechniques.size !== techniques.length) {
            warnings.push('Duplicate techniques detected in parallel request');
        }
        // Check for dependent techniques
        const dependencies = this.findDependencies(techniques);
        if (dependencies.length > 0) {
            warnings.push(`Techniques have dependencies: ${dependencies.join(', ')}. ` +
                'Consider sequential execution or careful ordering.');
            recommendations.push('Use coordination strategy to manage dependencies');
        }
        // Check resource implications
        const resourceEstimate = this.estimateResourceUsage(techniques);
        if (resourceEstimate.memoryMB > 100) {
            warnings.push(`High memory usage estimated: ${resourceEstimate.memoryMB}MB`);
        }
        if (resourceEstimate.complexity === 'high') {
            warnings.push('High complexity parallel execution - may require more time');
            recommendations.push('Consider using step-level parallelism for complex techniques');
        }
        // Add general recommendations
        if (techniques.length > 3) {
            recommendations.push('Use convergence technique to synthesize results effectively');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            recommendations: this.generateRecommendations(techniques, dependencies, recommendations),
        };
    }
    /**
     * Find dependencies between techniques
     */
    findDependencies(techniques) {
        const dependencies = [];
        const techniqueSet = new Set(techniques);
        for (const [tech1, tech2] of ParallelismValidator.DEPENDENT_TECHNIQUE_PAIRS) {
            if (techniqueSet.has(tech1) &&
                techniqueSet.has(tech2)) {
                dependencies.push(`${tech1} → ${tech2}`);
            }
        }
        return dependencies;
    }
    /**
     * Estimate resource usage for parallel execution
     */
    estimateResourceUsage(techniques) {
        let totalMemory = 20; // Base memory
        let maxComplexity = 1;
        let totalTime = 0;
        for (const technique of techniques) {
            const complexity = ParallelismValidator.RESOURCE_INTENSIVE_TECHNIQUES[technique] || 1;
            maxComplexity = Math.max(maxComplexity, complexity);
            totalMemory += 10 * complexity; // Memory per technique
            totalTime += 1000 * complexity; // Time estimate per technique
        }
        // Parallel execution reduces time but not linearly
        const parallelTime = totalTime / Math.sqrt(techniques.length);
        return {
            memoryMB: Math.round(totalMemory),
            estimatedTimeMs: Math.round(parallelTime),
            complexity: maxComplexity >= 4 ? 'high' : maxComplexity >= 3 ? 'medium' : 'low',
        };
    }
    /**
     * Check if two techniques can run in parallel
     */
    canTechniquesRunInParallel(tech1, tech2) {
        // Check if techniques are in dependent pairs
        for (const [dep1, dep2] of ParallelismValidator.DEPENDENT_TECHNIQUE_PAIRS) {
            if ((tech1 === dep1 && tech2 === dep2) || (tech1 === dep2 && tech2 === dep1)) {
                return false;
            }
        }
        // Techniques are independent
        return true;
    }
    /**
     * Generate specific recommendations based on validation
     */
    generateRecommendations(techniques, dependencies, existingRecommendations) {
        const recommendations = [...existingRecommendations];
        // Add dependency-specific recommendations
        if (dependencies.length > 0) {
            // Check for specific dependency patterns
            if (dependencies.some(d => d.includes('design_thinking'))) {
                recommendations.push('Consider running design_thinking first to establish problem context');
            }
            if (dependencies.some(d => d.includes('concept_extraction'))) {
                recommendations.push('Concept extraction results can enhance other techniques');
            }
        }
        // Add technique-specific recommendations
        if (techniques.includes('collective_intel') && techniques.includes('cross_cultural')) {
            recommendations.push('Collective intelligence and cross-cultural perspectives combine well');
        }
        if (techniques.includes('six_hats') && techniques.includes('disney_method')) {
            recommendations.push('Six Hats and Disney Method may have overlapping perspectives - consider alternating');
        }
        // Resource recommendations
        const resourceEstimate = this.estimateResourceUsage(techniques);
        if (resourceEstimate.complexity === 'high' && techniques.length > 3) {
            recommendations.push('Consider hybrid parallelization (technique + step level)');
        }
        return recommendations;
    }
    /**
     * Get optimal grouping for parallel execution
     */
    getOptimalGrouping(techniques, maxParallelism = ParallelismValidator.MAX_DEFAULT_PARALLELISM) {
        const groups = [];
        const remaining = [...techniques];
        const processed = new Set();
        while (remaining.length > 0) {
            const group = [];
            // Start with first unprocessed technique
            const seed = remaining.shift();
            if (!seed)
                break; // Should not happen, but satisfy TypeScript
            group.push(seed);
            processed.add(seed);
            // Add compatible techniques up to max parallelism
            for (let i = remaining.length - 1; i >= 0 && group.length < maxParallelism; i--) {
                const candidate = remaining[i];
                // Check if candidate can run in parallel with all in group
                const canAdd = group.every(tech => this.canTechniquesRunInParallel(tech, candidate));
                if (canAdd) {
                    group.push(candidate);
                    processed.add(candidate);
                    remaining.splice(i, 1);
                }
            }
            groups.push(group);
        }
        return groups;
    }
}
//# sourceMappingURL=ParallelismValidator.js.map