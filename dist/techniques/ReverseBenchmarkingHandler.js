/**
 * Reverse Benchmarking technique handler
 *
 * A 5-step technique inspired by Rory Sutherland's approach to finding
 * competitive advantage by excelling where all competitors fail
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class ReverseBenchmarkingHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Weakness Mapping',
            focus: 'Identify what top competitors all do poorly',
            emoji: '🗺️',
            type: 'thinking',
            markers: [
                'Industry-wide blind spots',
                'Universal weaknesses',
                'Neglected customer segments',
                'Good enough areas',
                'Assumed impossibilities',
            ],
            analysisType: 'weakness_discovery',
        },
        {
            name: 'Vacant Space Analysis',
            focus: 'Evaluate opportunities in competitive blind spots',
            emoji: '🔍',
            type: 'thinking',
            markers: [
                'Opportunity value assessment',
                'Implementation difficulty',
                'Why competitors ignore this',
                'Customer tolerance levels',
                'Differentiation potential',
            ],
            analysisType: 'opportunity_assessment',
            reflexiveEffects: {
                triggers: ['Identifying uncontested spaces', 'Competitive differentiation analysis'],
                realityChanges: ['Market positioning perspective shifts'],
                futureConstraints: ['Must avoid competitive convergence'],
                reversibility: 'medium',
            },
        },
        {
            name: 'Anti-Mimetic Strategy',
            focus: 'Design strategies that avoid copying competitors',
            emoji: '🎯',
            type: 'action',
            markers: [
                'Differentiation vectors',
                'Resource allocation to ignored areas',
                'Communication strategy',
                'Path independence preservation',
                'Competitive moat building',
            ],
            analysisType: 'strategy_design',
            reflexiveEffects: {
                triggers: ['Committing to anti-mimetic approach', 'Resource allocation decisions'],
                realityChanges: ['Strategic positioning locked in', 'Organizational identity shifts'],
                futureConstraints: ['Must maintain discipline against mimetic pressure'],
                reversibility: 'medium',
            },
        },
        {
            name: 'Excellence Design',
            focus: 'Create excellence in mundane, overlooked areas',
            emoji: '⭐',
            type: 'action',
            markers: [
                'Current standard assessment',
                'Excellence vision',
                'Customer impact projection',
                'Implementation roadmap',
                'Success metrics definition',
            ],
            analysisType: 'excellence_planning',
            reflexiveEffects: {
                triggers: ['Excellence standard setting', 'Quality commitment'],
                realityChanges: ['Customer expectations altered', 'Brand perception shifts'],
                futureConstraints: ['Must maintain excellence standards', 'Cannot retreat to mediocrity'],
                reversibility: 'low',
            },
        },
        {
            name: 'Implementation Path',
            focus: 'Execute strategy while maintaining competitive advantage',
            emoji: '🚀',
            type: 'action',
            markers: [
                'Quiet initial implementation',
                'Strategic reveal timing',
                'Market education approach',
                'Discipline maintenance',
                'Competitive response management',
            ],
            analysisType: 'execution',
            reflexiveEffects: {
                triggers: ['Market entry with differentiation', 'Public commitment to excellence'],
                realityChanges: ['Market dynamics altered', 'Competitive landscape changed'],
                futureConstraints: ['Path-dependent advantage created', 'Must continue innovation'],
                reversibility: 'low',
            },
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Reverse Benchmarking',
            emoji: '🔄',
            totalSteps: 5,
            description: 'Find competitive advantage by excelling where all competitors fail',
            focus: 'Creating uncontested market spaces through anti-mimetic excellence',
            enhancedFocus: 'Systematic identification of universal competitor weaknesses to build differentiation',
            parallelSteps: {
                canParallelize: false,
                description: 'Sequential analysis required as each step builds on competitive insights',
            },
            reflexivityProfile: {
                primaryCommitmentType: 'strategic',
                overallReversibility: 'medium',
                riskLevel: 'medium',
            },
        };
    }
    getStepInfo(step) {
        if (step < 1 || step > this.steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Reverse Benchmarking. Valid steps are 1-${this.steps.length}`, 'step', { received: step, expected: `1-${this.steps.length}` });
        }
        return this.steps[step - 1];
    }
    getStepGuidance(step, problem) {
        const stepInfo = this.getStepInfo(step);
        const markers = stepInfo.markers || [];
        const guidanceTemplates = {
            1: `🗺️ **Step 1: Weakness Mapping**

Analyzing competitive landscape for: "${problem}"

Identify what ALL top competitors consistently do poorly or ignore completely.

Map these universal weaknesses:
${markers.map(m => `• ${m}`).join('\n')}

Key Actions:
1. List top 3-5 competitors in your space
2. Document what they ALL do poorly
3. Analyze why these weaknesses persist industry-wide
4. Look for "good enough" areas where excellence would stand out
5. Identify customer pain points everyone tolerates

Dare to Be Trivial (Rule 10):
What absurdly small, trivially easy improvement would have disproportionate
impact? The best competitive advantages often hide in the mundane — things
so simple that everyone assumes they can't matter. Fix the annoying thing
that everyone tolerates. The easiest improvements are often the best.

Examples to consider:
- Coffee/beer at fine dining (11 Madison Park)
- Direct sales in insurance (Direct Line)
- Real beauty in cosmetics (Dove)
- Customer service in airlines (Southwest)

Output: Comprehensive weakness map with persistence explanations`,
            2: `🔍 **Step 2: Vacant Space Analysis**

Evaluating opportunities for: "${problem}"

Assess the value of excelling in areas competitors ignore.

Analyze these opportunity dimensions:
${markers.map(m => `• ${m}`).join('\n')}

Vacant Space Evaluation Matrix:
| Weakness Type | Why Persists | Opportunity Value | Implementation Difficulty |
|--------------|--------------|-------------------|-------------------------|
| Industry blind spots | Groupthink | Very High | Low |
| "Good enough" areas | Low priority | High | Medium |
| Assumed impossibilities | Technical myths | Very High | Variable |
| Cultural taboos | Social norms | High | High |
| Economic assumptions | Pricing models | Very High | Low |

⚠️ Medium Reflexivity: Identifying these spaces begins to shape your strategic positioning.

Output: Prioritized list of vacant spaces with opportunity assessments`,
            3: `🎯 **Step 3: Anti-Mimetic Strategy**

Designing differentiation strategy for: "${problem}"

Create strategies that deliberately avoid copying competitor patterns.

Design these anti-mimetic elements:
${markers.map(m => `• ${m}`).join('\n')}

Anti-Mimetic Principles:
1. **Avoid triggering competitive responses** - Don't signal too early
2. **Build capabilities others can't copy** - Unique organizational DNA
3. **Create customer habits** - Lock in behavioral patterns
4. **Design evolutionary paths** - Routes competitors can't follow
5. **Preserve path independence** - Resist convergence pressure

Strategic Questions:
- What would we do if we couldn't see competitors?
- How can we make this impossible to copy?
- What sacred cows can we violate?
- Where can we be unreasonably good?

⚠️ Medium Reflexivity: Strategic choices here create organizational identity.

Output: Anti-mimetic strategy with differentiation vectors and resource allocation`,
            4: `⭐ **Step 4: Excellence Design**

Creating excellence standards for: "${problem}"

Design world-class execution in mundane, overlooked areas.

Define excellence across:
${markers.map(m => `• ${m}`).join('\n')}

Excellence Design Framework:
1. **Current Standard**: What's the industry baseline?
2. **Excellence Vision**: What would 10x better look like?
3. **Customer Impact**: How will this transform experience?
4. **Implementation Path**: Steps to achieve excellence
5. **Success Metrics**: How to measure differentiation

Real-World Excellence Examples:
- 11 Madison Park: Coffee sommelier at #1 restaurant
- Dove: Real beauty when others chase perfection
- Amazon: Same-day when overnight was "impossible"
- Apple: Beautiful packaging for disposable boxes

Remember: Excellence in the mundane > adequacy in the exotic

Costly Signaling (Rule 5):
Excellence in an overlooked area IS costly signaling. When you invest visibly
in something competitors dismiss as unimportant, you send a powerful message:
"If we care this much about X, imagine what everything else is like."
The very unexpectedness of the investment amplifies the signal.

⚠️ High Reflexivity: Excellence commitments shape brand perception permanently.

Output: Detailed excellence plan with implementation roadmap`,
            5: `🚀 **Step 5: Implementation Path**

Executing competitive advantage for: "${problem}"

Launch your differentiation while maintaining strategic advantage.

Execute across these dimensions:
${markers.map(m => `• ${m}`).join('\n')}

Implementation Strategy:
1. **Start Quietly**: Build capability without fanfare
2. **Perfect in Stealth**: Achieve excellence before revealing
3. **Reveal Strategically**: Time announcement for maximum impact
4. **Educate Market**: Help customers appreciate the difference
5. **Maintain Discipline**: Resist pressure to converge

Path Independence Preservation:
- Don't benchmark against converging competitors
- Ignore industry "best practices" in your vacant space
- Build organizational antibodies to mimetic pressure
- Celebrate what makes you weird
- Measure success differently

Competitive Response Management:
- They'll dismiss it as unimportant (good!)
- They'll say customers don't care (better!)
- They'll try to copy but fail (best!)
- They'll eventually converge (find new spaces!)

⚠️ High Reflexivity: Market entry creates irreversible competitive dynamics.

Output: Complete implementation plan with timeline and success metrics`,
        };
        return guidanceTemplates[step] || `Step ${step}: ${stepInfo.name}\n\nFocus: ${stepInfo.focus}`;
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Step 2: Validate vacant spaces structure
        if (step === 2 && data && typeof data === 'object' && 'vacantSpaces' in data) {
            const dataWithSpaces = data;
            const vacantSpaces = dataWithSpaces.vacantSpaces;
            if (!Array.isArray(vacantSpaces)) {
                return false;
            }
            return vacantSpaces.every((space) => {
                if (typeof space !== 'object' || !space)
                    return false;
                const spaceObj = space;
                const validOpportunity = ['low', 'medium', 'high', 'very_high'].includes(String(spaceObj.opportunityValue));
                const validDifficulty = ['low', 'medium', 'high'].includes(String(spaceObj.implementationDifficulty));
                return (typeof spaceObj.space === 'string' &&
                    validOpportunity &&
                    validDifficulty &&
                    typeof spaceObj.whyVacant === 'string');
            });
        }
        return true;
    }
    extractInsights(history) {
        const insights = [];
        history.forEach((entry, index) => {
            if (entry.output) {
                const stepNumber = index + 1;
                const stepName = this.steps[index]?.name || `Step ${stepNumber}`;
                // Extract weakness mapping insights
                if (entry.weaknessMapping) {
                    const count = entry.weaknessMapping.universalWeaknesses?.length || 0;
                    if (count > 0) {
                        insights.push(`${stepName}: Identified ${count} universal competitor weaknesses`);
                    }
                }
                // Extract vacant space insights
                if (entry.vacantSpaces && Array.isArray(entry.vacantSpaces)) {
                    const highValue = entry.vacantSpaces.filter((s) => s.opportunityValue === 'very_high' || s.opportunityValue === 'high');
                    if (highValue.length > 0) {
                        insights.push(`Found ${highValue.length} high-value vacant spaces`);
                    }
                }
                // Extract strategy insights
                if (entry.antiMimeticStrategy) {
                    insights.push('Anti-mimetic strategy designed to preserve path independence');
                }
                // Extract excellence insights
                if (entry.excellenceDesign) {
                    insights.push(`Excellence standard defined for ${entry.excellenceDesign.area || 'target area'}`);
                }
            }
        });
        // Add summary insight if complete
        if (history.length >= this.steps.length) {
            insights.push('Reverse benchmarking complete - competitive advantage identified in overlooked areas');
        }
        return insights;
    }
}
//# sourceMappingURL=ReverseBenchmarkingHandler.js.map