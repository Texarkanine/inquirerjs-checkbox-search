---
task_id: stable-description-frame
date: 2026-10-08
complexity_level: 2
---

# Reflection: Stable description frame

## Summary

`autoBufferDescriptions` now reserves terminal word-wrap rows, keeps a session peak, and pads the description block so the frame does not jump. The work succeeded. The implementation commit is `feat!:` (`2a197af`) with a `BREAKING CHANGE:` footer.

## Requirements vs Outcome

The three behaviors in the brief are in place: word-wrap counting by default, a peak that only rises, and padding when auto-buffering is on. `autoBufferCountsLineWidth: false` still counts newlines. README has the default and the `pageSize` example. Two additions came out of making the painted height match the count: `hard: true`, so a token wider than the column still splits, and a single space on the last padded row, so ScreenManager does not append an extra newline. No separate pad flag. No description-line cache.

## Plan Accuracy

The file list and the test-first order held. The surprises were in libraries the plan named but did not fully specify. `wordWrap: true` alone leaves a spaceless line as one row. ScreenManager adds a newline when the final line length is 0. `getScreen()` trims trailing blank lines, and the test output stream reports 10,000 columns, so the padding tests had to read the raw frame.

## Build & QA Observations

The page-size unit tests went red and then green on the first implementation pass. The screen tests needed one fix for the extra newline and one fix for the async test slicing past a description that repeated the choice name. QA passed with no blocking findings.

## Insights

### Technical

- `@inquirer/core` ScreenManager treats a final line of length 0 as the cursor sitting at the end of the row and appends another newline. A padded description has to end on a space. `breakLines` then `trimEnd`s that space, so the row still looks blank.
- `fast-wrap-ansi` with `wordWrap: true` does not split a token that is wider than the column. `hard: true` does. Without it, a long unbroken description is counted as one line and the screen hard-wraps it into several.
- `@inquirer/testing`'s `getScreen()` trims, so trailing pad rows are invisible there. The output stream's `columns` is 10,000, so core's own `breakLines` will not wrap a normal description in tests. Assertions have to use the newlines this package inserts and the raw chunk.

### Process

- The preflight note about clamping wrap width and tracking terminal width in the page-size memo was worth doing during build. The suggestion to cache line counts by description text was not.

### Million-Dollar Question

Measuring and painting should be the same wrap. That is what landed: one wrap helper, a peak, and a padded block. The trailing space is a concession to ScreenManager, not a shape we would choose if the prompt owned the final line break. No broader redesign.
