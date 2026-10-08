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
