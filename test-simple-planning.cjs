const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env },
});

setTimeout(() => {
  // Discovery
  server.stdin.write(
    JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'discover_techniques',
        arguments: { problem: 'test problem' },
      },
      id: 1,
    }) + '\n'
  );

  setTimeout(() => {
    // Planning WITH executionMode
    console.log('Sending planning request with executionMode: parallel');
    server.stdin.write(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'plan_thinking_session',
          arguments: {
            problem: 'test problem',
            techniques: ['six_hats'],
            executionMode: 'parallel',
          },
        },
        id: 2,
      }) + '\n'
    );
  }, 1000);
}, 1000);

let buffer = '';
server.stdout.on('data', data => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const response = JSON.parse(line);
        console.log('Response ' + response.id + ': ' + (response.result ? 'SUCCESS' : 'ERROR'));
        if (response.error) {
          console.log('Error:', response.error);
        }
        if (response.id === 2) {
          if (response.result) {
            const result = JSON.parse(response.result.content[0].text);
            console.log('Plan ID:', result.planId);
            console.log('Execution Mode:', result.executionMode);
          }
          server.kill();
          process.exit(0);
        }
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    }
  }
  buffer = lines[lines.length - 1];
});

setTimeout(() => {
  console.log('Timeout - no response received');
  server.kill();
  process.exit(1);
}, 10000);
