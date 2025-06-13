import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

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
    screen = getScreen();
    expect(screen).toContain('🚀 Rocket');
    expect(screen).not.toContain('Iñtërnâtiônàlizætiøn');

    // Clear and search with unicode
    await events.keypress('backspace');
    await events.keypress('backspace'); // Emoji might need multiple backspaces
    await events.type('Iñt');
    screen = getScreen();
    expect(screen).toContain('Iñtërnâtiônàlizætiøn');
    expect(screen).not.toContain('🚀 Rocket');
  });
});
