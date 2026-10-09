---
task_id: stable-description-frame
complexity_level: 2
date: 2026-10-08
status: completed
---

# TASK ARCHIVE: Stable description frame

## SUMMARY

`autoBufferDescriptions` now reserves terminal word-wrap rows, keeps a session peak that only rises, and pads the description block so the choice list does not jump. Shipped as `feat!:` (`2a197af`, `BREAKING CHANGE:`) so release-please cuts 3.0.0. Draft PR [#189](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/189). A Level 1 rework after review made the peak measure the styled description, and stopped word-wrap on the paint path when `autoBufferCountsLineWidth` is false. Final suite: 148 tests.

## REQUIREMENTS

1. With `autoBufferDescriptions` on, count description lines with terminal word wrap unless `autoBufferCountsLineWidth` is false.
2. Size the buffer from the longest description at open. A later longer description raises the peak. The peak does not shrink. Widening the terminal does not give rows back. That is a product decision.
3. Pad the description block to the reserved height whenever auto-buffering is on. No separate pad flag.
4. The reserved height is the wrap of `theme.style.description(text)`, the same wrap the pad paints.
5. When width counting is off, counting and painting stay on newline rows. Padding still holds that height.
6. README states the default and shows `pageSize: { autoBufferDescriptions: true }`.
7. Leave issue #188 (cursor at the window edge) and any consumer `pull.js` wiring out of this repo.

## IMPLEMENTATION

`src/index.ts` wraps with `fast-wrap-ansi` (`wordWrap: true`, `hard: true`) at `(columns || 80) - 1`. The peak lives in a prompt ref over `allItems` and is passed to `resolvePageSize` as `descriptionLineFloor`. The last padded row is a single space, because ScreenManager appends a newline when the final line length is 0. `breakLines` then trims that space, so the row still looks blank.

The rework added `withStyledDescriptions` so the peak measures themed text. `padDescription` only pads. The caller word-wraps when width counting is on. `resolvePageSize` still measures raw items and keeps `Math.max` of that count and the styled floor, so it stays theme-free.

A per-toggle re-wrap of every description was measured and left. About 2 ms for 50 items, about 8 ms for 200, about 35 ms for 5,000, and the page-size memo runs that path twice. A description signature would skip it on Tab, and a signature that drifts from `calculateDescriptionLines` would freeze the frame. Not worth that risk here.

Key files: `src/index.ts`, `src/__tests__/pagesize-config.test.ts`, `src/__tests__/descriptions.test.ts`, `src/__tests__/async-behavior.test.ts`, `README.md`, `package.json` (`fast-wrap-ansi`). `memory-bank/techContext.md` notes why that dependency is direct.

## TESTING

Page-size tests went red, then green, on the first implementation pass. Screen tests needed one fix for the extra newline and one fix for an async slice that passed a description repeating the choice name. Original QA passed. Rework added two 80-column tests: a `>>>` style prefix holds the extra row on a short choice, and width counting off leaves the three-word fixture on one row. `npm test` passed after the rework (format, lint, typecheck, 148 tests). Rework QA passed with one non-blocking note: the styled-item copy allocates each time the page-size memo runs.

## LESSONS LEARNED

- Measuring and painting have to be the same wrap. The first landing wrapped the raw string and painted the styled one. A visible prefix (`💬 ` in `examples/custom-theme.js`, `**` in tests) paints a row the raw peak did not reserve.
- `wordWrap: true` does not split a token wider than the column. `hard: true` does. Without it, a long unbroken description counts as one line and the screen hard-wraps it into several.
- ScreenManager treats a final line of length 0 as the cursor at the end of the row and appends another newline. End the pad on a space.
- `getScreen()` trims trailing blank lines, and the test stream reports 10,000 columns, so padding assertions read the raw frame and the newlines this package inserts.
- Width counting off means the paint path must not word-wrap either. The long choice was painting three rows while the peak reserved one, and the next choice shrank the block.

## PROCESS IMPROVEMENTS

The preflight notes about clamping wrap width and tracking terminal width in the page-size memo were worth doing during build. The suggestion to cache line counts by description text was not. The opt-out path needed its own screen test. Counting tests alone did not catch the pad still wrapping.

## TECHNICAL IMPROVEMENTS

No description-line cache. The peak does not shrink, including after a wider terminal. Revisit the re-wrap only if a large-list toggle is shown to stall.

## NEXT STEPS

None in the memory bank. PR #189 carries the branch.
