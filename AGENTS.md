These instructions apply to the entire repository unless a deeper `AGENTS.md` overrides them.

- This is a TypeScript MCP server for structured creative thinking.
- Preserve the core product constraint: the public MCP surface exposes exactly three tools:
  `discover_techniques`, `plan_thinking_session`, and `execute_thinking_step`.
- Keep generated runtime output in `dist/` aligned with source changes when the user asks for
  buildable or release-ready work. `dist/` is intentionally tracked in git.
- Main source lives in `src/`.
- Layer entry points live in `src/layers/`.
- MCP server wiring lives in `src/server/` and `src/index.ts`.
- Technique implementations live in `src/techniques/`.
- Tests live in `src/__tests__/` and nearby `__tests__` folders.
- Prefer focused changes that preserve the existing three-layer architecture: discovery, planning,
  execution.
- Do not add new public MCP tools unless the user explicitly requests an intentional API change.
- Match the existing TypeScript style and keep modules small and composable.
- Avoid editing generated artifacts by hand when the corresponding source file is the real point of
  change.
- Do not remove or untrack `dist/` without explicit user approval.
- Treat files under top-level `node_modules/` and coverage output as generated or installed content;
  do not edit them directly.
- Install dependencies with `npm ci` for routine agent workflows because this repo checks in
  `package-lock.json`.
- Use `npm install` only when the task explicitly requires updating dependencies or regenerating the
  lockfile.
- Prefer targeted validation first, then broader checks if needed.
- Useful commands:
  - `npm run build`
  - `npm run test:run`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run check:all`
- Note that `npm test` triggers a build through `pretest`.
- Respect `.gitignore`; keep dependency folders, coverage, and temporary outputs out of diffs.
- `dist/` is a tracked build artifact in this repo, so update it only when appropriate for the task.
- Do not commit secrets or values from `.env*` files.
- Update `README.md`, `SPECIFICATIONS.md`, or relevant docs when changing public behavior, developer
  workflow, or architecture assumptions.
