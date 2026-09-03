---
task_id: stryker-v10-upgrade
complexity_level: 2
date: 2026-09-02
status: completed
---

# TASK ARCHIVE: Stryker v10 upgrade

## SUMMARY

Bumped `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` together from `^9.6.1` to `^10.0.0` and refreshed the lockfile so both majors land in one change. That avoids the `ERESOLVE` peer collision Dependabot hit when it opened them separately. Merged as [#172](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/172). Memory-bank archive landed on `main` after merge because the original PR stopped at Reflect.

## REQUIREMENTS

- Bump both Stryker packages to `^10.0.0` in one change (replaces Dependabot #169 and #170).
- Refresh `package-lock.json` so install resolves Stryker 10 without `--legacy-peer-deps`.
- `npm run quality:check`, `npm test`, and Stryker 10 (`test:mutate:dry` and full `test:mutate`) must pass.
- Project engines/CI already require Node ≥22 (Stryker 10 drops Node 20).

## IMPLEMENTATION

- `package.json`: both packages `^9.6.1` → `^10.0.0`.
- `package-lock.json`: resolved `@stryker-mutator/core@10.0.0` and `@stryker-mutator/vitest-runner@10.0.0`.
- No `stryker.config.json` or CONTRIBUTING/techContext edits: docs already speak of Stryker generically; existing config was valid under v10.

## TESTING

Operational verification after install (no new Vitest files; version-string change-detectors out of scope):

- `npm run quality:check` — pass
- `npm test` — 134/134 pass
- `npm run test:mutate:dry` — pass
- `npm run test:mutate` — exit 0, mutation score **87.50%** (break threshold 80), ~48s local
- CI on #172: Node 22/24/26 tests, Mutation, Demo GIFs, Codecov patch — SUCCESS

## LESSONS LEARNED

- Stryker 10’s only breaking change (drop Node 20) was already satisfied by this repo’s engines and CI matrix; the scary major was a paired bump plus lockfile.
- Dependabot cannot land lockstep peer majors when they constrain each other; group them in one PR.
- Full mutate was fast locally (~48s), not the multi-minute CI concern the plan carried from older runs.

## PROCESS IMPROVEMENTS

- Archive before merge. Stopping at Reflect left `memory-bank/active/` on the merged PR; this archive is a follow-up on `main`.
- For Cursor high-signal reviews: one pass, then archive and push, then the operator decides merge.

## TECHNICAL IMPROVEMENTS

None. Config and scripts stayed as they were.

## NEXT STEPS

None for Stryker 10. Inquirer v12 replacement remains [#173](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/173). TypeScript 7 (#162) stays blocked on `@typescript-eslint` peer `typescript <6.1.0`.
