/**
 * Reality Assessment Module
 *
 * Implements the Reality Gradient System that enhances creative thinking
 * by annotating ideas with their possibility levels and breakthrough requirements.
 *
 * Instead of blocking "impossible" ideas, this system shows what would need
 * to change for them to become possible, with historical precedents.
 */
/**
 * Confidence level constants for different assessment types
 */
const CONFIDENCE_LEVELS = {
    LOGICAL_CONTRADICTION: 0.95,
    PHYSICAL_LAW_VIOLATION: 0.9,
    REGULATORY_CONSTRAINT: 0.85,
    TECHNICAL_LIMITATION: 0.8,
    RESOURCE_CONSTRAINT: 0.75,
    FEASIBLE_DEFAULT: 0.7,
};
/**
 * Historical precedents of "impossible" becoming possible
 */
const HISTORICAL_PRECEDENTS = {
    flight: [
        'Pre-1903: Human flight was deemed impossible',
        '1903: Wright Brothers achieve powered flight',
        'Breakthrough: Understanding of aerodynamics + lightweight engines',
    ],
    space_travel: [
        '1920s: Rocket to moon considered fantasy',
        '1969: Apollo 11 lands on moon',
        'Breakthrough: Rocket propulsion + computing + materials science',
    ],
    instant_global_communication: [
        '1800s: Instant worldwide communication impossible',
        '1990s: Internet enables real-time global communication',
        'Breakthrough: Electronics + fiber optics + protocols',
    ],
    remote_work: [
        'Pre-2020: "Most jobs require physical presence"',
        '2020: Pandemic proves remote work viable at scale',
        'Breakthrough: Video conferencing + cloud computing + cultural shift',
    ],
    ai_creativity: [
        '2010: "AI will never be creative"',
        '2020s: AI generates art, music, and text',
        'Breakthrough: Neural networks + massive compute + large datasets',
    ],
};
/**
 * Common breakthrough patterns by impossibility type
 */
