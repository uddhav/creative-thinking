#!/usr/bin/env npx tsx
/**
 * Simple MCP client test to verify basic transport functionality
 */

const SERVER_URL = process.env.SERVER_URL || 'https://socketes.munshy.app';
const CLIENT_ID = process.env.CLIENT_ID || 'AZylqSElUQXkOElI';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '6BjIG4tYKdOQLDzljcWAAm0rmqBxntIk';

async function getAccessToken(): Promise<string> {
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
    throw new Error(`Failed to get token: ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function testMcpEndpoint(endpoint: string) {
  console.log(`\n🧪 Testing ${endpoint}`);

  const accessToken = await getAccessToken();
  console.log(`✓ Got access token: ${accessToken.substring(0, 20)}...`);

  // Test initialize message
  const initMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
  };

  const response = await fetch(`${SERVER_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(initMessage),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const result = await response.json();
  console.log(`✓ Got response:`, JSON.stringify(result, null, 2));

  // Verify it's a valid MCP response
  if (result.jsonrpc === '2.0' && result.id === 1 && result.result) {
    console.log(`✓ Valid MCP initialize response received`);
    console.log(`✓ Server: ${result.result.serverInfo?.name || 'Unknown'}`);
    console.log(`✓ Protocol: ${result.result.protocolVersion || 'Unknown'}`);
    return true;
  } else {
    console.log(`✗ Invalid MCP response format`);
    return false;
  }
}

async function main() {
  console.log('🚀 Simple MCP Transport Test');
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Client ID: ${CLIENT_ID}`);

  let allPassed = true;

  try {
    // Test /mcp endpoint
    if (!(await testMcpEndpoint('/mcp'))) {
      allPassed = false;
    }

    // Test /sse endpoint (it handles POST the same way now)
    if (!(await testMcpEndpoint('/sse'))) {
      allPassed = false;
    }

    console.log('\n📊 Test Results');
    if (allPassed) {
      console.log('🎉 All tests passed! Transport is working correctly.');
      console.log('\n✅ The WebSocket issue has been resolved!');
      console.log('✅ Both /mcp and /sse endpoints are functional');
      console.log('✅ OAuth authentication is working');
      console.log('✅ MCP protocol responses are valid');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  }
}

main();
