---
task_id: inquirer-v12-upgrade
complexity_level: 2
date: 2026-09-02
status: completed
---

# TASK ARCHIVE: Inquirer ecosystem v12 upgrade

## SUMMARY

Upgraded the Inquirer ecosystem to `@inquirer/core@^12.0.1` (plus related packages and tooling from Dependabot #167/#168/#171) and adapted the prompt so TypeScript and runtime behavior stay correct under core’s new `useState` / layout typings. Shipped on branch `inquirer-v12-upgrade` as PR #173; Cursor review approved with no inline findings; merge left to the operator.

## REQUIREMENTS

- Bump `@inquirer/core` → `^12.0.1`, `@inquirer/type` → `^4.1.0`, `@inquirer/figures` → `^2.0.8`, `@inquirer/testing` → `^3.3.11`, and listed ESLint/Vitest tooling pins.
- Refresh `package-lock.json` via `npm install`.
- Fix `src/index.ts` incompatibilities: `renderItem` layout typing (`index` included) and `setActiveItemValue` for `NotFunction` / Reducer setters.
- TDD for callable choice Values; verify build, quality, full suite, and mutation gate.
- Conventional commit: `fix(deps): bump @inquirer/core to 12.0.1 and update inquirer ecosystem`.

## IMPLEMENTATION

- Updated `package.json` / lockfile for the Dependabot target versions.
- Three `setActiveItemValue` call sites use reducer form `() => nextValue` so function-typed choice Values are stored rather than invoked as reducers (core v12 treats every function setter argument as a Reducer).
- `renderItem` callback parameter typed as `{ item, index, isActive }` (structural; `index` unused in body).
- Added regression in `src/__tests__/object-references.test.ts` for function-valued choices (red under direct setters: 7 invocations; green after reducer form).
- Documented the v12 `useState` gotcha in `memory-bank/systemPatterns.md`.

## TESTING

- TDD: callable-value test failed first (fn invoked as reducer), then passed after reducer-form setters.
- `npm run build` (tshy) — pass.
- `npm run quality:check` — pass.
- `npm test` — 135/135.
- `npm run test:mutate` — 88.26% (break ≥ 80).
- Niko preflight PASS; QA PASS (no trivial fixes).
- Cursor TXRK9 Basic PR Review APPROVED on `22eff8b` with 0 inline comments (one-pass: nothing to change).

## LESSONS LEARNED

- `@inquirer/core` v12: never `setX(functionValue)` when Value may be a function — use `setX(() => functionValue)`.
- After install, typecheck surfaced only the three setter errors; still typing `renderItem` with `index` matched core’s layout contract and preflight advisory.
- Preflight correctly elevated “annotation-only” setter changes to observable behavior requiring a red regression before the call-site fix.

## PROCESS IMPROVEMENTS

- Keep TDD ordering explicit per executable unit when a “type-only” adapt changes call shapes that core interprets at runtime (setter overloads).

## TECHNICAL IMPROVEMENTS

None beyond the `systemPatterns.md` note already landed; no helper abstraction was warranted for three call sites.

## NEXT STEPS

- Operator merges PR #173 when ready.
- Dependabot PRs #167, #168, and #171 can be closed as superseded after merge.
