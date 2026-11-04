---
task_id: issue-190-promote
date: 2026-11-03
complexity_level: 3
---

# Reflection: Promote demo verdicts out of shadow

## Summary

Fingerprint verdicts now drive the pull-request demo comment and the release GIF repair, and a demo-changing feature pull request gets one `chore: update demo GIFs` commit after the comment. The first two QA reviews failed on fixable gaps; the third passed.

## Requirements vs Outcome

The brief's eight requirements are in the workflow and in `scripts/demo-comment.ts`. SAME, NOISY, and UNSTABLE stay collapsed and name the verdict. CHANGED, NEW, and REMOVED open. A text change is a stacked GIF plus a fenced diff. A frame-only change says styling only and omits the diff. Feature commits are additive. Release-please still amends, and only when `docs/img/` is still wrong.

Issue #190's acceptance line "Feature PRs get no bot commits" was already replaced by the operator's commit-on-PR decision. The brief is the contract that was built.

Left as advisories: a text diff includes every unchanged line and could pass GitHub's comment cap; `runCommentCli` repeats the upload-failure sentence and the pull notice; `--flag=value` is parsed and unused; an upload that finds no GIFs makes the comment step exit 1. The three `src/index.ts` type errors and 32 prompt test failures were already on the branch and were not touched.

## Plan Accuracy

The twelve units were the right cut after preflight added tested units for the image-list parse, the template fill, and the CLI. Build added `requireImageUrls` so copies and amend can load verdicts without upload URLs, retried `NEED_FRAME_RETRY` on the release repair, and restored `docs/img/` with `git restore` and `git clean` instead of a backup of that directory. Those were local fixes. The plan did not need a rewrite.

The surprises were outside the step list. The plan told the workflow to write `docs/img/<name>-before-after-demo.gif` and told the test to use absolute paths. The plan said the text-diff body "contains the diff" and did not say fence it. The prose unit named `memory-bank/techContext.md` and did not name `CONTRIBUTING.md`.

## Creative Phase Review

Open-only-a-real-set-change held. The summaries, the styling-only label, and the NOISY/UNSTABLE banner shipped as written. The note said "collapsed text diff" and did not mention the `diff` fence from the issue's example. QA required the fence.

The additive commit held: one head recording, comment first, no amend and no force-push, release-please excluded, bot actor exits the follow-up run. The implementation notes put the pull sentence in the comment and not in `CONTRIBUTING.md`, which is where a contributor reads it.

The GIF-commit amend base held: comment stays on the merge-base, amend compares the last `docs/img/` commit, stage CHANGED and NEW, remove REMOVED, skip an empty list. That document's pre-mortem still says feature pulls do not commit GIFs. The later commit decision replaced that premise. Build followed the later decision, so the amend is the repair that decision describes.

## Build & QA Observations

Units 1–10 went through TDD and stayed green. The workflow is untested on purpose, so a relative `OUTPUT` reached `buildDockerFfmpegStackArgs` and would have been a named volume. The comment test asserted `-old line\n+new line`, which is still true when those lines are unfenced and GitHub renders `>` as a blockquote. Doc comments sat on the constants declared between the comment and the function.

QA failed twice, then passed. The first review found the mount, the fence, and the detached comments. The second found the contributor guide. The third found the guide matched the workflow. `npx vitest run scripts` is 79 passing. `npm test` still stops on the pre-existing prompt type errors.

## Cross-Phase Analysis

Preflight caught the missing tested units for parse, fill, and the CLI before any of that was built. It did not catch the mount or the fence, because the plan described both behaviors without the constraint that makes them correct.

The contributor-doc miss is the same shape. The commit decision named the pull sentence as comment text. The plan's prose unit named `techContext.md`. Nothing in the chain named `CONTRIBUTING.md` until a reviewer read it as a contributor would.

The stale "no feature commit" sentence in the amend decision did not produce a defect. The brief and the later decision were the ones build used.

## Insights

### Technical

- Docker treats a non-absolute `-v` source as a named volume. `buildDockerFfmpegStackArgs` resolves every GIF path before it builds the mount.
- A JSDoc block attaches to the next statement. A `const` between the comment and the function takes the comment.
- An unfenced diff line that starts with `>` renders as a blockquote. The comment wraps the text diff in a `diff` fence.

### Process

- A test that only checks the payload is present stays green when the rendering breaks for the reader. Assert the fence, not only the lines inside it.
- Name the contributor doc in the plan when CI behavior is something a contributor has to pull for. A prose unit that names only `techContext.md` will not update `CONTRIBUTING.md`.
- The workflow is untested by decision. The unit test has to use the path shape the workflow passes, or that bug waits for a run.
