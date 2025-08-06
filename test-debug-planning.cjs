const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env },
});

// Show all stderr
server.stderr.on('data', data => {
  console.error('[Server Error]:', data.toString().trim());
});

// Simple request handler
function sendAndWait(request) {
  console.log('Sending:', request.params.name);
  server.stdin.write(JSON.stringify(request) + '\n');
}

let buffer = '';
server.stdout.on('data', data => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const response = JSON.parse(line);
        console.log('Got response for ID', response.id);
        if (response.error) {
          console.log('Error:', response.error);
        } else if (response.result) {
          const text = response.result.content[0].text;
          const parsed = JSON.parse(text);
          if (response.id === 2) {
            console.log('Planning succeeded!');
            console.log('Plan ID:', parsed.planId);
            console.log('Execution Mode:', parsed.executionMode);
            process.exit(0);
          }
        }
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    }
  }
  buffer = lines[lines.length - 1];
});

// Wait for server start
setTimeout(() => {
  // Test 1: Discovery
  sendAndWait({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'discover_techniques',
      arguments: {
        problem: 'How to improve team collaboration',
      },
    },
    id: 1,
  });

  // Test 2: Planning after a delay
  setTimeout(() => {
    sendAndWait({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'plan_thinking_session',
        arguments: {
          problem: 'How to improve team collaboration',
          techniques: ['six_hats', 'scamper'],
          executionMode: 'parallel',
        },
      },
      id: 2,
    });
  }, 2000);
}, 1000);

// Timeout safety
setTimeout(() => {
  console.log('Test timed out');
  server.kill();
  process.exit(1);
}, 15000);
