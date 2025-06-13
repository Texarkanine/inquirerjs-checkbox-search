#!/usr/bin/env node

/**
 * Search Filtering Example
 *
 * What it demonstrates:
 * - Real-time search filtering
 * - Larger list of choices (15 countries)
 * - Custom page size and instructions
 *
 * Try this: Type letters to filter countries (e.g., "un" to see "United States" and "United Kingdom")
 *
 * Run it:
 * node examples/search-filtering.js
 */

import checkboxSearch from '../dist/esm/index.js';

const countries = [
  { value: 'us', name: 'United States' },
  { value: 'ca', name: 'Canada' },
  { value: 'uk', name: 'United Kingdom' },
  { value: 'de', name: 'Germany' },
  { value: 'fr', name: 'France' },
  { value: 'jp', name: 'Japan' },
  { value: 'au', name: 'Australia' },
  { value: 'br', name: 'Brazil' },
  { value: 'in', name: 'India' },
  { value: 'mx', name: 'Mexico' },
  { value: 'es', name: 'Spain' },
  { value: 'it', name: 'Italy' },
  { value: 'nl', name: 'Netherlands' },
  { value: 'se', name: 'Sweden' },
  { value: 'no', name: 'Norway' },
];

async function main() {
  console.log('🌍 Search Filtering Example\n');
  console.log(
    '💡 Type to search countries, use Tab to select, Enter to confirm\n',
  );

  const selected = await checkboxSearch({
    message: 'Select countries to visit:',
    choices: countries,
    pageSize: 10,
    instructions: 'Type to search, Tab to select, Enter to confirm',
  });

  console.log('\n✅ Countries selected:', selected);
  console.log(
    'Travel destinations:',
    selected
      .map((val) => countries.find((c) => c.value === val)?.name)
      .join(', '),
  );
}

main().catch(console.error);
