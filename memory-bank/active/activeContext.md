# Active Context

## Current Task: Rework demo verdict commit and repair
**Phase:** BUILD - COMPLETE

## What Was Done
- Release repair no longer links attempt-1 head before the repair base exists.
- `commit-list` drops a remove with no head GIF and a stage whose bytes already match. The feature commit exits 0 on an empty list and on an empty index. The pull notice follows that list.
- Tape names ending in `-before` or `-before-after` are rejected by `assertDemoTapeName`. Upload keys keep those suffixes.
- A text diff uses a fence longer than any backtick run in the diff.
- Unequal GIF widths are padded. Neither GIF is scaled. SAME is the only verdict that skips the GIF commit.
- Review replies are on PR #202.

## Files
- `/home/mobaxterm/git/inquirerjs-checkbox-search/scripts/demo-comment.ts`
- `/home/mobaxterm/git/inquirerjs-checkbox-search/scripts/demo-comment.test.ts`
- `/home/mobaxterm/git/inquirerjs-checkbox-search/scripts/demo-fingerprint.ts`
- `/home/mobaxterm/git/inquirerjs-checkbox-search/scripts/demo-fingerprint.test.ts`
- `/home/mobaxterm/git/inquirerjs-checkbox-search/.github/workflows/generate-demos.yaml`
- `/home/mobaxterm/git/inquirerjs-checkbox-search/CONTRIBUTING.md`
- `/home/mobaxterm/git/inquirerjs-checkbox-search/memory-bank/techContext.md`
- `/home/mobaxterm/git/inquirerjs-checkbox-search/memory-bank/active/projectbrief.md`
- `/home/mobaxterm/git/inquirerjs-checkbox-search/memory-bank/active/creative/creative-commit-demos-on-merge.md`
- `/home/mobaxterm/git/inquirerjs-checkbox-search/memory-bank/active/creative/creative-release-gif-amend.md`

## Deviations
- The suffix check is `assertDemoTapeName`, not `assertSafeDemoName`. Upload keys such as `validation-before-after` must stay valid or the comment CLI exits 1.
- The comment step materializes `docs/img` from the pull-request head SHA. The commit steps materialize it after `git checkout` of the branch.
- The release-amend creative doc got the same supersession line as the commit decision.
- `src/index.ts` still fails typecheck in three `setActiveItemValue` calls, and 32 prompt tests still fail. This rework does not touch the prompt.

## Next Step
- QA the build.
