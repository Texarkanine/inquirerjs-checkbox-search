# Project Brief

## User Story

As a user searching a checkbox prompt with emoji or accented text, I want one
backspace press to delete one visible character so that I don't have to guess
how many presses a "character" costs.

## Use-Case(s)

### Use-Case 1

A user types `👨‍👩‍👧` into the search filter, then presses backspace once. Today the
filter still contains `👨‍👩‍` — visible debris. It should be empty.

### Use-Case 2

A user types `é` as `e` + U+0301 and presses backspace once. Today a bare `e`
remains and keeps filtering. It should be empty.

## Requirements

1. The `isBackspaceKey` branch in `src/index.ts` deletes one grapheme cluster
   from the trailing end of the search term, using `Intl.Segmenter`.
2. Test coverage for ZWJ sequences, regional-indicator flags, skin-tone
   modifiers, and combining marks.
3. `src/__tests__/edge-cases.test.ts` L109-110 (double backspace with the
   comment "Emoji might need multiple backspaces") is corrected — it encodes
   the old behavior.
4. `memory-bank/systemPatterns.md`'s "Search term updates via
   `updateSearchTerm`" pattern is updated to describe grapheme semantics and
   drop the open-question reference to #148.

## Constraints

1. No new runtime dependencies. `Intl.Segmenter` is built into Node and the
   package already requires Node >= 22.
2. Out of scope: cursor-position-aware editing (mid-string backspace, delete
   key, word delete). Only the trailing-character delete changes.
3. TDD: tests first, then implementation.

## Acceptance Criteria

1. One backspace press clears a search term consisting of a single grapheme
   cluster, for each of: ZWJ sequence, flag, skin-tone modifier, combining
   mark, and BMP-plus emoji.
2. Full test suite and `npm run quality:check` pass.
3. Issue #148's task list is fully discharged.
