import { getServer } from '../server.js';
import { emit, mergeInput, parseList, parseNumber, readStdinJSON, unwrapResponse } from '../io.js';
export function registerDiscover(yargs) {
    return yargs.command('discover', 'Analyze a problem and recommend thinking techniques', y => y
        .option('problem', { type: 'string', describe: 'Problem statement (required)' })
        .option('context', { type: 'string', describe: 'Additional context' })
        .option('preferred-outcome', {
        type: 'string',
        choices: ['innovative', 'systematic', 'risk-aware', 'collaborative', 'analytical'],
        describe: 'Bias the recommendation toward an outcome flavor',
    })
        .option('constraints', {
        type: 'string',
        describe: 'Comma-separated list of constraints',
    })
        .option('current-flexibility', {
        type: 'number',
        describe: 'Current flexibility score 0–1 (lower = more locked in)',
    })
        .option('session-id', { type: 'string', describe: 'Reuse a known session id' })
        .option('execution-mode', {
        type: 'string',
        choices: ['sequential', 'parallel', 'auto'],
    })
        .option('max-parallelism', { type: 'number' })
        .option('persona', { type: 'string', describe: 'Single-persona bias (e.g. rich_hickey)' })
        .option('personas', {
        type: 'string',
        describe: 'Comma-separated personas for debate mode',
    })
        .option('debate-topic', { type: 'string' })
        .epilogue('Reads a JSON object on stdin if piped; flags override stdin fields.\n' +
        'Output: discovery JSON (recommendations, problemAnalysis, executionGraph hints).'), handle);
}
async function handle(argv) {
    const stdin = await readStdinJSON();
    const input = mergeInput({
        problem: argv.problem,
        context: argv.context,
        preferredOutcome: argv.preferredOutcome,
        constraints: parseList(argv.constraints),
        currentFlexibility: parseNumber(argv.currentFlexibility),
        sessionId: argv.sessionId,
        executionMode: argv.executionMode,
        maxParallelism: parseNumber(argv.maxParallelism),
        persona: argv.persona,
        personas: parseList(argv.personas),
        debateTopic: argv.debateTopic,
    }, stdin);
    const server = getServer();
    const envelope = server.discoverTechniques(input);
    const { data, isError } = unwrapResponse(envelope);
    emit(data, isError);
}
//# sourceMappingURL=discover.js.map