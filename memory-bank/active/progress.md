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

## 2026-11-03 - CREATIVE - COMPLETE

* Work completed
    - Compared three amend bases: merge-base, a committed text fingerprint, and the commit that last touched `docs/img/`
* Decisions made
    - Release amend records the last `docs/img/` commit against the release head and stages CHANGED, NEW, and REMOVED only
    - The comment keeps the merge-base comparison on every pull request
* Insights
    - A release-please pull request does not contain the feature diff, so one comparison cannot both describe the pull request and refresh stale README GIFs

## 2026-11-03 - CREATIVE - COMPLETE

* Work completed
    - Compared three comment treatments for REMOVED, UNSTABLE, and NOISY
* Decisions made
    - Collapse SAME, NOISY, and UNSTABLE with the verdict word in the summary
    - Open CHANGED, NEW, and REMOVED
* Insights
    - Collapsed without a verdict word still fails the operator's request, because SAME has to be stated

## 2026-11-03 - PLAN - COMPLETE

* Work completed
    - Mapped the comment, the fingerprint module, the byte-diff scripts, and the release amend
    - Wrote nine implementation steps, with the new behavior in Vitest and the workflow as a caller
* Decisions made
    - No new dependency. FFmpeg stays the binary in the VHS image
    - `envsubst` does not render the comment
    - The gif-commit recording is its own step and is skipped when that commit is already the merge-base
* Insights
    - The upload script names a demo from every `*-demo.gif`, so the comment list has to come from the tapes rather than from the upload output
