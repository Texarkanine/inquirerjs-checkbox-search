import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';

describe('Async behavior', () => {
  beforeEach(() => {
    // Use fake timers for deterministic async testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clear all pending fake timers before restoring real timers
    vi.clearAllTimers();
    // Restore real timers after each test
    vi.useRealTimers();
  });
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

    // Fast-forward time to complete async operations
    vi.advanceTimersByTime(150);
    await vi.runAllTimersAsync();

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

    // Fast-forward time for error to occur
    vi.advanceTimersByTime(50);
    await vi.runAllTimersAsync();

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
    await events.type('a');
    vi.advanceTimersByTime(10); // Allow first request to start
    await events.type('b');
    vi.advanceTimersByTime(10); // Allow second request to start
    await events.type('c');

    // Fast-forward time for requests to complete
    vi.advanceTimersByTime(100);
    await vi.runAllTimersAsync();

    const screen = getScreen();
    // Should only show results from the latest request
    expect(screen).not.toContain('Result 1');
    expect(screen).not.toContain('Result 2');
    // Should show results from final request
    expect(screen).toContain('Result');
  });
});
