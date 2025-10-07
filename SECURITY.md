# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT create a public issue

**Do not** create a public GitHub issue for security vulnerabilities. This could put other users at risk.

### 2. Report privately

Please report security vulnerabilities privately by:

- **Email**: Send details to [security@rasterandstate.com](mailto:security@rasterandstate.com)
- **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature

### 3. Include the following information

When reporting a vulnerability, please include:

- **Description**: A clear description of the vulnerability
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Impact**: What the vulnerability allows an attacker to do
- **Environment**: OS, Node.js version, Commit Coach version
- **Proof of concept**: If applicable, a minimal example demonstrating the issue

### 4. Response timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Resolution**: As quickly as possible, typically within 30 days

### 5. What to expect

- We will acknowledge receipt of your report
- We will investigate and validate the vulnerability
- We will work on a fix
- We will coordinate disclosure with you
- We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

### For Users

- Keep Commit Coach updated to the latest version
- Review your `.commit-coach.yml` configuration for sensitive information
- Use environment variables for sensitive data instead of hardcoding
- Regularly audit your commit messages for accidentally exposed secrets

### For Developers

- Follow secure coding practices
- Validate all inputs
- Use parameterized queries and avoid string concatenation
- Keep dependencies updated
- Review code for potential security issues

## Security Considerations

### Data Handling

- Commit Coach processes commit messages and repository metadata
- No sensitive data should be logged or stored permanently
- Configuration files may contain sensitive information - handle with care

### Permissions

- Commit Coach requires appropriate GitHub permissions to function
- Use the principle of least privilege
- Regularly review and audit permissions

### Dependencies

- We regularly update dependencies to address security vulnerabilities
- Dependabot is configured to automatically create PRs for security updates
- All dependencies are scanned for known vulnerabilities

## Disclosure Policy

We follow responsible disclosure practices:

1. **Private reporting**: Vulnerabilities are reported privately first
2. **Investigation**: We investigate and validate the report
3. **Fix development**: We develop and test a fix
4. **Coordinated disclosure**: We coordinate with the reporter on disclosure timing
5. **Public disclosure**: We publish a security advisory with details

## Security Updates

Security updates will be:

- Released as patch versions (e.g., 1.0.1, 1.0.2)
- Documented in security advisories
- Announced in release notes
- Backported to supported versions when possible

## Contact

For security-related questions or concerns:

- **Email**: [security@rasterandstate.com](mailto:security@rasterandstate.com)
- **GitHub Security**: Use GitHub's private vulnerability reporting

Thank you for helping keep Commit Coach secure! 🔒
