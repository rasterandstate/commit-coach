<div align="center">
  <img src=".github/assets/commit-coach.png" alt="Commit Coach Owl Mascot" width="200" />
</div>

# Commit Coach

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Commit%20Coach-blue.svg?logo=github&logoColor=white)](https://github.com/marketplace/actions/commit-coach)
[![Version](https://img.shields.io/github/v/release/rasterandstate/commit-coach?logo=github)](https://github.com/rasterandstate/commit-coach/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen.svg)](https://nodejs.org/)

An intelligent commit analysis tool that provides insights and coaching for code changes.

## What it does

Analyzes commits and provides intelligent insights like:
- **"You added ~120 lines but didn't write tests for module X"**
- **"You removed public method foo() - are downstream consumers affected?"**
- **"You added feature flags - consider documenting them"**
- **"This is a large commit (300+ lines) - consider breaking it up"**

## 🎬 Live Demo

See Commit Coach in action with real git workflows:

[![asciicast](https://asciinema.org/a/RVu88qm4Ya1OmLVgKyeiH5taB.svg)](https://asciinema.org/a/RVu88qm4Ya1OmLVgKyeiH5taB)

## Quick Start

### GitHub Actions (Recommended)

#### Marketplace Installation (Coming Soon)
Once published to the GitHub Marketplace, you'll be able to install with one click or use:

```yaml
name: Commit Coach
on: [push, pull_request]
jobs:
  commit-coach:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - uses: rasterandstate/commit-coach@v1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
```

#### Direct Repository Installation
For now, you can use the action directly from the repository:

```yaml
name: Commit Coach
on: [push, pull_request]
jobs:
  commit-coach:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - uses: rasterandstate/commit-coach@v1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
```

### CLI Installation

```bash
# Install from source (after cloning the repository)
npm install
npm run build

# Initialize config
./dist/index.js init

# Analyze current commit
./dist/index.js analyze

# GitHub integration
./dist/index.js github --pr 123
```

## Configuration

Create `.commit-coach.yml`:

```yaml
rules:
  - id: missing-tests
    enabled: true
    severity: warning
    conditions: ["sourceFilesWithoutTests.length > 0"]
    message: "Consider adding tests for new/modified source files"

output:
  format: console  # console, comment, status-check, report
  maxInsights: 10

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: true
    createStatusCheck: true
```

## Git Hooks

This project uses [Lefthook](https://github.com/evilmartians/lefthook) for git hooks to ensure code quality:

### Pre-commit Hooks
- **Formatting**: Runs Prettier to check code formatting
- **Linting**: Runs ESLint to check code quality
- **Type Checking**: Runs TypeScript compiler to check types
- **Tests**: Runs tests for changed files

### Pre-push Hooks
- **Build**: Ensures the project compiles successfully
- **Test Coverage**: Runs full test suite with coverage
- **Action Build**: Builds the GitHub Action

### Setup
```bash
# Install hooks (done automatically after npm install)
npm run hooks:install

# Run hooks manually
npm run hooks:run pre-commit
npm run hooks:run pre-push

# Uninstall hooks
npm run hooks:uninstall
```

## Built-in Rules

### 🔒 Security Rules
- **Hardcoded Secrets**: Detects API keys, tokens, and credentials
- **Security Patterns**: Identifies potential security vulnerabilities

### 🧪 Code Quality Rules
- **Test Coverage**: Warns when source files lack tests
- **Code Quality**: Analyzes code patterns and quality metrics

### 📝 Workflow Rules
- **Large Commits**: Warns about large commits (200+ lines)
- **Commit Messages**: Flags short or unclear commit messages
- **TODO Comments**: Detects TODO/FIXME comments in code

### 🔄 API & Documentation Rules
- **Public API Changes**: Detects API removals and new APIs
- **Documentation**: Suggests updating docs for new features
- **Feature Flags**: Identifies new feature flags that need documentation
- **Breaking Changes**: Detects potential breaking changes

📖 **[Complete Rules Documentation](docs/RULES.md)** - Learn how to create custom rules and configure all available options.

📋 **[Configuration Examples](docs/EXAMPLES.md)** - See practical examples for different project types and team workflows.

## Documentation

- 📚 **[Documentation Index](docs/README.md)** - Complete documentation overview
- 📖 **[Rules Reference](docs/RULES.md)** - All available variables, conditions, and examples
- 📋 **[Configuration Examples](docs/EXAMPLES.md)** - Project-specific configurations
- 🚀 **[Usage Examples](examples/USAGE.md)** - Command-line usage and CI/CD integration

## Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token for API access | ✅ | - |
| `config-path` | Path to commit-coach config file | ❌ | `.commit-coach.yml` |
| `commit-hash` | Specific commit to analyze | ❌ | Current commit |
| `pr-number` | Pull request number | ❌ | Auto-detected |
| `comment` | Post comment on PR | ❌ | `true` |
| `status-check` | Create status check | ❌ | `true` |

## License

MIT License - see LICENSE file for details.