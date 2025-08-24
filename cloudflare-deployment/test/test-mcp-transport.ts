#!/usr/bin/env npx tsx
/**
 * Test MCP client for verifying transport fallback functionality
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const SERVER_URL = process.env.SERVER_URL || 'https://socketes.munshy.app';
const CLIENT_ID = process.env.CLIENT_ID || 'AZylqSElUQXkOElI';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '6BjIG4tYKdOQLDzljcWAAm0rmqBxntIk';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

async function getAccessToken(): Promise<string> {
  log.info('Getting access token...');

  const response = await fetch(`${SERVER_URL}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'read write execute',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get token: ${error}`);
  }

  const data = (await response.json()) as { access_token: string };
  log.success(`Got access token: ${data.access_token.substring(0, 20)}...`);
  return data.access_token;
}

async function testTransport(endpoint: string, transportType: 'streamable-http' | 'sse') {
  log.header(`Testing ${transportType} transport at ${endpoint}`);

  const accessToken = await getAccessToken();
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  let transport;
  const url = new URL(endpoint, SERVER_URL);

  try {
    if (transportType === 'streamable-http') {
      log.info('Creating StreamableHTTPClientTransport...');
      transport = new StreamableHTTPClientTransport(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      log.info('Creating SSEClientTransport...');
      transport = new SSEClientTransport(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    log.info('Connecting to server...');
    await client.connect(transport);
    log.success('Successfully connected!');

    // List available tools
    log.info('Listing available tools...');
    const tools = await client.listTools();
    log.success(`Found ${tools.tools.length} tools:`);
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description?.substring(0, 50)}...`);
    });

    // Test discover_techniques tool
    log.info('Testing discover_techniques tool...');
    const result = await client.callTool('discover_techniques', {
      problem: 'How to improve team creativity in remote work environments?',
    });

    if (result.isError) {
      log.error(`Tool call failed: ${JSON.stringify(result.content, null, 2)}`);
    } else {
      log.success('Tool call succeeded!');
      const recommendations = (result.content as any).recommendations;
      if (recommendations && recommendations.length > 0) {
        console.log(
          `  Recommended techniques: ${recommendations
            .slice(0, 3)
            .map((r: any) => r.name)
            .join(', ')}`
        );
      }
    }

    await client.close();
    log.success(`${transportType} transport test completed successfully!`);
    return true;
  } catch (error) {
    log.error(`${transportType} transport test failed: ${error}`);
    if (client) {
      try {
        await client.close();
      } catch {}
    }
    return false;
  }
}

async function testAutoFallback() {
  log.header('Testing auto-fallback at /mcp endpoint');

  const accessToken = await getAccessToken();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const url = new URL('/mcp', SERVER_URL);

  try {
    // First try streamable HTTP
    log.info('Attempting StreamableHTTPClientTransport...');
    let transport = new StreamableHTTPClientTransport(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    try {
      await client.connect(transport);
      log.success('Connected with StreamableHTTP!');
    } catch (e) {
      const error = e as Error;
      if (error.message.includes('404') || error.message.includes('405')) {
        log.warn('StreamableHTTP not supported, falling back to SSE...');

        // Fallback to SSE
        transport = new SSEClientTransport(url.toString(), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        await client.connect(transport);
        log.success('Connected with SSE fallback!');
      } else {
        throw e;
      }
    }

    // Test a tool call
    log.info('Testing tool call...');
    const tools = await client.listTools();
    log.success(`Found ${tools.tools.length} tools`);

    await client.close();
    log.success('Auto-fallback test completed successfully!');
    return true;
  } catch (error) {
    log.error(`Auto-fallback test failed: ${error}`);
    return false;
  }
}

async function main() {
  console.log(colors.bright + '\n🧪 MCP Transport Test Suite\n' + colors.reset);
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Client ID: ${CLIENT_ID}\n`);

  let allPassed = true;

  // Test auto-fallback endpoint
  if (!(await testAutoFallback())) {
    allPassed = false;
  }

  // Test SSE-only endpoint
  if (!(await testTransport('/sse', 'sse'))) {
    allPassed = false;
  }

  // Test streamable HTTP directly at /mcp
  if (!(await testTransport('/mcp', 'streamable-http'))) {
    allPassed = false;
  }

  console.log('\n' + colors.bright + '📊 Test Results' + colors.reset);
  if (allPassed) {
    console.log(colors.green + '✓ All tests passed!' + colors.reset);
    process.exit(0);
  } else {
    console.log(colors.red + '✗ Some tests failed' + colors.reset);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
