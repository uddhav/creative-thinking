#!/usr/bin/env node

/**
 * Demonstration of parallel execution capability
 * Shows how the server handles parallel planning and concurrent execution
 */

const { spawn } = require('child_process');
const path = require('path');

async function sendRequest(server, request, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request ${request.id} timed out after ${timeout}ms`));
    }, timeout);

    let buffer = '';
    const listener = data => {
      buffer += data.toString();
      const lines = buffer.split('\n');

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line) {
          try {
            const response = JSON.parse(line);
            if (response.id === request.id) {
              clearTimeout(timer);
              server.stdout.removeListener('data', listener);
              resolve(response);
              return;
            }
          } catch {
            // Not JSON, ignore
          }
        }
      }
      buffer = lines[lines.length - 1];
    };

    server.stdout.on('data', listener);
    server.stdin.write(JSON.stringify(request) + '\n');
  });
}

async function runDemo() {
  console.log('🚀 Parallel Execution Capability Demo\n');
  console.log('This demo shows how the Creative Thinking server supports parallel execution.\n');

  const serverPath = path.join(__dirname, 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' },
  });

  // Suppress stderr output
  server.stderr.on('data', () => {});

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // Step 1: Discovery
    console.log('📊 Step 1: Discovering suitable techniques...');
    const discovery = await sendRequest(server, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'discover_techniques',
        arguments: {
          problem: 'How to improve team collaboration while reducing costs',
        },
      },
      id: 1,
    });

    const discoverResult = JSON.parse(discovery.result.content[0].text);
    console.log(`✅ Found ${discoverResult.recommendations.length} suitable techniques\n`);

    // Step 2: Planning with parallel execution
    console.log('📋 Step 2: Creating parallel execution plan...');
    const planning = await sendRequest(server, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'plan_thinking_session',
        arguments: {
          problem: 'How to improve team collaboration while reducing costs',
          techniques: ['six_hats', 'scamper', 'random_entry'],
          executionMode: 'parallel',
        },
      },
      id: 2,
    });

    const planResult = JSON.parse(planning.result.content[0].text);
    const planId = planResult.planId;

    console.log(`✅ Created plan: ${planId}`);
    console.log(`   Execution mode: ${planResult.executionMode || 'sequential'}`);

    if (planResult.parallelExecutionGroups) {
      console.log(`   Parallel groups: ${planResult.parallelExecutionGroups.length}`);
      planResult.parallelExecutionGroups.forEach(group => {
        console.log(`     Group ${group.groupNumber}: ${group.techniques.join(', ')}`);
        console.log(`       Can run in parallel: ${group.canRunInParallel}`);
      });
    }
    console.log('');

    // Step 3: Execute techniques in parallel
    console.log('⚡ Step 3: Executing techniques in parallel...');
    console.log('   Sending 3 concurrent execution requests...\n');

    // Send three execution requests concurrently
    const execPromises = [
      sendRequest(server, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'execute_thinking_step',
          arguments: {
            planId,
            technique: 'six_hats',
            problem: 'How to improve team collaboration while reducing costs',
            currentStep: 1,
            totalSteps: 6,
            hatColor: 'blue',
            output: 'Blue Hat: Managing the thinking process for collaboration improvement',
            nextStepNeeded: true,
          },
        },
        id: 3,
      }),
      sendRequest(server, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'execute_thinking_step',
          arguments: {
            planId,
            technique: 'scamper',
            problem: 'How to improve team collaboration while reducing costs',
            currentStep: 1,
            totalSteps: 8,
            scamperAction: 'substitute',
            output: 'Substitute: Replace meetings with async communication tools',
            nextStepNeeded: true,
          },
        },
        id: 4,
      }),
      sendRequest(server, {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'execute_thinking_step',
          arguments: {
            planId,
            technique: 'random_entry',
            problem: 'How to improve team collaboration while reducing costs',
            currentStep: 1,
            totalSteps: 3,
            randomStimulus: 'coffee machine',
            output: 'Random Entry: Coffee machine as collaboration catalyst',
            nextStepNeeded: true,
          },
        },
        id: 5,
      }),
    ];

    // Wait for all to complete
    const startTime = Date.now();
    const results = await Promise.all(execPromises);
    const duration = Date.now() - startTime;

    // Process results
    console.log(`✅ All 3 techniques executed in parallel in ${duration}ms\n`);

    results.forEach((result, idx) => {
      const parsed = JSON.parse(result.result.content[0].text);
      console.log(`   ${idx + 1}. ${parsed.technique}:`);
      console.log(`      Step: ${parsed.currentStep}/${parsed.totalSteps}`);
      console.log(`      Next needed: ${parsed.nextStepNeeded}`);
    });

    console.log('\n🎉 Demo completed successfully!');
    console.log('\n📝 Key Points:');
    console.log('   • The server identified techniques that can run in parallel');
    console.log('   • Created execution groups for parallel processing');
    console.log('   • Handled 3 concurrent execution requests efficiently');
    console.log('   • Each technique maintains its own state and progress');
    console.log("\n💡 In production, LLMs using Anthropic's parallel tool call feature");
    console.log('   would send these requests in a single batch for optimal performance.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    server.kill();
    process.exit(0);
  }
}

runDemo().catch(console.error);
