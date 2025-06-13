import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

// Utility function to wait for a condition to be true with polling
async function waitForCondition(
  condition: () => boolean,
  timeout = 1000,
  interval = 10,
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

describe('Search and filtering', () => {
  it('should filter choices based on search term', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select fruits',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
        { value: 'cherry', name: 'Cherry' },
        { value: 'date', name: 'Date' },
        { value: 'elderberry', name: 'Elderberry' },
      ],
    });

    // Type search term
    await events.type('app');
    const screen = getScreen();

    // Should show only items containing "app" (case-insensitive)
    expect(screen).toContain('Apple');
    expect(screen).not.toContain('Banana');
    expect(screen).not.toContain('Cherry');
    expect(screen).not.toContain('Date');
    expect(screen).not.toContain('Elderberry');
  });

  it('should handle case-insensitive filtering', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select fruits',
      choices: ['Apple', 'Banana', 'Cherry'],
    });

    // Search with uppercase
    await events.type('APPLE');
    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).not.toContain('Banana');
    expect(screen).not.toContain('Cherry');
  });

  it('should clear filter with backspace', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select fruits',
      choices: ['Apple', 'Banana', 'Cherry'],
    });

    // Type search term
    await events.type('ap');
    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).not.toContain('Banana');
    expect(screen).not.toContain('Cherry');

    // Clear with backspace
    await events.keypress('backspace');
    await events.keypress('backspace');
    screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Banana');
    expect(screen).toContain('Cherry');
  });

  it('should clear filter with escape key', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select fruits',
      choices: ['Apple', 'Banana', 'Cherry'],
    });

    // Type search term
    await events.type('ap');
    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).not.toContain('Banana');
    expect(screen).not.toContain('Cherry');

    // Clear with escape
    await events.keypress('escape');
    screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Banana');
    expect(screen).toContain('Cherry');
  });

  it('should maintain selections across filtering', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select fruits',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'apricot', name: 'Apricot' },
        { value: 'banana', name: 'Banana' },
      ],
    });

    // Filter to show only items with 'ap'
    await events.type('ap');
    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Apricot');
    expect(screen).not.toContain('Banana');

    // Select Apple and Apricot
    await events.keypress('tab'); // Select Apple
    await events.keypress('down');
    await events.keypress('tab'); // Select Apricot

    screen = getScreen();
    expect(screen).toContain('◉'); // Should show selections

    // Clear filter to show all items
    await events.keypress('escape');
    screen = getScreen();

    // Should show all items and maintain selections
    expect(screen).toContain('Apple');
    expect(screen).toContain('Apricot');
    expect(screen).toContain('Banana');
    expect(screen).toContain('◉'); // Selections should be maintained
  });

  it('should handle empty search results', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana', 'Cherry'],
    });

    // Search for something that doesn't exist
    await events.type('xyz'); // Search term that matches nothing
    const screen = getScreen();

    // Should show no items, just the search input
    expect(screen).not.toContain('Apple');
    expect(screen).not.toContain('Banana');
    expect(screen).not.toContain('Cherry');
    expect(screen).toContain('xyz'); // Should show the search term
  });

  it('should handle tab selection after filtering', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
      ],
    });

    // Search and select
    await events.keypress('tab');
    let screen = getScreen();
    expect(screen).toContain('◉'); // Apple should be selected

    // Search for 'ap' and verify selection persists
    await events.type('ap');
    screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).not.toContain('Banana'); // Should be filtered out
    expect(screen).toContain('◉'); // Selection should persist
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
    await events.type('ap');
    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).not.toContain('Banana');
    expect(screen).not.toContain('Cherry');

    // Press Escape to clear the search filter
    await events.keypress('escape');
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
    await events.type('ap');
    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Apricot');
    expect(screen).not.toContain('Banana');

    // Select both filtered items
    await events.keypress('tab'); // Select Apple
    await events.keypress('down');
    await events.keypress('tab'); // Select Apricot

    screen = getScreen();
    // Both should be selected
    const lines = screen.split('\n');
    const appleLine = lines.find((line: string) => line.includes('Apple'));
    const apricotLine = lines.find((line: string) => line.includes('Apricot'));
    expect(appleLine).toContain('◉');
    expect(apricotLine).toContain('◉');

    // Press Escape to clear the search filter
    await events.keypress('escape');
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
    await events.type('j');

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
    await events.type('k');

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
      return (
        screen.includes('Item One') &&
        screen.includes('Item Two') &&
        screen.includes('Another Item')
      );
    });

    let screen = getScreen();
    expect(screen).toContain('Item One');
    expect(screen).toContain('Item Two');
    expect(screen).toContain('Another Item');

    // Search for specific term
    await events.type('another');

    // Wait for search results by polling for expected content
    await waitForCondition(() => {
      const screen = getScreen();
      return (
        !screen.includes('Item One') &&
        !screen.includes('Item Two') &&
        screen.includes('Another Item')
      );
    });

    screen = getScreen();
    expect(screen).not.toContain('Item One');
    expect(screen).not.toContain('Item Two');
    expect(screen).toContain('Another Item');
  });
});
