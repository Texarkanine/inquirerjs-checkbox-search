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
    events.keypress('tab');
    screen = getScreen();

    // Should show selection
    expect(screen).toContain('◉'); // Should show at least one checked item
    expect(screen).toContain('◯'); // Should still show unchecked items

    // Press tab again to deselect
    events.keypress('tab');
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
    events.type('app');
    let screen = getScreen();
    expect(screen).toContain('Search:');
    expect(screen).toContain('app'); // Should show search term

    // Press tab to select/toggle item - should NOT add tab character to search
    events.keypress('tab');
    screen = getScreen();

    // Verify selection happened
    expect(screen).toContain('◉'); // Should show Apple is selected

    // Critical: Search term should still be 'app', NOT 'app\t' or 'app    ' (spaces from tab)
    expect(screen).toContain('app'); // Should still show original search term
    expect(screen).not.toMatch(/app\s+\t/); // Should not contain tab character after 'app'
    expect(screen).not.toMatch(/Search:.*\t/); // Should not contain tab character in search line
    expect(screen).not.toMatch(/app\s{2,}/); // Should not contain multiple spaces after 'app' (from tab conversion)

    // Type more text - should work normally
    events.type('le');
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
    events.type('te');
    events.keypress('tab'); // This should toggle selection, not add spaces to search
    events.type('st');

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
    events.keypress('tab'); // Select Apple

    // Verify selection happened
    let screen = getScreen();
    expect(screen).toContain('◉'); // Should show checked item

    // Press Enter to submit - THIS SHOULD WORK but previously failed
    events.keypress('enter');
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
    events.type('a');
    let screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Banana'); // Both contain 'a'
    expect(screen).not.toContain('Cherry'); // Should be filtered out

    // Select the filtered item
    events.keypress('tab'); // Select Apple

    // Clear the search term by backspacing
    events.keypress('backspace');
    screen = getScreen();
    expect(screen).toContain('Apple');
    expect(screen).toContain('Banana'); // Should show all items again
    expect(screen).toContain('◉'); // Apple should still be selected

    // Press Enter to submit - THIS SHOULD WORK but previously failed
    events.keypress('enter');
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
    events.keypress('tab');

    // 2. down arrow
    events.keypress('down');

    // 3. tab (select 2nd item)
    events.keypress('tab');

    // 4. type "mel" (filters to melons)
    events.type('mel');

    let screen = getScreen();
    expect(screen).toContain('Search: mel'); // Should show search term
    expect(screen).toContain('Watermelon');
    expect(screen).toContain('Melon');
    expect(screen).not.toContain('Apple');
    expect(screen).not.toContain('Orange');

    // 5. Test backspace behavior - should delete "l" on first backspace
    events.keypress('backspace');

    screen = getScreen();
    expect(screen).toContain('Search: me'); // Should show "me" after deleting "l"
    expect(screen).not.toContain('Search: mel');

    // Verify it's working properly - should only require one backspace per character
    events.keypress('backspace');

    screen = getScreen();
    expect(screen).toContain('Search: m'); // Should show "m" after deleting "e"
    expect(screen).not.toContain('Search: me');
  });

  /**
   * Bug reproduction test: Multiple tab selections corrupting search state
   *
   * Making multiple tab selections could accumulate phantom characters
   * in the search input, requiring multiple backspaces to clear. This test
   * ensures clean search state regardless of selection history.
   */
  it('should handle multiple tab selections without corrupting search state', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select fruits',
      choices: [
        { value: 'apple', name: 'Apple' },
        { value: 'banana', name: 'Banana' },
        { value: 'cherry', name: 'Cherry' },
        { value: 'date', name: 'Date' },
      ],
    });

    // Make multiple tab selections
    events.keypress('tab'); // Select Apple
    events.keypress('down');
    events.keypress('tab'); // Select Banana
    events.keypress('down');
    events.keypress('tab'); // Select Cherry

    // Now type a search term
    events.type('d');

    let screen = getScreen();
    expect(screen).toContain('d'); // Should show "d" immediately
    expect(screen).toContain('Date');
    expect(screen).not.toContain('Apple');
    expect(screen).not.toContain('Banana');
    expect(screen).not.toContain('Cherry');

    // Verify backspace works properly
    events.keypress('backspace');

    screen = getScreen();
    expect(screen).not.toContain('d'); // Search term should be empty
    expect(screen).toContain('Apple');
    expect(screen).toContain('Banana');
    expect(screen).toContain('Cherry');
    expect(screen).toContain('Date');
  });

  it('should handle pre-selected choices', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'apple', name: 'Apple', checked: true },
        { value: 'banana', name: 'Banana' },
        { value: 'cherry', name: 'Cherry', checked: true },
      ],
    });

    // Should show pre-selected items
    let screen = getScreen();
    const lines = screen.split('\n');
    const appleLine = lines.find((line: string) => line.includes('Apple'));
    const bananaLine = lines.find((line: string) => line.includes('Banana'));
    const cherryLine = lines.find((line: string) => line.includes('Cherry'));

    expect(appleLine).toContain('◉'); // Should be pre-selected
    expect(bananaLine).toContain('◯'); // Should not be selected
    expect(cherryLine).toContain('◉'); // Should be pre-selected

    // Can still toggle selections
    events.keypress('tab'); // Toggle Apple (should deselect)
    screen = getScreen();

    const newLines = screen.split('\n');
    const newAppleLine = newLines.find((line: string) =>
      line.includes('Apple'),
    );
    expect(newAppleLine).toContain('◯'); // Should now be deselected
  });

  it('should return array of selected values on enter', async () => {
    const { answer, events } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'val1', name: 'Option 1' },
        { value: 'val2', name: 'Option 2' },
        { value: 'val3', name: 'Option 3' },
      ],
    });

    // Select first and third options
    events.keypress('tab'); // Select first
    events.keypress('down');
    events.keypress('down');
    events.keypress('tab'); // Select third

    // Submit
    events.keypress('enter');

    await expect(answer).resolves.toEqual(['val1', 'val3']);
  });

  /**
   * Tab key behavior test: Ensuring tab selects rather than autocompletes
   *
   * This test ensures that the tab key is used for selection/toggling choices
   * rather than performing autocomplete functionality that might be expected
   * in other search interfaces.
   */
  it('should toggle selection with tab key, not perform autocomplete', async () => {
    const { events, getScreen } = await render(checkboxSearch, {
      message: 'Select items',
      choices: [
        { value: 'javascript', name: 'JavaScript' },
        { value: 'typescript', name: 'TypeScript' },
        { value: 'python', name: 'Python' },
      ],
    });

    // Type partial search
    events.type('java');
    let screen = getScreen();
    expect(screen).toContain('JavaScript');
    expect(screen).not.toContain('TypeScript');
    expect(screen).not.toContain('Python');

    // Press tab to select/toggle the highlighted choice (JavaScript)
    events.keypress('tab');
    screen = getScreen();

    // Should show JavaScript as selected (checked)
    expect(screen).toContain('◉'); // Should show checked item

    // Search term should still be 'java', NOT autocompleted to 'JavaScript'
    expect(screen).toContain('java'); // Original search term preserved
    expect(screen).toContain('JavaScript'); // Still shows the filtered choice

    // Should NOT show any tab characters in search
    expect(screen).not.toMatch(/Search:.*\t/);
  });
});
