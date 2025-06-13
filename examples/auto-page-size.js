#!/usr/bin/env node

/**
 * Auto Page Size Example
 *
 * What it demonstrates:
 * - Automatic page size calculation based on terminal height
 * - Comparison between fixed page size and auto page sizing
 * - Terminal height detection and adaptive UI
 * - Large choice lists for pagination testing
 *
 * Try this:
 * - Compare the fixed page size (7 items) with auto page sizing
 * - Resize your terminal and run again to see adaptive behavior
 * - Notice how auto page sizing maximizes available terminal space
 * - Observe the terminal info output showing calculated page size
 *
 * Run it:
 * node examples/auto-page-size.js
 */

import checkboxSearch from '../dist/esm/index.js';

// Create a large list of choices to demonstrate pagination
const manyChoices = Array.from({ length: 100 }, (_, i) => ({
  value: `item-${i + 1}`,
  name: `Choice ${i + 1}`,
  description: `This is choice number ${i + 1} with some additional description text`,
}));

async function demoAutoPageSize() {
  console.log('🔧 Auto Page Size Demo\n');
  console.log(
    'This example demonstrates how the prompt adapts to your terminal height.\n',
  );

  try {
    console.log("📏 First, let's use fixed page size (7 items):");
    const fixedResult = await checkboxSearch({
      message: 'Select items (Fixed page size)',
      choices: manyChoices,
      pageSize: 7,
    });

    console.log(
      `\n✅ Fixed page size selection: ${fixedResult.length} items selected`,
    );
    console.log(
      'Selected:',
      fixedResult.slice(0, 3).join(', ') +
        (fixedResult.length > 3 ? '...' : ''),
    );

    console.log("\n📐 Now, let's use auto page sizing:");
    const autoResult = await checkboxSearch({
      message: 'Select items (Auto page size)',
      choices: manyChoices,
    });

    console.log(
      `\n✅ Auto page size selection: ${autoResult.length} items selected`,
    );
    console.log(
      'Selected:',
      autoResult.slice(0, 3).join(', ') + (autoResult.length > 3 ? '...' : ''),
    );

    // Show terminal info
    const terminalHeight = process.stdout.rows;
    console.log(`\n📊 Terminal Info:`);
    console.log(`  Terminal height: ${terminalHeight || 'unknown'} rows`);

    if (terminalHeight) {
      const reservedLines = 6;
      const availableLines = Math.max(terminalHeight - reservedLines, 2);
      const calculatedPageSize = Math.max(2, Math.min(50, availableLines));
      console.log(`  Calculated page size: ${calculatedPageSize} items`);
      console.log(`  Reserved for UI: ${reservedLines} lines`);
    }
  } catch (error) {
    if (error.message.includes('User force closed')) {
      console.log('\n👋 Demo cancelled by user');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the demo
demoAutoPageSize().catch(console.error);
