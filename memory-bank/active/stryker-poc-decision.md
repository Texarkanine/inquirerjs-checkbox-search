# StrykerJS PoC Decision — Issue #145

**Date:** 2026-07-25  
**Tooling:** `@stryker-mutator/core@9.6.1` + `@stryker-mutator/vitest-runner@9.6.1`  
**Config at time of run:** `stryker.config.json` (`perTest`, concurrency 4, `timeoutMS` 10000, `incremental: true`) — the `concurrency: 4` pin was removed during the PR #146 rework, so current runs use Stryker's cores−1 default; the wall times below were measured at 4 workers.

## Mutation score (`src/index.ts`)

| Metric | Value |
| --- | --- |
| Mutants | 602 |
| Killed | 440 |
| Survived | 130 |
| No coverage | 32 |
| Timeout | 0 |
| **Mutation score (total)** | **73.09%** |
| Mutation score (covered) | 77.19% |
| Wall time (full run) | ~4m 1s |
| Dry-run | 113 tests, ~6s (net ~0.9s) |

HTML report (local, gitignored): `reports/mutation/mutation.html`

## Go / no-go for `pr.yaml`

### Decision: **Advisory-only — do not hard-gate PRs yet**

**Do not** add a `thresholds.break` job to `.github/workflows/pr.yaml` in this PoC.

**Do** keep Stryker as a local/optional quality tool:

- Scripts: `npm run test:mutate:dry`, `npm run test:mutate`
- Config + deps land in the repo so maintainers can re-run cheaply (`incremental: true`)

### Rationale

1. **Integration works.** Vitest 4.1 + Node 22 is clean; 0 timeouts; mutant count and runtime match the issue’s feasibility read (~single-digit minutes, PR-viable wall time).
2. **Score is useful but noisy.** ~73% with a long tail of UI/theme/default-string survivors matches the issue’s expectation; a high `thresholds.break` would force busywork or heavy `// Stryker disable` noise before the suite is ready.
3. **Better next step than a blind CI gate:** kill the high-value survivors below (filter/selection, pageSize bounds, defaults), optionally add `mutator.excludedMutations` / disable comments for pure render strings, *then* reconsider a modest `thresholds.break` (e.g. floor near the current score) as a regression tripwire.

### Rejected alternatives

| Option | Why not (now) |
| --- | --- |
| Adopt with `thresholds.break` in `pr.yaml` | Premature: noise floor not managed; would fail PRs for string/theme mutants we explicitly do not want to chase yet |
| Drop Stryker entirely | Would throw away a working setup that already exposed real test gaps and a backspace harness bug |

## Survivors worth killing (genuine gaps)

Prioritized follow-ups (not done in this PoC unless trivial):

1. **Filter early-return / empty-term path** — e.g. `if (!searchTerm.trim())` / `if (!term.trim())` mutants that remove or gut the empty-filter short-circuit (`~508`, `~234`). Assertions should pin “empty/whitespace filter shows full list” more tightly than incidental render content.
2. **Default `checked` coalescing** — `checked: choice.checked ?? false` → `&& false` survived; strengthen default-checked / unchecked rendering tests.
3. **`default` values application** — `defaultValues.includes(...)` guarded block can be disabled without kills; pin pre-selected defaults more directly.
4. **PageSizeConfig boundaries** — `autoBufferDescriptions`, `autoBufferCountsLineWidth`, `terminalHeight < 1` mutants survived; extend `pagesize-config.test.ts` / `page-sizing.test.ts` for boundary and flag behavior.
5. **Default `loop = true` / `validate = () => true`** — boolean/arrow defaults flipped without kills; add explicit default-behavior cases.
6. **Checked/disabled styling branches in `renderItem`** — several `isChecked` / `disabled` condition mutants survived; theme tests cover some paths but not strongly enough.
7. **Page-size memo deps** — emptying the `useMemo` dependency array for page size survived; hard to assert without behavioral flake, but worth a targeted case if auto-size recalculation is load-bearing.

## Survivors treated as noise (do not chase)

- Empty-string / `"Stryker was here!"` injections into `helpTip`, `errorLine`, `descriptionLine`, `searchPrefix` (`Search:` / `Loading...`), `nocursor` default space
- Theme/`usePrefix` object shape and help-tip join separators
- `console.error` message literals on async source failure
- Key-name string equality in `isNavigationOrAction` when equivalent behavior remains (many are weak but low product risk vs. filter invariant)

Prefer `mutator.excludedMutations` (e.g. some `StringLiteral` in render-only regions) or targeted `// Stryker disable next` over asserting every ANSI/label literal.

## Side discovery (unblocked dry-run)

Four Vitest cases around backspace/clear-filter were failing because `@inquirer/testing`’s `keypress('backspace')` does not mutate `rl.line`, while the prompt synced the filter from `rl.line` only. Fixed by handling `isBackspaceKey` via `Array.from(searchTerm)` + `updateSearchTerm` (code-point-safe). Escape-clear path was already explicit; backspace now matches that model. This is a product robustness fix, not test exclusion.

## Known risks (issue checklist) — outcomes

| Risk | Outcome |
| --- | --- |
| Hangs → timeouts | **0 timeouts** at `timeoutMS: 10000` |
| `ExitPromptError` suppression masking kills | No clear false-survivor pattern attributed to this in triage; leave as-is |
| Vitest runner forced settings | No issue observed |
| `src/node_modules` pollution | Clean tree + `npm run clean` covers Stryker temps |
| Mediocre first score | Confirmed (~73%); plan for excludes rather than 100% |

## Stretch

`@stryker-mutator/typescript-checker` **not** added. Survivors are mostly semantic/render, not type-invalid mutants; defer until a second pass if noise remains high after excludes.

## Recommended follow-ups (separate issues)

1. Kill high-value survivors in the list above (TDD against specific mutants).
2. Add selective `mutator.excludedMutations` / disable comments for render-string noise.
3. Revisit CI: optional workflow_dispatch job first; later `thresholds.break` ≈ current floor once noise is managed.
