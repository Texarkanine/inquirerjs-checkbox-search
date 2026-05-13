# Progress

Align Node.js support and CI with issue #129: minimum Node 22, test through Node 26, remove Node 20.

**Complexity:** Level 2

## 2026-05-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Confirmed operator intent for issue #129.
    - Classified task as Level 2 (coordinated config/docs/CI update, not a new prompt feature).
    - Initialized ephemeral memory bank files (`projectbrief`, `activeContext`, `tasks` stub, `progress`).
* Decisions made
    - Treat Node floor raise and matrix expansion as one deliverable with policy tests to prevent drift.

## 2026-05-13 - PLAN - COMPLETE

* Work completed
    - Authored full Level 2 plan in `tasks.md` (TDD-first policy test, concrete file touchpoints, challenges).
* Decisions made
    - Encode support policy in `src/__tests__/node-support-policy.test.ts` to guard `engines`, workflows, `.nvmrc`, and Vitest target together.

## 2026-05-13 - PLAN - REWORK

* Work completed
    - Removed policy-test step; task has no production code changes so no unit tests are required.
    - Plan revised to 10 steps: package.json, lockfile, 3 workflows, .nvmrc, Dockerfile, vitest config, docs, verify.
* Decisions made
    - TDD requirement does not apply when there are no code changes; existing suite is the regression guard.

## 2026-05-13 - BUILD - COMPLETE

* Work completed
    - All 10 implementation steps applied.
    - package.json: engines `>=22`, @types/node peer/dev `>=22`.
    - .nvmrc: created, pins `22`.
    - pr.yaml: matrix [22,24,26], gates on 22.
    - release-please.yaml + generate-demos.yaml: setup-node `22`.
    - demos/Dockerfile: NodeSource `setup_22.x`.
    - vitest.config.ts: esbuild target `node22`.
    - README, CONTRIBUTING, memory-bank persistent files: updated Node 22+ wording.
    - Committed as `feat!: drop Node 20, raise minimum to Node 22, add Node 26 to CI`.
* Insights
    - Quality gate (format/lint/typecheck) passed clean; vitest cannot start on local Node 20.18.2 due to rolldown optional binding — pre-existing environment issue, not caused by these changes. Will pass in CI on Node 22+.

## 2026-05-13 - REFLECT - COMPLETE

* Work completed
    - Reflection document written.
    - Persistent files already reconciled during build.
* Insights
    - See reflection doc for details.
