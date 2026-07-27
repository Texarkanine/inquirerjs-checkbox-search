import { describe, it, expect, vi } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

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
        const { answer, events, getScreen } = await render(checkboxSearch, {
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

        // Completing the prompt must also skip cursorShow when not a TTY
        await events.keypress('tab');
        await events.keypress('enter');
        await expect(answer).resolves.toEqual(['Apple']);
        expect(writeSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('\u001b[?25h'),
        ); // cursorShow
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

    /**
     * Completing the prompt under a forced TTY must run the effect cleanup
     * that writes cursorShow (the hide half is covered by the case above).
     */
    it('should show cursor when prompt completes in a TTY', async () => {
      const originalIsTTY = process.stdout.isTTY;
      const writeSpy = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true);

      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        configurable: true,
      });

      try {
        const { answer, events } = await render(checkboxSearch, {
          message: 'Select items',
          choices: ['Apple', 'Banana'],
        });

        await events.keypress('tab');
        await events.keypress('enter');
        await expect(answer).resolves.toEqual(['Apple']);

        expect(writeSpy).toHaveBeenCalledWith(
          expect.stringContaining('\u001b[?25h'),
        ); // cursorShow
      } finally {
        Object.defineProperty(process.stdout, 'isTTY', {
          value: originalIsTTY,
          configurable: true,
        });
        writeSpy.mockRestore();
      }
    });
  });
});
