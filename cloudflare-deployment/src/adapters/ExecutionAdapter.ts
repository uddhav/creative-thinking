/**
 * ExecutionAdapter - Bridges execution logic with Cloudflare environment
 */

import { SessionAdapter } from './SessionAdapter.js';
import { TechniqueAdapter } from './TechniqueAdapter.js';
import { McpError, Errors, ErrorCode } from '../utils/errors.js';
import { VALID_TECHNIQUES } from '../constants/techniques.js';

export class ExecutionAdapter {
  constructor(
    private sessionAdapter: SessionAdapter,
    private techniqueAdapter: TechniqueAdapter
  ) {}

  async planThinkingSession(params: {
    problem: string;
    techniques: string[];
    objectives?: string[];
    constraints?: string[];
    timeframe?: string;
    executionMode?: string;
    maxParallelism?: number;
  }): Promise<any> {
    const { problem, techniques, objectives, constraints, timeframe, executionMode } = params;

    // Validate techniques
    const validTechniques = [];
    const invalidTechniques = [];

    for (const technique of techniques) {
      if (this.techniqueAdapter.getTechnique(technique)) {
        validTechniques.push(technique);
      } else {
        invalidTechniques.push(technique);
      }
    }

    if (invalidTechniques.length > 0) {
      throw Errors.invalidTechnique(invalidTechniques[0], VALID_TECHNIQUES.slice());
    }

    // Create plan
    const planId = await this.sessionAdapter.createPlan(problem, validTechniques, {
      objectives,
      constraints,
      timeframe,
      executionMode,
    });

    const plan = await this.sessionAdapter.getPlan(planId);

    // Generate execution graph
    const executionGraph = this.generateExecutionGraph(validTechniques, executionMode);

    return {
      planId,
      problem,
      techniques: validTechniques,
      totalSteps: plan.steps.length,
      executionMode: executionMode || 'sequential',
      steps: plan.steps,
      executionGraph,
      metadata: {
        createdAt: new Date(plan.createdAt).toISOString(),
        objectives,
        constraints,
        timeframe,
        estimatedDuration: this.estimateDuration(validTechniques),
      },
    };
  }

  async executeThinkingStep(params: any): Promise<any> {
    const { planId, technique, problem, currentStep, totalSteps, output, nextStepNeeded } = params;

    // Validate required fields
    if (!planId) {
      throw Errors.missingRequiredField('planId', 'executeThinkingStep');
    }
    if (!technique) {
      throw Errors.missingRequiredField('technique', 'executeThinkingStep');
    }
    if (!problem) {
      throw Errors.missingRequiredField('problem', 'executeThinkingStep');
    }

    // Validate currentStep is within bounds
    if (typeof currentStep !== 'number' || currentStep < 1 || currentStep > totalSteps) {
      throw Errors.invalidStepNumber(currentStep, totalSteps);
    }

    // Validate nextStepNeeded is boolean
    if (typeof nextStepNeeded !== 'boolean') {
      throw new McpError(
        ErrorCode.INVALID_PARAMETER,
        'nextStepNeeded must be a boolean value',
        { nextStepNeeded },
        'Set nextStepNeeded to true if more steps are needed, false otherwise',
        400
      );
    }

    // Get or create session
    let session = await this.sessionAdapter.getSession(planId);
    if (!session) {
      session = await this.sessionAdapter.createSession(problem, technique);
      session.planId = planId;
      await this.sessionAdapter.saveSession(session.id, session);
    }

    // Get technique info
    const techniqueInfo = this.techniqueAdapter.getTechnique(technique);
    if (!techniqueInfo) {
      return {
        error: `Unknown technique: ${technique}`,
        isError: true,
      };
    }

    // Determine technique step
    const techniqueStep = this.calculateTechniqueStep(currentStep, technique, session.history);

    // Generate guidance
    const guidance = this.generateStepGuidance(technique, techniqueStep, problem);

    // Create step entry
    const stepEntry = {
      technique,
      problem,
      currentStep,
      totalSteps,
      techniqueStep,
      totalTechniqueSteps: techniqueInfo.stepCount,
      output,
      nextStepNeeded,
      guidance,
      timestamp: new Date().toISOString(),
      ...this.extractTechniqueSpecificFields(params),
    };

    // Add to history
    await this.sessionAdapter.addToHistory(session.id, stepEntry);

    // Generate response
    const response: any = {
      sessionId: session.id,
      planId,
      technique,
      currentStep,
      totalSteps,
      techniqueStep,
      totalTechniqueSteps: techniqueInfo.stepCount,
      nextStepNeeded,
      status: 'success',
    };

    // Add next step guidance if needed
    if (nextStepNeeded) {
      const nextTechniqueStep = techniqueStep + 1;
      if (nextTechniqueStep <= techniqueInfo.stepCount) {
        response.nextStep = {
          step: currentStep + 1,
          technique,
          techniqueStep: nextTechniqueStep,
          guidance: this.generateStepGuidance(technique, nextTechniqueStep, problem),
        };
      } else {
        // Move to next technique if available
        const plan = await this.sessionAdapter.getPlan(planId);
        if (plan && currentStep < totalSteps) {
          const nextStepInfo = plan.steps[currentStep];
          if (nextStepInfo) {
            response.nextStep = {
              step: currentStep + 1,
              technique: nextStepInfo.technique,
              techniqueStep: 1,
              guidance: this.generateStepGuidance(nextStepInfo.technique, 1, problem),
            };
          }
        }
      }
    }

    // Add completion message if done
    if (!nextStepNeeded || currentStep >= totalSteps) {
      response.completion = {
        message: 'Thinking session completed successfully',
        totalSteps: currentStep,
        techniques: await this.getUsedTechniques(session),
        sessionId: session.id,
      };
    }

    return response;
  }

