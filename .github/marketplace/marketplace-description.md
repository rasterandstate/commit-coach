# Commit Coach - Intelligent Commit Analysis

## Overview

Commit Coach is an intelligent commit analysis tool that provides actionable insights and coaching for code changes. It automatically analyzes commits to detect missing tests, security vulnerabilities, code quality issues, and provides specific recommendations for improvement.

## Key Features

### 🔍 Intelligent Analysis
- **Missing Tests Detection**: Identifies new/modified source files without corresponding tests
- **Security Vulnerability Scanning**: Detects hardcoded secrets, API keys, and potential security issues
- **Code Quality Analysis**: Flags anti-patterns, large commits, and code quality issues
- **Documentation Gaps**: Identifies missing documentation for new public APIs

### 🛡️ Security Rules
- Hardcoded secrets detection (API keys, tokens, credentials)
- Security pattern identification

### 🧪 Code Quality Rules
- Test coverage analysis for new functionality
- Code quality pattern analysis

### 📝 Workflow Rules
- Large commit detection (200+ lines)
- Commit message quality analysis
- TODO/FIXME comment detection

### 🔄 API & Documentation Rules
- Public API change detection
- Documentation update suggestions
- Feature flag identification
- Breaking change detection

## Usage Examples

### Basic Usage
```yaml
- uses: rasterandstate/commit-coach@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### With Custom Configuration
```yaml
- uses: rasterandstate/commit-coach@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    config-path: '.commit-coach.yml'
    comment: 'true'
    status-check: 'true'
```

### Analyze Specific Commit
```yaml
- uses: rasterandstate/commit-coach@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    commit-hash: 'abc123def456'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token for API access | ✅ | - |
| `config-path` | Path to commit-coach configuration file | ❌ | `.commit-coach.yml` |
| `commit-hash` | Specific commit hash to analyze | ❌ | Current commit |
| `pr-number` | Pull request number | ❌ | Auto-detected |
| `comment` | Post comment on PR | ❌ | `true` |
| `status-check` | Create status check | ❌ | `true` |

## Outputs

The action provides:
- **PR Comments**: Detailed analysis results posted as comments
- **Status Checks**: Pass/fail status based on configured rules
- **Console Output**: Detailed logging and insights
- **Reports**: Structured analysis data for further processing

## Configuration

Create a `.commit-coach.yml` file in your repository root:

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

## Requirements

- **Node.js**: >= 24.0.0
- **Git**: Full history access (fetch-depth: 0)
- **Permissions**: 
  - `contents: read` (to read repository files)
  - `pull-requests: write` (to post comments)
  - `statuses: write` (to create status checks)
  - `checks: write` (to create check runs)

## Categories

- **Code Quality**: Analyzes code patterns and quality metrics
- **CI/CD**: Integrates with continuous integration workflows
- **Code Review**: Provides automated code review insights
- **Security**: Detects security vulnerabilities and issues

## Benefits

- **Early Issue Detection**: Catch problems before they reach production
- **Team Education**: Learn best practices through actionable feedback
- **Consistent Standards**: Enforce coding standards across your team
- **Security First**: Identify security issues before they become vulnerabilities
- **Quality Assurance**: Maintain high code quality with automated insights

## Support

- **Documentation**: [Complete Documentation](https://github.com/rasterandstate/commit-coach#readme)
- **Issues**: [GitHub Issues](https://github.com/rasterandstate/commit-coach/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rasterandstate/commit-coach/discussions)

## License

MIT License - see [LICENSE](https://github.com/rasterandstate/commit-coach/blob/main/LICENSE) file for details.

## Version History

- **v1.0.0**: Initial release with core analysis features, security rules, and GitHub integration

Perfect for teams who want to improve code quality, catch issues early, and maintain consistent development practices.
