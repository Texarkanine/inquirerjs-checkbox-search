# Task: Close coverage gap to 100% on supported surface (M1)

* Task ID: issue-147-max-test-qa / M1-coverage-closure
* Complexity: Level 2
* Type: simple enhancement (test-only)

Close all remaining uncovered lines (and as many uncovered branches as are honestly exercisable) in `src/index.ts` by adding kill-verified tests to existing behavior-sliced suites. No product-code edits unless a new test reveals a genuine defect (then TDD a `fix:` and call it out). Bound by cross-milestone invariants in `milestones.md`, especially 1–3, 8, and 9.

## Test Plan (TDD)

### Behaviors to Verify

- **B1 default pre-check**: Enter-only submit with `default: [...]` → selected values. ✅
- **B2 separator survives filter rebuild**: separators remain while filtering. ✅
- **B3 TTY cursor show on unmount**: complete under forced TTY → `cursorShow`; non-TTY completion skips both hide and show. ✅
- **B4 nav blocked while not idle**: pending `source` + nav keys → still loading, answer pending. ✅
- **B5–B9 validate paths**: sync false; async string / false / true / reject. ✅
- **Triage**: nameless choice; non-Error source throw; `columns` fallback; empty-filter arrow no-op. ✅

### Out-of-surface / defensive leftovers (invariant 9)

Recorded after triage; not chased with harness contortions:

| Lines | Reason |
|---|---|
| 238 | `defaultFilter` empty-term early return unreachable via prompt: `filteredItems` short-circuits at 512–514 before calling `defaultFilter`; helper is not exported |
| 185, 722, 734 | Defensive `isSelectable` false arms; key handler never activates/toggles non-selectables under normal navigation |
| 805 | Nav keys in `isNavigationOrAction` all return earlier; fall-through arm unreachable |
| 850 (`?? ' '`) | `makeTheme` deep-merge always supplies default `nocursor: ' '`; fallback not independently reachable without product/export changes |
| 905 (some OR arms) | `loading` implies `source`; typing implies `choices`/`source` already set — isolated OR operands not independently reachable |

### Kill-Verification notes

- Use a **fresh nonexistent** `--incrementalFile` path for targeted runs. Bare `--incremental false` is unsupported; empty file JSON-parse crashes; `--force` retests the whole incremental report and pollutes range scores.
- Validate range `775-796`: 30/31 killed; survivor `setStatus('done')`→`""` deferred to M3.
- Empty-filter `700`: line covered; `if (false) return` survives as near-equivalent (empty selectableIndexes already no-ops) — M3.

## Implementation Progress

1. [x] Baseline snapshot
2. [x] B5 sync validate false + kill-verify
3. [x] B6–B9 async validate + kill-verify `775-796`
4. [x] B1 default + kill-verify `477-481` (100%)
5. [x] B2 separator filter + kill-verify `530-535` (100%)
6. [x] B4 status-gated nav + kill-verify `659-661` (100%)
7. [x] B3 TTY cursorShow (+ non-TTY show skip) + kill-verify `590-594` (100%)
8. [x] Coverage triage + out-of-surface documentation
9. [x] Final gate (`npm test` / `quality:check` green)

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [ ] QA
