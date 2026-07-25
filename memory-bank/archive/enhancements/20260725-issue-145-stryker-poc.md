---
task_id: issue-145-stryker-poc
complexity_level: 2
date: 2026-07-25
status: completed
---

# TASK ARCHIVE: PoC mutation testing with StrykerJS (#145)

## SUMMARY

Proven StrykerJS on this repo (602 mutants, **73.09%** score, 0 timeouts) and shipped advisory mutation tooling: local scripts, config with `incremental: true`, and a PR `mutation` job that logs the score without hard-gating. A PR #146 rework then trimmed the job to mutation-only (dropped duplicate advisory coverage), added `timeout-minutes: 30`, unpinned worker concurrency, and removed orphaned scripts/config. Side fix: product backspace/filter clearing so four Vitest cases and Stryker dry-run pass; ESLint ignore for `.stryker-tmp/` so leftover sandboxes cannot break `npm test`.

Merged as [#146](https://github.com/Texarkanine/inquirerjs-checkbox-search/pull/146).

## REQUIREMENTS

**Original PoC (#145)**

- Install `@stryker-mutator/core` + `@stryker-mutator/vitest-runner`; add `stryker.config.json`.
- Dry-run then full mutation run; record score for `src/index.ts`; triage survivors.
- Written go/no-go on wiring into `pr.yaml`.

**Rework (PR #146 review)**

- Mutation-only PR job with timeout; no reporting machinery; no `thresholds.break` / no `continue-on-error`.
- Remove dead advisory-coverage scripts and orphaned config (`concurrency` pin, `json` reporter, `stryker-tmp/` ignore).
- Docs (`CONTRIBUTING.md`, `techContext.md`) match surviving behavior; quality gate green.

## IMPLEMENTATION

**PoC**

- Deps/scripts: `test:mutate:dry`, `test:mutate`; `incremental: true`; clean/gitignore for Stryker temps.
- Full run (at then-pinned concurrency 4): 602 mutants, 440 killed, 130 survived, 32 no coverage → **73.09%** (~4m1s wall).
- Decision: **advisory-only** — keep tooling; do not add `thresholds.break` yet. Score useful but noisy (render/theme string long tail); kill high-value survivors (filter short-circuit, defaults, pageSize bounds) before gating.
- Product fix: `isBackspaceKey` via code-point-safe edit of `searchTerm` — `@inquirer/testing` `keypress('backspace')` does not mutate `rl.line`.

**Rework**

- `.github/workflows/pr.yaml`: job `mutation` / _Mutation (advisory)_; one `npm run test:mutate` step; cache retained; `timeout-minutes: 30` (raised from planned 20 — ~27 min CPU projects to ~8–15 min on 4-vCPU).
- Removed `test:coverage:advisory`, `test:metrics`, `concurrency: 4`, `json` reporter, dead `stryker-tmp/` paths.
- `eslint.config.js`: ignore `.stryker-tmp/` (flat config does not read `.gitignore`; Prettier 3 does).
- Unpinned concurrency: local full run 4m1s → 2m6s (15 workers on 16-core).

**Decision artifact (inlined from `stryker-poc-decision.md`)**

| Metric | Value |
| --- | --- |
| Mutants / killed / survived / no coverage / timeout | 602 / 440 / 130 / 32 / 0 |
| Mutation score (total / covered) | 73.09% / 77.19% |

Survivors worth killing (follow-ups): empty-filter short-circuit, default `checked`/`loop`/`validate`, `default` values application, PageSizeConfig boundaries, some `renderItem` checked/disabled branches. Treat theme/ANSI/label string mutants as noise (excludes later). Stretch `@stryker-mutator/typescript-checker` deferred.

## TESTING

No new Vitest cases (tooling/CI only; existing 113-case suite as regression). Operational verification: dry-run and full mutate (exit 0 at 73.09%); deliberate broken assertion → Stryker exit 1, then revert → exit 0; missing-script checks for removed npm scripts; YAML/job shape; `npm run clean`; `npm test` green with a `.stryker-tmp` sandbox present. Preflight/QA both PASS for original and rework.

## LESSONS LEARNED

- **`@inquirer/testing` backspace ≠ `rl.line` mutation** — prompts that sync search only from `rl.line` fail under that harness even when TTY is fine.
- **ESLint flat config ignores ≠ `.gitignore`** — a new generated directory must be taught to every ignore mechanism; otherwise lint fails locally while CI (fresh checkout) stays green.
- **Don't pin machine-shaped constants** — `concurrency: 4` starved a 16-core box and oversubscribed 4-vCPU CI; cores−1 default is correct.
- **Advisory value is absence of config** — duplicate coverage, summary script, and `json` reporter were deleted without losing signal; build logs + default `thresholds.break: null` already give crash-reds / low-score-greens.
- **Size timeouts from CPU cost, not local wall time** — 2m6s wall ≠ CI-relevant invariant when CPU is ~27 min.
- **Verify "do not add X" with an experiment** — no-change contracts leave no diff; break a test and watch exit codes.
- **Review rework includes PR metadata** — release-please ships the squash title as changelog.

## PROCESS IMPROVEMENTS

- Budget an unblock step for tooling PoCs when dry-run can fail for suite readiness, not only tool incompatibility.
- For advisory CI checks, start from tool defaults and add glue only when a default is wrong.
- Preflight should keep flagging false job names and release-please-facing PR titles when scope changes mid-task.

## TECHNICAL IMPROVEMENTS

- Kill the prioritized survivors above (TDD against specific mutants), then reconsider a modest `thresholds.break` near the current floor.
- Optional `mutator.excludedMutations` / disable comments for render-string noise.
- Optional: add `timeout-minutes` to the gating `test` job (advisory finding; out of this brief's scope).

## NEXT STEPS

1. Separate issues for high-value survivor kills and selective mutator excludes.
2. Revisit hard-gating once noise is managed.
3. Optional: `timeout-minutes` on the `test` job.
