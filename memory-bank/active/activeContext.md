# Active Context

## Current Task: issue-145-stryker-poc (PR #146 rework)
**Phase:** BUILD - COMPLETE

## What Was Done

All 8 planned steps executed in order, each red → green. Files modified:

- `/home/mobaxterm/git/inquirerjs-checkbox-search/.github/workflows/pr.yaml` — dropped the advisory coverage step; renamed `metrics` → `mutation` and `Coverage & mutation (advisory)` → `Mutation (advisory)`; added `timeout-minutes: 30`; rewrote the job comment to state the exit-code contract. Cache step kept; no `continue-on-error`.
- `/home/mobaxterm/git/inquirerjs-checkbox-search/package.json` — removed `test:coverage:advisory` and `test:metrics`; dropped the nonexistent `stryker-tmp` path from `clean`
- `/home/mobaxterm/git/inquirerjs-checkbox-search/stryker.config.json` — removed the `concurrency: 4` pin and the orphaned `json` reporter
- `/home/mobaxterm/git/inquirerjs-checkbox-search/.gitignore` — removed the dead `stryker-tmp/` entry
- `/home/mobaxterm/git/inquirerjs-checkbox-search/eslint.config.js` — **unplanned**: added `.stryker-tmp/` to `ignores`
- `/home/mobaxterm/git/inquirerjs-checkbox-search/CONTRIBUTING.md` and `/home/mobaxterm/git/inquirerjs-checkbox-search/memory-bank/techContext.md` — reconciled to the surviving scripts and the new job name/contract
- PR #146 title and body updated (no longer advertises coverage metrics)

## Key Implementation Decisions

- Proved the exit-code contract empirically before editing anything: broken assertion → Stryker exit 1; reverted → exit 0 at 73.09%. `thresholds.break` stays unset.
- Fixed the ESLint/Stryker-sandbox breakage at its cause rather than by running `clean`.
- Sized the timeout from measured CPU cost (~27 min CPU) rather than from local wall time.

## Deviations from Plan

Three, all recorded in the "Build Deviations" section of `tasks.md`: the unplanned ESLint ignore fix, the timeout raised from 20 to 30, and renaming the job key alongside its display name.

## Next Step
- QA review runs automatically
