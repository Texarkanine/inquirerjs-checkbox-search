# Active Context

## Current Task: issue-148-grapheme-backspace
**Phase:** BUILD - COMPLETE

## What Was Done
- Read [#148](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/148) and located the affected code: the `isBackspaceKey` branch of the `useKeypress` handler in `src/index.ts` (~L668-680).
- Operator decision (the issue's open question): **diverge from readline** — implement grapheme-cluster deletion via `Intl.Segmenter` rather than keeping code-point deletion. Rationale: the prompt renders its own search box, so leftover debris like `👨‍👩‍` is directly user-visible, and `Intl.Segmenter` is built in (Node >= 22 already required), so the fix costs no dependency.
- Classified **Level 1**: bug fix, single component, isolated, low risk.
- BUILD: wrote 5 failing tests first (`it.each` in `edge-cases.test.ts`); confirmed the 4 multi-code-point cases failed and the single-code-point control passed, which proves the tests discriminate the bug rather than the harness.
- BUILD: replaced `Array.from(searchTerm)` with a module-level `Intl.Segmenter` and a slice at the last cluster's start index. Grepped `src/index.ts` for other character-wise edits (`Array.from`, `split('')`, `charAt`, `codePointAt`, `slice(0, -1)`) — none remain, so the backspace branch was the only affected path.
- BUILD: corrected the stale double-backspace at `edge-cases.test.ts` L109-110; updated the `updateSearchTerm` pattern in `systemPatterns.md`.
- Full suite green (118/118); format, lint, and typecheck clean.

## Next Step
- Invoke the `niko-qa` skill for the Level 1 QA phase.
