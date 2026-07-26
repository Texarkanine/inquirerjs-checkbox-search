# Task: Close coverage gap to 100% on supported surface (M1)

* Task ID: issue-147-max-test-qa / M1-coverage-closure
* Complexity: Level 2
* Type: simple enhancement (test-only)

Close all remaining uncovered lines (and as many uncovered branches as are honestly exercisable) in `src/index.ts` by adding kill-verified tests to existing behavior-sliced suites. No product-code edits unless a new test reveals a genuine defect (then TDD a `fix:` and call it out). Bound by cross-milestone invariants in `milestones.md`, especially 1–3, 8, and 9.

## Test Plan (TDD)

### Behaviors to Verify

Uncovered lines from current `coverage/lcov.info` (15): `478`, `531`, `592`, `660`, `776-777`, `781`, `783-786`, `788-789`, `793`, `795`.

- **B1 default pre-check**: render with `default: ['Apple']` and static choices → Apple appears checked without a tab; submit includes Apple.
- **B2 separator survives filter rebuild**: choices include `Separator` + selectables; type a filter that keeps ≥1 selectable → separators remain in the filtered list / screen (hits `Separator.isSeparator` at line 531).
- **B3 TTY cursor show on unmount**: force `process.stdout.isTTY = true`, spy `write`, render, complete the prompt (select + enter) → `write` was called with `cursorShow` (`\u001b[?25h` / equivalent) after cleanup (line 592).
- **B4 nav blocked while not idle**: async `source` that stays pending; while loading, press `up`/`down`/`tab`/`enter` → no selection change, prompt does not complete, still loading (line 660).
- **B5 sync validate false**: `validate: () => false` → submit shows `Invalid selection`, prompt stays open (lines 776-777).
- **B6 async validate reject string**: `validate` returns `Promise` resolving to an error string → that string is shown; prompt stays open (lines 781, 783-784).
- **B7 async validate reject false**: `validate` returns `Promise` resolving to `false` → `Invalid selection`; prompt stays open (lines 785-786).
- **B8 async validate resolve true**: `validate` returns `Promise` resolving to `true` → prompt completes with selected values (lines 788-789).
- **B9 async validate throw**: `validate` returns `Promise` that rejects → `Validation failed`; prompt stays open (lines 793, 795).

### Edge Cases / Remaining Branches

After the line-closing tests, re-run `npm run test:coverage` and triage the remaining uncovered *branches* (currently 24 BRDA arms, including lines that already have some hits: `185`, `211`, `238`, `306`, `628`, `700`, `722`, `734`, `805`, `850`, `905`, …). For each remainder:

- If exercisable under `@inquirer/testing` with a semantic oracle → add a focused case in the matching suite (same PR).
- If unreachable without a real TTY / harness contortion → document as out-of-surface with reason and exclude from the mutation denominator under invariant 4/9 (record in progress; do not fake coverage).

Likely easy follow-ups if still open after B1–B9:

- Choice object with `{ value }` and no `name` (line 211).
- Non-`Error` throw from `source` (line 628 → `'Failed to load choices'`).
- Whitespace-only search term hitting `defaultFilter` empty-trim path (line 238) if still cold.
- Theme without `nocursor` (line 850) via theme injection — not presentation-coupled to default ANSI.

### Test Infrastructure

- Framework: Vitest + `@inquirer/testing` (`render`, `events`, `getScreen`, `nextRender`, `answer`)
- Test location: `src/__tests__/*.test.ts`
- Conventions: behavior-sliced suites; semantic oracles (no exact default theme ANSI / UX-copy locks except the existing TTY escape-sequence spies, which assert protocol bytes not theme copy); async tests use `nextRender` / microtask waits where validation settles asynchronously
- New test files: none

### Test File Mapping

| Behavior | File | Notes |
|---|---|---|
| B1 | `basic-functionality.test.ts` | `default` option; no existing `default:` coverage in suite |
| B2 | `search-filtering.test.ts` | filter rebuild with separators |
| B3 | `compatibility.test.ts` | extend TTY Detection; existing case covers hide only |
| B4 | `navigation.test.ts` | status-gated early return; use deferred `source` + fake timers pattern from `async-behavior.test.ts` |
| B5–B9 | `validation.test.ts` | sync false + async settle/reject paths |

### Kill-Verification (invariant 8)

For each new case (or tight batch sharing a line range), run a targeted Stryker mutation before considering the case done:

```bash
npx stryker run --mutate "src/index.ts:<start>-<end>" --reporters clear-text
```

Minimum ranges to clear:

- `478-478` (or small window around default apply)
- `530-535` (separator filter branch)
- `590-594` (cursorShow cleanup)
- `659-661` (status gate)
- `775-796` (entire validate false + async block — preflight showed 31 mutants / ~16s)

