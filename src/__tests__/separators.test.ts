import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch, { Separator } from '../index.js';

describe('Separators', () => {
  it('should handle separators in choice list', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'item1', name: 'Item 1' },
        new Separator('--- Group 2 ---'),
        { value: 'item2', name: 'Item 2' },
        { value: 'item3', name: 'Item 3' },
      ],
    });

    const screen = getScreen();
    expect(screen).toContain('Item 1');
    expect(screen).toContain('--- Group 2 ---');
    expect(screen).toContain('Item 2');
    expect(screen).toContain('Item 3');

    // Navigate and select - should skip separator
    events.keypress('tab'); // Select Item 1
    events.keypress('down'); // Should skip separator and go to Item 2
    events.keypress('tab'); // Select Item 2
    events.keypress('enter');
  });
});