  private generateExecutionGraph(techniques: string[], mode?: string): any {
    if (mode === 'parallel') {
      return {
        type: 'parallel',
        groups: techniques.map(t => ({
          technique: t,
          steps: this.techniqueAdapter.getTechnique(t)?.stepCount || 3,
        })),
      };
    }

    // Sequential by default
    let stepNumber = 1;
    const sequence = [];

    for (const technique of techniques) {
      const stepCount = this.techniqueAdapter.getTechnique(technique)?.stepCount || 3;
      for (let i = 1; i <= stepCount; i++) {
        sequence.push({
          step: stepNumber++,
          technique,
          techniqueStep: i,
          totalTechniqueSteps: stepCount,
        });
      }
    }

    return {
      type: 'sequential',
      sequence,
    };
  }

  private estimateDuration(techniques: string[]): string {
    let totalMinutes = 0;

    for (const technique of techniques) {
      const info = this.techniqueAdapter.getTechnique(technique);
      if (info) {
        const estimate = info.timeEstimate;
        const match = estimate.match(/(\d+)-(\d+)/);
        if (match) {
          totalMinutes += (parseInt(match[1]) + parseInt(match[2])) / 2;
        }
      }
    }

    if (totalMinutes < 60) {
      return `${Math.round(totalMinutes)} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
    }
  }

  private calculateTechniqueStep(currentStep: number, technique: string, history: any[]): number {
    // Count previous steps with same technique
    const previousSteps = history.filter(h => h.technique === technique).length;
    return previousSteps + 1;
  }

  private generateStepGuidance(technique: string, step: number, problem: string): string {
    const guidanceMap: Record<string, Record<number, string>> = {
      six_hats: {
        1: `Blue Hat: Define the thinking process for "${problem}". What are we trying to achieve?`,
        2: `White Hat: Gather facts and data about "${problem}". What do we know for certain?`,
        3: `Red Hat: Express feelings and intuitions about "${problem}". What does your gut say?`,
        4: `Yellow Hat: Find benefits and positive aspects of "${problem}". What could work well?`,
        5: `Black Hat: Identify risks and potential problems with "${problem}". What could go wrong?`,
        6: `Green Hat: Generate creative solutions for "${problem}". What new ideas emerge?`,
      },
      po: {
        1: `Create a provocative statement about "${problem}" that challenges assumptions`,
        2: `Explore the provocation: What new directions does it suggest?`,
        3: `Extract practical ideas from the provocative exploration`,
        4: `Develop the most promising ideas into actionable solutions`,
      },
      scamper: {
        1: `Substitute: What can be substituted in "${problem}"?`,
        2: `Combine: What can be combined or integrated?`,
        3: `Adapt: What can be adapted from elsewhere?`,
        4: `Modify/Magnify: What can be emphasized or enhanced?`,
        5: `Put to other uses: How else could this be used?`,
        6: `Eliminate: What can be removed or simplified?`,
        7: `Reverse: What can be reversed or rearranged?`,
        8: `Parameterize: What variables can be adjusted?`,
      },
      first_principles: {
        1: `Break down "${problem}" into fundamental components`,
        2: `Identify the fundamental truths about each component`,
        3: `Challenge assumptions: What's assumed but not necessarily true?`,
        4: `Rebuild the solution from fundamental truths`,
      },
    };

    const techniqueGuidance = guidanceMap[technique];
    if (techniqueGuidance && techniqueGuidance[step]) {
      return techniqueGuidance[step];
    }

    return `Continue with step ${step} of ${technique} for: "${problem}"`;
  }

  private extractTechniqueSpecificFields(params: any): any {
    const techniqueFields: Record<string, string[]> = {
      six_hats: ['hatColor'],
      po: ['provocation'],
      random_entry: ['randomStimulus', 'connections'],
      scamper: ['scamperAction', 'modifications'],
      concept_extraction: ['extractedConcepts', 'abstractedPatterns', 'applications'],
      yes_and: ['initialIdea', 'additions', 'evaluations', 'synthesis'],
      design_thinking: ['designStage', 'empathyInsights', 'problemStatement', 'ideaList'],
      triz: ['contradiction', 'inventivePrinciples', 'minimalSolution'],
      first_principles: ['components', 'fundamentalTruths', 'assumptions', 'reconstruction'],
    };

    const extracted: any = {};
    const fields = techniqueFields[params.technique] || [];

    for (const field of fields) {
      if (params[field] !== undefined) {
        extracted[field] = params[field];
      }
    }

    // Common fields
    if (params.risks) extracted.risks = params.risks;
    if (params.mitigations) extracted.mitigations = params.mitigations;
    if (params.antifragileProperties)
      extracted.antifragileProperties = params.antifragileProperties;

    return extracted;
  }

  private async getUsedTechniques(session: any): Promise<string[]> {
    const techniques = new Set<string>();
    for (const entry of session.history) {
      if (entry.technique) {
        techniques.add(entry.technique);
      }
    }
    return Array.from(techniques);
  }
}
