/**
 * ToolDefinitions - MCP tool definitions for the creative thinking server
 * Extracted from index.ts to improve maintainability
 */
export const DISCOVER_TECHNIQUES_TOOL = {
    name: 'discover_techniques',
    description: 'STEP 1 of 3: Analyzes a problem and recommends appropriate lateral thinking techniques. This is the FIRST tool you must call when starting any creative thinking session. Returns recommendations and available techniques that can be used in the next step. MANDATORY PARAMETER: You MUST provide the "problem" parameter as a string describing the challenge to solve. DO NOT call this with an empty object {}. Example: {"problem": "How to improve team communication"}. Valid techniques: six_hats, po, random_entry, scamper, concept_extraction, yes_and, design_thinking, triz, neural_state, temporal_work, cultural_integration, collective_intel, disney_method, nine_windows, quantum_superposition, temporal_creativity, paradoxical_problem, meta_learning, biomimetic_path, first_principles, neuro_computational, criteria_based_analysis, linguistic_forensics, competing_hypotheses, reverse_benchmarking, context_reframing, perception_optimization, anecdotal_signal, cognitive_bias_audit, latticework, keeper_test, steelman_red_team.',
    inputSchema: {
        type: 'object',
        properties: {
            problem: {
                type: 'string',
                description: 'REQUIRED: The problem or challenge to solve. This parameter is MANDATORY and must be a non-empty string.',
            },
            context: {
                type: 'string',
                description: 'Additional context about the situation',
            },
            preferredOutcome: {
                type: 'string',
                enum: ['innovative', 'systematic', 'risk-aware', 'collaborative', 'analytical'],
                description: 'The type of solution preferred',
            },
            constraints: {
                type: 'array',
                items: { type: 'string' },
                description: 'Any constraints or limitations to consider',
            },
            persona: {
                type: 'string',
                minLength: 1,
                maxLength: 200,
                description: 'Thinking personality (e.g., "rory_sutherland", "rich_hickey", "custom:Security-minded Rust engineer")',
            },
            personas: {
                type: 'array',
                items: { type: 'string', minLength: 1, maxLength: 200 },
                maxItems: 10,
                description: 'Team of personas for debate mode (max 10)',
            },
            debateTopic: {
                type: 'string',
                description: 'Specific debate topic (defaults to problem if not provided)',
            },
        },
        required: ['problem'],
    },
};
export const PLAN_THINKING_SESSION_TOOL = {
    name: 'plan_thinking_session',
    description: 'STEP 2 of 3: Creates a structured workflow for applying lateral thinking techniques. This tool MUST be called AFTER discover_techniques and BEFORE execute_thinking_step. Returns a planId that is REQUIRED for the execution step. MANDATORY PARAMETERS: "problem" (string) and "techniques" (array of strings). Valid techniques: six_hats, po, random_entry, scamper, concept_extraction, yes_and, design_thinking, triz, neural_state, temporal_work, cultural_integration, collective_intel, disney_method, nine_windows, quantum_superposition, temporal_creativity, paradoxical_problem, meta_learning, biomimetic_path, first_principles, neuro_computational, criteria_based_analysis, linguistic_forensics, competing_hypotheses, reverse_benchmarking, context_reframing, perception_optimization, anecdotal_signal, cognitive_bias_audit, latticework, keeper_test, steelman_red_team. Example: {"problem": "How to reduce costs", "techniques": ["six_hats", "scamper"]}',
    inputSchema: {
        type: 'object',
        properties: {
            problem: {
                type: 'string',
                description: 'REQUIRED: The problem to solve. Must match the problem from discover_techniques.',
            },
            techniques: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: [
                        'six_hats',
                        'po',
                        'random_entry',
                        'scamper',
                        'concept_extraction',
                        'yes_and',
                        'design_thinking',
                        'triz',
                        'neural_state',
                        'temporal_work',
                        'cultural_integration',
                        'collective_intel',
                        'disney_method',
                        'nine_windows',
                        'quantum_superposition',
                        'temporal_creativity',
                        'paradoxical_problem',
                        'meta_learning',
                        'biomimetic_path',
                        'first_principles',
                        'neuro_computational',
                        'criteria_based_analysis',
                        'linguistic_forensics',
                        'competing_hypotheses',
                        'reverse_benchmarking',
                        'context_reframing',
                        'perception_optimization',
                        'anecdotal_signal',
                        'cognitive_bias_audit',
                        'latticework',
                        'keeper_test',
                        'steelman_red_team',
                    ],
                },
                description: 'REQUIRED: Array of technique names to execute. Each technique will have multiple steps that MUST ALL be completed.',
            },
            objectives: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific objectives for this session',
            },
            constraints: {
                type: 'array',
                items: { type: 'string' },
                description: 'Constraints to work within',
            },
            timeframe: {
                type: 'string',
                enum: ['quick', 'thorough', 'comprehensive'],
                description: 'How much time/depth to invest',
            },
            executionMode: {
                type: 'string',
                enum: ['sequential', 'parallel', 'auto'],
                description: 'How to execute techniques: sequential (one after another), parallel (simultaneously), auto (let system decide)',
                default: 'sequential',
            },
            maxParallelism: {
                type: 'number',
                description: 'Maximum number of techniques to run in parallel (1-10)',
                minimum: 1,
                maximum: 10,
                default: 3,
            },
            persona: {
                type: 'string',
                minLength: 1,
                maxLength: 200,
                description: 'Thinking personality for this session',
            },
            personas: {
                type: 'array',
                items: { type: 'string', minLength: 1, maxLength: 200 },
                maxItems: 10,
                description: 'Team of personas for debate mode (max 10)',
            },
            debateFormat: {
                type: 'string',
                enum: ['structured', 'adversarial', 'collaborative'],
                description: 'Format for debate mode when multiple personas are active',
            },
        },
        required: ['problem', 'techniques'],
    },
};
export const EXECUTE_THINKING_STEP_TOOL = {
    name: 'execute_thinking_step',
    description: 'STEP 3 of 3: Executes a single step in the lateral thinking process. CRITICAL: You MUST execute EVERY SINGLE STEP for EACH technique in the plan. DO NOT skip any steps - each step builds on previous insights. Steps must be executed sequentially (1, 2, 3, etc.) without gaps. WARNING: This tool REQUIRES a valid planId from plan_thinking_session. DO NOT call this tool directly - you MUST first call discover_techniques, then plan_thinking_session to get a planId. The workflow is: 1) discover_techniques, 2) plan_thinking_session (get planId), 3) execute_thinking_step repeatedly until ALL steps are complete. Set nextStepNeeded=true until the FINAL step of the FINAL technique. MANDATORY PARAMETERS: planId, technique, problem, currentStep, totalSteps, output, nextStepNeeded.',
    inputSchema: {
        type: 'object',
        properties: {
            planId: {
                type: 'string',
                description: 'REQUIRED: The planId returned from plan_thinking_session. Must be provided.',
            },
            sessionId: { type: 'string' },
            technique: {
                type: 'string',
                description: 'REQUIRED: The current technique being executed from the plan.',
            },
            problem: {
                type: 'string',
                description: 'REQUIRED: The problem being solved. Must match previous calls.',
            },
            currentStep: {
                type: 'number',
                description: 'REQUIRED: Current step number (1-based). Prefer numbering within the current ' +
                    'technique: a plan of triz (4 steps) then six_hats (7) numbers the first hat as ' +
                    'step 1 with totalSteps 7. Plan-wide numbering (that same hat as step 5 with ' +
                    'totalSteps 11) is equally accepted — totalSteps is what tells the two apart, so ' +
                    'it must match the convention currentStep is using. Steps must be sequential ' +
                    'without gaps.',
            },
            totalSteps: {
                type: 'number',
                description: 'REQUIRED: Total number of steps in the plan, matching how currentStep is counted. ' +
                    'Send the plan total when numbering across the plan, or one technique step count ' +
                    'when numbering within that technique. Pairing one convention with the other ' +
                    'resolves the step to the wrong place.',
            },
            output: {
                type: 'string',
                description: 'REQUIRED: The thinking output for this step. Must contain substantive analysis.',
            },
            nextStepNeeded: {
                type: 'boolean',
                description: 'REQUIRED: Set to true unless this is the FINAL step of the FINAL technique. Critical for completion.',
            },
            autoSave: {
                type: 'boolean',
                description: 'Whether to automatically save the session after this step',
            },
            persona: {
                type: 'string',
                minLength: 1,
                maxLength: 200,
                description: 'Which persona is speaking (for debate mode)',
            },
            // Six Hats specific
            hatColor: {
                type: 'string',
                enum: ['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'],
                description: 'Which hat this step wears, in order blue, white, red, yellow, black, green, purple. ' +
                    "It must be both a real hat and this step's own hat: an unknown value is refused, and " +
                    'so is the right hat on the wrong step. Purple is the seventh step (path dependency ' +
                    'and ruin risk) and was missing from this enum, so step 7 could not be labelled even ' +
                    'though the handler accepted it. Omitting hatColor costs the step its label, and an ' +
                    'unlabelled hat cannot be attributed in the report.',
            },
            // PO specific
            provocation: { type: 'string' },
            principles: { type: 'array', items: { type: 'string' } },
            // Random Entry specific
            randomStimulus: { type: 'string' },
            connections: { type: 'array', items: { type: 'string' } },
            // SCAMPER specific
            scamperAction: {
                type: 'string',
                enum: [
                    'substitute',
                    'combine',
                    'adapt',
                    'modify',
                    'put_to_other_use',
                    'eliminate',
                    'reverse',
                    'parameterize',
                ],
            },
            modifications: { type: 'array', items: { type: 'string' } },
            pathImpact: {
                type: 'object',
                description: "SCAMPER's measurement of what the modification costs in future freedom — " +
                    'COMPUTED BY THE SERVER. On a scamper step carrying a scamperAction, the ' +
                    'server derives this from its own analysis of the action and REPLACES ' +
                    'anything sent here, however fully populated. It appears on responses as ' +
                    "the server's reading; sending it has no effect. (An older description " +
                    'invited callers to populate it, which was measured false: zero caller ' +
                    'sentinels survive.)',
                properties: {
                    reversible: { type: 'boolean' },
                    dependenciesCreated: { type: 'array', items: { type: 'string' } },
                    optionsClosed: { type: 'array', items: { type: 'string' } },
                    optionsOpened: { type: 'array', items: { type: 'string' } },
                    flexibilityRetention: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1,
                        description: 'Share of future freedom the modification leaves intact. 1 = none lost.',
                    },
                    commitmentLevel: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'irreversible'],
                    },
                    recoveryPath: { type: 'string' },
                },
            },
            // Concept Extraction specific
            successExample: { type: 'string' },
            extractedConcepts: { type: 'array', items: { type: 'string' } },
            abstractedPatterns: { type: 'array', items: { type: 'string' } },
            applications: { type: 'array', items: { type: 'string' } },
            // Yes, And... specific
            initialIdea: { type: 'string' },
            additions: { type: 'array', items: { type: 'string' } },
            evaluations: { type: 'array', items: { type: 'string' } },
            synthesis: { type: 'string' },
            // Design Thinking specific
            designStage: {
                type: 'string',
                enum: ['empathize', 'define', 'ideate', 'prototype', 'test'],
            },
            empathyInsights: { type: 'array', items: { type: 'string' } },
            problemStatement: { type: 'string' },
            ideaList: { type: 'array', items: { type: 'string' } },
            prototypeDescription: { type: 'string' },
            userFeedback: { type: 'array', items: { type: 'string' } },
            // TRIZ specific
            contradiction: { type: 'string' },
            inventivePrinciples: { type: 'array', items: { type: 'string' } },
            minimalSolution: { type: 'string' },
            // Neural State specific
            dominantNetwork: { type: 'string', enum: ['dmn', 'ecn'] },
            suppressionDepth: { type: 'number', minimum: 0, maximum: 10 },
            switchingRhythm: { type: 'array', items: { type: 'string' } },
            integrationInsights: { type: 'array', items: { type: 'string' } },
            // Temporal Work specific
            temporalLandscape: {
                type: 'object',
                description: 'Step 1: the shape of the available time. Rejected loudly if it is not an ' +
                    'object, but its keys were undeclared, so the two that drive insights — ' +
                    'fixedDeadlines and kairosOpportunities — could not be guessed.',
                properties: {
                    fixedDeadlines: { type: 'array', items: { type: 'string' } },
                    flexibleWindows: { type: 'array', items: { type: 'string' } },
                    pressurePoints: { type: 'array', items: { type: 'string' } },
                    deadZones: { type: 'array', items: { type: 'string' } },
                    kairosOpportunities: { type: 'array', items: { type: 'string' } },
                },
            },
            circadianAlignment: { type: 'array', items: { type: 'string' } },
            pressureTransformation: { type: 'array', items: { type: 'string' } },
            asyncSyncBalance: { type: 'array', items: { type: 'string' } },
            temporalEscapeRoutes: { type: 'array', items: { type: 'string' } },
            // Cross-Cultural specific
            culturalFrameworks: { type: 'array', items: { type: 'string' } },
            bridgeBuilding: { type: 'array', items: { type: 'string' } },
            respectfulSynthesis: { type: 'array', items: { type: 'string' } },
            parallelPaths: { type: 'array', items: { type: 'string' } },
            // Collective Intelligence specific
            wisdomSources: { type: 'array', items: { type: 'string' } },
            emergentPatterns: { type: 'array', items: { type: 'string' } },
            synergyCombinations: { type: 'array', items: { type: 'string' } },
            collectiveInsights: { type: 'array', items: { type: 'string' } },
            // Disney Method specific
            disneyRole: {
                type: 'string',
                enum: ['dreamer', 'realist', 'critic'],
            },
            dreamerVision: { type: 'array', items: { type: 'string' } },
            realistPlan: { type: 'array', items: { type: 'string' } },
            criticRisks: { type: 'array', items: { type: 'string' } },
            // Nine Windows specific
            nineWindowsMatrix: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        timeFrame: { type: 'string', enum: ['past', 'present', 'future'] },
                        systemLevel: { type: 'string', enum: ['sub-system', 'system', 'super-system'] },
                        content: { type: 'string' },
                        pathDependencies: { type: 'array', items: { type: 'string' } },
                        irreversible: { type: 'boolean' },
                    },
                },
            },
            currentCell: {
                type: 'object',
                properties: {
                    timeFrame: { type: 'string', enum: ['past', 'present', 'future'] },
                    systemLevel: { type: 'string', enum: ['sub-system', 'system', 'super-system'] },
                },
            },
            interdependencies: { type: 'array', items: { type: 'string' } },
            /**
             * Paradoxical Problem specific fields
             * Used for resolving contradictions through synthesis
             * Note: 'contradiction' field shared with TRIZ, 'contradictions' is array alternative
             */
            paradox: { type: 'string' },
            // contradiction: already defined for TRIZ
            contradictions: { type: 'array', items: { type: 'string' } },
            solutionA: { type: 'string' },
            solutionB: { type: 'string' },
            metaPath: { type: 'string' },
            bridge: { type: 'string' },
            validation: { type: 'string' },
            pathContexts: { type: 'array', items: { type: 'string' } },
            resolutionVerified: { type: 'boolean' },
            // Quantum Superposition specific
            solutionStates: { type: 'array', items: { type: 'string' } },
            interferencePatterns: {
                type: 'object',
                properties: {
                    constructive: { type: 'array', items: { type: 'string' } },
                    destructive: { type: 'array', items: { type: 'string' } },
                    hybrid: { type: 'array', items: { type: 'string' } },
                },
            },
            entanglements: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        states: { type: 'array', items: { type: 'string' } },
                        dependency: { type: 'string' },
                    },
                },
            },
            amplitudes: { type: 'object' },
            measurementCriteria: { type: 'array', items: { type: 'string' } },
            chosenState: { type: 'string' },
            preservedInsights: { type: 'array', items: { type: 'string' } },
            // Temporal Creativity specific
            pathHistory: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        decision: { type: 'string' },
                        impact: { type: 'string' },
                        constraintsCreated: { type: 'array', items: { type: 'string' } },
                        optionsClosed: { type: 'array', items: { type: 'string' } },
                    },
                },
            },
            decisionPatterns: { type: 'array', items: { type: 'string' } },
            currentConstraints: { type: 'array', items: { type: 'string' } },
            activeOptions: { type: 'array', items: { type: 'string' } },
            timelineProjections: {
                type: 'object',
                properties: {
                    bestCase: { type: 'array', items: { type: 'string' } },
                    probableCase: { type: 'array', items: { type: 'string' } },
                    worstCase: { type: 'array', items: { type: 'string' } },
                    blackSwanScenarios: { type: 'array', items: { type: 'string' } },
                    antifragileDesign: { type: 'array', items: { type: 'string' } },
                },
            },
            delayOptions: { type: 'array', items: { type: 'string' } },
            accelerationOptions: { type: 'array', items: { type: 'string' } },
            parallelTimelines: { type: 'array', items: { type: 'string' } },
            lessonIntegration: { type: 'array', items: { type: 'string' } },
            strategyEvolution: { type: 'string' },
            synthesisStrategy: { type: 'string' },
            preservedOptions: { type: 'array', items: { type: 'string' } },
            /**
             * Fields the handlers read that this schema did not declare.
             *
             * Nothing enforced the schema — the server casts raw arguments — so these
             * always worked if a caller happened to send them. They were simply
             * undiscoverable, which for a schema is the same as absent. Several gate
             * insight extraction, so a session that did not send them silently lost
             * the technique's derived findings.
             */
            // Competing Hypotheses
            matrix: {
                type: 'object',
                description: 'Step 3. Rejected unless hypotheses, evidence and ratings are all present. ' +
                    'Rate each pairing under the key `<evidence>_<hypothesis>`.',
                properties: {
                    hypotheses: { type: 'array', items: { type: 'string' } },
                    evidence: { type: 'array', items: { type: 'string' } },
                    ratings: {
                        type: 'object',
                        description: 'Diagnosticity of each evidence-hypothesis pairing, keyed ' +
                            '`<evidence>_<hypothesis>`, from -2 (strongly contradicts) to +2 ' +
                            '(strongly supports). Anything outside that range is rejected.',
                        additionalProperties: { type: 'number', minimum: -2, maximum: 2 },
                    },
                    diagnosticValue: {
                        type: 'object',
                        description: 'How much each piece of evidence discriminates, keyed by evidence, 0-1.',
                        additionalProperties: { type: 'number', minimum: 0, maximum: 1 },
                    },
                    sensitivityFactors: { type: 'array', items: { type: 'string' } },
                },
            },
            probabilities: {
                type: 'object',
                description: 'Step 6. Posterior probability keyed by hypothesis, e.g. { "H1": 0.6, "H2": 0.4 }. ' +
                    'The values must sum to 1.0 (±0.01) or the step is rejected. Drives the ' +
                    'confidence band reported at the end.',
                additionalProperties: { type: 'number', minimum: 0, maximum: 1 },
            },
            leadingHypothesis: { type: 'string' },
            // Criteria-Based Analysis
            validityScore: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                description: 'Step 5: assessed validity as a percentage. Drives the validity band reported ' +
                    'at the end.',
            },
            // Linguistic Forensics
            pronounRatios: {
                type: 'object',
                description: 'Step 3. Keyed by ratio, not by pronoun — iWe is the one that is read, and an ' +
                    'example of { "i": …, "we": … } (which this description used to give) validates ' +
                    'and then reports nothing. Each value is a fraction from 0 to 1.',
                properties: {
                    iWe: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1,
                        description: 'Individual over collective. Above 0.7 and below 0.3 both get reported.',
                    },
                    activePassive: { type: 'number', minimum: 0, maximum: 1 },
                    ownershipAvoidance: { type: 'number', minimum: 0, maximum: 1 },
                },
            },
            coherenceScore: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                description: 'Step 6: narrative coherence as a percentage, not a fraction. The bands sit at ' +
                    '85, 70 and 50, so a 0-1 value reports the worst verdict for the best score.',
            },
            // Reverse Benchmarking
            weaknessMapping: {
                type: 'object',
                description: 'Step 1: what every competitor is bad at.',
                properties: {
                    universalWeaknesses: { type: 'array', items: { type: 'string' } },
                },
            },
            vacantSpaces: {
                type: 'array',
                description: 'Step 2: the ground nobody is standing on. Every entry needs all four keys ' +
                    'or the step is rejected.',
                items: {
                    type: 'object',
                    properties: {
                        space: { type: 'string' },
                        opportunityValue: { type: 'string', enum: ['low', 'medium', 'high', 'very_high'] },
                        implementationDifficulty: { type: 'string', enum: ['low', 'medium', 'high'] },
                        whyVacant: { type: 'string' },
                    },
                    required: ['space', 'opportunityValue', 'implementationDifficulty', 'whyVacant'],
                },
            },
            antiMimeticStrategy: {
                description: 'Step 3: how this deliberately stops resembling the field. A plain string, or ' +
                    '{ differentiationVector } — both are read.',
                anyOf: [
                    { type: 'string' },
                    { type: 'object', properties: { differentiationVector: { type: 'string' } } },
                ],
            },
            excellenceDesign: {
                type: 'object',
                description: 'Step 4: the standard being set, and where.',
                properties: {
                    area: { type: 'string' },
                    standard: { type: 'string' },
                },
            },
            // Temporal Creativity
            blackSwanScenarios: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 3: the outcomes the projection cannot price. Rejected if not an array.',
            },
            // Biomimetic Path
            integratedSolution: { type: 'string' },
            // Random Entry
            roryMode: {
                type: 'boolean',
                description: 'Draw the stimulus from the behavioural-economics catalogue instead of at random.',
            },
            // Anecdotal Signal
            anecdoteCount: {
                type: 'integer',
                minimum: 0,
                description: 'Step 1: how many anecdotes were gathered.',
            },
            signals: {
                type: 'array',
                description: 'Step 2: the anecdotes that might be signal. Every entry needs all four keys ' +
                    'or the step is rejected. Only strong and critical ones are reported.',
                items: {
                    type: 'object',
                    properties: {
                        story: { type: 'string' },
                        divergenceLevel: {
                            type: 'string',
                            enum: ['minor', 'moderate', 'significant', 'extreme'],
                        },
                        signalStrength: { type: 'string', enum: ['weak', 'moderate', 'strong', 'critical'] },
                        precedentType: { type: 'string', enum: ['first', 'rare', 'emerging', 'recurring'] },
                    },
                    required: ['story', 'divergenceLevel', 'signalStrength', 'precedentType'],
                },
            },
            trajectoryAnalysis: { type: 'object', description: 'Step 3: where the signal is heading.' },
            earlyWarnings: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 4: what would show first if this is real. Read only if it is an array.',
            },
            scalingScenarios: {
                type: 'array',
                description: 'Step 5: what adoption looks like if it spreads.',
                items: {
                    type: 'object',
                    properties: {
                        scenario: { type: 'string' },
                        adoptionLevel: {
                            type: 'number',
                            minimum: 0,
                            maximum: 100,
                            description: 'Percentage of the market, not a fraction. Above 25 is reported as ' +
                                'crossing into the mainstream. Outside 0-100 the step is rejected.',
                        },
                    },
                },
            },
            strategicResponse: { type: 'object', description: 'Step 6: what to do about it.' },
            // Context Reframing
            contextAnalysis: {
                type: 'object',
                description: 'Step 1: the context as it stands, and what it constrains.',
            },
            interventions: {
                type: 'array',
                description: 'Step 2: the changes to the context, not to the message. Every entry needs all ' +
                    'four keys or the step is rejected. Easy and moderate ones are reported.',
                items: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['spatial', 'temporal', 'social', 'comparative', 'procedural', 'informational'],
                        },
                        description: { type: 'string' },
                        expectedImpact: { type: 'string' },
                        implementationEase: { type: 'string', enum: ['easy', 'moderate', 'difficult'] },
                    },
                    required: ['type', 'description', 'expectedImpact', 'implementationEase'],
                },
            },
            frameShift: { type: 'object', description: 'Step 3: the frame moved from, and to.' },
            environmentDesign: { type: 'object', description: 'Step 4: the environment as redesigned.' },
            behavioralMetrics: { type: 'object', description: 'Step 5: what the change is measured by.' },
            // Perception Optimization
            perceptionGaps: {
                type: 'array',
                description: 'Step 1: where what is true and what is perceived come apart. Every entry needs ' +
                    'all four keys or the step is rejected. Large and massive gaps are reported.',
                items: {
                    type: 'object',
                    properties: {
                        objective: { type: 'string' },
                        perceived: { type: 'string' },
                        gapSize: { type: 'string', enum: ['small', 'medium', 'large', 'massive'] },
                        leverageOpportunity: {
                            type: 'string',
                            enum: ['low', 'medium', 'high', 'very_high'],
                        },
                    },
                    required: ['objective', 'perceived', 'gapSize', 'leverageOpportunity'],
                },
            },
            valueAmplification: { type: 'object', description: 'Step 2: what makes the value felt.' },
            experienceDesign: { type: 'object', description: 'Step 3: the experience as designed.' },
            psychologicalValue: {
                type: 'object',
                description: 'Step 4: the value that is not material.',
            },
            perceptionROI: {
                type: 'number',
                exclusiveMinimum: 0,
                description: 'Step 5: return as a multiple of what the equivalent spend on the product itself ' +
                    'would return — 12 means twelvefold, not 12%. Above 10 is reported as ' +
                    'exceptional. Zero and negatives are rejected.',
            },
            /**
             * First Principles specific fields
             * Used for breaking down problems to fundamental components
             * Alternative fields support flexible input from LLMs
             */
            components: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 1: Fundamental components from deconstruction',
            },
            breakdown: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 1: Alternative to components - structured decomposition',
            },
            fundamentalTruths: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 2: Identified fundamental truths and laws',
            },
            foundations: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 2: Alternative to fundamentalTruths - bedrock principles',
            },
            assumptions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 3: List of assumptions being challenged',
            },
            challenges: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 3: Alternative to assumptions - convention challenges',
            },
            reconstruction: {
                type: 'string',
                description: 'Step 4: Solution rebuilt from first principles',
            },
            rebuilding: {
                type: 'string',
                description: 'Step 4: Alternative to reconstruction - ground-up solution',
            },
            solution: {
                type: 'string',
                description: 'Step 5: Final synthesized solution',
            },
            // synthesis field already exists below for other techniques
            /**
             * Meta-Learning specific fields
             * Used for learning from patterns across techniques
             *
             * Steps 1 and 2 REJECT input that omits these. They were described in this
             * comment as "alternative fields" but never declared, so the only way to
             * discover them was to trigger the error and read the message.
             */
            patternRecognition: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 1: successful patterns recognised across techniques. Required; `patterns` is accepted instead.',
            },
            patterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 1: alias for patternRecognition.',
            },
            learningHistory: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 2: accumulated learnings and their contexts. Required; `accumulatedLearning` is accepted instead.',
            },
            accumulatedLearning: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 2: alias for learningHistory.',
            },
            strategyAdaptations: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 3: how technique selection adapts. Required; `strategyEvolution` is accepted instead.',
            },
            metaSynthesis: {
                type: 'string',
                description: 'Step 4: Meta-level synthesis of learning patterns. Required; ' +
                    '`synthesisStrategy` is accepted instead.',
            },
            /**
             * Biomimetic Path specific fields
             * Used for biological-inspired problem solving
             * Alternative fields: antibodies (immuneResponse), selectionPressure (mutations), etc.
             */
            immuneResponse: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 1: Immune system response patterns',
            },
            antibodies: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 1: Alternative to immuneResponse - antibody strategies',
            },
            mutations: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 2: Evolutionary mutations and variations',
            },
            selectionPressure: {
                type: 'string',
                description: 'Step 2: Alternative to mutations - selection forces',
            },
            symbioticRelationships: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 3: Symbiotic ecosystem relationships',
            },
            ecosystemBalance: {
                type: 'string',
                description: 'Step 3: Alternative to symbioticRelationships - ecosystem dynamics',
            },
            swarmBehavior: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 4: Swarm intelligence patterns',
            },
            // emergentPatterns already exists below
            resiliencePatterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 5: Resilience and adaptation patterns',
            },
            redundancy: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 5: Alternative to resiliencePatterns - redundancy strategies',
            },
            naturalSynthesis: {
                type: 'string',
                description: 'Step 6: Natural synthesis of biological strategies',
            },
            biologicalStrategies: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step 6: Alternative to naturalSynthesis - bio-inspired solutions',
            },
            /**
             * Neuro-Computational specific fields
             * Used for neural network-inspired synthesis
             * Required interferenceAnalysis must have both constructive and destructive arrays
             */
            neuralMappings: { type: 'array', items: { type: 'string' } },
            patternGenerations: { type: 'array', items: { type: 'string' } },
            interferenceAnalysis: {
                type: 'object',
                properties: {
                    constructive: { type: 'array', items: { type: 'string' } },
                    destructive: { type: 'array', items: { type: 'string' } },
                },
            },
            computationalModels: { type: 'array', items: { type: 'string' } },
            optimizationCycles: { type: 'number' },
            convergenceMetrics: {
                type: 'object',
                properties: {
                    coherence: { type: 'number' },
                    novelty: { type: 'number' },
                    utility: { type: 'number' },
                },
            },
            finalSynthesis: { type: 'string' },
            // Risk/Adversarial fields (unified framework)
            risks: { type: 'array', items: { type: 'string' } },
            failureModes: { type: 'array', items: { type: 'string' } },
            mitigations: { type: 'array', items: { type: 'string' } },
            antifragileProperties: { type: 'array', items: { type: 'string' } },
            blackSwans: { type: 'array', items: { type: 'string' } },
            failureInsights: { type: 'array', items: { type: 'string' } },
            stressTestResults: { type: 'array', items: { type: 'string' } },
            failureModesPredicted: { type: 'array', items: { type: 'string' } },
            viaNegativaRemovals: { type: 'array', items: { type: 'string' } },
            // Revision support
            isRevision: { type: 'boolean' },
            revisesStep: { type: 'number' },
            branchFromStep: { type: 'number' },
            branchId: { type: 'string' },
            alternativeSuggestions: { type: 'array', items: { type: 'string' } },
            // The second mode. This tool dispatches on `sessionOperation` before it
            // validates anything else (index.ts:166), so these have always worked —
            // and were declared nowhere, while `required` demanded the seven
            // thinking-step fields unconditionally. A client following the schema
            // could not issue one at all. The `oneOf` below is what makes both
            // shapes legal; the properties are what make the second one findable.
            sessionOperation: {
                type: 'string',
                enum: ['save', 'load', 'list', 'delete', 'export'],
                description: 'Operate on the session itself rather than advancing it. Send this ' +
                    'INSTEAD of the thinking-step fields, with the matching options ' +
                    'object below. `export` reads the live session and needs no ' +
                    'persistence. `save`, `load` and `list` require the server to be ' +
                    'started with PERSISTENCE_TYPE set; without it they report that the ' +
                    'adapter is unavailable.',
            },
            saveOptions: {
                type: 'object',
                description: 'For sessionOperation: save. Requires a persistence adapter.',
                properties: {
                    sessionName: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    asTemplate: { type: 'boolean' },
                },
            },
            loadOptions: {
                type: 'object',
                description: 'For sessionOperation: load. Requires a persistence adapter.',
                properties: {
                    sessionId: { type: 'string' },
                    continueFrom: { type: 'number' },
                },
                required: ['sessionId'],
            },
            listOptions: {
                type: 'object',
                description: 'For sessionOperation: list. Requires a persistence adapter.',
                properties: {
                    limit: { type: 'number' },
                    technique: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'completed', 'all'] },
                    tags: { type: 'array', items: { type: 'string' } },
                    searchTerm: { type: 'string' },
                },
            },
            deleteOptions: {
                type: 'object',
                description: 'For sessionOperation: delete. Requires a persistence adapter.',
                properties: {
                    sessionId: { type: 'string' },
                    confirm: { type: 'boolean' },
                },
                required: ['sessionId'],
            },
            exportOptions: {
                type: 'object',
                description: 'For sessionOperation: export. Returns the whole session as a ' +
                    'document. `sessionId` goes HERE, not at the top level — a top-level ' +
                    'sessionId is ignored and the call is rejected as missing it.',
                properties: {
                    sessionId: { type: 'string' },
                    format: { type: 'string', enum: ['json', 'markdown', 'csv'] },
                    outputPath: { type: 'string' },
                },
                required: ['sessionId', 'format'],
            },
        },
        // Two shapes, one tool. A thinking step needs all seven of its fields; a
        // session operation needs none of them.
        oneOf: [
            {
                required: [
                    'planId',
                    'technique',
                    'problem',
                    'currentStep',
                    'totalSteps',
                    'output',
                    'nextStepNeeded',
                ],
            },
            { required: ['sessionOperation'] },
        ],
    },
};
/**
 * Get all tool definitions
 */
export function getAllTools() {
    return [DISCOVER_TECHNIQUES_TOOL, PLAN_THINKING_SESSION_TOOL, EXECUTE_THINKING_STEP_TOOL];
}
//# sourceMappingURL=ToolDefinitions.js.map