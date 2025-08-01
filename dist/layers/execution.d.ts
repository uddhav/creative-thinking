/**
 * Execution Layer
 * Delegates to modular execution components
 */
import type { ExecuteThinkingStepInput, LateralThinkingResponse } from '../types/index.js';
import type { SessionManager } from '../core/SessionManager.js';
import type { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
import type { VisualFormatter } from '../utils/VisualFormatter.js';
import type { MetricsCollector } from '../core/MetricsCollector.js';
import type { HybridComplexityAnalyzer } from '../complexity/analyzer.js';
import type { ErgodicityManager } from '../ergodicity/index.js';
import { MemoryAnalyzer } from '../core/MemoryAnalyzer.js';
import { RealityIntegration } from '../reality/integration.js';
/**
 * Execute a thinking step using the modular execution system
 * This function now delegates to the modularized implementation
 */
export declare function executeThinkingStep(input: ExecuteThinkingStepInput, sessionManager: SessionManager, techniqueRegistry: TechniqueRegistry, visualFormatter?: VisualFormatter, metrics?: MetricsCollector, complexity?: HybridComplexityAnalyzer, ergodicityManager?: ErgodicityManager, memoryAnalyzer?: MemoryAnalyzer, realityIntegration?: RealityIntegration): Promise<LateralThinkingResponse>;
export type { ErgodicityResult, ComplexitySuggestion } from './execution/index.js';
//# sourceMappingURL=execution.d.ts.map