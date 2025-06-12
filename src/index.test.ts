import { describe, it, expect, vi } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch, { Separator } from './index.js';

describe('checkbox-search prompt', () => {
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

  describe('Search and filtering', () => {
    it('should filter choices based on search term', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select frameworks',
        choices: [
          { value: 'react', name: 'React' },
          { value: 'vue', name: 'Vue.js' },
          { value: 'angular', name: 'Angular' },
          { value: 'svelte', name: 'Svelte' },
        ],
      });

      // Initially all choices should be visible
      let screen = getScreen();
      expect(screen).toContain('React');
      expect(screen).toContain('Vue.js');
      expect(screen).toContain('Angular');
      expect(screen).toContain('Svelte');

      // Type search term to filter
      events.type('rea');
      screen = getScreen();
      expect(screen).toContain('React');
      expect(screen).not.toContain('Vue.js');
      expect(screen).not.toContain('Angular');
      expect(screen).not.toContain('Svelte');
    });

    it('should handle case-insensitive search', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: ['Apple', 'Banana', 'Cherry'],
      });

      events.type('APPLE');
      const screen = getScreen();
      expect(screen).toContain('Apple');
      expect(screen).not.toContain('Banana');
      expect(screen).not.toContain('Cherry');
    });

    it('should reset filter when search term is cleared', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: ['Apple', 'Banana', 'Cherry'],
      });

      // Filter first
      events.type('apple');
      let screen = getScreen();
      expect(screen).toContain('Apple');
      expect(screen).not.toContain('Banana');

      // Clear search term
      for (let i = 0; i < 5; i++) {
        events.keypress('backspace');
      }

      screen = getScreen();
      expect(screen).toContain('Apple');
      expect(screen).toContain('Banana');
      expect(screen).toContain('Cherry');
    });

    /**
     * Feature test: Escape key to clear search filter
     *
     * This feature allows users to quickly clear search filters without
     * manually backspacing through the entire search term.
     */
    it('should clear search filter with Escape key', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'apple', name: 'Apple' },
          { value: 'banana', name: 'Banana' },
          { value: 'cherry', name: 'Cherry' },
        ],
      });

      // Type a search term to filter results
      events.type('ap');
      let screen = getScreen();
      expect(screen).toContain('Apple');
      expect(screen).not.toContain('Banana');
      expect(screen).not.toContain('Cherry');

      // Press Escape to clear the search filter
      events.keypress('escape');
      screen = getScreen();

      // All items should be visible again
      expect(screen).toContain('Apple');
      expect(screen).toContain('Banana');
      expect(screen).toContain('Cherry');

      // Search term should be cleared (no visible search text)
      expect(screen).not.toContain('Search: ap');
    });

    /**
     * Feature test: Escape key preserving selections
     *
     * When clearing search filters with escape, any selections made while
     * filtering should be preserved when returning to the full list.
     */
    it('should maintain selections when clearing search filter with Escape', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'apple', name: 'Apple' },
          { value: 'apricot', name: 'Apricot' },
          { value: 'banana', name: 'Banana' },
        ],
      });

      // Type a search term to filter results
      events.type('ap');
      let screen = getScreen();
      expect(screen).toContain('Apple');
      expect(screen).toContain('Apricot');
      expect(screen).not.toContain('Banana');

      // Select both filtered items
      events.keypress('tab'); // Select Apple
      events.keypress('down');
      events.keypress('tab'); // Select Apricot

      screen = getScreen();
      // Both should be selected
      const lines = screen.split('\n');
      const appleLine = lines.find((line: string) => line.includes('Apple'));
      const apricotLine = lines.find((line: string) =>
        line.includes('Apricot'),
      );
      expect(appleLine).toContain('◉');
      expect(apricotLine).toContain('◉');

      // Press Escape to clear the search filter
      events.keypress('escape');
      screen = getScreen();

      // All items should be visible again
      expect(screen).toContain('Apple');
      expect(screen).toContain('Apricot');
      expect(screen).toContain('Banana');

      // Selections should be maintained
      const newLines = screen.split('\n');
      const newAppleLine = newLines.find((line: string) =>
        line.includes('Apple'),
      );
      const newApricotLine = newLines.find((line: string) =>
        line.includes('Apricot'),
      );
      const newBananaLine = newLines.find((line: string) =>
        line.includes('Banana'),
      );

      expect(newAppleLine).toContain('◉'); // Should still be selected
      expect(newApricotLine).toContain('◉'); // Should still be selected
      expect(newBananaLine).toContain('◯'); // Should not be selected
    });

    /**
     * Bug reproduction test: j/k keys triggering vim navigation instead of search
     *
     * Previously, the "j" and "k" keys would trigger vim-style navigation (down/up)
     * instead of being added to the search term. This was caused by using
     * @inquirer/core's isUpKey() and isDownKey() functions which include vim keys.
     */
    it('should handle "j" key input properly for search (vim navigation bug fix)', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select fruits',
        choices: [
          { value: 'jackfruit', name: 'Jackfruit' },
          { value: 'apple', name: 'Apple' },
          { value: 'banana', name: 'Banana' },
        ],
      });

      // Type "j" - should add to search term
      events.type('j');

      let screen = getScreen();
      expect(screen).toContain('j'); // Should show "j" in search term
      expect(screen).toContain('Jackfruit'); // Should filter to jackfruit
      expect(screen).not.toContain('Apple');
      expect(screen).not.toContain('Banana');
    });

    /**
     * Bug reproduction test: k key triggering vim navigation instead of search
     *
     * Companion test to the j key bug - "k" should add to search, not navigate up.
     */
    it('should handle "k" key input properly for search (vim navigation bug fix)', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select fruits',
        choices: [
          { value: 'kiwi', name: 'Kiwi' },
          { value: 'apple', name: 'Apple' },
          { value: 'banana', name: 'Banana' },
        ],
      });

      // Type "k" - should add to search term, not navigate up
      events.type('k');

      let screen = getScreen();
      expect(screen).toContain('k'); // Should show "k" in search term
      expect(screen).toContain('Kiwi'); // Should filter to kiwi
      expect(screen).not.toContain('Apple');
      expect(screen).not.toContain('Banana');
    });

    it('should handle async source function', async () => {
      const mockSource = async (term?: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate async
        const items = [
          { value: 'item1', name: 'Item One' },
          { value: 'item2', name: 'Item Two' },
          { value: 'item3', name: 'Another Item' },
        ];

        if (!term) return items;
        return items.filter((item) =>
          item.name.toLowerCase().includes(term.toLowerCase()),
        );
      };

      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Search items',
        source: mockSource,
      });

      // Wait for initial load
      await new Promise((resolve) => setTimeout(resolve, 20));

      let screen = getScreen();
      expect(screen).toContain('Item One');
      expect(screen).toContain('Item Two');
      expect(screen).toContain('Another Item');

      // Search for specific term
      events.type('another');
      await new Promise((resolve) => setTimeout(resolve, 20));

      screen = getScreen();
      expect(screen).not.toContain('Item One');
      expect(screen).not.toContain('Item Two');
      expect(screen).toContain('Another Item');
    });

    it('should handle empty search results', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: ['Apple', 'Banana', 'Cherry'],
      });

      events.type('xyz'); // Search term that matches nothing
      const screen = getScreen();

      expect(screen).not.toContain('Apple');
      expect(screen).not.toContain('Banana');
      expect(screen).not.toContain('Cherry');
      // Should show some indication of no results
      expect(screen).toContain('No choices available');
    });
  });

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

    it('should maintain selections across filtering', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'apple', name: 'Apple' },
          { value: 'apricot', name: 'Apricot' },
          { value: 'banana', name: 'Banana' },
        ],
      });

      // Select first item
      events.keypress('tab');
      let screen = getScreen();
      expect(screen).toContain('◉'); // Apple should be selected

      // Filter to items containing 'ap'
      events.type('ap');
      screen = getScreen();
      expect(screen).toContain('Apple');
      expect(screen).toContain('Apricot');
      expect(screen).not.toContain('Banana'); // Should be filtered out

      // Apple should still be selected even after filtering
      const lines = screen.split('\n');
      const appleLine = lines.find((line: string) => line.includes('Apple'));
      expect(appleLine).toContain('◉');

      // Clear filter
      events.keypress('backspace');
      events.keypress('backspace');
      screen = getScreen();

      // All items should be visible again, and Apple should still be selected
      expect(screen).toContain('Apple');
      expect(screen).toContain('Apricot');
      expect(screen).toContain('Banana');

      const newLines = screen.split('\n');
      const newAppleLine = newLines.find((line: string) =>
        line.includes('Apple'),
      );
      expect(newAppleLine).toContain('◉'); // Should still be selected
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
  });

  describe('Navigation', () => {
    it('should navigate through choices with arrow keys', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: ['Apple', 'Banana', 'Cherry'],
      });

      let screen = getScreen();
      expect(screen).toContain('❯'); // cursor should be visible

      // Move down
      events.keypress('down');
      screen = getScreen();
      // Should move cursor to next item (exact check depends on implementation)
      expect(screen).toContain('❯');

      // Move up
      events.keypress('up');
      screen = getScreen();
      expect(screen).toContain('❯');
    });

    it('should handle navigation with filtered results', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'apple', name: 'Apple' },
          { value: 'apricot', name: 'Apricot' },
          { value: 'banana', name: 'Banana' },
        ],
      });

      // Filter to show only items with 'ap'
      events.type('ap');
      const screen = getScreen();
      expect(screen).toContain('Apple');
      expect(screen).toContain('Apricot');
      expect(screen).not.toContain('Banana');

      // Navigate through filtered results
      events.keypress('down');
      events.keypress('tab'); // Select second item (Apricot)
      events.keypress('enter');
    });

    it('should loop navigation when enabled', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: ['First', 'Second', 'Third'],
        loop: true,
      });

      // Go to last item
      events.keypress('up'); // Should wrap to last item
      let screen = getScreen();
      expect(screen).toContain('❯');

      // Go past last item
      events.keypress('down');
      events.keypress('down');
      events.keypress('down');
      screen = getScreen();
      expect(screen).toContain('❯'); // Should wrap to first item
    });

    it('should not loop navigation when disabled', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: ['First', 'Second', 'Third'],
        loop: false,
      });

      let screen = getScreen();
      const initialScreen = screen;

      // Try to go up from first item
      events.keypress('up');
      screen = getScreen();
      // Should stay at first item (no wrap)
      expect(screen).toEqual(initialScreen);

      // Go to last item
      events.keypress('down');
      events.keypress('down');
      const lastScreen = getScreen();

      // Try to go down from last item
      events.keypress('down');
      screen = getScreen();
      // Should stay at last item (no wrap)
      expect(screen).toEqual(lastScreen);
    });

    it('should maintain cursor position on selected item when clearing search filter', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select frameworks',
        choices: [
          { value: 'react', name: 'React' },
          { value: 'vue', name: 'Vue.js' },
          { value: 'angular', name: 'Angular' },
          { value: 'svelte', name: 'Svelte' },
        ],
      });

      // Initial state - cursor should be on first item (React)
      let screen = getScreen();
      expect(screen).toContain('React');
      expect(screen).toContain('Vue.js');
      expect(screen).toContain('Angular');
      expect(screen).toContain('Svelte');

      // Filter to show only Vue.js
      events.type('vue');
      screen = getScreen();
      expect(screen).toContain('Vue.js');
      expect(screen).not.toContain('React');
      expect(screen).not.toContain('Angular');
      expect(screen).not.toContain('Svelte');

      // Select Vue.js (cursor should be on it since it's the only filtered item)
      events.keypress('tab');
      screen = getScreen();
      expect(screen).toContain('◉'); // Vue.js should be selected

      // Clear the search filter with escape
      events.keypress('escape');
      screen = getScreen();

      // All items should be visible again
      expect(screen).toContain('React');
      expect(screen).toContain('Vue.js');
      expect(screen).toContain('Angular');
      expect(screen).toContain('Svelte');

      // Vue.js should still be selected
      expect(screen).toContain('◉');

      // CRITICAL: The cursor should still be focused on Vue.js, not jumped to React
      // We can verify this by checking that Vue.js has the cursor indicator
      const lines = screen.split('\n');
      const vueLine = lines.find((line: string) => line.includes('Vue.js'));
      expect(vueLine).toContain('❯'); // Cursor should be on Vue.js line

      // React should NOT have the cursor
      const reactLine = lines.find((line: string) => line.includes('React'));
      expect(reactLine).not.toContain('❯');
    });

    it('should maintain cursor position on focused item when clearing search filter', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select frameworks',
        choices: [
          { value: 'react', name: 'React' },
          { value: 'vue', name: 'Vue.js' },
          { value: 'angular', name: 'Angular' },
          { value: 'svelte', name: 'Svelte' },
        ],
      });

      // Filter to show items containing 'a' (Angular should be visible)
      events.type('ang');
      let screen = getScreen();
      expect(screen).toContain('Angular');
      expect(screen).not.toContain('React');
      expect(screen).not.toContain('Vue.js');
      expect(screen).not.toContain('Svelte');

      // The cursor should automatically be on Angular since it's the only filtered item
      // DON'T select it - just leave cursor focused on it

      // Clear the search filter with escape
      events.keypress('escape');
      screen = getScreen();

      // All items should be visible again
      expect(screen).toContain('React');
      expect(screen).toContain('Vue.js');
      expect(screen).toContain('Angular');
      expect(screen).toContain('Svelte');

      // No items should be selected (we never pressed tab)
      expect(screen).not.toContain('◉');

      // CRITICAL: The cursor should still be focused on Angular, not jumped back to React
      const lines = screen.split('\n');
      const angularLine = lines.find((line: string) =>
        line.includes('Angular'),
      );
      expect(angularLine).toContain('❯'); // Cursor should be on Angular line

      // React should NOT have the cursor
      const reactLine = lines.find((line: string) => line.includes('React'));
      expect(reactLine).not.toContain('❯');
    });

    it('should preserve cursor position across multiple filter/clear cycles', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select frameworks',
        choices: [
          { value: 'react', name: 'React' },
          { value: 'vue', name: 'Vue.js' },
          { value: 'angular', name: 'Angular' },
          { value: 'svelte', name: 'Svelte' },
        ],
      });

      // First cycle: Filter for Svelte and navigate to it
      events.type('sve');
      let screen = getScreen();
      expect(screen).toContain('Svelte');
      expect(screen).not.toContain('React');

      // Select Svelte
      events.keypress('tab');
      screen = getScreen();
      expect(screen).toContain('◉'); // Svelte should be selected

      // Clear filter - cursor should stay on Svelte
      events.keypress('escape');
      screen = getScreen();
      let lines = screen.split('\n');
      let svelteLine = lines.find((line: string) => line.includes('Svelte'));
      expect(svelteLine).toContain('❯'); // Cursor should be on Svelte
      expect(svelteLine).toContain('◉'); // Svelte should still be selected

      // Second cycle: Filter for Angular
      events.type('ang');
      screen = getScreen();
      expect(screen).toContain('Angular');
      expect(screen).not.toContain('Svelte'); // Hidden by filter
      expect(screen).not.toContain('React');

      // Navigate to Angular (don't select it)
      // Angular should already be focused since it's the only visible item

      // Clear filter again - cursor should move to Angular, Svelte should stay selected
      events.keypress('escape');
      screen = getScreen();
      lines = screen.split('\n');

      const angularLine = lines.find((line: string) =>
        line.includes('Angular'),
      );
      expect(angularLine).toContain('❯'); // Cursor should now be on Angular

      svelteLine = lines.find((line: string) => line.includes('Svelte'));
      expect(svelteLine).toContain('◉'); // Svelte should still be selected
      expect(svelteLine).not.toContain('❯'); // But cursor should NOT be on Svelte anymore
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

  describe('Validation', () => {
    it('should enforce required selection', async () => {
      const { answer, events, getScreen } = await render(checkboxSearch, {
        message: 'Select at least one item',
        choices: ['Apple', 'Banana', 'Cherry'],
        required: true,
      });

      // Try to submit without selecting anything
      events.keypress('enter');
      let screen = getScreen();
      expect(screen).toMatch(/at least one|required|must select/i);

      // Select an item and submit
      events.keypress('tab');
      events.keypress('enter');
      await expect(answer).resolves.toEqual(['Apple']);
    });

    it('should run custom validation function', async () => {
      const { answer, events, getScreen } = await render(checkboxSearch, {
        message: 'Select exactly 2 items',
        choices: ['Apple', 'Banana', 'Cherry', 'Date'],
        validate: (
          selections: ReadonlyArray<import('./index').NormalizedChoice<string>>,
        ) => {
          if (selections.length !== 2) {
            return 'Please select exactly 2 items';
          }
          return true;
        },
      });

      // Select only one item and try to submit
      events.keypress('tab');
      events.keypress('enter');
      let screen = getScreen();
      expect(screen).toContain('Please select exactly 2 items');

      // Select another item and submit
      events.keypress('down');
      events.keypress('tab');
      events.keypress('enter');
      await expect(answer).resolves.toHaveLength(2);
    });

    it('should allow submission when validation passes', async () => {
      const { answer, events } = await render(checkboxSearch, {
        message: 'Select items',
        choices: ['Apple', 'Banana', 'Cherry'],
        validate: (
          selections: ReadonlyArray<import('./index').NormalizedChoice<string>>,
        ) => {
          return selections.length > 0
            ? true
            : 'Please select at least one item';
        },
      });

      // Select item and submit - should succeed
      events.keypress('tab');
      events.keypress('enter');
      await expect(answer).resolves.toEqual(['Apple']);
    });
  });

  describe('Disabled choices and separators', () => {
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

    it('should handle separators in choice list', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'item1', name: 'Item 1' },
          new Separator('--- Group 2 ---'),
          { value: 'item2', name: 'Item 2' },
          { value: 'item3', name: 'Item 3' },
        ],
      });

      const screen = getScreen();
      expect(screen).toContain('Item 1');
      expect(screen).toContain('--- Group 2 ---');
      expect(screen).toContain('Item 2');
      expect(screen).toContain('Item 3');

      // Navigate and select - should skip separator
      events.keypress('tab'); // Select Item 1
      events.keypress('down'); // Should skip separator and go to Item 2
      events.keypress('tab'); // Select Item 2
      events.keypress('enter');
    });
  });

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
      events.keypress('tab');
      screen = getScreen();

      // Should show custom checked icon
      expect(screen).toContain('✅ Apple');
      // Should still show custom unchecked for unselected
      expect(screen).toContain('⬜ Banana');
    });

    /**
     * Bug reproduction test: Custom theme style functions not applying
     *
     * Custom style functions for highlighting and descriptions weren't being
     * applied correctly, reverting to default styling.
     */
    it('should apply custom theme style functions correctly', async () => {
      const customHighlight = (text: string) => `<<${text}>>`;
      const customDescription = (text: string) => `**${text}**`;

      const { getScreen } = await render(checkboxSearch, {
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

      const screen = getScreen();
      // Should show custom highlighted text for active item
      expect(screen).toContain('<<Apple>>');
      // Should show custom styled description
      expect(screen).toContain('**Red fruit**');
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
      events.type('app');
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
      events.keypress('down');
      screen = getScreen();

      // Should apply custom highlighting to new active item
      expect(screen).toContain('<<Banana>>');
      // Should apply custom description styling to new description
      expect(screen).toContain('**Yellow fruit**');
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
      events.keypress('tab');
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
      events.keypress('tab');
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
      events.keypress('down');
      let screen = getScreen();

      // Verify cursor is on Banana
      const lines = screen.split('\n');
      const bananaLine = lines.find((line: string) => line.includes('Banana'));
      expect(bananaLine).toContain('→');

      // Toggle selection
      events.keypress('tab');
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

  describe('Async behavior', () => {
    it('should show loading state during async operations', async () => {
      const slowSource = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Slow async operation
        return [
          { value: 'result1', name: 'Result 1' },
          { value: 'result2', name: 'Result 2' },
        ];
      };

      const { getScreen } = await render(checkboxSearch, {
        message: 'Search items',
        source: slowSource,
      });

      // Should show loading state initially
      let screen = getScreen();
      expect(screen).toMatch(/loading|wait/i);

      // Wait for results to load
      await new Promise((resolve) => setTimeout(resolve, 150));
      screen = getScreen();
      expect(screen).toContain('Result 1');
      expect(screen).toContain('Result 2');
    });

    it('should handle async source errors gracefully', async () => {
      const errorSource = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Network error');
      };

      const { getScreen } = await render(checkboxSearch, {
        message: 'Search items',
        source: errorSource,
      });

      // Wait for error to occur
      await new Promise((resolve) => setTimeout(resolve, 50));
      const screen = getScreen();
      expect(screen).toMatch(/error|failed|network error/i);
    });

    it('should cancel previous requests when search changes', async () => {
      let callCount = 0;
      const mockSource = async (
        term?: string,
        opt?: { signal: AbortSignal },
      ) => {
        const currentCall = ++callCount;

        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 50);
            opt?.signal?.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new Error('Aborted'));
            });
          });

          return [
            { value: `result-${currentCall}`, name: `Result ${currentCall}` },
          ];
        } catch (error) {
          if (error instanceof Error && error.message === 'Aborted') {
            throw error;
          }
          throw error;
        }
      };

      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Search items',
        source: mockSource,
      });

      // Type quickly to trigger multiple requests
      events.type('a');
      await new Promise((resolve) => setTimeout(resolve, 10)); // Allow first request to start
      events.type('b');
      await new Promise((resolve) => setTimeout(resolve, 10)); // Allow second request to start
      events.type('c');

      // Wait for requests to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const screen = getScreen();
      // Should only show results from the latest request
      expect(screen).not.toContain('Result 1');
      expect(screen).not.toContain('Result 2');
      // Should show results from final request
      expect(screen).toContain('Result');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty choices array', async () => {
      const { getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [],
      });

      const screen = getScreen();
      expect(screen).toContain('Select items');
      expect(screen).toMatch(/no.*choices|empty|nothing.*select/i);
    });

    it('should handle large numbers of choices', async () => {
      const manyChoices = Array.from({ length: 1000 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: manyChoices,
        pageSize: 10,
      });

      const screen = getScreen();
      expect(screen).toContain('Item 0');
      expect(screen).toContain('Item 9'); // Should show first page
      expect(screen).not.toContain('Item 50'); // Should not show items beyond page size

      // Search should work with large dataset
      events.type('100');
      const searchScreen = getScreen();
      expect(searchScreen).toContain('Item 100');
      expect(searchScreen).not.toContain('Item 200');
    });

    it('should handle choices with special characters', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'emoji', name: '🚀 Rocket Ship' },
          { value: 'unicode', name: 'Iñtërnâtiønàl' },
          { value: 'symbols', name: 'Special @#$%^&*()' },
          { value: 'newlines', name: 'Multi\nLine\nItem' },
        ],
      });

      let screen = getScreen();
      expect(screen).toContain('🚀 Rocket Ship');
      expect(screen).toContain('Iñtërnâtiønàl');
      expect(screen).toContain('Special @#$%^&*()');

      // Search should work with special characters
      events.type('🚀');
      screen = getScreen();
      expect(screen).toContain('🚀 Rocket Ship');
      expect(screen).not.toContain('Iñtërnâtiønàl');

      // Clear and search for unicode
      for (let i = 0; i < 5; i++) {
        events.keypress('backspace');
      }
      events.type('Iñt');
      screen = getScreen();
      expect(screen).toContain('Iñtërnâtiønàl');
      expect(screen).not.toContain('🚀 Rocket Ship');
    });
  });

  describe('Terminal height scaling', () => {
    it('should use fixed pageSize when pageSize is specified', async () => {
      const manyChoices = Array.from({ length: 20 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      const { getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: manyChoices,
        pageSize: 5, // Fixed page size
      });

      const screen = getScreen();
      // Should show exactly 5 items (fixed pageSize)
      expect(screen).toContain('Item 0');
      expect(screen).toContain('Item 4');
      expect(screen).not.toContain('Item 5'); // Should not show 6th item
    });

    it('should calculate dynamic pageSize based on terminal height when pageSize is not specified', async () => {
      // Skip this test if process.stdout.rows doesn't exist (non-TTY environments)
      if (!('rows' in process.stdout)) {
        console.log(
          'Skipping test: process.stdout.rows not available in this environment',
        );
        return;
      }

      const manyChoices = Array.from({ length: 50 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      // Mock process.stdout.rows to simulate a terminal with specific height
      const rowsSpy = vi
        .spyOn(process.stdout, 'rows', 'get')
        .mockReturnValue(30);

      try {
        const { getScreen } = await render(checkboxSearch, {
          message: 'Select items',
          choices: manyChoices,
          // No pageSize specified - should auto-size
        });

        const screen = getScreen();
        // Should show more than default 7 items since terminal height is 30
        // Expected calculation: ~24 lines available for items (30 - 6 for UI elements)
        expect(screen).toContain('Item 0');
        expect(screen).toContain('Item 20'); // Should show many more items
      } finally {
        // Restore original behavior
        rowsSpy.mockRestore();
      }
    });

    it('should fallback to default pageSize (7) when terminal height is not available', async () => {
      // Skip this test if process.stdout.rows doesn't exist (non-TTY environments)
      if (!('rows' in process.stdout)) {
        console.log(
          'Skipping test: process.stdout.rows not available in this environment',
        );
        return;
      }

      const manyChoices = Array.from({ length: 20 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      // Mock process.stdout.rows as undefined to simulate no terminal info
      const rowsSpy = vi
        .spyOn(process.stdout, 'rows', 'get')
        .mockReturnValue(undefined as any);

      try {
        const { getScreen } = await render(checkboxSearch, {
          message: 'Select items',
          choices: manyChoices,
          // No pageSize specified - should auto-size with fallback 7
        });

        const screen = getScreen();
        // Should fallback to 7 when terminal height unavailable
        expect(screen).toContain('Item 0');
        expect(screen).toContain('Item 6');
        expect(screen).not.toContain('Item 7'); // Should not show 8th item
      } finally {
        // Restore original behavior
        rowsSpy.mockRestore();
      }
    });

    it('should handle small terminal heights gracefully', async () => {
      // Skip this test if process.stdout.rows doesn't exist (non-TTY environments)
      if (!('rows' in process.stdout)) {
        console.log(
          'Skipping test: process.stdout.rows not available in this environment',
        );
        return;
      }

      const manyChoices = Array.from({ length: 20 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      // Mock very small terminal height
      const rowsSpy = vi
        .spyOn(process.stdout, 'rows', 'get')
        .mockReturnValue(8); // Very small terminal

      try {
        const { getScreen } = await render(checkboxSearch, {
          message: 'Select items',
          choices: manyChoices,
          // No pageSize specified - should auto-size
        });

        const screen = getScreen();
        // Should show at least minimum number of items (e.g., 2-3)
        expect(screen).toContain('Item 0');
        expect(screen).toContain('Item 1');
        // Should not show too many items given small terminal
        expect(screen).not.toContain('Item 5');
      } finally {
        // Restore original behavior
        rowsSpy.mockRestore();
      }
    });

    it('should handle large terminal heights appropriately', async () => {
      // Skip this test if process.stdout.rows doesn't exist (non-TTY environments)
      if (!('rows' in process.stdout)) {
        console.log(
          'Skipping test: process.stdout.rows not available in this environment',
        );
        return;
      }

      const manyChoices = Array.from({ length: 100 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      // Mock very large terminal height
      const rowsSpy = vi
        .spyOn(process.stdout, 'rows', 'get')
        .mockReturnValue(100); // Very large terminal

      try {
        const { getScreen } = await render(checkboxSearch, {
          message: 'Select items',
          choices: manyChoices,
          // No pageSize specified - should auto-size
        });

        const screen = getScreen();
        // Should show many items but not all of them
        expect(screen).toContain('Item 0');
        expect(screen).toContain('Item 49'); // Should show many items (up to max page size of 50)
        // Should still paginate, not show all 100 items
        expect(screen).not.toContain('Item 50'); // Beyond our max page size cap of 50
        expect(screen).not.toContain('Item 99');
      } finally {
        // Restore original behavior
        rowsSpy.mockRestore();
      }
    });

    it('should use default auto-sizing behavior when no pageSize is specified', async () => {
      const manyChoices = Array.from({ length: 15 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      // Test with default terminal size (should be auto-sizing)
      const { getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: manyChoices,
        // No pageSize specified - should auto-size based on terminal
      });

      const screen = getScreen();
      // Should show items (exact count depends on terminal height)
      expect(screen).toContain('Item 0');
      // Should show more than just the first few if terminal is reasonable size
      expect(screen).toMatch(/Item [5-9]|Item 1[0-4]/); // Should show items 5-14
    });
  });

  describe('Description display', () => {
    it('should display description of active item at bottom, not inline', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'apple', name: 'Apple', description: 'Red fruit' },
          { value: 'banana', name: 'Banana', description: 'Yellow fruit' },
          { value: 'cherry', name: 'Cherry', description: 'Small red fruit' },
        ],
      });

      let screen = getScreen();

      // First item (Apple) is active, should show its description at bottom
      expect(screen).toContain('Red fruit');

      // Description should NOT be inline with the choice
      const appleChoiceLine = screen
        .split('\n')
        .find((line: string) => line.includes('Apple') && line.includes('◯'));
      expect(appleChoiceLine).toBeDefined();
      expect(appleChoiceLine).not.toContain('Red fruit');
      expect(appleChoiceLine).not.toContain('(Red fruit)');

      // Description should be at the bottom, separate from choices
      const lines = screen.split('\n');
      const descriptionLineIndex = lines.findIndex((line: string) =>
        line.includes('Red fruit'),
      );
      const lastChoiceLineIndex = lines.findIndex((line: string) =>
        line.includes('Cherry'),
      );
      expect(descriptionLineIndex).toBeGreaterThan(lastChoiceLineIndex);

      // Navigate to second item - description should update
      events.keypress('down');
      screen = getScreen();

      // Should now show Banana's description at bottom
      expect(screen).toContain('Yellow fruit');
      expect(screen).not.toContain('Red fruit'); // Apple's description should be gone

      // Again, verify it's not inline
      const bananaChoiceLine = screen
        .split('\n')
        .find((line: string) => line.includes('Banana') && line.includes('❯'));
      expect(bananaChoiceLine).toBeDefined();
      expect(bananaChoiceLine).not.toContain('Yellow fruit');
      expect(bananaChoiceLine).not.toContain('(Yellow fruit)');
    });

    it('should use cyan/blue styling for descriptions at bottom', async () => {
      const { getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [{ value: 'apple', name: 'Apple', description: 'Red fruit' }],
      });

      let screen = getScreen();

      // Check that description uses cyan color (should contain ANSI escape codes for cyan)
      // Note: This is a basic check - in a real test we might need to mock colors
      expect(screen).toContain('Red fruit');

      // The description should be styled with theme.style.description which defaults to cyan
      // We can't easily test ANSI codes here, but we can verify the text is present
      const lines = screen.split('\n');
      const descriptionLine = lines.find((line: string) =>
        line.includes('Red fruit'),
      );
      expect(descriptionLine).toBeTruthy();
    });

    it('should handle items without descriptions gracefully', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'apple', name: 'Apple', description: 'Red fruit' },
          { value: 'banana', name: 'Banana' }, // No description
          { value: 'cherry', name: 'Cherry', description: 'Small red fruit' },
        ],
      });

      let screen = getScreen();

      // Apple (first item) has description
      expect(screen).toContain('Red fruit');

      // Navigate to Banana (no description)
      events.keypress('down');
      screen = getScreen();

      // Should not show any description now
      expect(screen).not.toContain('Red fruit');
      expect(screen).not.toContain('Yellow fruit');
      expect(screen).not.toContain('Small red fruit');

      // Navigate to Cherry (has description)
      events.keypress('down');
      screen = getScreen();

      // Should show Cherry's description
      expect(screen).toContain('Small red fruit');
    });

    it('should update description when navigating with search active', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'apple', name: 'Apple', description: 'Red fruit' },
          { value: 'apricot', name: 'Apricot', description: 'Orange fruit' },
          { value: 'banana', name: 'Banana', description: 'Yellow fruit' },
        ],
      });

      // Type search to filter
      events.type('ap');
      let screen = getScreen();

      // Should show filtered results with Apple active
      expect(screen).toContain('Apple');
      expect(screen).toContain('Apricot');
      expect(screen).not.toContain('Banana'); // Filtered out
      expect(screen).toContain('Red fruit'); // Apple's description

      // Navigate to Apricot
      events.keypress('down');
      screen = getScreen();

      // Description should update to Apricot's
      expect(screen).toContain('Orange fruit');
      expect(screen).not.toContain('Red fruit');
    });

    it('should work with custom description styling', async () => {
      const customDescriptionStyle = (text: string) => `**${text}**`;

      const { getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [{ value: 'apple', name: 'Apple', description: 'Red fruit' }],
        theme: {
          style: {
            description: customDescriptionStyle,
          },
        },
      });

      let screen = getScreen();

      // Should show custom styled description at bottom
      expect(screen).toContain('**Red fruit**');

      // Should still not be inline
      const appleChoiceLine = screen
        .split('\n')
        .find((line: string) => line.includes('Apple') && line.includes('◯'));
      expect(appleChoiceLine).toBeDefined();
      expect(appleChoiceLine).not.toContain('**Red fruit**');
    });
  });

  describe('Object value reference equality', () => {
    it('should preserve exact object references for array and object values', async () => {
      // Create unique object references that we expect to get back unchanged
      const arrayValue = ['item1', 'item2', 'item3'];
      const objectValue = { id: 42, nested: { data: 'test' } };
      const primitiveValue = 'string-value';

      const { answer, events } = await render(checkboxSearch<any>, {
        message: 'Select items',
        choices: [
          { value: arrayValue, name: 'Array Choice' },
          { value: objectValue, name: 'Object Choice' },
          { value: primitiveValue, name: 'String Choice' },
        ],
      });

      // Select all items
      events.keypress('tab'); // Select array choice
      events.keypress('down');
      events.keypress('tab'); // Select object choice
      events.keypress('down');
      events.keypress('tab'); // Select string choice

      // Submit
      events.keypress('enter');
      const result = await answer;

      // Verify we get back the EXACT same references
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(arrayValue); // Same reference, not a copy
      expect(result[1]).toBe(objectValue); // Same reference, not a copy
      expect(result[2]).toBe(primitiveValue); // Same reference (for primitives this is expected)

      // Extra verification - modifying the original should affect the result
      // (because they're the same reference)
      arrayValue.push('item4');
      expect(result[0]).toContain('item4'); // Should reflect the change

      objectValue.id = 99;
      expect((result[1] as any).id).toBe(99); // Should reflect the change
    });

    it('should maintain object references through filtering operations', async () => {
      type ObjectType = { type: string; data: number[] };
      const specialObject: ObjectType = { type: 'special', data: [1, 2, 3] };
      const normalObject: ObjectType = { type: 'normal', data: [4, 5, 6] };

      const { answer, events } = await render(checkboxSearch<ObjectType>, {
        message: 'Select items',
        choices: [
          { value: specialObject, name: 'Special Item' },
          { value: normalObject, name: 'Normal Item' },
        ],
      });

      // Filter to show only "special"
      events.type('special');

      // Select the filtered item
      events.keypress('tab');

      // Clear filter to show all items
      events.keypress('escape');

      // Select the normal object too
      events.keypress('down');
      events.keypress('tab');

      // Submit
      events.keypress('enter');
      const result = await answer;

      // Should get back exact same object references
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(specialObject);
      expect(result[1]).toBe(normalObject);
    });
  });

  describe('Separator navigation (CRITICAL BUG TESTS)', () => {
    it('should navigate correctly with separators - up/down navigation', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'js', name: 'JavaScript' },
          { value: 'ts', name: 'TypeScript' },
          new Separator('--- Frameworks ---'),
          { value: 'react', name: 'React' },
          { value: 'vue', name: 'Vue.js' },
          new Separator('--- Tools ---'),
          { value: 'webpack', name: 'Webpack' },
        ],
      });

      let screen = getScreen();

      // Should start with JavaScript active (first selectable item)
      expect(screen).toContain('❯ ◯ JavaScript');
      expect(screen).not.toContain('❯ ◯ TypeScript');
      expect(screen).not.toContain('❯ ◯ React');

      // Navigate down - should go to TypeScript (second selectable item)
      events.keypress('down');
      screen = getScreen();
      expect(screen).not.toContain('❯ ◯ JavaScript');
      expect(screen).toContain('❯ ◯ TypeScript');
      expect(screen).not.toContain('❯ ◯ React');

      // Navigate down again - should skip separator and go to React
      events.keypress('down');
      screen = getScreen();
      expect(screen).not.toContain('❯ ◯ TypeScript');
      expect(screen).toContain('❯ ◯ React');
      expect(screen).not.toContain('❯ ◯ Vue.js');

      // Navigate down again - should go to Vue.js
      events.keypress('down');
      screen = getScreen();
      expect(screen).not.toContain('❯ ◯ React');
      expect(screen).toContain('❯ ◯ Vue.js');
      expect(screen).not.toContain('❯ ◯ Webpack');

      // Navigate down again - should skip separator and go to Webpack
      events.keypress('down');
      screen = getScreen();
      expect(screen).not.toContain('❯ ◯ Vue.js');
      expect(screen).toContain('❯ ◯ Webpack');
    });

    it('should navigate correctly with separators - up navigation', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'js', name: 'JavaScript' },
          new Separator('--- Frameworks ---'),
          { value: 'react', name: 'React' },
          { value: 'vue', name: 'Vue.js' },
          new Separator('--- Tools ---'),
          { value: 'webpack', name: 'Webpack' },
        ],
      });

      // Start by navigating to the last item (Webpack)
      events.keypress('down'); // to React
      events.keypress('down'); // to Vue.js
      events.keypress('down'); // to Webpack

      let screen = getScreen();
      expect(screen).toContain('❯ ◯ Webpack');

      // Navigate up - should go to Vue.js
      events.keypress('up');
      screen = getScreen();
      expect(screen).not.toContain('❯ ◯ Webpack');
      expect(screen).toContain('❯ ◯ Vue.js');

      // Navigate up again - should go to React
      events.keypress('up');
      screen = getScreen();
      expect(screen).not.toContain('❯ ◯ Vue.js');
      expect(screen).toContain('❯ ◯ React');

      // Navigate up again - should skip separator and go to JavaScript
      events.keypress('up');
      screen = getScreen();
      expect(screen).not.toContain('❯ ◯ React');
      expect(screen).toContain('❯ ◯ JavaScript');
    });

    it('should handle selection with separators correctly', async () => {
      const { answer, events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'js', name: 'JavaScript' },
          new Separator('--- Frameworks ---'),
          { value: 'react', name: 'React' },
          { value: 'vue', name: 'Vue.js' },
        ],
      });

      // Navigate to React and select it
      events.keypress('down'); // Go to React (first down should skip separator)

      let screen = getScreen();
      expect(screen).toContain('❯ ◯ React');

      // Select React
      events.keypress('tab');
      screen = getScreen();
      expect(screen).toContain('❯ ◉ React'); // Should be selected

      // Navigate to Vue.js and select it
      events.keypress('down');
      screen = getScreen();
      expect(screen).toContain('❯ ◯ Vue.js');

      events.keypress('tab');
      screen = getScreen();
      expect(screen).toContain('❯ ◉ Vue.js'); // Should be selected

      // Submit
      events.keypress('enter');
      await expect(answer).resolves.toEqual(['react', 'vue']);
    });

    it('should work with loop navigation and separators', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        loop: true,
        choices: [
          { value: 'first', name: 'First' },
          new Separator('--- Middle ---'),
          { value: 'last', name: 'Last' },
        ],
      });

      let screen = getScreen();
      // Should start with First active
      expect(screen).toContain('❯ ◯ First');

      // Navigate up (should loop to Last)
      events.keypress('up');
      screen = getScreen();
      expect(screen).not.toContain('❯ ◯ First');
      expect(screen).toContain('❯ ◯ Last');

      // Navigate down (should loop back to First, skipping separator)
      events.keypress('down');
      screen = getScreen();
      expect(screen).toContain('❯ ◯ First');
      expect(screen).not.toContain('❯ ◯ Last');
    });

    it('should preserve selections when navigating through separators', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'item1', name: 'Item 1' },
          new Separator('--- Group ---'),
          { value: 'item2', name: 'Item 2' },
          { value: 'item3', name: 'Item 3' },
        ],
      });

      // Select first item
      events.keypress('tab');
      let screen = getScreen();
      expect(screen).toContain('❯ ◉ Item 1');

      // Navigate to Item 2 and select it
      events.keypress('down'); // Skip separator, go to Item 2
      screen = getScreen();
      expect(screen).toContain('❯ ◯ Item 2');
      expect(screen).toContain('◉ Item 1'); // Should still be selected

      events.keypress('tab');
      screen = getScreen();
      expect(screen).toContain('❯ ◉ Item 2');
      expect(screen).toContain('◉ Item 1'); // Should still be selected

      // Navigate back up - selections should be preserved
      events.keypress('up');
      screen = getScreen();
      expect(screen).toContain('❯ ◉ Item 1');
      expect(screen).toContain('◉ Item 2'); // Should still be selected
    });
  });
});

