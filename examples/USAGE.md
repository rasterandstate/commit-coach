# Usage Examples

## Basic Commands

```bash
# Analyze current commit
commit-coach analyze

# Analyze specific commit
commit-coach analyze --commit abc123

# Different output formats
commit-coach analyze --output report > analysis.json
commit-coach analyze --output comment
```

## GitHub Integration

```bash
# Post to specific PR
commit-coach github --pr 123

# Auto-detect PR from commit
commit-coach github --commit abc123

# Only create status check (no comment)
commit-coach github --pr 123 --no-comment
```

## CI/CD Examples

### GitHub Actions Marketplace (Recommended)
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
    - uses: your-org/commit-coach@v1
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        config-path: '.commit-coach.yml'  # optional
```

> **Note**: Replace `your-org/commit-coach@v1` with the actual action reference once published to the marketplace.

### Manual GitHub Actions Setup
```yaml
- name: Run Commit Coach
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    if [ "${{ github.event_name }}" = "push" ]; then
      pnpm run coach github -- --commit ${{ github.sha }}
    fi
    if [ "${{ github.event_name }}" = "pull_request" ]; then
      pnpm run coach github -- --pr ${{ github.event.number }}
    fi
```

### GitLab CI
```yaml
commit-coach:
  stage: test
  image: node:24
  before_script:
    - npm install -g pnpm
  script:
    - pnpm run coach github -- --commit $CI_COMMIT_SHA
  only:
    - merge_requests
    - main
```

## Configuration Examples

### Custom Rules
```yaml
rules:
  - id: security-check
    enabled: true
    severity: error
    conditions: ["diff.includes('password')"]
    message: "Potential password exposure detected"
```

### Project-Specific Rules
```yaml
rules:
  - id: frontend-tests
    enabled: true
    severity: warning
    conditions: ["file.path.includes('src/components/') && !hasTestFile"]
    message: "React components should have tests"
```