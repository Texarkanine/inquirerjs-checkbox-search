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
  });

  describe('Keyboard navigation', () => {
    it('should autocomplete with tab key', async () => {
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

      // Press tab to autocomplete
      events.keypress('tab');
      screen = getScreen();
      expect(screen).toContain('JavaScript'); // Should fill search with highlighted choice
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

  describe('Critical Bug Fixes', () => {
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
});
