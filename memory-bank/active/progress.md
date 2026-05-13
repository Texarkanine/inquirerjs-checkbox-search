# Progress

Bump `@inquirer/core` dependency constraint from `^11.0.2` to `^11.1.2` to resolve input lag with large lists (issue #110). The fix is the upstream replacement of `wrap-ansi` with `fast-wrap-ansi` in `@inquirer/core` 11.1.2. No code changes needed — semver tightening is sufficient.

**Complexity:** Level 1

## 2026-05-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Ingested issue #110 and confirmed root cause: `@inquirer/core` <11.1.2 uses `wrap-ansi` causing O(n) lag on large lists
    - Evaluated and rejected performance test approach (flakiness, wrong abstraction layer)
    - Classified task as Level 1
* Decisions made
    - Tighten semver to `^11.1.2` rather than `^11.0.2` as the canonical assertion the fix is present
    - No test needed: dependency constraint is a stronger guarantee than a timing assertion
