# Task: PoC mutation testing with StrykerJS (#145)

* Task ID: issue-145-stryker-poc
* Complexity: Level 2
* Type: simple enhancement (quality tooling PoC)

Prove out [StrykerJS](https://stryker-mutator.io/docs/stryker-js/introduction/) on this repo per [issue #145](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/145): install/configure, obtain a mutation score for `src/index.ts`, triage survivors, and write a go/no-go on wiring into `.github/workflows/pr.yaml`.


## Test Plan (TDD)

This PoC is tooling/process evidence, not a product behavior change. Verification is operational (Stryker runs + written decision), not new Vitest product cases. Existing suite greenness (or a deliberate Stryker-scoped exclusion) is a prerequisite for dry-run.

### Behaviors to Verify

- [Dry-run succeeds]: `npx stryker run --dryRunOnly` → exit 0; instruments `src/index.ts`; reports mutant count
- [Full run completes]: `npx stryker run` → exit 0 (or non-zero only if `thresholds.break` is set); writes HTML report under `reports/mutation/`
- [Score recorded]: mutation score for `src/index.ts` captured in the decision artifact
- [Survivors triaged]: decision artifact lists survivors worth killing vs. noise (theme/ANSI/defaults)
- [Go/no-go written]: decision artifact states adopt-with-break / advisory-only / drop for `pr.yaml`
- [Edge — dry-run blocked by failing tests]: suite failures prevent dry-run → unblock via fix or Stryker-scoped vitest config before full run (do not fake a green dry-run)
- [Edge — clean tree]: no `src/node_modules` (tshy) present when invoking Stryker
- [Regression]: `npm run test:unit` behavior for non-excluded tests unchanged by Stryker config/deps alone

### Test Infrastructure

- Framework: Vitest (`vitest.config.ts`) + `@inquirer/testing`; product tests in `src/__tests__/*.test.ts`
- Mutation tool: `@stryker-mutator/core` + `@stryker-mutator/vitest-runner` (devDependencies)
- Conventions: behavior-sliced suites; run via `npm run test:unit` / `npx vitest run -t "..."`; quality via `npm run quality`
- New test files: none (optional: `vitest.stryker.config.ts` if excluding known-failing tests for the PoC only)
- Decision artifact: `memory-bank/active/stryker-poc-decision.md` (ephemeral; inlined at archive)

## Implementation Plan

1. **Unblock dry-run (prerequisite discovered in tech validation)**
   - Files: `src/__tests__/edge-cases.test.ts`, `src/__tests__/search-filtering.test.ts`, `src/__tests__/selection.test.ts`, and/or new `vitest.stryker.config.ts` + `stryker.config.json` `vitest.configFile`
   - Changes: Four tests currently fail locally (backspace/clear-filter / special-character search). Prefer minimal unblock for PoC: either fix incorrect test assumptions (emoji backspace count, etc.) if tests are wrong, or point Stryker at a vitest config that excludes only those known failures for the PoC run. Do **not** expand into a general prompt backspace bugfix unless a one-line fix is obvious and covered by existing tests.
   - Verify: `npx stryker run --dryRunOnly` exits 0.

2. **Land Stryker tooling (partially done in tech validation)**
   - Files: `package.json`, `package-lock.json`, `stryker.config.json`, `.gitignore`
   - Changes: Keep `@stryker-mutator/core@9.6.1` + `@stryker-mutator/vitest-runner@9.6.1`; finalize `stryker.config.json` (issue starting point + `$schema` + `plugins` + mutate globs excluding `src/__tests__`); ignore `reports/mutation/`, `.stryker-tmp/`, `stryker-tmp/` in `.gitignore`; add npm scripts `test:mutate` / `test:mutate:dry` for discoverability.
   - Verify: dry-run still green after script/gitignore polish.

3. **Full mutation run**
   - Files: none committed from report output (gitignored)
   - Changes: `npm run clean` if needed; `npx stryker run` (or `npm run test:mutate`); capture clear-text summary + HTML path.
   - Verify: run completes; mutant kill/survive/timeout counts available.

4. **Triage survivors & write decision**
   - Files: `memory-bank/active/stryker-poc-decision.md`
   - Changes: Record score for `src/index.ts`; categorize survivors (genuine gaps vs. noise); recommend go/no-go for `pr.yaml` (`thresholds.break` vs advisory vs drop). Stretch only if needed: `@stryker-mutator/typescript-checker`.
   - Verify: acceptance criteria in project brief all satisfied. **Do not** wire `pr.yaml` unless the written decision is “go” *and* wiring is trivial; default PoC deliverable is the decision, not CI adoption.

5. **Quality gate**
   - Files: any touched tracked files
   - Changes: `npm run format` then `npm run quality:check`; `npm run test:unit` (document any intentional exclusions).
   - Verify: quality clean; product suite status understood.

## Technology Validation

**Performed during plan (2026-07-25):**

| Check | Result |
| --- | --- |
| `@stryker-mutator/core@9.6.1` / `vitest-runner@9.6.1` on npm | ✅ install OK (Node 22.22.1) |
| Peer `vitest >= 2.0.0` vs repo `^4.0.0` (4.1.8) | ✅ |
| Instrument `src/index.ts` | ✅ **598 mutants** (within issue’s 800–1500 estimate; lower bound) |
| Vitest runner dry-run | ❌ blocked: initial test run failed |
| Clean tree (`src/node_modules` absent) | ✅ |

Dry-run failure (first failure shown): `Edge cases > should handle special characters in choices` — `Condition not met within 1000ms`. Reproduced outside Stryker via `npm run test:unit` (4 failures total in edge-cases / search-filtering / selection — all backspace/clear-filter related). **Stryker + Vitest 4.1 integration works; the suite is not dry-run-ready until those failures are unblocked.**

Docs used: [Stryker Vitest runner](https://stryker-mutator.io/docs/stryker-js/vitest-runner/), [configuration](https://stryker-mutator.io/docs/stryker-js/configuration/).

## Dependencies

- `@stryker-mutator/core@9.6.1` (dev)
- `@stryker-mutator/vitest-runner@9.6.1` (dev)
- Existing Vitest 4.1.8 suite must pass (or be deliberately scoped) for dry-run
- Optional stretch: `@stryker-mutator/typescript-checker` (TS 6 peer range unverified)

## Challenges & Mitigations

- **Failing tests block dry-run**: Unblock first (step 1); prefer PoC-scoped vitest exclude over large prompt fixes unless trivial.
- **Hangs/timeouts under mutants**: Tune `timeoutMS` / `timeoutFactor`; timeouts count as killed.
- **`onUnhandledError` ExitPromptError suppression** (`vitest.config.ts`): May under-count kills; note confusing survivors in triage; narrow only if triage shows false survivors.
- **Mediocre first score / rendering noise**: Prefer `mutator.excludedMutations` or `// Stryker disable` over chasing 100%; document in decision.
- **`src/node_modules` from tshy**: Run from clean tree (`npm run clean` before mutate).
- **Report artifacts**: gitignore `reports/` mutation output; do not commit HTML.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [ ] Preflight
- [ ] Build
- [ ] QA
