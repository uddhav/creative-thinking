# CI/CD Pipeline Setup Guide

This project uses a comprehensive GitHub Actions CI/CD pipeline with multiple workflows for
different purposes.

## 🚀 Workflows Overview

### 1. **CI Pipeline** (`ci.yml`)

Main continuous integration workflow that runs on every push and PR.

**Jobs:**

- **Lint & Code Quality**: ESLint, TypeScript checks, Prettier formatting
- **Test & Coverage**: Multi-version Node.js testing with coverage reports
- **Build Verification**: Cross-platform builds (Linux, Windows, macOS)
- **Security Scanning**: npm audit, Snyk, secret detection
- **Dependency Checks**: License validation, outdated packages, bundle size
- **Integration Tests**: MCP server startup and configuration tests
- **Release Preparation**: Version bump checks, changelog generation

**Triggers:**

- Push to `main` or `develop`
- Pull requests to `main`
- Manual workflow dispatch

### 2. **PR Checks** (`pr-checks.yml`)

Automated checks specifically for pull requests.

**Features:**

- Semantic PR title validation
- PR size labeling (XS to XXL)
- Auto-labeling based on changed files
- CodeQL security analysis
- Test coverage commenting
- Dependency license review
- Preview documentation generation

### 3. **Release** (`semantic-release.yml`, `pr-version-bump.yml`, `release-binaries.yml`)

The release path is split across three workflows because a repository ruleset requires every change
to `main` to arrive through a pull request. Nothing may push to `main` directly.

1. `semantic-release.yml` — on push to `main`, creates the tag and the GitHub Release. It does not
   write to `main`; tags are not covered by the pull-request rule. Requires Node 22+
   (semantic-release v25). Having tagged, it dispatches the two workflows below.
2. `pr-version-bump.yml` — `workflow_dispatch` only, dispatched by `semantic-release.yml` with the
   tag it just created. Copies that version into `package.json` and `CHANGELOG.md` and opens a
   `chore(release):` PR. It does no version arithmetic: the tag is the decision, this records it.

   It used to run on any PR merging to `main` and derive the bump itself, which raced
   `semantic-release` for the tag and lost every time — five consecutive merges produced a bump PR
   naming an already-published version, one of them lower than `package.json` already held. See
   #325.

3. `release-binaries.yml` — on `v*.*.*` tag push, builds the standalone `socketes` binaries for
   macOS and Linux and uploads them with `SHA256SUMS`.

**Not part of this project:** npm publishing and Docker images. `release.yml` described both and was
deleted — the package is distributed via GitHub only (see `CLAUDE.md` and `README.md`), and its
Release-creation jobs raced `release-binaries.yml` on the same tag trigger.

### 4. **Security** (`security.yml`)

Weekly security scans and on-demand security checks.

**Scans:**

- CodeQL analysis
- OWASP dependency check
- Container vulnerability scanning (Trivy)
- Secret scanning (Trufflehog, Gitleaks)
- Security report generation

### 5. **Documentation** (`docs.yml`)

Automated documentation generation and deployment.

**Features:**

- TypeDoc API documentation
- Technique guides generation
- GitHub Pages deployment
- Documentation index creation

## 📋 Secrets

Every secret the workflows actually reference, and nothing else — checked with
`grep -ro 'secrets\.[A-Z_]*' .github/workflows/`:

- `GITHUB_TOKEN`: provided by Actions; no configuration needed.
- `SNYK_TOKEN`: Snyk security scanning. Optional — the Snyk step is guarded by
  `if: env.SNYK_TOKEN != ''` and is skipped when unset.
- `CLAUDE_CODE_OAUTH_TOKEN`: used by the Claude review workflows.

`NPM_TOKEN`, `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` were listed here and are referenced by no
workflow — they date from the deleted `release.yml`. This project publishes to neither registry.

## 🛠️ Local Development Setup

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage
```

### Linting & Formatting

```bash
npm run lint          # Check for linting errors
npm run lint:fix      # Fix linting errors
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
npm run typecheck     # TypeScript type checking
```

### Build

```bash
npm run build         # Build the project
npm run clean         # Clean build artifacts
```

## 🏷️ PR Labels

The CI automatically applies these labels:

- **Size labels**: `size/XS`, `size/S`, `size/M`, `size/L`, `size/XL`, `size/XXL`
- **Content labels**: `documentation`, `tests`, `dependencies`, `ci`, `docker`
- **Area labels**: `export`, `persistence`, `techniques`, `config`

## 📊 Quality Gates

All PRs must pass these checks:

- ✅ All CI jobs passing
- ✅ No high/critical security vulnerabilities
- ✅ Coverage reported on every run (no minimum is enforced — the 70% that used to sit here was a
  Codecov target that never evaluated anything; see Monitoring below)
- ✅ No linting errors
- ✅ TypeScript compilation successful
- ✅ Semantic PR title

## 🔄 Dependency Management

- **Dependabot**: Weekly dependency updates
- **License check**: Only allows permissive licenses
- **Security audit**: Blocks high/critical vulnerabilities
- **Bundle size**: Monitors build size changes

## 🚢 Release Process

Releases are automatic. Nothing here is done by hand, and `package.json` is **not** edited to start
one — it is written afterwards, to record what was released.

1. Merge a PR to `main` with a Conventional Commit title (`fix:` → patch, `feat:` → minor, `feat!:`
   or a `BREAKING CHANGE:` footer → major).
2. `semantic-release.yml` analyses the commits, creates the tag and the GitHub Release, then
   dispatches:
   - `release-binaries.yml`, which builds the `socketes` binaries for macOS and Linux and uploads
     them with `SHA256SUMS`;
   - `pr-version-bump.yml`, which opens a `chore(release):` PR copying that version into
     `package.json` and `CHANGELOG.md`.
3. Merge the bump PR. It is a `chore`, so it produces no release of its own and the cycle ends.

**Cutting an ad-hoc release** (bypassing semantic-release): bump `package.json`, update
`CHANGELOG.md`, then `git tag vX.Y.Z && git push origin vX.Y.Z`. `release-binaries.yml` fires from
the tag push directly. Note this path does **not** dispatch the bump workflow, which is why the
version is edited by hand here and nowhere else.

**Never roll back a published Release** — fix forward with the next release-worthy commit.

This project publishes **neither to npm nor to Docker Hub**; distribution is via GitHub only, which
is why `dist/` is committed. An earlier version of this section described both, and `release.yml`,
which did them, was deleted (see the note under Release above).

## 📈 Monitoring

- **Build Status**: Check Actions tab for workflow runs
- **Coverage Reports**: the vitest text summary in the Test & Coverage job log, and the full report
  as the `coverage-<node-version>` workflow artifact. There is no external coverage service: a
  Codecov upload used to run here, but no token was ever configured, every upload failed, and the
  step was set not to fail the job — so it reported nothing for as long as it existed and was
  removed rather than fixed.
- **Security Reports**: Available as workflow artifacts
- **Documentation**: Auto-deployed to GitHub Pages

## 🆘 Troubleshooting

### CI Failures

1. Check the specific job logs in GitHub Actions
2. Run tests locally: `npm test`
3. Check linting: `npm run lint`
4. Verify build: `npm run build`

### Common Issues

- **ESLint errors**: Run `npm run lint:fix`
- **Type errors**: Run `npm run typecheck`
- **Test failures**: Check test output and coverage
- **Security issues**: Run `npm audit fix`

---

For questions or issues, please open a GitHub issue or contact the maintainers.
