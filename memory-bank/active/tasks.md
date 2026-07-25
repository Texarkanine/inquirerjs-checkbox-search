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

- [x] [Low score passes]: `npm run test:mutate` at 73.09% → **exit 0** (job green)
- [x] [Crash fails]: broken assertion in `basic-functionality.test.ts` → Stryker **exit 1** (`ConfigError: There were failed tests in the initial test run`)
- [x] [Coverage script gone]: absent from `package.json`; `npm run` reports missing script
- [x] [Metrics script gone]: absent from `package.json`; `npm run test:metrics` → `npm error Missing script`
- [x] [Mutation script intact]: `npm run test:mutate:dry` → exit 0, 602 mutants instrumented
- [x] [Concurrency unpinned]: no `concurrency` key; run log went from `Creating 4 test runner process(es)` to `Creating 15` (cores−1 on a 16-core box)
- [x] [Workflow valid]: parses; job has `timeout-minutes: 30`, one `npm run test:mutate` step, no coverage step, no `continue-on-error`, cache step retained
- [x] [Job name accurate]: renamed `metrics` → `mutation` / `Coverage & mutation (advisory)` → `Mutation (advisory)`; no "coverage" anywhere in the job
- [x] [Clean works]: `npm run clean` → exit 0, `.stryker-tmp` and report artifacts removed
- [x] [Docs accurate]: repo-wide grep finds the removed names only in memory-bank planning records
- [x] [Edge — incremental file still written]: after a full run without the `json` reporter, `reports/stryker-incremental.json` present at 877 KB
- [x] [Regression]: `npm test` → quality gate + **113/113** green
- [x] [Unplanned — ESLint vs Stryker sandbox]: `npm test` with a `.stryker-tmp/sandbox-*` present → was 15 parsing errors, now green

### Test Infrastructure

- Framework: Vitest (`vitest.config.ts`) + `@inquirer/testing`; product tests in `src/__tests__/*.test.ts`
- Test location: `src/__tests__/` — **unchanged; no new or modified test files**
- Conventions: suites sliced by user-visible behavior (see `systemPatterns.md`)
- New test files: none
- Operational verification: `npm run test:mutate:dry`, `npm run test:mutate`, `npm run clean`, `npm test`, plus a YAML parse of `pr.yaml`

## Implementation Plan

Each step is encoded red → green: observe the current (wrong) state first so the check is proven to
discriminate, then change, then re-observe. A step is not done until its GREEN observation is
recorded. Do not batch the edits and verify at the end.

1. **Establish the exit-code contract before touching anything** *(pure verification — no edits)*
   - Files: none
   - RED: temporarily break one assertion in `src/__tests__/basic-functionality.test.ts`, then run `npx stryker run --dryRunOnly` → expect **non-zero** exit. This proves a broken harness reds the job.
   - GREEN: revert the break, re-run `npx stryker run --dryRunOnly` → expect **exit 0**.
   - Rationale: constraint 5 of the brief is a *no-change* requirement, so it needs empirical proof rather than a code diff. Confirm `git diff` is empty afterward.

2. **Trim the `metrics` job to mutation-only and bound its runtime**
   - Files: `.github/workflows/pr.yaml`
   - RED: `grep -c 'run: npm run' pr.yaml` within the metrics job → 2 steps today; `grep timeout-minutes` → absent; job `name:` reads `Coverage & mutation (advisory)`
   - Changes: delete the `Line/branch coverage (advisory)` step; add `timeout-minutes: 20`; rename the job to `Mutation (advisory)`; rewrite the job comment to state the exit-code contract (crash/timeout reds, score never does) so a future contributor does not casually add `thresholds.break`. Keep the `actions/cache` step; add **no** `continue-on-error`.
   - GREEN: YAML parses; metrics job has exactly one mutation `run:`, a `timeout-minutes`, no coverage step, and no `continue-on-error`

3. **Remove the dead npm scripts**
   - Files: `package.json`
   - RED: `npm run test:coverage:advisory --dry-run` and `npm run test:metrics --dry-run` both resolve today
   - Changes: delete `test:coverage:advisory` (its `json-summary` reporter fed the summary script deleted in `ccdaf90`); delete `test:metrics` (a bare alias for `test:mutate` once coverage leaves); drop the nonexistent `stryker-tmp` path from `clean`
   - GREEN: both invocations report a missing script; `npm run clean` still exits 0; `prepublishOnly` is untouched and still resolves via `test:ci`

4. **Unpin concurrency and drop the orphaned reporter**
   - Files: `stryker.config.json`
   - RED: current config pins `"concurrency": 4` and lists `"json"` in `reporters`; `reports/mutation/` contains no `mutation.json`, confirming the reporter has never run
   - Changes: remove `"concurrency": 4` so Stryker uses its cores−1 default (this machine has 16 cores and was capped at 4; CI has 4 vCPU and was oversubscribed); remove `"json"` from `reporters` — its only consumer was `scripts/ci-metrics-summary.js`, confirmed by reading the deleted file
   - GREEN: `npm run test:mutate:dry` exits 0; the later full run in step 7 still writes `reports/stryker-incremental.json`

5. **Remove the dead ignore entry**
   - Files: `.gitignore`
   - RED: `.gitignore` lists both `.stryker-tmp/` and `stryker-tmp/`; only `.stryker-tmp/` exists on disk after a run
   - Changes: delete `stryker-tmp/`; Stryker's `tempDirName` default is `.stryker-tmp`, which is already listed
   - GREEN: `git status` stays clean during and after a mutation run