Pass criterion: mutants in the claimed range move from `NoCoverage`/`Survived` to `Killed` (or are documented equivalent under invariant 4). Do **not** use `--incremental false` (CLI trap); omit or use `--incremental=false`.

## Implementation Plan

1. **Baseline snapshot** — re-run `npm run test:coverage`; confirm the 15-line / 24-branch gap still matches plan assumptions; note counts in progress.
   - Files: none (read-only)
   - Changes: none

2. **B5 sync `validate === false`** — add failing test in `validation.test.ts`; confirm red; implement (test-only); kill-verify `775-778`.
   - Files: `src/__tests__/validation.test.ts`
   - Changes: one `it(...)` asserting `Invalid selection` and unresolved `answer`

3. **B6–B9 async validate paths** — add four cases (string / false / true / reject); use `nextRender` or equivalent settle wait; kill-verify `775-796`.
   - Files: `src/__tests__/validation.test.ts`
   - Changes: four `it(...)` blocks; may share a small local helper for select-one-and-enter

4. **B1 default pre-check** — add case; kill-verify around `477-481`.
   - Files: `src/__tests__/basic-functionality.test.ts`
   - Changes: one `it(...)` with `default: [...]`

5. **B2 separator + filter** — add case; kill-verify `530-535`.
   - Files: `src/__tests__/search-filtering.test.ts`
   - Changes: one `it(...)` with `Separator` + typed filter

6. **B4 status-gated navigation** — add case with pending `source`; press nav keys during loading; kill-verify `659-661`.
   - Files: `src/__tests__/navigation.test.ts`
   - Changes: one `it(...)`; import `vi` / fake timers as needed

7. **B3 TTY cursorShow** — extend compatibility TTY suite: force TTY, spy write, complete prompt, assert show sequence; kill-verify `590-594`.
   - Files: `src/__tests__/compatibility.test.ts`
   - Changes: one `it(...)` (or extend existing TTY case carefully without weakening hide assertion)

8. **Coverage triage loop** — `npm run test:coverage`; for each remaining uncovered line/branch: either add a semantic test (same suites as above / closest behavior slice) or record out-of-surface justification in `progress.md` per invariant 9.
   - Files: whichever suites own the remaining arms; `memory-bank/active/progress.md`
   - Changes: zero or more additional `it(...)`; documentation of gaps

9. **Final gate** — `npm run quality:check` and full `npm test` green; `npm run format` before push. Open PR for M1 referencing `[#147]`.
   - Files: none beyond format touch-ups
   - Changes: PR only (no product docs required for test-only coverage closure)

## Technology Validation

No new technology - validation not required. Stryker line-range targeting already verified in L4 preflight.

## Dependencies

- Existing Vitest / `@inquirer/testing` / Stryker tooling
- Cross-milestone invariants 1–9 in `memory-bank/active/milestones.md`
- L4 decisions: sequential PR off `main` on branch `test-me-up`; single issue #147

## Challenges & Mitigations

- **CursorShow requires unmount, and `@inquirer/testing` exposes no `unmount` API**: Mitigation — complete the prompt via select+enter so Inquirer runs effect cleanup; assert `cursorShow` on the write spy after `answer` resolves. If cleanup still does not fire under the harness, document as out-of-surface (invariant 9) rather than contorting the harness.
- **B4 timing races with async source**: Mitigation — reuse `async-behavior.test.ts` fake-timer + never-resolving/deferred source pattern; assert loading UI still present and `answer` still pending after nav keys.
- **Async validate settle flakes**: Mitigation — prefer `nextRender()` after enter; fall back to a single `setTimeout(0)` only if needed; avoid arbitrary long sleeps.
- **Coverage 100% chased into presentation or defensive dead arms**: Mitigation — stop at honest surface; record leftovers with reason; do not assert theme defaults / ANSI copy (invariant 3).
- **Kill-verify slow if ranges widen**: Mitigation — keep ranges tight; use preflight-proven `775-796` batch for validate; never bare `--incremental false`.

## Pre-Mortem

- **Plan "passes" coverage % with vacuous oracles that kill nothing**: Already covered by Challenge on presentation + invariant 8 kill-verify gate — every new case must move mutants to `Killed` before the step is done.
- **M1 stalls forever on a single unreachable branch (e.g. defensive `isSelectable` after prior filter)**: Plan response — step 8's triage explicitly allows out-of-surface documentation; do not expand scope into harness rewriting.
- **Wrong suite placement creates a parallel "coverage" dump file**: Plan response — mapping table forbids new files; if a case does not fit the three named suites / basic / search-filtering, stop and ask rather than inventing `coverage-gaps.test.ts`.
- **Silent product bug fix folded into test PR**: Already covered by invariant 1 — any `src/index.ts` edit must be a separate TDD'd `fix:` called out in progress.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
