# Commit Coach Rules Documentation

This document provides comprehensive information about creating and configuring rules in Commit Coach.

## Table of Contents

- [Rule Configuration](#rule-configuration)
- [Available Variables](#available-variables)
- [Built-in Rules](#built-in-rules)
- [Custom Rule Examples](#custom-rule-examples)
- [Rule Conditions Reference](#rule-conditions-reference)
- [Best Practices](#best-practices)

## Rule Configuration

Rules are defined in your `.commit-coach.yml` configuration file. Each rule has the following structure:

```yaml
rules:
  - id: unique-rule-id
    enabled: true
    severity: error | warning | info | suggestion
    conditions: ["condition1", "condition2"]
    message: "Human-readable message"
    metadata:
      # Optional additional data
```

### Rule Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier for the rule |
| `enabled` | boolean | ✅ | Whether the rule is active |
| `severity` | string | ✅ | Rule severity level |
| `conditions` | array | ✅ | JavaScript expressions to evaluate |
| `message` | string | ✅ | Message shown when rule triggers |
| `metadata` | object | ❌ | Additional rule configuration |

### Severity Levels

- **`error`**: Critical issues that should block commits
- **`warning`**: Important issues that should be addressed
- **`info`**: Informational insights
- **`suggestion`**: Helpful recommendations

## Available Variables

When writing rule conditions, you have access to the following variables:

### Commit Information

| Variable | Type | Description |
|----------|------|-------------|
| `hash` | string | Commit hash |
| `message` | string | Commit message |
| `author` | string | Commit author |
| `date` | Date | Commit date |
| `messageLength` | number | Length of commit message |

### File Changes

| Variable | Type | Description |
|----------|------|-------------|
| `files` | array | Array of changed files |
| `totalLines` | number | Total lines added + deleted |
| `filesChanged` | number | Number of files changed |
| `testFilesChanged` | number | Number of test files changed |
| `documentationFilesChanged` | number | Number of documentation files changed |

### Semantic Analysis Variables

#### Test Coverage
| Variable | Type | Description |
|----------|------|-------------|
| `testFilesAdded` | array | Test files that were added |
| `testFilesModified` | array | Test files that were modified |
| `sourceFilesWithoutTests` | array | Source files without corresponding tests |
| `testCoverageRatio` | number | Ratio of source files with tests (0-1) |

#### Public API Changes
| Variable | Type | Description |
|----------|------|-------------|
| `addedApis` | array | Public APIs that were added |
| `removedApis` | array | Public APIs that were removed |
| `modifiedApis` | array | Public APIs that were modified |

#### Documentation Changes
| Variable | Type | Description |
|----------|------|-------------|
| `hasNewFeatures` | boolean | Whether new features were added |
| `hasDocUpdates` | boolean | Whether documentation was updated |
| `documentationChanges` | array | Documentation files that changed |

#### Feature Flags
| Variable | Type | Description |
|----------|------|-------------|
| `featureFlags` | array | Feature flags that were added/modified |

#### Breaking Changes
| Variable | Type | Description |
|----------|------|-------------|
| `breakingChanges` | array | Breaking changes detected |

#### General Analysis
| Variable | Type | Description |
|----------|------|-------------|
| `hasTodos` | boolean | Whether TODO/FIXME comments were found |
| `diff` | string | Full diff content |

## Built-in Rules

Commit Coach comes with several built-in rules that you can enable/disable:

### Test Coverage Rules

```yaml
- id: missing-tests
  enabled: true
  severity: warning
  conditions: ["sourceFilesWithoutTests.length > 0"]
  message: "Consider adding tests for new/modified source files"
```

### Public API Rules

```yaml
- id: public-api-removed
  enabled: true
  severity: warning
  conditions: ["removedApis.length > 0"]
  message: "Public API removed - check for downstream dependencies"

- id: public-api-added
  enabled: true
  severity: info
  conditions: ["addedApis.length > 0"]
  message: "New public APIs added - consider documenting them"
```

### Commit Quality Rules

```yaml
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
```

### Documentation Rules

```yaml
- id: missing-documentation
  enabled: true
  severity: suggestion
  conditions: ["hasNewFeatures && !hasDocUpdates"]
  message: "Consider updating documentation for new features"
```

### Feature Flag Rules

```yaml
- id: feature-flags-added
  enabled: true
  severity: suggestion
  conditions: ["featureFlags.length > 0"]
  message: "Document new feature flags and their purpose"
```

### Breaking Change Rules

```yaml
- id: breaking-changes
  enabled: true
  severity: error
  conditions: ["breakingChanges.length > 0"]
  message: "Breaking changes detected - update version and changelog"
```

### Security Rules

```yaml
- id: hardcoded-secrets
  enabled: true
  severity: error
  conditions: ["diff.match(/['\"](sk-|pk_|ghp_|gho_|ghu_|ghs_|ghr_|AKIA|ya29\.)/)"]
  message: "Potential hardcoded secret detected - use environment variables instead"

- id: sql-injection-risk
  enabled: true
  severity: error
  conditions: ["diff.match(/query.*\\$\\{.*\\}|query.*\\+.*\\+/)"]
  message: "Potential SQL injection risk detected - use parameterized queries"

- id: xss-risk
  enabled: true
  severity: error
  conditions: ["diff.includes('innerHTML') && !diff.includes('textContent')"]
  message: "Potential XSS risk - use textContent instead of innerHTML"
```

### Code Quality Rules

```yaml
- id: debug-code
  enabled: true
  severity: warning
  conditions: ["diff.includes('console.log') || diff.includes('debugger') || diff.includes('alert(')"]
  message: "Debug code detected - remove before merging"

- id: large-file-addition
  enabled: true
  severity: warning
  conditions: ["files.some(f => f.status === 'added' && f.additions > 1000)"]
  message: "Large file(s) added - consider if these should be in version control"

- id: dependency-update
  enabled: true
  severity: info
  conditions: ["files.some(f => f.path.includes('package.json') || f.path.includes('yarn.lock') || f.path.includes('pnpm-lock.yaml'))"]
  message: "Dependencies updated - run tests and check for breaking changes"

- id: missing-error-handling
  enabled: true
  severity: warning
  conditions: ["diff.includes('async ') && !diff.includes('try') && !diff.includes('catch')"]
  message: "Async function added without error handling - consider try/catch blocks"

- id: typescript-any-type
  enabled: true
  severity: warning
  conditions: ["files.some(f => f.path.endsWith('.ts')) && diff.includes(': any')"]
  message: "Avoid using 'any' type - use specific types for better type safety"

- id: todo-comments
  enabled: true
  severity: info
  conditions: ["hasTodos"]
  message: "TODO/FIXME comments found - track these items"
```

### Workflow Rules

```yaml
- id: merge-conflict-markers
  enabled: true
  severity: error
  conditions: ["diff.includes('<<<<<<<') || diff.includes('>>>>>>>') || diff.includes('=======')"]
  message: "Merge conflict markers detected - resolve conflicts before committing"

- id: binary-file-addition
  enabled: true
  severity: warning
  conditions: ["files.some(f => f.status === 'added' && /\.(jpg|jpeg|png|gif|pdf|zip|exe|dll|bin|so|dylib)$/i.test(f.path))"]
  message: "Binary file(s) added - ensure they're necessary and properly sized"

- id: config-file-changes
  enabled: true
  severity: info
  conditions: ["files.some(f => f.path.includes('config') || f.path.includes('.env') || f.path.includes('settings'))"]
  message: "Configuration files changed - verify all environments are updated"
```

## Custom Rule Examples

### Security Rules

```yaml
# Detect potential password exposure
- id: password-exposure
  enabled: true
  severity: error
  conditions: ["diff.toLowerCase().includes('password')"]
  message: "Potential password exposure detected - review carefully"

# Detect hardcoded secrets
- id: hardcoded-secrets
  enabled: true
  severity: error
  conditions: ["diff.match(/['\"](sk-|pk_|ghp_|gho_|ghu_|ghs_|ghr_)/)"]
  message: "Potential hardcoded secret detected"
```

### Performance Rules

```yaml
# Detect large file additions
- id: large-file-addition
  enabled: true
  severity: warning
  conditions: ["files.some(f => f.status === 'added' && f.additions > 1000)"]
  message: "Large file added - consider if this should be in version control"

# Detect potential performance issues
- id: performance-concerns
  enabled: true
  severity: warning
  conditions: ["diff.includes('console.log') || diff.includes('debugger')"]
  message: "Debug code detected - remove before merging"
```

### Code Style Rules

```yaml
# Enforce specific file extensions
- id: wrong-file-extension
  enabled: true
  severity: warning
  conditions: ["files.some(f => f.path.endsWith('.js') && f.diff.includes('import'))"]
  message: "Consider using .mjs or .ts extension for ES modules"

# Detect missing semicolons
- id: missing-semicolons
  enabled: true
  severity: suggestion
  conditions: ["diff.match(/^\+.*[^;{}]\s*$/m)"]
  message: "Consider adding semicolons for consistency"
```

### Project-Specific Rules

```yaml
# Enforce specific patterns for your project
- id: api-version-check
  enabled: true
  severity: warning
  conditions: ["files.some(f => f.path.includes('api/') && !f.diff.includes('version'))"]
  message: "API changes should include version updates"

# Check for required files
- id: missing-changelog
  enabled: true
  severity: warning
  conditions: ["hasNewFeatures && !files.some(f => f.path.includes('CHANGELOG'))"]
  message: "New features should be documented in CHANGELOG"
```

## Rule Conditions Reference

### String Operations

```javascript
// Contains text
"message.includes('fix')"
"diff.includes('TODO')"

// Regex matching
"message.match(/^feat:/)"
"diff.match(/console\.log/)"

// String length
"message.length > 50"
"message.length < 10"
```

### Array Operations

```javascript
// Array length
"files.length > 5"
"sourceFilesWithoutTests.length > 0"

// Array filtering
"files.filter(f => f.status === 'added').length > 3"
"files.some(f => f.path.includes('test'))"

// Array includes
"files.some(f => f.path.endsWith('.md'))"
```

### Numeric Comparisons

```javascript
// Line counts
"totalLines > 200"
"totalLines < 10"

// File counts
"filesChanged > 5"
"testFilesChanged === 0"

// Ratios
"testCoverageRatio < 0.8"
```

### Boolean Logic

```javascript
// AND operations
"hasNewFeatures && !hasDocUpdates"
"totalLines > 100 && filesChanged > 3"

// OR operations
"message.includes('fix') || message.includes('bug')"

// NOT operations
"!files.some(f => f.path.includes('test'))"
```

### File Path Operations

```javascript
// File extensions
"files.some(f => f.path.endsWith('.js'))"
"files.some(f => f.path.endsWith('.test.js'))"

// Directory patterns
"files.some(f => f.path.startsWith('src/'))"
"files.some(f => f.path.includes('/api/'))"

// File patterns
"files.some(f => f.path.includes('config'))"
```

## Best Practices

### 1. Start Simple

Begin with basic conditions and gradually add complexity:

```yaml
# Start with this
- id: large-commit
  conditions: ["totalLines > 200"]

# Then refine
- id: large-commit
  conditions: ["totalLines > 200 && filesChanged > 3"]
```

### 2. Use Appropriate Severity Levels

- **Error**: Blocking issues (security, breaking changes)
- **Warning**: Important issues (missing tests, large commits)
- **Info**: Informational (new features, API changes)
- **Suggestion**: Helpful tips (documentation, code style)

### 3. Provide Clear Messages

```yaml
# Good
message: "Large commit detected - consider breaking into smaller changes"

# Better
message: "Commit has 250+ lines - consider splitting into focused commits for easier review"
```

### 4. Use Metadata for Configuration

```yaml
- id: large-commit
  conditions: ["totalLines > threshold"]
  message: "Large commit detected"
  metadata:
    threshold: 200
    skipPatterns: ["*.md", "*.json"]
```

### 5. Test Your Rules

Use the demo repository to test your rules:

```bash
# Test with demo repo
cd commit-coach-test-repo
commit-coach analyze --output report
```

### 6. Document Custom Rules

Add comments to explain complex rules:

```yaml
rules:
  # Security: Detect potential API key exposure
  - id: api-key-exposure
    enabled: true
    severity: error
    conditions: ["diff.match(/['\"](sk-|pk_|ghp_)/)"]
    message: "Potential API key detected - use environment variables instead"
```

### 7. Performance Considerations

- Avoid complex regex patterns in frequently triggered rules
- Use specific conditions to reduce false positives
- Consider using `skipOnSmallChanges` for expensive rules

## Advanced Examples

### Complex Business Logic

```yaml
# Only warn about missing tests for significant changes
- id: missing-tests-significant
  enabled: true
  severity: warning
  conditions: [
    "sourceFilesWithoutTests.length > 0",
    "totalLines > 50",
    "!files.some(f => f.path.includes('migration'))"
  ]
  message: "Significant changes without tests - consider adding test coverage"
```

### Conditional Rules

```yaml
# Different rules for different file types
- id: js-file-tests
  enabled: true
  severity: warning
  conditions: [
    "files.some(f => f.path.endsWith('.js') && f.status !== 'deleted')",
    "!files.some(f => f.path.endsWith('.test.js'))"
  ]
  message: "JavaScript files should have corresponding test files"

- id: ts-file-tests
  enabled: true
  severity: warning
  conditions: [
    "files.some(f => f.path.endsWith('.ts') && f.status !== 'deleted')",
    "!files.some(f => f.path.endsWith('.test.ts'))"
  ]
  message: "TypeScript files should have corresponding test files"
```

### Integration with External Tools

```yaml
# Check for specific patterns that indicate external tool usage
- id: dependency-update
  enabled: true
  severity: info
  conditions: ["files.some(f => f.path.includes('package.json') || f.path.includes('yarn.lock'))"]
  message: "Dependencies updated - run tests and check for breaking changes"
```

## Troubleshooting

### Common Issues

1. **Rule not triggering**: Check that conditions are correctly formatted
2. **False positives**: Make conditions more specific
3. **Performance issues**: Simplify complex regex patterns
4. **Syntax errors**: Validate JavaScript expressions

### Debugging

Use the report output format to see what variables are available:

```bash
commit-coach analyze --output report > debug.json
```

This will show you the exact values of all variables for debugging your conditions.

## Contributing

Found a bug in the rules system or want to add new built-in rules? Please open an issue or submit a pull request!

For more information, see:
- [Configuration Guide](CONFIGURATION.md)
- [API Reference](API.md)
- [Examples](../examples/)
