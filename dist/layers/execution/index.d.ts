/**
 * Main execution layer module
 * Orchestrates the execution of thinking steps
 */
import type { ExecuteThinkingStepInput } from '../../types/index.js';
import type { LateralThinkingResponse } from '../../types/index.js';
import type { SessionManager } from '../../core/SessionManager.js';
import type { ResponseBuilder } from '../../core/ResponseBuilder.js';
import type { ErgodicityManager } from '../../ergodicity/index.js';
export * from './types.js';
/**
 * Main execution function
 */
export declare function executeThinkingStep(input: ExecuteThinkingStepInput, sessionManager: SessionManager, responseBuilder: ResponseBuilder, techniqueHandlers: Map<string, any>, ergodicityManager?: ErgodicityManager, memoryAnalyzer?: any, realityIntegration?: any): Promise<LateralThinkingResponse>;
//# sourceMappingURL=index.d.ts.map