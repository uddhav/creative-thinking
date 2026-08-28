import { getServer } from '../server.js';
import { emit, mergeInput, parseNumber, readStdinJSON, unwrapResponse } from '../io.js';
import { hydratePlan } from '../planStore.js';
export function registerExecute(yargs) {
    return yargs.command('execute', 'Run a single step of a planned thinking session', y => y
        .option('plan', { type: 'string', describe: 'planId from `socketes plan` (required)' })
        .option('session', { type: 'string', describe: 'sessionId; omit on first step' })
        .option('technique', {
        type: 'string',
        describe: 'Technique id for this node (e.g. six_hats)',
    })
        .option('problem', {
        type: 'string',
        describe: 'Problem statement; resolved from --plan when omitted',
    })
        .option('step', { type: 'number', describe: 'Current step number (1-indexed)' })
        .option('total-steps', { type: 'number', describe: 'Total steps in this technique' })
        .option('numbering', {
        type: 'string',
        choices: ['technique', 'plan'],
        describe: 'How --step is counted: within the technique (default) or across the plan',
    })
        .option('output', { type: 'string', describe: "The LLM's thinking for this step" })
        .option('next-step-needed', {
        type: 'boolean',
        default: undefined,
        describe: 'Whether more steps follow. Required on every step — there is no default. Pass it while steps remain, and --no-next-step-needed on the last one.',
    })
        .option('no-auto-save', {
        type: 'boolean',
        default: false,
        describe: 'Skip per-step persistence (default: auto-save is on)',
    })
        .option('persona', {
        type: 'string',
        describe: 'Speaking persona id (debate mode only)',
    })
        .option('verbosity', {
        type: 'string',
        choices: ['minimal', 'full'],
        describe: "Response size: 'minimal' = ack + steering + warnings/verdicts, no input echoes (intended future default); 'full' = current shape (default)",
    })
        .epilogue('Reads a JSON object on stdin if piped; flags override stdin fields.\n' +
        'Long-tail technique fields (hatColor, scamperAction, risks, etc.) are easiest to pass on stdin.\n\n' +
        'Parallelism: independent invocations against different sessionIds run concurrently.\n' +
        'Concurrent invocations against the SAME sessionId are last-writer-wins — coordinate from the client.'), handle);
}
async function handle(argv) {
    const stdin = await readStdinJSON();
    const input = mergeInput({
        planId: argv.plan,
        sessionId: argv.session,
        technique: argv.technique,
        problem: argv.problem,
        currentStep: parseNumber(argv.step),
        totalSteps: parseNumber(argv.totalSteps),
        numbering: argv.numbering,
        output: argv.output,
        nextStepNeeded: argv.nextStepNeeded,
        autoSave: argv.noAutoSave ? false : true,
        persona: argv.persona,
        verbosity: argv.verbosity,
    }, stdin);
    const server = getServer();
    const planId = input.planId;
    const sessionId = input.sessionId;
    if (planId)
        hydratePlan(server, planId);
    if (sessionId)
        await hydrateSession(server, sessionId);
    const envelope = await server.executeThinkingStep(input);
    const { data, isError } = unwrapResponse(envelope);
    emit(data, isError);
}
async function hydrateSession(server, sessionId) {
    const sm = server.getSessionManager();
    if (sm.getSession(sessionId))
        return;
    try {
        await sm.loadSessionFromPersistence(sessionId);
    }
    catch {
        // Session not on disk — let the execution validator handle it
        // (either it'll create a fresh one or surface a clear error).
    }
}
//# sourceMappingURL=execute.js.map