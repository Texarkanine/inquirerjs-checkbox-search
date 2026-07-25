# Task: PoC mutation testing with StrykerJS (#145)

* Task ID: issue-145-stryker-poc
* Complexity: Level 2
* Type: simple enhancement (quality tooling PoC)

Prove out [StrykerJS](https://stryker-mutator.io/docs/stryker-js/introduction/) on this repo per [issue #145](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/145): install/configure, obtain a mutation score for `src/index.ts`, triage survivors, and write a go/no-go on wiring into `.github/workflows/pr.yaml`.


## Test Plan (TDD)

This PoC is tooling/process evidence, not a product behavior change. Verification is operational (Stryker runs + written decision), not new Vitest product cases. Existing suite greenness (or a deliberate Stryker-scoped exclusion) is a prerequisite for dry-run.

### Behaviors to Verify

- [x] [Dry-run succeeds]: `npx stryker run --dryRunOnly` → exit 0; instruments `src/index.ts`; reports mutant count
- [x] [Full run completes]: `npx stryker run` → writes HTML report under `reports/mutation/`
- [x] [Score recorded]: mutation score for `src/index.ts` captured in the decision artifact
- [x] [Survivors triaged]: decision artifact lists survivors worth killing vs. noise
- [x] [Go/no-go written]: **advisory-only** (no `pr.yaml` hard gate yet)
- [x] [Edge — dry-run blocked by failing tests]: fixed via explicit `isBackspaceKey` handling (not exclusion)
- [x] [Edge — clean tree]: `npm run clean` removes Stryker temps
- [x] [Regression]: `npm run test:unit` — 113/113 passing

### Test Infrastructure

- Framework: Vitest (`vitest.config.ts`) + `@inquirer/testing`; product tests in `src/__tests__/*.test.ts`
- Mutation tool: `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` (devDependencies)
- Decision artifact: `memory-bank/active/stryker-poc-decision.md`

## Implementation Plan

1. [x] **Unblock dry-run** — fixed backspace via `isBackspaceKey` + `Array.from(searchTerm)` / `updateSearchTerm` in `src/index.ts` (4 previously failing tests now green)
2. [x] **Land Stryker tooling** — deps, `stryker.config.json` (+ incremental), `.gitignore`, `test:mutate*` scripts, `clean` extended
3. [x] **Full mutation run** — 602 mutants, **73.09%**, ~4m1s, 0 timeouts
4. [x] **Triage & decision** — `memory-bank/active/stryker-poc-decision.md` (advisory-only)
5. [x] **Quality gate** — format/quality/unit/dry-run clean

## Technology Validation

See plan history: dry-run unblocked after backspace fix; 602 mutants.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Preflight
- [x] Build
- [x] QA
