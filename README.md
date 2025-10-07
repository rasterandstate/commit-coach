<div align="center">
  <img src=".github/assets/commit-coach.png" alt="Commit Coach Owl Mascot" width="200" />
</div>

# Commit Coach

An intelligent commit analysis tool that provides insights and coaching for code changes.

## What it does

Analyzes commits and provides intelligent insights like:
- **"You added ~120 lines but didn't write tests for module X"**
- **"You removed public method foo() - are downstream consumers affected?"**
- **"You added feature flags - consider documenting them"**
- **"This is a large commit (300+ lines) - consider breaking it up"**

## Quick Start

### GitHub Actions (Recommended)

Add this to your `.github/workflows/commit-coach.yml`:

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
# Install
pnpm add -D commit-coach

# Initialize config
commit-coach init

# Analyze current commit
commit-coach analyze

# GitHub integration
commit-coach github --pr 123
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

## Built-in Rules

- **Test Coverage**: Warns when source files lack tests
- **Public API Changes**: Detects API removals and new APIs
- **Documentation**: Suggests updating docs for new features
- **Commit Quality**: Flags large commits and short messages
- **Breaking Changes**: Detects potential breaking changes

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