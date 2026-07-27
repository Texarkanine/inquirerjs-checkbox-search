---
task_id: issue-147-max-test-qa
complexity_level: 4
date: 2026-07-27
status: completed
---

# TASK ARCHIVE: Max test QA — coverage, SLOBAC, mutation hardening (#147)

## SUMMARY

Completed a three-milestone Level 4 project to make the Vitest suite honest evidence of library correctness: close supported-surface coverage, remediate High SLOBAC smells that destroy kill-power, then kill load-bearing Stryker survivors, justify denominator excludes, and gate CI mutation score at 80. Delivered as three sequential PRs to `main` referencing `[#147]` — [#157](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/157), [#158](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/158), [#159](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/159). No product behavior changes intended; M3 left equivalent PageSize/LogicalOperator survivors visible rather than buying a vanity 100%. Final suite: 133 tests; mutation cleaned score **88.14%** with `thresholds.break: 80`.

## REQUIREMENTS

From [issue #147](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/147) / project brief:

1. **Coverage** — branch and line coverage to 100% on the supported surface (or explicitly out-of-surface), closing Stryker `NoCoverage` mutants. Known holes: async `validate()` settle/reject, `validate === false`, navigation while `status !== 'idle'`, TTY cursor hide/show cleanup.
2. **SLOBAC** — audit the suite; fix High smells that destroy kill-power (vacuous-assertion, pseudo-tested, naming-lies, semantic-redundancy).
3. **Mutation** — kill load-bearing survivors with stronger semantic oracles; cut junk mutants via justified `excludedMutations` / `// Stryker disable`; re-baseline; decide `thresholds.break` vs advisory.

Constraints carried as cross-milestone invariants: no spurious score-buying (presentation-coupled oracles forbidden), no product edits unless a genuine defect (then TDD + `fix:`), selection-across-filter stays guarded, every exclusion justified, every strengthened test kill-verified with a fresh `--incrementalFile`, green `quality:check` at every boundary, one PR per milestone.

## MILESTONE LIST

Original plan (unchanged through execution — no milestones added, removed, re-scoped, or reordered):

1. Close the coverage gap in `src/__tests__/` to 100% branch and line on the supported surface — estimated L2 → **done** (PR #157)
2. Audit the test suite with SLOBAC and remediate all High-severity smells — estimated L2 → **done** (PR #158)
3. Kill load-bearing Stryker survivors, justify and exclude junk mutants, and decide mutation gating in CI — estimated L3 → **done** (PR #159)

Execution was strictly sequential: M2 audited the suite M1 left; M3’s survivor list was only meaningful against a fully covering, honest suite.

## SUB-RUN SUMMARIES

### M1 — Coverage closure (L2, PR #157)

Closed the supported-surface coverage gap with 13 kill-verified tests in existing behavior-sliced suites (`validation`, `navigation`, `compatibility`, etc.). Lines and functions at 100%; branches at **96.28%** with remainder documented as out-of-surface or defensive under invariant 9 (not by exporting internals). No product-code changes.

Key decisions / friction:

- For already-correct production code, kill-verify substitutes for red-first TDD.
- Shared Stryker incremental reports pollute targeted scores — always use a fresh nonexistent `--incrementalFile`.
- `makeTheme` deep-merge made `nocursor ?? ' '` independently untestable; a theme-based coverage claim was discarded after kill-verify proved it false.
- Prompt-level short-circuits can leave helper early-returns dead (`defaultFilter` empty term vs `filteredItems` trim) without an export or unit entrypoint.

### M2 — SLOBAC audit & remediation (L2, PR #158)

Test-only net deletion (−121 lines) on `slobac-me-up`. High kill-power smells from a Grok baseline plus an independent Opus/Sol re-audit were remediations; the re-audit loop was frozen before chasing empty confirmations. Suite green at 128 tests. Selection-across-filter remained guarded via answer-array oracles. Explicitly deferred dissolving `edge-cases.test.ts` and further confirmation-audit nits.

Key decisions / friction:

- Same-model re-audit after own remediations is weak — Opus found ~16 High leftovers Grok missed.
- Plan’s “re-audit until zero High” was reinterpreted as “independent-model pass + clear remediations + freeze,” which better matches kill-power intent.
- Mid-prompt selection oracles often need line-anchored glyphs or theme injection; answer-array oracles strengthen end-of-flow claims.

### M3 — Mutation hardening & gating (L3, PR #159)

Raised post-M1/M2 mutation score from **82.07%** to **88.14%** (baseline 608 mutants → cleaned with 102 ignored). Killed load-bearing survivors with semantic oracles; excluded `StringLiteral` / `ArrayDeclaration` plus justified site disables; ledger in `CONTRIBUTING.md`; set `thresholds.break: 80` and updated the PR Mutation job + docs. 133 tests; no product behavior changes.

Hit-list kills: empty-filter short-circuit (custom filter returning `[]`), `checked`/`loop` defaults, PageSize boundaries, `renderItem` checked/disabled via theme injection, case-fold search via description/value-only oracle. Left PageSize `!== undefined` / `&&`→`||` JS-equivalents and presentation/nav ConditionalExpression long-tail accepted/visible rather than over-broad disables. PR review also killed a MethodExpression `toUpperCase` survivor that was not equivalent (OR-masked) and removed incorrect MethodExpression disables.

Key decisions / friction:

- Late go/no-go on gating after cleaned score beat deciding advisory-vs-gate up front; floor 80 under cleaned 88.14%, not aspirational 100%.
- Non-`next-line` `// Stryker disable LogicalOperator` ignored mutants for the rest of the file until restore — prefer `next-line` or leave accepted.
- L512 empty-search and `defaultFilter` empty short-circuit are redundant on the default-filter path.

## IMPLEMENTATION

**Architectural fit.** This project sits on top of the #145 Stryker PoC (advisory mutation tooling). It did not change the public prompt API. The durable artifacts are: stronger Vitest oracles, a CONTRIBUTING exclusion ledger, `stryker.config.json` excludes + `thresholds.break: 80`, and a CI Mutation job that fails below the floor.

**Key files touched (across milestones).**

| Area     | Files                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Suites   | `src/__tests__/*.test.ts` (behavior-sliced; no new suite files required)                                                                               |
| Mutation | `stryker.config.json`                                                                                                                                  |
| CI       | `.github/workflows/pr.yaml` (`mutation` job)                                                                                                           |
| Docs     | `CONTRIBUTING.md` (exclusion ledger + gate contract), `memory-bank/techContext.md`                                                                     |
| Product  | `src/index.ts` — no intentional behavior edits; only narrowly scoped `// Stryker disable` where site-specific equivalents could not be config-excluded |

**Approach.** Sequential L2 → L2 → L3 sub-runs off feature branches (`test-me-up`, `slobac-me-up`, `mutate-me-up`), each merged before the next. Kill-verify with `npx stryker run --mutate "src/index.ts:<start>-<end>" --reporters clear-text --incrementalFile /tmp/stryker-range.json` (fresh path each run) was the inner-loop quality gate for new/strengthened tests.

## SYSTEM STATE

After all three PRs on `main`:

- **Coverage:** lines/funcs 100% on supported surface; branches ~96% with documented OOS/defensive remainder; Vitest coverage excludes `src/__tests__/**` from the Codecov patch denominator.
- **Suite honesty:** High SLOBAC kill-power smells remediations landed; selection-across-filter still answer-array guarded; theme-injection used where styling must be proven under `NO_COLOR`.
- **Mutation:** cleaned score ~88%; CI fails below 80; exclusion ledger documents every `excludedMutations` / site disable as equivalent or pure presentation; remaining survivors are accepted contract (JS-equivalent guards, presentation long-tail) not silent denominator fraud.
- **Integration end-to-end:** contributor edits to `src/index.ts` hit a denser semantic suite; maintainer mutation score is gated and ledger-backed rather than advisory-only noise from #145.

## TESTING

- Full suite green at each milestone boundary (final: 133 tests).
- `npm run quality:check` green at each boundary; `npm run format` before pushes.
- Preflight + QA PASS on each sub-run; M1/M2/M3 reflections recorded before advance.
- Kill-verify range runs for every strengthened oracle (M1 and M3).
- Full `npm run test:mutate` baseline and cleaned re-run in M3; CI Mutation job contract updated and exercised on PRs.
- M2: independent-model SLOBAC re-audit (Opus/Sol) before freeze; M3 QA re-checked selection-across-filter and ledger/config sync.

## CROSS-RUN INSIGHTS

- **Kill-verify as the real gate.** Across M1 and M3, coverage % and “test exists” both lied when theme merge or redundant short-circuits masked the branch under test. Fresh `--incrementalFile` range runs were the shared quality mechanism that made sequential milestones safe.
- **Independent-model audit for own remediations.** M2’s same-family re-audit after Grok edits was weak; scheduling one Opus/Sol pass + explicit freeze beat infinite “until zero High” confirmation loops. That freeze preserved capacity for M3’s multi-component work.
- **Denominator honesty compounds.** M1’s refusal to fake OOS branches and M2’s refusal of presentation-coupled oracles left M3 a survivor list that could be triaged as Kill / Exclude / Accept without reopening prior PRs. Cross-milestone invariant 2 (SLOBAC on every new test) made that possible.
- **Late gate decisions.** #145 correctly stayed advisory; M3’s written go/no-go after cleaned score produced a modest floor (80) instead of an up-front vanity threshold. Process lesson for future mutation work: decide break only after kill+exclude.
- **Million-dollar threads.** M1: export pure helpers (or tiny testable modules) if coverage honesty is a founding constraint. M2: plan independent-model audit + freeze up front. M3: empty-filter needs a custom `[]` filter; prefer `next-line` Stryker disables.

## LESSONS LEARNED

- Targeted Stryker with a fresh `--incrementalFile` is fast enough (~16s for ~31 mutants) to be the per-test inner loop; shared incremental reports and `--force` are not substitutes.
- `// Stryker disable Mutator` without a working restore can ignore the rest of the file — prefer `next-line` or leave the survivor accepted.
- Empty-search short-circuit is only killable with a custom filter returning `[]` when defaultFilter mirrors the prompt-level check.
- PageSize `x !== undefined && x < n` mutants are often JS-equivalent under `undefined` relational compare — exclude/accept with reason, do not pin presentation.
- For SLOBAC of remediations you authored, use a different model family for at least one assessor pass, then freeze.

## PROCESS IMPROVEMENTS

- Encode the M2 freeze rule in SLOBAC plans (“one independent-model pass, then stop”) instead of open-ended zero-finding loops.
- Keep M3-style late gate criteria in mutation plans: baseline → kill → exclude → cleaned score → break floor.
- L4 advance (`/niko` Step 2a) before capstone archive is load-bearing — archive requires all milestones `- [x]`; do not skip straight to `/niko-archive` after the last PR merge.

## TECHNICAL IMPROVEMENTS

- Optional: export or isolate pure helpers (`defaultFilter` empty-term arm) if future work needs unit-level coverage without prompt harness contortions.
- Optional: revisit accepted PageSize/ConditionalExpression long-tail if product semantics change and equivalents stop being equivalent.
- Deferred from M2: dissolving `edge-cases.test.ts` (Sol Phase B) — still valid cleanup, not blocking.

## NEXT STEPS

None required for #147. Optional follow-ups are listed under Technical Improvements. Memory bank is clear for the next task.
