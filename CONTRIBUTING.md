# Contributing to inquirerjs-checkbox-search

Thank you for your interest in contributing to the checkbox-search prompt for inquirer.js! This document outlines the process for contributing to this repository.

## Code of Conduct

By participating in this project, you are expected to uphold our code of conduct. Please be respectful and constructive in all interactions.

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git

### Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/inquirer.js-checkbox-search.git
   cd inquirer.js-checkbox-search
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests to verify setup:
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. Make your changes following our coding standards
3. Add or update tests as needed
4. Run the test suite: `npm test`
5. Run type checking: `npm run typecheck`
6. Run linting: `npm run lint`
7. Build the project: `npm run build`

### Testing

- **Unit Tests**: `npm test` - Run the full test suite
- **Coverage**: `npm run test:coverage` - Generate coverage report
- **Watch Mode**: `npm run test -- --watch` - Run tests in watch mode
- **UI**: `npm run test:ui` - Run tests with Vitest UI

All new features should include comprehensive tests covering:
- Positive test cases
- Edge cases
- Error conditions
- User interaction flows

### Code Style

We use ESLint and Prettier for code formatting and style enforcement:

- **Format**: `npm run format` - Format code with Prettier
- **Lint**: `npm run lint` - Check and fix linting issues

The project follows these standards:
- TypeScript strict mode
- ESLint recommended rules
- Prettier formatting
- No unused variables or imports
- Proper JSDoc comments for public APIs

## Commit Message Convention

**IMPORTANT**: This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for automated releases and changelog generation.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature for the user
- **fix**: A bug fix for the user
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without changing functionality
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Changes to build process or external dependencies
- **ci**: Changes to CI configuration
- **chore**: Other changes that don't modify src or test files

### Examples

```bash
# New feature
git commit -m "feat: add tab completion for search terms"

# Bug fix
git commit -m "fix: resolve navigation issue with filtered results"

# Breaking change
git commit -m "feat!: change API to support async filtering

BREAKING CHANGE: the filter option now expects an async function"

# With scope
git commit -m "fix(theme): correct icon colors in dark mode"

# Documentation
git commit -m "docs: add usage examples for async sources"
```

### Breaking Changes

Breaking changes should be indicated by:
1. A `!` after the type: `feat!:` or `fix!:`
2. A `BREAKING CHANGE:` footer explaining the change

## Pull Request Process

1. **Before submitting**:
   - Ensure all tests pass: `npm test`
   - Ensure code is properly formatted: `npm run format`
   - Ensure no linting errors: `npm run lint`
   - Ensure TypeScript compiles: `npm run typecheck`
   - Ensure build succeeds: `npm run build`

2. **Pull Request**:
   - Use a descriptive title following conventional commit format
   - Include a detailed description of changes
   - Reference any related issues
   - Include screenshots/recordings for UI changes
   - Update documentation if needed

3. **Review Process**:
   - All PRs require at least one approval
   - CI checks must pass
   - Code coverage should not decrease significantly

## Project Structure

```
├── src/
│   ├── index.ts          # Main prompt implementation
│   ├── types.ts          # TypeScript type definitions
│   └── *.test.ts         # Test files
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
├── dist/                 # Built output (generated)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # Documentation
```

## Release Process

Releases are automated using [release-please](https://github.com/googleapis/release-please):

1. When PRs are merged to `main`, release-please analyzes commit messages
2. It creates/updates a release PR with version bumps and changelog
3. When the release PR is merged, it:
   - Creates a GitHub release
   - Publishes to npm automatically
   - Updates version tags

Version bumping follows semantic versioning:
- `fix:` commits trigger patch releases (1.0.1)
- `feat:` commits trigger minor releases (1.1.0) 
- `feat!:` or `BREAKING CHANGE:` trigger major releases (2.0.0)

## Getting Help

- **Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the README for usage examples

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

Thank you for contributing! 🚀 