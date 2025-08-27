/**
 * Random Entry technique handler
 *
 * Enhanced with "Rory Mode" - behavioral economics-inspired wildcarding
 * that focuses on human irrationality and psychological insights
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class RandomEntryHandler extends BaseTechniqueHandler {
    // Rory Mode wildcards inspired by behavioral economics
    roryModeStimuli = {
        psychological: [
            'status anxiety',
            'loss aversion',
            'social proof',
            'placebo effect',
            'commitment device',
            'framing effect',
            'anchoring bias',
            'endowment effect',
            'availability heuristic',
            'confirmation bias',
        ],
        contextual: [
            'expensive wine in cheap bottle',
            'same product different context',
            'changing the comparison set',
            'reframing the reference point',
            'making invisible visible',
            'adding meaningful friction',
            'removing wrong friction',
            'changing when decision happens',
            'changing where decision happens',
            'changing who is present',
        ],
        perceptual: [
            'progress illusion',
            'control theater',
            'competence signaling',
            'authenticity paradox',
            'effort justification',
            'peak-end optimization',
            'duration neglect',
            'contrast amplification',
            'attention misdirection',
            'expectation management',
        ],
        counterintuitive: [
            'make it harder to increase value',
            'reduce features to improve satisfaction',
            'increase price to boost demand',
            'add steps to enhance experience',
            'create scarcity from abundance',
            'solve different problem entirely',
            'make weakness the strength',
            'embrace the constraint',
            'celebrate the flaw',
            'reverse the assumption',
        ],
    };
    getTechniqueInfo() {
        return {
            name: 'Random Entry',
            emoji: '🎲',
            totalSteps: 3,
            description: 'Use random stimuli to trigger new associations (enhanced with Rory Mode)',
            focus: 'Generate fresh perspectives through unrelated concepts',
            enhancedFocus: 'Includes "Rory Mode" for behavioral economics-inspired psychological wildcarding',
            parallelSteps: {
                canParallelize: false,
                description: 'Random stimulus must be generated before connections can be explored',
            },
            reflexivityProfile: {
                primaryCommitmentType: 'exploratory',
                overallReversibility: 'high',
                riskLevel: 'low',
            },
        };
    }
    getStepInfo(step) {
        const steps = [
            {
                name: 'Random Stimulus',
                focus: 'Select a random word or concept',
                emoji: '🎲',
            },
            {
                name: 'Force Connections',
                focus: 'Find links between stimulus and problem',
                emoji: '🔗',
            },
            {
                name: 'Develop Ideas',
                focus: 'Transform connections into solutions',
                emoji: '💡',
            },
        ];
        if (step < 1 || step > steps.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Random Entry technique. Valid steps are 1-${steps.length}`, 'step', { providedStep: step, validRange: `1-${steps.length}` });
        }
        return steps[step - 1];
    }
    getStepGuidance(step, problem, context) {
        // Handle out of bounds gracefully
        if (step < 1 || step > 3) {
            return `Complete the Random Entry process for "${problem}"`;
        }
        const isRoryMode = context?.roryMode || false;
        switch (step) {
            case 1:
                if (isRoryMode) {
                    return `🎲 **Step 1: Random Stimulus (Rory Mode)**

Selecting behavioral economics wildcard for: "${problem}"

Instead of a traditional random word, we'll use a psychological/perceptual stimulus 
that reveals human irrationality and hidden motivations.

**Rory Mode Categories:**
• **Psychological**: Biases and mental shortcuts (loss aversion, social proof)
• **Contextual**: Environmental manipulations (changing where/when/how)
• **Perceptual**: Experience illusions (progress theater, peak-end rule)
• **Counterintuitive**: Paradoxical strategies (make it harder to increase value)

**Sutherland's Principle:**
"The opposite of a good idea can also be a good idea"

Select one wildcard from these categories or generate your own behavioral insight.
Don't think about "${problem}" yet - just pick what intrigues you.

Examples:
- "Making it more expensive made it more desirable" (Veblen goods)
- "Adding friction increased satisfaction" (IKEA effect)
- "Showing less improved conversion" (Paradox of choice)`;
                }
                else {
                    return `🎲 **Step 1: Random Stimulus**

Choose a random word/concept for: "${problem}"

Select from a book, dictionary, or random generator.
Don't think about the problem yet - just pick something unrelated.

Optional: Enable "Rory Mode" for behavioral economics-inspired wildcards.`;
                }
            case 2:
                if (isRoryMode) {
                    return `🔗 **Step 2: Force Connections (Rory Mode)**

Connect your behavioral wildcard to: "${problem}"

How do the psychological/perceptual principles apply?

**Connection Strategies:**
• **Inversion**: What if we did the opposite?
• **Reframing**: How would this change the context?
• **Perception Hack**: What subjective experience could we create?
• **Irrational Appeal**: What emotional button does this push?
• **Status Play**: How does this affect social signaling?

**Key Questions:**
- How would this bias/effect manifest in our problem?
- What human irrationality could we leverage?
- Where are we fighting psychology instead of using it?
- What would happen if we optimized for perception, not reality?

Remember: "Humans are not logical, they're psychological"`;
                }
                else {
                    return `🔗 **Step 2: Force Connections**

Force connections between your random stimulus and "${problem}".

How do properties, characteristics, or associations of the stimulus relate?
What unexpected parallels can you draw?`;
                }
            case 3:
                if (isRoryMode) {
                    return `💡 **Step 3: Develop Ideas (Rory Mode)**

Transform psychological insights into solutions for: "${problem}"

**Development Framework:**
• **Perception Solution**: Change how it's experienced, not what it is
• **Context Solution**: Alter the environment, not the product
• **Psychological Solution**: Appeal to emotions, not logic
• **Counterintuitive Solution**: Do the opposite of best practice

**Sutherland's Tests:**
1. Would a rational economist hate this? (Good sign!)
2. Does it make psychological sense even if not logical sense?
3. Could we test this cheaply before committing?
4. What's the worst that could happen? (Often: nothing)

**Remember:**
- Small perceptual changes can have massive impacts
- The map is not the territory (perception ≠ reality)
- Costly signaling often works better than efficiency
- Sometimes the irrational approach is the most effective`;
                }
                else {
                    return `💡 **Step 3: Develop Ideas**

Develop the connections into practical ideas for "${problem}".

Which associations lead to viable solutions?
How can the forced connections become real innovations?`;
                }
            default:
                return `Apply Random Entry step ${step} to "${problem}"`;
        }
    }
    getRandomRoryStimulus() {
        const categories = Object.keys(this.roryModeStimuli);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const categoryStimuli = this.roryModeStimuli[randomCategory];
        return categoryStimuli[Math.floor(Math.random() * categoryStimuli.length)];
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Additional validation for Rory Mode
        if (data && typeof data === 'object' && 'roryMode' in data) {
            const dataWithRoryMode = data;
            if (typeof dataWithRoryMode.roryMode !== 'boolean') {
                return false;
            }
        }
        return true;
    }
    extractInsights(history) {
        const insights = [];
        const isRoryMode = history.some(entry => entry.roryMode === true);
        history.forEach(entry => {
            if (entry.currentStep === 1 && entry.randomStimulus) {
                if (isRoryMode) {
                    insights.push(`Rory Mode stimulus: ${entry.randomStimulus} (behavioral economics wildcard)`);
                }
                else {
                    insights.push(`Random stimulus used: ${entry.randomStimulus}`);
                }
            }
            if (entry.currentStep === 2 && entry.connections && entry.connections.length > 0) {
                if (isRoryMode) {
                    insights.push(`Psychological connection: ${entry.connections[0]}`);
                }
                else {
                    insights.push(`Key connection: ${entry.connections[0]}`);
                }
            }
            if (entry.currentStep === 3 && entry.output) {
                const ideas = entry.output.match(/could|might|perhaps/gi);
                if (ideas && ideas.length > 0) {
                    if (isRoryMode) {
                        insights.push(`Generated ${ideas.length} counterintuitive solutions using behavioral insights`);
                    }
                    else {
                        insights.push(`Generated ${ideas.length} potential ideas from random stimulus`);
                    }
                }
            }
        });
        // Add summary insight for Rory Mode
        if (isRoryMode && history.length >= 3) {
            insights.push('Rory Mode: Applied behavioral economics principles to generate non-obvious solutions');
        }
        return insights;
    }
    /**
     * Get a suggested Rory Mode stimulus for a given problem
     */
    suggestRoryStimulus() {
        return this.getRandomRoryStimulus();
    }
}
//# sourceMappingURL=RandomEntryHandler.js.map