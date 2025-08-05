/**
 * LLM Handoff Bridge
 * Formats parallel creative thinking results for flexible LLM synthesis
 */

import { randomUUID } from 'crypto';
import type { SessionManager } from '../../core/SessionManager.js';
import type { MetricsCollector } from '../../core/MetricsCollector.js';
import type { ParallelResult } from '../../types/handoff.js';
import type {
  LLMHandoffPackage,
  LLMHandoffOptions,
  StructuredResults,
  ExecutionStats,
  TechniqueMetrics,
  QualityMetrics,
} from '../../types/handoff.js';
import { ResultStructures } from './handoff/ResultStructures.js';
import { SynthesisPromptGenerator } from './handoff/SynthesisPromptGenerator.js';
import { VisualizationGenerator } from './handoff/VisualizationGenerator.js';
import { NextActionSuggester } from './handoff/NextActionSuggester.js';

export class LLMHandoffBridge {
  private resultStructures: ResultStructures;
  private promptGenerator: SynthesisPromptGenerator;
  private visualizationGenerator: VisualizationGenerator;
  private actionSuggester: NextActionSuggester;

  constructor(
    private sessionManager: SessionManager,
    private metricsCollector: MetricsCollector
  ) {
    this.resultStructures = new ResultStructures();
    this.promptGenerator = new SynthesisPromptGenerator();
    this.visualizationGenerator = new VisualizationGenerator();
    this.actionSuggester = new NextActionSuggester();
  }

  prepareHandoff(
    parallelResults: ParallelResult[],
    problem: string,
    options: LLMHandoffOptions = {}
  ): LLMHandoffPackage {
    // 1. Gather and structure results
    const structuredResults = this.structureResults(parallelResults, problem, options);

    // 2. Generate context summary
    const contextSummary = this.generateContextSummary(parallelResults, problem);

    // 3. Create synthesis prompts
    const synthesisPrompts = this.promptGenerator.generateSynthesisPrompts(
      structuredResults,
      problem,
      options.promptStrategy || 'comprehensive'
    );

    // 4. Prepare metadata
    const metadata = this.prepareMetadata(parallelResults);

    // 5. Generate visualization data
    const visualizations =
      options.visualizationLevel !== 'none'
        ? this.visualizationGenerator.generateVisualizations(parallelResults)
        : [];

    // 6. Create action recommendations
    const suggestedActions = this.actionSuggester.suggestNextActions(parallelResults, options);

    // 7. Create the handoff package
    const handoffPackage: LLMHandoffPackage = {
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

  private structureResults(
    parallelResults: ParallelResult[],
    problem: string,
    options: LLMHandoffOptions
  ): StructuredResults {
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

  private generateContextSummary(
    parallelResults: ParallelResult[],
    problem: string
  ): LLMHandoffPackage['contextSummary'] {
    const keyFindings: string[] = [];
    const majorThemes: string[] = [];
    const criticalDecisions: string[] = [];

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

  private prepareMetadata(parallelResults: ParallelResult[]): LLMHandoffPackage['metadata'] {
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

  private calculateExecutionStats(results: ParallelResult[]): ExecutionStats {
    const totalExecutionTime = this.calculateTotalExecutionTime(results);
    const techniqueCompletionRates: Record<string, number> = {};
    const stepCounts: Record<string, number> = {};

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

  private calculateTechniqueMetrics(results: ParallelResult[]): TechniqueMetrics[] {
    return results.map(result => ({
      technique: result.technique,
      ideaCount: this.countIdeas(result),
      insightCount: result.insights?.length || 0,
      riskCount: ((result.results as Record<string, unknown>)?.risks as unknown[])?.length || 0,
      completeness: this.calculateTechniqueCompleteness(result),
      confidence: result.metrics?.confidence || 0.5,
      executionTime: result.metrics?.executionTime || 0,
    }));
  }

  private assessQuality(results: ParallelResult[]): QualityMetrics {
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
  private extractThemes(result: ParallelResult): string[] {
    const themes: string[] = [];
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

  private calculateTotalExecutionTime(results: ParallelResult[]): number {
    // In parallel execution, total time is the max of individual times
    return Math.max(...results.map(r => r.metrics?.executionTime || 0));
  }

  private countIdeas(result: ParallelResult): number {
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

  private calculateTechniqueCompleteness(result: ParallelResult): number {
    const completedSteps = result.metrics?.completedSteps || 0;
    const totalSteps = result.metrics?.totalSteps || 1;
    return completedSteps / totalSteps;
  }

  private calculateCompleteness(results: ParallelResult[]): number {
    if (results.length === 0) return 0;

    const totalCompleteness = results.reduce(
      (sum, result) => sum + this.calculateTechniqueCompleteness(result),
      0
    );

    return totalCompleteness / results.length;
  }

  private calculateIdeaDiversity(results: ParallelResult[]): number {
    // Simple diversity calculation based on unique categories/themes
    const uniqueCategories = new Set<string>();

    results.forEach(result => {
      const themes = this.extractThemes(result);
      themes.forEach(theme => uniqueCategories.add(theme));
    });

    // Normalize to 0-1 scale (assuming 10 categories is maximum diversity)
    return Math.min(uniqueCategories.size / 10, 1);
  }

  private calculateInsightDepth(results: ParallelResult[]): number {
    // Calculate based on average insight length and complexity
    let totalDepth = 0;
    let insightCount = 0;

    results.forEach(result => {
      if (result.insights) {
        result.insights.forEach((insight: string) => {
          // Simple depth metric based on length
          const depth = Math.min(insight.length / 200, 1); // 200 chars = max depth
          totalDepth += depth;
          insightCount++;
        });
      }
    });

    return insightCount > 0 ? totalDepth / insightCount : 0;
  }

  private calculateRiskCoverage(results: ParallelResult[]): number {
    // Calculate based on how many techniques identified risks
    const techniquesWithRisks = results.filter(r => {
      const resultData = r.results as Record<string, unknown>;
      const risks = resultData?.risks as unknown[];
      return risks && risks.length > 0;
    }).length;

    return results.length > 0 ? techniquesWithRisks / results.length : 0;
  }
}
