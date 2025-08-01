/**
 * Cross-Cultural Integration technique handler
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class CrossCulturalHandler extends BaseTechniqueHandler {
    getTechniqueInfo() {
        return {
            name: 'Cross-Cultural Integration',
            emoji: '🌍',
            totalSteps: 5,
            description: 'Integrate diverse cultural perspectives respectfully',
            focus: 'Bridge cultural approaches without appropriation',
        };
    }
    getStepInfo(step) {
        const steps = [
            {
                name: 'Map Cultural Landscape',
                focus: 'Identify relevant cultural frameworks',
                emoji: '🗺️',
            },
            {
                name: 'Identify Touchpoints',
                focus: 'Find connection opportunities',
                emoji: '🔍',
            },
            {
                name: 'Build Bridges',
                focus: 'Create respectful connections',
                emoji: '🌉',
            },
            {
                name: 'Synthesize Respectfully',
                focus: 'Combine without appropriating',
                emoji: '🤝',
            },
            {
                name: 'Implement Adaptively',
                focus: 'Create culturally adaptive solutions',
                emoji: '🛤️',
            },
        ];
        if (step < 1 || step > steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Cross-Cultural technique. Valid steps are 1-${steps.length}`, 'step', { providedStep: step, validRange: [1, steps.length] });
        }
        return steps[step - 1];
    }
    getStepGuidance(step, problem) {
        // Handle out of bounds gracefully
        if (step < 1 || step > 5) {
            return `Complete the Cross Cultural Integration process for "${problem}"`;
        }
        switch (step) {
            case 1:
                return `🗺️ Map the cultural landscape of "${problem}". What cultural perspectives and worldviews are relevant?`;
            case 2:
                return `🔍 Identify touchpoints between cultures. Where do different approaches intersect or complement each other?`;
            case 3:
                return `🌉 Build bridges between perspectives. What universal human values connect different approaches?`;
            case 4:
                return `🤝 Synthesize insights respectfully. Acknowledge sources and avoid superficial adoption`;
            case 5:
                return `🛤️ Implement adaptively - design parallel paths that work in different cultural contexts for "${problem}"`;
            default:
                return `Apply Cross-Cultural step ${step} to "${problem}"`;
        }
    }
    extractInsights(history) {
        const insights = [];
        history.forEach(entry => {
            if (entry.currentStep === 1 &&
                entry.culturalFrameworks &&
                entry.culturalFrameworks.length > 0) {
                insights.push(`Cultural lens: ${entry.culturalFrameworks[0]}`);
            }
            if (entry.currentStep === 2 && entry.bridgeBuilding && entry.bridgeBuilding.length > 0) {
                insights.push(`Bridge concept: ${entry.bridgeBuilding[0]}`);
            }
            if (entry.currentStep === 3 &&
                entry.respectfulSynthesis &&
                entry.respectfulSynthesis.length > 0) {
                insights.push(`Synthesis approach: ${entry.respectfulSynthesis[0]}`);
            }
            if (entry.currentStep === 4 && entry.parallelPaths && entry.parallelPaths.length > 0) {
                insights.push(`Adaptive path: ${entry.parallelPaths[0]}`);
            }
        });
        // Check if cross-cultural integration is complete
        const hasCompleteSession = history.some(entry => entry.currentStep === 5 && 'nextStepNeeded' in entry && !entry.nextStepNeeded);
        if (hasCompleteSession) {
            insights.push('Cross-Cultural Integration completed - inclusive innovation achieved');
        }
        return insights;
    }
}
//# sourceMappingURL=CrossCulturalHandler.js.map