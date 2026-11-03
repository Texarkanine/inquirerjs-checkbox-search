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
- The previous preflight passed the plan that forbade feature GIF commits. That status file is removed so `/niko-build` preflights this plan first.
- Operator accepted the suboptimal follow-up: a later human commit is compared with `main`, so a README-only commit can add another GIF commit. Do not build a comparison against the GIFs already on the branch.

## Next Step
- In a new session, run `/niko-build`. It preflights this plan, then implements `memory-bank/active/tasks.md` from step 1.
