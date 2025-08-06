/**
 * Temporal Work technique handler
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class TemporalWorkHandler extends BaseTechniqueHandler {
    getTechniqueInfo() {
        return {
            name: 'Temporal Work Design',
            emoji: '⏰',
            totalSteps: 5,
            description: 'Design solutions considering time dynamics and flexibility',
            focus: 'Work with time as a design material',
            parallelSteps: {
                canParallelize: false,
                description: 'Temporal analysis builds progressively through time landscapes',
            },
        };
    }
    getStepInfo(step) {
        const steps = [
            {
                name: 'Map Temporal Landscape',
                focus: 'Identify time constraints and opportunities',
                emoji: '🗺️',
            },
            {
                name: 'Circadian Alignment',
                focus: 'Align with natural rhythms',
                emoji: '🌅',
            },
            {
                name: 'Pressure Transformation',
                focus: 'Convert time pressure into creative force',
                emoji: '💎',
            },
            {
                name: 'Async-Sync Balance',
                focus: 'Design information flow patterns',
                emoji: '⚖️',
            },
            {
                name: 'Temporal Escape Routes',
                focus: 'Build flexibility and recovery options',
                emoji: '🚪',
            },
        ];
        if (step < 1 || step > steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Temporal Work technique. Valid steps are 1-${steps.length}`, 'step', { providedStep: step, validRange: [1, steps.length] });
        }
        return steps[step - 1];
    }
    getStepGuidance(step, problem) {
        // Handle out of bounds gracefully
        if (step < 1 || step > 5) {
            return `Complete the Temporal Work Design process for "${problem}"`;
        }
        switch (step) {
            case 1:
                return `🗺️ Map the temporal landscape of "${problem}". What are fixed deadlines vs flexible windows?`;
            case 2:
                return `🌅 Analyze circadian rhythms and natural patterns. How can the solution align with natural rhythms? When is the best time for different activities?`;
            case 3:
                return `💎 Transform time pressure into creative force. How can constraints enhance rather than limit?`;
            case 4:
                return `⚖️ Balance async and sync work. What needs real-time coordination vs independent progress?`;
            case 5:
                return `🚪 Design temporal escape routes. How can we build in flexibility and recovery time?`;
            default:
                return `Complete the Temporal Work Design process for "${problem}"`;
        }
    }
    extractInsights(history) {
        const insights = [];
        history.forEach(entry => {
            if (entry.currentStep === 1 && entry.temporalLandscape) {
                if (entry.temporalLandscape.fixedDeadlines &&
                    entry.temporalLandscape.fixedDeadlines.length > 0) {
                    insights.push(`Fixed deadline: ${entry.temporalLandscape.fixedDeadlines[0]}`);
                }
                if (entry.temporalLandscape.kairosOpportunities &&
                    entry.temporalLandscape.kairosOpportunities.length > 0) {
                    insights.push(`Opportunity window: ${entry.temporalLandscape.kairosOpportunities[0]}`);
                }
            }
            if (entry.currentStep === 5 &&
                entry.temporalEscapeRoutes &&
                entry.temporalEscapeRoutes.length > 0) {
                insights.push(`Escape route: ${entry.temporalEscapeRoutes[0]}`);
            }
            // Add completion insight when all 5 steps are done
            if (entry.currentStep === 5 && !entry.nextStepNeeded) {
                insights.push('Temporal Work Design completed for optimized creative scheduling');
            }
        });
        return insights;
    }
}
//# sourceMappingURL=TemporalWorkHandler.js.map