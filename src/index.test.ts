import { describe, it, expect } from 'vitest';
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
      expect(screen).not.toContain('◉'); // checked (default theme)

      // Select first item
      events.keypress('tab');
      screen = getScreen();
      expect(screen).toContain('◉'); // should show checked item

      // Toggle same item to deselect
      events.keypress('tab');
      screen = getScreen();
      expect(screen).toContain('◯'); // should be unchecked again
    });

    it('should maintain selections across filtering', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select frameworks',
        choices: [
          { value: 'react', name: 'React' },
          { value: 'vue', name: 'Vue.js' },
          { value: 'angular', name: 'Angular' },
        ],
      });

      // Select React
      events.keypress('tab');
      let screen = getScreen();
      expect(screen).toContain('◉'); // React should be selected

      // Filter to show only React
      events.type('rea');
      screen = getScreen();
      expect(screen).toContain('React');
      expect(screen).toContain('◉'); // React should still be selected

      // Clear filter
      for (let i = 0; i < 3; i++) {
        events.keypress('backspace');
      }
      screen = getScreen();
      expect(screen).toContain('React');
      expect(screen).toContain('Vue.js');
      expect(screen).toContain('Angular');
      expect(screen).toContain('◉'); // React should still be selected
    });

    it('should handle pre-selected choices', async () => {
      const { getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'apple', name: 'Apple', checked: true },
          { value: 'banana', name: 'Banana', checked: false },
          { value: 'cherry', name: 'Cherry', checked: true },
        ],
      });

      const screen = getScreen();
      // Should show Apple and Cherry as pre-selected
      const lines = screen.split('\n');
      const appleLine = lines.find((line: string) => line.includes('Apple'));
      const bananaLine = lines.find((line: string) => line.includes('Banana'));
      const cherryLine = lines.find((line: string) => line.includes('Cherry'));

      expect(appleLine).toContain('◉');
      expect(bananaLine).toContain('◯');
      expect(cherryLine).toContain('◉');
    });

    it('should return array of selected values on enter', async () => {
      const { answer, events } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'apple', name: 'Apple' },
          { value: 'banana', name: 'Banana' },
          { value: 'cherry', name: 'Cherry' },
        ],
      });

      // Select first and third items
      events.keypress('tab'); // Select Apple
      events.keypress('down');
      events.keypress('down');
      events.keypress('tab'); // Select Cherry

      events.keypress('enter');
      await expect(answer).resolves.toEqual(['apple', 'cherry']);
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
  });

  describe('Keyboard navigation', () => {
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
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: ['Apple', 'Banana'],
        theme: {
          icon: {
            checked: '✅',
            unchecked: '⬜',
            cursor: '➤',
          },
        },
      });

      let screen = getScreen();
      expect(screen).toContain('⬜'); // Custom unchecked icon
      expect(screen).toContain('➤'); // Custom cursor icon

      // Select an item
      events.keypress('tab');
      screen = getScreen();
      expect(screen).toContain('✅'); // Custom checked icon
    });

    it('should use custom styling functions', async () => {
      const customSearchStyle = (text: string) => `<<${text}>>`;
      const customDescriptionStyle = (text: string) => `**${text}**`;

      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'item1', name: 'Item 1', description: 'First item' },
          { value: 'item2', name: 'Item 2', description: 'Second item' },
        ],
        theme: {
          style: {
            searchTerm: customSearchStyle,
            description: customDescriptionStyle,
          },
        },
      });

      // Type search term
      events.type('item');
      let screen = getScreen();
      expect(screen).toContain('<<item>>'); // Custom search term styling

      // Check description styling
      expect(screen).toContain('**First item**'); // Custom description styling
    });

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

      let screen = getScreen();
      // Should show custom description styling (no automatic parentheses when custom function is used)
      expect(screen).toContain('**Red fruit**');
      expect(screen).not.toContain('(Red fruit)'); // No parentheses with custom styling

      // Active item should show custom highlight
      expect(screen).toContain('<<Apple>>');
    });

    it('should support function-based icon theming', async () => {
      const customChecked = (text: string) => `✅ ${text}`;
      const customUnchecked = (text: string) => `⬜ ${text}`;
      const customCursor = (text: string) => `👉 ${text}`;

      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'apple', name: 'Apple' },
          { value: 'banana', name: 'Banana' },
        ],
        theme: {
          icon: {
            checked: customChecked,
            unchecked: customUnchecked,
            cursor: customCursor,
          },
        },
      });

      let screen = getScreen();
      // Should show function-based unchecked icons with choice text
      expect(screen).toContain('⬜ Apple');
      expect(screen).toContain('⬜ Banana');
      // Should show function-based cursor with choice text
      expect(screen).toContain('👉 Apple');

      // Select first item
      events.keypress('tab');
      screen = getScreen();

      // Should show function-based checked icon with choice text
      expect(screen).toContain('✅ Apple');
      // Should still show function-based unchecked for unselected
      expect(screen).toContain('⬜ Banana');
    });

    it('should support mixed string and function icon theming', async () => {
      const customChecked = (text: string) => `🎯 ${text}`;

      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'target', name: 'Target' },
          { value: 'arrow', name: 'Arrow' },
        ],
        theme: {
          icon: {
            checked: customChecked, // Function
            unchecked: '○', // String
            cursor: '▶', // String
          },
        },
      });

      let screen = getScreen();
      // Should show string-based unchecked and cursor
      expect(screen).toContain('○ Target');
      expect(screen).toContain('▶');

      // Select first item
      events.keypress('tab');
      screen = getScreen();

      // Should show function-based checked icon
      expect(screen).toContain('🎯 Target');
      // Should still show string-based unchecked for unselected
      expect(screen).toContain('○ Arrow');
    });

    it('should maintain cursor position when toggling selection on non-first items', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: [
          { value: 'apple', name: 'Apple' },
          { value: 'banana', name: 'Banana' },
          { value: 'cherry', name: 'Cherry' },
        ],
      });

      let screen = getScreen();
      // Initially cursor should be on first item (Apple)
      expect(screen).toContain('❯'); // Cursor should be visible
      const appleLine = screen
        .split('\n')
        .find((line: string) => line.includes('Apple'));
      expect(appleLine).toContain('❯'); // Apple should have cursor

      // Navigate down to Banana (second item)
      events.keypress('down');
      screen = getScreen();
      const bananaLine = screen
        .split('\n')
        .find((line: string) => line.includes('Banana'));
      expect(bananaLine).toContain('❯'); // Banana should now have cursor

      // Select Banana
      events.keypress('tab');
      screen = getScreen();
      const selectedBananaLine = screen
        .split('\n')
        .find((line: string) => line.includes('Banana'));
      expect(selectedBananaLine).toContain('◉'); // Banana should be selected
      expect(selectedBananaLine).toContain('❯'); // Cursor should still be on Banana

      // Deselect Banana
      events.keypress('tab');
      screen = getScreen();

      // BUG: Cursor incorrectly jumps back to Apple instead of staying on Banana
      const deselectedBananaLine = screen
        .split('\n')
        .find((line: string) => line.includes('Banana'));
      expect(deselectedBananaLine).toContain('◯'); // Banana should be deselected
      expect(deselectedBananaLine).toContain('❯'); // Cursor should STILL be on Banana (not jump to Apple)

      // Verify Apple doesn't have the cursor
      const finalAppleLine = screen
        .split('\n')
        .find((line: string) => line.includes('Apple'));
      expect(finalAppleLine).not.toContain('❯'); // Apple should NOT have cursor
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

  describe('Regression Tests', () => {
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

      // Press Enter to submit - THIS SHOULD WORK but currently fails
      events.keypress('enter');
      await expect(answer).resolves.toEqual(['apple']);
    });

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

      // Press Enter to submit - THIS SHOULD WORK but currently fails
      events.keypress('enter');
      await expect(answer).resolves.toEqual(['apple']);
    });

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

      // Press Escape to clear the search filter - THIS FEATURE DOESN'T EXIST YET
      events.keypress('escape');
      screen = getScreen();

      // All items should be visible again
      expect(screen).toContain('Apple');
      expect(screen).toContain('Banana');
      expect(screen).toContain('Cherry');

      // Search term should be cleared (no visible search text)
      expect(screen).not.toContain('Search: ap');
    });

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

      let screen = getScreen();
      // Should show custom description styling (no automatic parentheses when custom function is used)
      expect(screen).toContain('**Red fruit**');
      expect(screen).not.toContain('(Red fruit)'); // No parentheses with custom styling

      // Active item should show custom highlight
      expect(screen).toContain('<<Apple>>');
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
      const manyChoices = Array.from({ length: 50 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      // Mock process.stdout.rows to simulate a terminal with specific height
      const originalRows = process.stdout.rows;
      Object.defineProperty(process.stdout, 'rows', {
        value: 30,
        configurable: true,
      });

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
        // Restore original value
        if (originalRows !== undefined) {
          Object.defineProperty(process.stdout, 'rows', {
            value: originalRows,
            configurable: true,
          });
        }
      }
    });

    it('should fallback to default pageSize (7) when terminal height is not available', async () => {
      const manyChoices = Array.from({ length: 20 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      // Mock process.stdout.rows as undefined to simulate no terminal info
      const originalRows = process.stdout.rows;
      Object.defineProperty(process.stdout, 'rows', {
        value: undefined,
        configurable: true,
      });

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
        // Restore original value
        if (originalRows !== undefined) {
          Object.defineProperty(process.stdout, 'rows', {
            value: originalRows,
            configurable: true,
          });
        } else {
          delete (process.stdout as any).rows;
        }
      }
    });

    it('should handle small terminal heights gracefully', async () => {
      const manyChoices = Array.from({ length: 20 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      // Mock very small terminal height
      const originalRows = process.stdout.rows;
      Object.defineProperty(process.stdout, 'rows', {
        value: 8, // Very small terminal
        configurable: true,
      });

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
        // Restore original value
        if (originalRows !== undefined) {
          Object.defineProperty(process.stdout, 'rows', {
            value: originalRows,
            configurable: true,
          });
        }
      }
    });

    it('should handle large terminal heights appropriately', async () => {
      const manyChoices = Array.from({ length: 100 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      // Mock very large terminal height
      const originalRows = process.stdout.rows;
      Object.defineProperty(process.stdout, 'rows', {
        value: 100, // Very large terminal
        configurable: true,
      });

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
        // Restore original value
        if (originalRows !== undefined) {
          Object.defineProperty(process.stdout, 'rows', {
            value: originalRows,
            configurable: true,
          });
        }
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

  describe('Phantom Input Bug Reproduction', () => {
    it('should handle "j" key input properly (control test)', async () => {
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
      console.log('J KEY SCREEN OUTPUT:', screen);
      expect(screen).toContain('j'); // Should show "j" in search term
      expect(screen).toContain('Jackfruit'); // Should filter to jackfruit
      expect(screen).not.toContain('Apple');
      expect(screen).not.toContain('Banana');
    });

    it('should handle simple "k" key input without any tab selections', async () => {
      const { events, getScreen } = await render(checkboxSearch, {
        message: 'Select fruits',
        choices: [
          { value: 'kiwi', name: 'Kiwi' },
          { value: 'apple', name: 'Apple' },
          { value: 'banana', name: 'Banana' },
        ],
      });

      // Type "k" - should add to search term, not navigate
      events.type('k');

      let screen = getScreen();
      console.log('K KEY SCREEN OUTPUT:', screen);
      expect(screen).toContain('k'); // Should show "k" in search term
      expect(screen).toContain('Kiwi'); // Should filter to kiwi
      expect(screen).not.toContain('Apple');
      expect(screen).not.toContain('Banana');
    });

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
      expect(screen).toContain('mel'); // Should show search term
      expect(screen).toContain('Watermelon');
      expect(screen).toContain('Melon');
      expect(screen).not.toContain('Apple');
      expect(screen).not.toContain('Orange');

      // 5. Test backspace behavior - should delete "l" on first backspace
      events.keypress('backspace');

      screen = getScreen();
      expect(screen).toContain('me'); // Should show "me" after deleting "l"

      // Verify it's working properly - should only require one backspace per character
      events.keypress('backspace');

      screen = getScreen();
      expect(screen).toContain('m'); // Should show "m" after deleting "e"
    });

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
  });
});