const BREAKTHROUGH_PATTERNS = {
    logical: [
        'Reframe the problem to avoid contradiction',
        'Question fundamental assumptions',
        'Find a different logical system',
    ],
    physical: [
        'Discover new physical principles',
        'Work within constraints creatively',
        'Find loopholes in current understanding',
    ],
    technical: [
        'Develop new technologies',
        'Combine existing technologies differently',
        "Wait for Moore's Law progression",
    ],
    regulatory: [
        'Change laws or regulations',
        'Find regulatory arbitrage',
        'Create new category outside current rules',
    ],
    resource: [
        'Find cheaper alternatives',
        'Create abundance through innovation',
        'Change business model to reduce costs',
    ],
    social: [
        'Cultural evolution over time',
        'Find early adopter communities',
        'Reframe to align with values',
    ],
};
export class RealityAssessor {
    /**
     * Assess the reality gradient of an idea or solution
     */
    static assess(idea, context, domain) {
        // Analyze the idea for impossibility markers
        const analysis = this.analyzeIdea(idea, context, domain);
        // Find relevant historical precedents
        const precedents = this.findPrecedents(analysis);
        // Determine breakthrough requirements
        const breakthroughs = this.identifyBreakthroughs(analysis);
        return {
            possibilityLevel: analysis.level,
            impossibilityType: analysis.type,
            breakthroughsRequired: breakthroughs,
            historicalPrecedents: precedents,
            confidenceLevel: analysis.confidence,
            mechanismExplanation: analysis.mechanism,
        };
    }
    /**
     * Analyze idea for impossibility markers with early returns for performance
     */
    static analyzeIdea(idea, context, domain) {
        const lowerIdea = idea.toLowerCase();
        const lowerContext = context.toLowerCase();
        // Order checks by likelihood and computational cost
        // 1. Domain-specific regulatory constraints (if domain provided)
        if (domain && this.hasRegulatoryConstraints(lowerIdea, domain)) {
            return {
                level: 'breakthrough-required',
                type: 'regulatory',
                confidence: CONFIDENCE_LEVELS.REGULATORY_CONSTRAINT,
                mechanism: 'Current regulations prohibit this approach',
            };
        }
        // 2. Physical law violations (common in innovation requests)
        if (this.violatesPhysicalLaws(lowerIdea, lowerContext)) {
            return {
                level: 'breakthrough-required',
                type: 'physical',
                confidence: CONFIDENCE_LEVELS.PHYSICAL_LAW_VIOLATION,
                mechanism: 'Would require new physics or energy source',
            };
        }
        // 3. Logical contradictions (less common but critical)
        if (this.hasLogicalContradiction(lowerIdea, lowerContext)) {
            return {
                level: 'impossible',
                type: 'logical',
                confidence: CONFIDENCE_LEVELS.LOGICAL_CONTRADICTION,
                mechanism: 'Contains self-contradictory requirements',
            };
        }
        // 4. Technical limitations (common in tech problems)
        if (this.hasTechnicalLimitations(lowerIdea, lowerContext)) {
            return {
                level: 'difficult',
                type: 'technical',
                confidence: CONFIDENCE_LEVELS.TECHNICAL_LIMITATION,
                mechanism: 'Requires advancing current technology',
            };
        }
        // 5. Resource constraints (least specific check)
        if (this.hasResourceConstraints(lowerIdea, lowerContext)) {
            return {
                level: 'difficult',
                type: 'resource',
                confidence: CONFIDENCE_LEVELS.RESOURCE_CONSTRAINT,
                mechanism: 'Requires significant resources or cost reduction',
            };
        }
        // Default to feasible
        return {
            level: 'feasible',
            confidence: CONFIDENCE_LEVELS.FEASIBLE_DEFAULT,
            mechanism: 'No major barriers identified',
        };
    }
    /**
     * Check for logical contradictions
     */
    static hasLogicalContradiction(idea, context) {
        const contradictionPatterns = [
            /both\s+(\w+)\s+and\s+not\s+\1/,
            /both.*open\s+and.*closed/i,
            /both.*closed\s+and.*open/i,
            /simultaneously\s+(\w+)\s+and\s+(\w+).*mutually\s+exclusive/,
            /wants?\s+to\s+(\w+)\s+without\s+(\w+ing)/,
            /maintain.*while.*eliminating/,
            /keep.*position.*while.*selling/,
            /eliminate\s+all.*while\s+maintaining/,
            /without.*but.*must/,
        ];
        const combined = `${idea} ${context}`.toLowerCase();
        return contradictionPatterns.some(pattern => pattern.test(combined));
    }
    /**
     * Check for physical law violations
     */
    static violatesPhysicalLaws(idea, context) {
        // Pattern-based physics violation detection
        const physicsPatterns = [
            /perpetual\s*motion/i,
            /free\s*energy/i,
            /faster\s*than\s*light/i,
            /create\s*matter\s*from\s*nothing/i,
            /time\s*travel\s*to\s*past/i,
            /100%\s*efficiency/i,
            /entropy\s*reversal/i,
            /zero\s*point\s*energy\s*extraction/i,
            /anti[\s-]*gravity/i,
        ];
        const combined = `${idea} ${context}`.toLowerCase();
        return physicsPatterns.some(pattern => pattern.test(combined));
    }
    /**
     * Check for regulatory constraints
     */
    static hasRegulatoryConstraints(idea, domain) {
        if (!domain)
            return false;
        const regulatoryKeywords = {
            finance: [
                'insider trading',
                'market manipulation',
                'ponzi',
                'pyramid scheme',
                'substantially identical',
                'sell and immediately buy back',
                'tax loss harvesting',
            ],
            healthcare: ['unapproved treatment', 'experimental drug', 'unlicensed practice'],
            tax: ['tax evasion', 'substantially identical', 'wash sale'],
            data: ['personal data without consent', 'violate privacy', 'sell user data'],
        };
        const keywords = regulatoryKeywords[domain] || [];
        return keywords.some(keyword => idea.includes(keyword));
    }
    /**
     * Check for technical limitations
     */
    static hasTechnicalLimitations(idea, context) {
        const technicalMarkers = [
            "requires technology that doesn't exist",
            'beyond current capabilities',
            'need breakthrough in',
            'waiting for',
            'not yet possible',
            'theoretical only',
            'capture all',
            'all solar energy',
        ];
        const combined = `${idea} ${context}`;
        return technicalMarkers.some(marker => combined.includes(marker));
    }
    /**
     * Check for resource constraints
     */
    static hasResourceConstraints(idea, context) {
        const resourceMarkers = [
            'too expensive',
            'requires billions',
            'massive infrastructure',
            'scarce resources',
            'limited supply',
            'economically unfeasible',
        ];
        const combined = `${idea} ${context}`;
        return resourceMarkers.some(marker => combined.includes(marker));
    }
    /**
     * Find relevant historical precedents
     * @returns Array of precedents (always returns an array, never undefined)
     */
    static findPrecedents(analysis) {
        if (analysis.level === 'feasible') {
            return ['Many similar ideas have been successfully implemented'];
        }
        const precedents = [];
        // Add general precedents based on type
        if (analysis.type === 'technical') {
            precedents.push(...HISTORICAL_PRECEDENTS.ai_creativity);
        }
        else if (analysis.type === 'physical') {
            precedents.push(...HISTORICAL_PRECEDENTS.flight);
            precedents.push(...HISTORICAL_PRECEDENTS.space_travel);
        }
        else if (analysis.type === 'social') {
            precedents.push(...HISTORICAL_PRECEDENTS.remote_work);
        }
        else if (analysis.type === 'resource') {
            precedents.push(...HISTORICAL_PRECEDENTS.instant_global_communication);
        }
        // Always return an array, even if empty
        return precedents.length > 0 ? precedents.slice(0, 3) : [];
    }
    /**
     * Identify required breakthroughs
     * @returns Array of breakthrough requirements (always returns an array, never undefined)
     */
    static identifyBreakthroughs(analysis) {
        if (analysis.level === 'feasible') {
            return ['No major breakthroughs required'];
        }
        if (analysis.level === 'impossible' && analysis.type === 'logical') {
            return ['Fundamental reframing of the problem required'];
        }
        if (analysis.type && BREAKTHROUGH_PATTERNS[analysis.type]) {
            return BREAKTHROUGH_PATTERNS[analysis.type];
        }
        return ['Unknown breakthroughs needed'];
    }
    /**
     * Generate possibility navigator output
     */
    static generateNavigatorOutput(idea, assessment) {
        let output = `Idea: "${idea}"\n`;
        output += `Reality Assessment:\n`;
        output += `- Level: ${assessment.possibilityLevel}`;
        if (assessment.impossibilityType) {
            output += ` (${assessment.impossibilityType})`;
        }
        output += `\n`;
        if (assessment.impossibilityType) {
            output += `- Type: ${assessment.impossibilityType} impossibility\n`;
        }
        if (assessment.breakthroughsRequired && assessment.breakthroughsRequired.length > 0) {
            output += `- Breakthroughs required:\n`;
            assessment.breakthroughsRequired.forEach(b => {
                output += `  • ${b}\n`;
            });
        }
        if (assessment.historicalPrecedents && assessment.historicalPrecedents.length > 0) {
            output += `- Historical precedents:\n`;
            assessment.historicalPrecedents.forEach(p => {
                output += `  • ${p}\n`;
            });
        }
        if (assessment.mechanismExplanation) {
            output += `- Mechanism: ${assessment.mechanismExplanation}\n`;
        }
        output += `- Confidence: ${Math.round(assessment.confidenceLevel * 100)}%\n`;
        return output;
    }
}
//# sourceMappingURL=index.js.map