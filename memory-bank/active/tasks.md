# Current Task: issue-148-grapheme-backspace

**Complexity:** Level 1

## The Fix

**What broke:** One backspace press in the search filter deleted one *code
point*, not one grapheme cluster. Any grapheme built from multiple code points
left visible debris in the search box — `👨‍👩‍👧` became `👨‍👩‍`, `🇺🇸` became `🇺`,
`👍🏽` became `👍`, `é` (`e` + U+0301) became `e`.

**Why:** `Array.from(searchTerm)` splits on code points. That matches Node
readline's semantics, which is why it was written that way, but this prompt
renders its own search box, so the partial cluster is directly user-visible.

**What changed:** The `isBackspaceKey` branch now segments with a module-level
`Intl.Segmenter` (`granularity: 'grapheme'`) and slices the search term at the
last cluster's start index. No new dependency — `Intl.Segmenter` is built into
Node, and the package already requires Node >= 22.

## Checklist

- [x] Decide: diverge to grapheme clusters (operator decision, recorded in `activeContext.md`)
- [x] Failing tests first: `it.each` over ZWJ sequence, regional-indicator flag, skin-tone modifier, combining mark, and a single-code-point control
- [x] Implement grapheme-aware deletion in the `isBackspaceKey` branch
- [x] Correct `edge-cases.test.ts` L109-110 — dropped the second backspace and the "Emoji might need multiple backspaces" comment
- [x] Update the `updateSearchTerm` pattern in `memory-bank/systemPatterns.md`
- [x] Full suite green (118/118), format + lint + typecheck clean
- [x] QA phase — PASS

## QA Findings

- **KISS**: the delete was written as `lastGrapheme ? searchTerm.slice(0, lastGrapheme.index) : ''`. Collapsed to `searchTerm.slice(0, lastGrapheme?.index ?? 0)` — same behavior on the empty-term path, one fewer branch. Fixed.
- **KISS/comment noise**: the explanatory comment had grown to five lines for a two-line fix. Trimmed to three, keeping only the load-bearing "why" (deliberate divergence from readline, because the prompt renders the search term itself). Fixed.
- **Documentation**: checked `README.md` and `examples/` for any description of backspace behavior — there are none, so no user-facing doc update is owed. `systemPatterns.md` was already updated during Build.
- **Regression**: `graphemeSegmenter` is camelCase, matching the file's only other module-level const (`checkboxSearchTheme`). Import style, comment voice, and test-suite placement all follow existing conventions.
- **Completeness**: all five tasks in issue #148 are discharged, including the two follow-ups (stale test, `systemPatterns.md`).
- **YAGNI**: no speculative code. Deliberately kept the explicit `granularity: 'grapheme'` even though it is the `Intl.Segmenter` default — it names the intent at the call site rather than making the reader recall the default.

## Files Affected

- `src/index.ts` — module-level `graphemeSegmenter`; rewritten `isBackspaceKey` branch and its comment
- `src/__tests__/edge-cases.test.ts` — new `backspace deletes one grapheme cluster` suite; corrected the stale double-backspace in `should handle special characters in choices`
- `memory-bank/systemPatterns.md` — pattern now describes grapheme semantics
