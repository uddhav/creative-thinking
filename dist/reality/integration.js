/**
 * Reality Assessment Integration
 *
 * Integrates the Reality Gradient System into existing thinking techniques
 * to enhance rather than restrict creativity.
 */
import { RealityAssessor } from './index.js';
/**
 * Pre-compiled domain detection patterns for performance
 * Ordered by frequency of occurrence for early matching
 */
const DOMAIN_PATTERNS = {
    technology: [
        /software|hardware|code/i,
        /algorithm|data structure/i,
        /system|architecture|design/i,
        /ai|machine learning|neural/i,
    ],
    finance: [
        /tax|taxes|taxation/i,
        /investment|portfolio|trading/i,
        /stock|bond|security|securities/i,
        /loss harvesting|capital gains/i,
    ],
    healthcare: [
        /medical|medicine|health/i,
        /treatment|therapy|diagnosis/i,
        /patient|doctor|clinical/i,
        /drug|pharmaceutical/i,
    ],
    regulatory: [
        /compliance|regulation|law/i,
        /legal|policy|governance/i,
        /privacy|gdpr|ccpa/i,
        /sec|fda|regulatory/i,
    ],
};
// Domain detection cache for performance
const domainCache = new Map();
const CACHE_SIZE_LIMIT = 100;
/**
 * Technique-specific reality check patterns
 */
const TECHNIQUE_REALITY_CHECKS = {
    triz: [
        'Check if contradiction is truly fundamental',
        'Verify physical principles are correctly understood',
        "Ensure inventive principles don't violate domain constraints",
    ],
    scamper: [
        'Verify substitutions are actually possible',
        'Check if combinations create new contradictions',
        "Ensure eliminations don't remove required elements",
    ],
    design_thinking: [
        'Validate user needs are real not assumed',
        'Check if prototypes can actually be built',
        'Ensure solutions fit within constraints',
    ],
};
export class RealityIntegration {
    /**
     * Detect domain from problem and context with caching for performance
     */
    static detectDomain(problem, context) {
        const combined = `${problem} ${context || ''}`.toLowerCase();
        // Check cache first
        if (domainCache.has(combined)) {
            return domainCache.get(combined);
        }
        // Perform detection with early returns
        for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
            // Check first pattern (most common) separately for early return
            if (patterns[0] && patterns[0].test(combined)) {
                this.updateCache(combined, domain);
                return domain;
            }
            // Check remaining patterns
            if (patterns.slice(1).some(pattern => pattern.test(combined))) {
                this.updateCache(combined, domain);
                return domain;
            }
        }
        this.updateCache(combined, undefined);
        return undefined;
    }
    /**
     * Update cache with size limit management
     */
    static updateCache(key, value) {
        // Clear cache if it exceeds limit
        if (domainCache.size >= CACHE_SIZE_LIMIT) {
            // Remove oldest entries (first half)
            const entriesToRemove = Math.floor(CACHE_SIZE_LIMIT / 2);
            const keys = Array.from(domainCache.keys());
            keys.slice(0, entriesToRemove).forEach(k => domainCache.delete(k));
        }
        domainCache.set(key, value);
    }
    /**
     * Enhance technique output with reality assessment
     */
    static enhanceWithReality(input, output) {
        // Don't assess if explicitly disabled or already assessed
        if (input.realityAssessment !== undefined) {
            return { enhancedOutput: output };
        }
        // Detect domain
        const domain = this.detectDomain(input.problem, output);
        // Perform reality assessment
        const assessment = RealityAssessor.assess(output, input.problem, domain);
        // Only add assessment if it's not trivially feasible
        if (assessment.possibilityLevel === 'feasible' && assessment.confidenceLevel >= 0.7) {
            return { enhancedOutput: output };
        }
        // Generate enhanced output
        const navigatorOutput = RealityAssessor.generateNavigatorOutput(output, assessment);
        const enhancedOutput = `${output}\n\n📊 Reality Navigator:\n${navigatorOutput}`;
        return {
            enhancedOutput,
            realityAssessment: assessment,
        };
    }
    /**
     * Get technique-specific reality checks
     */
    static getTechniqueChecks(technique) {
        return (TECHNIQUE_REALITY_CHECKS[technique] || [
            'Verify assumptions are correct',
            'Check for hidden contradictions',
            'Ensure solution fits constraints',
        ]);
    }
    /**
     * Analyze multiple outputs for reality patterns
     */
    static analyzeSessionReality(outputs) {
        const assessments = outputs
            .map(o => o.assessment)
            .filter((a) => a !== undefined);
        if (assessments.length < 2) {
            return {
                feasibilityTrend: 'stable',
                breakthroughsNeeded: new Set(),
                commonBarriers: new Map(),
            };
        }
        // Analyze feasibility trend
        const feasibilityScores = assessments.map(a => {
            switch (a.possibilityLevel) {
                case 'feasible':
                    return 3;
                case 'difficult':
                    return 2;
                case 'breakthrough-required':
                    return 1;
                case 'impossible':
                    return 0;
            }
        });
        const firstHalf = feasibilityScores.slice(0, Math.floor(feasibilityScores.length / 2));
        const secondHalf = feasibilityScores.slice(Math.floor(feasibilityScores.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const feasibilityTrend = secondAvg > firstAvg + 0.5
            ? 'improving'
            : secondAvg < firstAvg - 0.5
                ? 'declining'
                : 'stable';
        // Collect all breakthroughs needed
        const breakthroughsNeeded = new Set();
        assessments.forEach(a => {
            a.breakthroughsRequired?.forEach(b => breakthroughsNeeded.add(b));
        });
        // Count common barriers
        const commonBarriers = new Map();
        assessments.forEach(a => {
            if (a.impossibilityType) {
                commonBarriers.set(a.impossibilityType, (commonBarriers.get(a.impossibilityType) || 0) + 1);
            }
        });
        return {
            feasibilityTrend,
            breakthroughsNeeded,
            commonBarriers,
        };
    }
    /**
     * Generate breakthrough strategy based on assessments
     */
    static generateBreakthroughStrategy(analysis) {
        let strategy = '🚀 Breakthrough Strategy:\n\n';
        // Feasibility trend
        if (analysis.feasibilityTrend === 'improving') {
            strategy += '✅ Good progress: Ideas becoming more feasible\n';
        }
        else if (analysis.feasibilityTrend === 'declining') {
            strategy += '⚠️ Caution: Ideas becoming less feasible - consider reframing\n';
        }
        // Common barriers
        if (analysis.commonBarriers.size > 0) {
            strategy += '\n🔍 Focus Areas:\n';
            for (const [barrier, count] of analysis.commonBarriers) {
                strategy += `- ${barrier} barriers (${count} times)\n`;
            }
        }
        // Breakthroughs needed
        if (analysis.breakthroughsNeeded.size > 0) {
            strategy += '\n💡 Key Breakthroughs Needed:\n';
            let i = 1;
            for (const breakthrough of analysis.breakthroughsNeeded) {
                strategy += `${i}. ${breakthrough}\n`;
                i++;
                if (i > 5)
                    break; // Limit to top 5
            }
        }
        return strategy;
    }
}
//# sourceMappingURL=integration.js.map