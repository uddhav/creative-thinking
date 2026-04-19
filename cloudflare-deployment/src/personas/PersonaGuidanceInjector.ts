/**
 * PersonaGuidanceInjector - Injects persona voice into step guidance
 *
 * Prepends persona context to existing technique step guidance so the LLM
 * embodies the persona's thinking style, principles, and challenge questions.
 * All methods are static — this class is stateless.
 */

import type { PersonaDefinition, PersonaStepContext } from './types.js';

export class PersonaGuidanceInjector {
  /**
   * Create a PersonaStepContext for a given persona and step
   */
  static createStepContext(
    persona: PersonaDefinition,
    step: number,
    _totalSteps: number
  ): PersonaStepContext {
    // Rotate through principles based on step
    const principleIndex = (step - 1) % persona.keyPrinciples.length;
    const principle = persona.keyPrinciples[principleIndex];

    // Rotate through challenge questions
    const challengeIndex = (step - 1) % persona.challengeQuestions.length;
    const challenge = persona.challengeQuestions[challengeIndex];

    return {
      personaId: persona.id,
      personaName: persona.name,
      voiceGuidance: `Think as ${persona.name} would — ${persona.perspective}`,
      principlesReminder: principle,
      challengeQuestion: challenge,
    };
  }

  /**
   * Inject persona context into existing step guidance
   */
  static injectGuidance(
    originalGuidance: string,
    persona: PersonaDefinition,
    step: number,
    totalSteps: number
  ): string {
    const context = PersonaGuidanceInjector.createStepContext(persona, step, totalSteps);

    const parts = [
      `**[Thinking as ${persona.name}]** _${persona.tagline}_`,
      `Core principle: ${context.principlesReminder}`,
      `Challenge: ${context.challengeQuestion}`,
      '',
      originalGuidance,
    ];

    // Add evaluation reminder on final steps
    if (step === totalSteps && persona.evaluationCriteria.length > 0) {
      parts.push('');
      parts.push(`**${persona.name}'s Evaluation Criteria:**`);
      parts.push(persona.evaluationCriteria.map(c => `• ${c}`).join('\n'));
    }

    return parts.join('\n');
  }

  /**
   * Create a debate synthesis header when multiple personas are involved
   */
  static createDebateSynthesisHeader(personas: PersonaDefinition[]): string {
    const lines = personas.map(
      p => `• **${p.name}** (${p.tagline}): ${p.perspective.split('.')[0]}.`
    );

    return `**[Debate Synthesis]**
Integrating perspectives from ${personas.length} thinkers:
${lines.join('\n')}

Look for: agreements (stronger signal), disagreements (key decision points), and blind spots (what nobody mentioned).
`;
  }
}
