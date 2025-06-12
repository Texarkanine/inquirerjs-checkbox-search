#!/usr/bin/env node

import checkboxSearch, { Separator } from '../dist/esm/index.js';

const choices = [
  { value: 'js', name: 'JavaScript' },
  { value: 'ts', name: 'TypeScript' },
  new Separator('--- Frameworks ---'),
  { value: 'react', name: 'React' },
  { value: 'vue', name: 'Vue.js' },
  { value: 'angular', name: 'Angular' },
  new Separator('--- Build Tools ---'),
  { value: 'webpack', name: 'Webpack' },
  { value: 'vite', name: 'Vite' },
  { value: 'rollup', name: 'Rollup' },
  new Separator('--- Testing ---'),
  { value: 'jest', name: 'Jest' },
  { value: 'vitest', name: 'Vitest' },
  { value: 'cypress', name: 'Cypress' },
];

async function main() {
  console.log('🔧 Separator Navigation Example\n');
  console.log('This example demonstrates separators in the list.');
  console.log('Use ↑/↓ arrow keys to navigate between selectable items.');
  console.log('Notice how navigation should skip over separators.\n');
  console.log('🐛 BUG: If navigation jumps to wrong items, the separator');
  console.log('    navigation bug is present!\n');

  const selected = await checkboxSearch({
    message: 'Select your tech stack:',
    choices: choices,
    pageSize: 10, // Fixed size to ensure all items fit on screen
  });

  console.log('\n✅ You selected:');
  selected.forEach((value) => {
    const choice = choices.find(
      (c) => !Separator.isSeparator(c) && c.value === value,
    );
    if (choice) {
      console.log(`  - ${choice.name}`);
    }
  });
}

main().catch(console.error);
