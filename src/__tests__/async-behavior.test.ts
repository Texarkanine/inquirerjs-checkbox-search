import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@inquirer/testing';
import checkboxSearch from '../index.js';
import { expectAnswerPending } from './helpers/expect-answer-pending.js';

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
    expect(getScreen()).toContain('Loading choices...');

    // Fast-forward time to complete async operations
    vi.advanceTimersByTime(150);
    await vi.runAllTimersAsync();

    const screen = getScreen();
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

    expect(getScreen()).toContain('Network error');
  });

  /**
   * Non-Error throws from source must still surface the generic load-failure
   * message (covers the non-Error arm of the catch ternary).
   */
  it('should show generic load failure when source throws a non-Error', async () => {
    const errorSource = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      throw 'not-an-error';
    };

    const { getScreen } = await render(checkboxSearch, {
      message: 'Search items',
      source: errorSource,
    });

    vi.advanceTimersByTime(50);
    await vi.runAllTimersAsync();

    expect(getScreen()).toContain('Failed to load choices');
  });

  it('should cancel previous requests when search changes', async () => {
    let callCount = 0;
    const aborted: number[] = [];
    const completed: number[] = [];
    const mockSource = async (term?: string, opt?: { signal: AbortSignal }) => {
      const currentCall = ++callCount;

      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 50);
          opt?.signal?.addEventListener('abort', () => {
            clearTimeout(timeout);
            aborted.push(currentCall);
            reject(new Error('Aborted'));
          });
        });

        completed.push(currentCall);
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

    // Type quickly to trigger multiple requests (plus the initial mount call).
    await events.type('a');
    vi.advanceTimersByTime(10); // Allow first request to start
    await events.type('b');
    vi.advanceTimersByTime(10); // Allow second request to start
    await events.type('c');

    // Fast-forward time for requests to complete
    vi.advanceTimersByTime(100);
    await vi.runAllTimersAsync();

    // AbortSignal must have fired for every superseded call; only the last completes.
    expect(aborted.length).toBeGreaterThanOrEqual(2);
    expect(completed).toEqual([callCount]);
    expect(getScreen()).toContain(`Result ${callCount}`);
    for (const id of aborted) {
      expect(getScreen()).not.toContain(`Result ${id}`);
    }
  });

  /**
   * While status !== 'idle' (async source loading), navigation/action keys
   * must be ignored so the prompt neither moves nor submits.
   * Uses real timers: the source stays pending until we resolve it (no delay),
   * and expectAnswerPending / waitFor need wall-clock time.
   */
  it('should ignore navigation keys while async source is loading', async () => {
    vi.useRealTimers();

    let resolveSource!: (
      value: ReadonlyArray<{ value: string; name: string }>,
    ) => void;
    const pendingSource = () =>
      new Promise<ReadonlyArray<{ value: string; name: string }>>((resolve) => {
        resolveSource = resolve;
      });

    const { answer, events, getScreen } = await render(checkboxSearch, {
      message: 'Search items',
      source: pendingSource,
    });

    expect(getScreen()).toContain('Loading choices...');
    const beforeKeys = getScreen();

    await events.keypress('down');
    await events.keypress('up');
    await events.keypress('tab');
    await events.keypress('enter');
    await events.keypress('escape');

    expect(getScreen()).toEqual(beforeKeys);
    await expectAnswerPending(answer);

    resolveSource([{ value: 'result1', name: 'Result 1' }]);
    await vi.waitFor(() => {
      expect(getScreen()).toContain('Result 1');
    });
  });
});
