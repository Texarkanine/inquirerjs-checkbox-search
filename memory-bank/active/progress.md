# Progress

Detect demo changes from a text record and a frame-state sequence recorded for the merge-base and the pull request in the same job, so a demo comment expands only when that demo's behavior changed. Roll out in shadow mode first. A text mismatch is final; a frame mismatch counts only when it survives re-recording.

The rework makes the shadow step on pull request #191 finish and exit 0 with a visible verdict. Frame PNGs must land on the host scratch directory. Process-wide `TMPDIR` must stay off the scratch bind mount.

**Complexity:** Level 1

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

## 2026-10-08 - PREFLIGHT - COMPLETE

* Work completed
    - Re-validated the revised Level 3 plan against `scripts/generate-demo.js`, the tapes, the workflow, the detector, and the Vitest/tsconfig/ESLint setup
    - Wrote `memory-bank/active/.preflight-status`; first line is `FAIL (fixable)`
* Decisions made
    - No in-phase plan edits: no scheduled change-detectors and no test-order swaps were found
* Insights
    - `generate-demo.js` runs `main()` at import, so `parseGenerateArgs` cannot be tested from there
    - The shadow line and the retry-name hand-off have no CLI producer
    - The Dockerfile-change CHANGED invariant has no mechanism

## 2026-10-08 - PLAN - COMPLETE

* Work completed
    - Revised the plan for the second preflight's three findings
* Decisions made
    - `parseGenerateArgs` lives in `scripts/demo-fingerprint.ts`. Tests do not import `generate-demo.js`
    - The gif-only path does not load the TypeScript module. `engines` stays `>=22`
    - CLI stdout is sorted `<demo>: <ASSESSMENT>` lines plus a final `SHADOW_VERDICTS=` line
    - A Dockerfile change is CHANGED only when the fingerprints change
* Insights
    - Scratch mode must not use the one-demo npm docker path, or a retry would build the wrong image tag

## 2026-10-08 - PREFLIGHT - COMPLETE

* Work completed
    - Re-validated the second plan revision against the generator, tapes, workflow, detector, comment script, and Vitest/tsconfig/ESLint setup, plus upstream VHS docs
    - Wrote `memory-bank/active/.preflight-status`; first line is `PASS WITH ADVISORY`
* Decisions made
    - No in-phase plan edits: test-first ordering holds in every executable unit, no scheduled change-detectors, no order swaps
* Insights
    - VHS `.txt`/`.ascii` outputs, trailing-slash `frames/` output, `frame-text-*`/`frame-cursor-*` naming, and `Wait+Screen /regex/` all check out against upstream docs
    - Shadow step should pin serial recording and export `SHADOW_VERDICTS` for the envsubst template (advisories)
    - The `.txt` framing assumption behind normalization fixtures wants confirmation from VHS source or the first CI shadow run (advisory)

## 2026-10-08 - BUILD - COMPLETE

* Work completed
    - Added `scripts/demo-fingerprint.ts` and its Vitest file
    - Taught `scripts/generate-demo.js` a serial scratch mode that does not import TypeScript unless a scratch flag is present
    - Replaced the hidden post-launch sleep in the three tapes with `Wait+Screen /Search:/`
    - Added a shadow step to `generate-demos.yaml` and one `SHADOW_VERDICTS` line to the comment template
* Decisions made
    - Scratch mode records one demo at a time
    - The gif path is derived as `<demoDir>/<demoName>-demo.gif`
    - The shadow sentence says the verdicts are not used to expand demos
* Insights
    - `npm test` passed: 164 tests, format, lint, and typecheck
    - Docker is not installed on this machine, so the shadow step is unverified until CI

## 2026-10-08 - QA - COMPLETE

* Work completed
    - Evaluated implementation against project brief, system patterns, and implementation plan
    - Verified KISS, DRY, YAGNI, Completeness, Regression, Integrity, and Documentation criteria
    - Verified all 164 tests pass with formatting, linting, and dual-tsconfig typecheck
    - Wrote PASS status to `memory-bank/active/.qa-validation-status`
* Decisions made
    - QA approved with PASS verdict
* Insights
    - Clean separation of scratch execution preserves legacy demo generation untouched
    - Pure unit test coverage across all flowchart edge cases and CLI formats validates logic without requiring local Docker daemon

## 2026-10-08 - REFLECT - COMPLETE

* Work completed
    - Wrote `memory-bank/active/reflection/reflection-issue-190.md`
    - Updated `techContext.md` so typecheck, script tests, and the shadow verdict match the build
