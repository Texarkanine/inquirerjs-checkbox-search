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
