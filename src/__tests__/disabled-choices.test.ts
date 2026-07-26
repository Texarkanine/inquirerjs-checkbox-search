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

  it('should show default and custom disabled reason text', async () => {
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

    const lines = getScreen().split('\n');
    const enabled = lines.find((l) => l.includes('Enabled Item'));
    const disabledDefault = lines.find((l) => l.includes('Disabled Item 1'));
    const disabledCustom = lines.find((l) => l.includes('Disabled Item 2'));

    expect(enabled).toBeDefined();
    expect(disabledDefault).toContain('(disabled)');
    expect(disabledCustom).toContain('(Custom reason)');
    expect(enabled).not.toMatch(/\([^)]+\)/);
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

    const lines = getScreen().split('\n');
    const available = lines.find((l) => l.includes('Available Item'));
    const disabled = lines.find((l) => l.includes('Disabled Item'));

    expect(disabled).toContain('(This item is disabled)');
    expect(available).not.toMatch(/\([^)]+\)/);
  });
});
