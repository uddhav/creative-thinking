# Changelog

All notable changes to the Creative Thinking MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **PostgreSQL Persistence Adapter** (#237) - Production-ready database storage for session state
  - Multi-server horizontal scaling with shared session state
  - Crash recovery with persistent sessions across server restarts
  - JSONB storage for flexible schema and efficient querying
  - Full-text search with GIN indexes for advanced queries
  - Automatic session TTL with 24-hour expiry
  - Transaction support for batch operations
  - Connection pooling for production deployments
  - Comprehensive test suite with 27 unit tests
  - Optional dependency (pg) - only installed when needed
- **Part VII Advanced Techniques (Continued)** - Implemented three more techniques from Part VII
  - **Paradoxical Problem Solving** (#156) - Finds breakthrough solutions through contradiction
    exploration
    - 5-step process: Identify Contradiction → Explore Paradox → Synthesize Unity → Generate Novel
      Solutions → Transcend Paradox
    - Leverages cognitive dissonance for creative breakthroughs
    - Comprehensive tests and validation
  - **Meta-Learning from Path Integration** (#157) - Self-improving system that learns from
    technique patterns
    - 5-step process: Pattern Recognition → Learning Accumulation → Strategy Evolution → Feedback
      Integration → Meta-Synthesis
    - Builds affinity matrix of technique combinations
    - Adapts technique selection based on accumulated knowledge
    - Comprehensive tests with validation for each step
  - **Biomimetic Path Management** (#158) - Applies biological solutions and evolutionary strategies
    - 6-step process: Immune Response → Evolutionary Variation → Ecosystem Dynamics → Swarm
      Intelligence → Resilience Patterns → Natural Synthesis
    - Nature-inspired problem solving through evolutionary patterns
    - Leverages billions of years of evolutionary problem-solving

### Changed

- **Persistence Architecture** - Simplified from 4-adapter pattern to 2-backend approach
  - Removed: Memory and SQLite adapters (over-engineered for actual use cases)
  - Kept: Filesystem (simple deployments) and PostgreSQL (production scaling)
  - Design rationale: Active session storage vs. historical analytics are separate concerns
  - Future: Analytics storage will be implemented as separate feature (see Issue #241)
- **Total Techniques** - Increased from 16 to 19 enhanced thinking techniques
- **Memory Growth Threshold** - Adjusted stress test memory limit from 50MB to 70MB to account for
  19 techniques
- **Documentation** - Updated all documentation to reflect 19 techniques and removed parallel
  execution references

## [0.6.0] - 2025-08-11

### Added

- **MCP Prompts Support** - Pre-configured conversation starters for guided lateral thinking
  - 6 prompt templates for common scenarios (problem-discovery, creative-brainstorming,
    risk-analysis, etc.)
  - Exposed via standard MCP prompts protocol (ListPrompts/GetPrompt)
  - Each prompt provides structured arguments and conversation flow
- **Wildcard Technique Selection** - Prevents algorithmic pigeonholing in discovery
  - 17.5% probability of including an additional random technique (configurable via
    WILDCARD_PROBABILITY)
  - Marked with isWildcard flag in recommendations
  - Encourages exploration of unexpected approaches
- **Part VII Advanced Techniques** - Implemented first two techniques from SPECIFICATIONS.md Part
  VII
  - **Quantum Superposition** (#154) - Maintains multiple contradictory solution states
    simultaneously
    - 6-step process: State Generation → Interference Mapping → Entanglement Analysis → Amplitude
      Evolution → Measurement Context → State Collapse
    - Preserves insights from non-chosen states
    - Comprehensive tests (15 tests passing)
  - **Temporal Creativity with Path Memory** (#155) - Advanced temporal thinking with decision
    tracking
    - 6-step process: Archaeological Path Analysis → Present State Synthesis → Future Path
      Projection → Temporal Option Creation → Cyclical Refinement → Path Integration
    - Path memory system tracks constraints created and options closed
    - Projects future flexibility with decay modeling
    - Comprehensive tests (21 tests passing)

### Changed

- **Total Techniques** - Increased from 14 to 16 enhanced thinking techniques
- **Documentation** - Updated all documentation to reflect new technique count
- **Dynamic Recommendation Limits** - No longer artificially limited to 3 recommendations
  - Low complexity: 2-3 base techniques + 1 wildcard
  - Medium complexity: 3-5 base techniques + 1 wildcard
  - High complexity: 5-7 base techniques + 2 wildcards
  - Configurable via MAX_TECHNIQUE_RECOMMENDATIONS environment variable
- **Performance Optimizations** - Improved recommendation performance
  - Technique info caching to avoid repeated registry lookups
  - Early exit for wildcard selection (skip 82.5% of the time)
  - Set-based exclusion checks for O(1) performance
  - Lazy evaluation of technique information

### Removed

- **Parallel Execution Architecture** - Simplified to sequential-only execution
  - Removed 'convergence' technique (no longer needed without parallel execution)
  - Removed all parallel execution components (ProgressCoordinator, SessionTimeoutMonitor, etc.)
  - Removed ExecutionGraphGenerator DAG generation (simplified to sequential workflow)
  - Removed parallel execution examples and test scripts
  - Cleaned up all parallel-related documentation
  - Simplified ExecutionModeController to always return sequential mode

### Fixed

- **Execution Model** - Now exclusively sequential for depth and coherence
  - Each technique step builds progressively on previous insights
  - Context flows naturally through the entire thinking process
  - Simplified architecture reduces complexity and maintenance burden

## [0.5.0] - TBD

### Added

- **Telemetry & Analytics System** (#126) - Privacy-first technique effectiveness tracking
  - Opt-in by default with environment configuration
  - Three privacy modes: strict, balanced, minimal
  - Three telemetry levels: basic, detailed, full
  - Session ID anonymization and data sanitization
  - Memory and filesystem storage adapters
  - Comprehensive analytics engine
  - Visualization tools (HTML dashboard, Python analysis, export utility)
- **GitHub Issue Organization** - Comprehensive prioritization and roadmap system
  - Priority labels (1-critical through 5-future)
  - Quarterly roadmap labels (Q1-Q4 2025, 2026)
  - Category labels (part-vii, performance, telemetry, platform)
  - Pinned roadmap issue (#162) for tracking
- **Part VII Sub-Issues** - Created 8 issues for advanced techniques (#154-#161)

### Changed

- **README** - Added roadmap section with links to filtered GitHub views
- **Documentation** - Updated with telemetry configuration and roadmap information

## [0.3.1] - 2025-08-01

### Added

- **Disney Method**: Three-role creative technique for idea development
  - Dreamer role: Vision without constraints
  - Realist role: Practical implementation planning
  - Critic role: Risk and feasibility analysis
- **Nine Windows**: Systematic analysis across time and system levels
  - 3×3 matrix: Past/Present/Future × Sub-system/System/Super-system
  - Path dependency tracking for temporal analysis
  - Interdependency identification
- **Comprehensive Tests**: Unit and integration tests for both new techniques
- **MCP Schema Fields**: Added ALL missing technique-specific fields (critical bug fix)
- **Sequential Thinking Integration**: Complex problems now trigger sequential thinking suggestions
- **Option Generation Integration**: Properly integrated existing engine to activate when
  flexibility < 0.4
- **Ruin Risk Assessment**: Added actual risk assessment beyond just prompt generation
- **Technique Progress Info**: Multi-technique workflows now show both local and global progress
- **Enhanced Ergodicity Visibility**:
  - Visual flexibility warnings with color-coded alerts
  - User-friendly messages explaining flexibility status
  - Escape route recommendations displayed visually
  - Flexibility data now included in all execution responses
  - Alternative suggestions shown automatically when flexibility < 40%

### Fixed

- **Critical Bug**: MCP schema was missing technique-specific fields for ALL techniques
- **Validation**: Added Disney Method and Nine Windows to validation arrays
- **Step Numbering Issue (#115)**: Fixed cumulative step numbering confusion in multi-technique
  workflows
- **Option Generation Bug (#95)**: Fixed priority issue preventing option generation from triggering
- **Test Parameter Order**: Fixed reversed parameters in SessionManager tests
- **ESLint Configuration**: Added missing rule for test files, achieving 0 errors/warnings
- **Array Bounds Validation**: Improved validation for out-of-range step numbers

### Changed

- **Total Techniques**: Increased from 12 to 14 enhanced thinking techniques
- **README**: Updated to reflect new technique count and descriptions
- **Execution Response**: Now includes `techniqueProgress` object for better UX in multi-technique
  workflows

## [0.3.0] - 2025-01-31

### Added

- **SCAMPER+P**: Added 8th transformation step "Parameterize" for systematic parameter variation
  - Identifies and varies key parameters systematically
  - Medium commitment level with path dependency tracking
  - Reversibility cost of 0.35
- **Memory-Aware Outputs**: All three layers now provide contextual memory outputs
  - Discovery Layer: Problem analysis, historical relevance, searchable factors
  - Planning Layer: Technique rationale, sequence logic, historical notes
  - Execution Layer: Technique effectiveness, path dependencies, noteworthy moments
- **Environment Variables**: Support for advanced feature configuration
  - `NEURAL_OPTIMIZATION=true` - Enable neural state optimization features
  - `CULTURAL_FRAMEWORKS=framework1,framework2` - Specify available cultural frameworks
- **End-to-End Integration Tests**: 13 comprehensive workflow tests
  - Tests for all new techniques (neural_state, temporal_work, cross_cultural, collective_intel)
  - Memory-aware output verification
  - Ergodicity scenario testing
  - Complex multi-technique workflows
  - Edge case handling

### Changed

- **SCAMPER**: Now referred to as SCAMPER+P throughout the system
- **Test Suite**: Updated all tests to expect 8 SCAMPER steps instead of 7
- **ResponseBuilder**: Improved type safety by replacing `any` types with proper TypeScript types

### Fixed

- Fixed 110 failing tests after adding the 8th SCAMPER step
- Fixed scope issue with `ergodicityResult` variable in execution layer
- Fixed type safety issues in ResponseBuilder.ts
- Fixed empty insights array issues in integration tests

### Technical Details

- Total test count: 721 tests across 54 test files
- All tests passing with comprehensive coverage
- Performance: All tests complete in under 10 seconds

## [0.2.0] - Previous Release

### Added

- Initial implementation of 12 creative thinking techniques
- Path dependency analysis (PDA-SCAMPER)
- Early warning system enhancements
- Option generation engine with 8 strategies
- Stress testing capabilities

## [0.1.0] - Initial Release

### Added

- Three-layer architecture (Discovery, Planning, Execution)
- Twelve creative thinking techniques
- Unified framework with dual thinking modes
- Session management with persistence
- Ergodicity awareness and path tracking
- Absorbing barrier early warning system
- Option Generation Engine with 8 strategies
- Reality Gradient System
- Visual progress indicators
- Export formats (JSON, Markdown, CSV)
