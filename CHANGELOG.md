# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.3.2 (2025-08-02)


### ⚠ BREAKING CHANGES

* Domain assessment now returns actual domain descriptions
instead of predefined categories (e.g., "cryptocurrency investment" instead
of "financial")

* refactor: remove all hardcoded domain detection for generic risk assessment

- Removed hardcoded domain detection from prompts.ts (financial, health, career, etc.)
- Updated discovery.ts inferDomain() to always return 'general'
- Replaced DOMAIN_PATTERNS with RISK_INDICATOR_PATTERNS in reality/integration.ts
- Updated RuinRiskDiscovery to extract generic risk features instead of domains
- Changed "DOMAIN IDENTIFICATION" to "RISK CHARACTERISTIC ANALYSIS" in prompts
- Updated generateSurvivalConstraints() to use risk features instead of domains
- Fixed all tests to match new generic approach
- Ensured domains emerge naturally from analysis rather than being pigeonholed

This change allows the system to react to non-ergodic domains dynamically
without being limited to a predefined set of domain categories.

* refactor: use Compromise NLP instead of skip word approach in extractDomainFromResponse

* fix: properly use risk indicators and remove unused domain inference

- Remove unused inferDomain function that always returned 'general'
- Actually use detectRiskIndicators output to enhance reality assessments
- Risk indicators now influence confidence levels and add relevant warnings
- Tests verify risk indicator detection and integration
- All lint errors fixed, no workarounds used

* fix: address PR review feedback - improve type safety and code quality

- Add proper TypeScript type definitions for Compromise library
- Add comprehensive error handling for all NLP operations
- Refactor large analyzeWithNLP method into smaller focused helpers
- Add input validation with character limits
- Optimize performance by caching NLP document objects
- All changes address feedback from automated PR review

* fix: critical security vulnerabilities and code quality issues

SECURITY FIXES:
- Fix ReDoS vulnerability in domain extraction pattern (line 574)
  - Limited capture group to 100 chars max
  - Added explicit spaces after articles
- Fix ReDoS vulnerability in domain cleanup pattern (line 585)
  - Limited whitespace to 1-5 chars to prevent exponential backtracking
- Fix ReDoS vulnerability in numbered pattern (line 1226)
  - Limited digits, whitespace, and capture group lengths
  - Added line start anchor and multiline flag for proper matching

CODE QUALITY:
- Remove unnecessary TypeScript type assertions
  - Removed redundant 'as CompromiseDoc' casts
  - Removed unnecessary array type assertions
  - Fixed remaining type cast for dates/adjectives access
- Fix all lint errors and formatting issues
- Add comprehensive security tests for regex patterns
- Update filesystem adapter tests for atomic writes

All tests passing, no functionality impacted

* fix: remove unused import in regex security test

- Remove unused 'it' import from vitest to fix lint error
- Fixes failing Lint & Code Quality CI check
* Session operations no longer use dummy values for missing thinking operation fields

- Split LateralThinkingData into separate interfaces:
  - ThinkingOperationData for thinking operations (six_hats, po, etc.)
  - SessionOperationData for session management (save, load, list, etc.)
- Created separate validation methods for each operation type
- Fixed type safety issues throughout the codebase
- Updated SessionData to use ThinkingOperationData instead of union type
- Fixed early warning system sessionId generation
- Added comprehensive validation tests to ensure no dummy values are used

This change improves type safety and makes validation errors more explicit,
preventing silent failures that could occur with dummy values.
* planId is now required in execute_thinking_step

- Add plan storage to LateralThinkingServer with TTL-based cleanup
- Store plans in planThinkingSession with unique IDs
- Make planId a required parameter in ExecuteThinkingStepInput
- Validate planId exists and matches technique in executeThinkingStep
- Update all tests to include planId parameter
- Update documentation to reflect planId requirement

This ensures users follow the intended workflow:
1. discover_techniques → find suitable techniques
2. plan_thinking_session → create plan (returns planId)
3. execute_thinking_step → execute steps (requires planId)
* lateralthinking tool removed in favor of three-layer architecture

### Features

