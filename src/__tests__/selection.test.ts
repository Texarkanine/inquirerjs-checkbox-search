import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

describe('Multi-selection', () => {
  it('should toggle selection with tab key', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: ['Apple', 'Banana', 'Cherry'],
    });

    // Initially no items selected
    let screen = getScreen();
    expect(screen).toContain('◯'); // unchecked (default theme)
    expect(screen).not.toContain('◉'); // checked

    // Press tab to select first item
    await events.keypress('tab');
    screen = getScreen();

    // Should show selection
    expect(screen).toContain('◉'); // Should show at least one checked item
    expect(screen).toContain('◯'); // Should still show unchecked items

    // Press tab again to deselect
    await events.keypress('tab');
    screen = getScreen();

    // Should be back to no selections
    expect(screen).toContain('◯');
    expect(screen).not.toContain('◉');
  });

  /**
   * Bug reproduction test: Tab key was adding tab characters to search text
   *
   * Previously, pressing tab to select items would insert tab characters or spaces
   * into the search input field, corrupting the search term. This test ensures
   * that tab selection is properly isolated from search input handling.
   */
  it('should not add tab characters to search text when toggling selections', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
        { value: 'cherry', name: 'Cherry' },
      ],
    });

    // Type some search text
    await events.type('app');
    let screen = getScreen();
    expect(screen).toContain('Search:');
    expect(screen).toContain('app'); // Should show search term

    // Press tab to select/toggle item - should NOT add tab character to search
    await events.keypress('tab');
    screen = getScreen();

    // Verify selection happened
    expect(screen).toContain('◉'); // Should show Apple is selected

    // Critical: Search term should still be 'app', NOT 'app\t' or 'app    ' (spaces from tab)
    expect(screen).toContain('app'); // Should still show original search term
    expect(screen).not.toMatch(/app\s+\t/); // Should not contain tab character after 'app'
    expect(screen).not.toMatch(/Search:.*\t/); // Should not contain tab character in search line
    expect(screen).not.toMatch(/app\s{2,}/); // Should not contain multiple spaces after 'app' (from tab conversion)

    // Type more text - should work normally
    await events.type('le');
    screen = getScreen();
    expect(screen).toContain('apple'); // Should show 'apple' now
    expect(screen).not.toMatch(/\t/); // Should not contain any tab characters anywhere
    expect(screen).not.toMatch(/app\s+le/); // Should not have extra spaces between 'app' and 'le'
  });

  /**
   * Bug reproduction test: Readline tab-to-spaces conversion
   *
   * Some readline configurations convert tab characters to spaces, which could
   * corrupt search input when tab is used for selection. This test ensures
   * proper isolation between tab selection and search text.
   */
  it('should detect readline tab-to-spaces conversion bug', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [{ value: 'test', name: 'Test Item' }],
    });

    // Type 'te', press tab, type 'st' - should result in 'test', not 'te    st' (spaces from tab)
    await events.type('te');
    await events.keypress('tab'); // This should toggle selection, not add spaces to search
    await events.type('st');

    let screen = getScreen();

    // Should show selection happened (Test Item matches "test" search)
    expect(screen).toContain('◉'); // Test Item should be selected

    // Search should be 'test', not 'te    st' or similar with spaces
    expect(screen).toContain('test'); // Should show clean concatenated search
    expect(screen).not.toMatch(/te\s+st/); // Should NOT have spaces between te and st
    expect(screen).not.toMatch(/Search:.*te\s{2,}/); // Should NOT have multiple spaces after te
  });

  /**
   * Bug reproduction test: Enter key not working after selections
   *
   * Previously, making selections could interfere with the enter key functionality,
   * preventing form submission. This test ensures enter works reliably.
   */
  it('should submit with Enter even when no search term is visible', async () => {
    const { answer, events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
        { value: 'cherry', name: 'Cherry' },
      ],
    });

    // Select an item without any search
    await events.keypress('tab'); // Select Apple

    // Verify selection happened
    let screen = getScreen();
    expect(screen).toContain('◉'); // Should show checked item

    // Press Enter to submit - THIS SHOULD WORK but previously failed
    await events.keypress('enter');
    await expect(answer).resolves.toEqual(['apple']);
  });

  /**
   * Bug reproduction test: Enter key not working after search and clear
   *
   * A variant of the enter key bug where typing and then clearing search
   * could leave the prompt in a state where enter didn't work properly.
   */
  it('should submit with Enter after typing and clearing search term', async () => {
    const { answer, events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
        { value: 'cherry', name: 'Cherry' },
      ],
    });

    // Type a search term
    await events.type('a');
    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Banana'); // Both contain 'a'
    expect(screen).not.toContain('Cherry'); // Should be filtered out

    // Select the filtered item
    await events.keypress('tab'); // Select Apple

    // Clear the search term by backspacing
    await events.keypress('backspace');
    screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Banana'); // Should show all items again
    expect(screen).toContain('◉'); // Apple should still be selected

    // Press Enter to submit - THIS SHOULD WORK but previously failed
    await events.keypress('enter');
    await expect(answer).resolves.toEqual(['apple']);
  });

  /**
   * Bug reproduction test: Phantom input after tab selections
   *
   * After making tab selections, search input required an extra backspace
   * to "wake up" the cursor. This test ensures immediate search responsiveness
   * after tab operations.
   */
  it('should handle search input properly after tab selections', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select fruits',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'watermelon', name: 'Watermelon' },
        { value: 'melon', name: 'Melon' },
        { value: 'orange', name: 'Orange' },
      ],
    });

    // 1. tab (select first item)
    await events.keypress('tab');

    // 2. down arrow
    await events.keypress('down');

    // 3. tab (select 2nd item)
    await events.keypress('tab');

    // 4. type "mel" (filters to melons)
    await events.type('mel');

    let screen = getScreen();
    expect(screen).toContain('Search: mel'); // Should show search term
    expect(screen).toContain('Watermelon');
    expect(screen).toContain('Melon');
    expect(screen).not.toContain('Apple');
    expect(screen).not.toContain('Orange');

    // 5. Test backspace behavior - should delete "l" on first backspace
    await events.keypress('backspace');

    screen = getScreen();
    expect(screen).toContain('Search: me'); // Should show "me" after deleting "l"
    expect(screen).toContain('Watermelon');
    expect(screen).toContain('Melon');
    expect(screen).not.toContain('Apple');
    expect(screen).not.toContain('Orange');

    // Verify it's working properly - clear completely to show all items
    await events.keypress('backspace');
    await events.keypress('backspace'); // Clear the remaining "me"

    screen = getScreen();
    expect(screen).toContain('Search:'); // Should show empty search
    expect(screen).toContain('Apple');
    expect(screen).toContain('Watermelon');
    expect(screen).toContain('Melon');
    expect(screen).toContain('Orange');
  });

  it('should deselect previously selected item', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
        { value: 'cherry', name: 'Cherry' },
      ],
    });

    // Select Apple
    await events.keypress('tab');
    let screen = getScreen();
    expect(screen).toContain('◉'); // Should show Apple is selected

    // Go down to Banana and select it
    await events.keypress('down');
    await events.keypress('tab');
    screen = getScreen();
    expect(screen).toContain('◉'); // Should now have 2 selected items

    // Go back up to Apple and deselect it
    await events.keypress('up');
    await events.keypress('tab'); // Should deselect Apple
    screen = getScreen();

    // Check that Apple is no longer selected, but Banana still is
    const appleLineMatch = screen.match(/◯.*Apple/);
    const bananaLineMatch = screen.match(/◉.*Banana/);
    expect(appleLineMatch).toBeTruthy(); // Apple should be unselected (◯)
    expect(bananaLineMatch).toBeTruthy(); // Banana should still be selected (◉)
  });

  it('should handle multiple selections across different search states', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
        { value: 'cherry', name: 'Cherry' },
        { value: 'date', name: 'Date' },
      ],
    });

    // Select Apple, Banana, Cherry
    await events.keypress('tab'); // Select Apple
    await events.keypress('down');
    await events.keypress('tab'); // Select Banana
    await events.keypress('down');
    await events.keypress('tab'); // Select Cherry

    // Type 'd' to filter to Date
    await events.type('d');
    let screen = getScreen();
    expect(screen).toContain('Date');
    expect(screen).not.toContain('Apple');
    expect(screen).not.toContain('Banana');
    expect(screen).not.toContain('Cherry');

    // Clear search to see all items and their selection states
    await events.keypress('backspace');
    screen = getScreen();

    // All three should still be selected
    expect(screen).toMatch(/◉.*Apple/);
    expect(screen).toMatch(/◉.*Banana/);
    expect(screen).toMatch(/◉.*Cherry/);
    expect(screen).toMatch(/◯.*Date/); // Date should not be selected
  });

  it('should maintain selections when toggling same item', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
      ],
    });

    // Select Apple
    await events.keypress('tab');
    let screen = getScreen();
    expect(screen).toContain('◉'); // Apple selected

    // Deselect Apple
    await events.keypress('tab');
    screen = getScreen();
    expect(screen).not.toContain('◉'); // Apple deselected
    expect(screen).toContain('◯'); // All items unselected
  });

  it('should handle selection with multiple items having same starting letters', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'java', name: 'Java' },
        { value: 'javascript', name: 'JavaScript' },
        { value: 'python', name: 'Python' },
      ],
    });

    // Search for 'java' - should show both Java and JavaScript
    await events.type('java');
    let screen = getScreen();
    expect(screen).toContain('Java');
    expect(screen).toContain('JavaScript');
    expect(screen).not.toContain('Python');

    // Select the first item (Java)
    await events.keypress('tab');
    screen = getScreen();
    expect(screen).toContain('◉'); // Java should be selected
  });
});
