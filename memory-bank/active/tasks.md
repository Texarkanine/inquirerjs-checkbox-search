# Task: Stable description frame rework

* Task ID: stable-description-frame
* Complexity: Level 1
* Type: bug fix

## Build

Complete.

What broke:

- The session peak measured the raw description. The pad wrapped `theme.style.description(text)`. A style that adds visible columns could paint a row the peak did not reserve, so the next choice shrank the block.
- `padDescription` always word-wrapped. With `autoBufferCountsLineWidth: false`, a long single line reserved one newline row and painted several, so the next choice shrank the block.

Why:

- The measure and the paint were not the same string. Width counting was applied at paint time even when the caller had turned it off.

What changed:

- The peak measures descriptions after `theme.style.description`.
- The pad only pads. The caller word-wraps that styled string when width counting is on, and leaves newline rows when it is off.

Files:

- `src/index.ts`
- `src/__tests__/descriptions.test.ts`

Left unchanged, on purpose:

- No cache of description line counts. A toggle still re-wraps.
- The peak still never shrinks.
- The duplicated description-region test helper stays.

## QA

PASS (2026-10-08).

- KISS: `withStyledDescriptions` is a plain map reusing `calculateDescriptionLines`; no signature changes, no new abstraction. The conditional wrap at the paint call site mirrors the counting branch. Nothing simpler covers the styled-width case.
- DRY: wrap logic lives in `wrapDescription`, shared by measure and paint. The `resolvePageSize` raw-measure plus `Math.max` with the styled floor is intentional layering (keeps `resolvePageSize` theme-free), not duplication.
- YAGNI: no speculative code. Every added line serves the two rework fixes.
- Completeness: both rework fixes implemented and each covered by a new 80-column test (styled-width peak held on the short choice; no word-wrap when counting is off). Peak-only-increases, padding, and README contract unchanged and still satisfied.
- Regression: numeric `pageSize` and non-`autoBufferDescriptions` paths untouched. Separator and empty-description guards preserved. Exported signatures unchanged. Single-file pattern kept.
- Integrity: no TODOs, placeholders, magic numbers, or debug artifacts. The `77`-char fixture plus `>>>` prefix is derived (80 cols at wrap width 79 wraps to exactly 2 rows), not magic.
- Documentation: JSDoc on `withStyledDescriptions` and `padDescription` accurately states the measure-equals-paint contract. No README change needed; behavior now matches the documented default.
- Verification: `npm test` green — format, lint, typecheck, 148/148 tests (146 prior + 2 new).
- Advisory (non-blocking): `withStyledDescriptions` allocates a fresh item array per page-size memo run; negligible at list sizes this prompt targets and explicitly left unoptimized per brief.
