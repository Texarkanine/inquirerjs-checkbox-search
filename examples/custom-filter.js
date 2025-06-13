#!/usr/bin/env node

/**
 * Custom Filter Function Example
 *
 * What it demonstrates:
 * - Custom fuzzy matching filter
 * - Enhanced search capabilities
 * - Partial character matching
 *
 * Try this:
 * - Type "js" to find "JavaScript"
 * - Type "py" to find "Python"
 * - Type "c" to see C#, C++, etc.
 *
 * Run it:
 * node examples/custom-filter.js
 */

import checkboxSearch from '../dist/esm/index.js';

const languages = [
  {
    value: 'javascript',
    name: 'JavaScript',
    description: 'Dynamic scripting language',
  },
  {
    value: 'typescript',
    name: 'TypeScript',
    description: 'Typed superset of JavaScript',
  },
  {
    value: 'python',
    name: 'Python',
    description: 'High-level programming language',
  },
  {
    value: 'java',
    name: 'Java',
    description: 'Object-oriented programming language',
  },
  { value: 'csharp', name: 'C#', description: 'Microsoft .NET language' },
  { value: 'cpp', name: 'C++', description: 'Systems programming language' },
  {
    value: 'rust',
    name: 'Rust',
    description: 'Systems programming with memory safety',
  },
  { value: 'go', name: 'Go', description: "Google's open source language" },
  { value: 'php', name: 'PHP', description: 'Server-side scripting language' },
  {
    value: 'ruby',
    name: 'Ruby',
    description: 'Dynamic, object-oriented language',
  },
];

// Custom fuzzy filter function
function fuzzyFilter(items, term) {
  if (!term) return items;

  const searchTerm = term.toLowerCase();

  return items.filter((item) => {
    const name = item.name.toLowerCase();
    const value = item.value.toLowerCase();
    const description = item.description?.toLowerCase() || '';

    // Check if search term matches anywhere in name, value, or description
    return (
      name.includes(searchTerm) ||
      value.includes(searchTerm) ||
      description.includes(searchTerm) ||
      // Additional fuzzy matching - check if all characters of search term exist in order
      isFuzzyMatch(name, searchTerm) ||
      isFuzzyMatch(value, searchTerm)
    );
  });
}

function isFuzzyMatch(text, pattern) {
  let patternIndex = 0;
  for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
    if (text[i] === pattern[patternIndex]) {
      patternIndex++;
    }
  }
  return patternIndex === pattern.length;
}

async function main() {
  console.log('🔍 Custom Filter Example\n');
  console.log('💡 This uses fuzzy matching - try typing "js" or "py"\n');

  const selected = await checkboxSearch({
    message: 'Select programming languages:',
    choices: languages,
    filter: fuzzyFilter,
    pageSize: 8,
  });

  console.log('\n✅ Languages selected:', selected);
  console.log('💻 Your language choices:');
  selected.forEach((langValue) => {
    const lang = languages.find((l) => l.value === langValue);
    if (lang) {
      console.log(`  🚀 ${lang.name}: ${lang.description}`);
    }
  });
}

main().catch(console.error);
