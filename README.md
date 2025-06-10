# inquirerjs-checkbox-search

A multi-select prompt with text filtering/search capability for [inquirer.js](https://github.com/SBoudrias/Inquirer.js).

This prompt combines the functionality of `@inquirer/checkbox` and `@inquirer/search`, allowing you to:

- ✅ **Multi-select** multiple options with checkboxes
- 🔍 **Search/filter** options in real-time as you type
- ⌨️ **Navigate** with arrow keys through filtered results

## Installation

<table>
<tr>
  <th>npm</th>
  <th>yarn</th>
  <th>pnpm</th>
</tr>
<tr>
<td>

```sh
npm install inquirerjs-checkbox-search
```

</td>
<td>

```sh
yarn add inquirerjs-checkbox-search
```

</td>
<td>

```sh
pnpm add inquirerjs-checkbox-search
```

</td>
</tr>
</table>

## Usage

### Quick Start

```typescript
import checkboxSearch from 'inquirerjs-checkbox-search';

const selected = await checkboxSearch({
  message: 'Which frameworks do you use?',
  choices: [
    { value: 'react', name: 'React' },
    { value: 'vue', name: 'Vue.js' },
    { value: 'angular', name: 'Angular' },
  ],
});

console.log('Selected:', selected);
// => ['react', 'vue']
```

## API

### Options

| Property       | Type                                                                                | Required | Description                                            |
| -------------- | ----------------------------------------------------------------------------------- | -------- | ------------------------------------------------------ |
| `message`      | `string`                                                                            | Yes      | The question to ask                                    |
| `choices`      | `Array<Choice \| string \| Separator>`                                              | No\*     | Static list of choices                                 |
| `source`       | `(term?: string, opt: { signal: AbortSignal }) => Promise<Array<Choice \| string>>` | No\*     | Async function for dynamic choices                     |
| `pageSize`     | `number`                                                                            | No       | Number of choices to display per page (default: 7)     |
| `loop`         | `boolean`                                                                           | No       | Whether to loop around when navigating (default: true) |
| `required`     | `boolean`                                                                           | No       | Require at least one selection (default: false)        |
| `validate`     | `(selection: Array<Choice>) => boolean \| string \| Promise<string \| boolean>`     | No       | Custom validation function                             |
| `instructions` | `string \| boolean`                                                                 | No       | Custom instructions text or false to hide              |
| `theme`        | `Theme`                                                                             | No       | Custom theme configuration                             |
| `default`      | `Array<Value>`                                                                      | No       | Initially selected values                              |
| `filter`       | `(items: Array<Choice>, term: string) => Array<Choice>`                             | No       | Custom filter function                                 |

\*Either `choices` or `source` must be provided.

### Choice Object

```typescript
type Choice<Value = any> = {
  value: Value; // The value returned when selected
  name?: string; // Display text (defaults to value)
  description?: string; // Additional description shown below
  short?: string; // Shorter text for final answer
  disabled?: boolean | string; // Whether choice is selectable
  checked?: boolean; // Initially selected
};
```

### Theme Options

```typescript
type CheckboxSearchTheme = {
  icon: {
    checked: string | ((text: string) => string);
    unchecked: string | ((text: string) => string);
    cursor: string | ((text: string) => string);
  };
  style: {
    answer: (text: string) => string;
    message: (text: string) => string;
    error: (text: string) => string;
    help: (text: string) => string;
    highlight: (text: string) => string;
    searchTerm: (text: string) => string;
    description: (text: string) => string;
    disabled: (text: string) => string;
  };
  helpMode: 'always' | 'never' | 'auto';
};
```

## Keyboard Controls

| Key                       | Action                             |
| ------------------------- | ---------------------------------- |
| <kbd>Type</kbd>           | Filter/search options              |
| <kbd>↑</kbd>/<kbd>↓</kbd> | Navigate through options           |
| <kbd>Tab</kbd>            | Toggle selection of current option |
| <kbd>Escape</kbd>         | Clear search filter                |
| <kbd>Enter</kbd>          | Confirm selection                  |

## Advanced Features

For detailed examples of advanced features, see the [`examples/`](./examples/) directory:

- **[Basic Multi-Select](./examples/basic.js)** - Simple multi-select functionality
- **[Search Filtering](./examples/search-filtering.js)** - Real-time search with larger lists
- **[Async Source](./examples/async-source.js)** - Dynamic loading with mock API
- **[Custom Theme](./examples/custom-theme.js)** - Custom icons and styling
- **[Validation](./examples/validation.js)** - Input validation and pre-selection
- **[Custom Filter](./examples/custom-filter.js)** - Fuzzy matching filter

**To run examples:**

1. Build the package: `npm run build`
2. Run any example: `node examples/basic.js`

See the [examples README](./examples/README.md) for detailed instructions.

Each example includes detailed comments and demonstrates real-world usage patterns.

## Developer Guide

This section covers the tools and workflows used in this project for contributors and maintainers.

### Tools Overview

#### Build System

- **[tshy](https://github.com/isaacs/tshy)** - Modern TypeScript build tool that generates both ESM and CommonJS outputs
  - Configuration in `package.json` under `tshy` field
  - Builds to `dist/esm/` and `dist/commonjs/`
  - Automatically handles dual exports

#### Package Management

- **npm** - Package manager (npm 9+ required)
- **Node.js 18+** - Runtime requirement
- **package.json** - Standard npm configuration with dual exports

#### Code Quality

- **[ESLint](https://eslint.org/)** - Linting with TypeScript support
  - Configuration: `eslint.config.js`
  - Rules: TypeScript ESLint recommended + Prettier integration
- **[Prettier](https://prettier.io/)** - Code formatting
  - Configuration: `.prettierrc`
- **[TypeScript](https://www.typescriptlang.org/)** - Type checking and compilation
  - Configuration: `tsconfig.json`, `tsconfig.test.json`

#### Testing

- **[Vitest](https://vitest.dev/)** - Fast testing framework
  - Configuration: `vitest.config.ts`
  - Features: TypeScript support, coverage, UI mode, watch mode
- **[@inquirer/testing](https://www.npmjs.com/package/@inquirer/testing)** - Testing utilities for inquirer prompts
- **[@vitest/coverage-v8](https://www.npmjs.com/package/@vitest/coverage-v8)** - Coverage reporting

#### Development Tools

- **[@arethetypeswrong/cli](https://github.com/arethetypeswrong/arethetypeswrong.github.io)** - Package validation for dual exports
- **[rimraf](https://github.com/isaacs/rimraf)** - Cross-platform file deletion

### Development Workflows

#### Setup & Installation

```bash
# Clone and install
git clone <repo-url>
cd inquirer.js-checkbox-search
npm install
```

#### Development Commands

```bash
# Development (watch mode)
npm run dev                # Build in watch mode with tshy

# Building
npm run build             # Build for production
npm run clean             # Clean build artifacts

# Code Quality
npm run lint              # Run ESLint (with --fix)
npm run format            # Format code with Prettier
npm run typecheck         # TypeScript type checking

# Testing
npm test                  # Run all code quality checks + tests
npm run test:unit         # Run unit tests only
npm run test:coverage     # Run tests with coverage report
npm run test:ui           # Run tests with Vitest UI
npm run test:unit -- --watch   # Run tests in watch mode

# Package Validation
npm run attw              # Validate package exports with arethetypeswrong

# Pre-publish
npm run prepublishOnly    # Full build + test + validation pipeline
```

#### File Structure

```
├── src/
│   ├── index.ts          # Main prompt implementation
│   └── *.test.ts         # Test files (excluded from build)
├── dist/                 # Built output (generated by tshy)
│   ├── esm/             # ES modules
│   └── commonjs/        # CommonJS
├── .github/
│   └── workflows/       # CI/CD workflows
├── node_modules/        # Dependencies
├── package.json         # Package config with tshy setup
├── tsconfig.json        # TypeScript config
├── vitest.config.ts     # Test config
├── eslint.config.js     # Linting config
└── .prettierrc          # Formatting config
```

#### Testing Workflow

1. **Write Tests First** (TDD approach)

   - Create test files alongside source files
   - Use `@inquirer/testing` utilities for prompt testing
   - Cover all user interactions and edge cases

2. **Run Tests During Development**

   ```bash
   npm run test:unit -- --watch    # Watch mode for rapid feedback
   npm run test:ui           # Visual test runner
   ```

3. **Check Coverage**
   ```bash
   npm run test:coverage     # Generate coverage report
   ```

#### Quality Assurance Workflow

1. **Before Committing**

   ```bash
   npm test                  # Run all quality checks + tests
   ```

2. **Before Publishing**
   ```bash
   npm run prepublishOnly    # Full validation pipeline
   ```

#### Build & Release Workflow

1. **Development Build**

   ```bash
   npm run build             # One-time build
   npm run dev               # Watch mode for development
   ```

2. **Package Validation**

   ```bash
   npm run attw              # Validate dual exports work correctly
   ```

3. **Release Process** (Automated)
   - Push changes to `main` branch
   - Release Please creates/updates release PR
   - Merge release PR to trigger:
     - GitHub release creation
     - npm package publication
     - Version tag creation

#### Common Development Tasks

**Adding a New Feature**

1. Write tests first (`src/*.test.ts`)
2. Implement feature in `src/index.ts`
3. Run all checks: `npm test`

**Debugging Tests**

1. Use Vitest UI: `npm run test:ui`
2. Add `console.log` or use debugger
3. Run specific test: `npm run test:unit -- -t "test name"`

**Updating Dependencies**

1. Update `package.json`
2. Run `npm install`
3. Test compatibility: `npm test`

**Troubleshooting Build Issues**

1. Clean build: `npm run clean`
2. Reinstall: `rm -rf node_modules package-lock.json && npm install`
3. Check TypeScript: `npm run typecheck`
4. Validate exports: `npm run attw`

#### IDE Setup

For optimal development experience:

1. **VS Code Extensions**

   - TypeScript and JavaScript Language Features (built-in)
   - ESLint extension
   - Prettier extension
   - Vitest extension (optional)

2. **Editor Settings**
   - Format on save with Prettier
   - ESLint auto-fix on save
   - TypeScript strict mode enabled

### Dependencies Overview

#### Runtime Dependencies

- `@inquirer/core` - Core inquirer functionality and hooks
- `@inquirer/figures` - Terminal symbols and icons
- `@inquirer/type` - TypeScript types for inquirer
- `ansi-escapes` - ANSI escape sequences for terminal control
- `yoctocolors-cjs` - Terminal colors (CommonJS compatible)

#### Development Dependencies

- Build: `tshy`, `typescript`, `rimraf`
- Testing: `vitest`, `@inquirer/testing`, `@vitest/coverage-v8`, `@vitest/ui`
- Linting: `eslint`, `@typescript-eslint/*`, `eslint-config-prettier`
- Formatting: `prettier`
- Validation: `@arethetypeswrong/cli`

## Requirements

- Node.js 18 or higher
- npm 9 or higher (for workspaces support)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.
