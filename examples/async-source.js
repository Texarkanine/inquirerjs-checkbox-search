#!/usr/bin/env node

/**
 * Async Source Function Example
 *
 * What it demonstrates:
 * - Dynamic loading with async source function
 * - Loading states and request cancellation
 * - Mock API simulation with delay
 *
 * Try this:
 * - Wait for initial load (shows popular repos)
 * - Type "react" to search for React-related repositories
 * - Type quickly to see request cancellation in action
 *
 * Run it:
 * node examples/async-source.js
 */

import checkboxSearch from '../dist/esm/index.js';

// Mock API data
const mockRepositories = [
  {
    id: 'facebook/react',
    name: 'React',
    description:
      'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
    stars: 220000,
    language: 'JavaScript',
  },
  {
    id: 'vuejs/vue',
    name: 'Vue.js',
    description: 'The Progressive JavaScript Framework',
    stars: 206000,
    language: 'TypeScript',
  },
  {
    id: 'angular/angular',
    name: 'Angular',
    description: "The modern web developer's platform",
    stars: 93000,
    language: 'TypeScript',
  },
  {
    id: 'sveltejs/svelte',
    name: 'Svelte',
    description: 'Cybernetically enhanced web apps',
    stars: 76000,
    language: 'JavaScript',
  },
  {
    id: 'solidjs/solid',
    name: 'SolidJS',
    description: 'A declarative, efficient, and flexible JavaScript library',
    stars: 30000,
    language: 'TypeScript',
  },
  {
    id: 'preactjs/preact',
    name: 'Preact',
    description: 'Fast 3kB React alternative with the same modern API',
    stars: 36000,
    language: 'JavaScript',
  },
  {
    id: 'lit/lit',
    name: 'Lit',
    description: 'Simple. Fast. Web Components.',
    stars: 17000,
    language: 'TypeScript',
  },
  {
    id: 'alpinejs/alpine',
    name: 'Alpine.js',
    description:
      'A rugged, minimal framework for composing JavaScript behavior',
    stars: 26000,
    language: 'JavaScript',
  },
];

// Mock API function
async function searchRepositories(term, { signal }) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Check if request was cancelled
  if (signal.aborted) {
    throw new Error('Request cancelled');
  }

  if (!term) {
    // Return popular repos when no search term
    return mockRepositories.slice(0, 5).map((repo) => ({
      value: repo.id,
      name: repo.name,
      description: `⭐ ${repo.stars.toLocaleString()} | ${repo.language}`,
    }));
  }

  // Filter repositories based on search term
  const filtered = mockRepositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(term.toLowerCase()) ||
      repo.description.toLowerCase().includes(term.toLowerCase()) ||
      repo.language.toLowerCase().includes(term.toLowerCase()),
  );

  return filtered.map((repo) => ({
    value: repo.id,
    name: `${repo.name} - ${repo.description.slice(0, 50)}${repo.description.length > 50 ? '...' : ''}`,
    description: `⭐ ${repo.stars.toLocaleString()} | ${repo.language}`,
  }));
}

async function main() {
  console.log('🔄 Async Source Example\n');
  console.log('💡 This simulates searching GitHub repositories');
  console.log('💡 Type to search, Tab to select, Enter to confirm\n');

  const selected = await checkboxSearch({
    message: 'Select GitHub repositories:',
    source: searchRepositories,
    pageSize: 8,
  });

  console.log('\n✅ Repositories selected:', selected);
  selected.forEach((repo) => {
    const repoData = mockRepositories.find((r) => r.id === repo);
    if (repoData) {
      console.log(`  📦 ${repoData.name}: ${repoData.description}`);
    }
  });
}

main().catch(console.error);
