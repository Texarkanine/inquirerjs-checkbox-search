# Progress

Keep the checkbox-search frame height stable when choice descriptions wrap: word-wrap line counts by default under `autoBufferDescriptions`, a session peak across choices, and a padded description block. Ship it as a major (`feat!:`) because published 2.x callers of that option will see a different layout.

**Complexity:** Level 2

## 2026-10-08 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Classified the approved intent from `.scratch/scroll-btter.md` as Level 2
    - Wrote the project brief, including the release note for the pull request
* Decisions made
    - Level 2: one subsystem, approach already specified, moderate layout risk
    - Breaking change: `feat!:` and `BREAKING CHANGE:` for a 3.0.0 release-please major
    - Issue #188 may proceed in parallel
* Insights
    - Pointer placement is `@inquirer/core` `usePointerPosition`. Description height is `calculateDescriptionLines`, `resolvePageSize`, and the bottom description string. They do not block each other.
