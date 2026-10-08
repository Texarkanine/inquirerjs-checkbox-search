# Progress

Detect demo changes from a text record and a frame-state sequence recorded for the merge-base and the pull request in the same job, so a demo comment expands only when that demo's behavior changed. Roll out in shadow mode first. A text mismatch is final; a frame mismatch counts only when it survives re-recording.

**Complexity:** Level 3

## 2026-10-08 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Read [issue #190](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/190) and the persistent memory bank
    - Classified the task as Level 3
    - Wrote the project brief, including the operator's retry amendment
* Decisions made
    - Level 3: a complete feature across the demo tapes, generator, and pull-request workflow, with no change to the prompt architecture
    - Text mismatch is CHANGED on the first comparison
    - Frame mismatch is CHANGED only when it is stable across re-recordings
    - One agreeing pair does not erase a difference another pair recorded
    - A text record that disagrees across re-recordings of the same commit fails the approach, and shadow mode must surface that
* Insights
    - GIF bytes differ on every recording because frame timing and the palette vary
    - The text record is taken once per tape command, so a skipped animation frame does not change it
    - The frame-state sequence is sampled on a timer and can skip a short state when the runner is busy

## 2026-10-08 - PLAN - COMPLETE

* Work completed
    - Mapped the demo workflow, the GIF detector, the three tapes, and the `Search:` prompt prefix
    - Wrote the Level 3 plan in `memory-bank/active/tasks.md`
* Decisions made
    - This build reports verdicts in shadow and leaves expand/collapse and release-please GIF amends on the old detector
    - Verdict logic lives in `scripts/demo-fingerprint.ts` and is tested with Vitest. Coverage stays on `src/`
    - Head is the pull-request head SHA. Base is the merge-base. Sides are recorded serially
    - UNSTABLE exits 0 during shadow so the required check stays green
* Insights
    - The rendered prompt prefix is `Search:` even though the example messages are not
    - A tape-source assertion would be a change-detector, so the `Wait+Screen` edit has no unit test

## 2026-10-08 - PREFLIGHT - COMPLETE

* Work completed
    - Validated the Level 3 plan against the generator, tapes, workflow, detector, Vitest/tsconfig/ESLint setup, and VHS docs
    - Wrote `memory-bank/active/.preflight-status`; first line is `FAIL (fixable)`
* Decisions made
    - No in-phase plan edits: no scheduled change-detectors and no test-order swaps were found
* Insights
    - The fingerprint CLI is relied on by Step 6 but no step builds or tests it
    - The base side cannot run a generator that does not exist at the merge-base yet
    - The checkout is the merge commit, not the PR head
    - `tsconfig.test.json` inherits `rootDir: ./src`, and `npm run typecheck` does not cover tests

## 2026-10-08 - PLAN - COMPLETE

* Work completed
    - Revised the plan for every blocking preflight finding
* Decisions made
    - The checkout's generator and CLI record both worktrees. The worktree's own scripts are not executed
    - Shadow output stays in `$RUNNER_TEMP`. `docs/img` stays the checkout's merge-commit GIFs
    - `tsconfig.scripts.json` typechecks the new module. `tsconfig.test.json` stays unchanged
    - Scratch runs omit `--output` and put a trailing-slash frames path in the tape
    - The in-process tape replayer is out of scope
* Insights
    - Node v22.22.1 imports `.ts` from `.js` with type stripping on by default
