#!/usr/bin/env node

/**
 * Custom Theming Example
 *
 * What it demonstrates:
 * - Custom icons (✅, ⬜, 👉)
 * - Custom styling functions with emojis
 * - Theme configuration options
 *
 * Run it:
 * node examples/custom-theme.js
 */

import checkboxSearch from '../dist/esm/index.js';

const fruits = [
  { value: 'apple', name: 'Apple', description: 'Crisp and sweet' },
  { value: 'banana', name: 'Banana', description: 'Rich in potassium' },
  { value: 'orange', name: 'Orange', description: 'High in vitamin C' },
  { value: 'grape', name: 'Grape', description: 'Perfect for snacking' },
  { value: 'strawberry', name: 'Strawberry', description: 'Summer favorite' },
];

async function main() {
  console.log('🎨 Custom Theme Example\n');
  console.log('💡 This example uses custom icons and colors\n');

  const selected = await checkboxSearch({
    message: 'Select your favorite fruits:',
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
        searchTerm: (text) => `🔍 ${text}`,
      },
    },
  });

  console.log('\n✅ You selected:', selected);
  console.log('🍎 Your fruit choices:');
  selected.forEach((fruitValue) => {
    const fruit = fruits.find((f) => f.value === fruitValue);
    if (fruit) {
      console.log(`  🟢 ${fruit.name}: ${fruit.description}`);
    }
  });
}

main().catch(console.error);
