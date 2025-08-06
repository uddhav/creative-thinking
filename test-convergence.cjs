#!/usr/bin/env node

// Test that convergence technique can be executed
const { spawn } = require('child_process');
const readline = require('readline');

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

const rl = readline.createInterface({
  input: server.stdout,
  crlfDelay: Infinity
});

let requestId = 1;

function sendRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  };
  
  console.error('Sending:', JSON.stringify(request, null, 2));
  server.stdin.write(JSON.stringify(request) + '\n');
}

rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    console.error('Response:', JSON.stringify(response, null, 2));
    
    if (response.id === 1) {
      // After discovery, send plan request
      sendRequest('tools/call', {
        name: 'plan_thinking_session',
        arguments: {
          problem: 'Test problem',
          techniques: ['six_hats', 'scamper'] // Multiple for potential parallel
        }
      });
    } else if (response.id === 2) {
      // After planning, try convergence
      const content = response.result?.content?.[0]?.text;
      if (content) {
        const parsed = JSON.parse(content);
        const planId = parsed.planId;
        
        if (planId) {
          console.error('Got planId:', planId);
          
          // Try to execute convergence technique (even though not in plan)
          sendRequest('tools/call', {
            name: 'execute_thinking_step',
            arguments: {
              planId: planId,
              technique: 'convergence',
              problem: 'Test problem',
              currentStep: 1,
              totalSteps: 1,
              output: 'Synthesizing results from parallel execution',
              nextStepNeeded: false,
              sessionId: 'convergence-test-' + Date.now(),
              convergenceStrategy: 'merge',
              parallelResults: [
                {
                  planId: planId,
                  technique: 'six_hats',
                  insights: ['Test insight 1 from six_hats'],
                  results: { someData: 'test' },
                  metrics: { executionTime: 100, confidence: 0.8 }
                },
                {
                  planId: planId,
                  technique: 'scamper',
                  insights: ['Test insight 2 from scamper'],
                  results: { otherData: 'test' },
                  metrics: { executionTime: 150, confidence: 0.7 }
                }
              ]
            }
          });
        }
      }
    } else if (response.id === 3) {
      // Check convergence response
      console.error('\n=== CONVERGENCE RESPONSE ===');
      const content = response.result?.content?.[0]?.text;
      if (content) {
        // Check if it's an error or success
        if (content.includes('Invalid technique') || content.includes('error')) {
          console.error('FAILED: Convergence was rejected');
          console.error('Error content:', content.substring(0, 200));
          process.exit(1);
        } else {
          const parsed = JSON.parse(content);
          if (parsed.technique === 'convergence') {
            console.error('SUCCESS: Convergence technique was accepted!');
            console.error('Response has technique:', parsed.technique);
          } else {
            console.error('UNEXPECTED: Response technique is', parsed.technique);
          }
        }
      }
      
      process.exit(0);
    }
  } catch (error) {
    console.error('Error parsing response:', error.message);
  }
});

server.stderr.on('data', () => {
  // Ignore stderr output for this test
});

// Start with discovery
setTimeout(() => {
  sendRequest('tools/call', {
    name: 'discover_techniques',
    arguments: {
      problem: 'Test problem'
    }
  });
}, 100);

// Timeout after 5 seconds
setTimeout(() => {
  console.error('Test timed out');
  process.exit(1);
}, 5000);