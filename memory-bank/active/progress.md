# Progress

Switch the pull-request demo comment and the release-please GIF amend from the GIF byte diff to the fingerprint verdicts already recorded in shadow mode, as specified in issue #190. A demo that has not meaningfully changed stays collapsed and is indicated as the same.

**Complexity:** Level 2

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

## 2026-11-03 - CREATIVE - COMPLETE

* Work completed
    - Read the `main` ruleset, the `Generate` requirement, and the 2026 bot-loop commits
    - Compared a release-time GIF update, a commit on the pull request, a push to `main`, and a merge queue
* Decisions made
    - Add one commit to a pull request that changes a demo, so squash or rebase lands those GIFs on `main`
    - Leave the strict up-to-date checkbox off
    - Keep the release amend as a repair when `docs/img/` is still wrong
* Insights
    - The false blame on a later pull request comes from comparing GIF bytes with the file on `main`. The fingerprint compares two recordings of code
    - The demo app cannot push to `main`. The ruleset requires a pull request and the app is not a bypass actor

## 2026-11-03 - PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

* Work completed
    - Validated implementation plan against codebase reality, Level 3 prerequisites, and creative phase outputs
    - Verified strict TDD step ordering across units 1-7, change-detector avoidance for workflow wiring in unit 8, and prose classification for unit 9
    - Evaluated radical innovation for single-pass HEAD tape generation and selective release baseline recording
* Decisions made
    - Plan passes preflight validation with advisory on single-pass tape generation optimization
    - Proceed to Build phase using the verified plan in `tasks.md`
* Insights
    - Eliminating duplicate VHS generation between `demo:generate:all` and scratch head recording can cut CI runtimes substantially without affecting verdict accuracy

## 2026-11-03 - PLAN - COMPLETE

* Work completed
    - Wrote the accepted GIF-commit decision into the project brief and the implementation plan
    - Removed the preflight status that passed the previous plan
* Decisions made
    - A demo-changing pull request adds one commit from a single head recording
    - The operator will require branches to be up to date with `main`. The ruleset edit is theirs
    - The release amend repairs `docs/img/` only when it is still wrong
* Insights
    - `/niko-build` preflights again because the plan it would have trusted forbade this commit

## 2026-11-03 - PLAN - COMPLETE

* Work completed
    - Recorded the operator's acceptance of a GIF commit on a later human push that does not itself change the picture
* Decisions made
    - Ship the comparison against `main`. Do not add a comparison against the GIFs already on the branch
* Insights
    - A README-only commit after a demo change still reads CHANGED against `main`, and that extra GIF commit is accepted

## 2026-11-03 - PLAN - COMPLETE

* Work completed
    - Revised `memory-bank/active/tasks.md` against the five blocking preflight findings
    - Added tested units for the image-list parser, the template fill, the attempt-0 copy plan, and the comment CLI
* Decisions made
    - `renderDemoComment` returns `pullNotice`. The workflow sets `gifCommitAdded` only on the feature path, and the comment is posted before the push
    - Attempt 0 is the uploaded and committed GIF. Attempt 1 stays fingerprint-only
    - The feature GIF commit step requires `is_release_please != 'true'`
    - Declined the advisory to move the whole pipeline into one injected-exec `run`
* Insights
    - `String.prototype.replace` interprets `$&` in the replacement string, so the template fill has to pass a function
    - The upload script only sees `docs/img/*-demo.gif`, and it checks out another branch, so the commit step copies from scratch again after the upload returns


## 2026-11-03 - PREFLIGHT - COMPLETE (FAIL (fixable))

* Work completed
    - Validated the GIF-commit plan against `scripts/demo-fingerprint.ts`, the workflow, the upload script, and `generate-demo-comment.sh`
    - Wrote `.preflight-status` with first line `FAIL (fixable)`
* Decisions made
    - Plan must be revised before build: unit 8 hides untested executable glue (template fill, image-list parsing, CLI), the pull-before-push notice has no implementation home, the head GIF never reaches `docs/img/` for the upload, the push can cancel the comment post, and the GIF commit is not gated off release-please branches
    - No in-phase edits were made to `tasks.md`
* Insights
    - A JS string `.replace` of a template token would reinterpret `$&` in a text diff, the same hazard `envsubst` had
    - The upload script reads only `docs/img/*-demo.gif`, so dropping `demo:generate:all` needs an explicit copy from the scratch head recording

## 2026-11-03 - PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

* Work completed
    - Validated the revised 12-unit plan in `memory-bank/active/tasks.md` against codebase reality and prior preflight findings
    - Verified all five prior blocking findings are resolved: `parseDemoImageList`, `fillCommentTemplate`, `planDocsImgCopies`, `parseCommentArgs`, and `runCommentCli` have dedicated TDD units; `pullNotice` is returned by `renderDemoComment` and placed via `${PULL_NOTICE}`; attempt-0 GIFs copy to `docs/img/` before upload and re-copy before commit; the comment posts before the feature push; and the feature commit step gates out release-please branches
    - Wrote `memory-bank/active/.preflight-status` with first line `PASS WITH ADVISORY`
