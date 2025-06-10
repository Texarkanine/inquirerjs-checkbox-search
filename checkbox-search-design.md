# Checkbox Search Prompt Design

A multi-select prompt with text filtering/search capability for inquirer.js that combines the functionality of the `@inquirer/checkbox` and `@inquirer/search` prompts.

## Overview

This prompt allows users to:
1. **Search/Filter**: Type to filter a list of options in real-time
2. **Multi-Select**: Use space to toggle selection of multiple items
3. **Navigate**: Use arrow keys to navigate through filtered results
4. **Easy Selection**: Use tab key for intuitive selection toggle

The design prioritizes code reuse from existing inquirer.js prompts while creating a cohesive user experience.

## Requirements

### Functional Requirements

1. **Text Input & Filtering**
   - Display search input field at top
   - Filter choices in real-time as user types
   - Handle both synchronous and asynchronous filtering
   - Preserve search term display during navigation

2. **Multi-Selection**
   - Show visual indicators for selected/unselected items
   - Toggle selection with spacebar
   - Track multiple selected values
   - Return array of selected values

3. **Navigation & UX**
   - Arrow keys to navigate filtered results
   - Tab completion for highlighted item name
   - Pagination for long lists
   - Clear visual feedback for current item
   - Help text and instructions

4. **Advanced Features**
   - Tab-to-select for easy interaction
   - Validation of final selection
   - Support for disabled items and separators
   - Theming and customization

### Technical Requirements

1. **API Compatibility**
   - Follow inquirer.js patterns and conventions
   - TypeScript support with proper type inference
   - ESM/CommonJS dual exports
   - Node.js 18+ compatibility

2. **Performance**
   - Efficient filtering for large datasets
   - Minimal re-rendering
   - Debounced async search operations

3. **Accessibility**
   - Screen reader friendly
   - Standard keyboard navigation
   - Clear visual indicators

## Architecture Design

### Core Strategy: Hybrid Approach

Based on analysis of the existing codebase, we'll use a **hybrid approach**:

1. **Copy and adapt checkbox prompt as the base** - since it already handles multi-selection, navigation, and validation
2. **Integrate search functionality** - add filtering logic and search input handling from the search prompt
3. **Merge rendering logic** - combine the display patterns from both prompts

This approach minimizes new code while leveraging battle-tested functionality.

### Key Components

#### 1. State Management
```typescript
// Core state (from checkbox)
const [items, setItems] = useState<ReadonlyArray<Item<Value>>>(/* filtered items */);
const [active, setActive] = useState<number>(0);

// Search state (from search)  
const [searchTerm, setSearchTerm] = useState<string>('');
const [filteredItems, setFilteredItems] = useState<ReadonlyArray<Item<Value>>>([]);

// Selection state (from checkbox)
const [selectedValues, setSelectedValues] = useState<Set<Value>>(new Set());
```

#### 2. Filtering Logic
- **Static Lists**: Filter provided choices array in real-time
- **Dynamic Sources**: Support async `source` function like search prompt
- **Filter Function**: Allow custom filtering logic
- **Preserve State**: Maintain selections across filter changes

#### 3. Event Handling
```typescript
useKeypress((key, rl) => {
  // Search input (from search prompt)
  if (isPrintableKey(key)) {
    setSearchTerm(rl.line);
  }
  
  // Navigation (from both prompts)
  else if (isUpKey(key) || isDownKey(key)) {
    // Navigate through filtered results
  }
  
  // Selection (from checkbox prompt)  
  else if (isSpaceKey(key)) {
    // Toggle selection of active item
  }
  
  // Completion (from checkbox prompt)
  else if (isEnterKey(key)) {
    // Validate and return selected values
  }
  
  // Simplified keyboard interaction for search compatibility
  else if (key.name === 'a') { /* select all */ }
  else if (key.name === 'i') { /* invert selection */ }
  else if (key.name === 'tab') { /* autocomplete from search */ }
});
```

#### 4. Rendering Strategy
Combine rendering approaches:
- **Top line**: `${prefix} ${message} ${searchTerm}` (from search)
- **Options list**: Paginated checkbox-style list with selection indicators
- **Bottom info**: Help text, descriptions, error messages

### Type Definitions

```typescript
type CheckboxSearchChoice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  checked?: boolean; // Initial selection state
};

type CheckboxSearchConfig<Value> = {
  message: string;
  
  // Choice configuration (hybrid approach)
  choices?: ReadonlyArray<CheckboxSearchChoice<Value> | Separator | string>;
  source?: (
    term: string | undefined,
    opt: { signal: AbortSignal }
  ) => Promise<ReadonlyArray<CheckboxSearchChoice<Value> | Separator | string>>;
  
  // Search options
  filter?: (items: ReadonlyArray<CheckboxSearchChoice<Value>>, term: string) => ReadonlyArray<CheckboxSearchChoice<Value>>;
  
  // Selection options  
  required?: boolean;
  validate?: (selection: ReadonlyArray<CheckboxSearchChoice<Value>>) => boolean | string | Promise<string | boolean>;
  
  // UI options
  pageSize?: number;
  loop?: boolean;
  instructions?: string | boolean;
  // Shortcuts removed for search compatibility
  
  // Theming
  theme?: PartialDeep<Theme<CheckboxSearchTheme>>;
};
```

