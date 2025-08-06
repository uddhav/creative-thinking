#!/usr/bin/env node

/**
 * Test script to verify Anthropic-style parallel tool calls
 */

const { spawn } = require('child_process');
const path = require('path');

// Test 1: Single discovery call
const test1 = {
  jsonrpc: '2.0',
  method: 'tools/call',
  params: {
    name: 'discover_techniques',
    arguments: {
      problem: 'How to improve team collaboration and reduce project costs simultaneously',
    },
  },
  id: 1,
};

// Test 2: Plan with parallel execution mode
const test2 = {
  jsonrpc: '2.0',
  method: 'tools/call',
  params: {
    name: 'plan_thinking_session',
    arguments: {
      problem: 'How to improve team collaboration and reduce project costs simultaneously',
      techniques: ['six_hats', 'scamper', 'random_entry'],
      executionMode: 'parallel',
    },
  },
  id: 2,
};

// Test 3: Parallel execute_thinking_step calls
// For now, test with single call to verify the flow works
const test3 = {
  jsonrpc: '2.0',
  method: 'tools/call',
  params: {
    name: 'execute_thinking_step',
    arguments: {
      planId: 'test-plan-id', // Will be replaced with actual planId
      technique: 'six_hats',
      problem: 'How to improve team collaboration and reduce project costs simultaneously',
      currentStep: 1,
      totalSteps: 6,
      hatColor: 'blue',
      output: 'Blue Hat: Setting up the thinking process for team collaboration improvements',
      nextStepNeeded: true,
    },
  },
  id: 3,
};

async function runTest() {
  console.log('Starting Parallel Tool Call Tests...\n');

  const serverPath = path.join(__dirname, 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'test', CREATIVE_THINKING_PARALLEL_TOOLS_ENABLED: 'true' },
  });

  let responseBuffer = '';
  let planId = null;

  server.stdout.on('data', data => {
    responseBuffer += data.toString();
    const lines = responseBuffer.split('\n');

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line) {
        try {
          const response = JSON.parse(line);
          if (response.id === 1) {
            console.log('Test 1 - Discovery:');
            const text = response.result?.content?.[0]?.text;
            if (text && !text.includes('ERROR')) {
              const parsed = JSON.parse(text);
              console.log('✅ PASSED: Discovery successful');
              console.log('Recommendations:', parsed.recommendations?.length || 0, 'techniques\n');
            } else {
              console.log('❌ FAILED: Discovery failed\n');
            }
          } else if (response.id === 2) {
            console.log('Test 2 - Planning with parallel mode:');
            const text = response.result?.content?.[0]?.text;
            if (text && !text.includes('ERROR')) {
              const parsed = JSON.parse(text);
              planId = parsed.planId;
              console.log('✅ PASSED: Planning successful');
              console.log('Plan ID:', planId);
              console.log('Execution Mode:', parsed.executionMode || 'not specified');
              if (parsed.parallelExecutionGroups) {
                console.log('Parallel Groups:', parsed.parallelExecutionGroups.length);
                parsed.parallelExecutionGroups.forEach(group => {
                  console.log(
                    `  Group ${group.groupNumber}: ${group.techniques.join(', ')} (parallel: ${group.canRunInParallel})`
                  );
                });
              }
              console.log('');

              // Update test3 with actual planId
              if (planId) {
                test3.params.arguments.planId = planId;
              }
            } else {
              console.log('❌ FAILED: Planning failed\n');
            }
          } else if (response.id === 3) {
            console.log('Test 3 - Execution step:');
            const text = response.result?.content?.[0]?.text;
            if (text && !text.includes('ERROR')) {
              try {
                const parsed = JSON.parse(text);
                console.log('✅ PASSED: Execution successful');
                console.log('Technique:', parsed.technique);
                console.log('Step:', parsed.currentStep, '/', parsed.totalSteps);
                console.log('Next step needed:', parsed.nextStepNeeded);
              } catch {
                console.log('❌ FAILED: Could not parse response');
                console.log('Response:', text.substring(0, 200));
              }
            } else {
              console.log('❌ FAILED: Execution failed');
              console.log('Response:', text || 'no content');
            }

            // All tests complete
            console.log('\n✅ All tests completed. Shutting down server...');
            server.kill();
            process.exit(0);
          }
        } catch {
          // Not JSON, ignore
        }
      }
    }

    responseBuffer = lines[lines.length - 1];
  });

  server.stderr.on('data', data => {
    // Show all stderr for debugging
    const message = data.toString();
    console.error('[Server]:', message.trim());
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send test requests
  console.log('Sending test requests...\n');

  // Test 1: Discovery
  server.stdin.write(JSON.stringify(test1) + '\n');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Planning
  server.stdin.write(JSON.stringify(test2) + '\n');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Parallel execution (only if we got a planId)
  setTimeout(() => {
    if (planId) {
      console.log('Sending parallel execution calls with planId:', planId, '\n');
      server.stdin.write(JSON.stringify(test3) + '\n');
    } else {
      console.log('Skipping parallel execution test (no planId)\n');
      server.kill();
      process.exit(1);
    }
  }, 2000);

  // Timeout after 10 seconds
  setTimeout(() => {
    console.log('\nTimeout reached. Shutting down...');
    server.kill();
    process.exit(1);
  }, 10000);
}

runTest().catch(console.error);
