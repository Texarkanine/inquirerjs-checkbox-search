import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

// Utility function to wait for a condition to be true with polling
async function waitForCondition(
  condition: () => boolean,
  timeout = 1000,
  interval = 10
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

describe('Search and filtering', () => {
  it('should filter choices based on search term', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select frameworks',
      choices: [
        { value: 'react', name: 'React' },
        { value: 'vue', name: 'Vue.js' },
        { value: 'angular', name: 'Angular' },
        { value: 'svelte', name: 'Svelte' },
      ],
    });

    // Initially all choices should be visible
    let screen = getScreen();
    expect(screen).toContain('React');
    expect(screen).toContain('Vue.js');
    expect(screen).toContain('Angular');
    expect(screen).toContain('Svelte');

    // Type search term to filter
    events.type('rea');
    screen = getScreen();
    expect(screen).toContain('React');
    expect(screen).not.toContain('Vue.js');
    expect(screen).not.toContain('Angular');
    expect(screen).not.toContain('Svelte');
  });

  it('should handle case-insensitive search', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana', 'Cherry'],
    });

    events.type('APPLE');
    const screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).not.toContain('Banana');
    expect(screen).not.toContain('Cherry');
  });

  it('should reset filter when search term is cleared', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana', 'Cherry'],
    });

    // Filter first
    events.type('apple');
    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).not.toContain('Banana');

    // Clear search term
    for (let i = 0; i < 5; i++) {
      events.keypress('backspace');
    }

    screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Banana');
    expect(screen).toContain('Cherry');
  });

  /**
   * Feature test: Escape key to clear search filter
   *
   * This feature allows users to quickly clear search filters without
   * manually backspacing through the entire search term.
   */
  it('should clear search filter with Escape key', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
        { value: 'cherry', name: 'Cherry' },
      ],
    });

    // Type a search term to filter results
    events.type('ap');
    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).not.toContain('Banana');
    expect(screen).not.toContain('Cherry');

    // Press Escape to clear the search filter
    events.keypress('escape');
    screen = getScreen();

    // All items should be visible again
    expect(screen).toContain('Apple');
    expect(screen).toContain('Banana');
    expect(screen).toContain('Cherry');

    // Search term should be cleared (no visible search text)
    expect(screen).not.toContain('Search: ap');
  });

  /**
   * Feature test: Escape key preserving selections
   *
   * When clearing search filters with escape, any selections made while
   * filtering should be preserved when returning to the full list.
   */
  it('should maintain selections when clearing search filter with Escape', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'apricot', name: 'Apricot' },
        { value: 'banana', name: 'Banana' },
      ],
    });

    // Type a search term to filter results
    events.type('ap');
    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Apricot');
    expect(screen).not.toContain('Banana');

    // Select both filtered items
    events.keypress('tab'); // Select Apple
    events.keypress('down');
    events.keypress('tab'); // Select Apricot

    screen = getScreen();
    // Both should be selected
    const lines = screen.split('\n');
    const appleLine = lines.find((line: string) => line.includes('Apple'));
    const apricotLine = lines.find((line: string) => line.includes('Apricot'));
    expect(appleLine).toContain('◉');
    expect(apricotLine).toContain('◉');

    // Press Escape to clear the search filter
    events.keypress('escape');
    screen = getScreen();

    // All items should be visible again
    expect(screen).toContain('Apple');
    expect(screen).toContain('Apricot');
    expect(screen).toContain('Banana');

    // Selections should be maintained
    const newLines = screen.split('\n');
    const newAppleLine = newLines.find((line: string) =>
      line.includes('Apple'),
    );
    const newApricotLine = newLines.find((line: string) =>
      line.includes('Apricot'),
    );
    const newBananaLine = newLines.find((line: string) =>
      line.includes('Banana'),
    );

    expect(newAppleLine).toContain('◉'); // Should still be selected
    expect(newApricotLine).toContain('◉'); // Should still be selected
    expect(newBananaLine).toContain('◯'); // Should not be selected
  });

  /**
   * Bug reproduction test: j/k keys triggering vim navigation instead of search
   *
   * Previously, the "j" and "k" keys would trigger vim-style navigation (down/up)
   * instead of being added to the search term. This was caused by using
   * @inquirer/core's isUpKey() and isDownKey() functions which include vim keys.
   */
  it('should handle "j" key input properly for search (vim navigation bug fix)', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select fruits',
      choices: [
        { value: 'jackfruit', name: 'Jackfruit' },
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
      ],
    });

    // Type "j" - should add to search term
    events.type('j');

    let screen = getScreen();
    expect(screen).toContain('j'); // Should show "j" in search term
    expect(screen).toContain('Jackfruit'); // Should filter to jackfruit
    expect(screen).not.toContain('Apple');
    expect(screen).not.toContain('Banana');
  });

  /**
   * Bug reproduction test: k key triggering vim navigation instead of search
   *
   * Companion test to the j key bug - "k" should add to search, not navigate up.
   */
  it('should handle "k" key input properly for search (vim navigation bug fix)', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select fruits',
      choices: [
        { value: 'kiwi', name: 'Kiwi' },
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
      ],
    });

    // Type "k" - should add to search term, not navigate up
    events.type('k');

    let screen = getScreen();
    expect(screen).toContain('k'); // Should show "k" in search term
    expect(screen).toContain('Kiwi'); // Should filter to kiwi
    expect(screen).not.toContain('Apple');
    expect(screen).not.toContain('Banana');
  });

  it('should handle async source function', async () => {
    const mockSource = async (term?: string) => {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate async
      const items = [
        { value: 'item1', name: 'Item One' },
        { value: 'item2', name: 'Item Two' },
        { value: 'item3', name: 'Another Item' },
      ];

      if (!term) return items;
      return items.filter((item) =>
        item.name.toLowerCase().includes(term.toLowerCase()),
      );
    };

    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Search items',
      source: mockSource,
    });

    // Wait for initial load by polling for expected content
    await waitForCondition(() => {
      const screen = getScreen();
      return screen.includes('Item One') && screen.includes('Item Two') && screen.includes('Another Item');
    });

    let screen = getScreen();
    expect(screen).toContain('Item One');
    expect(screen).toContain('Item Two');
    expect(screen).toContain('Another Item');

    // Search for specific term
    events.type('another');
    
    // Wait for search results by polling for expected content
    await waitForCondition(() => {
      const screen = getScreen();
      return !screen.includes('Item One') && !screen.includes('Item Two') && screen.includes('Another Item');
    });

    screen = getScreen();
    expect(screen).not.toContain('Item One');
    expect(screen).not.toContain('Item Two');
    expect(screen).toContain('Another Item');
  });

  it('should handle empty search results', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana', 'Cherry'],
    });

    events.type('xyz'); // Search term that matches nothing
    const screen = getScreen();

    expect(screen).not.toContain('Apple');
    expect(screen).not.toContain('Banana');
    expect(screen).not.toContain('Cherry');
    // Should show some indication of no results
    expect(screen).toContain('No choices available');
  });

  it('should maintain selections across filtering', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'apricot', name: 'Apricot' },
        { value: 'banana', name: 'Banana' },
      ],
    });

    // Select first item
    events.keypress('tab');
    let screen = getScreen();
    expect(screen).toContain('◉'); // Apple should be selected

    // Filter to items containing 'ap'
    events.type('ap');
    screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Apricot');
    expect(screen).not.toContain('Banana'); // Should be filtered out

    // Apple should still be selected even after filtering
    const lines = screen.split('\n');
    const appleLine = lines.find((line: string) => line.includes('Apple'));
    expect(appleLine).toContain('◉');

    // Clear filter
    events.keypress('backspace');
    events.keypress('backspace');
    screen = getScreen();

    // All items should be visible again, and Apple should still be selected
    expect(screen).toContain('Apple');
    expect(screen).toContain('Apricot');
    expect(screen).toContain('Banana');

    const newLines = screen.split('\n');
    const newAppleLine = newLines.find((line: string) =>
      line.includes('Apple'),
    );
    expect(newAppleLine).toContain('◉'); // Should still be selected
  });
});
