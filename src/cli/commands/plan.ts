import type { Argv, ArgumentsCamelCase } from 'yargs';
import { getServer } from '../server.js';
import { emit, mergeInput, parseList, parseNumber, readStdinJSON, unwrapResponse } from '../io.js';
import { persistPlan } from '../planStore.js';

interface PlanArgs {
  problem?: string;
  techniques?: string;
  objectives?: string;
  constraints?: string;
  timeframe?: string;
  strictness?: string;
  includeOptions?: boolean;
  sessionId?: string;
  executionMode?: string;
  maxParallelism?: number | string;
  parallelizationStrategy?: string;
  persona?: string;
  personas?: string;
  debateFormat?: string;
}

export function registerPlan(yargs: Argv): Argv {
  return yargs.command<PlanArgs>(
    'plan',
    'Build a structured workflow from a problem and chosen techniques',
    y =>
      y
        .option('problem', { type: 'string', describe: 'Problem statement (required)' })
        .option('techniques', {
          type: 'string',
          describe: 'Comma-separated technique ids (e.g. six_hats,scamper)',
        })
        .option('objectives', { type: 'string', describe: 'Comma-separated objectives' })
        .option('constraints', { type: 'string', describe: 'Comma-separated constraints' })
        .option('timeframe', {
          type: 'string',
          choices: ['quick', 'thorough', 'comprehensive'],
        })
        .option('strictness', {
          type: 'string',
          describe:
            "Gate strictness ('advisory' is the only implemented level; 'enforcing' reserved). Echoed on the plan.",
        })
        .option('include-options', { type: 'boolean' })
        .option('session-id', { type: 'string' })
        .option('execution-mode', {
          type: 'string',
          choices: ['sequential', 'parallel', 'auto'],
          describe:
            'Client preference for executing the resulting graph. Server still emits a DAG either way.',
        })
        .option('max-parallelism', { type: 'number' })
        .option('parallelization-strategy', {
          type: 'string',
          choices: ['technique', 'step', 'hybrid'],
        })
        .option('persona', { type: 'string' })
        .option('personas', { type: 'string', describe: 'Comma-separated personas for debate' })
        .option('debate-format', {
          type: 'string',
          choices: ['structured', 'adversarial', 'collaborative'],
        })
        .epilogue(
          'Output: plan JSON including planId, totalSteps, workflow per technique, and ' +
            'executionGraph.parallelizableGroups for parallel execution.'
        ),
    handle
  );
}

async function handle(argv: ArgumentsCamelCase<PlanArgs>): Promise<void> {
  const stdin = await readStdinJSON();
  const input = mergeInput(
    {
      problem: argv.problem,
      techniques: parseList(argv.techniques),
      objectives: parseList(argv.objectives),
      constraints: parseList(argv.constraints),
      timeframe: argv.timeframe,
      strictness: argv.strictness,
      includeOptions: argv.includeOptions,
      sessionId: argv.sessionId,
      executionMode: argv.executionMode,
      maxParallelism: parseNumber(argv.maxParallelism),
      parallelizationStrategy: argv.parallelizationStrategy,
      persona: argv.persona,
      personas: parseList(argv.personas),
      debateFormat: argv.debateFormat,
    },
    stdin
  );

  const server = getServer();
  const envelope = server.planThinkingSession(input);
  const { data, isError } = unwrapResponse(envelope);
  if (!isError) {
    const planId = (data as { planId?: string }).planId;
    persistPlan(server, planId);
  }
  emit(data, isError);
}
