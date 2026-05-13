# Tasks: issue-110-perf-dep-bump

## Completed

- [x] Bump `@inquirer/core` from `^11.0.2` to `^11.1.2` in `package.json`
- [x] Regenerate `package-lock.json` with updated constraint
- [x] Fix pre-existing backspace bug: handle `key.name === 'backspace'` explicitly in `src/index.ts` (was relying on `rl.line` which native readline doesn't update for synthetic keypress events)
- [x] Full test suite passing: 15 files, 113 tests

## QA

- PASS: KISS, DRY, YAGNI, Completeness, Regression, Integrity, Documentation all clean
