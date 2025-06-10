# Checkbox Search Prompt Design

A multi-select prompt with text filtering/search capability for inquirer.js that combines the functionality of the `@inquirer/checkbox` and `@inquirer/search` prompts.

## Overview

This prompt allows users to:

1. **Search/Filter**: Type to filter a list of options in real-time
2. **Multi-Select**: Use tab key to toggle selection of multiple items
3. **Navigate**: Use arrow keys to navigate through filtered results
4. **Clear Search**: Use escape key to clear search terms

The implementation leverages code reuse from existing inquirer.js prompts while creating a cohesive user experience.

## Features Implemented

### Core Functionality

1. **Text Input & Filtering**

   - Real-time filtering as user types
   - Support for both static choices and async source functions
   - Custom filter functions supported
   - Escape key clears search terms

2. **Multi-Selection**

   - Visual indicators for selected/unselected items (◉/◯)
   - Tab key toggles selection of current item
   - Maintains selections across filtering operations
   - Returns array of selected values

3. **Navigation & UX**

   - Arrow keys navigate through filtered results
   - Cursor position maintained during selection toggles
   - Pagination for long lists
   - Clear help text and instructions
   - Loading states for async operations

4. **Advanced Features**
   - Validation of final selection
   - Support for disabled items and separators
   - Pre-selected choices support
   - Comprehensive theming and customization
   - Error handling for async operations

### Technical Implementation

1. **Architecture**

   - Built using `@inquirer/core` hooks and utilities
   - TypeScript with strict type checking
   - ESM/CommonJS dual exports via tshy
   - Node.js 18+ compatibility

2. **Performance**

   - Efficient filtering using memoized computations
   - Minimal re-rendering with React-style state management
   - Proper abort handling for async operations

3. **Accessibility**
   - Standard keyboard navigation
   - Clear visual indicators
   - Screen reader friendly text

## API Reference

### Configuration Options

```typescript
type CheckboxSearchConfig<Value> = {
  message: string;

  // Choice configuration
  choices?: ReadonlyArray<Choice<Value> | Separator | string>;
  source?: (
    term: string | undefined,
    opt: { signal: AbortSignal },
  ) => Promise<ReadonlyArray<Choice<Value> | Separator | string>>;

  // Search options
  filter?: (
    items: ReadonlyArray<NormalizedChoice<Value>>,
    term: string,
  ) => ReadonlyArray<NormalizedChoice<Value>>;

  // Selection options
  required?: boolean;
  validate?: (
    choices: ReadonlyArray<NormalizedChoice<Value>>,
  ) => boolean | string | Promise<string | boolean>;
  default?: ReadonlyArray<Value>;

  // UI options
  pageSize?: number;
  loop?: boolean;
  instructions?: string | boolean;

  // Theming
  theme?: PartialDeep<Theme<CheckboxSearchTheme>>;
};
```

### Choice Type

```typescript
type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  checked?: boolean; // Initial selection state
};
```

### Theme Configuration

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

## Usage Examples

### Basic Usage (Static List)

```typescript
import checkboxSearch from 'inquirerjs-checkbox-search';

const frameworks = [
  { value: 'react', name: 'React' },
  { value: 'vue', name: 'Vue.js' },
  { value: 'angular', name: 'Angular' },
  { value: 'svelte', name: 'Svelte' },
];

const selected = await checkboxSearch({
  message: 'Which frameworks do you use?',
  choices: frameworks,
});
```

### Advanced Usage (Dynamic Source)

```typescript
const selected = await checkboxSearch({
  message: 'Select GitHub repositories:',
  source: async (term, { signal }) => {
    const response = await fetch(`/api/repos?q=${term}`, { signal });
    const repos = await response.json();
    return repos.map((repo) => ({
      value: repo.id,
      name: repo.name,
      description: repo.description,
    }));
  },
  pageSize: 10,
  required: true,
  validate: (selection) => {
    return selection.length <= 5 || 'Please select at most 5 repositories';
  },
});
```

### With Custom Theme

```typescript
const selected = await checkboxSearch({
  message: 'Select items',
  choices: fruits,
  theme: {
    icon: {
      checked: '✅',
      unchecked: '⬜',
      cursor: '👉',
    },
    style: {
      highlight: (text) => `🌟 ${text}`,
      description: (text) => `💬 ${text}`,
    },
  },
});
```

## Keyboard Controls

| Key    | Action                             |
| ------ | ---------------------------------- |
| Type   | Filter/search options              |
| ↑/↓    | Navigate through options           |
| Tab    | Toggle selection of current option |
| Escape | Clear search filter                |
| Enter  | Confirm selection                  |

## Implementation Architecture

### State Management

The prompt uses React-style hooks from `@inquirer/core`:

- `useState` for search term, items, and selection state
- `useEffect` for async operations and state synchronization
- `useMemo` for computed filtered items
- `useKeypress` for keyboard interaction

### Key Design Decisions

1. **Tab for Selection**: Uses tab key instead of space to avoid conflicts with search input
2. **Cursor Preservation**: Maintains cursor position during selection toggles for better UX
3. **Escape for Clear**: Provides escape key to clear search terms
4. **Async Support**: Full support for dynamic loading with proper cancellation
5. **Theme Flexibility**: Supports both string and function-based theming

### Testing Strategy

Comprehensive test suite covering:

- Basic functionality and rendering
- Search and filtering operations
- Multi-selection behavior
- Navigation and keyboard controls
- Async operations and error handling
- Theme customization
- Edge cases and error conditions

## Comparison with Design Plans

### What Changed from Original Design

1. **Selection Key**: Changed from spacebar to tab key to avoid search input conflicts
2. **Keyboard Shortcuts**: Removed select-all and invert-selection shortcuts for simplicity
3. **Tab Completion**: Removed tab completion feature in favor of using tab for selection
4. **State Management**: Simplified state management approach using existing hooks

### What Stayed the Same

1. **Core Architecture**: Hybrid approach combining checkbox and search prompt patterns
2. **Theme System**: Full theming support with both string and function options
3. **Async Support**: Complete async source support with proper cancellation
4. **Type Safety**: Full TypeScript support with proper type inference
5. **Accessibility**: Standard keyboard navigation and screen reader support
