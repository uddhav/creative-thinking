/**
 * Context Reframing technique handler
 *
 * A 5-step technique inspired by Rory Sutherland's principle that
 * "you can change a million minds or just change one context"
 */
import { BaseTechniqueHandler, describeStructuredField, firstSentence, } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class ContextReframingHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Context Analysis',
            focus: 'Map current decision environment and constraints',
            emoji: '🗺️',
            type: 'thinking',
            dimensions: [
                'Current context mapping',
                'Environmental factors',
                'Decision triggers',
                'Frame influences',
                'Behavioral constraints',
            ],
            analysisType: 'environment_mapping',
        },
        {
            name: 'Intervention Points',
            focus: 'Identify where context changes would have maximum impact',
            emoji: '🎯',
            type: 'thinking',
            dimensions: [
                'Spatial interventions (WHERE)',
                'Temporal interventions (WHEN)',
                'Social interventions (WHO)',
                'Comparative interventions (WHAT)',
                'Procedural interventions (HOW)',
                'Informational interventions (WHICH)',
            ],
            analysisType: 'intervention_discovery',
            reflexiveEffects: {
                triggers: ['Context manipulation planning', 'Environmental design decisions'],
                realityChanges: ['Understanding of behavioral drivers'],
                futureConstraints: ['Must consider context dependencies'],
                reversibility: 'medium',
            },
        },
        {
            name: 'Frame Shifting',
            focus: 'Design context changes that reshape perception',
            emoji: '🔄',
            type: 'action',
            dimensions: [
                'Reference point manipulation',
                'Comparison set changes',
                'Default modifications',
                'Choice architecture',
                'Narrative reframing',
            ],
            analysisType: 'frame_design',
            reflexiveEffects: {
                triggers: ['Frame selection', 'Perception anchor setting'],
                realityChanges: ['Decision context permanently altered', 'Behavioral patterns shifted'],
                futureConstraints: ['New frame becomes sticky', 'Hard to revert to old context'],
                reversibility: 'low',
            },
        },
        {
            name: 'Environment Design',
            focus: 'Architect decision environments for desired outcomes',
            emoji: '🏗️',
            type: 'action',
            dimensions: [
                'Physical environment changes',
                'Digital interface modifications',
                'Process redesign',
                'Social context engineering',
                'Information architecture',
            ],
            analysisType: 'environment_architecture',
            reflexiveEffects: {
                triggers: ['Environmental implementation', 'Context materialization'],
                realityChanges: ['Physical/digital spaces transformed', 'User habits reformed'],
                futureConstraints: ['Environmental changes create path dependencies'],
                reversibility: 'low',
            },
        },
        {
            name: 'Behavioral Activation',
            focus: 'Deploy context changes and measure behavioral shifts',
            emoji: '🚀',
            type: 'action',
            dimensions: [
                'Implementation strategy',
                'Behavioral measurement',
                'Adjustment protocols',
                'Scaling approach',
                'Persistence mechanisms',
            ],
            analysisType: 'activation',
            reflexiveEffects: {
                triggers: ['Context deployment', 'Behavioral change initiation'],
                realityChanges: ['Mass behavior shifted', 'New normal established'],
                futureConstraints: ['Behavioral patterns locked in', 'Context becomes expected'],
                reversibility: 'very_low',
            },
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Context Reframing',
            emoji: '🖼️',
            totalSteps: 5,
            description: 'Change decision contexts to reshape behavior without persuasion',
            focus: 'Environmental and contextual design for behavioral influence',
            enhancedFocus: 'Systematically redesigning decision environments to influence choices at scale',
            parallelSteps: {
                canParallelize: false,
                description: 'Sequential progression needed to build from analysis to implementation',
            },
            reflexivityProfile: {
                primaryCommitmentType: 'environmental',
                overallReversibility: 'low',
                riskLevel: 'high',
            },
        };
    }
    getStepInfo(step) {
        if (step < 1 || step > this.steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Context Reframing. Valid steps are 1-${this.steps.length}`, 'step', { received: step, expected: `1-${this.steps.length}` });
        }
        return this.steps[step - 1];
    }
    getStepGuidance(step, problem) {
        const stepInfo = this.steps[step - 1];
        const dimensions = stepInfo?.dimensions || [];
        const guidanceTemplates = {
            1: `🗺️ **Step 1: Context Analysis**

Mapping decision environment for: "${problem}"

Understand the current context that shapes decisions and behaviors.

Analyze these contextual dimensions:
${dimensions.map(d => `• ${d}`).join('\n')}

Context Mapping Framework:
1. **Physical Context**: Location, layout, accessibility
2. **Temporal Context**: Timing, sequence, duration  
3. **Social Context**: Audience, authority, peers
4. **Comparative Context**: Alternatives, anchors, defaults
5. **Emotional Context**: Mood, stress, comfort
6. **Cognitive Context**: Complexity, load, clarity

Key Questions:
- WHERE do decisions currently happen?
- WHEN are choices being made?
- WHO influences the decision?
- WHAT alternatives are visible?
- HOW is information presented?

Rationality Audit (Rule 9):
"Solving problems with only rationality is like playing golf with one club."
Before mapping context, ask: Are we only looking through a rational lens?
What emotional, social, or identity factors shape this context?
What would a psychologist see that an economist wouldn't?

Real-World Examples:
- Organ donation: Opt-in vs opt-out countries
- Retirement savings: Auto-enrollment vs voluntary
- Hotel towels: Environmental messaging placement

Output: Complete context map with behavioral influences identified`,
            2: `🎯 **Step 2: Intervention Points**

Identifying leverage points for: "${problem}"

Find where small context changes create large behavioral shifts.

Explore intervention opportunities:
${dimensions.map(d => `• ${d}`).join('\n')}

Intervention Type Analysis:
| Type | Change Focus | Example | Impact Potential |
|------|-------------|---------|-----------------|
| Spatial | WHERE decisions occur | Online vs in-store | Very High |
| Temporal | WHEN choices are made | Before vs after eating | High |
| Social | WHO is present | Alone vs with peers | Very High |
| Comparative | WHAT is compared | Premium vs basic first | High |
| Procedural | HOW decisions unfold | Steps and sequence | Medium |
| Informational | WHICH data is shown | Framing and emphasis | High |

Sutherland's Principle:
"The context is often more powerful than the content"

Examples:
- Argos: Catalog shopping changed WHERE decisions happened
- Direct Line: Phone number everywhere changed HOW to buy insurance
- EasyJet: Removed meal choice, changed WHAT was expected

⚠️ Medium Reflexivity: Intervention choices begin shaping future possibilities.

Output: Prioritized intervention points with implementation strategies`,
            3: `🔄 **Step 3: Frame Shifting**

Designing perception changes for: "${problem}"

Create context shifts that fundamentally alter how choices are perceived.

Design frame shifts across:
${dimensions.map(d => `• ${d}`).join('\n')}

Frame Shifting Techniques:
1. **Reference Point Reset**: Change what "normal" means
2. **Comparison Set Control**: Alter what options are visible
3. **Default Power**: Make desired choice the path of least resistance
4. **Loss vs Gain Framing**: Same information, different impact
5. **Social Proof Integration**: Show what others do

Classic Reframes:
| Original Frame | Reframed Context | Behavioral Change |
|---------------|------------------|-------------------|
| "Expensive product" | "Investment in quality" | Value perception up |
| "Diet food" | "Healthy lifestyle" | Adoption increased |
| "Used car" | "Pre-owned vehicle" | Status improved |
| "Gambling losses" | "Entertainment cost" | Acceptance higher |

Design Principles:
- Make the desired behavior easier than alternatives
- Remove friction from good choices
- Add friction to poor choices
- Leverage social dynamics
- Use defaults wisely

Dare to Be Trivial (Rule 10):
What absurdly small intervention could have disproportionate impact?
Sometimes the most powerful reframe is the tiniest one — changing a single
word, moving one element, adjusting one default. Don't dismiss simple changes.
The plastic bag charge changed a nation's behavior for 5p.

⚠️ High Reflexivity: Frame choices create sticky mental models.

Output: Frame shifting strategy with specific interventions`,
            4: `🏗️ **Step 4: Environment Design**

Architecting decision spaces for: "${problem}"

Build physical and digital environments that naturally guide behavior.

Design environmental changes:
${dimensions.map(d => `• ${d}`).join('\n')}

Environmental Architecture Elements:
1. **Choice Architecture**: How options are structured and presented
2. **Sensory Design**: What people see, hear, feel first
3. **Flow Optimization**: Natural movement through decisions
4. **Cognitive Load Management**: Simplicity where it matters
5. **Social Dynamics**: Peer influence and social proof

Implementation Strategies:
- **Physical Spaces**: Layout, signage, pathways
- **Digital Interfaces**: UI/UX, defaults, progressive disclosure
- **Process Flows**: Steps, checkpoints, confirmations
- **Information Display**: What's highlighted vs hidden
- **Social Context**: Visible behaviors of others

Success Stories:
- Airport security: Shoe removal zones (procedural context)
- Cafeteria design: Healthy food at eye level (spatial context)
- Amazon 1-Click: Removing purchase friction (procedural context)
- Energy bills: Neighbor comparison (social context)

Remember: "Environmental change is more powerful than willpower"

⚠️ High Reflexivity: Environmental changes create lasting behavioral patterns.

Output: Detailed environment design with implementation blueprint`,
            5: `🚀 **Step 5: Behavioral Activation**

Deploying context changes for: "${problem}"

Launch your reframed context and measure behavioral transformation.

Activate across these dimensions:
${dimensions.map(d => `• ${d}`).join('\n')}

Deployment Strategy:
1. **Pilot Testing**: Start small, learn fast
2. **Gradual Rollout**: Phase implementation
3. **Measurement Systems**: Track behavioral changes
4. **Feedback Loops**: Adjust based on results
5. **Scaling Mechanisms**: Expand what works

Key Metrics:
- Behavioral change rate (% adopting new behavior)
- Persistence over time (stickiness)
- Unintended consequences (watch for surprises)
- Cost per behavior changed
- Viral coefficient (does it spread?)

Persistence Mechanisms:
- Make new context the only option
- Remove ability to revert
- Create social reinforcement
- Build habit formation triggers
- Celebrate new normal

Cheap Experiment Validation (Rule 7):
"A good guess plus empirical observation equals science."
Before scaling, validate with the cheapest possible experiment. Run a
one-week pilot, A/B test on 1% of traffic, or shadow-deploy the context change.
A quick empirical observation beats months of theoretical planning.

Real-World Activation:
- UK pension auto-enrollment: 10% → 90% participation
- Plastic bag charges: 85% reduction in use
- Default organ donation: 15% → 90% donor rates
- Calorie menu labeling: 8% reduction in calories ordered

⚠️ Very High Reflexivity: Mass behavioral shifts become new societal norms.

Output: Complete activation plan with success metrics and scaling strategy`,
        };
        return guidanceTemplates[step] || `Complete the Context Reframing process for: "${problem}"`;
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Step 2: Validate intervention points
        if (step === 2 && data && typeof data === 'object' && 'interventions' in data) {
            const interventions = data.interventions;
            if (!Array.isArray(interventions)) {
                return false;
            }
            return interventions.every((intervention) => {
                if (typeof intervention !== 'object' || !intervention)
                    return false;
                const interventionObj = intervention;
                const validTypes = [
                    'spatial',
                    'temporal',
                    'social',
                    'comparative',
                    'procedural',
                    'informational',
                ];
                const validEase = ['easy', 'moderate', 'difficult'];
                return (validTypes.includes(interventionObj.type) &&
                    typeof interventionObj.description === 'string' &&
                    typeof interventionObj.expectedImpact === 'string' &&
                    validEase.includes(interventionObj.implementationEase));
            });
        }
        return true;
    }
    /**
     * Report what each step actually recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array: `execute`
     * appends a history entry for every call including revisions, so one revision
     * shifts every later entry. Keying on the step also means a revision
     * supersedes the entry it revises rather than reporting twice.
     */
    extractInsights(history) {
        const totalSteps = this.steps.length;
        const latestByStep = new Map();
        history.forEach((entry, index) => {
            if (typeof entry !== 'object' || entry === null) {
                return;
            }
            const entryObj = entry;
            // Fall back to position only when the caller sent no step number.
            const step = typeof entryObj.currentStep === 'number' ? entryObj.currentStep : index + 1;
            if (step >= 1 && step <= totalSteps) {
                latestByStep.set(step, entryObj);
            }
        });
        const insights = [];
        for (let step = 1; step <= totalSteps; step++) {
            const entryObj = latestByStep.get(step);
            if (!entryObj) {
                continue;
            }
            const stepName = this.steps[step - 1]?.name;
            if (!stepName) {
                continue;
            }
            const output = typeof entryObj.output === 'string' ? entryObj.output.trim() : '';
            if (output) {
                const summary = firstSentence(output);
                if (summary.length > 0) {
                    insights.push(`${stepName}: ${summary}`);
                }
            }
            // Each structured field belongs to one step; report it there.
            if (step === 1 && entryObj.contextAnalysis) {
                // The content, not a sentence about the content. "Current context mapped
                // with key constraints identified" is true of every run that reached
                // step 1 and tells a reader none of the constraints.
                const described = describeStructuredField(entryObj.contextAnalysis);
                if (described) {
                    insights.push(`${stepName} recorded: ${described}`);
                }
            }
            if (step === 2 && Array.isArray(entryObj.interventions)) {
                const highImpact = entryObj.interventions.filter((i) => {
                    if (typeof i === 'object' && i !== null) {
                        const interventionObj = i;
                        return (interventionObj.implementationEase === 'easy' ||
                            interventionObj.implementationEase === 'moderate');
                    }
                    return false;
                });
                if (highImpact.length > 0) {
                    insights.push(`${stepName}: Identified ${highImpact.length} high-impact context interventions — ${highImpact
                        .map(i => i.description)
                        .filter(d => typeof d === 'string' && d.length > 0)
                        .join(', ')}`);
                }
            }
            if (step === 3) {
                // Report the frame that was recorded, not a constant announcing that
                // some frame exists.
                const frameShift = describeStructuredField(entryObj.frameShift);
                if (frameShift.length > 0) {
                    insights.push(`${stepName}: ${frameShift}`);
                }
            }
            if (step === 4) {
                const environment = describeStructuredField(entryObj.environmentDesign);
                if (environment.length > 0) {
                    insights.push(`${stepName}: ${environment}`);
                }
            }
            if (step === 5) {
                // The metrics themselves, from the field that holds them. This used to
                // also fire on the output containing the literal phrase "behavioral
                // change rate", so a rate reported in any other wording vanished — and
                // the phrase produced a constant rather than the number.
                const metrics = describeStructuredField(entryObj.behavioralMetrics);
                if (metrics.length > 0) {
                    insights.push(`${stepName}: ${metrics}`);
                }
            }
        }
        // No completion banner. Reaching the last step is already visible from the
        // step count, and a fixed string asserts a finding the session never made —
        // "competitive advantage identified", "future insights extracted" — whatever
        // the steps actually said.
        return insights;
    }
}
//# sourceMappingURL=ContextReframingHandler.js.map