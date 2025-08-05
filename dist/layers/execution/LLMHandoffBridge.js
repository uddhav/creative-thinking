/**
 * LLM Handoff Bridge
 * Formats parallel creative thinking results for flexible LLM synthesis
 */
import { randomUUID } from 'crypto';
import { ResultStructures } from './handoff/ResultStructures.js';
import { SynthesisPromptGenerator } from './handoff/SynthesisPromptGenerator.js';
import { VisualizationGenerator } from './handoff/VisualizationGenerator.js';
import { NextActionSuggester } from './handoff/NextActionSuggester.js';
export class LLMHandoffBridge {
    sessionManager;
    metricsCollector;
    resultStructures;
    promptGenerator;
    visualizationGenerator;
    actionSuggester;
    constructor(sessionManager, metricsCollector) {
        this.sessionManager = sessionManager;
        this.metricsCollector = metricsCollector;
        this.resultStructures = new ResultStructures();
        this.promptGenerator = new SynthesisPromptGenerator();
        this.visualizationGenerator = new VisualizationGenerator();
        this.actionSuggester = new NextActionSuggester();
    }
    prepareHandoff(parallelResults, problem, options = {}) {
        // 1. Gather and structure results
        const structuredResults = this.structureResults(parallelResults, problem, options);
        // 2. Generate context summary
        const contextSummary = this.generateContextSummary(parallelResults, problem);
        // 3. Create synthesis prompts
        const synthesisPrompts = this.promptGenerator.generateSynthesisPrompts(structuredResults, problem, options.promptStrategy || 'comprehensive');
        // 4. Prepare metadata
        const metadata = this.prepareMetadata(parallelResults);
        // 5. Generate visualization data
        const visualizations = options.visualizationLevel !== 'none'
            ? this.visualizationGenerator.generateVisualizations(parallelResults)
            : [];
        // 6. Create action recommendations
        const suggestedActions = this.actionSuggester.suggestNextActions(parallelResults, options);
        // 7. Create the handoff package
        const handoffPackage = {
            handoffId: `handoff_${randomUUID()}`,
            timestamp: Date.now(),
            structuredResults,
            contextSummary,
            synthesisPrompts,
            metadata,
            visualizations,
            suggestedActions,
        };
        // 8. Optionally include raw data
        if (options.includeRawData) {
            handoffPackage.rawResults = parallelResults;
        }
        return handoffPackage;
    }
    structureResults(parallelResults, problem, options) {
        const format = options.structuredFormat || 'hierarchical';
        switch (format) {
            case 'hierarchical':
                return this.resultStructures.createHierarchicalStructure(parallelResults);
            case 'flat':
                return this.resultStructures.createFlatStructure(parallelResults);
            case 'comparative':
                return this.resultStructures.createComparativeStructure(parallelResults);
            case 'narrative':
                return this.resultStructures.createNarrativeStructure(parallelResults, problem);
            default:
                return this.resultStructures.createHierarchicalStructure(parallelResults);
        }
    }
    generateContextSummary(parallelResults, problem) {
        const keyFindings = [];
        const majorThemes = [];
        const criticalDecisions = [];
        // Extract key findings from each result
        parallelResults.forEach(result => {
            if (result.insights && result.insights.length > 0) {
                keyFindings.push(...result.insights.slice(0, 2));
            }
            // Extract themes based on frequency analysis
            const themes = this.extractThemes(result);
            majorThemes.push(...themes);
            // Extract critical decisions
            if (result.metrics?.criticalDecisions) {
                // Since metrics is Record<string, number>, we need to handle this differently
                // TODO: Define proper structure for critical decisions
                criticalDecisions.push(`Decision from ${result.technique}`);
            }
        });
        // Deduplicate and limit
        const uniqueThemes = [...new Set(majorThemes)].slice(0, 5);
        const uniqueDecisions = [...new Set(criticalDecisions)].slice(0, 3);
        return {
            problem,
            techniqueCount: parallelResults.length,
            executionTime: this.calculateTotalExecutionTime(parallelResults),
            keyFindings: keyFindings.slice(0, 5),
            majorThemes: uniqueThemes,
            criticalDecisions: uniqueDecisions,
        };
    }
    prepareMetadata(parallelResults) {
        const parallelExecutionStats = this.calculateExecutionStats(parallelResults);
        const techniquePerformance = this.calculateTechniqueMetrics(parallelResults);
        const qualityIndicators = this.assessQuality(parallelResults);
        const completeness = this.calculateCompleteness(parallelResults);
        return {
            parallelExecutionStats,
            techniquePerformance,
            qualityIndicators,
            completeness,
        };
    }
    calculateExecutionStats(results) {
        const totalExecutionTime = this.calculateTotalExecutionTime(results);
        const techniqueCompletionRates = {};
        const stepCounts = {};
        results.forEach(result => {
            const completedSteps = result.metrics?.completedSteps || 0;
            const totalSteps = result.metrics?.totalSteps || 1;
            techniqueCompletionRates[result.technique] = completedSteps / totalSteps;
            stepCounts[result.technique] = completedSteps;
        });
        // Calculate parallelism efficiency (how much time was saved)
        const sequentialTime = results.reduce((sum, r) => sum + (r.metrics?.executionTime || 0), 0);
        const parallelismEfficiency = sequentialTime > 0 ? totalExecutionTime / sequentialTime : 1;
        return {
            totalExecutionTime,
            parallelismEfficiency,
            techniqueCompletionRates,
            stepCounts,
        };
    }
    calculateTechniqueMetrics(results) {
        return results.map(result => ({
            technique: result.technique,
            ideaCount: this.countIdeas(result),
            insightCount: result.insights?.length || 0,
            riskCount: result.results?.risks?.length || 0,
            completeness: this.calculateTechniqueCompleteness(result),
            confidence: result.metrics?.confidence || 0.5,
            executionTime: result.metrics?.executionTime || 0,
        }));
    }
    assessQuality(results) {
        const ideaDiversity = this.calculateIdeaDiversity(results);
        const insightDepth = this.calculateInsightDepth(results);
        const riskCoverage = this.calculateRiskCoverage(results);
        const overall = (ideaDiversity + insightDepth + riskCoverage) / 3;
        return {
            ideaDiversity,
            insightDepth,
            riskCoverage,
            overall,
        };
    }
    // Helper methods
    extractThemes(result) {
        const themes = [];
        const text = JSON.stringify(result.insights || []) + JSON.stringify(result.results || {});
        // Simple theme extraction based on common keywords
        const themeKeywords = [
            'innovation',
            'efficiency',
            'user experience',
            'cost',
            'quality',
            'scalability',
            'sustainability',
            'collaboration',
            'automation',
            'optimization',
        ];
        themeKeywords.forEach(keyword => {
            if (text.toLowerCase().includes(keyword)) {
                themes.push(keyword);
            }
        });
        return themes;
    }
    calculateTotalExecutionTime(results) {
        // In parallel execution, total time is the max of individual times
        return Math.max(...results.map(r => r.metrics?.executionTime || 0));
    }
    countIdeas(result) {
        let count = 0;
        // Count from insights
        if (result.insights) {
            count += result.insights.length;
        }
        // Count from results object
        if (result.results && typeof result.results === 'object') {
            count += Object.keys(result.results).length;
        }
        return count;
    }
    calculateTechniqueCompleteness(result) {
        const completedSteps = result.metrics?.completedSteps || 0;
        const totalSteps = result.metrics?.totalSteps || 1;
        return completedSteps / totalSteps;
    }
    calculateCompleteness(results) {
        if (results.length === 0)
            return 0;
        const totalCompleteness = results.reduce((sum, result) => sum + this.calculateTechniqueCompleteness(result), 0);
        return totalCompleteness / results.length;
    }
    calculateIdeaDiversity(results) {
        // Simple diversity calculation based on unique categories/themes
        const uniqueCategories = new Set();
        results.forEach(result => {
            const themes = this.extractThemes(result);
            themes.forEach(theme => uniqueCategories.add(theme));
        });
        // Normalize to 0-1 scale (assuming 10 categories is maximum diversity)
        return Math.min(uniqueCategories.size / 10, 1);
    }
    calculateInsightDepth(results) {
        // Calculate based on average insight length and complexity
        let totalDepth = 0;
        let insightCount = 0;
        results.forEach(result => {
            if (result.insights) {
                result.insights.forEach((insight) => {
                    // Simple depth metric based on length
                    const depth = Math.min(insight.length / 200, 1); // 200 chars = max depth
                    totalDepth += depth;
                    insightCount++;
                });
            }
        });
        return insightCount > 0 ? totalDepth / insightCount : 0;
    }
    calculateRiskCoverage(results) {
        // Calculate based on how many techniques identified risks
        const techniquesWithRisks = results.filter(r => {
            const resultData = r.results;
            const risks = resultData?.risks;
            return risks && risks.length > 0;
        }).length;
        return results.length > 0 ? techniquesWithRisks / results.length : 0;
    }
}
//# sourceMappingURL=LLMHandoffBridge.js.map