# inquirerjs-checkbox-search

[![npm version](https://badge.fury.io/js/inquirerjs-checkbox-search.svg)](https://badge.fury.io/js/inquirerjs-checkbox-search)
[![Build Status](https://github.com/mobaxterm/inquirer.js-checkbox-search/workflows/CI/badge.svg)](https://github.com/mobaxterm/inquirer.js-checkbox-search/actions)
[![codecov](https://codecov.io/gh/mobaxterm/inquirer.js-checkbox-search/branch/main/graph/badge.svg)](https://codecov.io/gh/mobaxterm/inquirer.js-checkbox-search)

A multi-select prompt with text filtering/search capability for [inquirer.js](https://github.com/SBoudrias/Inquirer.js).

This prompt combines the functionality of `@inquirer/checkbox` and `@inquirer/search`, allowing users to:
- ✅ **Multi-select** multiple options with checkboxes
- 🔍 **Search/filter** options in real-time as you type
- ⌨️ **Navigate** with arrow keys through filtered results
- ⚡ **Fast** keyboard shortcuts for bulk operations

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
  instructions: 'Type to search, space to select, enter to confirm',
});
```

### Async/Dynamic Sources

```typescript
import checkboxSearch from 'inquirerjs-checkbox-search';

const selected = await checkboxSearch({
  message: 'Select GitHub repositories:',
  source: async (term) => {
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
      `https://api.github.com/search/repositories?q=${term}&sort=stars&order=desc&per_page=20`
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
| `source` | `(term?: string) => Promise<Array<Choice \| string>>` | No* | Async function for dynamic choices |
| `pageSize` | `number` | No | Number of choices to display per page (default: 7) |
| `loop` | `boolean` | No | Whether to loop around when navigating (default: true) |
| `required` | `boolean` | No | Require at least one selection (default: false) |
| `validate` | `(selection: Array<Choice>) => boolean \| string \| Promise<string \| boolean>` | No | Custom validation function |
| `instructions` | `string \| boolean` | No | Custom instructions text or false to hide |
| `theme` | `Theme` | No | Custom theme configuration |
| `shortcuts` | `object` | No | Custom keyboard shortcuts |

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
    checked: string;      // Icon for selected items (default: ●)
    unchecked: string;    // Icon for unselected items (default: ○)
    cursor: string;       // Cursor icon (default: ❯)
  };
  style: {
    searchTerm: (text: string) => string;
    disabledChoice: (text: string) => string;
    renderSelectedChoices: (choices: Array<Choice>) => string;
    description: (text: string) => string;
  };
  helpMode: 'always' | 'never' | 'auto';
};
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| <kbd>Type</kbd> | Filter/search options |
| <kbd>↑</kbd>/<kbd>↓</kbd> | Navigate through options |
| <kbd>Space</kbd> | Toggle selection of current option |
| <kbd>a</kbd> | Select/deselect all visible options |
| <kbd>i</kbd> | Invert selection of visible options |
| <kbd>Tab</kbd> | Autocomplete search term from highlighted option |
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
      return 'Please select at least 2 team members';
    }
    if (selection.length > 5) {
      return 'Please select at most 5 team members';
    }
    return true;
  },
});
```

### With Custom Theme

```typescript
import checkboxSearch from 'inquirerjs-checkbox-search';
import chalk from 'chalk';

const selected = await checkboxSearch({
  message: 'Select options:',
  choices: options,
  theme: {
    icon: {
      checked: chalk.green('✓'),
      unchecked: chalk.dim('○'),
      cursor: chalk.cyan('❯'),
    },
    style: {
      searchTerm: (text) => chalk.blue.underline(text),
      description: (text) => chalk.dim(text),
    },
  },
});
```

### With Initial Selections

```typescript
const frameworks = [
  { value: 'react', name: 'React', checked: true },     // Pre-selected
  { value: 'vue', name: 'Vue.js' },
  { value: 'angular', name: 'Angular', checked: true }, // Pre-selected
  { value: 'svelte', name: 'Svelte' },
];

const selected = await checkboxSearch({
  message: 'Frameworks:',
  choices: frameworks,
});
```

### With Separators and Disabled Options

```typescript
import { Separator } from 'inquirerjs-checkbox-search';

const choices = [
  { value: 'read', name: 'Read access' },
  { value: 'write', name: 'Write access' },
  new Separator('--- Advanced ---'),
  { value: 'admin', name: 'Admin access', disabled: 'Requires approval' },
  { value: 'delete', name: 'Delete access', disabled: true },
];

const selected = await checkboxSearch({
  message: 'Select permissions:',
  choices,
});
```

## TypeScript Support

This package is written in TypeScript and provides full type safety:

```typescript
import checkboxSearch from 'inquirerjs-checkbox-search';

// Type inference for return value
const frameworks = [
  { value: 'react', name: 'React' },
  { value: 'vue', name: 'Vue.js' },
] as const;

// selected will be typed as ('react' | 'vue')[]
const selected = await checkboxSearch({
  message: 'Select frameworks:',
  choices: frameworks,
});

// Or with explicit typing
type Framework = 'react' | 'vue' | 'angular';

const selected: Framework[] = await checkboxSearch({
  message: 'Select frameworks:',
  choices: [
    { value: 'react' as Framework, name: 'React' },
    { value: 'vue' as Framework, name: 'Vue.js' },
    { value: 'angular' as Framework, name: 'Angular' },
  ],
});
```

## Performance

The prompt is optimized for performance with large datasets:

- **Efficient filtering**: Only visible items are rendered
- **Debounced search**: Async sources are debounced to prevent excessive API calls
- **Virtual scrolling**: Large lists are paginated automatically
- **Minimal re-renders**: State changes only trigger necessary updates

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

[MIT](LICENSE) © [Your Name]

## Related

- [@inquirer/checkbox](https://www.npmjs.com/package/@inquirer/checkbox) - Multi-select prompt
- [@inquirer/search](https://www.npmjs.com/package/@inquirer/search) - Search/autocomplete prompt  
- [inquirer](https://www.npmjs.com/package/inquirer) - Collection of common interactive command line user interfaces
