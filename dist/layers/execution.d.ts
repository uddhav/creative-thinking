/**
 * Execution Layer
 * Handles the execution of thinking steps
 */
import type { ExecuteThinkingStepInput, LateralThinkingResponse } from '../types/index.js';
import type { SessionManager } from '../core/SessionManager.js';
import type { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
import type { VisualFormatter } from '../utils/VisualFormatter.js';
import type { MetricsCollector } from '../core/MetricsCollector.js';
import type { HybridComplexityAnalyzer } from '../complexity/analyzer.js';
import type { ErgodicityManager } from '../ergodicity/index.js';
export declare function executeThinkingStep(input: ExecuteThinkingStepInput, sessionManager: SessionManager, techniqueRegistry: TechniqueRegistry, visualFormatter: VisualFormatter, metricsCollector: MetricsCollector, complexityAnalyzer: HybridComplexityAnalyzer, ergodicityManager: ErgodicityManager): Promise<LateralThinkingResponse>;
//# sourceMappingURL=execution.d.ts.map