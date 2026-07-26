# Milestones: issue-147-max-test-qa

## Cross-milestone invariants & constraints

These hold at every milestone boundary. No sub-run may violate one, regardless of which milestone it implements.

1. **No product behavior changes.** This is a test-quality project. `src/index.ts` is not edited unless a new test reveals a genuine defect — in which case the fix is TDD'd, called out explicitly in the sub-run's progress, and committed as `fix:` rather than folded silently into test work.
2. **SLOBAC standards apply to every test written, in every milestone** — not just Milestone 2. A coverage-closing test in M1 and a survivor-killing test in M3 are both subject to the same bar: no vacuous assertions, no pseudo-tested code, no naming-lies, no presentation-coupled oracles. This is what lets M3 fix weak oracles found by Stryker without reopening M2.
3. **No presentation-coupled oracles.** Exact UX copy, theme defaults, and raw ANSI escapes are not valid assertions. Where styling must be proven, use the theme-injection pattern established in `descriptions.test.ts` — `yoctocolors-cjs` reads `hasColors` at module load and this environment sets `NO_COLOR`, so default-theme ANSI assertions cannot pass here.
4. **Nothing leaves the mutation denominator without a recorded justification.** Every `excludedMutations` entry and every `// Stryker disable` carries an in-repo reason identifying it as an equivalent mutant or pure presentation. A high score reached by unjustified exclusion is a failed milestone.
5. **The selection-across-filter invariant stays guarded.** Per `systemPatterns.md` this is the prompt's most load-bearing property. No test deletion or consolidation — particularly in M2 — may leave it unasserted.
6. **Green at every boundary.** `npm run quality:check` passes and the full suite is green before any milestone is considered complete; `npm run format` runs before every push.
7. **One PR per milestone**, titled with a conventional-commit type and referencing `[#147]`, merged to `main` before the next milestone's sub-run begins.
8. **Every new or strengthened test is kill-verified before its milestone closes.** Coverage alone never demonstrates that a test can fail. Verification is a targeted Stryker range run over the lines the test claims to exercise — `npx stryker run --mutate "src/index.ts:<start>-<end>" --reporters clear-text --incrementalFile /tmp/stryker-range.json` (fresh nonexistent path each run) — confirming the mutants in that range move from `NoCoverage`/`Survived` to `Killed`. This substitutes for the "watch it fail first" step of `always-tdd.mdc`, which is unavailable when writing tests against already-correct existing code.
9. **A branch that cannot be exercised is documented, never faked.** If a branch is unreachable under `@inquirer/testing` without a real TTY or other unavailable environment, it is recorded as out-of-surface with the specific reason, and excluded from the mutation denominator under invariant 4. Contorting the harness to manufacture a coverage number is a violation, not a completion.

## Execution Order

Strictly sequential — no parallelization opportunities. M2 audits the suite M1 leaves behind; M3's survivor list is only meaningful against a suite that is both fully covering and honest.

- [x] Close the coverage gap in `src/__tests__/` to 100% branch and line on the supported surface — estimated L2
- [ ] Audit the test suite with SLOBAC and remediate all High-severity smells — estimated L2
- [ ] Kill load-bearing Stryker survivors, justify and exclude junk mutants, and decide mutation gating in CI — estimated L3

## Verified Tooling Facts

Established empirically during preflight, so no sub-run has to rediscover them:

- **Stryker supports line-range targeting**, and it is fast enough for a per-test inner loop: `npx stryker run --mutate "src/index.ts:775-796" --reporters clear-text --incrementalFile /tmp/stryker-range.json` mutated 31 mutants in 16 seconds versus ~2 minutes for a full run. This is what makes invariant 8 practical rather than aspirational.
- **`--incremental false` does not work** — Stryker's CLI rejects unknown option `--incremental=false` / mis-parses bare `false`. Config has `"incremental": true`.
- **Targeted kill-verify needs a fresh `--incrementalFile` path** (nonexistent file). Reusing the shared incremental report (or `--force`) retests/pollutes scores outside the mutate range; an empty JSON file crashes with `Unexpected end of JSON input`.
- **21 of the repo's 32 `NoCoverage` mutants live in `src/index.ts:775-796`** alone, plus 3 survivors in the same block. Milestone 1 is therefore concentrated far more than its scattered line list suggests: the async `validate()` path is most of the work.

## Scope Rationale

**M1 — Coverage closure (L2).** Test-only, self-contained, and the target list is already enumerated: 15 uncovered lines (`478`, `531`, `592`, `660`, `776-777`, `781`, `783-786`, `788-789`, `793`, `795`), 24 uncovered branches, and 3 uncovered functions (the async `validate()` `.then`/`.catch` callbacks at 782/789/792). Known holes per the issue: async `validate()` settle and reject paths, `validate === false`, navigation while `status !== 'idle'`, TTY cursor hide/show cleanup. Single subsystem, no design decisions, no architectural implications.

Two placement notes for the sub-run, per the behavior-sliced convention in `systemPatterns.md`: new cases belong in the existing suite matching the behavior — `validation.test.ts` for the `validate()` paths, `navigation.test.ts` for status-gated navigation, `compatibility.test.ts` for TTY cursor handling — and no new suite should be created. And the TTY gap is specifically the *show* half: `compatibility.test.ts` already asserts `cursorHide` under a forced-TTY, but nothing unmounts the prompt while `isTTY` is true, so `cursorShow` at line 592 has zero hits against 13 executions of its guard.

**M2 — SLOBAC audit and remediation (L2).** The prior instance of this exact work (`20260513-slobac-fix-2026-05-13`) was classified L2 and resolved 8 findings across 4 files without touching production code. The suite has grown since (14 files, ~2850 lines, 118 cases, plus whatever M1 adds), but the character of the work is unchanged: contained, test-only, judgment-per-finding. The audit itself is delegated to a subagent running the local `slobac-audit` skill; remediation is done in-repo.

**M3 — Mutation hardening and gating (L3).** The largest and only genuinely multi-component milestone: it touches test files, `stryker.config.json`, `.github/workflows/pr.yaml`, and `techContext.md`/`CONTRIBUTING.md` docs, and it requires real design decisions about which mutants are equivalent versus merely inconvenient. Baseline from #145: 602 mutants, 73.09% total / 77.19% covered. The pre-identified high-value survivor hit-list is the empty-filter short-circuit, default `checked`/`loop`/`validate`, `default` values application, `PageSizeConfig` boundaries, and `renderItem` checked/disabled branches. Closes with a decision on whether to introduce `thresholds.break` near the cleaned score.
