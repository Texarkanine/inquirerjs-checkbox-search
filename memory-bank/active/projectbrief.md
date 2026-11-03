# Project Brief

## User Story

As a reviewer of a pull request, I want a demo that has not meaningfully changed to stay collapsed and be marked the same, so the open previews are the demos this pull request actually changed.

## Use-Case(s)

### Use-Case 1

A pull request that cannot affect what a demo shows (for example a dev-dependency bump) shows every demo collapsed, and each one is indicated as the same.

### Use-Case 2

A pull request that changes the visible text or color in one demo expands that demo and only that demo, with before and after together. The other demos stay collapsed and indicated as the same.

### Use-Case 3

A release pull request amends the README GIFs only when a demo is CHANGED. A feature pull request gets no bot commits.

## Requirements

Authoritative spec: [issue #190](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/190). The fingerprint recorder, verdicts, and retry rule already shipped in shadow mode ([archive](../archive/features/20261009-issue-190.md)). This work is the switch that issue deferred: the comment and the release GIF amend follow those verdicts.

1. The demo comment expands a demo only when its verdict says the demo changed, and collapses it otherwise.
2. A SAME demo is collapsed and indicated as the same.
3. A CHANGED demo is open and shows before and after together, as issue #190 section 4 specifies: a vertically stacked before/after GIF, the text diff in a collapsed block, and a styling-only label when only the frame fingerprint differs.
4. A NEW demo is open and shows the after image only.
5. A pull request that cannot affect demos shows every demo collapsed.
6. Re-running the workflow on the same commit gives the same verdicts.
7. Feature pull requests get no bot commits.
8. A release pull request amends the README GIFs only when a demo is CHANGED. If a committed reference is required, commit text fingerprints. Never commit frame hashes.

## Constraints

1. Do not change the fingerprint or retry rules. The experiment that held up is the detector already on the pull-request workflow.
2. GIF byte comparison stops deciding which demos expand and whether a release pull request amends GIFs.
3. UNSTABLE and NOISY are verdicts added after issue #190 was written. During shadow they exit 0 so the required check stays green. The issue does not define how the comment presents them, or how a REMOVED demo is shown.
4. VHS stays the version `demos/Dockerfile` pins. Do not point the container `TMPDIR` at the scratch mount. Do not create the frames directory before `vhs` runs.
5. Durations are not compared. Demos show only what the tapes exercise.

## Acceptance Criteria

1. A pull request that cannot affect demos shows every demo collapsed and indicated as the same.
2. A pull request that changes visible text or color in one demo expands that demo and only that demo, with before and after.
3. Re-running the workflow on the same commit gives the same verdicts.
4. Feature pull requests get no bot commits. Release pull requests get GIF commits only when a demo is CHANGED.
