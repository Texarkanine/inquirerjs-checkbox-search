# Project Brief

## User Story

As a reviewer of a pull request, I want the demo comment to expand a demo only when that pull request changes what the demo shows, so that the open or collapsed state is a real signal and a changed demo can show before and after together.

Authoritative spec: [issue #190](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/190).

## Use-Case(s)

### A pull request that cannot affect demos

A dev-dependency bump, or any other change that leaves demo behavior alone, shows every demo collapsed.

### A pull request that changes one demo

A change to visible text or color in one demo expands that demo and only that demo, with before and after together.

### The same commit, recorded again

Re-running the workflow on the same commit produces the same verdicts.

### Release pull requests

Feature pull requests get no bot commits. A release pull request gets GIF commits only when a demo is CHANGED.

## Requirements

1. Record the merge-base with `main` and the pull request head in the same job, each with its own image built from that tree's `demos/Dockerfile`.
2. For each tape, write the GIF, the text record, and the PNG frames. Add `Output` lines on a temporary copy of the tape. Write text records and frames to a scratch folder. Do not upload the frames.
3. Fingerprint each demo two ways: the normalized text record, and the deduplicated frame-text PNG hash sequence.
4. Verdicts are NEW, REMOVED, CHANGED, and SAME, per the issue.
5. Retry rule, as amended by the operator on 2026-10-08:
    - A text mismatch is CHANGED on the first comparison. Do not retry it away.
    - A frame mismatch is CHANGED when the mismatch is still present on the re-recordings. A mismatch that appears once, after which both sides agree, is a skipped frame.
    - One agreeing pair does not erase a difference that another pair recorded.
    - If the text record disagrees across re-recordings of the same commit, the approach has failed. Shadow mode must surface that rather than average it away.
6. Comment format follows the issue, after shadow mode (requirement 8) has confirmed the verdicts.
7. Replace the hidden `Sleep 1s` after `node examples/….js` with `Wait+Screen /Search:/`.
8. Roll out in shadow mode first: compute the verdicts, write them to the job summary or one line in the comment, and keep today's comment behavior. Switch the comment only after dependency-bump pull requests come out SAME.
9. Amend the README GIFs on a release pull request only when a demo is CHANGED. If a committed reference is required, commit text fingerprints. Never commit frame hashes.

## Constraints

1. VHS is v0.10, the version `demos/Dockerfile` pins. The `--output` flag accepts only `.gif`, `.webm`, and `.mp4`.
2. Frame hashes match only within one environment. Both sides of a comparison must use the same runner and the same kind of image.
3. A pull request that changes `demos/Dockerfile` or the VHS version is CHANGED when that change shows up in the text record or the frame-text pixels. A Dockerfile edit that leaves both alone is SAME.
4. Durations are not compared. A change that only makes a demo slower reads as SAME.
5. Demos show only what the tapes exercise.
6. No bot commits on feature pull requests.

## Acceptance Criteria

1. A pull request that cannot affect demos shows every demo collapsed.
2. A pull request that changes visible text or color in one demo expands that demo and only that demo, with before and after.
3. Re-running the workflow on the same commit gives the same verdicts.
4. Feature pull requests get no bot commits. Release pull requests get GIF commits only when a demo is CHANGED.

## Rework

Pull request [#191](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/191) failed its Generate job: [run 37865549229](https://github.com/Texarkanine/inquirerjs-checkbox-search/actions/runs/37865549229/job/113611367454).

Both sides recorded. The shadow step then exited 1 and printed no verdict. VHS v0.10 moves its frame directory with `os.Rename` from the container temp directory onto the frames Output path and ignores the error. That rename crosses the Docker bind mount, so the frames directory stays empty and the fingerprint CLI exits 1. `CLI_OUT="$(run_cli)"` under `set -e` discards that message.

The shadow step must exit 0 and print the verdict line, so the pull request check is green and the change is reviewable. Expand and collapse stay on the GIF diff.

## Rework

The follow-up Generate job on pull request [#191](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/191), [run 37867082815](https://github.com/Texarkanine/inquirerjs-checkbox-search/actions/runs/37867082815/job/113616261602), was cancelled after 6 hours.

The shadow step printed `File:` for the first base `basic` tape and then produced no further output. The previous shadow run, without `TMPDIR` on the scratch mount, finished every recording in about three minutes and then exited 1. The GIF step in the cancelled job finished in about 90 seconds. Do not retry that commit.

Scratch recording must finish and leave the frame PNGs on the host. Process-wide `TMPDIR` must not point at the scratch bind mount. VHS starts Chromium and writes its frame directory from the process temp dir, and that temp dir on the bind mount is what changed between the three-minute failure and the six-hour hang.
