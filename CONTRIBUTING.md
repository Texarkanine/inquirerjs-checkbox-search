# Contributing

Want to contribute? We'd love to see it! Thoughtful issues and PRs that make the project better are enthusiastically welcomed here!

## Issues

Open an issue for a bug, an idea, or a question.

## Pull requests

1. Fork the repository. If you already have write access, a branch on the origin is fine.
2. Open a pull request against `main` and fill in the pull request template.
3. Title the PR as a [conventional commit](https://www.conventionalcommits.org/): `feat`, `fix`, or `chore`. This repository uses release-please: `feat` and `fix` cut a release; `chore` does not.

Keep the change focused: one concern per pull request when practical.

Prefer a scoped `feat` or `fix` over `chore` when the change should release — for example `feat(ui):`, `fix(docs):`, or `fix(ci):`. `chore` does not cut a release.

Before you open the PR:

- Build succeeds: `npm run build`
- All tests pass: `npm test`
- Code is formatted: `npm run format`
- No lint errors: `npm run lint`
- TypeScript compiles: `npm run typecheck`
- UI changes include screenshots or recordings
- Documentation is updated when the change needs it

CI must pass. Code coverage should not decrease significantly.

## Development Setup

### Prerequisites

- Node.js 22+
- npm 9+
- Git

### Setup

```bash
git clone https://github.com/Texarkanine/inquirerjs-checkbox-search.git
cd inquirerjs-checkbox-search
npm install
npm run build
npm test
```

## Development Workflow

1. Create a branch for the change (`feat/your-feature-name` or `fix/your-bug-fix`).
2. Make the change following the coding standards below.
3. Add or update tests as needed.
4. Build: `npm run build`
5. Run the suite: `npm test`

### Testing

- **Unit Tests**: `npm test` - Run the full test suite
- **Coverage**: `npm run test:coverage` - Generate coverage report
- **Mutation testing (gated)**: `npm run test:mutate:dry` / `npm run test:mutate` — StrykerJS. CI runs it on every PR as _Mutation_; the job fails if the score drops below `thresholds.break` (80 in `stryker.config.json`), or on a crashed run / job timeout.
- **Watch Mode**: `npm run test -- --watch` - Run tests in watch mode
- **UI**: `npm run test:ui` - Run tests with Vitest UI

#### Mutation exclusion ledger

Every mutant removed from the denominator must be justified here (or via an adjacent `// Stryker disable` reason). High scores from unjustified excludes are not acceptable.

| Mechanism                   | Target                                    | Kind         | Reason                                                                                                         |
| --------------------------- | ----------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| `mutator.excludedMutations` | `StringLiteral`                           | presentation | UX copy, empty-string inits, and label literals are outside the semantic contract; the suite must not pin them |
| `mutator.excludedMutations` | `ArrayDeclaration`                        | equivalent   | Empty array literals and React hook dependency-array mutants are non-observable under `@inquirer/testing`      |
| `// Stryker disable`        | `validate = () => true` (`ArrowFunction`) | equivalent   | `() => undefined` also submits (only `false` / string fail validation)                                         |

Accepted remaining survivors (not ignored — disabling the mutator on these lines would also drop load-bearing mutants):

- PageSize `ConditionalExpression` replacing `x !== undefined` with `true` before a numeric compare — equivalent under JavaScript (`undefined < 1` is false)
- PageSize min/max `LogicalOperator` `&&` → `||` — equivalent when `min > max` is compared with `undefined` (relational compare is false)

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

## Releases

Releases are automated using [release-please](https://github.com/googleapis/release-please):

1. When PRs are merged to `main`, release-please analyzes commit messages
2. It creates/updates a release PR with version bumps and changelog
3. When the release PR is merged, it creates a GitHub release, publishes to npm, and updates version tags

Version bumping follows semantic versioning:

- `fix:` commits trigger patch releases (1.0.1)
- `feat:` commits trigger minor releases (1.1.0)
- `feat!:` or `BREAKING CHANGE:` trigger major releases (2.0.0)

## License

By opening a pull request, you license your contribution under this repository's license, and you grant Texarkanine a perpetual, worldwide, non-exclusive right to relicense that contribution as part of this project under any [OSI-approved](https://opensource.org/licenses) license. You keep your copyright.
