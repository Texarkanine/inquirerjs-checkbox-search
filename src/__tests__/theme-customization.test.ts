import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

describe('Theme customization', () => {
  it('should use custom icons when provided', async () => {
    const { getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana'],
      theme: {
        icon: {
          checked: '✓',
          unchecked: '○',
          cursor: '→',
        },
      },
    });

    const screen = getScreen();
    expect(screen).toContain('○ Apple'); // Custom unchecked icon
    expect(screen).toContain('○ Banana');
    expect(screen).toContain('→'); // Custom cursor icon
  });

  /**
   * Bug reproduction test: Custom theme icons not applying correctly
   *
   * Previously, custom theme icons weren't being applied consistently,
   * especially when toggling between selected and unselected states.
   */
  it('should apply custom theme icons correctly', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
      ],
      theme: {
        icon: {
          checked: '✅',
          unchecked: '⬜',
          cursor: '👉',
        },
      },
    });

    let screen = getScreen();
    // Should show custom unchecked icon
    expect(screen).toContain('⬜ Apple');
    expect(screen).toContain('⬜ Banana');
    // Should show custom cursor
    expect(screen).toContain('👉');

    // Select first item
    await events.keypress('tab');
    screen = getScreen();

    // Should show custom checked icon
    expect(screen).toContain('✅ Apple');
    // Should still show custom unchecked for unselected
    expect(screen).toContain('⬜ Banana');
  });

  it('should use custom styling functions', async () => {
    const customSearchStyle = (text: string) => `<<${text}>>`;
    const customDescriptionStyle = (text: string) => `**${text}**`;

    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple', description: 'Red fruit' },
        { value: 'banana', name: 'Banana', description: 'Yellow fruit' },
      ],
      theme: {
        style: {
          searchTerm: customSearchStyle,
          description: customDescriptionStyle,
        },
      },
    });

    // Type search term
    await events.type('app');
    const screen = getScreen();

    // Should use custom search term styling
    expect(screen).toContain('<<app>>');
    // Should use custom description styling
    expect(screen).toContain('**Red fruit**');
  });

  it('should apply custom theme style functions correctly', async () => {
    const customHighlight = (text: string) => `<<${text}>>`;
    const customDescription = (text: string) => `**${text}**`;

    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple', description: 'Red fruit' },
        { value: 'banana', name: 'Banana', description: 'Yellow fruit' },
      ],
      theme: {
        style: {
          highlight: customHighlight,
          description: customDescription,
        },
      },
    });

    let screen = getScreen();
    // Should apply custom highlighting to active item
    expect(screen).toContain('<<Apple>>');
    // Should apply custom description styling
    expect(screen).toContain('**Red fruit**');

    // Navigate to second item
    await events.keypress('down');
    screen = getScreen();

    // Should apply custom highlighting to new active item
    expect(screen).toContain('<<Banana>>');
    // Should apply custom description styling to new description
    expect(screen).toContain('**Yellow fruit**');
  });

  /**
   * Checked (inactive) and disabled labels must go through theme.style hooks.
   * Theme-injection oracles — not default glyphs — kill renderItem branch mutants.
   */
  it('should apply custom checked and disabled style functions', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple', checked: true },
        { value: 'banana', name: 'Banana', disabled: true },
        { value: 'cherry', name: 'Cherry' },
        { value: 'date', name: 'Date' },
      ],
      theme: {
        style: {
          checked: (text: string) => `[[${text}]]`,
          disabled: (text: string) => `xx${text}xx`,
        },
      },
    });

    // Disabled Banana is skipped — one down lands on Cherry; Apple is inactive+checked
    await events.keypress('down');
    const screen = getScreen();

    expect(screen).toContain('[[Apple]]');
    expect(screen).toContain('xxBananaxx');
    expect(screen).toContain('xx(disabled)xx');
    // Inactive unchecked Date must not get checked style (kills isChecked → true)
    expect(screen).not.toContain('[[Date]]');
    expect(screen).not.toContain('[[Cherry]]');
    expect(screen).not.toContain('xxCherryxx');
  });

  it('should support function-based icon theming', async () => {
    const customChecked = (text: string) => `✅ ${text}`;
    const customUnchecked = (text: string) => `⬜ ${text}`;
    const customCursor = (text: string) => `👉 ${text}`;

    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana'],
      theme: {
        icon: {
          checked: customChecked,
          unchecked: customUnchecked,
          cursor: customCursor,
        },
      },
    });

    let screen = getScreen();
    // Should show function-based cursor
    expect(screen).toContain('👉 Apple');
    // Should show function-based unchecked
    expect(screen).toContain('⬜ Apple');

    // Select first item
    await events.keypress('tab');
    screen = getScreen();

    // Should show function-based checked
    expect(screen).toContain('✅ Apple');
  });

  it('should support mixed string and function icon theming', async () => {
    // Mix of string and function icons
    const customChecked = (text: string) => `🎯 ${text}`;

    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana'],
      theme: {
        icon: {
          checked: customChecked, // Function
          unchecked: '⬜', // String
          cursor: '👉', // String
        },
      },
    });

    let screen = getScreen();
    expect(screen).toContain('👉'); // String cursor
    expect(screen).toContain('⬜ Apple'); // String unchecked

    // Select first item
    await events.keypress('tab');
    screen = getScreen();

    // Should show function-based checked icon
    expect(screen).toContain('🎯 Apple');
    // Should still show string-based unchecked for other items
    expect(screen).toContain('⬜ Banana');
  });

  it('should maintain cursor position when toggling selection on non-first items', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana', 'Cherry'],
      theme: {
        icon: {
          cursor: '→',
        },
      },
    });

    // Navigate to second item
    await events.keypress('down');
    let screen = getScreen();

    // Verify cursor is on Banana
    const lines = screen.split('\n');
    const bananaLine = lines.find((line: string) => line.includes('Banana'));
    expect(bananaLine).toContain('→');

    // Toggle selection
    await events.keypress('tab');
    screen = getScreen();

    // Cursor should still be on Banana
    const newLines = screen.split('\n');
    const newBananaLine = newLines.find((line: string) =>
      line.includes('Banana'),
    );
    expect(newBananaLine).toContain('→');
    expect(newBananaLine).toContain('◉'); // Should be selected
  });
});