* Decisions made
    - `productContext.md` and `systemPatterns.md` stay as they are. This work does not change who the prompt is for, or the prompt's architecture
* Insights
    - The GIF-only generator path must not import the TypeScript fingerprint module
    - Generator `--scratch` is the side directory. Fingerprint `--scratch` is the parent of `attempt-<n>`

## 2026-10-08 - REWORK - IN-PROGRESS

* Work completed
    - Operator asked to rework issue-190 because the Generate job on pull request #191 exited 1 in the shadow step
* Decisions made
    - Rework the completed task instead of archiving it
* Insights
    - The six recordings finished. The fingerprint CLI then exited 1, and command substitution under `set -e` hid its message
    - VHS v0.10 renames the frame directory from the container temp dir onto the bind-mounted frames path and ignores the error, so the frames directory stays empty

## 2026-10-08 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Classified the rework as Level 1
* Decisions made
    - Level 1: one bug in the scratch Docker run. The frames must land on the bind mount, and a structural CLI error must show up in the job log
* Insights
    - Expand and collapse stay on the GIF diff. This rework does not change the verdict rule

## 2026-10-08 - BUILD - COMPLETE

* Work completed
    - Set scratch `TMPDIR` on the bind mount and created that directory before `docker run`
    - Wrote structural CLI errors to stderr
    - `npm test` passed: format, lint, typecheck, and 167 tests
* Decisions made
    - Leave expand and collapse on the GIF diff
    - Do not change the verdict rule
* Insights
    - Docker is not installed here, so the rename itself is unverified until the next Generate job

## 2026-10-08 - QA - COMPLETE

* Work completed
    - Reviewed the rework against the project brief and the task notes
    - `npm test` passed: format, lint, typecheck, and 167 tests
    - Wrote PASS to `memory-bank/active/.qa-validation-status`
* Decisions made
    - PASS with two advisories: the rename fix is unverified until CI, and a structural CLI error still fails the step with a visible message
* Insights
    - `TMPDIR` on the scratch mount keeps VHS's temp directory and the frames path on one filesystem
    - `.vhs-tmp` sits beside the demo directories and the fingerprint reader ignores it

## 2026-10-09 - CI - CANCELLED

* Work completed
    - Read the Generate job that ran after the `TMPDIR` push
* Decisions made
    - Do not treat process-wide `TMPDIR` on the scratch mount as the fix
