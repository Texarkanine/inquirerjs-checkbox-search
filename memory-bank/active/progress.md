# Progress

Prove out StrykerJS mutation testing on this repo per [issue #145](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/145): install/configure, dry-run then full run, triage survivors, and produce a go/no-go on wiring into `pr.yaml`.

**Complexity:** Level 2

## 2026-07-25 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Validated intent against issue #145
    - Classified task as Level 2 (self-contained quality-tooling PoC)
    - Created ephemeral memory-bank files
* Decisions made
    - Level 2: not a product feature; no multi-component architecture; issue already specifies approach and acceptance criteria
* Insights
    - Deliverable is evidence + decision; permanent CI wiring is conditional on the go/no-go outcome

## 2026-07-25 - PLAN - COMPLETE

* Work completed
    - Wrote Level 2 implementation + TDD plan in `tasks.md`
    - Tech validation: installed `@stryker-mutator/core@9.6.1` + `@stryker-mutator/vitest-runner@9.6.1`
    - Dry-run attempted: 598 mutants instrumented; initial test run failed
    - Confirmed same 4 unit-test failures outside Stryker (`npm run test:unit`)
* Decisions made
    - Unblocking dry-run is step 1 of build (fix tests or Stryker-scoped vitest exclude)
    - Decision artifact path: `memory-bank/active/stryker-poc-decision.md`
    - Do not wire `pr.yaml` unless go-decision makes wiring trivial; default deliverable is written go/no-go
* Insights
    - Stryker + Vitest 4.1 runner compatibility is fine; suite readiness is the real gate
    - Mutant count (598) is below the issue’s rough 800–1500 estimate but still in a practical range

## 2026-07-25 - PREFLIGHT - COMPLETE

* Work completed
    - Validated plan against codebase, conventions, deps, completeness
    - Amended `tasks.md` with per-step red→green TDD encoding
    - Added incremental mode to planned Stryker config
    - Wrote `.preflight-status` = PASS
* Decisions made
    - PASS with advisory: build must unblock dry-run first; no rearchitect needed
* Insights
    - No public-API conflict; Stryker is pure quality tooling

## 2026-07-25 - BUILD - COMPLETE

* Work completed
    - Fixed `isBackspaceKey` handling in `src/index.ts` (unblocked 4 tests + Stryker dry-run)
    - Finalized Stryker config/scripts/gitignore/clean; `incremental: true`
    - Full mutation run: 602 mutants, score **73.09%**, 0 timeouts, ~4m wall
    - Wrote `stryker-poc-decision.md`: advisory-only for `pr.yaml`
    - Quality + full unit suite green (113)
* Decisions made
    - Advisory-only adoption (keep tooling; no `thresholds.break` in CI yet)
    - Product backspace fix rather than Stryker-scoped test exclusion
* Insights
    - `@inquirer/testing` `keypress('backspace')` does not mutate `rl.line`; prompts that only sync from `rl.line` fail under that harness
    - Render-string / theme survivors dominate the long tail; high-value gaps are filter short-circuit, defaults, and pageSize bounds

## 2026-07-25 - QA - COMPLETE

* Work completed
    - Semantic review against plan/brief (KISS/DRY/YAGNI/completeness/regression/integrity/docs)
    - Added mutation-testing scripts to `CONTRIBUTING.md` Testing section
    - Wrote `.qa-validation-status` = PASS
* Decisions made
    - No substantive rework required
* Insights
    - Maintainer-facing test command docs must track new npm scripts even for advisory tooling

## 2026-07-25 - REFLECT - COMPLETE

* Work completed
    - Wrote reflection for issue-145-stryker-poc
    - Reconciled `systemPatterns.md` with search-term update pattern
* Decisions made
    - None beyond reflection conclusions (advisory-only stands)
* Insights
    - See reflection doc; primary technical lesson is `@inquirer/testing` backspace vs `rl.line`

## 2026-07-25 - REWORK INITIATED - PR #146 feedback

Rework triggered by review of the branch diff on [PR #146](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/146). The `metrics` job as merged does more than the maintainer wants and less carefully than it should.

* Operator feedback
    - **Keep the mutation job as a PR check.** Its purpose is visibility plus proof that mutation testing runs to completion. Build logs are an acceptable place to read the score — no job-summary step, no PR comment, no reporting script.
    - **A crashed Stryker must paint a red X.** "Your PR doesn't get to break the test harness." A low score must never fail the PR.
    - **Cut coverage from the metrics job.** Coverage already runs, is threshold-gated in `test:ci`, and is reported by Codecov; the advisory re-run is duplicate work.
    - **Keep the Stryker cache** — it uses GitHub Actions caching, so warm hits between runs are possible upside. Do not build main-branch seeding to chase more.
    - **Keep `incremental: true` locally** — local dev genuinely accumulates a baseline.
    - **Add a job timeout.**
    - **Drop the `concurrency: 4` pin** so Stryker uses cores−1 per machine.
* Decisions made
    - No `thresholds.break` and no `continue-on-error`: StrykerJS defaults `thresholds.break` to `null`, so crash/timeout exits 1 and a low score exits 0 — the requested contract already holds by default. Verified against the recorded run's own config dump (`{"high":80,"low":60,"break":null}`).
    - Declined for now: `paths:` filter, `StringLiteral` mutator exclusion, main-branch cache seeding.
* Insights
    - `--since` is a Stryker.NET feature, not StrykerJS; incremental mode is the JS equivalent and diffs per-mutant, not per-file.
    - `ccdaf90` removed `ci-metrics-summary.js` on the rationale "tools already log scores" — that rationale is now the accepted answer to visibility, not a gap to fill.
    - The `json` reporter added to `stryker.config.json` has never actually run: the recorded run's config shows `reporters: ["html","clear-text","progress"]`, and `reports/mutation/` contains only `mutation.html`.

## 2026-07-25 - COMPLEXITY-ANALYSIS (rework) - COMPLETE

* Work completed
    - Classified the PR #146 rework as **Level 2**
    - Recreated ephemeral `activeContext.md` and stubbed `tasks.md`; preserved `projectbrief.md`, `progress.md`, `reflection/`, and `stryker-poc-decision.md`
* Decisions made
    - Level 2: modification of existing quality tooling, contained to the CI/config subsystem; no product code and no architectural impact, but too broad across files for Level 1
    - Task ID stays `issue-145-stryker-poc` so the rework archives with the original work
* Insights
    - The rework is mostly deletion; the only additive change is a job timeout

## 2026-07-25 - PREFLIGHT (rework) - COMPLETE

* Work completed
    - Validated the plan against codebase reality: conventions, dependency impact, conflicts, completeness
    - Amended `tasks.md` with per-step RED → change → GREEN encoding (blocking TDD-encoding finding)
    - Added step 1 (prove the crash-reds contract empirically before editing) and step 8 (reconcile PR #146 title)
    - Folded the job rename into step 2 after finding the plan wrongly said to keep the name
    - Wrote `.preflight-status` = PASS
* Decisions made
    - PASS with one advisory: the `test` job also lacks `timeout-minutes`, but that is outside this brief's scope
    - Rename the check now rather than later — it is new in this PR, so no branch protection depends on the old name
* Insights
    - A no-change requirement ("do not add `thresholds.break`") still needs a verification step, or nothing proves the contract holds
    - Reference sweep confirmed `prepublishOnly` touches coverage only through `test:ci`, so removing the advisory scripts cannot break publishing

## 2026-07-25 - BUILD (rework) - COMPLETE

* Work completed
    - Proved the exit-code contract in both directions before editing: broken test → Stryker exit 1; reverted → exit 0
    - Trimmed the CI job to mutation-only, renamed it `mutation` / _Mutation (advisory)_, added `timeout-minutes: 30`
    - Removed `test:coverage:advisory`, `test:metrics`, the `stryker-tmp` path in `clean`, the `stryker-tmp/` gitignore entry, the `concurrency: 4` pin, and the orphaned `json` reporter
    - **Unplanned fix**: added `.stryker-tmp/` to `eslint.config.js` ignores — a leftover Stryker sandbox was failing `npm test` with 15 parsing errors
    - Reconciled `CONTRIBUTING.md`, `techContext.md`, and the PR #146 title/body
    - Verified: `npm test` 113/113 green with a sandbox present; full forced mutation run 73.09%, exit 0, 0 timeouts
* Decisions made
    - Timeout 30 rather than the planned 20: a full run costs ~27 min of CPU, projecting to ~8-15 min on a 4-vCPU runner, and a false red would violate the "only a broken harness reds this job" rule
    - Fix the ESLint breakage at its cause rather than papering over it with `npm run clean`
    - Rename the job key as well as the display name, since nothing references it
* Insights
    - Unpinning concurrency cut the local full run from 4m1s at 4 workers to 2m6s at 15
    - Adding a tool that generates a directory means teaching **every** ignore mechanism about it; git and Prettier were covered here but ESLint flat config was not, because it does not read `.gitignore`
    - Incremental reuse is dramatic: an unchanged-source rerun finished in 10s versus 2m6s forced

## 2026-07-25 - QA (rework) - COMPLETE

* Work completed
    - Semantic review of the rework diff against plan and brief (KISS/DRY/YAGNI/completeness/regression/integrity/docs)
    - Fixed a DRY defect in `CONTRIBUTING.md`: two adjacent bullets both introduced mutation testing and both stated the gating rule
    - Recorded the ESLint-vs-`.gitignore` trap in `techContext.md` so the next tool that generates a directory does not repeat it
    - Confirmed `src/` untouched by the rework and no debug residue from the step-1 deliberate break
    - Wrote `.qa-validation-status` = PASS
* Decisions made
    - Kept the comment density in `pr.yaml`: both blocks document things YAML cannot show — an inherited default and the measurement behind the timeout
    - No substantive rework required
* Insights
    - A contract restated for two audiences is fine; restated twice for the *same* audience is a drift bug waiting to happen

## 2026-07-25 - REFLECT (rework) - COMPLETE

* Work completed
    - Appended the rework reflection to `reflection-issue-145-stryker-poc.md`, preserving the original
    - Reconciled persistent files: `techContext.md` was already current; `productContext.md` and `systemPatterns.md` needed nothing
    - Corrected a stale `concurrency 4` claim in `stryker-poc-decision.md`, which PR #146 links to
* Decisions made
    - Keep one reflection file per task-id and append the rework section rather than starting a second file
* Insights
    - See the reflection; the load-bearing lesson is that an advisory check's value is the *absence* of configuration — reporting machinery buys all of a gate's cost and none of its signal
