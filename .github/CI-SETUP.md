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

### 3. **Release** (`release.yml`)

Automated release process for version tags.

**Steps:**

1. Generate release notes from commits
2. Create GitHub release
3. Build platform-specific assets
4. Publish to npm registry
5. Build and push Docker images

**Triggers:**

- Push of version tags (v*.*.\*)
- Manual workflow dispatch

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

## 📋 Required Secrets

Configure these secrets in your GitHub repository settings:

- `NPM_TOKEN`: npm registry authentication token
- `CODECOV_TOKEN`: Codecov.io upload token
- `SNYK_TOKEN`: Snyk security scanning token
- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

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
- ✅ Test coverage maintained (70% minimum)
- ✅ No linting errors
- ✅ TypeScript compilation successful
- ✅ Semantic PR title

## 🔄 Dependency Management

- **Dependabot**: Weekly dependency updates
- **License check**: Only allows permissive licenses
- **Security audit**: Blocks high/critical vulnerabilities
- **Bundle size**: Monitors build size changes

## 🚢 Release Process

1. Update version in `package.json`
2. Commit with message: `chore: bump version to x.y.z`
3. Create and push tag: `git tag vx.y.z && git push --tags`
4. GitHub Actions automatically:
   - Creates release with notes
   - Builds platform packages
   - Publishes to npm
   - Builds Docker images

## 📈 Monitoring

- **Build Status**: Check Actions tab for workflow runs
- **Coverage Reports**: Uploaded to Codecov.io
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
