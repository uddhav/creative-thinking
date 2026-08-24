## [v2.4.0] - 2026-08-24

### Changes from PR #305

- feat: Round 0+1 steering — replay harness, assigned stimuli, crux, provenance, advisory findings

## [v2.2.1] - 2026-08-23

### Changes from PR #303

- feat: fix the eight field-reported issues from the 31-step field session

# [1.1.0](https://github.com/uddhav/creative-thinking/compare/v1.0.0...v1.1.0) (2026-05-18)

### Features

- surface persona blindSpots in LLM step guidance
  ([#270](https://github.com/uddhav/creative-thinking/issues/270))
  ([d4d0603](https://github.com/uddhav/creative-thinking/commit/d4d0603906774d0d519f62035f170cd13f8d375a))

# 1.0.0 (2026-05-10)

- chore!: retire Cloudflare deployment, ship socketes CLI
  ([#265](https://github.com/uddhav/creative-thinking/issues/265))
  ([8cd8a91](https://github.com/uddhav/creative-thinking/commit/8cd8a91caf19d28c88f778e6c480da566e27bfce))

### Bug Fixes

- add missing npm install in dependency checks job
  ([e05a6e5](https://github.com/uddhav/creative-thinking/commit/e05a6e58c7f0efb91252e2043da742aa1f20bd88))
- add neural_state to MCP tool schemas
  ([6c3509d](https://github.com/uddhav/creative-thinking/commit/6c3509d3bfbf259b2e6f1347b68c2b494d2fa9b2))
- add neural_state to MCP tool schemas
  ([#94](https://github.com/uddhav/creative-thinking/issues/94))
  ([f76c0b9](https://github.com/uddhav/creative-thinking/commit/f76c0b9dbd7e0958470d2362af15920b9b7a34f8))
- additional temporal work improvements
  ([4eb89ae](https://github.com/uddhav/creative-thinking/commit/4eb89aedfde125c4373d53bf918958e8732017e4))
- Address code review improvements
  ([0f0601a](https://github.com/uddhav/creative-thinking/commit/0f0601a26266715762272cb60f85b2c12b0af9c7))
- address critical CI pipeline issues from code review
  ([bdaa5af](https://github.com/uddhav/creative-thinking/commit/bdaa5afcf8f510257067407b0b99631734ca7557))
- address critical issues from CI pipeline code review
  ([58ecd94](https://github.com/uddhav/creative-thinking/commit/58ecd942dddbc00bf331013dfc04f6fe820daa76))
- address temporal work design feedback
  ([08ceec4](https://github.com/uddhav/creative-thinking/commit/08ceec480e82eaf1686abf1058e4b4716df8a981))
- **ci:** set HUSKY=0 in semantic-release so it can commit on main
  ([#269](https://github.com/uddhav/creative-thinking/issues/269))
  ([94c79f5](https://github.com/uddhav/creative-thinking/commit/94c79f5df62cf757897ede0c809820df9e896a1a)),
  closes [post-#268](https://github.com/post-/issues/268)
- complete removal of CulturalPath technique remnants
  ([#213](https://github.com/uddhav/creative-thinking/issues/213))
  ([cc395be](https://github.com/uddhav/creative-thinking/commit/cc395bea56e67d350f79cd083d35677318b898ab)),
  closes [#210](https://github.com/uddhav/creative-thinking/issues/210)
- correct progress tracking calculation in SessionCompletionTracker
  ([#175](https://github.com/uddhav/creative-thinking/issues/175))
  ([7031a9d](https://github.com/uddhav/creative-thinking/commit/7031a9d4145b4621facaf0d2874da91a42ba346f))
- eliminate ALL unused parameters without underscore workarounds
  ([#143](https://github.com/uddhav/creative-thinking/issues/143))
  ([#164](https://github.com/uddhav/creative-thinking/issues/164))
  ([8f56c6e](https://github.com/uddhav/creative-thinking/commit/8f56c6e0454e3cf26168e59eeb4ae265b053d4fe))
- enforce three-layer workflow with required planId (fixes
  [#60](https://github.com/uddhav/creative-thinking/issues/60))
  ([597d2b4](https://github.com/uddhav/creative-thinking/commit/597d2b4ad7ee4ea6088ec5fce545ee89f3bb54db))
- format test file to pass lint check
  ([93f31f1](https://github.com/uddhav/creative-thinking/commit/93f31f171ead8d99d1948d9742d647354b4d8e2f))
- handle cross-platform timeout command in CI
  ([ad18796](https://github.com/uddhav/creative-thinking/commit/ad187968987ae53bebd40b84c78dc78e130681bd))
- handle parallel tool calls and add comprehensive tests
  ([#180](https://github.com/uddhav/creative-thinking/issues/180))
  ([54c89a9](https://github.com/uddhav/creative-thinking/commit/54c89a9466c1ad681d25af19eee7a7f0bdb020b7))
- implement completion tracking and enforcement to prevent incomplete analysis
  ([#173](https://github.com/uddhav/creative-thinking/issues/173))
  ([65c87ed](https://github.com/uddhav/creative-thinking/commit/65c87ed7d33e83323220855f62efb2189d42bc0c))
- implement plan cleanup to prevent memory leak
  ([9b21b36](https://github.com/uddhav/creative-thinking/commit/9b21b3629b6ac4c8d8be8022836bfc2ab4edc8a4))
- improve autoSave error handling and prevent race conditions
  ([#123](https://github.com/uddhav/creative-thinking/issues/123))
  ([5f409ea](https://github.com/uddhav/creative-thinking/commit/5f409ea42ccf340c22fc8e8956182bb6e666554a))
- improve Cross-Cultural Integration implementation
  ([e6b0d02](https://github.com/uddhav/creative-thinking/commit/e6b0d0214fc4ba433c234325e67a14ad2d4dd4c5)),
  closes [#96](https://github.com/uddhav/creative-thinking/issues/96)
- improve validation error messages and document required fields
  ([#216](https://github.com/uddhav/creative-thinking/issues/216))
  ([f4fb264](https://github.com/uddhav/creative-thinking/commit/f4fb264467f5549ac3ed3ea61f0e1aa399bef8ba))
- npm audit vulnerabilities + flaky neural_state integration test
  ([#254](https://github.com/uddhav/creative-thinking/issues/254))
  ([2772681](https://github.com/uddhav/creative-thinking/commit/2772681c9ba725335cecf65ce58aecf55e7529a7))
- prevent 'Claude's response was interrupted' errors with array field validation
  ([#181](https://github.com/uddhav/creative-thinking/issues/181))
  ([6aa460d](https://github.com/uddhav/creative-thinking/commit/6aa460da53e582d4cd137680b07bc4f7415a9837))
- prevent array access vulnerabilities throughout codebase
  ([#103](https://github.com/uddhav/creative-thinking/issues/103))
  ([1506e0f](https://github.com/uddhav/creative-thinking/commit/1506e0fcb4d6bb06e5903f420396e6e2ea090d0f))
- prevent LLM from skipping discovery/planning workflow
  ([#119](https://github.com/uddhav/creative-thinking/issues/119))
  ([#129](https://github.com/uddhav/creative-thinking/issues/129))
  ([e6ffaab](https://github.com/uddhav/creative-thinking/commit/e6ffaab912336df103ba556bf9b85d6556ce9868))
- prevent risk dismissal escalation for non-risky scenarios
  ([#124](https://github.com/uddhav/creative-thinking/issues/124))
  ([eadce79](https://github.com/uddhav/creative-thinking/commit/eadce79c7b4cec7a0946f647b36f97008328c12e))
- remove Anthropic-specific parallel handling to fix connection termination
  ([#182](https://github.com/uddhav/creative-thinking/issues/182))
  ([02fd9e4](https://github.com/uddhav/creative-thinking/commit/02fd9e427c7d525ce7aa244fd80882e15d0494e7)),
  closes [#181](https://github.com/uddhav/creative-thinking/issues/181)
- remove behavioral locks and improve risk assessment
  ([#217](https://github.com/uddhav/creative-thinking/issues/217))
  ([03f3e6b](https://github.com/uddhav/creative-thinking/commit/03f3e6b4e6ba503b9daf10685e34668c2613ab1f)),
  closes [#209](https://github.com/uddhav/creative-thinking/issues/209)
- remove dummy value fallbacks in session operation validation
  ([#49](https://github.com/uddhav/creative-thinking/issues/49))
  ([9976295](https://github.com/uddhav/creative-thinking/commit/9976295b6750ec45ea528063639f9d6865c275fa))
- remove expected duration and fix convergence validation issues
  ([#178](https://github.com/uddhav/creative-thinking/issues/178))
  ([69be8f0](https://github.com/uddhav/creative-thinking/commit/69be8f04cd592f2d9c8c267299b3ad20073fd867))
- replace domain classification with adaptive risk language
  ([#209](https://github.com/uddhav/creative-thinking/issues/209))
  ([265bef8](https://github.com/uddhav/creative-thinking/commit/265bef8f03d0786ce16d3acf63fee38133650d1d))
- resolve all CI pipeline errors
  ([51f1978](https://github.com/uddhav/creative-thinking/commit/51f19781d94e2acb4e795ceaad11c70e1c0ca208))
- resolve all CI pipeline failures
  ([fa1ae91](https://github.com/uddhav/creative-thinking/commit/fa1ae91064f705d45b399c939afabb7b784a3c46))
- resolve all ESLint errors and warnings
  ([#121](https://github.com/uddhav/creative-thinking/issues/121))
  ([94ffa4a](https://github.com/uddhav/creative-thinking/commit/94ffa4aaf764566f26699570543ebfd92a2602f6))
- resolve all failing tests and improve test coverage
  ([341d9da](https://github.com/uddhav/creative-thinking/commit/341d9da07c6d7ee1bef55d4f4903c034510147a4))
- resolve all TypeScript and ESLint errors blocking CI build
  ([735239d](https://github.com/uddhav/creative-thinking/commit/735239df67b6c7a09f38fa408f782f0db285e847))
- resolve CI failures with ESLint v9 and test imports
  ([dfc8a79](https://github.com/uddhav/creative-thinking/commit/dfc8a797ec246c0b492df2ddeeef63ef3a08baba))
- resolve CI workflow configuration issues
  ([9ba0037](https://github.com/uddhav/creative-thinking/commit/9ba00370af594893b14cbb40e8aef415b3e34ba0))
- resolve ESLint errors in PDA-SCAMPER implementation
  ([feb23ef](https://github.com/uddhav/creative-thinking/commit/feb23ef040f7bb37b2de3963acd7cbbceccfd516))
- resolve lint errors and rebuild dist files
  ([dbc014a](https://github.com/uddhav/creative-thinking/commit/dbc014a82e1c4717caeee1a2d18bb4ac403efa92))
- resolve lint errors in session management tests
  ([1a3f468](https://github.com/uddhav/creative-thinking/commit/1a3f468ba95dd7b02f85f6a15abb1a98a64b15c3))
- resolve linting issues
  ([c7a8c2b](https://github.com/uddhav/creative-thinking/commit/c7a8c2be4159fd9b40be420a723864a53d2e3acc))
- resolve majority of ESLint errors
  ([4586006](https://github.com/uddhav/creative-thinking/commit/45860060ef97c1546a95a891532271183c0b78cb))
- resolve remaining CI workflow issues
  ([35bffc5](https://github.com/uddhav/creative-thinking/commit/35bffc56797c0d6656564f3a7535b9b58b3e4aca))
- simplify session cleanup logic and improve memory management
  ([7ebbab2](https://github.com/uddhav/creative-thinking/commit/7ebbab201b972d4b52b0de2dcfc70b137530ef37)),
  closes [#54](https://github.com/uddhav/creative-thinking/issues/54)
- track package-lock.json for CI dependency caching
  ([39a4e4e](https://github.com/uddhav/creative-thinking/commit/39a4e4e3b5aa6b73f0b3607a95dd59d43c0d116c))
- update test assertion for standardized error format
  ([86eb41c](https://github.com/uddhav/creative-thinking/commit/86eb41cde594eed9628a8c6b68879dd519db8687))
- use TechniqueRegistry as single source of truth for technique validation
  ([#191](https://github.com/uddhav/creative-thinking/issues/191))
  ([104858a](https://github.com/uddhav/creative-thinking/commit/104858a75516d8446de35a20fdb013b6b38d3514))
- validate object fields to prevent malformed JSON and wrong types
  ([#179](https://github.com/uddhav/creative-thinking/issues/179))
  ([fa13835](https://github.com/uddhav/creative-thinking/commit/fa13835f21dbc61e4e64e52c089e29004957634f))

### Code Refactoring

- extract large methods to improve maintainability
  ([#53](https://github.com/uddhav/creative-thinking/issues/53))
  ([#130](https://github.com/uddhav/creative-thinking/issues/130))
  ([f6f4fd2](https://github.com/uddhav/creative-thinking/commit/f6f4fd2caf956c493d668f4ec771307db4bd07b0)),
  closes [#52](https://github.com/uddhav/creative-thinking/issues/52)
  [#52](https://github.com/uddhav/creative-thinking/issues/52)

### Features

- add analytical verification techniques
  ([#235](https://github.com/uddhav/creative-thinking/issues/235))
  ([b9e0e08](https://github.com/uddhav/creative-thinking/commit/b9e0e0840d72874912109331b07d71c75aba6908)),
  closes [#219](https://github.com/uddhav/creative-thinking/issues/219)
  [#220](https://github.com/uddhav/creative-thinking/issues/220)
  [#221](https://github.com/uddhav/creative-thinking/issues/221)
  [#222](https://github.com/uddhav/creative-thinking/issues/222)
- add CI integration for performance benchmarks
  ([#150](https://github.com/uddhav/creative-thinking/issues/150))
  ([803b677](https://github.com/uddhav/creative-thinking/commit/803b677f155d1ee0937ad9d12831713e33b6276e)),
  closes [#107](https://github.com/uddhav/creative-thinking/issues/107)
  [#127](https://github.com/uddhav/creative-thinking/issues/127)
  [#127](https://github.com/uddhav/creative-thinking/issues/127)
  [#107](https://github.com/uddhav/creative-thinking/issues/107)
- Add comprehensive CI/CD pipeline
  ([8fde78e](https://github.com/uddhav/creative-thinking/commit/8fde78eb4720682a85fda0b20b9f345cc126f174))
- add comprehensive error recovery tests
  ([#75](https://github.com/uddhav/creative-thinking/issues/75))
  ([#149](https://github.com/uddhav/creative-thinking/issues/149))
  ([d69d644](https://github.com/uddhav/creative-thinking/commit/d69d64477f0a1da89d8d34dc32ebd479157f0f5c))
- add comprehensive testing and documentation for parallel execution
  ([#140](https://github.com/uddhav/creative-thinking/issues/140))
  ([#174](https://github.com/uddhav/creative-thinking/issues/174))
  ([9d3e05d](https://github.com/uddhav/creative-thinking/commit/9d3e05d9ba5971c259f91bc51468a1ee91835cd6)),
  closes [#8](https://github.com/uddhav/creative-thinking/issues/8)
- add Design Thinking technique with embedded risk management
  ([3fce524](https://github.com/uddhav/creative-thinking/commit/3fce524e1e64c0aac26ab5cfed1fad7fc41246a4)),
  closes [#3](https://github.com/uddhav/creative-thinking/issues/3)
- Add Disney Method and Nine Windows lateral thinking techniques
  ([#110](https://github.com/uddhav/creative-thinking/issues/110))
  ([41847d1](https://github.com/uddhav/creative-thinking/commit/41847d1d44fdfc84073d758109a8c1209c429e98)),
  closes [#109](https://github.com/uddhav/creative-thinking/issues/109)
- add MCP integration tests (closes [#28](https://github.com/uddhav/creative-thinking/issues/28))
  ([#100](https://github.com/uddhav/creative-thinking/issues/100))
  ([0c9e984](https://github.com/uddhav/creative-thinking/commit/0c9e984fa9597efe2db3120fbe77a1a0ebcdb4bc))
- add Part VII techniques, MCP prompts, and wildcard selection
  ([#186](https://github.com/uddhav/creative-thinking/issues/186))
  ([ee089a0](https://github.com/uddhav/creative-thinking/commit/ee089a05f70113964b79c1a7ccf0bbd0fd052807)),
  closes [#154](https://github.com/uddhav/creative-thinking/issues/154)
  [#155](https://github.com/uddhav/creative-thinking/issues/155)
- add persona system with debate mode and Rory Sutherland rules
  ([#250](https://github.com/uddhav/creative-thinking/issues/250))
  ([8912e4d](https://github.com/uddhav/creative-thinking/commit/8912e4d28c3c6dd25852f6aaa0b995d668868be6))
- add PostgreSQL persistence adapter for production deployments
  ([#248](https://github.com/uddhav/creative-thinking/issues/248))
  ([3207f21](https://github.com/uddhav/creative-thinking/commit/3207f2111db1e41f8b209d02cada6e8f3cbeb07b)),
  closes [#237](https://github.com/uddhav/creative-thinking/issues/237)
  [#241](https://github.com/uddhav/creative-thinking/issues/241)
  [#237](https://github.com/uddhav/creative-thinking/issues/237)
- Add session persistence and management (Issues
  [#17](https://github.com/uddhav/creative-thinking/issues/17),
  [#18](https://github.com/uddhav/creative-thinking/issues/18),
  [#19](https://github.com/uddhav/creative-thinking/issues/19))
  ([7a10c49](https://github.com/uddhav/creative-thinking/commit/7a10c496c42ff353dd634de69d595cc3ecfe6e1b))
- add session resilience and update documentation for DAG-based architecture
  ([#184](https://github.com/uddhav/creative-thinking/issues/184))
  ([aec95f6](https://github.com/uddhav/creative-thinking/commit/aec95f651439b3ffca045a339fc955a1cf576816)),
  closes [#183](https://github.com/uddhav/creative-thinking/issues/183)
- add support for Anthropic parallel tool call format
  ([#177](https://github.com/uddhav/creative-thinking/issues/177))
  ([1c609d4](https://github.com/uddhav/creative-thinking/commit/1c609d483d522b773436bac9acee612ef4e8b42b)),
  closes [#176](https://github.com/uddhav/creative-thinking/issues/176)
- add technique-specific visual indicators to stderr output
  ([#151](https://github.com/uddhav/creative-thinking/issues/151))
  ([cc9b55f](https://github.com/uddhav/creative-thinking/commit/cc9b55fb4b6f194a3bb2900212a4fcc9f6a6df2d)),
  closes [#88](https://github.com/uddhav/creative-thinking/issues/88)
- apply specifications augmentation patch
  ([c288e95](https://github.com/uddhav/creative-thinking/commit/c288e95f3924ea4a98d89234119aed092752d2d9))
- clarify neural techniques and add selection guide
  ([#212](https://github.com/uddhav/creative-thinking/issues/212))
  ([5c6650d](https://github.com/uddhav/creative-thinking/commit/5c6650d5358c98eff316506e0b3fb369876f8b6c)),
  closes [#203](https://github.com/uddhav/creative-thinking/issues/203)
  [#205](https://github.com/uddhav/creative-thinking/issues/205)
- clarify TRIZ vs ParadoxicalProblem distinction
  ([#211](https://github.com/uddhav/creative-thinking/issues/211))
  ([d2b0980](https://github.com/uddhav/creative-thinking/commit/d2b0980694138b39ae23b3363a77a9a248a8724d)),
  closes [#204](https://github.com/uddhav/creative-thinking/issues/204)
- Cloudflare Workers deployment with Agents SDK
  ([#218](https://github.com/uddhav/creative-thinking/issues/218))
  ([3902a2a](https://github.com/uddhav/creative-thinking/commit/3902a2a79b599f02c6cd0131173b9f5d5d7d06cd))
- **cloudflare:** full MCP server port to Workers with OAuth 2.1
  ([#253](https://github.com/uddhav/creative-thinking/issues/253))
  ([e3a11ce](https://github.com/uddhav/creative-thinking/commit/e3a11ce74c347b8c1d7f8bc39ea8456f493512f0))
- Complete Cloudflare Workers deployment with enterprise features
  ([#230](https://github.com/uddhav/creative-thinking/issues/230))
  ([81d425a](https://github.com/uddhav/creative-thinking/commit/81d425aa586398a1a2c92580d353b9fd10cce03b)),
  closes [#131](https://github.com/uddhav/creative-thinking/issues/131)
  [#132](https://github.com/uddhav/creative-thinking/issues/132)
  [#133](https://github.com/uddhav/creative-thinking/issues/133)
  [#134](https://github.com/uddhav/creative-thinking/issues/134)
  [#135](https://github.com/uddhav/creative-thinking/issues/135)
  [#136](https://github.com/uddhav/creative-thinking/issues/136)
  [#137](https://github.com/uddhav/creative-thinking/issues/137)
  [#138](https://github.com/uddhav/creative-thinking/issues/138)
  [#139](https://github.com/uddhav/creative-thinking/issues/139)
  [#140](https://github.com/uddhav/creative-thinking/issues/140)
  [#131](https://github.com/uddhav/creative-thinking/issues/131)
  [#132](https://github.com/uddhav/creative-thinking/issues/132)
  [#133](https://github.com/uddhav/creative-thinking/issues/133)
  [#134](https://github.com/uddhav/creative-thinking/issues/134)
  [#135](https://github.com/uddhav/creative-thinking/issues/135)
  [#136](https://github.com/uddhav/creative-thinking/issues/136)
  [#137](https://github.com/uddhav/creative-thinking/issues/137)
  [#138](https://github.com/uddhav/creative-thinking/issues/138)
  [#139](https://github.com/uddhav/creative-thinking/issues/139)
  [#140](https://github.com/uddhav/creative-thinking/issues/140)
- complete technique selection improvements (Issue
  [#245](https://github.com/uddhav/creative-thinking/issues/245))
  ([#247](https://github.com/uddhav/creative-thinking/issues/247))
  ([f4db46e](https://github.com/uddhav/creative-thinking/commit/f4db46e946df76b69741e9509a16ed3fac1bd909))
- Complete v0.3.0 implementation with full specification alignment
  ([#108](https://github.com/uddhav/creative-thinking/issues/108))
  ([a1a4acb](https://github.com/uddhav/creative-thinking/commit/a1a4acb478b4bb5aa1f44d3a39feaae5fbdf84fb)),
  closes [#98](https://github.com/uddhav/creative-thinking/issues/98)
  [#107](https://github.com/uddhav/creative-thinking/issues/107)
- consolidate cultural techniques into CulturalIntegration
  ([#210](https://github.com/uddhav/creative-thinking/issues/210))
  ([ce42b6c](https://github.com/uddhav/creative-thinking/commit/ce42b6c481df37b0cc7f99a118d46974bd9a554d)),
  closes [#201](https://github.com/uddhav/creative-thinking/issues/201)
- **discovery:** add humanistic quality coverage constraint
  ([#251](https://github.com/uddhav/creative-thinking/issues/251))
  ([b73c761](https://github.com/uddhav/creative-thinking/commit/b73c7613ac08e3951b41318ebdc00d7d94a7dd0b))
- **discovery:** implement multi-factor technique scoring
  ([#246](https://github.com/uddhav/creative-thinking/issues/246))
  ([105c693](https://github.com/uddhav/creative-thinking/commit/105c693a093bce05678b564bd6f8810eb316077f)),
  closes [#239](https://github.com/uddhav/creative-thinking/issues/239)
- enhance domain inference with NLP and remove hardcoded domains
  ([#122](https://github.com/uddhav/creative-thinking/issues/122))
  ([7afd66c](https://github.com/uddhav/creative-thinking/commit/7afd66cb8a53cf1ce9d41276812257dbdeff7897))
- enhance ergodicity visibility and fix test failures
  ([#116](https://github.com/uddhav/creative-thinking/issues/116))
  ([#117](https://github.com/uddhav/creative-thinking/issues/117))
  ([ac79d13](https://github.com/uddhav/creative-thinking/commit/ac79d1359a879d58cf0e0a98dd49544d520762ff))
- enhance SPECIFICATIONS with memory-aware integration patterns
  ([39b0ffa](https://github.com/uddhav/creative-thinking/commit/39b0ffaf7db7cc3602daee4578d6ee8b8870deb3))
- Execution Layer Integration for Parallel Support
  ([#147](https://github.com/uddhav/creative-thinking/issues/147))
  ([#172](https://github.com/uddhav/creative-thinking/issues/172))
  ([fc8da53](https://github.com/uddhav/creative-thinking/commit/fc8da530b1d3d593d64ec9e514176737c962ed5b))
- expand reflexivity tracking to 11 techniques
  ([#215](https://github.com/uddhav/creative-thinking/issues/215))
  ([3cc5c1f](https://github.com/uddhav/creative-thinking/commit/3cc5c1f2693d34999aef2113f8fb2b38d40b2bcc)),
  closes [#214](https://github.com/uddhav/creative-thinking/issues/214)
- implement absorbing barrier early warning system
  ([#63](https://github.com/uddhav/creative-thinking/issues/63))
  ([a16c6ed](https://github.com/uddhav/creative-thinking/commit/a16c6eda09e38192fb1777cfa4cfa88f9f1f18f3)),
  closes [#59](https://github.com/uddhav/creative-thinking/issues/59)
- implement additional creativity techniques with unified framework
  ([26239aa](https://github.com/uddhav/creative-thinking/commit/26239aa45b26face0cc7531fcee6ccbcb02c2d39)),
  closes [#3](https://github.com/uddhav/creative-thinking/issues/3)
- implement behavioral economics techniques
  ([#223](https://github.com/uddhav/creative-thinking/issues/223)-227)
  ([#236](https://github.com/uddhav/creative-thinking/issues/236))
  ([d9496f2](https://github.com/uddhav/creative-thinking/commit/d9496f262a376d63bf501721ccc14c15a2258e22)),
  closes [#223-227](https://github.com/uddhav/creative-thinking/issues/223-227)
  [#224](https://github.com/uddhav/creative-thinking/issues/224)
  [#225](https://github.com/uddhav/creative-thinking/issues/225)
  [#226](https://github.com/uddhav/creative-thinking/issues/226)
  [#227](https://github.com/uddhav/creative-thinking/issues/227)
- implement Biomimetic Path Management technique
  ([#158](https://github.com/uddhav/creative-thinking/issues/158))
  ([#193](https://github.com/uddhav/creative-thinking/issues/193))
  ([c9b621b](https://github.com/uddhav/creative-thinking/commit/c9b621ba1d41229a172673ec47b5a944498ef299))
- implement Collective Intelligence Orchestration technique
  ([591a3ec](https://github.com/uddhav/creative-thinking/commit/591a3eccd886d9e29da7d3b1287484c1f7536ef4)),
  closes [#84](https://github.com/uddhav/creative-thinking/issues/84)
- implement comprehensive enhanced error recovery system
  ([#127](https://github.com/uddhav/creative-thinking/issues/127))
  ([#168](https://github.com/uddhav/creative-thinking/issues/168))
  ([028d198](https://github.com/uddhav/creative-thinking/commit/028d198d2f1cfe930308665e4cc9dd25b28759d3))
- implement convergence technique handler
  ([#144](https://github.com/uddhav/creative-thinking/issues/144))
  ([#169](https://github.com/uddhav/creative-thinking/issues/169))
  ([51e1469](https://github.com/uddhav/creative-thinking/commit/51e1469f3af63f5c041c3e9db0f2c1c6cb7bbb06)),
  closes [#140](https://github.com/uddhav/creative-thinking/issues/140)
- implement Cross-Cultural Integration technique
  ([c71783f](https://github.com/uddhav/creative-thinking/commit/c71783f359d09f2f67477ae55d472c61456eee79)),
  closes [#84](https://github.com/uddhav/creative-thinking/issues/84)
- implement Cultural Creativity Orchestration Framework
  ([#161](https://github.com/uddhav/creative-thinking/issues/161))
  ([#206](https://github.com/uddhav/creative-thinking/issues/206))
  ([de86262](https://github.com/uddhav/creative-thinking/commit/de86262897a614f3ac51913e80c51dc061e664d7)),
  closes [#160](https://github.com/uddhav/creative-thinking/issues/160)
- implement Cultural Path Navigation technique
  ([#159](https://github.com/uddhav/creative-thinking/issues/159))
  ([#198](https://github.com/uddhav/creative-thinking/issues/198))
  ([1844456](https://github.com/uddhav/creative-thinking/commit/184445637a2746d0d9cb7024ba12b5c478f4e64b))
- implement dual-agent architecture for MCP deployment
  ([#233](https://github.com/uddhav/creative-thinking/issues/233))
  ([9491368](https://github.com/uddhav/creative-thinking/commit/94913686adb4bcb99a087ba9b8b1a862f8d2de27))
- implement ergodicity awareness and path dependency tracking
  ([#62](https://github.com/uddhav/creative-thinking/issues/62))
  ([e380834](https://github.com/uddhav/creative-thinking/commit/e380834ebaeaeffe61462849208420de9e8a382b)),
  closes [#55](https://github.com/uddhav/creative-thinking/issues/55)
- implement escape velocity protocols ([#57](https://github.com/uddhav/creative-thinking/issues/57))
  ([#65](https://github.com/uddhav/creative-thinking/issues/65))
  ([badd538](https://github.com/uddhav/creative-thinking/commit/badd538efbbaf7232710a52f3f269336006b90a2))
- implement First Principles Thinking technique
  ([#162](https://github.com/uddhav/creative-thinking/issues/162))
  ([#197](https://github.com/uddhav/creative-thinking/issues/197))
  ([09ee26c](https://github.com/uddhav/creative-thinking/commit/09ee26c4acc66a93c713aaf39a522507292ddee1))
- implement LLM Handoff Bridge for flexible synthesis (Sub-Issue
  [#145](https://github.com/uddhav/creative-thinking/issues/145))
  ([#170](https://github.com/uddhav/creative-thinking/issues/170))
  ([4d8f1db](https://github.com/uddhav/creative-thinking/commit/4d8f1db430abf4b43b3495ebe8daaa33d06b9916))
- implement memory-suggestive outputs for creative thinking sessions
  ([#92](https://github.com/uddhav/creative-thinking/issues/92))
  ([beef0c6](https://github.com/uddhav/creative-thinking/commit/beef0c6e32ad6f7fa4c6881c4e5fdd69dd46a32f))
- implement Meta-Learning from Path Integration technique
  ([#157](https://github.com/uddhav/creative-thinking/issues/157))
  ([#192](https://github.com/uddhav/creative-thinking/issues/192))
  ([9908dee](https://github.com/uddhav/creative-thinking/commit/9908deef399ab820b3924a744cc181ff3ecf4b81))
- implement Neural State Optimization technique
  ([ace7f6c](https://github.com/uddhav/creative-thinking/commit/ace7f6c19e5677640e6048d8872ba56132802225)),
  closes [#84](https://github.com/uddhav/creative-thinking/issues/84)
- implement Neural State Optimization technique
  ([#93](https://github.com/uddhav/creative-thinking/issues/93))
  ([c90e926](https://github.com/uddhav/creative-thinking/commit/c90e9268845e840355d5cb82671c052094ff0f04))
- implement Neuro-Computational Synthesis technique
  ([#160](https://github.com/uddhav/creative-thinking/issues/160))
  ([#199](https://github.com/uddhav/creative-thinking/issues/199))
  ([4119564](https://github.com/uddhav/creative-thinking/commit/4119564d3953bab17002cc038e2acb612f3164dc))
- implement option generation engine with 8 adaptive strategies
  ([#66](https://github.com/uddhav/creative-thinking/issues/66))
  ([6235298](https://github.com/uddhav/creative-thinking/commit/623529853d58861beeba078d02e77323767305d7))
- implement option generation strategies for new thinking techniques
  ([#105](https://github.com/uddhav/creative-thinking/issues/105))
  ([571120b](https://github.com/uddhav/creative-thinking/commit/571120b57a4f2759b0950cebcb4505b8bb81ec33)),
  closes [#102](https://github.com/uddhav/creative-thinking/issues/102)
- implement Paradoxical Problem Solving technique
  ([#156](https://github.com/uddhav/creative-thinking/issues/156))
  ([#189](https://github.com/uddhav/creative-thinking/issues/189))
  ([2860160](https://github.com/uddhav/creative-thinking/commit/286016010cc1ee1e5de0bbb0d280e55c3029a931))
- implement parallel execution core types and detection
  ([#141](https://github.com/uddhav/creative-thinking/issues/141),
  [#142](https://github.com/uddhav/creative-thinking/issues/142))
  ([#163](https://github.com/uddhav/creative-thinking/issues/163))
  ([f89f5e1](https://github.com/uddhav/creative-thinking/commit/f89f5e1216b10beee90acc7ac8f9555df15a308f)),
  closes [#153](https://github.com/uddhav/creative-thinking/issues/153)
- implement parallel tool call support with Anthropic-style format
  ([#176](https://github.com/uddhav/creative-thinking/issues/176))
  ([7982754](https://github.com/uddhav/creative-thinking/commit/79827545219cc0ff7e5c2e35cffab9dc32fc9fc6))
- implement PDA-SCAMPER enhancement ([#56](https://github.com/uddhav/creative-thinking/issues/56))
  ([65ff7b8](https://github.com/uddhav/creative-thinking/commit/65ff7b8f2639c02bfca99a215613c55c41c5f6f0))
- implement Reality Gradient System (issue
  [#98](https://github.com/uddhav/creative-thinking/issues/98))
  ([#101](https://github.com/uddhav/creative-thinking/issues/101))
  ([e66ca5e](https://github.com/uddhav/creative-thinking/commit/e66ca5e6d89704a2211fb3ec84e41805cbbb9aa5))
- implement reflexivity tracking for TRIZ and Cultural Path techniques
  ([#207](https://github.com/uddhav/creative-thinking/issues/207))
  ([e8d1bf0](https://github.com/uddhav/creative-thinking/commit/e8d1bf0919f8b777a6b7a3d844c8c4d260f9ffd0))
- implement semantic-release for automated versioning
  ([#128](https://github.com/uddhav/creative-thinking/issues/128))
  ([1b3d465](https://github.com/uddhav/creative-thinking/commit/1b3d46565ca58cc64c91483cdc0d002a4d72fe62)),
  closes [#125](https://github.com/uddhav/creative-thinking/issues/125)
- implement sequential thinking integration (closes
  [#87](https://github.com/uddhav/creative-thinking/issues/87))
  ([50d43e8](https://github.com/uddhav/creative-thinking/commit/50d43e8921c706728b3c5acedd13e0860913c8b4))
- implement telemetry/analytics for technique effectiveness
  ([#153](https://github.com/uddhav/creative-thinking/issues/153))
  ([ea519fc](https://github.com/uddhav/creative-thinking/commit/ea519fc10c7c5bba1c06717a55b7ccbdf3abc9e0)),
  closes [#126](https://github.com/uddhav/creative-thinking/issues/126)
- implement Temporal Work Design technique
  ([78fb603](https://github.com/uddhav/creative-thinking/commit/78fb60352b46fe08283f4830b3bccf1eda0fe35b))
- implement three-layer tool architecture and remove legacy tool
  ([100e702](https://github.com/uddhav/creative-thinking/commit/100e702ddc2ee06d24dc137019399bac18201241))
- improve DAG generation with relative time multipliers and hard/soft dependencies
  ([#185](https://github.com/uddhav/creative-thinking/issues/185))
  ([65b3ed4](https://github.com/uddhav/creative-thinking/commit/65b3ed44a1a35292376d3d8890249134942374c7))
- improve technique selection and project cohesiveness (v0.6.0)
  ([#243](https://github.com/uddhav/creative-thinking/issues/243))
  ([18333d3](https://github.com/uddhav/creative-thinking/commit/18333d3c6fe5a9a8fd17f203fc585047b90e5508)),
  closes [#237](https://github.com/uddhav/creative-thinking/issues/237)
  [#238](https://github.com/uddhav/creative-thinking/issues/238)
  [#239](https://github.com/uddhav/creative-thinking/issues/239)
  [#240](https://github.com/uddhav/creative-thinking/issues/240)
  [#241](https://github.com/uddhav/creative-thinking/issues/241)
  [#242](https://github.com/uddhav/creative-thinking/issues/242)
- Integrate unified generative/adversarial framework
  ([6bb1eea](https://github.com/uddhav/creative-thinking/commit/6bb1eeaec4ed2fcad45d99e7e558a5915e964167))
- MCP Sampling - Complete implementation with test fixes
  ([#190](https://github.com/uddhav/creative-thinking/issues/190))
  ([ee6cf5e](https://github.com/uddhav/creative-thinking/commit/ee6cf5e7b483eaf3bff7e5dc4bf4db5fa39c2e92)),
  closes [#135](https://github.com/uddhav/creative-thinking/issues/135)
- Real-time reflexivity warnings and telemetry foundation
  ([#238](https://github.com/uddhav/creative-thinking/issues/238),
  [#241](https://github.com/uddhav/creative-thinking/issues/241))
  ([#249](https://github.com/uddhav/creative-thinking/issues/249))
  ([d517cc2](https://github.com/uddhav/creative-thinking/commit/d517cc271038d562e71dd2c98e5fa6c176f52453))
- refactor session management to use internal state instead of external adapters
  ([#232](https://github.com/uddhav/creative-thinking/issues/232))
  ([77456f6](https://github.com/uddhav/creative-thinking/commit/77456f69cef9244ce1b872e6ebe24b66a7c88364))
- **session:** implement parallel session management infrastructure
  ([#146](https://github.com/uddhav/creative-thinking/issues/146))
  ([#171](https://github.com/uddhav/creative-thinking/issues/171))
  ([9a6caeb](https://github.com/uddhav/creative-thinking/commit/9a6caebc4d48b659ccef80cd2a4e28a5cff5fda5))
- standalone socketes binaries via Bun + extract MCP entry
  ([#268](https://github.com/uddhav/creative-thinking/issues/268))
  ([3f695b4](https://github.com/uddhav/creative-thinking/commit/3f695b4e42e50bf6fc7872f27b5043e13ef5355b))
- standardize error response formats ([#51](https://github.com/uddhav/creative-thinking/issues/51))
  ([6372a13](https://github.com/uddhav/creative-thinking/commit/6372a137532ac4c79da5e12130bc0517e2b288ea))
- v0.3.1 improvements - workflow guidance, ruin risk analysis, and documentation
  ([#118](https://github.com/uddhav/creative-thinking/issues/118))
  ([279ec1c](https://github.com/uddhav/creative-thinking/commit/279ec1c93f0dc7f2192ed1ae119694adad098ef5)),
  closes [#112](https://github.com/uddhav/creative-thinking/issues/112)
  [#116](https://github.com/uddhav/creative-thinking/issues/116)
  [#111](https://github.com/uddhav/creative-thinking/issues/111)
  [#114](https://github.com/uddhav/creative-thinking/issues/114)
  [#113](https://github.com/uddhav/creative-thinking/issues/113)
  [#115](https://github.com/uddhav/creative-thinking/issues/115)
  [#114](https://github.com/uddhav/creative-thinking/issues/114)

### Performance Improvements

- optimize NLP processing and remove redundant keyword matching
  ([#244](https://github.com/uddhav/creative-thinking/issues/244))
  ([1194b95](https://github.com/uddhav/creative-thinking/commit/1194b958de09ea79fd6a2e2ff0624fa5b9a917dd))

### BREAKING CHANGES

- the hosted endpoint at socketes.munshy.app / creative-thinking-mcp.mbfw8r4d6n.workers.dev is gone.
  Clients must switch to the stdio CLI (`npx -y creative-thinking` or `socketes` post-install).

- docs: update CLAUDE.md and README.md for socketes CLI workflow

CLAUDE.md gains a "Running the CLI Locally" subsection covering: launching dist/index.js via
node/npx/socketes, a stdio handshake smoke test, MCP-client registration for development builds, the
stdout/stderr discipline, and the five real env vars (PERSISTENCE_TYPE, PERSISTENCE_PATH,
PERSONA_CATALOG_PATH, TELEMETRY_ENABLED, DISABLE_THOUGHT_LOGGING). Project overview gets one line
clarifying the bin layout and stdio-only transport.

README.md: collapse the two Installation sections into one canonical entry that documents the
`socketes` bin, GitHub-only distribution, and MCP-client registration. Drop the stale "if published
to npm" hint — `creative-thinking` is not on the npm registry.

- feat: add socketes single-turn CLI mirroring the three-tool contract

socketes is a new bin (dist/cli.js) that runs one operation per invocation and exits — discover /
plan / execute / session. State persists between processes on the local filesystem so a session can
span days. Drives the same LateralThinkingServer handlers used by the long-running stdio MCP server,
so contract parity is automatic.

Why: the local stdio MCP server is fine for clients that already speak MCP, but skill-driven flows
where the LLM forks subprocesses need a short-lived CLI with the same shape. Encoded-token state
passing has a 24h TTL and grows with history; FS-backed plans + sessions don't.

Highlights

- src/cli.ts + src/cli/ — yargs dispatcher, four subcommands, JSON-on-stdin escape hatch (flags win
  on collision, undefined flags pass through to stdin), output unwrapped from MCP envelope to
  single-document JSON, errors to stderr with exit 1.
- src/cli/planStore.ts — mirrors the in-memory PlanManager to disk because ResponseBuilder strips
  fields the executor needs (notably `techniques`). hydratePlan() / persistPlan() bracket the plan
  and execute commands.
- src/cli/commands/execute.ts — also calls loadSessionFromPersistence() before dispatch so a fresh
  process picks up disk state. Defaults autoSave: true so disk is the source of truth after each
  step.
- src/index.ts — gate MCP bootstrap (signal handlers, transport, main()) behind isMcpEntryPoint.
  Importing LateralThinkingServer from the CLI no longer starts a stdio server or registers signal
  handlers.
- package.json — repoint socketes bin to dist/cli.js; chmod both bins after build. creative-thinking
  bin still serves the MCP stdio server.
- tests — io.test.ts covers input parsing in-process; cli.integration.test has one cross-process
  subprocess test for the plan→execute→execute hydration path that genuinely needs real
  subprocesses.

Parallelism: plan response surfaces executionGraph.parallelizableGroups. Concurrent invocations
against different sessionIds are safe; same sessionId is last-writer-wins (SessionLock is in-process
only). Cross-process flock left for later.

CLI defaults: PERSISTENCE_TYPE=filesystem, DISABLE_THOUGHT_LOGGING=true so stdout stays a single
parseable JSON value.

Bug fix in io.ts emit(): use the stream.write callback to schedule process.exit() — calling exit
immediately truncates large payloads when the pipe buffer hasn't drained (~8KB on macOS pipes).

- Performance characteristics have changed significantly with NLP support. Update timeout
  expectations accordingly.

- fix: remove duplicate cultural_integration recommendation

* Fixed critical bug where cultural_integration was recommended twice
* Replaced duplicate with collective_intel (effectiveness 0.9)
* Added temporal_work as third complementary technique (effectiveness 0.85)
* All 28 techniques now properly mapped without duplicates

- Technique count reduced from 22 to 21. The cultural_path technique no longer exists - use
  cultural_integration instead.

- fix: remove remaining cultural_path references found in PR review

* Remove cultural_path from planning.ts technique outcomes and steps
* Update CulturalPathIntegration to CulturalIntegration in SPECIFICATIONS.md
* Update comments from 'Cultural Path' to 'Cultural Integration'
* Remove dist/techniques/CulturalPath\* files

Thanks to PR reviewer for catching these critical issues!

- Techniques 'cross_cultural' and 'cultural_creativity' are replaced by 'cultural_integration'
- ExecutionGraphNode.dependencies now returns NodeDependency[] instead of string[]

- chore: update dist files

- perf: optimize ExecutionGraphGenerator to fix performance regression

* Replace filter().map() chains with single-pass loops
* Eliminate redundant dependency filtering operations
* Track start nodes during graph building instead of separate filter
* Reduces concurrent execution time by ~64%
* Reduces revision chain time by ~55-69%
* Reduces multi-technique workflow time by ~65-69%

- fix: ensure identical execute_thinking_step responses regardless of executionMode

Changes:

- Remove executionMode from techniqueProgress response object
- Make step counting logic always use sequential numbering for multi-technique plans
- Fix SessionCompletionTracker to ignore executionMode when determining step numbering
- Remove 'convergence' from valid techniques list
- Update tests to expect sequential step numbering in all cases

This ensures Claude Desktop doesn't experience connection interruptions due to response structure
differences between parallel and sequential execution modes. All responses are now structurally
identical regardless of the plan's executionMode.

- refactor: remove unused parallel execution infrastructure

* Remove parallelResults and convergenceStrategy fields from ThinkingOperationData
* Remove LLMHandoffBridge class and entire handoff directory (1,500+ lines)
* Remove parallelResults validation from ObjectFieldValidator
* Remove parallelResults from ToolDefinitions schema
* Remove handoff types export from types/index.ts
* Update tests to remove parallelResults references

This completes the removal of all parallel execution remnants that were left over from the
convergence technique removal. The system is now fully sequential-only with no differences in
execute_thinking_step responses regardless of executionMode settings.

- feat: add concurrent request handling with session-level locking

* Implement SessionLock class with async mutex functionality for thread-safe session access
* Add session-level locking to SessionManager to prevent race conditions
* Wrap executeThinkingStep with lock acquisition to ensure atomic operations
* Add comprehensive concurrent execution tests proving 7.78x speed improvement
* Fix all lint errors without using eslint-disable shortcuts
* Server now properly handles multiple simultaneous requests without blocking

The MCP SDK already provides async request handling, but our SessionManager lacked proper
synchronization. This implementation adds session-level locks that maintain parallelism across
different sessions while preventing race conditions within the same session.

Tests demonstrate:

- 10 concurrent requests complete in ~36ms (not 280ms if sequential)
- 100 concurrent requests complete in ~49ms (not 1000ms if sequential)
- Proper isolation between sessions during concurrent access
- No race conditions when multiple requests modify the same session

* fix: add graceful shutdown handling to prevent incomplete_stream errors

- Add signal handlers (SIGINT, SIGTERM, SIGHUP) for graceful shutdown
- Handle transport close/error events properly
- Enhanced SessionManager.destroy() with comprehensive cleanup logging
- Clear all session locks on shutdown to unblock pending operations
- Add SessionLock.destroy() method for proper resource cleanup
- Handle uncaught exceptions and unhandled rejections gracefully
- Add comprehensive graceful shutdown tests

This fixes the "incomplete_stream" error in Claude Desktop by ensuring the MCP server properly
notifies the client and cleans up all resources before terminating. The server now shuts down
gracefully instead of abruptly disconnecting.

- fix: improve WorkflowGuard to validate planId and extend session window

* Extended workflow tracking window from 5 minutes to 24 hours
* Added SessionManager integration to validate planId existence
* Execute_thinking_step now accepted if valid planId exists in SessionManager
* Technique validation happens before workflow checks
* Sessions no longer expire prematurely after 5 minutes
* Added comprehensive tests for planId validation

This fixes the issue where valid execute_thinking_step requests were incorrectly rejected with E207
'Discovery phase skipped' errors when sessions ran longer than 5 minutes or after server restarts.
The guard now properly validates that a planId exists, which proves that discovery and planning were
completed, regardless of when they occurred.

- fix: prevent incomplete_stream error with proper stdio flushing

* Set stdout/stderr to blocking mode before shutdown
* Explicitly flush stdio streams before process exit
* Add small delay to ensure all data is transmitted
* This prevents Claude Desktop from receiving unexpected EOF
* Fixed TypeScript type safety issues for stream handles

- fix: comprehensive fix for incomplete_stream errors

Based on Claude Support guidance, addressing both operational and shutdown issues:

Operational fixes:

- Add comprehensive request logging to track all incoming requests
- Validate response structure before sending to ensure single-message format
- Add stream integrity checks in ResponseBuilder
- Track active requests to prevent shutdown during processing
- Better error handling that always returns valid response structure

Shutdown fixes:

- Replace process.exit() with process.exitCode for graceful termination
- Add connection state management with active request tracking
- Wait for active requests to complete before shutdown (2s timeout)
- Add 5-second forceful shutdown timeout as safety net
- Improved stdio flushing sequence

Debugging improvements:

- Add DEBUG_MCP=true environment variable for verbose logging
- Log all tool calls with timestamps
- Track last 100 requests for diagnostics
- Better error messages with stack traces

This should prevent the "incomplete_stream" errors that occur when:

1. Tool results are malformed or split across messages
2. MCP server disconnects abruptly during active operations
3. Stdio buffers aren't properly flushed on exit

- feat: implement robust parallel execution with Promise.allSettled

* Replace Promise.all with Promise.allSettled for better error handling
* Enable partial results even when some calls fail
* Add detailed performance metrics for success/failure breakdown
* Track individual call durations and error messages
* Resolve failed calls with error responses instead of rejecting
* Fix all TypeScript and ESLint errors for clean build
* Adjust test expectations for realistic performance variance

Benefits:

- More resilient parallel execution that continues despite failures
- Better observability with detailed failure logging
- Partial results returned for successful calls
- Aligns with bug report requirement that failures shouldn't break everything

Added comprehensive robustness tests to verify:

- Mixed success/failure scenarios
- Performance maintained despite failures
- Detailed error information provided
- Partial results properly handled

This completes the parallel execution implementation addressing the bug report.

- None - all public APIs remain unchanged
- Domain assessment now returns actual domain descriptions instead of predefined categories (e.g.,
  "cryptocurrency investment" instead of "financial")

- refactor: remove all hardcoded domain detection for generic risk assessment

* Removed hardcoded domain detection from prompts.ts (financial, health, career, etc.)
* Updated discovery.ts inferDomain() to always return 'general'
* Replaced DOMAIN_PATTERNS with RISK_INDICATOR_PATTERNS in reality/integration.ts
* Updated RuinRiskDiscovery to extract generic risk features instead of domains
* Changed "DOMAIN IDENTIFICATION" to "RISK CHARACTERISTIC ANALYSIS" in prompts
* Updated generateSurvivalConstraints() to use risk features instead of domains
* Fixed all tests to match new generic approach
* Ensured domains emerge naturally from analysis rather than being pigeonholed

This change allows the system to react to non-ergodic domains dynamically without being limited to a
predefined set of domain categories.

- refactor: use Compromise NLP instead of skip word approach in extractDomainFromResponse

- fix: properly use risk indicators and remove unused domain inference

* Remove unused inferDomain function that always returned 'general'
* Actually use detectRiskIndicators output to enhance reality assessments
* Risk indicators now influence confidence levels and add relevant warnings
* Tests verify risk indicator detection and integration
* All lint errors fixed, no workarounds used

- fix: address PR review feedback - improve type safety and code quality

* Add proper TypeScript type definitions for Compromise library
* Add comprehensive error handling for all NLP operations
* Refactor large analyzeWithNLP method into smaller focused helpers
* Add input validation with character limits
* Optimize performance by caching NLP document objects
* All changes address feedback from automated PR review

- fix: critical security vulnerabilities and code quality issues

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

- fix: remove unused import in regex security test

* Remove unused 'it' import from vitest to fix lint error
* Fixes failing Lint & Code Quality CI check

- Session operations no longer use dummy values for missing thinking operation fields

* Split LateralThinkingData into separate interfaces:
  - ThinkingOperationData for thinking operations (six_hats, po, etc.)
  - SessionOperationData for session management (save, load, list, etc.)
* Created separate validation methods for each operation type
* Fixed type safety issues throughout the codebase
* Updated SessionData to use ThinkingOperationData instead of union type
* Fixed early warning system sessionId generation
* Added comprehensive validation tests to ensure no dummy values are used

This change improves type safety and makes validation errors more explicit, preventing silent
failures that could occur with dummy values.

- planId is now required in execute_thinking_step

* Add plan storage to LateralThinkingServer with TTL-based cleanup
* Store plans in planThinkingSession with unique IDs
* Make planId a required parameter in ExecuteThinkingStepInput
* Validate planId exists and matches technique in executeThinkingStep
* Update all tests to include planId parameter
* Update documentation to reflect planId requirement

This ensures users follow the intended workflow:

1. discover_techniques → find suitable techniques
2. plan_thinking_session → create plan (returns planId)
3. execute_thinking_step → execute steps (requires planId)

- lateralthinking tool removed in favor of three-layer architecture

# Changelog

All notable changes to the Creative Thinking MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Real-time Reflexivity Warnings** (#238) - Passive warnings during execution about path
  dependencies
  - Monitors reflexivity constraint thresholds (5+ warning, 10+ critical)
  - Visual warnings via stderr with color-coded severity levels
  - JSON response includes reflexivity state for programmatic access
  - Configurable via `DISABLE_REFLEXIVITY_WARNINGS` environment variable
  - Non-blocking passive output maintains execution flow
  - Suggestions provided for constraint management
  - Foreclosed paths displayed with warning context
- **Usage Analytics Integration** (#241) - Complete telemetry wiring for technique effectiveness
  tracking
  - SessionManager lifecycle tracking (session start/complete with metrics)
  - Recommendation storage and effectiveness tracking (recommended vs selected techniques)
  - Automatic technique pair tracking for complementarity learning
  - Event types: `technique_pair_used`, `technique_recommended`, `session_complete`
  - Metadata fields: `pairSequence`, `pairCompletionRate`, `pairEffectiveness`,
    `recommendedTechniques`, `selectedTechnique`
  - Integrated across all three layers (Discovery, Planning, Execution)
  - Privacy-preserving telemetry with opt-in/opt-out support
  - Foundation for data-driven technique recommendations and complementarity learning
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
