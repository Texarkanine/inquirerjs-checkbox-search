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

describe('Edge cases', () => {
  it('should handle empty choices array', async () => {
    const { getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [],
    });

    const screen = getScreen();
    expect(screen).toContain('Select items');
    expect(screen).toMatch(/no.*choices|empty|nothing.*select/i);
  });

  it('should handle large numbers of choices', async () => {
    const manyChoices = Array.from({ length: 1000 }, (_, i) => ({
      value: `item${i}`,
      name: `Item ${i}`,
    }));

    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: manyChoices,
      pageSize: 10,
    });

    const screen = getScreen();
    expect(screen).toContain('Item 0');
    expect(screen).toContain('Item 9'); // Should show first page
    expect(screen).not.toContain('Item 50'); // Should not show items beyond page size

    // Search should work with large dataset
    await events.type('100');
    await waitForCondition(() => getScreen().includes('Item 100'));
    const searchScreen = getScreen();
    expect(searchScreen).toContain('Item 100');
    expect(searchScreen).not.toContain('Item 200');
  });

  it('should handle large page sizes', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: Array.from({ length: 200 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      })),
      pageSize: 100,
    });

    let screen = getScreen();
    expect(screen).toContain('Item 0');
    expect(screen).toContain('Item 99'); // Should show up to pageSize-1

    // Search to filter results
    await events.type('100');
    await waitForCondition(() => getScreen().includes('Item 100'));
    screen = getScreen();
    expect(screen).toContain('Item 100');
    expect(screen).not.toContain('Item 0');
  });

  it('should handle special characters in choices', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'emoji', name: '🚀 Rocket' },
        { value: 'unicode', name: 'Iñtërnâtiônàlizætiøn' },
        { value: 'symbols', name: 'Special @#$%^&*() symbols' },
      ],
    });

    let screen = getScreen();
    expect(screen).toContain('🚀 Rocket');
    expect(screen).toContain('Iñtërnâtiônàlizætiøn');
    expect(screen).toContain('Special @#$%^&*() symbols');

    // Search with emoji
    await events.type('🚀');
    await waitForCondition(() => {
      const currentScreen = getScreen();
      return (
        currentScreen.includes('🚀 Rocket') &&
        !currentScreen.includes('Iñtërnâtiônàlizætiøn')
      );
    });
    screen = getScreen();
    expect(screen).toContain('🚀 Rocket');
    expect(screen).not.toContain('Iñtërnâtiônàlizætiøn');

    // Clear and search with unicode
    await events.keypress('backspace');
    await events.type('Iñt');
    await waitForCondition(() => {
      const currentScreen = getScreen();
      return (
        currentScreen.includes('Iñtërnâtiônàlizætiøn') &&
        !currentScreen.includes('🚀 Rocket')
      );
    });
    screen = getScreen();
    expect(screen).toContain('Iñtërnâtiônàlizætiøn');
    expect(screen).not.toContain('🚀 Rocket');
  });

  describe('backspace deletes one grapheme cluster', () => {
    // Each search term below is a single grapheme built from more than one code
    // point (except the control case). One backspace must clear the whole
    // cluster: code-point deletion would leave debris that keeps filtering.
    // Debris is detectable because 'Banana' has no 'e' — it only reappears when
    // the search term is truly empty.
    it.each([
      ['ZWJ sequence', '👨‍👩‍👧'],
      ['regional indicator flag', '🇺🇸'],
      ['skin tone modifier', '👍🏽'],
      ['combining mark', 'e\u0301'],
      ['single code point emoji', '😀'],
    ])('should clear a %s in one press', async (_name, term) => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select fruits',
        choices: ['Apple', 'Banana', 'Cherry'],
      });

      await events.type(term);
      await waitForCondition(() =>
        getScreen().includes('No choices available'),
      );

      await events.keypress('backspace');
      await waitForCondition(() => getScreen().includes('Banana'));

      const screen = getScreen();
      expect(screen).toContain('Apple');
      expect(screen).toContain('Banana');
      expect(screen).toContain('Cherry');
    });
  });
});