### Theme Integration

```typescript
type CheckboxSearchTheme = {
  icon: {
    checked: string;
    unchecked: string;
    cursor: string;
  };
  style: {
    searchTerm: (text: string) => string;
    disabledChoice: (text: string) => string;
    renderSelectedChoices: <T>(selectedChoices: ReadonlyArray<T>) => string;
    description: (text: string) => string;
  };
  helpMode: 'always' | 'never' | 'auto';
};
```

## Implementation Plan

### Phase 1: Core Integration
1. **Setup project structure** - npm module with TypeScript
2. **Copy checkbox prompt** as base implementation  
3. **Add search input handling** - integrate readline and search term state
4. **Implement basic filtering** - filter static choice arrays

### Phase 2: Advanced Features  
1. **Add async source support** - integrate dynamic loading from search prompt
2. **Enhance navigation** - ensure proper behavior with filtered results
3. **Add keyboard navigation** - tab selection, arrow navigation
4. **Implement validation** - selection validation and error handling

### Phase 3: Polish & Testing
1. **Theming and customization** - merge theme systems
2. **Comprehensive testing** - unit tests and integration tests  
3. **Documentation** - README, examples, API docs
4. **Performance optimization** - debouncing, efficient filtering

## API Examples

### Basic Usage (Static List)
```typescript
import checkboxSearch from '@inquirer/checkbox-search';

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
  source: async (term) => {
    const response = await fetch(`/api/repos?q=${term}`);
    const repos = await response.json();
    return repos.map(repo => ({
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

## Code Reuse Strategy

### From Checkbox Prompt (`@inquirer/checkbox`)
- **Selection state management** - `checked` property, toggle logic
- **Multi-selection validation** - required validation, custom validators  
- **Keyboard navigation** - tab-to-select, arrow navigation
- **Pagination and navigation** - arrow key handling, bounds checking
- **Theme system** - icons (checked/unchecked), styling functions
- **Rendering logic** - checkbox display, selection indicators

### From Search Prompt (`@inquirer/search`)
- **Search input handling** - readline integration, search term state
- **Async source support** - dynamic loading with AbortController
- **Filter implementation** - real-time filtering logic
- **Tab completion** - autocomplete from highlighted item
- **Search term display** - input field rendering
- **Error handling** - loading states, network errors

### From Core (`@inquirer/core`)
- **Hook system** - `useState`, `useKeypress`, `useEffect`, `usePagination`
- **Theme utilities** - `makeTheme`, `usePrefix`
- **Key utilities** - `isEnterKey`, `isSpaceKey`, `isUpKey`, etc.
- **Base types** - `Choice`, `Separator`, `Theme`, `Status`

## Risk Assessment

### Technical Risks
1. **Complex State Management** - Managing both search and selection state
   - *Mitigation*: Use proven patterns from existing prompts
   
2. **Performance with Large Lists** - Filtering and rendering many items
   - *Mitigation*: Implement debouncing and virtual scrolling if needed
   
3. **UX Complexity** - Combining two interaction patterns
   - *Mitigation*: Follow established conventions, clear help text

### Compatibility Risks  
1. **Breaking Changes** - Different API from existing prompts
   - *Mitigation*: Follow inquirer.js conventions closely
   
2. **Theme Incompatibility** - Merging two theme systems
   - *Mitigation*: Extend existing theme patterns, provide fallbacks

## Success Criteria

1. **Functional**
   - ✅ Real-time search filtering
   - ✅ Multi-selection with visual feedback  
   - ✅ Keyboard navigation simplified for search
   - ✅ Validation and error handling

2. **Quality**
   - ✅ 90%+ test coverage
   - ✅ TypeScript support with proper inference
   - ✅ Performance with 1000+ items
   - ✅ Accessibility compliance

3. **Adoption**
   - ✅ Clear documentation and examples
   - ✅ Follows inquirer.js conventions
   - ✅ ESM/CommonJS compatibility
   - ✅ Published to npm registry

## Conclusion

This design leverages the proven architecture of existing inquirer.js prompts while creating a powerful new interaction pattern. By combining the checkbox prompt's selection management with the search prompt's filtering capabilities, we create a prompt that handles complex selection scenarios efficiently.

The hybrid implementation approach minimizes new code while ensuring compatibility with the broader inquirer.js ecosystem. The result will be a robust, performant, and user-friendly prompt suitable for a wide range of use cases. 