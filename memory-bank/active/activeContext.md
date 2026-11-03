# Active Context

## Current Task: Promote demo verdicts out of shadow
**Phase:** CREATIVE - COMPLETE (awaiting operator)

## What Was Done
- Confirmed intent against [issue #190](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/190): leave shadow mode and let the existing fingerprint verdicts drive the demo comment and the release-please GIF amend.
- Operator emphasis: a demo that has not meaningfully changed stays collapsed and is indicated as the same.
- Complexity is Level 3.
- Release amend base: the commit that last touched `docs/img/`, not the merge-base. The comment stays on the merge-base.
- Comment shape: collapsed SAME, NOISY, and UNSTABLE each name their verdict. Open CHANGED, NEW, and REMOVED.
- Plan written to `memory-bank/active/tasks.md`. Nine steps. The detector stays. New comment behavior is tested in Vitest before the workflow is rewired.
- Completed preflight validation (PASS WITH ADVISORY) for the plan that does not commit GIFs on a feature pull request.
- Operator reopened that constraint. A demo-changing pull request should bring updated `docs/img/` files onto `main` when it merges. A direct push to `main` cannot pass the ruleset. The exploration selects one added commit on the pull request branch when a demo changed.

## Next Step
- Wait for the operator. Do not start `/niko-build` on the preflight plan. That plan still says feature pull requests get no bot commit.
