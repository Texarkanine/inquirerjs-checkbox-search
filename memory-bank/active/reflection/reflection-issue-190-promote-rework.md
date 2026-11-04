---
task_id: issue-190-promote-rework
date: 2026-11-04
complexity_level: 2
---

# Reflection: Rework demo verdict commit and repair

## Summary

PR #202 review rework. Release repair no longer assesses an incomplete attempt-1, the GIF commit exits cleanly when nothing would change `HEAD`, and every verdict except SAME commits a GIF. QA passed. The original reflection stays in `reflection-issue-190-promote.md`.

## Requirements vs Outcome

The operator's list is in the workflow and the script tests. The repair symlink is gone. `commit-list` gates the pull notice and both commit steps. NOISY and UNSTABLE are staged and stay collapsed in the comment. Unequal widths are padded, not scaled. The backtick fence grew only after CommonMark 0.31.2 showed a real break. `__proto__` and the `-i` order nit were dismissed in replies, with the reason on the thread.

The suffix check landed on `assertDemoTapeName` rather than `assertSafeDemoName`. Preview upload keys end in `-before` and `-before-after`, and the comment CLI exits 1 if those keys are rejected.

## Plan Accuracy

The nine units were the right cut. The plan named `assertSafeDemoName` for the suffix, and the `$&` comment test showed that function is also the upload-key gate. Splitting the check was a local fix. The plan did not need a rewrite.

The width probe stayed in the workflow, as planned. QA left that, the repeated head-docs loop, and the unused `amend` mode as advisories.

## Build & QA Observations

Units went red then green, except the incomplete-attempt test, which was already green because the throw existed. The repair bug was the caller. QA passed on the first review. `npm run typecheck` and the full unit suite still stop on the three `src/index.ts` errors and 32 prompt failures that were already on the branch.

## Insights

### Technical

- `assertSafeDemoName` guards tape names and upload keys. A rule aimed at tapes will reject `<name>-before-after`, which is the stacked GIF's own key.
- An unchanged diff line is prefixed with one space. Three backticks on that line close a CommonMark fence.

### Process

- Nothing notable beyond the suffix split. The preflight advisories that were adopted (supersession line, materialize after checkout) were the ones that named a wrong document or a wrong `HEAD`.

## Million-Dollar Question

`commit-list` is the decision the workflow should have had from the start: one list of paths that would change `HEAD`, used for the notice and both pushes. The attempt-1 symlink would not have been written. The repeated `git ls-tree` loop is the leftover of keeping that decision in bash.
