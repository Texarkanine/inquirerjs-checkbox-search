import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

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
    const mockSource = async (term?: string, opt?: { signal: AbortSignal }) => {
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
