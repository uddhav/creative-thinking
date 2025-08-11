/**
 * Cultural Creativity Orchestration Framework technique handler
 *
 * Enables multi-cultural synthesis without appropriation through respectful integration protocols.
 * Creates new combinations that honor source cultures while generating novel solutions.
 *
 * Different from existing techniques:
 * - cross_cultural: Integrates diverse cultural perspectives respectfully into solutions
 * - cultural_path: Navigates through cultural contexts to find viable solution pathways
 * - cultural_creativity: Orchestrates multi-cultural synthesis without appropriation
 *
 * This technique implements a 4-step respectful integration protocol that ensures
 * authentic collaboration and proper attribution while creating innovative combinations.
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class CulturalCreativityHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Cultural Mapping',
            focus: 'Map cultural contexts and frameworks',
            emoji: '🗺️',
            description: 'Understand historical contexts, recognize power dynamics, map cognitive frameworks, and document cultural constraints or taboos',
        },
        {
            name: 'Touchpoint Identification',
            focus: 'Find respectful connection points',
            emoji: '🤝',
            description: 'Discover natural connections, shared experiences, complementary strengths, and potential friction zones between cultures',
        },
        {
            name: 'Bridge Building',
            focus: 'Create respectful connections',
            emoji: '🌉',
            description: 'Develop translation protocols, design bidirectional exchange mechanisms, and build trust through authentic engagement',
        },
        {
            name: 'Authentic Synthesis',
            focus: 'Create new combinations with attribution',
            emoji: '🎨',
            description: 'Synthesize innovations that acknowledge all sources, avoid superficial adoption, and maintain cultural authenticity',
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Cultural Creativity Orchestration',
            emoji: '🌐',
            totalSteps: 4,
            description: 'Orchestrate multi-cultural creative synthesis without appropriation through respectful integration and proper attribution',
            focus: 'Respectful multi-cultural innovation synthesis',
            enhancedFocus: 'Creates culturally-aware innovations through mapping, touchpoint identification, bridge building, and authentic synthesis with full attribution',
            parallelSteps: {
                canParallelize: false,
                description: 'Steps build sequentially to ensure respectful integration',
            },
        };
    }
    getStepInfo(step) {
        const stepInfo = this.steps[step - 1];
        if (!stepInfo) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Cultural Creativity Orchestration. Valid steps are 1-${this.steps.length}`, 'step', { providedStep: step, validRange: `1-${this.steps.length}` });
        }
        return stepInfo;
    }
    getStepGuidance(step, problem) {
        const guidanceMap = {
            1: `Map cultural contexts for: "${problem}". Identify relevant cultural frameworks, historical contexts, and power dynamics. Document cognitive patterns from different cultures. Note any constraints, taboos, or sensitivities. Which cultural perspectives offer unique insights? What historical contexts must be considered? How do power dynamics affect this problem space?`,
            2: `Identify touchpoints for: "${problem}". Find natural connections between cultural approaches. Discover shared human experiences across cultures. Map complementary strengths from different traditions. Identify potential friction zones. Where do cultures naturally connect on this issue? What universal experiences unite different perspectives? Which strengths complement each other?`,
            3: `Build respectful bridges for: "${problem}". Create translation protocols between cultural concepts. Design bidirectional exchange mechanisms. Build trust through authentic engagement. Develop inclusive communication patterns. How can different cultural concepts be translated respectfully? What exchange mechanisms honor all participants? How do we ensure authentic rather than extractive engagement?`,
            4: `Synthesize with attribution for: "${problem}". Create new combinations that acknowledge all sources. Avoid superficial adoption of cultural elements. Maintain authenticity while innovating. Document cultural contributions clearly. Generate solutions that represent true collaboration. How do we properly attribute all cultural contributions? What new synthesis honors all sources while creating innovation?`,
        };
        return guidanceMap[step] || `Continue cultural creativity orchestration for: "${problem}"`;
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Add specific validation for cultural creativity fields
        if (typeof data === 'object' && data !== null) {
            const stepData = data;
            switch (step) {
                case 1:
                    // Validate cultural mapping - require both contexts and dynamics
                    if (!stepData.culturalContexts || !stepData.powerDynamics) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 1 requires both cultural contexts AND power dynamics analysis', 'culturalMapping', { step, technique: 'cultural_creativity' });
                    }
                    break;
                case 2:
                    // Validate touchpoint identification - require connections and friction zones
                    if (!stepData.naturalConnections || !stepData.frictionZones) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 2 requires both natural connections AND friction zones identification', 'touchpointIdentification', { step, technique: 'cultural_creativity' });
                    }
                    break;
                case 3:
                    // Validate bridge building - require protocols and trust mechanisms
                    if (!stepData.translationProtocols || !stepData.trustMechanisms) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 3 requires both translation protocols AND trust mechanisms', 'bridgeBuilding', { step, technique: 'cultural_creativity' });
                    }
                    break;
                case 4:
                    // Validate synthesis - require attribution and authenticity measures
                    if (!stepData.attributionMap || !stepData.authenticityMeasures) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 4 requires both attribution map AND authenticity measures', 'synthesis', { step, technique: 'cultural_creativity' });
                    }
                    break;
            }
        }
        return true;
    }
    getPromptContext(step) {
        const stepInfo = this.getStepInfo(step);
        return {
            technique: 'cultural_creativity',
            step,
            stepName: stepInfo.name,
            focus: stepInfo.focus,
            emoji: stepInfo.emoji,
            principles: {
                attribution: 'Attribution over appropriation',
                depth: 'Depth over surface features',
                collaboration: 'Collaboration over extraction',
                evolution: 'Evolution over preservation',
                inclusion: 'Inclusion over universalization',
            },
            capabilities: {
                culturalMapping: 'Map contexts, power dynamics, and frameworks',
                touchpointIdentification: 'Find connections and complementary strengths',
                bridgeBuilding: 'Create respectful translation and exchange',
                synthesis: 'Generate attributed innovations with authenticity',
            },
        };
    }
}
//# sourceMappingURL=CulturalCreativityHandler.js.map