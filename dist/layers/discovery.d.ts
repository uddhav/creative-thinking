/**
 * Discovery Layer
 * Analyzes problems and recommends appropriate techniques
 */
import type { DiscoverTechniquesInput, DiscoverTechniquesOutput } from '../types/planning.js';
import type { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
import type { HybridComplexityAnalyzer } from '../complexity/analyzer.js';
export declare function discoverTechniques(input: DiscoverTechniquesInput, techniqueRegistry: TechniqueRegistry, complexityAnalyzer: HybridComplexityAnalyzer): DiscoverTechniquesOutput;
//# sourceMappingURL=discovery.d.ts.map