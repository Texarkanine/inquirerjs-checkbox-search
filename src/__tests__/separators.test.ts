import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch, { Separator } from '../index.js';

describe('Separators', () => {
  it('should handle separators in choice list', async () => {
    const { answer, events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Item 1', new Separator(), 'Item 2', 'Item 3'],
    });

    const screen = getScreen();
    expect(screen).toContain('Item 1');
    expect(screen).toContain('Item 2');
    expect(screen).toContain('Item 3');

    // Select items
    await events.keypress('tab'); // Select Item 1
    await events.keypress('down'); // Should skip separator and go to Item 2
    await events.keypress('tab'); // Select Item 2
    await events.keypress('enter');

    await expect(answer).resolves.toEqual(['Item 1', 'Item 2']);
  });
});