* Decisions made
    - Plan is approved for Build with non-blocking execution notes and an advisory on staging both feature and release-repair commits directly from `${SCRATCH}/attempt-0/head`
    - No in-phase edits were required on `memory-bank/active/tasks.md`
* Insights
    - Because `${SCRATCH}/attempt-0/head` already lives under `$RUNNER_TEMP` and is symlinked into the release-repair scratch root, release repairs can copy `CHANGED` and `NEW` GIFs directly from scratch after `git checkout` rather than backing up `docs/img/*.gif` beforehand

## 2026-11-03 - BUILD - COMPLETE

* Work completed
    - Implemented the twelve plan units: styling-only verdicts, text diff, comment body, amend selection, scratch loading, attempt-0 copy plan, ffmpeg stack arguments, shadow line, image-list parse, template fill, comment CLI, Generate workflow, and the tech-context sentence
    - Comment and fingerprint unit tests for the new behavior pass. Format and lint pass
* Decisions made
    - `loadCommentEntries` checks stacked and before URLs only when `requireImageUrls` is not false, so copies and amend do not need an upload map
    - The release amend copies CHANGED and NEW GIFs from the repair scratch after restoring `docs/img/` from HEAD. A backup of `docs/img/` is not the source, because the upload script can replace those bytes
    - The repair recording uses the same retry rule as the comment recording
* Insights
    - `src/index.ts` fails typecheck on three `setActiveItemValue` calls, and 32 prompt tests fail, on this branch with the demo changes stashed. Those failures are outside this task


## 2026-11-03 - QA - COMPLETE (FAIL)

* Work completed
    - Reviewed the twelve build units against `tasks.md`, the project brief, and issue #190 section 4
    - Wrote `memory-bank/active/.qa-validation-status` with first line `FAIL`
* Decisions made
    - Build must rerun for three blocking findings: a relative ffmpeg output path that Docker rejects as a mount, an unfenced text diff in the comment, and doc comments detached from their functions
    - The plan does not need revision
* Insights
    - The stack-argument test used absolute paths only, so it could not see the workflow's relative `docs/img/...` output

## 2026-11-03 - BUILD - COMPLETE

* Work completed
    - Resolved GIF paths inside `buildDockerFfmpegStackArgs` and covered a relative `docs/img/` output with a test
    - Fenced the CHANGED text diff as a `diff` block and asserted that fence
    - Moved the detached doc comments onto `buildDockerRunArgs`, `renderDemoComment`, `parseDemoImageList`, and `fillCommentTemplate`
* Decisions made
    - The function resolves paths. The workflow still passes the relative `docs/img/` output
    - The comment-size, duplicated CLI, and unused `--flag=value` advisories stay as written
* Insights
    - Docker treats a non-absolute `-v` source as a named volume, so the mount string has to be absolute on both sides

## 2026-11-03 - QA - COMPLETE (FAIL)

* Work completed
    - Re-reviewed the rebuild against `tasks.md`, the project brief, and the workflow. The three first-review blockers are resolved
    - Ran `npx vitest run scripts` (79 pass), format, lint, and `tsc -p tsconfig.scripts.json`, all clean
    - Wrote `memory-bank/active/.qa-validation-status` with first line `FAIL`
* Decisions made
    - Build must rerun for one blocking finding: `CONTRIBUTING.md` does not describe the demo commit or the pull-before-push step
    - The plan does not need revision
* Insights
    - The plan's only prose unit targeted `techContext.md`, so the contributor-facing doc was missed

## 2026-11-03 - BUILD - COMPLETE

* Work completed
    - Added the demo-commit, pull-before-push, and expected follow-up run to `CONTRIBUTING.md` "Demo Generation"
* Decisions made
    - `README.md` stays as it is. No test locks the contributor prose
* Insights
    - The bot push starts a workflow run that exits because the actor is `demo-generation-doggo[bot]`

## 2026-11-03 - QA - COMPLETE (PASS)

* Work completed
    - Re-reviewed the contributor-doc fix. `CONTRIBUTING.md` matches the `chore: update demo GIFs` commit and the pull notice
    - Ran `npx vitest run scripts` (79 pass), format, lint, and `tsc -p tsconfig.scripts.json`, all clean
    - Wrote `memory-bank/active/.qa-validation-status` with first line `PASS`
* Decisions made
    - The remaining notes stay advisories: full-file text diffs, duplicated CLI sentences, unused `--flag=value`, and the empty-upload comment failure
* Insights
    - `README.md` did not need a change. The contributor-facing gap was only in `CONTRIBUTING.md`

## 2026-11-03 - REFLECT - COMPLETE

* Work completed
    - Wrote `memory-bank/active/reflection/reflection-issue-190-promote.md`
    - Checked `productContext.md`, `systemPatterns.md`, and `techContext.md`. None needed a further edit
* Decisions made
    - The brief, not issue #190's old "no bot commits" line, is the contract that was built
    - Advisories stay unfixed
