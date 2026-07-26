# Task: Audit suite with SLOBAC and remediate High smells

* Task ID: issue-147-m2-slobac-audit
* Complexity: Level 2
* Type: simple enhancement (test-quality)

Run a SLOBAC audit over `src/__tests__/`, then remediate every in-scope smell so the suite's High kill-power defects (and issue/invariant-named cousins) are gone — without product-code changes and without buying score via presentation-coupled oracles. One PR referencing `[#147]`, merged before M3.

## Test Plan (TDD)

This milestone remediates existing tests; it does not add product behaviors. TDD cycles are per finding: change the test → prove the suite still passes → for any strengthened oracle, kill-verify the claimed lines (cross-milestone invariant 8). Renames and pure deletions skip kill-verify but must not drop coverage of load-bearing paths.

### Behaviors to Verify

- [B1 — High smells cleared]: SLOBAC audit of `src/__tests__/` with the in-scope slug set → zero High-severity findings remain
- [B2 — Issue-named Mediums cleared]: same audit → zero `naming-lies` findings remain (explicitly prioritized by #147 even though taxonomy severity is Medium)
- [B3 — No presentation coupling introduced]: remediations do not add exact UX-copy / default-theme ANSI / glyph oracles; any pre-existing `presentation-coupled` findings in scope are fixed or replaced with semantic/theme-injection oracles (invariant 3)
- [B4 — Selection-across-filter guarded]: after any consolidation/deletion, `search-filtering.test.ts` / `selection.test.ts` still assert that filtering does not drop selections (invariant 5)
- [B5 — Strengthened oracles kill]: each test whose assertion body was strengthened → targeted Stryker range run moves mutants in the claimed lines from `NoCoverage`/`Survived` toward `Killed` (invariant 8)
- [B6 — Green boundary]: `npm run quality:check` and full suite green before milestone close (invariant 6)
- [Edge — No product edits]: diff against `main` contains no changes under `src/` except `src/__tests__/` (unless a genuine defect is found — then TDD a `fix:` and call it out)
- [Edge — Deferred Medium/Low]: Medium/Low smells outside B2/B3 are listed in progress as deferred, not silently "fixed" by weakening coverage

### Test Infrastructure

- Framework: Vitest + `@inquirer/testing`
- Test location: `src/__tests__/*.test.ts` (helpers in `src/__tests__/helpers/`)
- Conventions: behavior-sliced suites (`systemPatterns.md`); no new suite files unless a smell requires regrouping that cannot land in an existing theme
- Audit tooling: local `slobac-audit` skill (subagent-orchestrated); artifacts under `.slobac/<run-id>/`
- Kill-verify: `npx stryker run --mutate "src/index.ts:<start>-<end>" --reporters clear-text --incrementalFile /tmp/stryker-range.json` (fresh nonexistent path)
- New test files: none expected; migrate/delete only if `semantic-redundancy` / `deliverable-fossils` require it

### In-scope SLOBAC slugs

**Must remediate (High):** `vacuous-assertion`, `pseudo-tested`, `semantic-redundancy`, `deliverable-fossils`, `implementation-coupled`, `loose-text-oracle`, `over-specified-mock`, `prose-pin`

**Must remediate (issue / invariant):** `naming-lies` (#147), `presentation-coupled` (invariant 3 — do not introduce; clear if found)

**Audit invocation:** run `slobac-audit` against `src/__tests__/` with those slugs explicitly (or `all`, then filter remediation to the set above). Critical `tautology-theatre` is out of the milestone title but if found must be fixed — it is worse than High.

## Implementation Plan

1. **Baseline audit**
   - Files: `src/__tests__/`; artifacts → `.slobac/<run-id>/`
   - Changes: Invoke `slobac-audit` skill with target `src/__tests__/` and the in-scope slug set. Copy a triage table (file, test name, slug, severity, proposed fix) into `progress.md`. Do not remediate in this step.

2. **Triage against invariants**
   - Files: `memory-bank/active/progress.md`, `memory-bank/active/tasks.md` (checklist of findings)
   - Changes: Mark each finding as remediable / false-positive / deferred. Reject any proposed fix that would assert exact UX copy or default ANSI. Confirm `should maintain selections across filtering` (and related selection invariants) are not on a delete list.

3. **Remediate kill-power smells first** (`vacuous-assertion`, `pseudo-tested`, then High others)
   - Files: whichever `src/__tests__/*.test.ts` the audit names (historically: `descriptions`, `navigation`, `selection`, `search-filtering`; M1 also touched `validation`, `compatibility`, `basic-functionality`)
   - Changes: Per finding — strengthen or rewrite the oracle to a semantic assertion; use theme-injection if styling must be proven. TDD cycle (M1 amendment for already-correct production code): if adding a new replacement case, stub the empty `it(...)` first; then implement the oracle → `npx vitest run -t "…"` (green) → kill-verify claimed lines when the assertion body changed. Renames with unchanged bodies skip kill-verify.

4. **Remediate redundancy / fossils / naming**
   - Files: suites named by audit; possible delete/migrate of a suite file
   - Changes: Rename liey titles; migrate unique coverage into the matching behavior-sliced suite before deleting duplicates; re-run affected tests after each migration.

5. **Clear presentation-coupled findings (if any)**
   - Files: audit-named suites — known pre-existing glyph pins include `search-filtering.test.ts` (`should maintain selections across filtering` and neighbors) and much of `navigation.test.ts` / `selection.test.ts`
   - Changes: Replace glyph/ANSI/copy pins; **do not delete** the selection-across-filter cases. Preference order for replacements: (1) answer-array / behavioral oracles as in `basic-functionality.test.ts` ("Oracle is the answer array — not default-theme checked glyphs"), (2) theme-injected markers when mid-prompt visibility must be asserted, (3) extract a tiny helper under `src/__tests__/helpers/` only if the same injection is repeated across suites. Never "fix" by deleting the only assertion of a load-bearing path.

6. **Re-audit loop**
   - Files: `.slobac/<new-run-id>/`
   - Changes: Re-run `slobac-audit` with the same slug set. If in-scope findings remain, return to step 3 for those items only. Exit when B1–B3 are satisfied.

7. **Regression + quality gate + PR**
   - Files: all of `src/__tests__/`; PR on `slobac-me-up`
   - Changes: `npm test` / `npm run quality:check`; `npm run format` before push; open draft PR titled with conventional type + `[#147]`.

## Technology Validation

No new technology - validation not required. Audit uses the existing local `slobac-audit` skill; tests remain Vitest + `@inquirer/testing`; kill-verify remains Stryker line-range targeting already documented in `techContext.md`.

## Dependencies

- Local `slobac-audit` skill (orchestrator + scout/assessor subagents)
- M1 already on `main` (PR #157 merged) — suite under audit includes M1 coverage cases
- Cross-milestone invariants 1–9 in `milestones.md`
- Prior art: `memory-bank/archive/enhancements/20260513-slobac-fix-2026-05-13.md` (rename / strengthen / migrate pattern; `NO_COLOR` + theme-injection constraint)

## Challenges & Mitigations

- **Audit volume / cost on ~14 suites / ~3k LOC:** Mitigate by scoping remediation to the in-scope slug set; defer other Medium/Low with an explicit progress note.
- **Findings are judgment calls, not compiler errors:** Mitigate with a written triage table before edits; false-positives must cite why (not "looks fine").
- **Strengthening an oracle into presentation coupling:** Mitigate by invariant-3 gate in triage and in each remediation step; prefer theme injection / behavioral outcomes (selection, status, filter term).
- **Consolidation deletes the selection-across-filter guard:** Mitigate by B4 checklist item before any file delete; never delete that case to clear `semantic-redundancy`.
- **Kill-verify flaky / incremental pollution:** Mitigate with fresh `--incrementalFile` path per M1 tooling fact; do not use `--incremental=false`.
- **Genuine product defect revealed by a stronger test:** Mitigate per invariant 1 — TDD a `fix:` commit, call out in progress; do not fold into chore(test) silently.

## Pre-Mortem

- **Plan failed by treating "audit the whole taxonomy" as the acceptance bar:** Scope response already limits remediation to High + `naming-lies` + `presentation-coupled`; keep that fence in build.
- **Plan failed because build started remediating before a frozen triage list, thrashing files:** Step 2 is mandatory; do not skip to edits from a partial scout.
- **Plan failed by "fixing" High smells with weaker or deleted coverage so re-audit goes quiet:** B4/B5/B6 and invariant 2 forbid silent weakenings; re-audit zero is necessary but not sufficient without kill-verify on strengthened cases.
- **Plan failed when `slobac-audit` subagent orchestration stalls:** Fall back to a single-pass manual review using the same slug definitions from the skill taxonomy, document the fallback in progress, still require a recorded findings table.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build (frozen — see Build Freeze)
- [x] QA

## Preflight Amendments (2026-07-26)

1. TDD cycle for remediations explicitly mirrors M1: stub new replacement cases first; strengthen → green → kill-verify; renames skip kill-verify.
2. Presentation-coupled remediation must preserve selection-across-filter coverage; prefer answer-array oracles, then theme injection, then a shared helper if repetition appears.

## Build Freeze (2026-07-26)

Stopped the re-audit loop after an independent Opus/Sol pass and remediation of clear High / issue-named smells. Acceptance is kill-power, not an empty findings list on every subsequent confirm.

### Done

1. Baseline audit + first remediation wave
2. Independent Opus batch + Sol cross-suite re-audit; remediations through two Opus confirmation rounds
3. Full suite green (128); quality gate green; `.slobac/` ignored

### Explicit deferrals

- Sol Phase B: dissolve `edge-cases.test.ts` into behavior-sliced suites — organizational; conflicts with documented grapheme placement in `systemPatterns.md`
- Further confirmation-audit nits that do not clearly increase kill-power
