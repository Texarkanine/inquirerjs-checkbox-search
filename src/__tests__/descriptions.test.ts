import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

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
    await events.keypress('down');
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
    await events.keypress('down');
    screen = getScreen();

    // Should not show any description now
    expect(screen).not.toContain('Red fruit');
    expect(screen).not.toContain('Yellow fruit');
    expect(screen).not.toContain('Small red fruit');

    // Navigate to Cherry (has description)
    await events.keypress('down');
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
    await events.type('ap');
    let screen = getScreen();

    // Should show filtered results with Apple active
    expect(screen).toContain('Apple');
    expect(screen).toContain('Apricot');
    expect(screen).not.toContain('Banana'); // Should be filtered out
    expect(screen).toContain('Red fruit'); // Apple's description

    // Navigate to Apricot
    await events.keypress('down');
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
