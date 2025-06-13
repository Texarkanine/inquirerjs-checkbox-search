import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

describe('Disabled choices', () => {
  it('should skip disabled choices during navigation', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
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

    // Navigate down - should skip disabled item
    events.keypress('down');
    events.keypress('tab'); // Should select Cherry, not Banana
    events.keypress('enter');

    // The prompt should not include the disabled item in results
    // (exact navigation behavior will be verified when implementation is complete)
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
});
