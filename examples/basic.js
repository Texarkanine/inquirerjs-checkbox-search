#!/usr/bin/env node

import checkboxSearch from '../dist/esm/index.js';

const frameworks = [
  { value: 'react', name: 'React' },
  { value: 'vue', name: 'Vue.js' },
  { value: 'angular', name: 'Angular' },
  { value: 'svelte', name: 'Svelte' },
  { value: 'solid', name: 'SolidJS' },
];

async function main() {
  console.log('🚀 Basic Multi-Select Example\n');

  const selected = await checkboxSearch({
    message: 'Which frameworks do you use?',
    choices: frameworks,
  });

  console.log('\n✅ You selected:', selected);
  console.log(
    'Framework names:',
    selected
      .map((val) => frameworks.find((f) => f.value === val)?.name)
      .join(', '),
  );
}

main().catch(console.error);
