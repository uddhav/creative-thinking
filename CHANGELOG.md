# Changelog

All notable changes to the Creative Thinking MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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