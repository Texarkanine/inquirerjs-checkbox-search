# Examples

This directory contains working examples that demonstrate different features of the `inquirerjs-checkbox-search` package.

## Prerequisites

1. **Build the package first** (required for examples to work):

   ```bash
   npm run build
   ```

## Running Examples

```bash
node examples/basic.js
node examples/search-filtering.js
# ... etc
```

## Available Examples

### 1. `basic.js` - Simple Multi-Select

**What it demonstrates:**

- Basic multi-select functionality
- Simple choice configuration
- Tab to select, Enter to confirm

**Run it:**

```bash
node examples/basic.js
```

### 2. `search-filtering.js` - Search Filtering

**What it demonstrates:**

- Real-time search filtering
- Larger list of choices (15 countries)
- Custom page size and instructions

**Run it:**

```bash
node examples/search-filtering.js
```

**Try this:** Type letters to filter countries (e.g., "un" to see "United States" and "United Kingdom")

### 3. `async-source.js` - Async Source Function

**What it demonstrates:**

- Dynamic loading with async source function
- Loading states and request cancellation
- Mock API simulation with delay

**Run it:**

```bash
node examples/async-source.js
```

**Try this:**

- Wait for initial load (shows popular repos)
- Type "react" to search for React-related repositories
- Type quickly to see request cancellation in action

### 4. `custom-theme.js` - Custom Theming

**What it demonstrates:**

- Custom icons (✅, ⬜, 👉)
- Custom styling functions with emojis
- Theme configuration options

**Run it:**

```bash
node examples/custom-theme.js
```

### 5. `validation.js` - Validation & Pre-selection

**What it demonstrates:**

- Input validation (2-4 selections required)
- Pre-selected default options
- Custom validation messages

**Run it:**

```bash
node examples/validation.js
```

**Try this:**

- Notice Alice and Bob are pre-selected
- Try confirming with only 1 selection (validation error)
- Try selecting more than 4 members (validation error)

### 6. `custom-filter.js` - Custom Filter Function

**What it demonstrates:**

- Custom fuzzy matching filter
- Enhanced search capabilities
- Partial character matching

**Run it:**

```bash
node examples/custom-filter.js
```

**Try this:**

- Type "js" to find "JavaScript"
- Type "py" to find "Python"
- Type "c" to see C#, C++, etc.

### 7. `pagesize-configuration.js` - PageSize Configuration

**What it demonstrates:**

- Advanced PageSize configuration options
- Auto-buffering for descriptions to prevent UI jumping
- Min/max constraints and buffer settings
- Backward compatibility with simple numeric pageSize

**Run it:**

```bash
node examples/pagesize-configuration.js
```

**Try this:**

- Notice how different PageSize configurations affect the display
- Observe auto-buffering reserving space for multi-line descriptions
- See how min/max constraints work with various settings
- **Demo 6 is especially interesting**: Shows terminal filling with obvious buffer space reserved at the bottom for descriptions when scrolling through many items
- **Demo 7 demonstrates line-width counting**: Compare auto-buffering with and without terminal width consideration for long descriptions that wrap

## Troubleshooting

### "Cannot find module" error

Make sure you've built the package first:

```bash
npm run build
```

### Examples not working as expected

1. Ensure you're in the project root directory
2. Verify the build completed successfully
3. Check that `dist/esm/index.js` exists
