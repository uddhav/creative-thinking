/**
 * Types for LLM Handoff Bridge
 * Structures parallel execution results for flexible LLM synthesis
 */
import type { LateralTechnique } from './index.js';
/**
 * Result from a single parallel technique execution
 */
export interface ParallelResult {
    planId: string;
    technique: LateralTechnique;
    results: unknown;
    insights: string[];
    metrics?: Record<string, number>;
}
export interface LLMHandoffPackage {
    handoffId: string;
    timestamp: number;
    structuredResults: StructuredResults;
    contextSummary: {
        problem: string;
        techniqueCount: number;
        executionTime: number;
        keyFindings: string[];
        majorThemes: string[];
        criticalDecisions: string[];
    };
    synthesisPrompts: SynthesisPrompt[];
    metadata: {
        parallelExecutionStats: ExecutionStats;
        techniquePerformance: TechniqueMetrics[];
        qualityIndicators: QualityMetrics;
        completeness: number;
    };
    visualizations: Visualization[];
    suggestedActions: SuggestedAction[];
    rawResults?: ParallelResult[];
}
export interface LLMHandoffOptions {
    structuredFormat?: 'hierarchical' | 'flat' | 'comparative' | 'narrative';
    promptStrategy?: 'comprehensive' | 'focused' | 'action_oriented' | 'risk_aware';
    includeRawData?: boolean;
    summaryDepth?: 'high' | 'medium' | 'low';
    visualizationLevel?: 'full' | 'summary' | 'none';
    focusAreas?: string[];
}
export type StructuredResults = HierarchicalStructure | FlatStructure | ComparativeStructure | NarrativeStructure;
export interface HierarchicalStructure {
    type: 'hierarchical';
    summary: {
        techniqueCount: number;
        totalInsights: number;
        totalIdeas: number;
        executionTime: number;
    };
    techniques: Array<{
        technique: string;
        summary: string;
        keyInsights: string[];
        ideas: Array<{
            id: string;
            content: string;
            category?: string;
            confidence?: number;
        }>;
        risks: Array<{
            description: string;
            severity: 'low' | 'medium' | 'high';
            mitigation?: string;
        }>;
        metrics?: Record<string, unknown>;
        subSections?: Array<{
            title: string;
            content: string;
        }>;
    }>;
    crossTechniqueAnalysis: {
        commonThemes: Array<{
            theme: string;
            techniques: string[];
            evidence: string[];
        }>;
        divergentPerspectives: Array<{
            topic: string;
            perspectives: Array<{
                technique: string;
                view: string;
            }>;
        }>;
        complementaryInsights: Array<{
            insight: string;
            techniques: string[];
            synergy: string;
        }>;
    };
}
export interface FlatStructure {
    type: 'flat';
    allIdeas: Array<{
        id: string;
        content: string;
        technique: string;
        category?: string;
        tags?: string[];
        confidence?: number;
    }>;
    allInsights: Array<{
        insight: string;
        technique: string;
        importance: 'low' | 'medium' | 'high';
    }>;
    allRisks: Array<{
        risk: string;
        technique: string;
        severity: 'low' | 'medium' | 'high';
        mitigation?: string;
    }>;
}
export interface ComparativeStructure {
    type: 'comparative';
    dimensions: Array<{
        name: string;
        description: string;
        techniqueComparisons: Array<{
            technique: string;
            value: string | number;
            evidence: string[];
        }>;
    }>;
    comparisonMatrix: Record<string, Record<string, unknown>>;
    recommendations: string[];
}
export interface NarrativeStructure {
    type: 'narrative';
    story: string;
    chapters: Array<{
        title: string;
        content: string;
    }>;
    callToAction: string;
}
export interface SynthesisPrompt {
    id: string;
    priority: 'high' | 'medium' | 'low';
    prompt: string;
    context?: Record<string, unknown>;
    focusAreas?: string[];
    suggestedApproach?: string;
}
export interface ExecutionStats {
    totalExecutionTime: number;
    parallelismEfficiency: number;
    techniqueCompletionRates: Record<string, number>;
    stepCounts: Record<string, number>;
}
export interface TechniqueMetrics {
    technique: string;
    ideaCount: number;
    insightCount: number;
    riskCount: number;
    completeness: number;
    confidence: number;
    executionTime: number;
}
export interface QualityMetrics {
    ideaDiversity: number;
    insightDepth: number;
    riskCoverage: number;
    overall: number;
}
export interface Visualization {
    type: 'comparison_chart' | 'network_diagram' | 'timeline' | 'matrix' | 'custom';
    title: string;
    description: string;
    data: unknown;
    format: 'markdown_table' | 'mermaid' | 'ascii_art' | 'json';
    content: string;
}
export interface SuggestedAction {
    tool: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    suggestedPrompt?: string;
    suggestedActions?: string[];
    suggestedQueries?: string[];
    expectedBenefit?: string;
    approach?: string;
}
export interface ResultCharacteristics {
    highComplexity: boolean;
    needsDeepAnalysis: boolean;
    manyInsights: boolean;
    reusablePatterns: boolean;
    knowledgeGaps: boolean;
    externalValidationNeeded: boolean;
    clearPatterns: boolean;
    conflicts: boolean;
}
export type PromptStrategy = 'comprehensive' | 'focused' | 'action_oriented' | 'risk_aware';
//# sourceMappingURL=handoff.d.ts.map