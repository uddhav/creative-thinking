/**
 * Basic Usage Example
 *
 * Demonstrates how to use the Creative Thinking Client SDK
 */

import { CreativeThinkingClient } from '../CreativeThinkingClient.js';

async function main() {
  // Create client instance
  const client = new CreativeThinkingClient({
    serverUrl: 'https://creative-thinking.workers.dev',
    transport: 'http',
    auth: {
      type: 'api-key',
      credentials: {
        apiKey: 'your-api-key-here',
      },
    },
    enableStreaming: true,
    enableSampling: true,
    debug: true,
  });

  // Set up event handlers
  client.on('connect', () => {
    console.log('Connected to server');
  });

  client.on('error', error => {
    console.error('Client error:', error);
  });

  client.on('progress', event => {
    console.log(`Progress: ${event.operation} - ${event.percent.toFixed(1)}%`);
  });

  client.on('warning', (level, message) => {
    console.warn(`[${level}] ${message}`);
  });

  try {
    // Connect to server
    await client.connect();
    console.log('Client connected successfully');

    // ============= Discovery Phase =============
    console.log('\n=== Discovery Phase ===');

    const discovery = await client.discoverTechniques(
      'How can we improve team collaboration in remote work?',
      'Software development team of 10 people across 3 time zones',
      ['Limited budget', 'Different cultural backgrounds']
    );

    console.log('Problem Analysis:', discovery.analysis);
    console.log(
      'Recommended Techniques:',
      discovery.recommendations.techniques.map(t => t.name)
    );

    // ============= Planning Phase =============
    console.log('\n=== Planning Phase ===');

    const plan = await client.planThinkingSession(
      discovery.problem,
      ['six_hats', 'scamper', 'yes_and'],
      {
        objectives: ['Generate innovative solutions', 'Consider cultural differences'],
        timeframe: 'thorough',
        executionMode: 'sequential',
      }
    );

    console.log('Plan ID:', plan.planId);
    console.log('Workflow:', plan.workflow);

    // ============= Execution Phase =============
    console.log('\n=== Execution Phase ===');

    // Execute Six Thinking Hats
    let nextStepNeeded = true;
    let currentStep = 1;
    const totalSteps = 6; // Six hats

    while (nextStepNeeded && currentStep <= totalSteps) {
      const result = await client.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem: plan.problem,
        currentStep,
        totalSteps,
        output: `Thinking with ${getHatName(currentStep)} hat...`,
        nextStepNeeded: currentStep < totalSteps,
        hatColor: getHatColor(currentStep),
      });

      console.log(`Step ${currentStep}:`, result.output);

      nextStepNeeded = result.nextStepNeeded;
      currentStep++;
    }

    // ============= AI Enhancement (if available) =============
    const samplingCapability = await client.getSamplingCapability();

    if (samplingCapability.available) {
      console.log('\n=== AI Enhancement ===');

      // Enhance an idea
      const enhancedIdea = await client.enhanceIdea(
        'Create virtual coffee breaks with random team pairings',
        'Remote team collaboration',
        {
          style: 'innovative',
          depth: 'deep',
          addExamples: true,
          addRisks: true,
        }
      );

      console.log('Enhanced Idea:', enhancedIdea);

      // Generate variations
      const variations = await client.generateVariations(
        'Weekly team retrospectives',
        5,
        'diverse'
      );

      console.log('Variations:', variations);

      // Synthesize ideas
      const synthesis = await client.synthesizeIdeas(
        ['Virtual coffee breaks', 'Async documentation culture', 'Team rituals and ceremonies'],
        'Improve remote team cohesion'
      );

      console.log('Synthesized Solution:', synthesis);
    }

    // ============= Session Management =============
    console.log('\n=== Session Management ===');

    // Create a session
    const session = await client.createSession('Improving remote team collaboration', {
      team: 'Engineering',
      size: 10,
    });

    console.log('Session created:', session.id);

    // Subscribe to real-time updates
    if (client.getStreamingClient()) {
      client.subscribeToSession(session.id);
      console.log('Subscribed to session updates');
    }

    // ============= Resources =============
    console.log('\n=== Resources ===');

    const resources = await client.listResources();
    console.log('Available resources:', resources.length);

    if (resources.length > 0) {
      const firstResource = await client.readResource(resources[0].uri);
      console.log('First resource:', firstResource);
    }

    // ============= Metrics =============
    console.log('\n=== Client Metrics ===');
    const metrics = client.getMetrics();
    console.log('Requests:', metrics.requestCount);
    console.log(
      'Success rate:',
      ((metrics.successCount / metrics.requestCount) * 100).toFixed(1) + '%'
    );
    console.log('Average latency:', metrics.averageLatency.toFixed(0) + 'ms');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect
    await client.disconnect();
    console.log('\nDisconnected from server');
  }
}

// Helper functions
function getHatColor(step: number): string {
  const hats = ['white', 'red', 'black', 'yellow', 'green', 'blue'];
  return hats[step - 1] || 'white';
}

function getHatName(step: number): string {
  const names = [
    'White (Facts)',
    'Red (Emotions)',
    'Black (Caution)',
    'Yellow (Optimism)',
    'Green (Creativity)',
    'Blue (Process)',
  ];
  return names[step - 1] || 'Unknown';
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
