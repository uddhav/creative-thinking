/**
 * Dynamic Risk Discovery Prompts
 *
 * These prompts guide LLMs to discover domain-specific risks during inference
 * rather than relying on pre-programmed domain knowledge.
 */
/**
 * Get phase-specific prompts for risk discovery
 */
export function getDiscoveryPhasePrompt(phase, context) {
    switch (phase) {
        case 'domain_identification':
            return getDomainIdentificationPrompt(context.problem);
        case 'risk_discovery':
            return getRiskDiscoveryPrompt(context.problem, context.previousPhaseOutput || '');
        case 'ruin_scenarios':
            return getRuinScenarioPrompt(context.problem, context.previousPhaseOutput || '');
        case 'safety_practices':
            return getSafetyPracticesPrompt(context.previousPhaseOutput || '');
        case 'forced_calculations':
            return getForcedCalculationsPrompt(context.proposedAction || '', context.previousPhaseOutput || '');
        case 'validation':
            return getValidationPrompt(context.proposedAction || '', context.previousPhaseOutput || '');
    }
}
/**
 * Domain identification prompt
 */
function getDomainIdentificationPrompt(problem) {
    return `🎯 RISK CHARACTERISTIC ANALYSIS for "${problem}"

Please analyze this problem and identify:

1. **Problem Context**: Describe the nature and scope of this problem
   (without forcing it into predefined categories)

2. **Non-Ergodic Characteristics**: 
   - Can failures be recovered from, or are there points of no return?
   - Do outcomes compound over time?
   - Are there absorbing barriers (states you can't escape)?
   - Is this a repeated game or one-shot?

3. **Time Dynamics**:
   - How quickly can things go wrong?
   - Is there a difference between short-term and long-term risks?
   - Are there critical time windows?

4. **Correlation Risks**:
   - What else might fail if this fails?
   - Are there hidden dependencies?
   - Could success/failure cascade to other areas?

Be specific and thorough. This analysis will guide our risk assessment.`;
}
/**
 * Risk discovery prompt
 */
function getRiskDiscoveryPrompt(problem, domainInfo) {
    return `⚠️ RISK DISCOVERY

Based on the domain analysis:
${domainInfo}

Now discover the specific risks for "${problem}":

1. **Irreversible Actions**: 
   - What decisions or actions cannot be undone?
   - What creates permanent consequences?
   - What burns bridges or closes doors forever?

2. **Ruin Triggers**:
   - What specific events could lead to catastrophic failure?
   - What are the "cliff edges" to avoid?
   - What combinations of events spell disaster?

3. **Hidden Risks**:
   - What risks might not be immediately obvious?
   - What do novices in this domain often miss?
   - What are the "unknown unknowns"?

4. **Risk Amplifiers**:
   - What factors make risks worse?
   - How does timing affect risk?
   - What correlations multiply danger?

5. **Early Warning Signs**:
   - What signals precede disaster?
   - What metrics should be monitored?
   - When is it "too late" to change course?

Think like a domain expert who has seen many failures. What would they warn about?`;
}
/**
 * Ruin scenario prompt
 */
function getRuinScenarioPrompt(problem, risks) {
    return `💀 RUIN SCENARIO ANALYSIS

Given these identified risks:
${risks}

Paint detailed pictures of how ruin could occur for "${problem}":

1. **Complete Failure Scenarios**:
   - Describe 2-3 specific ways total failure could happen
   - What does "game over" look like in this domain?
   - Include both sudden and gradual ruin paths

2. **Cascade Sequences**:
   - Event A leads to → Event B leads to → Ruin
   - Show how small problems compound
   - Identify positive feedback loops of failure

3. **Point of No Return**:
   - At what point is recovery impossible?
   - What resources, once lost, can't be regained?
   - When do options collapse to zero?

4. **Speed of Ruin**:
   - How fast can someone go from "fine" to "ruined"?
   - Are there sudden drops or gradual slides?
   - What accelerates the process?

5. **Real Examples** (if applicable):
   - Historical cases of ruin in this domain
   - Common patterns in failures
   - Lessons from others' disasters

Be vivid and specific. These scenarios will guide our safety constraints.`;
}
/**
 * Safety practices discovery prompt
 */
function getSafetyPracticesPrompt(domainAndRisks) {
    return `🛡️ SAFETY PRACTICES DISCOVERY

Based on the domain analysis and risks identified:
${domainAndRisks}

What safety practices have evolved in this domain to prevent ruin?

1. **Established Frameworks**:
   - What formal methods exist? (e.g., Kelly Criterion in finance)
   - What safety regulations or standards apply?
   - What do textbooks/experts recommend?

2. **Practitioner Wisdom**:
   - What do experienced professionals actually do?
   - What rules of thumb do survivors follow?
   - What "never do X" rules exist?

3. **Safety Margins**:
   - What buffers or reserves are maintained?
   - How much "slack" do experts build in?
   - What redundancies are standard?

4. **Risk Limits**:
   - What exposure limits are typical?
   - How is risk typically capped or bounded?
   - What diversification rules apply?

5. **Decision Frameworks**:
   - How do experts decide when risk is acceptable?
   - What checklists or criteria are used?
   - When do they walk away?

6. **Recovery Mechanisms**:
   - What escape routes are always preserved?
   - How do experts maintain optionality?
   - What "Plan B" is always ready?

Extract specific, actionable practices that prevent the ruin scenarios identified.`;
}
/**
 * Forced calculations prompt
 */
