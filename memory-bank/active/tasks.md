# Task: Inquirer ecosystem v12 upgrade

* Task ID: inquirer-v12-upgrade
* Complexity: Level 2
* Type: dependency upgrade / type compatibility fix

Bump `@inquirer/core` to ^12.0.1 and related Inquirer + tooling packages (Dependabot PRs #167, #168, #171). Adapt `src/index.ts` so TypeScript accepts the new `useState` setter and `usePagination`/`renderItem` layout typings. Preserve existing prompt behavior.

## Test Plan (TDD)

### Behaviors to Verify

Runtime behavior of the prompt is not intentionally changing; verification is regression-oriented plus compile/type gates.

- [Selection + navigation still work]: open prompt → Tab toggles, arrows move → Enter submits selected values unchanged
- [Filtering still works]: type search → filtered list → selections persist across filter
- [Async source still works]: async `source` loads and filters without crash
- [Callable values remain values]: function-valued choices can be navigated, selected, and submitted by reference without the prompt invoking them while updating active state
- [Type/build gate]: after bumps + code adapts, `npm run typecheck` and `npm run build` succeed (primary acceptance for the type fixes)
- [Quality gate]: `npm run quality:check` passes under bumped ESLint/Vitest tooling
- [Mutation floor]: `npm run test:mutate` stays at/above configured break threshold

### Edge Cases

- `Value` may be a function type: `setActiveItemValue` must not be treated as a reducer incorrectly — use a reducer returning the value
- `renderItem` must accept full layout `{ item, index, isActive }` even if `index` is unused
- Empty filtered list / only separators: existing navigation tests cover; no intentional change

### Test Infrastructure

- Framework: Vitest + `@inquirer/testing`
- Test location: `src/__tests__/*.test.ts`
- Conventions: behavior-named suites (`selection`, `navigation`, `search-filtering`, `async-behavior`, etc.)
- New test files: none expected for type-only adapts; if a small helper is introduced for safe `useState` setting of `Value`, add a focused unit test for that helper under `src/__tests__/` (or colocated if project pattern emerges). Prefer adapting call sites to match `@inquirer/core` public types without new helpers if possible.

### TDD Sequencing Note

1. If a helper is needed: stub + tests first, then implement.
2. If only annotation/signature changes: write no change-detector tests; prove with existing suite + typecheck (behavior-preserving).

## Implementation Plan

1. **Bump dependencies in `package.json`** (config only — not executable behavior)
   - Files: `package.json`
   - Changes: set versions listed in project brief (inquirer + eslint/vitest tooling)
2. **Install lockfile** (config only)
   - Files: `package-lock.json`, `node_modules`
   - Changes: `npm install` in worktree
3. **Observe type errors** (discovery)
   - Run `npm run typecheck` to confirm exact `TS2322` sites (expected: `renderItem` ~886; `setActiveItemValue` ~576/724/739)
4. **Adapt `renderItem` layout typing** (annotation-only if body unchanged)
   - If implementation stays annotation-only (add `index` to parameter type / destructure unused): no new test; prove with `typecheck` + existing suite
   - If body must change to satisfy types: first add/adjust a regression case in `src/__tests__/basic-functionality.test.ts` or `selection.test.ts` asserting rendered selection UX still works, then change `src/index.ts`
   - Files: `src/index.ts` (± test file only if body changes)
5. **Adapt `useState` / `setActiveItemValue` call sites**
   - First add a regression case to `src/__tests__/object-references.test.ts`: define function-valued choices that record calls, navigate/select/submit them, then assert neither function was invoked and the answer retains the exact function references. Run it and confirm the current direct-setter behavior fails.
   - Change each `setActiveItemValue(nextValue)` call to a reducer-form call that returns `nextValue`, so callable values are stored rather than invoked. Re-run the focused regression test, then the existing navigation/selection tests.
   - If a new helper is required for safe `NotFunction` assignment:
     1. Stub helper signature in `src/` (or existing util module)
     2. Stub + implement unit test in `src/__tests__/` asserting helper returns the next value without invoking it as a reducer incorrectly
     3. Run that test (expect fail) → implement helper → pass
     4. Wire call sites in `src/index.ts`
   - If no helper: change the three call sites only after the callable-value regression is red; the regression is behavior coverage, not a change-detector.
   - Files: `src/index.ts` (± helper + test if needed)
6. **Verify gates**
   - `npm run build`
   - `npm run quality:check`
   - `npm test`
   - `npm run test:mutate`
7. **Commit implementation**
   - Message prefix: `fix(deps): bump @inquirer/core to 12.0.1 and update inquirer ecosystem`

## Technology Validation

Versions are published Dependabot targets on the same package lines already in use — not new technology. Validation = `npm install` + typecheck/build/test. No PoC beyond the install+gates.

## Dependencies

- `@inquirer/core@^12.0.1`, `@inquirer/type@^4.1.0`, `@inquirer/figures@^2.0.8`, `@inquirer/testing@^3.3.11`
- Tooling: typescript-eslint 8.68.0, eslint 10.9.1, vitest family 4.1.11

## Challenges & Mitigations

- **Challenge: `Value` generic may be a function → setter overload picks Reducer**: Mitigate by using an explicit reducer `(_prev) => nextValue` or a typed helper that returns `NotFunction`-safe assignment.
- **Challenge: `Prettify` recursive types make exact structural match hard**: Mitigate by typing against the layout parameter type exported/inferred from `usePagination`, or a minimal structural type with `index`, without `any`.
- **Challenge: mutation run is slow / flaky on env**: Mitigate by running full `test:mutate` once after unit/quality green; fix only score regressions attributable to this change.
- **Challenge: ESLint 10.9 / typescript-eslint 8.68 may surface new lint findings**: Mitigate by fixing only issues introduced by the bump that block `quality:check`.

## Pre-Mortem

- **Assumed only 3 call sites need setter fixes but more appear after install**: expand grep for `setActiveItemValue` / other `useState` of function-capable Value; fix all typecheck failures before declaring build done.
- **Treated type error as behavior change and over-tested**: stick to existing suite + typecheck for annotation-only fixes (already covered by Test Plan note).
- **Lockfile / peer mismatch leaves CI red despite local green**: use worktree-only `npm install`; do not hand-edit lockfile; re-run quality after install.

## Preflight Findings

- **Resolved — high:** Direct `setActiveItemValue(functionValue)` is observable behavior, not merely a type annotation change: core treats every function setter argument as a reducer. The plan now requires a focused callable-value regression test before converting all three call sites to reducer form.
- **Verified — info:** `@inquirer/core@12.0.1` declares `renderItem` as `{ item, index, isActive }` and its `useState` setter excludes callable values, matching the planned adaptation.
- **Advisory — low:** Keep the `renderItem` callback structurally typed with the required `index` property; do not add a new abstraction or cast solely to name the layout type.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [x] QA

## QA Results

**Status:** PASS (2026-09-02)

Reviewed `b246414` (`src/index.ts`, `object-references.test.ts`, `package.json` / lockfile) against the plan and project brief.

- Completeness: listed Dependabot bumps, lockfile install, three reducer-form `setActiveItemValue` sites, `renderItem` layout `index`, and callable-value regression test are all present. No helper/`any`. No leftover direct setters.
- KISS / YAGNI / DRY: call-site reducers only; structural layout type; no extra abstraction. Repeated “reducer form” comments are explanatory, not debris.
- Regression / integrity: no TODOs, debug logs, or hardcoded shortcuts. README/techContext do not pin `@inquirer/core` versions, so no doc gap.
- Trivial fixes applied: none.
