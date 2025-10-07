# Contributing to Commit Coach

Thank you for your interest in contributing to Commit Coach! This document provides guidelines and information for contributors.

## Table of Contents

- [Contributing to Commit Coach](#contributing-to-commit-coach)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [Getting Started](#getting-started)
  - [Development Setup](#development-setup)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Available Scripts](#available-scripts)
  - [Making Changes](#making-changes)
    - [Project Structure](#project-structure)
    - [Code Style](#code-style)
    - [Commit Messages](#commit-messages)
  - [Testing](#testing)
    - [Running Tests](#running-tests)
    - [Writing Tests](#writing-tests)
    - [Test Structure](#test-structure)
  - [Submitting Changes](#submitting-changes)
    - [Issue Guidelines](#issue-guidelines)
    - [Pull Request Guidelines](#pull-request-guidelines)
    - [PR Template](#pr-template)
    - [Review Process](#review-process)
  - [Release Process](#release-process)
    - [Versioning](#versioning)
  - [Development Workflow](#development-workflow)
    - [Branch Naming](#branch-naming)
    - [Keeping Your Fork Updated](#keeping-your-fork-updated)
  - [Getting Help](#getting-help)
  - [Recognition](#recognition)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/commit-coach.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 20+ 
- pnpm (recommended) or npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/rasterandstate/commit-coach.git
cd commit-coach

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

### Available Scripts

```bash
# Development
pnpm run dev          # Start development mode
pnpm run build        # Build the project
pnpm run build:action # Build the GitHub Action

# Testing
pnpm run test         # Run tests
pnpm run test:run     # Run tests without coverage
pnpm run test:coverage # Run tests with coverage
pnpm run test:watch   # Run tests in watch mode

# Code Quality
pnpm run lint         # Run ESLint
pnpm run lint:fix     # Fix ESLint issues
pnpm run format       # Format code with Prettier
pnpm run format:check # Check code formatting

# Utilities
pnpm run coach        # Run commit coach CLI
```

## Making Changes

### Project Structure

```
src/
├── action.ts              # GitHub Action entry point
├── analyzers/             # Commit analysis modules
├── config/                # Configuration handling
├── core/                  # Core functionality
├── insights/              # Insight generation
├── integrations/          # External service integrations
├── output/                # Output formatters
└── types/                 # TypeScript type definitions
```

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Commit Messages

We follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(analyzers): add semantic commit analyzer
fix(github): handle missing PR context
docs(readme): update installation instructions
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run specific test file
pnpm test src/analyzers/semantic.test.ts
```

### Writing Tests

- Write tests for new functionality
- Aim for good test coverage
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies

### Test Structure

```typescript
describe('Feature Name', () => {
  describe('when condition is met', () => {
    it('should behave correctly', () => {
      // Test implementation
    });
  });
});
```

## Submitting Changes

### Issue Guidelines

Before submitting a pull request, please:

1. Check if an issue already exists for your feature/bug
2. If not, create an issue to discuss the change
3. Use the appropriate issue template (bug report or feature request)

### Pull Request Guidelines

1. **Create a descriptive title** that clearly explains what the PR does
2. **Link to related issues** using "Fixes #123" or "Related to #123"
3. **Provide a clear description** of what changes were made and why
4. **Include tests** for new functionality
5. **Update documentation** if needed
6. **Ensure all checks pass** (tests, linting, formatting)

### PR Template

We use a pull request template to ensure consistency. Please fill out all relevant sections.

### Review Process

1. Automated checks must pass (CI, tests, linting)
2. At least one maintainer review is required
3. Address any feedback from reviewers
4. Maintainers will merge when ready

## Release Process

Releases are automated using GitHub Actions:

1. Version bumps are handled automatically
2. Changelog is generated from conventional commits
3. GitHub releases are created automatically
4. npm packages are published automatically

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Keeping Your Fork Updated

```bash
# Add upstream remote
git remote add upstream https://github.com/rasterandstate/commit-coach.git

# Fetch latest changes
git fetch upstream

# Merge upstream changes
git checkout main
git merge upstream/main

# Update your feature branch
git checkout feature/your-feature
git rebase main
```

## Getting Help

- Check existing issues and discussions
- Join our community discussions
- Contact maintainers for urgent issues

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

Thank you for contributing to Commit Coach! 🚀
