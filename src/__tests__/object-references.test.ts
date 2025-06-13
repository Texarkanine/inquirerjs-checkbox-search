import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

describe('Object value reference equality', () => {
  it('should preserve exact object references for array and object values', async () => {
    // Create unique object references that we expect to get back unchanged
    const arrayValue = ['item1', 'item2', 'item3'];
    const objectValue = { id: 42, nested: { data: 'test' } };
    const primitiveValue = 'string-value';

    const { answer, events } = await render(
      checkboxSearch<string | object | any[]>,
      {
        message: 'Select items',
        choices: [
          { value: arrayValue, name: 'Array Choice' },
          { value: objectValue, name: 'Object Choice' },
          { value: primitiveValue, name: 'String Choice' },
        ],
      },
    );

    // Select all items
    await events.keypress('tab'); // Select array choice
    await events.keypress('down');
    await events.keypress('tab'); // Select object choice
    await events.keypress('down');
    await events.keypress('tab'); // Select string choice

    // Submit
    await events.keypress('enter');
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
    expect((result[1] as typeof objectValue).id).toBe(99); // Should reflect the change
  });

  it('should maintain object references through filtering operations', async () => {
    type ObjectType = { type: string; data: number[] };
    const specialObject: ObjectType = { type: 'special', data: [1, 2, 3] };
    const normalObject: ObjectType = { type: 'normal', data: [4, 5, 6] };

    const { answer, events, getScreen } = await render(
      checkboxSearch<ObjectType>,
      {
        message: 'Select items',
        choices: [
          { value: specialObject, name: 'Special Item' },
          { value: normalObject, name: 'Normal Item' },
        ],
      },
    );

    // Filter to show only "special"
    await events.type('special');
    let screen = getScreen();
    expect(screen).toContain('Special Item');

    await events.keypress('tab');
    screen = getScreen();
    expect(screen).toContain('◉'); // Should be selected

    await events.keypress('escape');
    screen = getScreen();
    expect(screen).toContain('Special Item');
    expect(screen).toContain('Normal Item');

    await events.keypress('down');
    await events.keypress('tab');
    screen = getScreen();
    expect(screen).toContain('◉'); // Should show selections

    await events.keypress('enter');
    const result = await answer;

    // Should get back exact same object references
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(specialObject);
    expect(result[1]).toBe(normalObject);
  });
});