* Add comprehensive CI/CD pipeline ([8fde78e](https://github.com/uddhav/creative-thinking/commit/8fde78eb4720682a85fda0b20b9f345cc126f174))
* add Design Thinking technique with embedded risk management ([3fce524](https://github.com/uddhav/creative-thinking/commit/3fce524e1e64c0aac26ab5cfed1fad7fc41246a4)), closes [#3](https://github.com/uddhav/creative-thinking/issues/3)
* Add Disney Method and Nine Windows lateral thinking techniques ([#110](https://github.com/uddhav/creative-thinking/issues/110)) ([41847d1](https://github.com/uddhav/creative-thinking/commit/41847d1d44fdfc84073d758109a8c1209c429e98)), closes [#109](https://github.com/uddhav/creative-thinking/issues/109)
* add MCP integration tests (closes [#28](https://github.com/uddhav/creative-thinking/issues/28)) ([#100](https://github.com/uddhav/creative-thinking/issues/100)) ([0c9e984](https://github.com/uddhav/creative-thinking/commit/0c9e984fa9597efe2db3120fbe77a1a0ebcdb4bc))
* Add session persistence and management (Issues [#17](https://github.com/uddhav/creative-thinking/issues/17), [#18](https://github.com/uddhav/creative-thinking/issues/18), [#19](https://github.com/uddhav/creative-thinking/issues/19)) ([7a10c49](https://github.com/uddhav/creative-thinking/commit/7a10c496c42ff353dd634de69d595cc3ecfe6e1b))
* apply specifications augmentation patch ([c288e95](https://github.com/uddhav/creative-thinking/commit/c288e95f3924ea4a98d89234119aed092752d2d9))
* Complete v0.3.0 implementation with full specification alignment ([#108](https://github.com/uddhav/creative-thinking/issues/108)) ([a1a4acb](https://github.com/uddhav/creative-thinking/commit/a1a4acb478b4bb5aa1f44d3a39feaae5fbdf84fb)), closes [#98](https://github.com/uddhav/creative-thinking/issues/98) [#107](https://github.com/uddhav/creative-thinking/issues/107)
* enhance domain inference with NLP and remove hardcoded domains ([#122](https://github.com/uddhav/creative-thinking/issues/122)) ([7afd66c](https://github.com/uddhav/creative-thinking/commit/7afd66cb8a53cf1ce9d41276812257dbdeff7897))
* enhance ergodicity visibility and fix test failures ([#116](https://github.com/uddhav/creative-thinking/issues/116)) ([#117](https://github.com/uddhav/creative-thinking/issues/117)) ([ac79d13](https://github.com/uddhav/creative-thinking/commit/ac79d1359a879d58cf0e0a98dd49544d520762ff))
* enhance SPECIFICATIONS with memory-aware integration patterns ([39b0ffa](https://github.com/uddhav/creative-thinking/commit/39b0ffaf7db7cc3602daee4578d6ee8b8870deb3))
* implement absorbing barrier early warning system ([#63](https://github.com/uddhav/creative-thinking/issues/63)) ([a16c6ed](https://github.com/uddhav/creative-thinking/commit/a16c6eda09e38192fb1777cfa4cfa88f9f1f18f3)), closes [#59](https://github.com/uddhav/creative-thinking/issues/59)
* implement additional creativity techniques with unified framework ([26239aa](https://github.com/uddhav/creative-thinking/commit/26239aa45b26face0cc7531fcee6ccbcb02c2d39)), closes [#3](https://github.com/uddhav/creative-thinking/issues/3)
* implement Collective Intelligence Orchestration technique ([591a3ec](https://github.com/uddhav/creative-thinking/commit/591a3eccd886d9e29da7d3b1287484c1f7536ef4)), closes [#84](https://github.com/uddhav/creative-thinking/issues/84)
* implement Cross-Cultural Integration technique ([c71783f](https://github.com/uddhav/creative-thinking/commit/c71783f359d09f2f67477ae55d472c61456eee79)), closes [#84](https://github.com/uddhav/creative-thinking/issues/84)
* implement ergodicity awareness and path dependency tracking ([#62](https://github.com/uddhav/creative-thinking/issues/62)) ([e380834](https://github.com/uddhav/creative-thinking/commit/e380834ebaeaeffe61462849208420de9e8a382b)), closes [#55](https://github.com/uddhav/creative-thinking/issues/55)
* implement escape velocity protocols ([#57](https://github.com/uddhav/creative-thinking/issues/57)) ([#65](https://github.com/uddhav/creative-thinking/issues/65)) ([badd538](https://github.com/uddhav/creative-thinking/commit/badd538efbbaf7232710a52f3f269336006b90a2))
* implement memory-suggestive outputs for creative thinking sessions ([#92](https://github.com/uddhav/creative-thinking/issues/92)) ([beef0c6](https://github.com/uddhav/creative-thinking/commit/beef0c6e32ad6f7fa4c6881c4e5fdd69dd46a32f))
* implement Neural State Optimization technique ([ace7f6c](https://github.com/uddhav/creative-thinking/commit/ace7f6c19e5677640e6048d8872ba56132802225)), closes [#84](https://github.com/uddhav/creative-thinking/issues/84)
* implement Neural State Optimization technique ([#93](https://github.com/uddhav/creative-thinking/issues/93)) ([c90e926](https://github.com/uddhav/creative-thinking/commit/c90e9268845e840355d5cb82671c052094ff0f04))
* implement option generation engine with 8 adaptive strategies ([#66](https://github.com/uddhav/creative-thinking/issues/66)) ([6235298](https://github.com/uddhav/creative-thinking/commit/623529853d58861beeba078d02e77323767305d7))
* implement option generation strategies for new thinking techniques ([#105](https://github.com/uddhav/creative-thinking/issues/105)) ([571120b](https://github.com/uddhav/creative-thinking/commit/571120b57a4f2759b0950cebcb4505b8bb81ec33)), closes [#102](https://github.com/uddhav/creative-thinking/issues/102)
* implement PDA-SCAMPER enhancement ([#56](https://github.com/uddhav/creative-thinking/issues/56)) ([65ff7b8](https://github.com/uddhav/creative-thinking/commit/65ff7b8f2639c02bfca99a215613c55c41c5f6f0))
* implement Reality Gradient System (issue [#98](https://github.com/uddhav/creative-thinking/issues/98)) ([#101](https://github.com/uddhav/creative-thinking/issues/101)) ([e66ca5e](https://github.com/uddhav/creative-thinking/commit/e66ca5e6d89704a2211fb3ec84e41805cbbb9aa5))
* implement semantic-release for automated versioning ([#128](https://github.com/uddhav/creative-thinking/issues/128)) ([1b3d465](https://github.com/uddhav/creative-thinking/commit/1b3d46565ca58cc64c91483cdc0d002a4d72fe62)), closes [#125](https://github.com/uddhav/creative-thinking/issues/125)
* implement sequential thinking integration (closes [#87](https://github.com/uddhav/creative-thinking/issues/87)) ([50d43e8](https://github.com/uddhav/creative-thinking/commit/50d43e8921c706728b3c5acedd13e0860913c8b4))
* implement Temporal Work Design technique ([78fb603](https://github.com/uddhav/creative-thinking/commit/78fb60352b46fe08283f4830b3bccf1eda0fe35b))
* implement three-layer tool architecture and remove legacy tool ([100e702](https://github.com/uddhav/creative-thinking/commit/100e702ddc2ee06d24dc137019399bac18201241))
* Integrate unified generative/adversarial framework ([6bb1eea](https://github.com/uddhav/creative-thinking/commit/6bb1eeaec4ed2fcad45d99e7e558a5915e964167))
* standardize error response formats ([#51](https://github.com/uddhav/creative-thinking/issues/51)) ([6372a13](https://github.com/uddhav/creative-thinking/commit/6372a137532ac4c79da5e12130bc0517e2b288ea))
* v0.3.1 improvements - workflow guidance, ruin risk analysis, and documentation ([#118](https://github.com/uddhav/creative-thinking/issues/118)) ([279ec1c](https://github.com/uddhav/creative-thinking/commit/279ec1c93f0dc7f2192ed1ae119694adad098ef5)), closes [#112](https://github.com/uddhav/creative-thinking/issues/112) [#116](https://github.com/uddhav/creative-thinking/issues/116) [#111](https://github.com/uddhav/creative-thinking/issues/111) [#114](https://github.com/uddhav/creative-thinking/issues/114) [#113](https://github.com/uddhav/creative-thinking/issues/113) [#115](https://github.com/uddhav/creative-thinking/issues/115) [#114](https://github.com/uddhav/creative-thinking/issues/114)


### Bug Fixes

* add missing npm install in dependency checks job ([e05a6e5](https://github.com/uddhav/creative-thinking/commit/e05a6e58c7f0efb91252e2043da742aa1f20bd88))
* add neural_state to MCP tool schemas ([6c3509d](https://github.com/uddhav/creative-thinking/commit/6c3509d3bfbf259b2e6f1347b68c2b494d2fa9b2))
* add neural_state to MCP tool schemas ([#94](https://github.com/uddhav/creative-thinking/issues/94)) ([f76c0b9](https://github.com/uddhav/creative-thinking/commit/f76c0b9dbd7e0958470d2362af15920b9b7a34f8))
* additional temporal work improvements ([4eb89ae](https://github.com/uddhav/creative-thinking/commit/4eb89aedfde125c4373d53bf918958e8732017e4))
* Address code review improvements ([0f0601a](https://github.com/uddhav/creative-thinking/commit/0f0601a26266715762272cb60f85b2c12b0af9c7))
* address critical CI pipeline issues from code review ([bdaa5af](https://github.com/uddhav/creative-thinking/commit/bdaa5afcf8f510257067407b0b99631734ca7557))
* address critical issues from CI pipeline code review ([58ecd94](https://github.com/uddhav/creative-thinking/commit/58ecd942dddbc00bf331013dfc04f6fe820daa76))
* address temporal work design feedback ([08ceec4](https://github.com/uddhav/creative-thinking/commit/08ceec480e82eaf1686abf1058e4b4716df8a981))
* enforce three-layer workflow with required planId (fixes [#60](https://github.com/uddhav/creative-thinking/issues/60)) ([597d2b4](https://github.com/uddhav/creative-thinking/commit/597d2b4ad7ee4ea6088ec5fce545ee89f3bb54db))
* format test file to pass lint check ([93f31f1](https://github.com/uddhav/creative-thinking/commit/93f31f171ead8d99d1948d9742d647354b4d8e2f))
* handle cross-platform timeout command in CI ([ad18796](https://github.com/uddhav/creative-thinking/commit/ad187968987ae53bebd40b84c78dc78e130681bd))
* implement plan cleanup to prevent memory leak ([9b21b36](https://github.com/uddhav/creative-thinking/commit/9b21b3629b6ac4c8d8be8022836bfc2ab4edc8a4))
* improve autoSave error handling and prevent race conditions ([#123](https://github.com/uddhav/creative-thinking/issues/123)) ([5f409ea](https://github.com/uddhav/creative-thinking/commit/5f409ea42ccf340c22fc8e8956182bb6e666554a))
* improve Cross-Cultural Integration implementation ([e6b0d02](https://github.com/uddhav/creative-thinking/commit/e6b0d0214fc4ba433c234325e67a14ad2d4dd4c5)), closes [#96](https://github.com/uddhav/creative-thinking/issues/96)
* prevent array access vulnerabilities throughout codebase ([#103](https://github.com/uddhav/creative-thinking/issues/103)) ([1506e0f](https://github.com/uddhav/creative-thinking/commit/1506e0fcb4d6bb06e5903f420396e6e2ea090d0f))
* prevent risk dismissal escalation for non-risky scenarios ([#124](https://github.com/uddhav/creative-thinking/issues/124)) ([eadce79](https://github.com/uddhav/creative-thinking/commit/eadce79c7b4cec7a0946f647b36f97008328c12e))
* remove dummy value fallbacks in session operation validation ([#49](https://github.com/uddhav/creative-thinking/issues/49)) ([9976295](https://github.com/uddhav/creative-thinking/commit/9976295b6750ec45ea528063639f9d6865c275fa))
* resolve all CI pipeline errors ([51f1978](https://github.com/uddhav/creative-thinking/commit/51f19781d94e2acb4e795ceaad11c70e1c0ca208))
* resolve all CI pipeline failures ([fa1ae91](https://github.com/uddhav/creative-thinking/commit/fa1ae91064f705d45b399c939afabb7b784a3c46))
* resolve all ESLint errors and warnings ([#121](https://github.com/uddhav/creative-thinking/issues/121)) ([94ffa4a](https://github.com/uddhav/creative-thinking/commit/94ffa4aaf764566f26699570543ebfd92a2602f6))
* resolve all failing tests and improve test coverage ([341d9da](https://github.com/uddhav/creative-thinking/commit/341d9da07c6d7ee1bef55d4f4903c034510147a4))
* resolve all TypeScript and ESLint errors blocking CI build ([735239d](https://github.com/uddhav/creative-thinking/commit/735239df67b6c7a09f38fa408f782f0db285e847))
* resolve CI failures with ESLint v9 and test imports ([dfc8a79](https://github.com/uddhav/creative-thinking/commit/dfc8a797ec246c0b492df2ddeeef63ef3a08baba))
* resolve CI workflow configuration issues ([9ba0037](https://github.com/uddhav/creative-thinking/commit/9ba00370af594893b14cbb40e8aef415b3e34ba0))
* resolve ESLint errors in PDA-SCAMPER implementation ([feb23ef](https://github.com/uddhav/creative-thinking/commit/feb23ef040f7bb37b2de3963acd7cbbceccfd516))
* resolve lint errors and rebuild dist files ([dbc014a](https://github.com/uddhav/creative-thinking/commit/dbc014a82e1c4717caeee1a2d18bb4ac403efa92))
* resolve lint errors in session management tests ([1a3f468](https://github.com/uddhav/creative-thinking/commit/1a3f468ba95dd7b02f85f6a15abb1a98a64b15c3))
* resolve linting issues ([c7a8c2b](https://github.com/uddhav/creative-thinking/commit/c7a8c2be4159fd9b40be420a723864a53d2e3acc))
* resolve majority of ESLint errors ([4586006](https://github.com/uddhav/creative-thinking/commit/45860060ef97c1546a95a891532271183c0b78cb))
* resolve remaining CI workflow issues ([35bffc5](https://github.com/uddhav/creative-thinking/commit/35bffc56797c0d6656564f3a7535b9b58b3e4aca))
* simplify session cleanup logic and improve memory management ([7ebbab2](https://github.com/uddhav/creative-thinking/commit/7ebbab201b972d4b52b0de2dcfc70b137530ef37)), closes [#54](https://github.com/uddhav/creative-thinking/issues/54)
* track package-lock.json for CI dependency caching ([39a4e4e](https://github.com/uddhav/creative-thinking/commit/39a4e4e3b5aa6b73f0b3607a95dd59d43c0d116c))
* update test assertion for standardized error format ([86eb41c](https://github.com/uddhav/creative-thinking/commit/86eb41cde594eed9628a8c6b68879dd519db8687))


### Build System

* update dist files with plan cleanup implementation ([765f8cf](https://github.com/uddhav/creative-thinking/commit/765f8cf638e8109dc56fe0aafe3e1c800059dd0c))


### Continuous Integration

* **deps:** bump actions/configure-pages from 4 to 5 ([#45](https://github.com/uddhav/creative-thinking/issues/45)) ([6737a4a](https://github.com/uddhav/creative-thinking/commit/6737a4aeea6e182ec791468244a385bc707a9abf))
* **deps:** bump codecov/codecov-action from 4 to 5 ([#40](https://github.com/uddhav/creative-thinking/issues/40)) ([21fb6c7](https://github.com/uddhav/creative-thinking/commit/21fb6c71bc10462f4cfde703a868974ddd2f6932))
* **deps:** bump docker/build-push-action from 5 to 6 ([#39](https://github.com/uddhav/creative-thinking/issues/39)) ([5689ed2](https://github.com/uddhav/creative-thinking/commit/5689ed21e940b94f2414d7109d7c6fe728fea8e2))
* **deps:** bump softprops/action-gh-release from 1 to 2 ([#38](https://github.com/uddhav/creative-thinking/issues/38)) ([dfac703](https://github.com/uddhav/creative-thinking/commit/dfac703321a5ec37ca45336ad65bcd3d2850fa6d))


### Styles

* fix lint errors in escape protocol tests ([6a63e8f](https://github.com/uddhav/creative-thinking/commit/6a63e8fb4a011d6b98946570eb5ef9ed13632a51))
* fix prettier formatting for CI compliance ([effd093](https://github.com/uddhav/creative-thinking/commit/effd093ea9980fb64028db64d7ed752f540cd042))


### Tests

* add comprehensive test suite for option generation and technique implementations ([57a004f](https://github.com/uddhav/creative-thinking/commit/57a004ff68edea8ca54d1fe6aa2004cb7af484c9)), closes [#50](https://github.com/uddhav/creative-thinking/issues/50)
* add comprehensive tests for escape protocols ([6f91422](https://github.com/uddhav/creative-thinking/commit/6f914222a195bf4b60d3fbd1d5df75148e8f8ca0))
* add comprehensive unit tests for core ergodicity features ([d0787b8](https://github.com/uddhav/creative-thinking/commit/d0787b8a8149506a5fa3b5215486d7874ac17569)), closes [#27](https://github.com/uddhav/creative-thinking/issues/27)
* make escape protocol test more flexible for CI environment ([59ed02e](https://github.com/uddhav/creative-thinking/commit/59ed02eebec6e85c24b070c85f589cfcaf190b05))


### Chores

* **deps-dev:** bump @types/node from 22.16.3 to 24.0.15 ([#42](https://github.com/uddhav/creative-thinking/issues/42)) ([02dd27f](https://github.com/uddhav/creative-thinking/commit/02dd27faa27598bde152a18515072bfa986de889))
* **deps-dev:** bump @typescript-eslint/eslint-plugin ([#82](https://github.com/uddhav/creative-thinking/issues/82)) ([19aacd5](https://github.com/uddhav/creative-thinking/commit/19aacd5aba4d09378f5f3bd2597748c33b982429))
* **deps-dev:** bump the development group with 2 updates ([#44](https://github.com/uddhav/creative-thinking/issues/44)) ([0973a73](https://github.com/uddhav/creative-thinking/commit/0973a733710046583a889d17a51ebbdbfd5a2483))
* **deps-dev:** bump the development group with 2 updates ([#79](https://github.com/uddhav/creative-thinking/issues/79)) ([3f9d10f](https://github.com/uddhav/creative-thinking/commit/3f9d10fe4439cf8f1c711296dbc675590e910821))
* **deps-dev:** update vitest from 1.6.1 to 3.2.4 ([#67](https://github.com/uddhav/creative-thinking/issues/67)) ([0f738a1](https://github.com/uddhav/creative-thinking/commit/0f738a115eb3726d496e03c3f0298deee982d28d))
* **deps:** bump @modelcontextprotocol/sdk from 0.5.0 to 1.16.0 ([#47](https://github.com/uddhav/creative-thinking/issues/47)) ([40ee393](https://github.com/uddhav/creative-thinking/commit/40ee393401f4536f74153b27b4b3b3d27262e667))
* **deps:** bump @modelcontextprotocol/sdk from 1.16.0 to 1.17.0 ([#81](https://github.com/uddhav/creative-thinking/issues/81)) ([23862db](https://github.com/uddhav/creative-thinking/commit/23862db019a5d00497ce3846ca10759163cc4aac))


### Documentation

* add critical PR review and pre-commit guidelines ([91c416b](https://github.com/uddhav/creative-thinking/commit/91c416bf2e7c45f6135cc6dc78f12f05cb7da88d)), closes [#93](https://github.com/uddhav/creative-thinking/issues/93)
* correct pre-commit order to test→build→lint ([d7140e6](https://github.com/uddhav/creative-thinking/commit/d7140e6dc8341372443375a2b652cc677912d7a8))
* fix pre-commit order to build→test→lint ([6ed10d6](https://github.com/uddhav/creative-thinking/commit/6ed10d6577cc98210da116b7ec916b125b9f4445))
* update and consolidate documentation ([#68](https://github.com/uddhav/creative-thinking/issues/68)) ([490fec2](https://github.com/uddhav/creative-thinking/commit/490fec25bcd004b12e32af5d67d2b883ca875cdf)), closes [#58](https://github.com/uddhav/creative-thinking/issues/58)
* update CLAUDE.md to reflect 9 techniques including neural_state ([df180e1](https://github.com/uddhav/creative-thinking/commit/df180e1c0500bbfcef37c63721a264159db6e342))


### Code Refactoring

* address PDA-SCAMPER review feedback ([4072470](https://github.com/uddhav/creative-thinking/commit/40724707c5ca08595fb7d1de657ae98dec854e3b))

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
- **Option Generation Integration**: Properly integrated existing engine to activate when flexibility < 0.4
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
- **Step Numbering Issue (#115)**: Fixed cumulative step numbering confusion in multi-technique workflows
- **Option Generation Bug (#95)**: Fixed priority issue preventing option generation from triggering
- **Test Parameter Order**: Fixed reversed parameters in SessionManager tests
- **ESLint Configuration**: Added missing rule for test files, achieving 0 errors/warnings
- **Array Bounds Validation**: Improved validation for out-of-range step numbers

### Changed
- **Total Techniques**: Increased from 12 to 14 enhanced thinking techniques
- **README**: Updated to reflect new technique count and descriptions
- **Execution Response**: Now includes `techniqueProgress` object for better UX in multi-technique workflows

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