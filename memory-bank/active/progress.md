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