function getForcedCalculationsPrompt(proposedAction, safetyPractices) {
    return `🧮 FORCED CALCULATIONS

Given the proposed action: "${proposedAction}"
And these safety practices: ${safetyPractices}

Calculate the following (be specific with numbers/percentages):

1. **Maximum Loss Calculation**:
   - Worst case: What's the maximum possible loss?
   - Express as: absolute amount AND percentage of total
   - Include indirect/opportunity costs

2. **Recovery Analysis**:
   - Time to recover from maximum loss: ___ months/years
   - Resources required for recovery: ___
   - Probability of successful recovery: ___%

3. **Safety Margin Check**:
   - Recommended safety limit (from practices): ___
   - This action as % of limit: ___%
   - Buffer remaining: ___

4. **Alternative Options**:
   - Number of alternative approaches: ___
   - Best alternative with lower risk: ___
   - Why not choose the alternative?

5. **Reversibility Cost**:
   - Cost to fully reverse this action: ___
   - Time window for reversal: ___
   - Confidence in reversal possibility: ___%

6. **Correlation Impact**:
   - Other areas affected if this fails: ___
   - Total exposure including correlations: ___
   - Worst-case cascade scenario impact: ___

Show your calculations. Vague answers will be rejected.`;
}
/**
 * Validation prompt
 */
function getValidationPrompt(proposedAction, calculations) {
    return `✅ VALIDATION CHECK

Proposed action: "${proposedAction}"
Your calculations: ${calculations}

Now validate this action against your own discovered constraints:

1. **Constraint Violations**:
   - List each safety practice this violates
   - Explain specifically how it violates them
   - Rate severity of each violation (minor/major/critical)

2. **Risk Assessment**:
   - Overall risk level: Low/Medium/High/Unacceptable
   - Probability of ruin scenario: ___%
   - Justified by: [explain reasoning]

3. **Missing Mitigations**:
   - What safeguards are absent?
   - What would reduce risk to acceptable levels?
   - Why weren't these included?

4. **Better Alternatives**:
   - Safer approach that achieves same goal: ___
   - Trade-offs of safer approach: ___
   - Why not recommend the safer option?

5. **Final Judgment**:
   - Should this action be blocked? YES/NO
   - If YES: What must change?
   - If NO: What warnings must be given?

Be honest. If your proposed action violates the safety practices you discovered, acknowledge it.`;
}
/**
 * Generate a meta-prompt that ensures thorough discovery
 */
export function getMetaDiscoveryPrompt() {
    return `🔍 DISCOVERY MINDSET

As you work through these discovery phases, adopt the mindset of:

1. **The Domain Expert**: Who has seen many failures and knows the pitfalls
2. **The Risk Manager**: Who must protect against worst cases
3. **The Survivor**: Who has learned what actually matters through experience
4. **The Teacher**: Who must explain risks clearly to prevent disasters

Remember:
- Enthusiasm can blind us to risks - be deliberately pessimistic
- The goal is to discover real constraints, not to justify predetermined actions
- Your discovered constraints will be enforced - be thorough
- Think in specifics, not generalities
- Consider both obvious and hidden risks

The quality of your risk discovery directly determines the safety of the recommendations.`;
}
/**
 * Check if a response indicates high-risk discovery
 */
export function isHighRiskDiscovery(response) {
    const highRiskIndicators = [
        'irreversible',
        'permanent',
        'ruin',
        'catastrophic',
        'fatal',
        'bankruptcy',
        'no recovery',
        'point of no return',
        'total loss',
        'game over',
        'cannot undo',
        'life-threatening',
        'career-ending',
    ];
    const lowerResponse = response.toLowerCase();
    return highRiskIndicators.some(indicator => lowerResponse.includes(indicator));
}
/**
 * Extract concrete constraints from discovery
 */
export function extractHardConstraints(discoveryResponses) {
    const constraints = [];
    // Look for numerical limits
    const limitPatterns = [
        /never (?:exceed|risk|invest|commit) (?:more than )?(\d+%)/gi,
        /maximum (?:of|is|should be) (\d+%)/gi,
        /limit (?:of|to|is) (\d+%)/gi,
        /no more than (\d+%)/gi,
    ];
    Object.values(discoveryResponses).forEach(response => {
        limitPatterns.forEach(pattern => {
            const matches = [...response.matchAll(pattern)];
            matches.forEach(match => {
                constraints.push(match[0]);
            });
        });
    });
    // Look for absolute prohibitions
    const prohibitionPatterns = [
        /never [^.!?]+/gi,
        /absolutely (?:no|avoid|don't) [^.!?]+/gi,
        /under no circumstances [^.!?]+/gi,
        /must not [^.!?]+/gi,
    ];
    Object.values(discoveryResponses).forEach(response => {
        prohibitionPatterns.forEach(pattern => {
            const matches = [...response.matchAll(pattern)];
            matches.forEach(match => {
                constraints.push(match[0]);
            });
        });
    });
    return [...new Set(constraints)]; // Remove duplicates
}
/**
 * Generate educational feedback when constraints are violated
 */
export function generateConstraintViolationFeedback(proposedAction, violatedConstraints, discoveryContext) {
    return `⛔ SAFETY VIOLATION DETECTED

Your proposed action: "${proposedAction}"

Violates these constraints YOU discovered:
${violatedConstraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Remember what you learned:
- Domain: ${discoveryContext.domain}
- Key risks: ${discoveryContext.risks ? discoveryContext.risks.slice(0, 3).join(', ') : 'Multiple severe risks'}
- Ruin scenarios: ${discoveryContext.ruinScenarios || 0} identified

Your own analysis showed this could lead to:
${discoveryContext.worstCase || 'Catastrophic failure'}

To proceed safely, you must either:
1. Reduce the action to fit within discovered constraints
2. Add sufficient safeguards to prevent ruin scenarios
3. Choose an alternative approach you identified

The system is protecting the user from the risks YOU discovered. Please revise.`;
}
//# sourceMappingURL=riskDiscoveryPrompts.js.map