* Insights
    - A payload assertion stays green when the rendering is wrong. The workflow's real path shape has to be in the unit test, because the workflow itself is not tested

## 2026-11-04 - REWORK - IN-PROGRESS

* Work completed
    - Operator chose rework of issue-190-promote from the PR #202 review, instead of archive
* Decisions made
    - Fix the release-repair abort: do not assess an attempt-1 head that has no repair base
    - Fix the feature GIF commit: exit 0 when the index is empty, and say a commit was added only when a listed path will change HEAD
    - Reject tape names ending in `-before` or `-before-after`
    - Change the text-diff fence only if a backtick run in a diff actually breaks the comment
    - A width change is a CHANGED demo. Do not scale either GIF to make `vstack` accept them
    - Commit every verdict that is not a guaranteed SAME. NOISY and UNSTABLE GIFs are committed. SAME is not
* Insights
    - The operator wants a pull-request reply on each dismissed thread explaining the dismissal

## 2026-11-04 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Classified the PR #202 rework
* Decisions made
    - Level 2: one subsystem (comment, fingerprint helper, Generate workflow), with the commit policy and the no-scale constraint already decided
    - The original promote stays Level 3 in its own sections. This field is the rework
* Insights
    - Level 3 would stop before build and wait for `/niko-build`. The rework is corrections plus one stated policy, so Level 2 can plan, preflight, and build in this run

## 2026-11-04 - PLAN - COMPLETE

* Work completed
    - Wrote the nine-step plan in `memory-bank/active/tasks.md`
    - Rendered a backtick diff with CommonMark 0.31.2. The indented fence closes the block
    - Confirmed ffmpeg 7.0.2 rejects unequal `vstack` and accepts `pad` without stretching the narrower frame
* Decisions made
    - Pad to the wider width. Do not scale
    - `commit-list` compares scratch bytes with `HEAD`'s `docs/img` files and is what the pull notice and both commit steps use
    - NOISY and UNSTABLE stay collapsed in the comment and are still committed
* Insights
    - The attempt-1 throw is already the contract. The repair bug is the symlink that creates an incomplete attempt before the first assessment

## 2026-11-04 - BUILD - COMPLETE

* Work completed
    - Implemented the nine plan units. 97 script tests pass. Format and lint are clean. `tsc -p tsconfig.scripts.json` is clean
    - Replied on the PR #202 threads
* Decisions made
    - Tape-name rejection is separate from the upload-key check, because preview keys end in `-before` and `-before-after`
    - Comment-step head bytes come from the pull-request head SHA. Commit-step head bytes come from `HEAD` after checkout
* Insights
    - Putting the suffix check on `assertSafeDemoName` made the CHANGED comment exit 1 on its own stacked URL key
    - `npm run typecheck` and `npm run test:unit` still fail on the pre-existing `src/index.ts` errors and 32 prompt tests

## 2026-11-04 - PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

* Work completed
    - Validated the nine-unit rework plan against `scripts/demo-fingerprint.ts`, `scripts/demo-comment.ts`, their test suites, and `.github/workflows/generate-demos.yaml`
    - Verified TDD ordering in units 1-7, change-detector avoidance in unit 8, and the prose classification of unit 9; no in-phase plan edits were needed
    - Confirmed the repair-step symlink bug, the always-commits feature step, the `foo`/`foo-before` filename collision, and the hardcoded three-backtick diff fence against the code
    - Wrote `memory-bank/active/.preflight-status` with first line `PASS WITH ADVISORY`
* Decisions made
    - Plan is approved for Build with four advisories: a supersession line for `creative-release-gif-amend.md`, a tested `stack-args` CLI mode as a radical-innovation candidate, explicit materialize-after-checkout ordering in the commit steps, and a dead-code watch on the `amend` CLI mode
* Insights
    - Unit 7's new test locks an existing throw, so it is green on first run; it is a contract lock on executable behavior, not a change-detector

## 2026-11-04 - QA - COMPLETE (PASS)

* Work completed
    - Evaluated PR #202 rework implementation against all 9 plan units in `tasks.md` and the reworked project brief
    - Verified 97 tests pass in `scripts/demo-fingerprint.test.ts` and `scripts/demo-comment.test.ts`
    - Verified clean status on `npm run format:check`, `npm run lint:check`, and `tsc -p tsconfig.scripts.json`
    - Validated semantic requirements: tape name suffix guards, NOISY/UNSTABLE commit staging, HEAD-relative commit listing, CommonMark diff fencing, non-scaling width padding, and repair retry ordering
    - Wrote `memory-bank/active/.qa-validation-status` with first line `PASS`
* Decisions made
    - QA passes without blocking findings
    - Non-blocking advisories recorded for future maintenance: workflow shell duplication of HEAD docs materialization, retained `amend` CLI mode, and inline width probing
* Insights
    - Isolating tape name validation (`assertDemoTapeName`) from URL key validation (`assertSafeDemoName`) successfully prevents preview naming collisions without rejecting valid preview upload map keys


