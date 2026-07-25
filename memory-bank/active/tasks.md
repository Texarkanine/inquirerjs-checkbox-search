# Task: PoC mutation testing with StrykerJS (#145) — PR #146 rework

* Task ID: issue-145-stryker-poc
* Complexity: Level 2
* Type: simple enhancement (rework of quality tooling per PR review)

Rework the `metrics` CI job and its supporting scripts/config per review feedback on
[PR #146](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/146). The job stays as a PR
check — it proves mutation testing runs to completion and logs the score — but it stops duplicating
coverage the pipeline already runs, gains a timeout, and stops pinning worker concurrency. Net effect
is deletion plus one added line. Requirements, constraints, and acceptance criteria live in the
"Rework: PR #146 review feedback" section of `memory-bank/active/projectbrief.md`.

## Test Plan (TDD)

This rework changes CI configuration, npm scripts, and docs. It touches **no product code**, so it
adds no Vitest cases; verification is operational, matching the precedent set by the original phase
of this same task ("tooling/process evidence, not a product behavior change"). The existing 113-case
suite is the regression guard.

### Behaviors to Verify

- [ ] [Low score passes]: `npm run test:mutate` at the current ~73% score → exit 0 (job green)
- [ ] [Crash fails]: Stryker run with a deliberately broken test → non-zero exit (job red)
- [ ] [Coverage script gone]: `npm run test:coverage:advisory` → npm reports missing script
- [ ] [Metrics script gone]: `npm run test:metrics` → npm reports missing script
- [ ] [Mutation script intact]: `npm run test:mutate:dry` → exit 0, instruments `src/index.ts`
- [ ] [Concurrency unpinned]: `stryker.config.json` has no `concurrency` key → run log shows Stryker's cores−1 default
- [ ] [Workflow valid]: `.github/workflows/pr.yaml` parses as YAML; `metrics` job has `timeout-minutes`, one mutation run step, and no coverage step
- [ ] [Clean works]: `npm run clean` → removes `.stryker-tmp`, `reports/mutation`, and the incremental file; no reference to the nonexistent `stryker-tmp`
- [ ] [Docs accurate]: no occurrence of `test:coverage:advisory` or `test:metrics` remains outside `progress.md` history
- [ ] [Edge — incremental file still written]: removing the `json` reporter does not stop `reports/stryker-incremental.json` from being produced (the cache step's `path:` depends on it)
- [ ] [Regression]: `npm test` → full quality gate + 113 cases green

### Test Infrastructure

- Framework: Vitest (`vitest.config.ts`) + `@inquirer/testing`; product tests in `src/__tests__/*.test.ts`
- Test location: `src/__tests__/` — **unchanged; no new or modified test files**
- Conventions: suites sliced by user-visible behavior (see `systemPatterns.md`)
- New test files: none
- Operational verification: `npm run test:mutate:dry`, `npm run test:mutate`, `npm run clean`, `npm test`, plus a YAML parse of `pr.yaml`

## Implementation Plan

1. **Trim the `metrics` job to mutation-only and bound its runtime**
   - Files: `.github/workflows/pr.yaml`
   - Changes: delete the `Line/branch coverage (advisory)` step; add `timeout-minutes: 20` to the `metrics` job; tighten the job comment now that coverage is no longer part of it. Keep the `actions/cache` step, keep the job name, add **no** `continue-on-error`.
   - Verify: YAML parses; job contains exactly one `run:` for mutation

2. **Remove the dead npm scripts**
   - Files: `package.json`
   - Changes: delete `test:coverage:advisory` (its `json-summary` reporter fed the summary script deleted in `ccdaf90`); delete `test:metrics` (a bare alias for `test:mutate` once coverage leaves); drop the nonexistent `stryker-tmp` path from `clean`
   - Verify: `npm run test:coverage:advisory` and `npm run test:metrics` both report a missing script; `npm run clean` succeeds

3. **Unpin concurrency and drop the orphaned reporter**
   - Files: `stryker.config.json`
   - Changes: remove `"concurrency": 4` so Stryker uses its cores−1 default (this machine has 16 cores and was capped at 4; CI has 4 vCPU and was oversubscribed); remove `"json"` from `reporters` — its only consumer was `scripts/ci-metrics-summary.js`, confirmed by reading the deleted file, and it has never actually run
   - Verify: `npm run test:mutate:dry` exits 0; a full run still writes `reports/stryker-incremental.json`

4. **Remove the dead ignore entry**
   - Files: `.gitignore`
   - Changes: delete `stryker-tmp/`; Stryker's `tempDirName` default is `.stryker-tmp`, which is already listed
   - Verify: `git status` stays clean during a mutation run

5. **Reconcile documentation**
   - Files: `CONTRIBUTING.md`, `memory-bank/techContext.md`
   - Changes: drop `test:coverage:advisory` / `test:metrics` references; describe the `metrics` job as mutation-only, advisory in score but red on crash or timeout
   - Verify: repo-wide grep finds no live references to the removed scripts

6. **Full verification pass**
   - Files: none
   - Changes: none
   - Verify: `npm test`; `npm run test:mutate` completes and exits 0 at a sub-100% score; a deliberate test break makes Stryker exit non-zero (then revert the break)

## Technology Validation

No new technology — validation not required. This rework only removes configuration and adds one
workflow key. `thresholds.break` stays unset: StrykerJS defaults it to `null`, verified against the
recorded run's own config dump (`{"high":80,"low":60,"break":null}`), which is precisely the
requested "crash reds, low score greens" contract.

## Dependencies

- No dependency changes. `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` stay as devDependencies.
- Step 6's crash check depends on being able to temporarily break a test locally and revert it.

## Challenges & Mitigations

- **Unpinning concurrency could lengthen CI runs**: CI drops from 4 workers to cores−1 (3 on a 4-vCPU runner) while this machine rises from 4 to 15. The local run gets faster, CI possibly slower. Mitigation: `timeout-minutes: 20` gives ample headroom over the ~4 min local baseline while still catching a true hang, and per-mutant `timeoutMS: 10000` already bounds individual mutants.
- **The exit-code contract is an inherited default, not explicit config**: a future contributor could add `thresholds.break` without realizing it converts an advisory job into a gate. Mitigation: state the contract in the workflow's job comment.
- **Removing the `json` reporter exceeds the operator's explicit list**: justified as vestigial — its only consumer was deleted in `ccdaf90`. Mitigation: flag it explicitly at QA so it can be vetoed cheaply.
- **No CI-config test harness exists**: verification is operational rather than automated, consistent with the original phase of this task. Mitigation: every behavior above names a concrete command and expected exit status.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [ ] Preflight
- [ ] Build
- [ ] QA