6. **Reconcile documentation**
   - Files: `CONTRIBUTING.md`, `memory-bank/techContext.md`
   - RED: both name `test:coverage:advisory` / `test:metrics` and the job title `Coverage & mutation (advisory)`
   - Changes: drop the removed script references; describe the job as mutation-only, advisory in score but red on crash or timeout, under its new name
   - GREEN: repo-wide grep finds no live references to the removed scripts or the old job name outside `progress.md` history

7. **Full verification pass**
   - Files: none
   - Changes: none
   - GREEN: `npm test` green (quality gate + 113 cases); `npm run test:mutate` completes and exits 0 at a sub-100% score; `reports/stryker-incremental.json` present afterward

8. **Reconcile PR #146 metadata**
   - Files: none (GitHub PR)
   - RED: PR title is `feat(ci): StrykerJS PoC and advisory coverage/mutation metrics [#145]`, which claims coverage metrics this rework removes
   - Changes: update the PR title and body to describe mutation-only advisory metrics
   - GREEN: title no longer promises coverage metrics
   - Rationale: release-please reads the squashed PR title as the changelog entry, so an inaccurate title ships to consumers

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

## Build Deviations

1. **Added an unplanned fix: ESLint now ignores `.stryker-tmp/`** (`eslint.config.js`). Step 7's `npm test` failed with 15 parsing errors from a leftover `.stryker-tmp/sandbox-*`. Root cause is a defect this branch introduced: `eslint.config.js` keeps an `ignores` list of every generated directory, and Stryker's temp dir was never added. Prettier is unaffected because Prettier 3 reads `.gitignore`; ESLint flat config does not. Effect was that `npm test`, `npm run quality`, and `test:ci` all broke locally for anyone who had run Stryker. Fixed at the cause rather than by running `clean`, which would only defer it to the next run.
2. **`timeout-minutes` raised from the planned 20 to 30.** A forced full run took 2m6s wall at 15 workers but consumed ~27 min of CPU. On a 4-vCPU runner that projects to roughly 8-15 min wall, which puts 20 uncomfortably close to a false red on a job that is explicitly never supposed to red on anything but a broken harness. 30 still catches a genuine hang against the six-hour default.
3. **Renamed the job key as well as its display name** (`metrics` → `mutation`). The plan only called for the display name; renaming both keeps them coherent, and nothing references the key.

## QA Findings

- **[DRY, fixed]** `CONTRIBUTING.md` ended up with two adjacent bullets that both introduced mutation testing and both stated the gating rule ("not a PR hard gate" / "never fails the PR") — two copies of one contract, drifting apart on the next edit. Consolidated into a single bullet.
- **[Documentation, fixed]** The ESLint-vs-`.gitignore` trap that broke the build had no home in the memory bank. Added a line to the ESLint entry in `techContext.md`: flat config does not read `.gitignore`, Prettier 3 does, so a new build artifact can break lint while formatting stays green.
- **[Integrity, clean]** `git diff ccdaf90..HEAD -- src/` is empty — the deliberate step-1 test break left no residue, and no `console.log` / `TODO` / placeholder was introduced.
- **[KISS, accepted as-is]** Six lines of comment on a fifteen-line job is comment-heavy, but both blocks document things the YAML cannot show: an *inherited* default (`thresholds.break: null`) that is invisible in the config, and the measurement behind the timeout number. Preflight identified the first as the mitigation for a real risk. Kept.
- **[YAGNI, clean]** Everything added is required: one `timeout-minutes` key, one ESLint ignore entry, and comments. The ESLint ignore is minimal — `reports/` needs no entry because it holds no `.ts`/`.js`.
- **[Completeness, clean]** All 6 brief requirements, all 6 constraints, and all 5 acceptance criteria map to shipped changes. Nothing stubbed or deferred.
- **[Regression, clean]** Job key `mutation` matches the lowercase style of the existing `test` job; the ESLint ignores entry sits with the other generated directories.

## Preflight Findings

- **[Blocking, resolved]** Plan steps were ordered implementation-then-verify. Amended to explicit RED → change → GREEN per step, plus a new step 1 that proves the crash-reds contract empirically before any edit.
- **[Medium, resolved]** Plan said "keep the job name," but `Coverage & mutation (advisory)` becomes false once coverage leaves. Renaming folded into step 2 and the docs step. Safe because the check is new in this PR, so no branch protection references it yet.
- **[Medium, resolved]** PR #146's title advertises coverage metrics and feeds release-please's changelog on squash merge. Added step 8.
- **[Advisory, not actioned]** The `test` job — the one that actually gates PRs — also has no `timeout-minutes`, and no workflow in `.github/workflows/` has one anywhere. Same six-hour exposure, one line to fix, but outside this brief's scope. Operator's call.
- **[Info]** Reference sweep is complete: `prepublishOnly` reaches coverage only via `test:ci`, which is untouched. No consumer of the removed scripts exists outside the files already in the plan.
- **[Radical innovation — considered, rejected]** The cheapest way to "prove mutation runs to completion" is `--dryRunOnly` at ~6s instead of a ~4min full run, but that produces no score and would defeat the operator's stated reason for keeping the job. The genuinely higher-value structural moves (score on the PR surface; gating at a floor) were both explicitly rejected this session. No amendment recommended.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [x] QA
