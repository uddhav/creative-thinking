/**
 * Result Structuring Strategies
 * Different ways to structure parallel results for LLM consumption
 */
export class ResultStructures {
    createHierarchicalStructure(results) {
        return {
            type: 'hierarchical',
            summary: {
                techniqueCount: results.length,
                totalInsights: this.countTotalInsights(results),
                totalIdeas: this.countTotalIdeas(results),
                executionTime: this.calculateTotalTime(results),
            },
            techniques: results.map(result => ({
                technique: result.technique,
                summary: this.summarizeTechnique(result),
                keyInsights: this.extractKeyInsights(result),
                ideas: this.structureIdeas(result),
                risks: this.structureRisks(result),
                metrics: result.metrics,
                subSections: this.createSubSections(result),
            })),
            crossTechniqueAnalysis: {
                commonThemes: this.findCommonThemes(results),
                divergentPerspectives: this.findDivergentPerspectives(results),
                complementaryInsights: this.findComplementaryInsights(results),
            },
        };
    }
    createFlatStructure(results) {
        const allIdeas = [];
        const allInsights = [];
        const allRisks = [];
        results.forEach(result => {
            // Extract ideas
            const ideas = this.extractAllIdeas(result);
            ideas.forEach((idea, index) => {
                allIdeas.push({
                    id: `${result.technique}_idea_${index}`,
                    content: idea,
                    technique: result.technique,
                    category: this.categorizeIdea(idea),
                    tags: this.extractTags(idea),
                    confidence: result.metrics?.confidence,
                });
            });
            // Extract insights
            if (result.insights) {
                result.insights.forEach((insight) => {
                    allInsights.push({
                        insight,
                        technique: result.technique,
                        importance: this.assessImportance(insight),
                    });
                });
            }
            // Extract risks from results (assuming they're stored in the results object)
            // TODO: Update this when actual risk structure is defined
            const resultData = result.results;
            const risks = resultData?.risks;
            if (risks && Array.isArray(risks)) {
                risks.forEach((risk) => {
                    const riskDescription = typeof risk === 'string'
                        ? risk
                        : risk?.description || 'Unknown risk';
                    allRisks.push({
                        risk: riskDescription,
                        technique: result.technique,
                        severity: this.assessSeverity(riskDescription),
                        mitigation: this.suggestMitigation(riskDescription),
                    });
                });
            }
        });
        return {
            type: 'flat',
            allIdeas,
            allInsights,
            allRisks,
        };
    }
    createComparativeStructure(results) {
        const dimensions = this.identifyComparisonDimensions(results);
        return {
            type: 'comparative',
            dimensions: dimensions.map(dim => ({
                name: dim.name,
                description: dim.description,
                techniqueComparisons: results.map(result => ({
                    technique: result.technique,
                    value: this.extractDimensionValue(result, dim),
                    evidence: this.extractDimensionEvidence(result, dim),
                })),
            })),
            comparisonMatrix: this.createComparisonMatrix(results, dimensions),
            recommendations: this.generateComparativeRecommendations(results, dimensions),
        };
    }
    createNarrativeStructure(results, problem) {
        return {
            type: 'narrative',
            story: this.weaveNarrative(results, problem),
            chapters: [
                {
                    title: 'The Challenge',
                    content: this.narrateProblemContext(problem, results),
                },
                {
                    title: 'Multiple Perspectives',
                    content: this.narrateTechniqueJourneys(results),
                },
                {
                    title: 'Emerging Insights',
                    content: this.narrateEmergingPatterns(results),
                },
                {
                    title: 'Synthesis Opportunities',
                    content: this.narrateSynthesisOpportunities(results),
                },
            ],
            callToAction: this.createCallToAction(results),
        };
    }
    // Helper methods for hierarchical structure
    countTotalInsights(results) {
        return results.reduce((sum, r) => sum + (r.insights?.length || 0), 0);
    }
    countTotalIdeas(results) {
        return results.reduce((sum, r) => {
            let count = r.insights?.length || 0;
            if (r.results && typeof r.results === 'object') {
                count += Object.keys(r.results).length;
            }
            return sum + count;
        }, 0);
    }
    calculateTotalTime(results) {
        return Math.max(...results.map(r => r.metrics?.executionTime || 0));
    }
    summarizeTechnique(result) {
        const insightCount = result.insights?.length || 0;
        const resultData = result.results;
        const risks = resultData?.risks;
        const riskCount = risks?.length || 0;
        const completeness = result.metrics?.completedSteps
            ? `${result.metrics.completedSteps}/${result.metrics.totalSteps} steps`
            : 'unknown';
        return `Generated ${insightCount} insights and identified ${riskCount} risks. Completeness: ${completeness}`;
    }
    extractKeyInsights(result) {
        return result.insights?.slice(0, 3) || [];
    }
    structureIdeas(result) {
        const ideas = [];
        // Extract from insights
        if (result.insights) {
            result.insights.forEach((insight, index) => {
                ideas.push({
                    id: `${result.technique}_insight_${index}`,
                    content: insight,
                    category: 'insight',
                    confidence: result.metrics?.confidence,
                });
            });
        }
        // Extract from results object
        if (result.results && typeof result.results === 'object') {
            Object.entries(result.results).forEach(([key, value]) => {
                ideas.push({
                    id: `${result.technique}_${key}`,
                    content: String(value),
                    category: key,
                    confidence: result.metrics?.confidence,
                });
            });
        }
        return ideas;
    }
    structureRisks(result) {
        const resultData = result.results;
        const risks = resultData?.risks;
        if (!risks || !Array.isArray(risks))
            return [];
        return risks.map((risk) => {
            const riskDescription = typeof risk === 'string'
                ? risk
                : risk?.description || 'Unknown risk';
            return {
                description: riskDescription,
                severity: this.assessSeverity(riskDescription),
                mitigation: this.suggestMitigation(riskDescription),
            };
        });
    }
    createSubSections(result) {
        const sections = [];
        // Add technique-specific sections based on available data
        if (result.metrics?.pathDependencies) {
            sections.push({
                title: 'Path Dependencies',
                content: `Identified ${result.metrics.pathDependencies} path dependencies that may affect future options.`,
            });
        }
        if (result.metrics?.flexibility !== undefined) {
            sections.push({
                title: 'Flexibility Assessment',
                content: `Current flexibility score: ${(result.metrics.flexibility * 100).toFixed(0)}%`,
            });
        }
        return sections;
    }
    findCommonThemes(results) {
        const themeMap = new Map();
        // Extract themes from each result
        results.forEach(result => {
            const themes = this.extractThemes(result);
            themes.forEach(theme => {
                if (!themeMap.has(theme)) {
                    themeMap.set(theme, { techniques: new Set(), evidence: [] });
                }
                const entry = themeMap.get(theme);
                if (entry) {
                    entry.techniques.add(result.technique);
                    if (result.insights && result.insights.length > 0) {
                        entry.evidence.push(`${result.technique}: ${result.insights[0]}`);
                    }
                }
            });
        });
        // Convert to array format
        return Array.from(themeMap.entries())
            .filter(([_, data]) => data.techniques.size > 1) // Only common themes
            .map(([theme, data]) => ({
            theme,
            techniques: Array.from(data.techniques),
            evidence: data.evidence.slice(0, 3),
        }));
    }
    findDivergentPerspectives(results) {
        // Identify topics where techniques have different views
        const topics = ['approach', 'priority', 'risk', 'timeline'];
        const perspectives = [];
        topics.forEach(topic => {
            const views = results
                .map(result => ({
                technique: result.technique,
                view: this.extractViewOnTopic(result, topic),
            }))
                .filter(v => v.view !== null);
            if (views.length > 1 && this.hasSignificantDivergence(views)) {
                perspectives.push({
                    topic,
                    perspectives: views,
                });
            }
        });
        return perspectives;
    }
    findComplementaryInsights(results) {
        const complementary = [];
        // Look for insights that work well together
        for (let i = 0; i < results.length; i++) {
            for (let j = i + 1; j < results.length; j++) {
                const synergies = this.findSynergies(results[i], results[j]);
                complementary.push(...synergies);
            }
        }
        return complementary.slice(0, 5); // Top 5 synergies
    }
    // Helper methods for flat structure
    extractAllIdeas(result) {
        const ideas = [];
        if (result.insights) {
            ideas.push(...result.insights);
        }
        if (result.results && typeof result.results === 'object') {
            Object.values(result.results).forEach(value => {
                if (typeof value === 'string') {
                    ideas.push(value);
                }
            });
        }
        return ideas;
    }
    categorizeIdea(idea) {
        // Simple categorization based on keywords
        if (idea.toLowerCase().includes('user') || idea.toLowerCase().includes('customer')) {
            return 'user-focused';
        }
        if (idea.toLowerCase().includes('technical') || idea.toLowerCase().includes('system')) {
            return 'technical';
        }
        if (idea.toLowerCase().includes('business') || idea.toLowerCase().includes('revenue')) {
            return 'business';
        }
        return 'general';
    }
    extractTags(idea) {
        const tags = [];
        const keywords = [
            'innovation',
            'efficiency',
            'scalability',
            'cost',
            'quality',
            'automation',
            'design',
            'implementation',
        ];
        keywords.forEach(keyword => {
            if (idea.toLowerCase().includes(keyword)) {
                tags.push(keyword);
            }
        });
        return tags;
    }
    assessImportance(insight) {
        // Simple importance assessment based on keywords
        const highImportanceKeywords = ['critical', 'essential', 'must', 'key', 'fundamental'];
        const lowImportanceKeywords = ['minor', 'optional', 'nice-to-have', 'consider'];
        const insightLower = insight.toLowerCase();
        if (highImportanceKeywords.some(keyword => insightLower.includes(keyword))) {
            return 'high';
        }
        if (lowImportanceKeywords.some(keyword => insightLower.includes(keyword))) {
            return 'low';
        }
        return 'medium';
    }
    assessSeverity(risk) {
        const highSeverityKeywords = ['critical', 'severe', 'major', 'catastrophic'];
        const lowSeverityKeywords = ['minor', 'small', 'minimal', 'negligible'];
        const riskLower = risk.toLowerCase();
        if (highSeverityKeywords.some(keyword => riskLower.includes(keyword))) {
            return 'high';
        }
        if (lowSeverityKeywords.some(keyword => riskLower.includes(keyword))) {
            return 'low';
        }
        return 'medium';
    }
    suggestMitigation(risk) {
        // Simple mitigation suggestions based on risk type
        if (risk.toLowerCase().includes('user')) {
            return 'Conduct user testing and gather feedback';
        }
        if (risk.toLowerCase().includes('technical')) {
            return 'Perform technical proof of concept';
        }
        if (risk.toLowerCase().includes('resource')) {
            return 'Allocate contingency resources';
        }
        return 'Monitor closely and develop contingency plan';
    }
    // Helper methods for comparative structure
    identifyComparisonDimensions(results) {
        const dimensions = [
            { name: 'Innovation Level', description: 'How innovative are the solutions?' },
            { name: 'Implementation Complexity', description: 'How complex to implement?' },
        ];
        // Add risk dimension only if risks were identified
        const hasRisks = results.some(r => {
            const resultData = r.results;
            const risks = resultData?.risks;
            return risks && risks.length > 0;
        });
        if (hasRisks) {
            dimensions.push({ name: 'Risk Level', description: 'What is the overall risk?' });
        }
        // Always include these
        dimensions.push({ name: 'User Impact', description: 'How much does it impact users?' }, { name: 'Resource Requirements', description: 'What resources are needed?' });
        return dimensions;
    }
    extractDimensionValue(result, dimension) {
        // Extract values based on dimension
        switch (dimension.name) {
            case 'Innovation Level':
                return this.assessInnovation(result);
            case 'Implementation Complexity':
                return this.assessComplexity(result);
            case 'Risk Level': {
                const resultData = result.results;
                const risks = resultData?.risks;
                return risks?.length || 0;
            }
            case 'User Impact':
                return this.assessUserImpact(result);
            case 'Resource Requirements':
                return this.assessResourceNeeds(result);
            default:
                return 'Unknown';
        }
    }
    extractDimensionEvidence(result, dimension) {
        const evidence = [];
        if (result.insights) {
            result.insights.forEach((insight) => {
                if (this.insightRelatedToDimension(insight, dimension)) {
                    evidence.push(insight);
                }
            });
        }
        return evidence.slice(0, 2);
    }
    createComparisonMatrix(results, dimensions) {
        const matrix = {};
        results.forEach(result => {
            matrix[result.technique] = {};
            dimensions.forEach(dim => {
                matrix[result.technique][dim.name] = this.extractDimensionValue(result, dim);
            });
        });
        return matrix;
    }
    generateComparativeRecommendations(results, dimensions) {
        const recommendations = [];
        // Find best technique for each dimension
        dimensions.forEach(dim => {
            const best = this.findBestForDimension(results, dim);
            if (best) {
                recommendations.push(`For ${dim.name.toLowerCase()}, consider ${best.technique} approach`);
            }
        });
        return recommendations;
    }
    // Helper methods for narrative structure
    weaveNarrative(results, problem) {
        return `Our journey began with a challenge: "${problem}". We embarked on a parallel exploration, employing ${results.length} different creative thinking techniques simultaneously. Each technique offered its unique lens, revealing different facets of the problem and potential solutions.`;
    }
    narrateProblemContext(problem, results) {
        return `The challenge we faced was clear yet complex: "${problem}". To tackle this multifaceted problem, we chose to approach it from ${results.length} different angles simultaneously, knowing that each perspective would reveal unique insights and opportunities.`;
    }
    narrateTechniqueJourneys(results) {
        const journeys = results
            .map(result => `The ${result.technique} approach ${this.describeTechniqueJourney(result)}`)
            .join('\n\n');
        return `Each technique took us on a different journey:\n\n${journeys}`;
    }
    narrateEmergingPatterns(results) {
        const themes = this.findCommonThemes(results);
        const themeNarrative = themes.length > 0
            ? `Common themes emerged across our explorations: ${themes.map(t => t.theme).join(', ')}.`
            : 'While each technique offered unique insights, surprising patterns began to emerge.';
        return `${themeNarrative} These convergent insights suggest deeper truths about our challenge and point toward integrated solutions.`;
    }
    narrateSynthesisOpportunities(results) {
        const synergies = this.findComplementaryInsights(results);
        const synergyCount = synergies.length;
        return `The parallel exploration has revealed ${results.length} distinct pathways forward. ${synergyCount > 0
            ? `We discovered ${synergyCount} synergistic combinations where techniques complement each other beautifully.`
            : 'Each technique offers unique perspectives.'} The richness of these perspectives creates opportunities for innovative synthesis.`;
    }
    createCallToAction(results) {
        const totalIdeas = this.countTotalIdeas(results);
        return `With ${totalIdeas} ideas generated across ${results.length} techniques, the next step is to synthesize these insights into a coherent action plan. Consider which combinations of approaches best address your specific context and constraints.`;
    }
    // Utility methods
    extractThemes(result) {
        const themes = [];
        const text = JSON.stringify(result.insights || []) + JSON.stringify(result.results || {});
        const themeKeywords = [
            'innovation',
            'efficiency',
            'user experience',
            'scalability',
            'sustainability',
            'collaboration',
            'automation',
            'quality',
        ];
        themeKeywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword)) {
                themes.push(keyword);
            }
        });
        return themes;
    }
    extractViewOnTopic(result, topic) {
        // Extract technique's view on a specific topic
        if (!result.insights)
            return null;
        for (const insight of result.insights) {
            if (insight.toLowerCase().includes(topic)) {
                return insight;
            }
        }
        return null;
    }
    hasSignificantDivergence(views) {
        // Simple check for divergence
        const uniqueViews = new Set(views.map(v => v.view));
        return uniqueViews.size > 1;
    }
    findSynergies(result1, result2) {
        const synergies = [];
        // Look for complementary insights
        if (result1.insights && result2.insights) {
            // Simple synergy detection based on complementary themes
            const themes1 = this.extractThemes(result1);
            const themes2 = this.extractThemes(result2);
            themes1.forEach(theme1 => {
                themes2.forEach(theme2 => {
                    if (this.areComplementary(theme1, theme2)) {
                        synergies.push({
                            insight: `${theme1} + ${theme2} synergy`,
                            techniques: [result1.technique, result2.technique],
                            synergy: `${result1.technique}'s ${theme1} approach complements ${result2.technique}'s ${theme2} perspective`,
                        });
                    }
                });
            });
        }
        return synergies;
    }
    areComplementary(theme1, theme2) {
        const complementaryPairs = [
            ['innovation', 'implementation'],
            ['user experience', 'technical'],
            ['efficiency', 'quality'],
            ['scalability', 'sustainability'],
        ];
        return complementaryPairs.some(pair => (pair.includes(theme1) && pair.includes(theme2)) ||
            (pair.includes(theme2) && pair.includes(theme1)));
    }
    assessInnovation(result) {
        const innovationKeywords = ['novel', 'breakthrough', 'innovative', 'creative', 'unique'];
        let score = 0;
        if (result.insights) {
            result.insights.forEach((insight) => {
                innovationKeywords.forEach(keyword => {
                    if (insight.toLowerCase().includes(keyword))
                        score++;
                });
            });
        }
        if (score >= 3)
            return 'High';
        if (score >= 1)
            return 'Medium';
        return 'Low';
    }
    assessComplexity(result) {
        const complexityIndicators = [
            'complex',
            'difficult',
            'challenging',
            'intricate',
            'sophisticated',
        ];
        let score = 0;
        if (result.insights) {
            result.insights.forEach((insight) => {
                complexityIndicators.forEach(indicator => {
                    if (insight.toLowerCase().includes(indicator))
                        score++;
                });
            });
        }
        if (score >= 3)
            return 'High';
        if (score >= 1)
            return 'Medium';
        return 'Low';
    }
    assessUserImpact(result) {
        const userKeywords = ['user', 'customer', 'experience', 'satisfaction', 'engagement'];
        let mentions = 0;
        const text = JSON.stringify(result.insights || []);
        userKeywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword))
                mentions++;
        });
        if (mentions >= 3)
            return 'High';
        if (mentions >= 1)
            return 'Medium';
        return 'Low';
    }
    assessResourceNeeds(result) {
        const resourceKeywords = ['resource', 'budget', 'time', 'team', 'investment'];
        let mentions = 0;
        const text = JSON.stringify(result.insights || []);
        resourceKeywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword))
                mentions++;
        });
        if (mentions >= 3)
            return 'High';
        if (mentions >= 1)
            return 'Medium';
        return 'Low';
    }
    insightRelatedToDimension(insight, dimension) {
        const dimensionKeywords = {
            'Innovation Level': ['innovative', 'novel', 'creative', 'breakthrough'],
            'Implementation Complexity': ['complex', 'simple', 'difficult', 'straightforward'],
            'Risk Level': ['risk', 'danger', 'uncertainty', 'safe'],
            'User Impact': ['user', 'customer', 'experience', 'satisfaction'],
            'Resource Requirements': ['resource', 'cost', 'time', 'budget'],
        };
        const keywords = dimensionKeywords[dimension.name] || [];
        return keywords.some(keyword => insight.toLowerCase().includes(keyword));
    }
    findBestForDimension(results, dimension) {
        // Simple selection based on dimension
        let best = null;
        let bestScore = -1;
        results.forEach(result => {
            const score = this.scoreTechniqueForDimension(result, dimension);
            if (score > bestScore) {
                bestScore = score;
                best = result;
            }
        });
        return best;
    }
    scoreTechniqueForDimension(result, dimension) {
        // Simple scoring based on evidence
        const evidence = this.extractDimensionEvidence(result, dimension);
        return evidence.length;
    }
    describeTechniqueJourney(result) {
        const insightCount = result.insights?.length || 0;
        const descriptor = insightCount > 5 ? 'revealed numerous' : 'uncovered several';
        return `${descriptor} insights, focusing on ${this.extractThemes(result).join(' and ')} aspects of the challenge.`;
    }
}
//# sourceMappingURL=ResultStructures.js.map