* Insights
    - [Run 37867082815](https://github.com/Texarkanine/inquirerjs-checkbox-search/actions/runs/37867082815/job/113616261602) cancelled the shadow step after about six hours
    - The log stops on the first base `basic` recording, after "Recording into" and before VHS prints `File:`
    - The earlier run finished every recording in minutes and then exited 1 with an empty frame directory

## 2026-10-09 - REWORK - IN-PROGRESS

* Work completed
    - Operator asked to rework issue-190 again. Generate job [37867082815](https://github.com/Texarkanine/inquirerjs-checkbox-search/actions/runs/37867082815/job/113616261602) was cancelled after 6h
* Decisions made
    - Rework the completed task instead of archiving it
    - Do not re-run that commit. The hang is the `TMPDIR` change, not a runner flake
* Insights
    - The shadow step printed `File:` for the first base `basic` tape at 00:56:10Z and then nothing until the job was cancelled at 06:54:12Z
    - The same job's GIF step finished in about 90 seconds. The previous shadow step, without `TMPDIR` on the bind mount, finished in about 3.5 minutes and then exited 1

## 2026-10-09 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Compared [run 37867082815](https://github.com/Texarkanine/inquirerjs-checkbox-search/actions/runs/37867082815/job/113616261602) with the previous shadow failure and with the GIF step in the same job
    - Classified the rework as Level 1
* Decisions made
    - Level 1: one bug in the scratch Docker run. Do not retry the cancelled commit
* Insights
    - VHS prints `File:` before it starts ttyd and Chromium. The log never gets past that line
    - Chromium's profile and the frame directory both come from the process temp dir. Pointing that at the bind mount is the change that turned a three-minute failure into a six-hour hang

## 2026-10-09 - BUILD - COMPLETE

* Work completed
    - Kept the process temp dir off the scratch mount and copied frames out of container `/tmp/vhs-frames`
    - Capped the shadow step at 20 minutes
    - `npm test` passed: format, lint, typecheck, and 169 tests
* Decisions made
    - Do not retry the cancelled commit
    - Leave expand and collapse on the GIF diff
* Insights
    - VHS frame PNGs are mode 0600, so the container command makes them readable before `docker cp`
    - Docker is not installed here, so the copy is unverified until the next Generate job


## 2026-10-09 - QA - COMPLETE

* Work completed
    - Reviewed the rework diff against the task notes and the Level 1 plan
    - Ran `npm test`: format, lint, typecheck, and 169 tests pass
    - Wrote PASS to `memory-bank/active/.qa-validation-status`
* Decisions made
    - PASS with one advisory: the container copy path is unverified until the next Generate job (no Docker here)
* Insights
    - Named container plus `docker cp`/`docker rm -f` in a `finally` keeps frames on the container filesystem while still landing them on the host

## 2026-10-09 - REWORK - IN-PROGRESS

* Work completed
    - Operator asked to rework issue-190 again. Generate job [37949632608](https://github.com/Texarkanine/inquirerjs-checkbox-search/actions/runs/37949632608/job/113884741326) failed after 5 minutes
* Decisions made
    - Rework the completed task instead of archiving it
* Insights
    - All six shadow recordings finished. The fingerprint CLI then found no frame-text PNGs
    - Local vhs v0.10.0 leaves a precreated frames directory empty and writes the PNGs when that directory does not exist yet

## 2026-10-09 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Compared [run 37949632608](https://github.com/Texarkanine/inquirerjs-checkbox-search/actions/runs/37949632608/job/113884741326) with a local vhs v0.10.0 recording
    - Classified the rework as Level 1
* Decisions made
    - Level 1: one bug in the container command that runs before VHS
* Insights
    - The GIF step succeeded. The shadow step's six recordings succeeded. The host frames directory was empty
    - Do not create the frames Output directory before `vhs`. VHS renames its temp directory onto that path and ignores a failure

## 2026-10-09 - BUILD - COMPLETE

* Work completed
    - Removed the `mkdir` of `/tmp/vhs-frames` from the container command
    - `npm test` passed: format, lint, typecheck, and 169 tests
* Decisions made
    - Leave the host frames directory as the `docker cp` destination. Only the in-container Output path must be absent
* Insights
    - Local vhs v0.10.0 wrote `frame-text-*.png` when the Output directory did not exist, and left a precreated directory empty

## 2026-10-09 - QA - COMPLETE

* Work completed
    - Evaluated implementation against the Level 1 task requirements and system patterns
    - Verified KISS, DRY, YAGNI, Completeness, Regression, Integrity, and Documentation criteria
    - Verified all 169 unit tests pass with formatting, linting, and dual-tsconfig typecheck
    - Wrote PASS to `memory-bank/active/.qa-validation-status`
* Decisions made
    - PASS with one advisory: container execution is unverified on this machine (no Docker), but verified locally with vhs v0.10.0 and covered by unit test
* Insights
    - Omitting precreation of `/tmp/vhs-frames` allows VHS v0.10.0 `os.Rename` to succeed
    - Shell command safely guards chmod with directory existence and preserves original vhs exit code

## 2026-10-09 - REWORK - IN-PROGRESS

* Work completed
    - Operator asked to rework issue-190. The shadow verdict marked basic CHANGED with no visual difference
* Decisions made
    - Rework the completed task instead of archiving it
* Insights
    - Local recordings of the main tape and this branch's tape match, including on two busy cores
    - The retry calls CHANGED when the sides disagree again, without checking that each side reproduced itself

## 2026-10-09 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Classified the rework as Level 1
* Decisions made
    - Level 1: one bug in the frame verdict. Passing screens are ignored, and a retry is CHANGED only when each side reproduces itself
* Insights
    - The job log already prints the fingerprint command's stdout, so the sequence lines go there

## 2026-10-09 - BUILD - COMPLETE

* Work completed
    - Left frame runs shorter than 8 frames out of the compared fingerprint
    - A retry is CHANGED only when each side repeats its first frames
    - The fingerprint command prints collapsed runs and hold counts
    - `npm test` passed: format, lint, typecheck, and 173 tests
* Decisions made
    - 8 frames is the cutoff. Local recordings on two busy cores kept passing screens at 5 or fewer and settled screens at 13 or more
    - A side that does not repeat itself is NOISY, and the shadow step still exits 0
* Insights
    - Dropping a one-frame state that sits between two copies of the same screen must not merge those copies into one run




