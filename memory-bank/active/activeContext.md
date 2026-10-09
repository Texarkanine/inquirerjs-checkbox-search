# Active Context

## Current Task: issue-190
**Phase:** REFLECT COMPLETE

## What Was Done

- Implemented shadow-mode demo fingerprinting for [issue #190](https://github.com/Texarkanine/inquirerjs-checkbox-search/issues/190).
- `scripts/demo-fingerprint.ts` normalizes the VHS text record, hashes frame-text PNGs, applies the retry rule, rewrites a tape with quoted Output lines, and prints sorted verdicts plus one `SHADOW_VERDICTS=` line.
- `scripts/generate-demo.js` keeps the GIF-only path free of the TypeScript module. Scratch mode builds the worktree image and records demos one at a time through `docker` directly.
- The hidden `Sleep 1s` after each example command is now `Wait+Screen /Search:/`. Later sleeps are unchanged.
- The demo workflow records the merge-base and the pull-request head under `$RUNNER_TEMP`, retries `NEED_FRAME_RETRY` demos once, and exports `SHADOW_VERDICTS` into the existing comment. Expand/collapse and the release-please amend still follow the GIF diff.
- Completed structured semantic QA review against KISS, DRY, YAGNI, Completeness, Regression, Integrity, and Documentation.
- Opened draft pull request [#191](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/191). It references #190 and does not close it.

## Key Decisions

- Scratch recordings are serial. `parseGenerateArgs` has no parallelism flag, and the plan requires one demo at a time.
- The gif Output path is `<demoDir>/<demoName>-demo.gif`, derived from the text path, because the planned helper takes the text path and the frames directory.
- The shadow sentence is `Shadow verdicts (not used to expand demos): <demo> <ASSESSMENT>, ...`.

## Deviations from Plan

- No `--max-parallelism` flag on the scratch parser. Serial execution is inside scratch mode.
- `assertSafeDemoName` is exported so a bad name throws, while `assessScratch` still returns exit 1.

## Verification

- `npm test`: format, lint, and typecheck passed. 164 tests passed, including the new `scripts/demo-fingerprint.test.ts` cases.
- QA review passed all semantic criteria.

## Next Step

- Operator runs `/niko-archive`. CI on #191 is the first run of the shadow recording.
