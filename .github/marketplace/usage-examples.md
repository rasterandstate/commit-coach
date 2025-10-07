# Usage Examples

This document provides comprehensive usage examples for Commit Coach in various scenarios.

## Basic GitHub Actions Integration

### Simple Setup
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

### With Custom Configuration
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
        config-path: '.commit-coach.yml'
        comment: 'true'
        status-check: 'true'
```

## Advanced Configuration Examples

### Node.js Project
```yaml
name: Commit Coach - Node.js
on: [push, pull_request]

jobs:
  commit-coach:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - uses: actions/setup-node@v4
      with:
        node-version: '24'
    - uses: rasterandstate/commit-coach@v1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        config-path: '.commit-coach.nodejs.yml'
```

### Python Project
```yaml
name: Commit Coach - Python
on: [push, pull_request]

jobs:
  commit-coach:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    - uses: rasterandstate/commit-coach@v1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        config-path: '.commit-coach.python.yml'
```

### React/TypeScript Project
```yaml
name: Commit Coach - React
on: [push, pull_request]

jobs:
  commit-coach:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - uses: actions/setup-node@v4
      with:
        node-version: '24'
    - uses: rasterandstate/commit-coach@v1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        config-path: '.commit-coach.react.yml'
```

## Configuration File Examples

### Basic Configuration
```yaml
# .commit-coach.yml
rules:
  - id: missing-tests
    enabled: true
    severity: warning
    conditions: ["sourceFilesWithoutTests.length > 0"]
    message: "Consider adding tests for new/modified source files"

  - id: security-secrets
    enabled: true
    severity: error
    conditions: ["hardcodedSecrets.length > 0"]
    message: "Hardcoded secrets detected - use environment variables"

output:
  format: console
  maxInsights: 10

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: true
    createStatusCheck: true
```

### Node.js Specific Configuration
```yaml
# .commit-coach.nodejs.yml
rules:
  - id: missing-tests
    enabled: true
    severity: warning
    conditions: ["sourceFilesWithoutTests.length > 0"]
    message: "Consider adding tests for new/modified source files"

  - id: package-json-changes
    enabled: true
    severity: info
    conditions: ["packageJsonModified"]
    message: "Package.json modified - consider updating documentation"

  - id: node-modules-committed
    enabled: true
    severity: error
    conditions: ["nodeModulesCommitted"]
    message: "node_modules should not be committed to version control"

  - id: security-audit
    enabled: true
    severity: warning
    conditions: ["securityVulnerabilities.length > 0"]
    message: "Run 'npm audit' to check for security vulnerabilities"

output:
  format: comment
  maxInsights: 15

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: true
    createStatusCheck: true
```

### Python Specific Configuration
```yaml
# .commit-coach.python.yml
rules:
  - id: missing-tests
    enabled: true
    severity: warning
    conditions: ["sourceFilesWithoutTests.length > 0"]
    message: "Consider adding tests for new/modified source files"

  - id: requirements-changes
    enabled: true
    severity: info
    conditions: ["requirementsModified"]
    message: "Requirements modified - consider updating documentation"

  - id: python-imports
    enabled: true
    severity: warning
    conditions: ["unusedImports.length > 0"]
    message: "Consider removing unused imports"

  - id: security-secrets
    enabled: true
    severity: error
    conditions: ["hardcodedSecrets.length > 0"]
    message: "Hardcoded secrets detected - use environment variables"

output:
  format: comment
  maxInsights: 12

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: true
    createStatusCheck: true
```

### React/TypeScript Configuration
```yaml
# .commit-coach.react.yml
rules:
  - id: missing-tests
    enabled: true
    severity: warning
    conditions: ["sourceFilesWithoutTests.length > 0"]
    message: "Consider adding tests for new/modified source files"

  - id: typescript-any
    enabled: true
    severity: warning
    conditions: ["typescriptAnyUsage.length > 0"]
    message: "Avoid using 'any' type in TypeScript"

  - id: react-hooks
    enabled: true
    severity: info
    conditions: ["reactHooksUsed"]
    message: "React hooks used - ensure proper dependency arrays"

  - id: component-props
    enabled: true
    severity: warning
    conditions: ["componentPropsWithoutTypes.length > 0"]
    message: "Consider adding TypeScript types for component props"

  - id: security-secrets
    enabled: true
    severity: error
    conditions: ["hardcodedSecrets.length > 0"]
    message: "Hardcoded secrets detected - use environment variables"

