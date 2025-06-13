import { describe, it, expect, vi } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

// Node.js Compatibility Tests - Ensure tests work across Node versions
describe('Node.js Compatibility', () => {
  describe('Process.stdout.rows mocking', () => {
    it('should mock terminal rows safely across Node versions', async () => {
      const originalRows = (process.stdout as any).rows;
      const hasOriginalRows = 'rows' in process.stdout;

      try {
        // Mock process.stdout.rows if it doesn't exist (CI/non-TTY environments)
        if (!hasOriginalRows) {
          Object.defineProperty(process.stdout, 'rows', {
            value: 24, // Default value for CI environments
            writable: true,
            configurable: true,
          });
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
          // Restore spy
          rowsSpy.mockRestore();
        }
      } finally {
        // Restore original state
        if (hasOriginalRows) {
          Object.defineProperty(process.stdout, 'rows', {
            value: originalRows,
            configurable: true,
          });
        } else {
          // Remove the property if it didn't exist originally
          delete (process.stdout as any).rows;
        }
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
