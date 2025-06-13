import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

describe('Validation', () => {
  it('should enforce required selection', async () => {
    const { answer, events, getScreen } = await render(checkboxSearch, {
      message: 'Select at least one item',
      choices: ['Apple', 'Banana', 'Cherry'],
      required: true,
    });

    // Try to submit without selecting anything
    await events.keypress('enter');
    // Wait for next tick so validation message has time to render
    await new Promise((resolve) => setTimeout(resolve, 0));
    let screen = getScreen();
    expect(screen).toMatch(/at least one|required|must select/i);

    // Select an item and submit
    await events.keypress('tab');
    await events.keypress('enter');
    await expect(answer).resolves.toEqual(['Apple']);
  });

  it('should run custom validation function', async () => {
    const { answer, events, getScreen } = await render(checkboxSearch, {
      message: 'Select exactly 2 items',
      choices: ['Apple', 'Banana', 'Cherry', 'Date'],
      validate: (
        selections: ReadonlyArray<import('../index').NormalizedChoice<string>>,
      ) => {
        if (selections.length !== 2) {
          return 'Please select exactly 2 items';
        }
        return true;
      },
    });

    // Select only one item and try to submit
    await events.keypress('tab');
    await events.keypress('enter');
    let screen = getScreen();
    expect(screen).toContain('Please select exactly 2 items');

    // Select another item and submit
    await events.keypress('down');
    await events.keypress('tab');
    await events.keypress('enter');
    await expect(answer).resolves.toHaveLength(2);
  });

  it('should allow submission when validation passes', async () => {
    const { answer, events } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana', 'Cherry'],
      validate: (
        selections: ReadonlyArray<import('../index').NormalizedChoice<string>>,
      ) => {
        return selections.length > 0 ? true : 'Please select at least one item';
      },
    });

    // Select item and submit - should succeed
    await events.keypress('tab');
    await events.keypress('enter');
    await expect(answer).resolves.toEqual(['Apple']);
  });
});
