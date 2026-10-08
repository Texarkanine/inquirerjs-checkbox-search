# Task: Stable description frame rework

* Task ID: stable-description-frame
* Complexity: Level 1
* Type: bug fix

## Build

Complete.

What broke:

- The session peak measured the raw description. The pad wrapped `theme.style.description(text)`. A style that adds visible columns could paint a row the peak did not reserve, so the next choice shrank the block.
- `padDescription` always word-wrapped. With `autoBufferCountsLineWidth: false`, a long single line reserved one newline row and painted several, so the next choice shrank the block.

Why:

- The measure and the paint were not the same string. Width counting was applied at paint time even when the caller had turned it off.

What changed:

- The peak measures descriptions after `theme.style.description`.
- The pad only pads. The caller word-wraps that styled string when width counting is on, and leaves newline rows when it is off.

Files:

- `src/index.ts`
- `src/__tests__/descriptions.test.ts`

Left unchanged, on purpose:

- No cache of description line counts. A toggle still re-wraps.
- The peak still never shrinks.
- The duplicated description-region test helper stays.
