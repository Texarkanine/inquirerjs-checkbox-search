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

Each step is one TDD-style cycle: **red (observable failure / missing artifact) → green (minimal change) → refactor**. For this tooling PoC, the “test” is usually an operational command (`stryker run --dryRunOnly` / `stryker run`) or an assertion on a written artifact — not a new Vitest product case.

1. **Unblock dry-run**
   - **Red:** `npx stryker run --dryRunOnly` fails (already observed); `npm run test:unit` shows 4 backspace/clear-filter failures.
   - **Green:** Minimal unblock only — (a) correct test assumptions (e.g. emoji backspace count / clear-filter steps) if tests are wrong, **or** (b) add `vitest.stryker.config.ts` that excludes only those known failures and set `vitest.configFile` in `stryker.config.json`. Do **not** expand into a general prompt backspace bugfix unless a one-line fix is obvious and already covered by existing tests.
   - **Files:** `src/__tests__/edge-cases.test.ts`, `search-filtering.test.ts`, `selection.test.ts`, and/or `vitest.stryker.config.ts` + `stryker.config.json`
   - **Refactor / verify:** Re-run dry-run → exit 0; record mutant count.

2. **Land Stryker tooling (deps already installed in tech validation)**
   - **Red:** No `test:mutate*` scripts; `.stryker-tmp/` / mutation reports not gitignored; config missing `incremental` for cheap re-runs.
   - **Green:** Finalize `stryker.config.json` (issue starting point + `$schema` + `plugins` + mutate globs excluding `src/__tests__` + `"incremental": true`); update `.gitignore` for `reports/mutation/`, `.stryker-tmp/`, `stryker-tmp/`, `reports/stryker-incremental.json`; add `test:mutate` / `test:mutate:dry` scripts; extend `clean` to remove Stryker temp dirs if cheap.
   - **Files:** `package.json`, `stryker.config.json`, `.gitignore`
   - **Verify:** `npm run test:mutate:dry` exits 0.

3. **Full mutation run**
   - **Red:** No HTML report / no score yet (`reports/mutation/` absent or stale).
   - **Green:** `npm run clean` if needed; `npm run test:mutate`; keep report gitignored.
   - **Files:** none committed from report output
   - **Verify:** Run completes; kill/survive/timeout counts available for `src/index.ts`.

4. **Triage survivors & write decision**
   - **Red:** `memory-bank/active/stryker-poc-decision.md` missing acceptance fields (score, triage list, go/no-go).
   - **Green:** Write the artifact from the HTML/clear-text report; categorize genuine gaps vs. noise; recommend adopt-with-break / advisory-only / drop. Stretch only if needed: `@stryker-mutator/typescript-checker`.
   - **Files:** `memory-bank/active/stryker-poc-decision.md`
   - **Verify:** Project-brief acceptance criteria all present. **Do not** wire `pr.yaml` unless decision is “go” *and* wiring is trivial; default deliverable is the decision.

5. **Quality gate**
   - **Red:** `npm run quality:check` or intentional unit-suite expectations failing after edits.
   - **Green:** `npm run format` then `npm run quality:check`; re-run `npm run test:unit` (document any intentional exclusions).
   - **Verify:** Quality clean; product suite status understood.

### Preflight amendments (2026-07-25)

- Explicit red→green→verify ordering added per step (TDD encoding).
- Enabled `"incremental": true` in planned config so triage/re-runs after config tweaks are cheap (within PoC scope; incremental file gitignored).

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
- [x] Preflight
- [ ] Build
- [ ] QA
