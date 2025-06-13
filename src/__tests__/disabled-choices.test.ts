import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

describe('Disabled choices', () => {
  it('should skip disabled choices during navigation', async () => {
    const { answer, events, getScreen } = await render(checkboxSearch, {
      message: 'Select fruits',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana', disabled: true },
        { value: 'cherry', name: 'Cherry' },
      ],
    });

    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Banana');
    expect(screen).toContain('Cherry');

    // Navigate down - should skip disabled Banana
    await events.keypress('down');
    await events.keypress('tab'); // Should select Cherry, not Banana
    await events.keypress('enter');

    await expect(answer).resolves.toEqual(['cherry']);
  });

  it('should display disabled choices with different styling', async () => {
    const { getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'enabled', name: 'Enabled Item' },
        { value: 'disabled1', name: 'Disabled Item 1', disabled: true },
        {
          value: 'disabled2',
          name: 'Disabled Item 2',
          disabled: 'Custom reason',
        },
      ],
    });

    const screen = getScreen();
    expect(screen).toContain('Enabled Item');
    expect(screen).toContain('Disabled Item 1');
    expect(screen).toContain('Disabled Item 2');

    // Should show disabled indicator
    expect(screen).toContain('disabled');
    expect(screen).toContain('Custom reason');
  });

  it('should show disabled status for disabled choices', async () => {
    const { getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'available', name: 'Available Item' },
        {
          value: 'disabled',
          name: 'Disabled Item',
          disabled: 'This item is disabled',
        },
      ],
    });

    const screen = getScreen();
    expect(screen).toContain('Available Item');
    expect(screen).toContain('Disabled Item');
    expect(screen).toContain('This item is disabled');
  });
});
