# inquirerjs-checkbox-search

A multi-select prompt with text filtering/search capability for [inquirer.js](https://github.com/SBoudrias/Inquirer.js).

This prompt combines the functionality of `@inquirer/checkbox` and `@inquirer/search`, allowing users to:
- ✅ **Multi-select** multiple options with checkboxes
- 🔍 **Search/filter** options in real-time as you type
- ⌨️ **Navigate** with arrow keys through filtered results
- ⚡ **Fast** keyboard navigation and selection

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

### Basic Example

```typescript
import checkboxSearch from 'inquirerjs-checkbox-search';

const frameworks = [
  { value: 'react', name: 'React' },
  { value: 'vue', name: 'Vue.js' },
  { value: 'angular', name: 'Angular' },
  { value: 'svelte', name: 'Svelte' },
  { value: 'solid', name: 'SolidJS' },
];

const selected = await checkboxSearch({
  message: 'Which frameworks do you use?',
  choices: frameworks,
});

console.log('Selected:', selected);
// => ['react', 'vue']
```

### With Search Filtering

```typescript
import checkboxSearch from 'inquirerjs-checkbox-search';

const countries = [
  { value: 'us', name: 'United States' },
  { value: 'ca', name: 'Canada' },
  { value: 'uk', name: 'United Kingdom' },
  { value: 'de', name: 'Germany' },
  { value: 'fr', name: 'France' },
  // ... many more countries
];

const selected = await checkboxSearch({
  message: 'Select countries:',
  choices: countries,
  pageSize: 10,
  instructions: 'Type to search, tab to select, enter to confirm',
});
```

### Async/Dynamic Sources

```typescript
import checkboxSearch from 'inquirerjs-checkbox-search';

const selected = await checkboxSearch({
  message: 'Select GitHub repositories:',
  source: async (term, { signal }) => {
    if (!term) {
      // Return popular repos when no search term
      return [
        { value: 'facebook/react', name: 'React' },
        { value: 'vuejs/vue', name: 'Vue.js' },
        { value: 'angular/angular', name: 'Angular' },
      ];
    }

    // Search GitHub API
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${term}&sort=stars&order=desc&per_page=20`,
      { signal }
    );
    const data = await response.json();
    
    return data.items.map(repo => ({
      value: repo.full_name,
      name: `${repo.name} - ${repo.description?.slice(0, 50)}...`,
      description: `⭐ ${repo.stargazers_count} | ${repo.language}`,
    }));
  },
  pageSize: 8,
});
```

## API

### Options

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `message` | `string` | Yes | The question to ask |
| `choices` | `Array<Choice \| string \| Separator>` | No* | Static list of choices |
| `source` | `(term?: string, opt: { signal: AbortSignal }) => Promise<Array<Choice \| string>>` | No* | Async function for dynamic choices |
| `pageSize` | `number` | No | Number of choices to display per page (default: 7) |
| `loop` | `boolean` | No | Whether to loop around when navigating (default: true) |
| `required` | `boolean` | No | Require at least one selection (default: false) |
| `validate` | `(selection: Array<Choice>) => boolean \| string \| Promise<string \| boolean>` | No | Custom validation function |
| `instructions` | `string \| boolean` | No | Custom instructions text or false to hide |
| `theme` | `Theme` | No | Custom theme configuration |
| `default` | `Array<Value>` | No | Initially selected values |
| `filter` | `(items: Array<Choice>, term: string) => Array<Choice>` | No | Custom filter function |

*Either `choices` or `source` must be provided.

### Choice Object

```typescript
type Choice<Value = any> = {
  value: Value;           // The value returned when selected
  name?: string;          // Display text (defaults to value)
  description?: string;   // Additional description shown below
  short?: string;         // Shorter text for final answer
  disabled?: boolean | string; // Whether choice is selectable
  checked?: boolean;      // Initially selected
};
```

### Theme Options

```typescript
type CheckboxSearchTheme = {
  icon: {
    checked: string | ((text: string) => string);      // Icon for selected items (default: ◉)
    unchecked: string | ((text: string) => string);    // Icon for unselected items (default: ◯)
    cursor: string | ((text: string) => string);       // Cursor icon (default: ❯)
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

| Key | Action |
|-----|--------|
| <kbd>Type</kbd> | Filter/search options |
| <kbd>↑</kbd>/<kbd>↓</kbd> | Navigate through options |
| <kbd>Tab</kbd> | Toggle selection of current option |
| <kbd>Escape</kbd> | Clear search filter |
| <kbd>Enter</kbd> | Confirm selection |

## Advanced Examples

### With Validation

```typescript
const selected = await checkboxSearch({
  message: 'Select team members (2-5):',
  choices: teamMembers,
  required: true,
  validate: (selection) => {
    if (selection.length < 2) {
      return 'Please select at least 2 members';
    }
    if (selection.length > 5) {
      return 'Please select no more than 5 members';
    }
    return true;
  },
});
```

### With Custom Theme

```typescript
const selected = await checkboxSearch({
  message: 'Select your favorite fruits:',
  choices: fruits,
  theme: {
    icon: {
      checked: '✅',
      unchecked: '⬜',
      cursor: '👉'
    },
    style: {
      highlight: (text) => `🌟 ${text}`,
      description: (text) => `💬 ${text}`,
      searchTerm: (text) => `🔍 ${text}`
    }
  }
});
```

### With Pre-selected Options

```typescript
const selected = await checkboxSearch({
  message: 'Update your preferences:',
  choices: [
    { value: 'email', name: 'Email notifications' },
    { value: 'sms', name: 'SMS notifications' },
    { value: 'push', name: 'Push notifications' },
  ],
  default: ['email', 'push'], // Pre-select email and push
});
```

### With Custom Filter

```typescript
const selected = await checkboxSearch({
  message: 'Select programming languages:',
  choices: languages,
  filter: (items, term) => {
    // Custom fuzzy matching
    return items.filter(item => 
      item.name.toLowerCase().includes(term.toLowerCase()) ||
      item.value.toLowerCase().includes(term.toLowerCase())
    );
  }
});
```

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
npm test                  # Run all tests
npm run test:coverage     # Run tests with coverage report
npm run test:ui           # Run tests with Vitest UI
npm run test -- --watch   # Run tests in watch mode

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
   npm run test -- --watch    # Watch mode for rapid feedback
   npm run test:ui           # Visual test runner
   ```

3. **Check Coverage**
   ```bash
   npm run test:coverage     # Generate coverage report
   ```

#### Quality Assurance Workflow

1. **Before Committing**
   ```bash
   npm run format            # Auto-format code
   npm run lint              # Check and fix linting issues
   npm run typecheck         # Verify TypeScript types
   npm test                  # Ensure all tests pass
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
3. Run tests: `npm test`
4. Check types: `npm run typecheck`
5. Format & lint: `npm run format && npm run lint`

**Debugging Tests**
1. Use Vitest UI: `npm run test:ui`
2. Add `console.log` or use debugger
3. Run specific test: `npm test -- -t "test name"`

**Updating Dependencies**
1. Update `package.json`
2. Run `npm install`
3. Test compatibility: `npm test`
4. Check build: `npm run build`

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
