/**
 * Execution Layer
 * Delegates to modular execution components
 */
import { ResponseBuilder } from '../core/ResponseBuilder.js';
// Import the modularized execution function
import { executeThinkingStep as executeStep } from './execution/index.js';
/**
 * Execute a thinking step using the modular execution system
 * This function now delegates to the modularized implementation
 */
export async function executeThinkingStep(input, sessionManager, techniqueRegistry, visualFormatter, metrics, complexity, ergodicityManager, memoryAnalyzer, realityIntegration) {
    // Create response builder
    const responseBuilder = new ResponseBuilder();
    // Get technique handlers map
    const techniqueHandlers = new Map();
    const allTechniques = techniqueRegistry.getAllTechniques();
    for (const technique of allTechniques) {
        techniqueHandlers.set(technique, techniqueRegistry.getHandler(technique));
    }
    // Delegate to modular execution
    return executeStep(input, sessionManager, responseBuilder, techniqueHandlers, ergodicityManager, memoryAnalyzer, realityIntegration);
}
//# sourceMappingURL=execution.js.map