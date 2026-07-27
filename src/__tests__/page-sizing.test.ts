import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch, { calculateDynamicPageSize } from '../index.js';

describe('Page sizing', () => {
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

  it('should use auto-sizing when no pageSize is specified', async () => {
    // TTY `rows` is often a numeric data property; install a getter so
    // `vi.spyOn(..., 'get')` works, then restore the original descriptor.
    const originalRowsDescriptor = Object.getOwnPropertyDescriptor(
      process.stdout,
      'rows',
    );
    Object.defineProperty(process.stdout, 'rows', {
      configurable: true,
      enumerable: true,
      get: () => 24,
    });

    const rowsSpy = vi.spyOn(process.stdout, 'rows', 'get').mockReturnValue(30);

    try {
      const manyChoices = Array.from({ length: 50 }, (_, i) => ({
        value: `item${i}`,
        name: `Item ${i}`,
      }));

      const { getScreen } = await render(checkboxSearch, {
        message: 'Select items',
        choices: manyChoices,
        // No pageSize specified - should auto-size from terminal height
      });

      const expectedPageSize = calculateDynamicPageSize(7);
      expect(expectedPageSize).toBe(24);

      const screen = getScreen();
      const visibleItems = screen
        .split('\n')
        .filter((line) => /Item \d+/.test(line)).length;
      expect(visibleItems).toBe(expectedPageSize);
      expect(screen).toContain('Item 0');
      expect(screen).toContain(`Item ${expectedPageSize - 1}`);
      expect(screen).not.toContain(`Item ${expectedPageSize}`);
    } finally {
      rowsSpy.mockRestore();
      if (originalRowsDescriptor) {
        Object.defineProperty(process.stdout, 'rows', originalRowsDescriptor);
      } else {
        Reflect.deleteProperty(process.stdout, 'rows');
      }
    }
  });

  describe('calculateDynamicPageSize', () => {
    const originalIsTTY = process.stdout.isTTY;
    const originalRows = (process.stdout as any).rows;
    const hasOriginalRows = 'rows' in process.stdout;

    beforeEach(() => {
      // Ensure process.stdout.rows exists so we can spy on it
      if (!hasOriginalRows) {
        Object.defineProperty(process.stdout, 'rows', {
          configurable: true,
          enumerable: true,
          get: () => 24, // Default for CI
        });
      }
    });

    afterEach(() => {
      // Restore mocks
      vi.restoreAllMocks();

      // Restore original state
      Object.defineProperty(process.stdout, 'isTTY', {
        value: originalIsTTY,
        configurable: true,
      });

      if (hasOriginalRows) {
        Object.defineProperty(process.stdout, 'rows', {
          value: originalRows,
          configurable: true,
        });
      } else {
        // Property didn't exist originally – remove it cleanly
        Object.defineProperty(process.stdout, 'rows', {
          value: undefined,
          configurable: true,
        });
      }
    });

    it('should return fallback when terminal height is not available', () => {
      // Mock process.stdout.rows as undefined
      vi.spyOn(process.stdout, 'rows', 'get').mockReturnValue(undefined as any);

      const result = calculateDynamicPageSize(7);
      expect(result).toBe(7);
    });

    it('should return fallback when terminal height is zero or negative', () => {
      const rowsSpy = vi.spyOn(process.stdout, 'rows', 'get');
      rowsSpy.mockReturnValue(0);

      let result = calculateDynamicPageSize(5);
      expect(result).toBe(5);

      rowsSpy.mockReturnValue(-1);

      result = calculateDynamicPageSize(10);
      expect(result).toBe(10);
    });

    it('should calculate page size correctly for normal terminal heights', () => {
      // Test with terminal height of 30
      vi.spyOn(process.stdout, 'rows', 'get').mockReturnValue(30);

      const result = calculateDynamicPageSize(7);
      // 30 - 6 (reserved) = 24, capped at max 50, min 2
      expect(result).toBe(24);
    });

    it('should enforce minimum page size for very small terminals', () => {
      // Test with very small terminal
      vi.spyOn(process.stdout, 'rows', 'get').mockReturnValue(5);

      const result = calculateDynamicPageSize(7);
      // 5 - 6 = -1, but enforced minimum is 2
      expect(result).toBe(2);
    });

    it('should enforce maximum page size for very large terminals', () => {
      // Test with very large terminal
      vi.spyOn(process.stdout, 'rows', 'get').mockReturnValue(200);

      const result = calculateDynamicPageSize(7);
      // 200 - 6 = 194, but capped at maximum 50
      expect(result).toBe(50);
    });

    it('should handle errors gracefully and return fallback', () => {
      // Create a scenario where accessing rows throws an error
      vi.spyOn(process.stdout, 'rows', 'get').mockImplementation(() => {
        throw new Error('Access denied');
      });

      const result = calculateDynamicPageSize(8);
      expect(result).toBe(8);
    });

    it('should calculate correctly for edge case terminal sizes', () => {
      // Test boundary conditions
      const rowsSpy = vi.spyOn(process.stdout, 'rows', 'get');

      // Terminal height exactly at reserved lines
      rowsSpy.mockReturnValue(6);

      let result = calculateDynamicPageSize(7);
      expect(result).toBe(2); // Min enforced

      // Terminal height just above reserved lines
      rowsSpy.mockReturnValue(8);

      result = calculateDynamicPageSize(7);
      expect(result).toBe(2); // 8 - 6 = 2

      // Terminal height that results in exactly max page size
      rowsSpy.mockReturnValue(56); // 56 - 6 = 50

      result = calculateDynamicPageSize(7);
      expect(result).toBe(50);
    });
  });
});
