import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

async function expectAnswerPending(answer: Promise<unknown>): Promise<void> {
  await expect(
    Promise.race([
      answer.then(() => 'resolved' as const),
      new Promise<'pending'>((resolve) =>
        setTimeout(() => resolve('pending'), 50),
      ),
    ]),
  ).resolves.toBe('pending');
}

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

  /**
   * B5: sync validate returning false must surface the default invalid message
   * and leave the prompt open.
   */
  it('should show Invalid selection when validate returns false', async () => {
    const { answer, events, getScreen, nextRender } = await render(
      checkboxSearch,
      {
        message: 'Select items',
        choices: ['Apple', 'Banana'],
        validate: () => false,
      },
    );

    await events.keypress('tab');
    await events.keypress('enter');
    await nextRender();

    expect(getScreen()).toContain('Invalid selection');
    await expectAnswerPending(answer);
  });

  /**
   * B6: async validate resolving to a string must show that string and keep the
   * prompt open.
   */
  it('should show async validate error string', async () => {
    const { answer, events, getScreen, nextRender } = await render(
      checkboxSearch,
      {
        message: 'Select items',
        choices: ['Apple', 'Banana'],
        validate: async () => 'Need a better selection',
      },
    );

    await events.keypress('tab');
    await events.keypress('enter');
    await nextRender();

    expect(getScreen()).toContain('Need a better selection');
    await expectAnswerPending(answer);
  });

  /**
   * B7: async validate resolving to false must show Invalid selection and keep
   * the prompt open.
   */
  it('should show Invalid selection when async validate returns false', async () => {
    const { answer, events, getScreen, nextRender } = await render(
      checkboxSearch,
      {
        message: 'Select items',
        choices: ['Apple', 'Banana'],
        validate: async () => false,
      },
    );

    await events.keypress('tab');
    await events.keypress('enter');
    await nextRender();

    expect(getScreen()).toContain('Invalid selection');
    await expectAnswerPending(answer);
  });

  /**
   * B8: async validate resolving to true must complete with the selected values.
   */
  it('should complete when async validate returns true', async () => {
    const { answer, events } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana'],
      validate: async () => true,
    });

    await events.keypress('tab');
    await events.keypress('enter');
    await expect(answer).resolves.toEqual(['Apple']);
  });

  /**
   * B9: async validate rejecting must show Validation failed and keep the prompt
   * open.
   */
  it('should show Validation failed when async validate rejects', async () => {
    const { answer, events, getScreen, nextRender } = await render(
      checkboxSearch,
      {
        message: 'Select items',
        choices: ['Apple', 'Banana'],
        validate: async () => {
          throw new Error('boom');
        },
      },
    );

    await events.keypress('tab');
    await events.keypress('enter');
    await nextRender();

    expect(getScreen()).toContain('Validation failed');
    await expectAnswerPending(answer);
  });
});
