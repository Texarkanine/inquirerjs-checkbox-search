# Contributing to inquirerjs-checkbox-search

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Setup

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/texarkanine/inquirerjs-checkbox-search.git
   cd inquirerjs-checkbox-search
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
4. Build the project: `npm run build`
5. Run the test suite: `npm test`

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

### Demo Generation

Demo GIFs in the README are automatically generated in CI; when you open a PR you'll get a comment on the PR with previews of any demos that changed as a result of your PR.

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for automated releases and changelog generation.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature for the user (triggers minor release)
- **fix**: A bug fix for the user (triggers patch release)
- **chore**: Maintenance tasks that don't affect the user (no release - avoid when possible)

**Note**: `chore` commits do not trigger releases, so they should be avoided in most cases. Instead, use scopes to provide more context:

- `feat(ui): add new search functionality`
- `fix(docs): correct API examples`
- `fix(ci): update Node.js version in workflow`

### Breaking Changes

Breaking changes should be indicated by:

1. A `!` after the type: `feat!:` or `fix!:`
2. A `BREAKING CHANGE:` footer explaining the change

## Pull Request Process

1. **Before submitting**:
   - Ensure build succeeds: `npm run build`
   - Ensure all tests pass: `npm test`
   - Ensure code is properly formatted: `npm run format`
   - Ensure no linting errors: `npm run lint`
   - Ensure TypeScript compiles: `npm run typecheck`

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