output:
  format: comment
  maxInsights: 15

integrations:
  github:
    token: "${GITHUB_TOKEN}"
    commentOnPR: true
    createStatusCheck: true
```

## CLI Usage Examples

### Basic CLI Usage
```bash
# Install commit-coach
npm install -g commit-coach

# Analyze current commit
commit-coach analyze

# Analyze specific commit
commit-coach analyze --commit abc123def456

# Use custom config
commit-coach analyze --config .commit-coach.custom.yml
```

### GitHub Integration
```bash
# Analyze PR
commit-coach github --pr 123

# Analyze with custom token
commit-coach github --pr 123 --token $GITHUB_TOKEN

# Analyze specific commit
commit-coach github --commit abc123def456
```

### Configuration Management
```bash
# Initialize config
commit-coach init

# Validate config
commit-coach validate

# List available rules
commit-coach rules
```

## Custom Rules Examples

### Security Rules
```yaml
rules:
  - id: api-keys
    enabled: true
    severity: error
    conditions: ["apiKeysDetected"]
    message: "API keys detected - use environment variables"

  - id: database-urls
    enabled: true
    severity: error
    conditions: ["databaseUrlsDetected"]
    message: "Database URLs detected - use environment variables"

  - id: jwt-secrets
    enabled: true
    severity: error
    conditions: ["jwtSecretsDetected"]
    message: "JWT secrets detected - use environment variables"
```

### Code Quality Rules
```yaml
rules:
  - id: large-functions
    enabled: true
    severity: warning
    conditions: ["functionSize > 50"]
    message: "Large function detected - consider breaking into smaller functions"

  - id: complex-conditions
    enabled: true
    severity: info
    conditions: ["complexConditions.length > 0"]
    message: "Complex conditions detected - consider simplifying"

  - id: duplicate-code
    enabled: true
    severity: warning
    conditions: ["duplicateCodeDetected"]
    message: "Duplicate code detected - consider extracting to shared function"
```

### Documentation Rules
```yaml
rules:
  - id: missing-docs
    enabled: true
    severity: info
    conditions: ["newPublicMethods.length > 0"]
    message: "New public methods should be documented"

  - id: readme-updates
    enabled: true
    severity: info
    conditions: ["newFeaturesAdded && !readmeUpdated"]
    message: "Consider updating README for new features"

  - id: api-docs
    enabled: true
    severity: warning
    conditions: ["apiChangesDetected && !apiDocsUpdated"]
    message: "API changes detected - update API documentation"
```

## Output Format Examples

### Console Output
```yaml
output:
  format: console
  maxInsights: 10
  showDetails: true
  colorize: true
```

### PR Comment Output
```yaml
output:
  format: comment
  maxInsights: 15
  includeSummary: true
  includeRecommendations: true
```

### Status Check Output
```yaml
output:
  format: status-check
  maxInsights: 5
  failOnHighSeverity: true
  includeDetails: true
```

### Report Output
```yaml
output:
  format: report
  maxInsights: 20
  outputFile: "commit-coach-report.json"
  includeMetadata: true
```

## Integration Examples

### With Other Actions
```yaml
name: Code Quality Pipeline
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Run Commit Coach
      uses: rasterandstate/commit-coach@v1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Run security audit
      run: npm audit
```

### With Matrix Strategy
```yaml
name: Multi-Environment Testing
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 24]
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Run Commit Coach
      uses: rasterandstate/commit-coach@v1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        config-path: ".commit-coach.node${{ matrix.node-version }}.yml"
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   ```yaml
   permissions:
     contents: read
     pull-requests: write
     statuses: write
     checks: write
   ```

2. **Token Issues**
   ```yaml
   - uses: rasterandstate/commit-coach@v1
     with:
       github-token: ${{ secrets.GITHUB_TOKEN }}
   ```

3. **Configuration Not Found**
   ```yaml
   - uses: rasterandstate/commit-coach@v1
     with:
       config-path: '.commit-coach.yml'
   ```

### Debug Mode
```yaml
- uses: rasterandstate/commit-coach@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    debug: 'true'
```

## Best Practices

1. **Use appropriate severity levels**
2. **Keep rules focused and actionable**
3. **Test configurations in development first**
4. **Monitor action performance and adjust as needed**
5. **Regularly review and update rules**
6. **Use environment-specific configurations**
7. **Combine with other quality tools for comprehensive coverage**
