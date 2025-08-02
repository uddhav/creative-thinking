# Release Process

This project uses semantic-release for automated versioning and releases.

## How It Works

1. **Conventional Commits**: All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification
2. **Automated Version Bumping**: Based on commit types:
   - `fix:` triggers a patch release (1.0.0 → 1.0.1)
   - `feat:` triggers a minor release (1.0.0 → 1.1.0)
   - `BREAKING CHANGE:` triggers a major release (1.0.0 → 2.0.0)
3. **Automated Releases**: On push to main branch, semantic-release will:
   - Analyze commits since last release
   - Determine version bump
   - Update CHANGELOG.md
   - Create GitHub release
   - Publish to NPM

## Setup Requirements

### GitHub Secrets

Configure these secrets in your GitHub repository:
- `NPM_TOKEN`: NPM automation token for publishing
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

### NPM Token Setup

1. Login to npmjs.com
2. Go to Access Tokens
3. Generate new token (Automation type)
4. Add as `NPM_TOKEN` secret in GitHub

## Manual Release (if needed)

```bash
# Dry run to see what would be released
npx semantic-release --dry-run

# Actual release (should be done by CI)
npx semantic-release
```

## Commit Guidelines

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Changes to build system
- `ci`: Changes to CI configuration
- `chore`: Other changes that don't modify src or test files

### Examples

```bash
# Patch release
git commit -m "fix: correct risk dismissal threshold calculation"

# Minor release
git commit -m "feat: add quantum thinking technique"

# Major release
git commit -m "feat!: redesign tool API

BREAKING CHANGE: The execute_thinking_step tool now requires a planId parameter"
```

## Troubleshooting

### Release Not Triggering

1. Check commit messages follow conventional format
2. Ensure pushing to main branch
3. Check GitHub Actions logs
4. Verify NPM_TOKEN is set correctly

### Version Already Published

Semantic-release tracks releases via Git tags. If a version was manually published:
1. Create corresponding Git tag: `git tag v1.2.3`
2. Push tag: `git push origin v1.2.3`