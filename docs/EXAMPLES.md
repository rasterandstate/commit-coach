# Commit Coach Examples

This document provides practical examples of Commit Coach configurations for different project types and use cases.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Project-Specific Examples](#project-specific-examples)
- [Team Workflow Examples](#team-workflow-examples)
- [Advanced Configurations](#advanced-configurations)
- [Troubleshooting Examples](#troubleshooting-examples)

## Basic Configuration

### Minimal Setup

```yaml
# .commit-coach.yml
rules:
  - id: missing-tests
    enabled: true
    severity: warning
    conditions: ["sourceFilesWithoutTests.length > 0"]
    message: "Add tests for new/modified source files"

output:
  format: console
```

### Standard Configuration

```yaml
# .commit-coach.yml
rules:
  # Test coverage
  - id: missing-tests
    enabled: true
    severity: warning
    conditions: ["sourceFilesWithoutTests.length > 0"]
    message: "Consider adding tests for new/modified source files"

  # Commit quality
  - id: large-commit
    enabled: true
    severity: info
    conditions: ["totalLines > 200"]
    message: "Large commit - consider breaking into smaller changes"

  - id: short-commit-message
    enabled: true
    severity: suggestion
    conditions: ["messageLength < 10"]
    message: "Consider adding more context to commit message"

  # API changes
  - id: public-api-removed
    enabled: true
    severity: warning
    conditions: ["removedApis.length > 0"]
    message: "Public API removed - check for downstream dependencies"

output:
  format: console
  maxInsights: 10

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: true
    createStatusCheck: true
```

## Project-Specific Examples

### Node.js/TypeScript Project

```yaml
# .commit-coach.yml
rules:
  # Test coverage for TypeScript
  - id: missing-ts-tests
    enabled: true
    severity: warning
    conditions: [
      "files.some(f => f.path.endsWith('.ts') && f.status !== 'deleted')",
      "!files.some(f => f.path.endsWith('.test.ts') || f.path.endsWith('.spec.ts'))"
    ]
    message: "TypeScript files should have corresponding test files"

  # Package.json changes
  - id: dependency-update
    enabled: true
    severity: info
    conditions: ["files.some(f => f.path === 'package.json')"]
    message: "Dependencies updated - run tests and check for breaking changes"

  # TypeScript-specific patterns
  - id: any-type-usage
    enabled: true
    severity: warning
    conditions: ["diff.includes(': any')"]
    message: "Avoid using 'any' type - use specific types instead"

  # Build configuration
  - id: build-config-change
    enabled: true
    severity: info
    conditions: ["files.some(f => f.path.includes('tsconfig') || f.path.includes('webpack'))"]
    message: "Build configuration changed - verify build still works"

output:
  format: console
  maxInsights: 15
```

### React/Next.js Project

```yaml
# .commit-coach.yml
rules:
  # Component testing
  - id: missing-component-tests
    enabled: true
    severity: warning
    conditions: [
      "files.some(f => f.path.includes('/components/') && f.path.endsWith('.tsx'))",
      "!files.some(f => f.path.includes('.test.') || f.path.includes('.spec.'))"
    ]
    message: "React components should have tests"

  # Hook testing
  - id: missing-hook-tests
    enabled: true
    severity: warning
    conditions: [
      "files.some(f => f.path.includes('use') && f.path.endsWith('.ts'))",
      "!files.some(f => f.path.includes('.test.') || f.path.includes('.spec.'))"
    ]
    message: "Custom hooks should have tests"

  # Performance concerns
  - id: performance-concerns
    enabled: true
    severity: warning
    conditions: [
      "diff.includes('useEffect') && !diff.includes('[]')",
      "diff.includes('useState') && diff.includes('setInterval')"
    ]
    message: "Check for potential performance issues with hooks"

  # Accessibility
  - id: accessibility-check
    enabled: true
    severity: suggestion
    conditions: [
      "files.some(f => f.path.endsWith('.tsx'))",
      "!diff.includes('aria-') && !diff.includes('role=')"
    ]
    message: "Consider adding accessibility attributes"

output:
  format: console
  maxInsights: 12
```

### Python Project

```yaml
# .commit-coach.yml
rules:
  # Python test coverage
  - id: missing-python-tests
    enabled: true
    severity: warning
    conditions: [
      "files.some(f => f.path.endsWith('.py') && f.status !== 'deleted')",
      "!files.some(f => f.path.endsWith('_test.py') || f.path.endsWith('test_.py'))"
    ]
    message: "Python modules should have corresponding test files"

  # Import organization
  - id: import-organization
    enabled: true
    severity: suggestion
    conditions: ["diff.includes('import ') && !diff.includes('from ')"]
    message: "Consider using 'from X import Y' for cleaner imports"

  # Type hints
  - id: missing-type-hints
    enabled: true
    severity: suggestion
    conditions: [
      "files.some(f => f.path.endsWith('.py'))",
      "diff.includes('def ') && !diff.includes('->')"
    ]
    message: "Consider adding type hints to function definitions"

  # Requirements changes
  - id: requirements-update
    enabled: true
    severity: info
    conditions: ["files.some(f => f.path.includes('requirements') || f.path.includes('pyproject.toml'))"]
    message: "Dependencies updated - test in virtual environment"

output:
  format: console
  maxInsights: 10
```

### Go Project

```yaml
# .commit-coach.yml
rules:
  # Go test coverage
  - id: missing-go-tests
    enabled: true
    severity: warning
    conditions: [
      "files.some(f => f.path.endsWith('.go') && !f.path.endsWith('_test.go'))",
      "!files.some(f => f.path.endsWith('_test.go'))"
    ]
    message: "Go packages should have corresponding test files"

  # Error handling
  - id: error-handling
    enabled: true
    severity: warning
    conditions: [
      "diff.includes('func ')",
      "!diff.includes('error') && !diff.includes('Error')"
    ]
    message: "Check if proper error handling is implemented"

  # Go modules
  - id: go-mod-update
    enabled: true
    severity: info
    conditions: ["files.some(f => f.path === 'go.mod' || f.path === 'go.sum')"]
    message: "Go modules updated - run tests and check for breaking changes"

output:
  format: console
  maxInsights: 8
```

## Team Workflow Examples

### Strict Code Review Team

```yaml
# .commit-coach.yml
rules:
  # Mandatory tests
  - id: missing-tests-strict
    enabled: true
    severity: error
    conditions: ["sourceFilesWithoutTests.length > 0"]
    message: "All source files must have tests - this is required"

  # Large commits not allowed
  - id: large-commit-strict
    enabled: true
    severity: error
    conditions: ["totalLines > 100"]
    message: "Commits over 100 lines are not allowed - break into smaller commits"

  # Documentation required
  - id: documentation-required
    enabled: true
    severity: error
    conditions: ["hasNewFeatures && !hasDocUpdates"]
    message: "New features require documentation updates"

  # API changes need approval
  - id: api-changes-strict
    enabled: true
    severity: error
    conditions: ["addedApis.length > 0 || removedApis.length > 0"]
    message: "API changes require team approval - create RFC first"

output:
  format: status-check
  maxInsights: 5

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: true
    createStatusCheck: true
```

### Startup/Fast-Moving Team

```yaml
# .commit-coach.yml
rules:
  # Gentle reminders only
  - id: missing-tests-gentle
    enabled: true
    severity: suggestion
    conditions: ["sourceFilesWithoutTests.length > 0"]
    message: "Consider adding tests when you have time"

  # Large commits warning
  - id: large-commit-gentle
    enabled: true
    severity: info
    conditions: ["totalLines > 500"]
    message: "This is a large commit - consider breaking it up if possible"

  # Security only
  - id: security-check
    enabled: true
    severity: error
    conditions: ["diff.includes('password') || diff.includes('secret')"]
    message: "Potential security issue - review carefully"

output:
  format: comment
  maxInsights: 3

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: true
    createStatusCheck: false
```

### Open Source Project

```yaml
# .commit-coach.yml
rules:
  # Contributor-friendly
  - id: missing-tests-contributor
    enabled: true
    severity: info
    conditions: ["sourceFilesWithoutTests.length > 0"]
    message: "Thanks for contributing! Consider adding tests to help maintain code quality"

  # Documentation for contributors
  - id: documentation-contributor
    enabled: true
    severity: suggestion
    conditions: ["hasNewFeatures && !hasDocUpdates"]
    message: "New features are great! Consider updating documentation to help other contributors"

  # Breaking changes
  - id: breaking-changes-contributor
    enabled: true
    severity: warning
    conditions: ["breakingChanges.length > 0"]
    message: "Breaking changes detected - please update CHANGELOG.md and consider version bump"

  # Code style
  - id: code-style
    enabled: true
    severity: suggestion
    conditions: ["diff.includes('console.log')"]
    message: "Please remove console.log statements before submitting"

output:
  format: comment
  maxInsights: 5

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: true
    createStatusCheck: true
```

## Advanced Configurations

### Multi-Environment Setup

```yaml
# .commit-coach.yml
rules:
  # Environment-specific rules
  - id: env-config-change
    enabled: true
    severity: warning
    conditions: ["files.some(f => f.path.includes('.env') || f.path.includes('config/'))"]
    message: "Environment configuration changed - verify all environments"

  # Database migrations
  - id: migration-check
    enabled: true
    severity: info
    conditions: ["files.some(f => f.path.includes('migration') || f.path.includes('schema'))"]
    message: "Database changes detected - test migration on staging first"

  # Feature flags
  - id: feature-flag-documentation
    enabled: true
    severity: warning
    conditions: ["featureFlags.length > 0"]
    message: "Feature flags added - document in feature flag registry"

output:
  format: report
  maxInsights: 10

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: true
    createStatusCheck: true
```

### CI/CD Integration

```yaml
# .commit-coach.yml
rules:
  # Build system changes
  - id: build-system-change
    enabled: true
    severity: warning
    conditions: ["files.some(f => f.path.includes('Dockerfile') || f.path.includes('.github/workflows'))"]
    message: "Build system changed - verify CI/CD pipeline still works"

  # Deployment files
  - id: deployment-change
    enabled: true
    severity: info
    conditions: ["files.some(f => f.path.includes('deploy') || f.path.includes('k8s'))"]
    message: "Deployment configuration changed - test in staging environment"

  # Infrastructure changes
  - id: infrastructure-change
    enabled: true
    severity: warning
    conditions: ["files.some(f => f.path.includes('terraform') || f.path.includes('cloudformation'))"]
    message: "Infrastructure changes detected - review with DevOps team"

output:
  format: status-check
  maxInsights: 8

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: false
    createStatusCheck: true
```

### Security-Focused Configuration

```yaml
# .commit-coach.yml
rules:
  # Built-in security rules (automatically enabled)
  - id: hardcoded-secrets
    enabled: true
    severity: error
    conditions: ["diff.match(/['\"](sk-|pk_|ghp_|gho_|ghu_|ghs_|ghr_|AKIA|ya29\.)/)"]
    message: "Potential hardcoded secret detected - use environment variables"

  - id: sql-injection-risk
    enabled: true
    severity: error
    conditions: ["diff.match(/query.*\\$\\{.*\\}|query.*\\+.*\\+/)"]
    message: "Potential SQL injection risk - use parameterized queries"

  - id: xss-risk
    enabled: true
    severity: error
    conditions: ["diff.includes('innerHTML') && !diff.includes('textContent')"]
    message: "Potential XSS risk - use textContent instead of innerHTML"

  # Additional security rules
  - id: crypto-usage
    enabled: true
    severity: warning
    conditions: ["diff.includes('crypto') || diff.includes('hash')"]
    message: "Cryptographic code changed - review security implications"

  - id: debug-code
    enabled: true
    severity: warning
    conditions: ["diff.includes('console.log') || diff.includes('debugger')"]
    message: "Debug code detected - remove before merging"

output:
  format: status-check
  maxInsights: 5

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: true
    createStatusCheck: true
```

## Troubleshooting Examples

### Debug Configuration

```yaml
# .commit-coach.yml - Debug version
rules:
  # Debug rule to see all available variables
  - id: debug-variables
    enabled: true
    severity: info
    conditions: ["true"]  # Always trigger
    message: "Debug: totalLines={{totalLines}}, filesChanged={{filesChanged}}, hasNewFeatures={{hasNewFeatures}}"

output:
  format: report  # Use report format to see all data
  maxInsights: 20

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: false
    createStatusCheck: false
```

### Performance Testing

```yaml
# .commit-coach.yml - Performance testing
rules:
  # Test rule performance
  - id: performance-test
    enabled: true
    severity: info
    conditions: ["files.length > 0"]
    message: "Performance test rule triggered"

output:
  format: console
  maxInsights: 1

thresholds:
  minConfidence: 0.1  # Lower threshold for testing
  skipOnSmallChanges: false
```

### Rule Validation

```yaml
# .commit-coach.yml - Rule validation
rules:
  # Test each rule type
  - id: test-error
    enabled: true
    severity: error
    conditions: ["false"]  # Should not trigger
    message: "This should not appear"

  - id: test-warning
    enabled: true
    severity: warning
    conditions: ["false"]  # Should not trigger
    message: "This should not appear"

  - id: test-info
    enabled: true
    severity: info
    conditions: ["true"]  # Should trigger
    message: "Info rule working correctly"

  - id: test-suggestion
    enabled: true
    severity: suggestion
    conditions: ["true"]  # Should trigger
    message: "Suggestion rule working correctly"

output:
  format: console
  maxInsights: 10
```

## Best Practices Summary

1. **Start Simple**: Begin with basic rules and gradually add complexity
2. **Match Your Team**: Configure rules based on your team's workflow and standards
3. **Use Appropriate Severity**: Don't make everything an error
4. **Test Your Rules**: Use the debug configuration to validate your rules
5. **Document Custom Rules**: Add comments explaining complex rule logic
6. **Regular Review**: Periodically review and update your rules as your project evolves

## Getting Help

- Check the [Rules Documentation](RULES.md) for detailed variable reference
- Use the debug configuration to see what variables are available
- Test rules with the demo repository: `examples/setup-test-repo.sh`
- Open an issue if you need help with specific rule configurations
