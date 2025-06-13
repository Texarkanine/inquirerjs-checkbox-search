# Examples

This directory contains working examples that demonstrate different features of the `inquirerjs-checkbox-search` package. Each example file includes detailed documentation in its header comments explaining what it demonstrates and how to use it.

## Prerequisites

1. **Build the package first** (required for examples to work):

   ```bash
   npm run build
   ```

## Running Examples

Run any example using Node.js:

```bash
node examples/basic.js
node examples/search-filtering.js
node examples/async-source.js
node examples/custom-theme.js
node examples/validation.js
node examples/custom-filter.js
node examples/pagesize-configuration.js
node examples/separators.js
node examples/fruits.js
node examples/auto-page-size.js
```

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
