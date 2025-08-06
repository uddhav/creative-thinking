/**
 * MCP Protocol Compliance Test
 * Ensures the server only outputs valid JSON-RPC to stdout
 * No console.log or process.stdout.write should be used for debugging
 * All debug/log output must go to stderr
 *
 * Updated to use the official MCP Client from @modelcontextprotocol/sdk
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('MCP Protocol Compliance', () => {
  let serverProcess: ChildProcess;
  let stdoutData: string[] = [];
  let stderrData: string[] = [];

  beforeEach(() => {
    stdoutData = [];
    stderrData = [];
  });

  afterEach(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
  });

  it('should only output valid JSON-RPC to stdout (no console.log pollution)', async () => {
    const serverPath = path.join(__dirname, '../../../dist/index.js');

    // Start the server directly to capture stdout/stderr
    serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Collect stdout data
    serverProcess.stdout?.on('data', data => {
      stdoutData.push(data.toString());
    });

    // Collect stderr data
    serverProcess.stderr?.on('data', data => {
      stderrData.push(data.toString());
    });

    // We need to manually write to stdin for the initial connection
    // since we're testing the raw protocol output
    const initializeRequest =
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '1.0.0',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      }) + '\n';

    serverProcess.stdin?.write(initializeRequest);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send a tools/list request
    const toolsListRequest =
      JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      }) + '\n';

    serverProcess.stdin?.write(toolsListRequest);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Now use the client to make some calls
    const toolCallRequest =
      JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'discover_techniques',
          arguments: {
            problem: 'Test problem',
          },
        },
      }) + '\n';

    serverProcess.stdin?.write(toolCallRequest);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify stdout only contains valid JSON-RPC
    const allStdout = stdoutData.join('');
    const stdoutLines = allStdout.split('\n').filter(line => line.trim());

    expect(stdoutLines.length).toBeGreaterThan(0);

    stdoutLines.forEach(line => {
      if (line) {
        // Should be valid JSON
        let parsed;
        try {
          parsed = JSON.parse(line) as { jsonrpc?: string; id?: number };
        } catch {
          throw new Error(`Invalid JSON on stdout: ${line}`);
        }

        // Should be JSON-RPC format
        expect(parsed).toHaveProperty('jsonrpc', '2.0');

        // Should have either 'id' (for responses) or 'method' (for requests/notifications)
        const hasId = 'id' in parsed;
        const hasMethod = 'method' in parsed;
        expect(hasId || hasMethod).toBe(true);

        // Stdout should only contain JSON-RPC, no debug output
        // Check that it doesn't contain debug strings
        expect(line).not.toContain('console.log');
        expect(line).not.toContain('DEBUG');
        expect(line).not.toContain('Creative Thinking MCP server');
      }
    });

    // Server startup message should be on stderr
    const allStderr = stderrData.join('');
    expect(allStderr).toContain('Creative Thinking MCP server running on stdio');
  });

  it('should handle all 14 techniques using MCP Client', async () => {
    const serverPath = path.join(__dirname, '../../../dist/index.js');

    const techniques: Array<{ name: string; specificParams: Record<string, unknown> }> = [
      { name: 'six_hats', specificParams: { hatColor: 'blue' } },
      { name: 'po', specificParams: { provocation: 'What if gravity worked upwards?' } },
      { name: 'random_entry', specificParams: { randomStimulus: 'bicycle' } },
      { name: 'scamper', specificParams: { scamperAction: 'substitute' } },
      { name: 'concept_extraction', specificParams: { successExample: 'Amazon delivery' } },
      { name: 'yes_and', specificParams: { initialIdea: 'Solar panels on cars' } },
      { name: 'design_thinking', specificParams: { designStage: 'empathize' } },
      { name: 'triz', specificParams: { contradiction: 'Speed vs accuracy' } },
      { name: 'neural_state', specificParams: { dominantNetwork: 'dmn' } },
      { name: 'temporal_work', specificParams: { temporalLandscape: {} } },
      { name: 'cross_cultural', specificParams: { culturalFrameworks: ['Eastern', 'Western'] } },
      { name: 'collective_intel', specificParams: { wisdomSources: ['experts', 'crowds'] } },
      { name: 'disney_method', specificParams: { disneyRole: 'dreamer' } },
      {
        name: 'nine_windows',
        specificParams: { currentCell: { timeFrame: 'present', systemLevel: 'system' } },
      },
    ];

    for (const { name, specificParams } of techniques) {
      // Reset data collectors
      stdoutData = [];
      stderrData = [];

      // Start a fresh server for each technique
      serverProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          DISABLE_THOUGHT_LOGGING: 'true', // Disable visual output for speed
        },
      });

      // Collect stdout data
      serverProcess.stdout?.on('data', data => {
        stdoutData.push(data.toString());
      });

      // Collect stderr data
      serverProcess.stderr?.on('data', data => {
        stderrData.push(data.toString());
      });

      // Initialize
      const initializeRequest =
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '1.0.0',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0',
            },
          },
        }) + '\n';

      serverProcess.stdin?.write(initializeRequest);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create a plan
      const planRequest =
        JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'plan_thinking_session',
            arguments: {
              problem: `Testing ${name} technique`,
              techniques: [name],
            },
          },
        }) + '\n';

      serverProcess.stdin?.write(planRequest);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get planId
      const planResponse = stdoutData
        .join('')
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line) as { id?: number; result?: unknown })
        .find(msg => msg.id === 2);

      const planResult = planResponse?.result as { content?: Array<{ text?: string }> };
      const planText = planResult?.content?.[0]?.text || '{}';
      const planData = JSON.parse(planText) as { planId?: string };
      const planId = planData.planId;

      // Execute step
      const executeRequest =
        JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'execute_thinking_step',
            arguments: {
              planId,
              technique: name,
              problem: `Testing ${name} technique`,
              currentStep: 1,
              totalSteps: 3,
              output: `Testing output for ${name}`,
              nextStepNeeded: true,
              ...specificParams,
            },
          },
        }) + '\n';

      serverProcess.stdin?.write(executeRequest);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify stdout compliance for this technique
      try {
        // All stdout output should be valid JSON-RPC
        const allStdout = stdoutData.join('');
        const lines = allStdout.split('\n').filter(line => line.trim());

        lines.forEach(line => {
          if (line) {
            // Must parse as JSON (no console.log pollution)
            let parsed;
            try {
              parsed = JSON.parse(line) as { jsonrpc?: string };
            } catch {
              throw new Error(`Technique ${name}: Non-JSON output on stdout: ${line}`);
            }
            expect(parsed).toHaveProperty('jsonrpc', '2.0');
          }
        });
      } finally {
        // Clean up
        serverProcess.kill();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }, 30000); // 30 second timeout for all techniques
});
