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
    - Re-reviewed the `CONTRIBUTING.md` fix against `tasks.md`, the workflow commit message, and `README.md`
    - Ran `npx vitest run scripts` (79 pass), format, lint, and `tsc -p tsconfig.scripts.json`, all clean
    - Wrote `memory-bank/active/.qa-validation-status` with first line `PASS`
* Decisions made
    - No blocking findings. Advisories stay as written
* Insights
    - The 32 prompt test failures and three `src/index.ts` typecheck errors are unchanged and outside this task

