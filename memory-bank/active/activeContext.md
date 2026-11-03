# Active Context

## Current Task: Promote demo verdicts out of shadow
**Phase:** PLAN - COMPLETE

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

## Next Step
- Preflight this revised plan, then build `memory-bank/active/tasks.md` from step 1.
