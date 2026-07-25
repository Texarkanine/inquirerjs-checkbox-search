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
