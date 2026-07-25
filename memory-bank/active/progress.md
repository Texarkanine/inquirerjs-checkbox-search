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
