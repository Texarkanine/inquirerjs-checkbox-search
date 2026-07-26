import { expect } from 'vitest';

/**
 * Assert that a prompt answer promise is still unsettled after a short window.
 * Uses a timer-based race so an already-resolved answer can win (unlike
 * `Promise.resolve('pending')`, which always wins the microtask race).
 */
export async function expectAnswerPending(
  answer: Promise<unknown>,
): Promise<void> {
  await expect(
    Promise.race([
      answer.then(() => 'resolved' as const),
      new Promise<'pending'>((resolve) =>
        setTimeout(() => resolve('pending'), 50),
      ),
    ]),
  ).resolves.toBe('pending');
}
