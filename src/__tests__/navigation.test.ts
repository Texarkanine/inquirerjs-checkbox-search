import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch, { Separator } from '../index.js';

describe('Navigation', () => {
  it('should navigate through choices with arrow keys', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana', 'Cherry'],
    });

    let screen = getScreen();
    expect(screen).toContain('❯ ◯ Apple'); // cursor should be on first item

    // Move down
    events.keypress('down');
    screen = getScreen();
    // Should move cursor to second item
    expect(screen).toContain('❯ ◯ Banana');
    expect(screen).not.toContain('❯ ◯ Apple');

    // Move up
    events.keypress('up');
    screen = getScreen();
    // Should move cursor back to first item
    expect(screen).toContain('❯ ◯ Apple');
    expect(screen).not.toContain('❯ ◯ Banana');
  });

  it('should handle navigation with filtered results', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'apricot', name: 'Apricot' },
        { value: 'banana', name: 'Banana' },
      ],
    });

    // Filter to show only items with 'ap'
    events.type('ap');
    const screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Apricot');
    expect(screen).not.toContain('Banana');

    // Navigate through filtered results
    events.keypress('down');
    events.keypress('tab'); // Select second item (Apricot)
    events.keypress('enter');
  });

  it('should loop navigation when enabled', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['First', 'Second', 'Third'],
      loop: true,
    });

    // Go to last item
    events.keypress('up'); // Should wrap to last item
    let screen = getScreen();
    expect(screen).toContain('❯');

    // Go past last item
    events.keypress('down');
    events.keypress('down');
    events.keypress('down');
    screen = getScreen();
    expect(screen).toContain('❯'); // Should wrap to first item
  });

  it('should not loop navigation when disabled', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['First', 'Second', 'Third'],
      loop: false,
    });

    let screen = getScreen();
    const initialScreen = screen;

    // Try to go up from first item
    events.keypress('up');
    screen = getScreen();
    // Should stay at first item (no wrap)
    expect(screen).toEqual(initialScreen);

    // Go to last item
    events.keypress('down');
    events.keypress('down');
    const lastScreen = getScreen();

    // Try to go down from last item
    events.keypress('down');
    screen = getScreen();
    // Should stay at last item (no wrap)
    expect(screen).toEqual(lastScreen);
  });

  it('should maintain cursor position on selected item when clearing search filter', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select frameworks',
      choices: [
        { value: 'react', name: 'React' },
        { value: 'vue', name: 'Vue.js' },
        { value: 'angular', name: 'Angular' },
        { value: 'svelte', name: 'Svelte' },
      ],
    });

    // Initial state - cursor should be on first item (React)
    let screen = getScreen();
    expect(screen).toContain('React');
    expect(screen).toContain('Vue.js');
    expect(screen).toContain('Angular');
    expect(screen).toContain('Svelte');

    // Filter to show only Vue.js
    events.type('vue');
    screen = getScreen();
    expect(screen).toContain('Vue.js');
    expect(screen).not.toContain('React');
    expect(screen).not.toContain('Angular');
    expect(screen).not.toContain('Svelte');

    // Select Vue.js (cursor should be on it since it's the only filtered item)
    events.keypress('tab');
    screen = getScreen();
    expect(screen).toContain('◉'); // Vue.js should be selected

    // Clear the search filter with escape
    events.keypress('escape');
    screen = getScreen();

    // All items should be visible again
    expect(screen).toContain('React');
    expect(screen).toContain('Vue.js');
    expect(screen).toContain('Angular');
    expect(screen).toContain('Svelte');

    // Vue.js should still be selected
    expect(screen).toContain('◉');

    // CRITICAL: The cursor should still be focused on Vue.js, not jumped to React
    // We can verify this by checking that Vue.js has the cursor indicator
    const lines = screen.split('\n');
    const vueLine = lines.find((line: string) => line.includes('Vue.js'));
    expect(vueLine).toContain('❯'); // Cursor should be on Vue.js line

    // React should NOT have the cursor
    const reactLine = lines.find((line: string) => line.includes('React'));
    expect(reactLine).not.toContain('❯');
  });

  it('should maintain cursor position on focused item when clearing search filter', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select frameworks',
      choices: [
        { value: 'react', name: 'React' },
        { value: 'vue', name: 'Vue.js' },
        { value: 'angular', name: 'Angular' },
        { value: 'svelte', name: 'Svelte' },
      ],
    });

    // Filter to show items containing 'a' (Angular should be visible)
    events.type('ang');
    let screen = getScreen();
    expect(screen).toContain('Angular');
    expect(screen).not.toContain('React');
    expect(screen).not.toContain('Vue.js');
    expect(screen).not.toContain('Svelte');

    // The cursor should automatically be on Angular since it's the only filtered item
    // DON'T select it - just leave cursor focused on it

    // Clear the search filter with escape
    events.keypress('escape');
    screen = getScreen();

    // All items should be visible again
    expect(screen).toContain('React');
    expect(screen).toContain('Vue.js');
    expect(screen).toContain('Angular');
    expect(screen).toContain('Svelte');

    // No items should be selected (we never pressed tab)
    expect(screen).not.toContain('◉');

    // CRITICAL: The cursor should still be focused on Angular, not jumped back to React
    const lines = screen.split('\n');
    const angularLine = lines.find((line: string) => line.includes('Angular'));
    expect(angularLine).toContain('❯'); // Cursor should be on Angular line

    // React should NOT have the cursor
    const reactLine = lines.find((line: string) => line.includes('React'));
    expect(reactLine).not.toContain('❯');
  });

  it('should preserve cursor position across multiple filter/clear cycles', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select frameworks',
      choices: [
        { value: 'react', name: 'React' },
        { value: 'vue', name: 'Vue.js' },
        { value: 'angular', name: 'Angular' },
        { value: 'svelte', name: 'Svelte' },
      ],
    });

    // First cycle: Filter for Svelte and navigate to it
    events.type('sve');
    let screen = getScreen();
    expect(screen).toContain('Svelte');
    expect(screen).not.toContain('React');

    // Select Svelte
    events.keypress('tab');
    screen = getScreen();
    expect(screen).toContain('◉'); // Svelte should be selected

    // Clear filter - cursor should stay on Svelte
    events.keypress('escape');
    screen = getScreen();
    let lines = screen.split('\n');
    let svelteLine = lines.find((line: string) => line.includes('Svelte'));
    expect(svelteLine).toContain('❯'); // Cursor should be on Svelte
    expect(svelteLine).toContain('◉'); // Svelte should still be selected

    // Second cycle: Filter for Angular
    events.type('ang');
    screen = getScreen();
    expect(screen).toContain('Angular');
    expect(screen).not.toContain('Svelte'); // Hidden by filter
    expect(screen).not.toContain('React');

    // Navigate to Angular (don't select it)
    // Angular should already be focused since it's the only visible item

    // Clear filter again - cursor should move to Angular, Svelte should stay selected
    events.keypress('escape');
    screen = getScreen();
    lines = screen.split('\n');

    const angularLine = lines.find((line: string) => line.includes('Angular'));
    expect(angularLine).toContain('❯'); // Cursor should now be on Angular

    svelteLine = lines.find((line: string) => line.includes('Svelte'));
    expect(svelteLine).toContain('◉'); // Svelte should still be selected
    expect(svelteLine).not.toContain('❯'); // But cursor should NOT be on Svelte anymore
  });

  // SEPARATOR NAVIGATION TESTS (formerly "CRITICAL BUG TESTS")

  it('should navigate correctly with separators - up/down navigation', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'js', name: 'JavaScript' },
        { value: 'ts', name: 'TypeScript' },
        new Separator('--- Frameworks ---'),
        { value: 'react', name: 'React' },
        { value: 'vue', name: 'Vue.js' },
        new Separator('--- Tools ---'),
        { value: 'webpack', name: 'Webpack' },
      ],
    });

    let screen = getScreen();

    // Should start with JavaScript active (first selectable item)
    expect(screen).toContain('❯ ◯ JavaScript');
    expect(screen).not.toContain('❯ ◯ TypeScript');
    expect(screen).not.toContain('❯ ◯ React');

    // Navigate down - should go to TypeScript (second selectable item)
    events.keypress('down');
    screen = getScreen();
    expect(screen).not.toContain('❯ ◯ JavaScript');
    expect(screen).toContain('❯ ◯ TypeScript');
    expect(screen).not.toContain('❯ ◯ React');

    // Navigate down again - should skip separator and go to React
    events.keypress('down');
    screen = getScreen();
    expect(screen).not.toContain('❯ ◯ TypeScript');
    expect(screen).toContain('❯ ◯ React');
    expect(screen).not.toContain('❯ ◯ Vue.js');

    // Navigate down again - should go to Vue.js
    events.keypress('down');
    screen = getScreen();
    expect(screen).not.toContain('❯ ◯ React');
    expect(screen).toContain('❯ ◯ Vue.js');
    expect(screen).not.toContain('❯ ◯ Webpack');

    // Navigate down again - should skip separator and go to Webpack
    events.keypress('down');
    screen = getScreen();
    expect(screen).not.toContain('❯ ◯ Vue.js');
    expect(screen).toContain('❯ ◯ Webpack');
  });

  it('should navigate correctly with separators - up navigation', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'js', name: 'JavaScript' },
        new Separator('--- Frameworks ---'),
        { value: 'react', name: 'React' },
        { value: 'vue', name: 'Vue.js' },
        new Separator('--- Tools ---'),
        { value: 'webpack', name: 'Webpack' },
      ],
    });

    // Start by navigating to the last item (Webpack)
    events.keypress('down'); // to React
    events.keypress('down'); // to Vue.js
    events.keypress('down'); // to Webpack

    let screen = getScreen();
    expect(screen).toContain('❯ ◯ Webpack');

    // Navigate up - should go to Vue.js
    events.keypress('up');
    screen = getScreen();
    expect(screen).not.toContain('❯ ◯ Webpack');
    expect(screen).toContain('❯ ◯ Vue.js');

    // Navigate up again - should go to React
    events.keypress('up');
    screen = getScreen();
    expect(screen).not.toContain('❯ ◯ Vue.js');
    expect(screen).toContain('❯ ◯ React');

    // Navigate up again - should skip separator and go to JavaScript
    events.keypress('up');
    screen = getScreen();
    expect(screen).not.toContain('❯ ◯ React');
    expect(screen).toContain('❯ ◯ JavaScript');
  });

  it('should handle selection with separators correctly', async () => {
    const { answer, events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'js', name: 'JavaScript' },
        new Separator('--- Frameworks ---'),
        { value: 'react', name: 'React' },
        { value: 'vue', name: 'Vue.js' },
      ],
    });

    // Navigate to React and select it
    events.keypress('down'); // Go to React (first down should skip separator)

    let screen = getScreen();
    expect(screen).toContain('❯ ◯ React');

    // Select React
    events.keypress('tab');
    screen = getScreen();
    expect(screen).toContain('❯ ◉ React'); // Should be selected

    // Navigate to Vue.js and select it
    events.keypress('down');
    screen = getScreen();
    expect(screen).toContain('❯ ◯ Vue.js');

    events.keypress('tab');
    screen = getScreen();
    expect(screen).toContain('❯ ◉ Vue.js'); // Should be selected

    // Submit
    events.keypress('enter');
    await expect(answer).resolves.toEqual(['react', 'vue']);
  });

  it('should work with loop navigation and separators', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      loop: true,
      choices: [
        { value: 'first', name: 'First' },
        new Separator('--- Middle ---'),
        { value: 'last', name: 'Last' },
      ],
    });

    let screen = getScreen();
    // Should start with First active
    expect(screen).toContain('❯ ◯ First');

    // Navigate up (should loop to Last)
    events.keypress('up');
    screen = getScreen();
    expect(screen).not.toContain('❯ ◯ First');
    expect(screen).toContain('❯ ◯ Last');

    // Navigate down (should loop back to First, skipping separator)
    events.keypress('down');
    screen = getScreen();
    expect(screen).toContain('❯ ◯ First');
    expect(screen).not.toContain('❯ ◯ Last');
  });

  it('should preserve selections when navigating through separators', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'item1', name: 'Item 1' },
        new Separator('--- Group ---'),
        { value: 'item2', name: 'Item 2' },
        { value: 'item3', name: 'Item 3' },
      ],
    });

    // Select first item
    events.keypress('tab');
    let screen = getScreen();
    expect(screen).toContain('❯ ◉ Item 1');

    // Navigate to Item 2 and select it
    events.keypress('down'); // Skip separator, go to Item 2
    screen = getScreen();
    expect(screen).toContain('❯ ◯ Item 2');
    expect(screen).toContain('◉ Item 1'); // Should still be selected

    events.keypress('tab');
    screen = getScreen();
    expect(screen).toContain('❯ ◉ Item 2');
    expect(screen).toContain('◉ Item 1'); // Should still be selected

    // Navigate back up - selections should be preserved
    events.keypress('up');
    screen = getScreen();
    expect(screen).toContain('❯ ◉ Item 1');
    expect(screen).toContain('◉ Item 2'); // Should still be selected
  });
});
