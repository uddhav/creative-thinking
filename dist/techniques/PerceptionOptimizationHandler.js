/**
 * Perception Optimization technique handler
 *
 * A 5-step technique inspired by Rory Sutherland's principle
 * "optimize for perception, not reality" - recognizing that human
 * experience is fundamentally subjective
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class PerceptionOptimizationHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Perception Mapping',
            focus: 'Map gaps between objective reality and subjective experience',
            emoji: '🗺️',
            type: 'thinking',
            elements: [
                'Objective performance metrics',
                'Subjective experience assessment',
                'Perception-reality gaps',
                'Experience pain points',
                'Delight opportunities',
            ],
            optimizationType: 'gap_analysis',
        },
        {
            name: 'Value Amplification',
            focus: 'Identify ways to enhance perceived value',
            emoji: '💎',
            type: 'thinking',
            elements: [
                'Attention direction strategies',
                'Comparison management',
                'Experience choreography',
                'Expectation calibration',
                'Sensory optimization',
            ],
            optimizationType: 'value_enhancement',
            reflexiveEffects: {
                triggers: ['Value perception analysis', 'Subjective enhancement planning'],
                realityChanges: ['Understanding of value drivers shifts'],
                futureConstraints: ['Must maintain perception consistency'],
                reversibility: 'medium',
            },
        },
        {
            name: 'Experience Design',
            focus: 'Design interventions that optimize subjective experience',
            emoji: '✨',
            type: 'action',
            elements: [
                'Peak-end rule application',
                'Duration neglect exploitation',
                'Contrast effect design',
                'Narrative integration',
                'Ritual creation',
            ],
            optimizationType: 'experience_architecture',
            reflexiveEffects: {
                triggers: ['Experience design choices', 'Perception anchor setting'],
                realityChanges: ['Customer experience transformed', 'Value perception altered'],
                futureConstraints: ['Experience expectations raised', 'Cannot reduce quality'],
                reversibility: 'low',
            },
        },
        {
            name: 'Psychological Value Creation',
            focus: 'Build psychological value beyond functional benefits',
            emoji: '🧠',
            type: 'action',
            elements: [
                'Status signaling design',
                'Identity reinforcement',
                'Emotional resonance',
                'Social proof integration',
                'Meaning layer addition',
            ],
            optimizationType: 'psychological_enhancement',
            reflexiveEffects: {
                triggers: ['Psychological value embedding', 'Meaning creation'],
                realityChanges: ['Product/service meaning transformed', 'Emotional connections formed'],
                futureConstraints: ['Psychological expectations established', 'Brand promise locked in'],
                reversibility: 'low',
            },
        },
        {
            name: 'Perception Activation',
            focus: 'Deploy perception optimizations and measure impact',
            emoji: '🚀',
            type: 'action',
            elements: [
                'Implementation sequencing',
                'Perception measurement',
                'ROI calculation',
                'Iteration protocols',
                'Scaling strategies',
            ],
            optimizationType: 'activation',
            reflexiveEffects: {
                triggers: ['Market deployment', 'Perception shift initiation'],
                realityChanges: ['Market perception permanently altered', 'Competitive dynamics changed'],
                futureConstraints: ['Must maintain elevated perception', 'Competitors may copy approach'],
                reversibility: 'very_low',
            },
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Perception Optimization',
            emoji: '👁️',
            totalSteps: 5,
            description: 'Enhance subjective experience and perceived value over objective metrics',
            focus: 'Creating disproportionate value through perception management',
            enhancedFocus: 'Systematically optimizing subjective experience to create outsized perceived value',
            parallelSteps: {
                canParallelize: false,
                description: 'Sequential flow required to build from analysis to implementation',
            },
            reflexivityProfile: {
                primaryCommitmentType: 'perceptual',
                overallReversibility: 'low',
                riskLevel: 'medium',
            },
        };
    }
    getStepInfo(step) {
        if (step < 1 || step > this.steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Perception Optimization. Valid steps are 1-${this.steps.length}`, 'step', { received: step, expected: `1-${this.steps.length}` });
        }
        return this.steps[step - 1];
    }
    getStepGuidance(step, problem) {
        const stepInfo = this.getStepInfo(step);
        const elements = stepInfo.elements || [];
        const guidanceTemplates = {
            1: `🗺️ **Step 1: Perception Mapping**

Analyzing perception gaps for: "${problem}"

Map the difference between what IS and what is PERCEIVED.

Examine these perception dimensions:
${elements.map(e => `• ${e}`).join('\n')}

Perception vs Reality Framework:
| Aspect | Objective Reality | Perceived Experience | Gap | Opportunity |
|--------|------------------|---------------------|-----|-------------|
| Speed | 10% faster | Not noticed | Large | Reframe metric |
| Quality | 95% reliability | Feels unreliable | Medium | Highlight success |
| Value | $X savings | Feels expensive | Large | Context change |
| Effort | 5 steps | Feels complex | Medium | Simplify perception |

Key Questions:
- What do customers THINK they experience?
- How does this differ from objective measures?
- Which gaps cause the most dissatisfaction?
- Where could perception exceed reality cheaply?

Beyond Rationality (Rule 9):
"Solving problems with only rationality is like playing golf with one club."
Don't just map functional gaps — map emotional, social, and identity gaps too.
What would a poet notice that an engineer wouldn't? What dimensions of experience
are invisible to spreadsheets but obvious to humans?

Sutherland's Examples:
- Uber: Didn't make taxis faster, made waiting feel better
- Nespresso: Made instant coffee feel premium
- Red Bull: Tiny can made it feel potent
- Dyson: Made vacuum cleaning visible and satisfying

Output: Complete perception map with gaps and opportunities identified`,
            2: `💎 **Step 2: Value Amplification**

Identifying perception leverage points for: "${problem}"

Find ways to dramatically enhance perceived value without changing core offering.

Amplify value through:
${elements.map(e => `• ${e}`).join('\n')}

Perception Amplification Strategies:
1. **Attention Direction**: Focus on strengths, distract from weaknesses
2. **Comparison Management**: Control what you're compared against
3. **Experience Choreography**: Design the journey for maximum impact
4. **Expectation Calibration**: Under-promise, over-deliver strategically
5. **Sensory Optimization**: Enhance what's felt, not just what's delivered

Non-Linear Perception Effects:
| Objective Change | Perceived Impact | Example |
|-----------------|------------------|---------|
| 1% improvement | 0% noticed | Speed: 60→61 mph |
| 10% improvement | 5% noticed | Loading: 3→2.7 sec |
| 50% improvement | 200% noticed | Wait: 10→5 min |
| Reframing only | 500% noticed | Progress bar added |

Value Amplification Techniques:
- Add ceremony and ritual
- Create scarcity and exclusivity
- Provide unexpected delights
- Show the work being done
- Add meaningful friction

⚠️ Medium Reflexivity: Value perception strategies shape future expectations.

Output: Value amplification strategy with specific interventions`,
            3: `✨ **Step 3: Experience Design**

Crafting peak experiences for: "${problem}"

Design subjective experiences that create disproportionate satisfaction.

Design experience elements:
${elements.map(e => `• ${e}`).join('\n')}

Behavioral Economics Principles:
1. **Peak-End Rule**: People judge experiences by peak moment + ending
2. **Duration Neglect**: Length matters less than intensity
3. **Contrast Effects**: Relative changes matter more than absolutes
4. **Loss Aversion**: Frame as avoiding loss vs gaining benefit
5. **Anchoring**: First impression sets all expectations

Experience Design Tactics:
- Create memorable peak moments
- Ensure positive endings
- Add surprise and delight
- Build anticipation
- Provide closure and completion

Real-World Applications:
- Hotels: Amazing check-in, chocolate on pillow (peak + end)
- Restaurants: Amuse-bouche, free dessert (unexpected delight)
- Software: Delightful animations, celebration moments
- Services: Follow-up thank you, unexpected upgrade

The Perception Equation:
Perceived Value = (Peak Experience + End Experience) / 2
NOT: Perceived Value = Average of All Moments

⚠️ High Reflexivity: Experience design creates lasting emotional imprints.

Output: Experience design blueprint with peak moments identified`,
            4: `🧠 **Step 4: Psychological Value Creation**

Building meaning layers for: "${problem}"

Create psychological and social value beyond functional benefits.

Develop psychological value through:
${elements.map(e => `• ${e}`).join('\n')}

Psychological Value Dimensions:
1. **Status Enhancement**: Make users feel elevated
2. **Identity Reinforcement**: Align with self-concept
3. **Emotional Resonance**: Create feeling, not just function
4. **Social Signaling**: Enable expression to others
5. **Meaning Creation**: Add purpose and significance

Value Creation Examples:
| Product | Functional Value | Psychological Value | Premium |
|---------|-----------------|-------------------|---------|
| Water | Hydration | Purity, health, status | 1000x |
| Coffee | Caffeine | Ritual, identity, social | 20x |
| Shoes | Foot protection | Self-expression, tribe | 50x |
| Car | Transportation | Freedom, success, identity | 10x |

Meaning Layer Strategies:
- Connect to higher purpose
- Create origin stories
- Build community and belonging
- Enable self-expression
- Provide transformation narrative

Costly Signaling Principle (Rule 5):
"A flower is a weed with an advertising budget."
Visible investment signals trustworthiness. Spending lavishly on packaging,
customer service, or seemingly "wasteful" gestures builds trust precisely
because it's costly. The inefficiency IS the message — it proves commitment.
Ask: Where could deliberate visible expense build disproportionate trust?

Sutherland's Insight:
"The functional attributes of a product are often less important than what it means"

Remember: Humans don't buy products, they buy meanings

⚠️ High Reflexivity: Psychological value becomes core to identity.

Output: Psychological value architecture with meaning layers defined`,
            5: `🚀 **Step 5: Perception Activation**

Launching perception optimizations for: "${problem}"

Deploy your perception strategy and measure subjective impact.

Activate across these dimensions:
${elements.map(e => `• ${e}`).join('\n')}

Deployment Strategy:
1. **Soft Launch**: Test with friendly audience
2. **Story Creation**: Build narrative around changes
3. **Influence Seeding**: Start with opinion leaders
4. **Experience Orchestration**: Control first impressions
5. **Measurement Systems**: Track perception, not just performance

Perception ROI Calculation:
- Traditional ROI = Objective Improvement / Cost
- Perception ROI = Perceived Improvement / Cost
- Often 10-100x higher than traditional ROI

Key Metrics:
- Net Promoter Score (recommendation)
- Customer Satisfaction Score
- Perceived Value Rating
- Emotional Connection Index
- Social Sharing Rate

Success Indicators:
- Customers explain value better than you do
- Price becomes less important in decisions
- Emotional language in reviews
- Voluntary brand advocacy
- Competitive immunity

Real-World Results:
- Apple: $0.50 packaging creates $100 perceived value
- Starbucks: $0.30 coffee sells for $5 through experience
- Tesla: Software updates make same car feel new
- Vitamins: Placebo effect provides real health benefits

⚠️ Very High Reflexivity: Market perception becomes market reality.

Output: Complete activation plan with perception metrics and success criteria`,
        };
        return guidanceTemplates[step] || `Step ${step}: ${stepInfo.name}\n\nFocus: ${stepInfo.focus}`;
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Step 1: Validate perception gaps
        if (step === 1 && data && typeof data === 'object' && 'perceptionGaps' in data) {
            const gaps = data.perceptionGaps;
            if (!Array.isArray(gaps)) {
                return false;
            }
            return gaps.every((gap) => {
                if (typeof gap !== 'object' || !gap)
                    return false;
                const gapObj = gap;
                const validSize = ['small', 'medium', 'large', 'massive'].includes(gapObj.gapSize);
                const validLeverage = ['low', 'medium', 'high', 'very_high'].includes(gapObj.leverageOpportunity);
                return (typeof gapObj.objective === 'string' &&
                    typeof gapObj.perceived === 'string' &&
                    validSize &&
                    validLeverage);
            });
        }
        // Step 5: Validate perception metrics
        if (step === 5 && data && typeof data === 'object' && 'perceptionROI' in data) {
            const dataObj = data;
            const roi = dataObj.perceptionROI;
            return typeof roi === 'number' && roi > 0;
        }
        return true;
    }
    extractInsights(history) {
        const insights = [];
        history.forEach((entry, index) => {
            if (typeof entry === 'object' && entry !== null) {
                const entryObj = entry;
                if (entryObj.output) {
                    const stepNumber = index + 1;
                    const stepName = this.steps[index]?.name || `Step ${stepNumber}`;
                    // Extract perception gap insights
                    if (entryObj.perceptionGaps && Array.isArray(entryObj.perceptionGaps)) {
                        const largeGaps = entryObj.perceptionGaps.filter((g) => {
                            if (typeof g === 'object' && g !== null) {
                                const gapObj = g;
                                return gapObj.gapSize === 'large' || gapObj.gapSize === 'massive';
                            }
                            return false;
                        });
                        if (largeGaps.length > 0) {
                            insights.push(`${stepName}: Found ${largeGaps.length} major perception gaps to exploit`);
                        }
                    }
                    // Extract value amplification insights
                    if (entryObj.valueAmplification) {
                        insights.push('Value amplification strategy designed for maximum leverage');
                    }
                    // Extract experience design insights
                    if (entryObj.experienceDesign) {
                        insights.push('Peak experiences designed using behavioral economics principles');
                    }
                    // Extract psychological value insights
                    if (entryObj.psychologicalValue) {
                        insights.push('Psychological value layers added beyond functional benefits');
                    }
                    // Extract ROI insights
                    if (entryObj.perceptionROI && typeof entryObj.perceptionROI === 'number') {
                        if (entryObj.perceptionROI > 10) {
                            insights.push(`Exceptional perception ROI: ${entryObj.perceptionROI}x traditional ROI`);
                        }
                    }
                }
            }
        });
        // Add summary insight if complete
        if (history.length >= this.steps.length) {
            insights.push('Perception optimization complete - subjective value dramatically enhanced');
        }
        return insights;
    }
}
//# sourceMappingURL=PerceptionOptimizationHandler.js.map