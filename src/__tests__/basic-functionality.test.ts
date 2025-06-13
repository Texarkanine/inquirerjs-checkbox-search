import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

describe('Basic functionality', () => {
  it('should render with static choices', async () => {
    const { answer, events, getScreen } = await render(checkboxSearch, {
      message: 'Select options',
      choices: [
        { value: 'option1', name: 'Option 1' },
        { value: 'option2', name: 'Option 2' },
        { value: 'option3', name: 'Option 3' },
      ],
    });

    const screen = getScreen();
    expect(screen).toContain('Select options');
    expect(screen).toContain('Option 1');
    expect(screen).toContain('Option 2');
    expect(screen).toContain('Option 3');
    expect(screen).toContain('❯'); // cursor indicator

    // Should be able to complete with no selections initially
    events.keypress('enter');
    await expect(answer).resolves.toEqual([]);
  });

  it('should handle string choices', async () => {
    const { answer, events, getScreen } = await render(checkboxSearch, {
      message: 'Select frameworks',
      choices: ['React', 'Vue', 'Angular'],
    });

    const screen = getScreen();
    expect(screen).toContain('Select frameworks');
    expect(screen).toContain('React');
    expect(screen).toContain('Vue');
    expect(screen).toContain('Angular');

    // Select first option and confirm
    events.keypress('tab');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(['React']);
  });

  it('should display help instructions', async () => {
    const { getScreen } = await render(checkboxSearch, {
      message: 'Select options',
      choices: ['Option 1', 'Option 2'],
    });

    const screen = getScreen();
    expect(screen).toContain('Tab');
    expect(screen).toContain('Enter'); // Capitalized as it appears in help text
    expect(screen).toMatch(/Tab.*to select/i);
  });

  it('should display custom help instructions', async () => {
    const { getScreen } = await render(checkboxSearch, {
      message: 'Select options',
      choices: ['Option 1', 'Option 2'],
      instructions: 'tibbity-tab to select, entery-denter to submit',
    });

    const screen = getScreen();
    expect(screen).toContain('tibbity-tab to select');
    expect(screen).toContain('entery-denter to submit');
  });

  it('should hide help instructions when instructions is false', async () => {
    const { getScreen } = await render(checkboxSearch, {
      message: 'Select options',
      choices: ['Option 1', 'Option 2'],
      instructions: false,
    });

    const screen = getScreen();
    expect(screen).toContain('Select options');
    expect(screen).toContain('Option 1');
    expect(screen).toContain('Option 2');

    // Should NOT contain default help text when instructions is false
    expect(screen).not.toContain('Tab to select');
    expect(screen).not.toContain('Enter to submit');
    expect(screen).not.toContain('(Tab to select, Enter to submit)');
  });
});
