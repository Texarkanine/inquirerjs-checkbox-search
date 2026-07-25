# Project Brief

## User Story

As a maintainer, I want to prove out StrykerJS mutation testing on this repo so that I can decide whether it earns a permanent place in the quality gate alongside existing coverage thresholds.

## Use-Case(s)

### Use-Case 1

Install and configure StrykerJS with the Vitest runner, run a dry-run then a full mutation run against `src/`, and obtain a mutation score plus HTML report for triage.

### Use-Case 2

Triage surviving mutants into genuine test gaps (worth killing) vs. noise (theme strings, ANSI, default literals), then write a go/no-go recommendation on wiring mutation testing into `pr.yaml`.

## Requirements

1. Add `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` as devDependencies.
2. Add `stryker.config.json` using the starting config from [issue #145](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/145).
3. Run `npx stryker run --dryRunOnly` before a full run to confirm Vitest 4.1 compatibility and mutant count.
4. Execute a full mutation run and review the HTML report.
5. Triage survivors: genuine gaps vs. noise.
6. Decide: adopt with `thresholds.break` in CI, adopt as advisory-only, or drop.
7. Deliverables: recorded mutation score for `src/index.ts`, triaged survivor list, written go/no-go on `pr.yaml`.

## Constraints

1. Scope is as described in [issue #145](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/145) — PoC and decision, not necessarily permanent CI wiring unless the go decision requires it.
2. Watch known risks: hangs/timeouts, `onUnhandledError`/`ExitPromptError` suppression, clean tree (no `src/node_modules` from tshy), mediocre first score expected.
3. `@stryker-mutator/typescript-checker` is stretch / deferred unless the first run is too noisy.
4. Follow project TDD and quality practices for any code or config that lands in the repo.

## Acceptance Criteria

1. A recorded mutation score for `src/index.ts`.
2. A triaged list of surviving mutants worth killing.
3. A written go/no-go on wiring mutation testing into `pr.yaml`.

---

# Rework: PR #146 review feedback

## User Story

As a maintainer, I want the PR mutation check to earn its runtime — proving mutation testing still completes without duplicating work the pipeline already does — so that the job is worth keeping when we later decide to gate on the score.

## Use-Case(s)

### Use-Case 1

A contributor opens a PR. The `metrics` job runs mutation testing only, logs the score, and passes green regardless of the score. The contributor can read the number in the build log.

### Use-Case 2

A PR breaks the test harness so Stryker crashes, or the run hangs past the timeout. The job fails red, because a PR does not get to break the harness.

## Requirements

1. Remove the advisory coverage step from the `metrics` job in `.github/workflows/pr.yaml`; coverage is already run, gated, and reported via `test:ci` + Codecov.
2. Remove the now-unused `test:coverage:advisory` and `test:metrics` npm scripts.
3. Add a `timeout-minutes` bound to the `metrics` job so a hung run cannot burn the six-hour default.
4. Remove the `"concurrency": 4` pin from `stryker.config.json` so Stryker uses its cores−1 default per machine.
5. Remove the dead `stryker-tmp/` entry from `.gitignore` and `clean` (Stryker's temp dir is `.stryker-tmp`).
6. Update `CONTRIBUTING.md` and `memory-bank/techContext.md` to match the surviving scripts and job behavior.

## Constraints

1. **Keep the `metrics` job on PRs.** It is a visibility and completion check, not dead weight.
2. **Keep the `actions/cache` step** for Stryker's incremental file. Do not add main-branch seeding.
3. **Keep `incremental: true`** in `stryker.config.json` for local accumulation.
4. **No reporting machinery**: no `$GITHUB_STEP_SUMMARY` step, no PR comment, no summary script. Build logs are the visibility surface.
5. **Do not add `thresholds.break`** and **do not add `continue-on-error`**. The default `thresholds.break: null` already gives crash-fails / low-score-passes.
6. Out of scope: `paths:` filter, `StringLiteral` mutator exclusions, killing the triaged survivors.

## Acceptance Criteria

1. The `metrics` job runs mutation testing only and has a timeout.
2. No npm script references coverage-with-thresholds-disabled; `npm run` surface has no dead entries.
3. A low mutation score leaves the job green; a Stryker crash or timeout leaves it red.
4. `CONTRIBUTING.md` and `techContext.md` describe only scripts and behavior that exist.
5. Full quality gate and test suite pass.
