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

## 2026-05-13 - BUILD - COMPLETE

* Work completed
    - Bumped `@inquirer/core` from `^11.0.2` to `^11.1.2` in `package.json`
    - Regenerated `package-lock.json` (resolved to `@inquirer/core@11.1.10`)
    - Fixed pre-existing backspace bug in `src/index.ts`: added explicit `key.name === 'backspace'` handler using `updateSearchTerm(searchTerm.slice(0, -1))` instead of relying on `rl.line`
    - All 15 test files, 113 tests passing
* Decisions made
    - Treat the pre-existing backspace bug as in-scope: it was blocking the full test suite
* Insights
    - Node.js readline's `_ttyWrite` is native code and does NOT update `rl.line` for synthetically-emitted keypress events — any code relying on `rl.line` for synthetic events is fragile

## 2026-05-13 - QA - PASS

* All KISS/DRY/YAGNI/Completeness/Regression/Integrity/Documentation checks clean
* No issues found; no changes required
