# Active Context

## Current Task: Promote demo verdicts out of shadow
**Phase:** BUILD - COMPLETE

## What Was Done
- Confirmed intent against [issue #190](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/190): fingerprint verdicts drive the demo comment.
- Operator emphasis: a demo that has not meaningfully changed stays collapsed and is indicated as the same.
- Complexity is Level 3.
- Comment shape: collapsed SAME, NOISY, and UNSTABLE each name their verdict. Open CHANGED, NEW, and REMOVED.
- Operator accepted `memory-bank/active/creative/creative-commit-demos-on-merge.md`. A demo-changing pull request adds one GIF commit from a single head recording. Squash or rebase lands it on `main`. The release amend only repairs `docs/img/` when it is still wrong.
- The operator will turn on the ruleset rule that requires a branch to be up to date with `main` before merge. This repository change does not edit that ruleset.
- Operator accepted the suboptimal follow-up: a later human commit is compared with `main`, so a README-only commit can add another GIF commit. Do not build a comparison against the GIFs already on the branch.
- Preflight of the previous plan returned `FAIL (fixable)`. The plan now gives the template fill, the image-list parse, and the CLI their own tested units. `pullNotice` is a `renderDemoComment` return. Attempt 0 is the only GIF that is copied. The comment posts before the push. The feature commit step excludes release-please branches.
- The preflight advisory to collapse the pipeline into one `runDemoPipeline` is declined. The operator already accepted the workflow shape, and the blocking gaps are local.
- The revised plan preflighted as `PASS WITH ADVISORY`. No change to `tasks.md`. Build notes: call `buildDockerFfmpegStackArgs` from `node` when wiring the stack step, and reset `docs/img/` before applying `selectReleaseAmend` paths so preview GIFs left by the upload script are not committed. The advisory to teach `formatAmendList` the scratch source path was not adopted.
- Build implemented units 1–12. `describeVerdict`, the comment renderer, the amend list, the attempt-0 copy plan, the image-list parser, the template fill, and the comment CLI are tested. The Generate workflow records the merge-base and the head once, posts the comment, then adds one GIF commit on a feature pull request or amends a release when `docs/img/` is still wrong.
- `loadCommentEntries` takes optional `requireImageUrls` (default true) so `copies` and `amend` can load verdicts without upload URLs.
- The release amend copies CHANGED and NEW GIFs from the repair scratch after `git restore` of `docs/img/`. It does not restore them from a backup of `docs/img/`, because the upload script can replace that directory and the scratch recording is already under `RUNNER_TEMP`.
- The repair recording retries `NEED_FRAME_RETRY`, so a frame-only difference against an older GIF commit can still become CHANGED.
- `src/index.ts` typecheck errors and the navigation/selection test failures are present on this branch without these changes. This task does not touch the prompt.
- QA failed on three fixable findings. The rebuild resolves every GIF path in `buildDockerFfmpegStackArgs` before the Docker mount, fences a CHANGED text diff as a `diff` block, and puts the detached doc comments back on their functions. The comment-size, duplicated CLI, and unused `--flag=value` advisories were left as written.

- `CONTRIBUTING.md` "Demo Generation" now tells contributors about the `chore: update demo GIFs` commit, the pull before the next push, and the expected follow-up run that exits immediately.

## Next Step
- QA review of the contributor-doc fix.
