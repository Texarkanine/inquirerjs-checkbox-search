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
    events.type('100');
    const searchScreen = getScreen();
    expect(searchScreen).toContain('Item 100');
    expect(searchScreen).not.toContain('Item 200');
  });

  it('should handle choices with special characters', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'emoji', name: '🚀 Rocket Ship' },
        { value: 'unicode', name: 'Iñtërnâtiønàl' },
        { value: 'symbols', name: 'Special @#$%^&*()' },
        { value: 'newlines', name: 'Multi\nLine\nItem' },
      ],
    });

    let screen = getScreen();
    expect(screen).toContain('🚀 Rocket Ship');
    expect(screen).toContain('Iñtërnâtiønàl');
    expect(screen).toContain('Special @#$%^&*()');

    // Search should work with special characters
    events.type('🚀');
    screen = getScreen();
    expect(screen).toContain('🚀 Rocket Ship');
    expect(screen).not.toContain('Iñtërnâtiønàl');

    // Clear and search for unicode
    for (let i = 0; i < 5; i++) {
      events.keypress('backspace');
    }
    events.type('Iñt');
    screen = getScreen();
    expect(screen).toContain('Iñtërnâtiønàl');
    expect(screen).not.toContain('🚀 Rocket Ship');
  });
});
