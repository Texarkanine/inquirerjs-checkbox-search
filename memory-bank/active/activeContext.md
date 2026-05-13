# Active Context

**Current Task:** issue-110-perf-dep-bump — Bump `@inquirer/core` to `^11.1.2` for fast-wrap-ansi performance fix

**Phase:** QA - PASS

**What Was Done:** 
- Bumped `@inquirer/core` from `^11.0.2` to `^11.1.2` in `package.json`
- Discovered and fixed a pre-existing backspace-handling bug: `src/index.ts` was relying on `rl.line` being updated by a synthetic keypress event, but Node.js readline's native `_ttyWrite` does not update `rl.line` for synthetically-emitted events (only for real data written to the input stream). Fixed by handling `key.name === 'backspace'` explicitly via `updateSearchTerm(searchTerm.slice(0, -1))`, matching the pattern already used for `escape`.
- All 15 test files, 113 tests passing.

**Next Step:** QA phase
