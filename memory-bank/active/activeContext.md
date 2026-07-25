# Active Context

## Current Task: issue-148-grapheme-backspace
**Phase:** COMPLEXITY-ANALYSIS - COMPLETE

## What Was Done
- Read [#148](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/148) and located the affected code: the `isBackspaceKey` branch of the `useKeypress` handler in `src/index.ts` (~L668-680).
- Operator decision (the issue's open question): **diverge from readline** — implement grapheme-cluster deletion via `Intl.Segmenter` rather than keeping code-point deletion. Rationale: the prompt renders its own search box, so leftover debris like `👨‍👩‍` is directly user-visible, and `Intl.Segmenter` is built in (Node >= 22 already required), so the fix costs no dependency.
- Classified **Level 1**: bug fix, single component, isolated, low risk.

## Next Step
- Load `.cursor/skills/shared/niko/references/level1/level1-build.md` and execute the Build phase.
