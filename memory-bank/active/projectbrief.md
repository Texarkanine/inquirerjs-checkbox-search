# Project Brief

## User Story

As a reviewer of a pull request, I want a demo that has not meaningfully changed to stay collapsed and be marked the same, so the open previews are the demos this pull request actually changed.

## Use-Case(s)

### Use-Case 1

A pull request that cannot affect what a demo shows (for example a dev-dependency bump) shows every demo collapsed, and each one is indicated as the same.

### Use-Case 2

A pull request that changes the visible text or color in one demo expands that demo and only that demo, with before and after together. The other demos stay collapsed and indicated as the same.

### Use-Case 3

A pull request that changes a demo adds one commit with the updated GIFs. Squash or rebase brings that commit onto `main`. A pull request that changes no demo adds nothing. A release pull request amends GIFs only when `docs/img/` is still wrong.

## Requirements

Authoritative spec: [issue #190](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/190). The fingerprint recorder, verdicts, and retry rule already shipped in shadow mode ([archive](../archive/features/20261009-issue-190.md)). This work is the switch that issue deferred: the comment and the release GIF amend follow those verdicts.

1. The demo comment expands a demo only when its verdict says the demo changed, and collapses it otherwise.
2. A SAME demo is collapsed and indicated as the same.
3. A CHANGED demo is open and shows before and after together, as issue #190 section 4 specifies: a vertically stacked before/after GIF, the text diff in a collapsed block, and a styling-only label when only the frame fingerprint differs.
4. A NEW demo is open and shows the after image only.
5. A pull request that cannot affect demos shows every demo collapsed.
6. Re-running the workflow on the same commit gives the same verdicts.
7. A pull request whose verdict is not SAME adds one commit to its branch with the GIFs from a single recording of the head. That includes NOISY and UNSTABLE. That commit is not an amend and not a force-push. SAME does not push. The comment tells the author to pull before the next push. See `memory-bank/active/creative/creative-commit-demos-on-merge.md`.
8. A release pull request amends the README GIFs only when `docs/img/` is still wrong compared with the commit that last touched it. Never commit frame hashes. No committed text fingerprint is required.

## Constraints

1. Do not change the fingerprint or retry rules. The experiment that held up is the detector already on the pull-request workflow.
2. GIF byte comparison stops deciding which demos expand and whether a release pull request amends GIFs.
3. UNSTABLE and NOISY are verdicts added after issue #190 was written. During shadow they exit 0 so the required check stays green. The issue does not define how the comment presents them, or how a REMOVED demo is shown.
4. VHS stays the version `demos/Dockerfile` pins. Do not point the container `TMPDIR` at the scratch mount. Do not create the frames directory before `vhs` runs.
5. Durations are not compared. Demos show only what the tapes exercise.
6. The operator turns on the ruleset checkbox that requires a pull request branch to be up to date with `main` before merge. This work does not edit that ruleset. The job name stays `Generate`, the workflow keeps running on every pull request to `main`, and it has no path filter.

## Acceptance Criteria

1. A pull request that cannot affect demos shows every demo collapsed and indicated as the same.
2. A pull request that changes visible text or color in one demo expands that demo and only that demo, with before and after.
3. Re-running the workflow on the same commit gives the same verdicts.
4. A demo-changing pull request cannot merge while its head lacks the updated GIFs. `Generate` stays the required check name. A pull request that changes no demo gets no GIF commit. A release gets GIF commits only when `docs/img/` is still wrong.

## Rework

PR #202 review. The original brief above still holds except where this section replaces it.

1. Release repair must not run the fingerprint CLI while an attempt-1 head from the comment recording is linked and the matching repair base does not exist yet. That throw happens before the repair retry and stops the amend.
2. The feature GIF commit exits 0 when `git rm --ignore-unmatch` or an identical stage leaves the index empty. The comment says a demo commit was added only when a listed path will change `HEAD`.
3. Tape names that end in `-before` or `-before-after` are rejected. Those suffixes are the preview file and URL keys.
4. A width change is a CHANGED demo. Neither GIF is scaled so `vstack` can run. The stacked preview must still be produced without a failed ffmpeg step.
5. SAME is the only verdict that leaves `docs/img/` untouched. NOISY and UNSTABLE are committed, the same as CHANGED, NEW, and REMOVED. Err toward updating the GIF.
6. The text-diff fence changes only if a backtick run in a diff actually closes the fence and breaks the comment.
7. Dismissed review threads get a reply that states why: the `__proto__` upload key, and the request to assert `-i` order in the stack test. The width thread gets a reply that states the no-scale decision. The duplicate suffix thread is the same fix as item 3 of this rework.
