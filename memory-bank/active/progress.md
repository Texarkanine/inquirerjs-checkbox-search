# Progress

Make one backspace press in the search filter delete one grapheme cluster
instead of one code point, per [#148](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/148), plus the test and
`systemPatterns.md` follow-ups the issue lists.

**Complexity:** Level 1

## 2026-07-25 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Fetched and read issue #148; located the `isBackspaceKey` branch in `src/index.ts` (~L668-680) and the stale assertion at `src/__tests__/edge-cases.test.ts` L109-110
    - Wrote `projectbrief.md` capturing the user story, requirements, constraints, and acceptance criteria
* Decisions made
    - Resolved the issue's open question in favor of **diverging from readline**: grapheme-cluster deletion via `Intl.Segmenter`, no new dependency
    - Level 1 — bug fix confined to a single branch of a single component
* Insights
    - `updateSearchTerm` already owns both the React state and the readline rewrite, so the change is contained entirely within the backspace branch; nothing else reads the search term character-wise

## 2026-07-25 - BUILD - COMPLETE

* Work completed
    - Added a `backspace deletes one grapheme cluster` suite to `src/__tests__/edge-cases.test.ts` covering ZWJ sequence, regional-indicator flag, skin-tone modifier, combining mark, and a single-code-point control — written and run *before* the fix, and confirmed failing 4/5
    - Replaced the code-point pop in the `isBackspaceKey` branch of `src/index.ts` with grapheme segmentation via a module-level `Intl.Segmenter`
    - Removed the stale second backspace and its "Emoji might need multiple backspaces" comment from `should handle special characters in choices`
    - Rewrote the "Search term updates via `updateSearchTerm`" pattern in `memory-bank/systemPatterns.md` to describe grapheme semantics and record the divergence as decided
    - Verified: 118/118 tests pass; `npm test` runs format, lint, and typecheck clean
* Decisions made
    - Assert on choice visibility rather than on the rendered search line: `getScreen()` strips ANSI but preserves the term verbatim, yet exact-matching an emoji search line is brittle. `Banana` (the only choice with no `e`) reappearing is a precise proxy for "search term is truly empty" and discriminates the combining-mark debris case, where leftover `e` would still match `Apple` and `Cherry`.
    - Hoisted the `Intl.Segmenter` to module scope rather than constructing it inside the keypress handler; segmenter construction is comparatively expensive and the instance is stateless.
* Insights
    - The single-code-point control case (`😀`) passing while the other four failed was the signal that the new tests target the actual defect and not a harness artifact — worth keeping as a regression guard.
    - `@inquirer/testing`'s `keypress('backspace')` never mutates `rl.line`, so this prompt's React-state-first backspace handling is what makes the behavior testable at all; a `rl.line`-only implementation would have been untestable here.
