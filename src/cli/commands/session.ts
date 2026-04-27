import type { Argv, ArgumentsCamelCase } from 'yargs';
import { getServer } from '../server.js';
import { emit, mergeInput, parseList, parseNumber, readStdinJSON, unwrapResponse } from '../io.js';

type SessionOp = 'save' | 'load' | 'list' | 'delete' | 'export';

interface SessionArgs {
  // shared
  sessionId?: string;
  // save
  name?: string;
  tags?: string;
  asTemplate?: boolean;
  // load
  continueFrom?: number | string;
  // list
  limit?: number | string;
  technique?: string;
  status?: string;
  searchTerm?: string;
  // delete
  confirm?: boolean;
  // export
  format?: string;
  outputPath?: string;
}

export function registerSession(yargs: Argv): Argv {
  return yargs.command(
    'session <op>',
    'Manage stored sessions on the local filesystem',
    y =>
      y
        .positional('op', {
          choices: ['save', 'load', 'list', 'delete', 'export'] as const,
          describe: 'Session operation',
        })
        .option('session-id', { type: 'string' })
        .option('name', { type: 'string', describe: 'Save: human-readable label' })
        .option('tags', { type: 'string', describe: 'Save: comma-separated tags' })
        .option('as-template', { type: 'boolean' })
        .option('continue-from', { type: 'number' })
        .option('limit', { type: 'number' })
        .option('technique', { type: 'string' })
        .option('status', { type: 'string', choices: ['active', 'completed', 'all'] })
        .option('search-term', { type: 'string' })
        .option('confirm', { type: 'boolean' })
        .option('format', { type: 'string', choices: ['json', 'markdown', 'csv'] })
        .option('output-path', { type: 'string' })
        .epilogue(
          'Examples:\n' +
            '  socketes session list --status active --limit 20\n' +
            '  socketes session save --session-id sess_123 --name "Strategy Q3" --tags strategy,q3\n' +
            '  socketes session export --session-id sess_123 --format markdown'
        ),
    handle
  );
}

async function handle(argv: ArgumentsCamelCase<SessionArgs & { op: SessionOp }>): Promise<void> {
  const stdin = await readStdinJSON();
  const op = argv.op;

  const optionsBlock: Record<string, unknown> = {};
  switch (op) {
    case 'save':
      optionsBlock.saveOptions = {
        sessionName: argv.name,
        tags: parseList(argv.tags),
        asTemplate: argv.asTemplate,
      };
      break;
    case 'load':
      optionsBlock.loadOptions = {
        sessionId: argv.sessionId,
        continueFrom: parseNumber(argv.continueFrom),
      };
      break;
    case 'list':
      optionsBlock.listOptions = {
        limit: parseNumber(argv.limit),
        technique: argv.technique,
        status: argv.status,
        searchTerm: argv.searchTerm,
      };
      break;
    case 'delete':
      optionsBlock.deleteOptions = {
        sessionId: argv.sessionId,
        confirm: argv.confirm,
      };
      break;
    case 'export':
      optionsBlock.exportOptions = {
        sessionId: argv.sessionId,
        format: argv.format,
        outputPath: argv.outputPath,
      };
      break;
  }

  const input = mergeInput({ sessionOperation: op, ...optionsBlock }, stdin);

  const server = getServer();
  const envelope = await server.executeThinkingStep(input);
  const { data, isError } = unwrapResponse(envelope);
  emit(data, isError);
}