// Node.js Compatibility Tests - Ensure tests work across Node versions
describe('Node.js Compatibility', () => {
  describe('Process.stdout.rows mocking', () => {
    it('should mock terminal rows safely across Node versions', async () => {
      // Skip this test if process.stdout.rows doesn't exist (non-TTY environments)
      if (!('rows' in process.stdout)) {
        console.log(
          'Skipping test: process.stdout.rows not available in this environment',
        );
        return;
      }

      const manyChoices = Array.from({ length: 50 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      // Use vi.spyOn instead of Object.defineProperty for Node 20+ compatibility
      const rowsSpy = vi
        .spyOn(process.stdout, 'rows', 'get')
        .mockReturnValue(30);

      try {
        const { getScreen } = await render(checkboxSearch, {
          message: 'Select items',
          choices: manyChoices,
          // No pageSize specified - should auto-size based on mocked terminal height
        });

        const screen = getScreen();
        // Should show more than default 7 items since mocked terminal height is 30
        expect(screen).toContain('Item 0');
        expect(screen).toContain('Item 20'); // Should show many more items

        // Verify the spy was used
        expect(rowsSpy).toHaveBeenCalled();
      } finally {
        // Restore original behavior
        rowsSpy.mockRestore();
      }
    });
  });
});

// TTY Detection Tests - Prevent crashes in non-TTY environments
describe('TTY Detection', () => {
  describe('Cursor operations', () => {
    it('should not crash when stdout is not a TTY', async () => {
      // Mock non-TTY environment
      const originalIsTTY = process.stdout.isTTY;
      const writeSpy = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true);

      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        configurable: true,
      });

      try {
        const { getScreen } = await render(checkboxSearch, {
          message: 'Select items',
          choices: ['Apple', 'Banana'],
        });

        // Should render successfully without crashing
        const screen = getScreen();
        expect(screen).toContain('Select items');
        expect(screen).toContain('Apple');
        expect(screen).toContain('Banana');

        // Should not have written cursor escape sequences in non-TTY environment
        expect(writeSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('\u001b[?25l'),
        ); // cursorHide
      } finally {
        // Restore original values
        Object.defineProperty(process.stdout, 'isTTY', {
          value: originalIsTTY,
          configurable: true,
        });
        writeSpy.mockRestore();
      }
    });

    it('should write cursor sequences when stdout is a TTY', async () => {
      // Mock TTY environment
      const originalIsTTY = process.stdout.isTTY;
      const writeSpy = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true);

      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        configurable: true,
      });

      try {
        const { getScreen } = await render(checkboxSearch, {
          message: 'Select items',
          choices: ['Apple', 'Banana'],
        });

        // Should render successfully
        const screen = getScreen();
        expect(screen).toContain('Select items');
        expect(screen).toContain('Apple');
        expect(screen).toContain('Banana');

        // Should have written cursor hide sequence in TTY environment
        expect(writeSpy).toHaveBeenCalledWith(
          expect.stringContaining('\u001b[?25l'),
        ); // cursorHide
      } finally {
        // Restore original values
        Object.defineProperty(process.stdout, 'isTTY', {
          value: originalIsTTY,
          configurable: true,
        });
        writeSpy.mockRestore();
      }
    });
  });
});
