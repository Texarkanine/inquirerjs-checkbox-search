# Progress

Switch the pull-request demo comment and the release-please GIF amend from the GIF byte diff to the fingerprint verdicts already recorded in shadow mode, as specified in issue #190. A demo that has not meaningfully changed stays collapsed and is indicated as the same.

**Complexity:** Level 3

## 2026-11-03 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Confirmed the task is the deferred switch in issue #190, not a change to the detector
    - Wrote the project brief from that issue and from the operator's confirmation
* Decisions made
    - Level 3: the comment body, expand/collapse, and the release amend are multiple consumers of an existing verdict
    - Level 4 does not apply: the recorder, fingerprints, and retry rule stay as shipped
* Insights
    - SAME, CHANGED, and NEW have a comment shape in issue #190 section 4. REMOVED, UNSTABLE, and NOISY do not
