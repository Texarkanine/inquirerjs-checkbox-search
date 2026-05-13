---
task_id: issue-129-node-versions
complexity_level: 2
date: 2026-05-13
status: completed
---

# TASK ARCHIVE: Update supported Node versions (issue #129)

## SUMMARY

Raised the minimum supported Node.js version to 22, removed Node 20 from CI and support claims, added Node 26 to the PR matrix, aligned GitHub Actions and demo Docker tooling with Node 22, and updated developer-facing and memory-bank documentation. Delivered as a single semver-breaking change (`feat!:`) with no production source changes.

## REQUIREMENTS

- Drop Node 20 from supported and tested configurations (EOL per issue #129).
- Minimum supported Node **22** (`engines`, `.nvmrc`, related metadata).
- PR matrix includes **22, 24, 26**; conditional steps (Codecov, `attw`) run on the lowest matrix version (22).
- Release and demo generation workflows, and demo Docker image, use a 22+ baseline.
- Docs (README, CONTRIBUTING, memory bank) state Node 22+.
- Quality gates: `npm test`, `npm run quality:check` (and related project checks).

**Note on acceptance criteria evolution:** An early plan proposed automated policy tests over config files; during plan rework this was removed as unnecessary for a zero production-code task. Verification relied on the existing test suite, format/lint/typecheck, and CI matrix behavior.

## IMPLEMENTATION

- **`package.json`:** `engines.node` `>=22`; `@types/node` peer `>=22`; dev `@types/node` `^22.0.0`; lockfile refreshed via `npm install`.
- **`.github/workflows/pr.yaml`:** Matrix `node-version: [22, 24, 26]`; Codecov and `attw` `if:` guards keyed to `matrix.node-version == 22`.
- **`.github/workflows/release-please.yaml`** and **`generate-demos.yaml`:** `setup-node` at Node 22.
- **`.nvmrc`:** Created, pins `22`.
- **`demos/Dockerfile`:** NodeSource script `setup_22.x`.
- **`vitest.config.ts`:** `esbuild.target` `node22`.
- **Docs:** `README.md`, `CONTRIBUTING.md`, `memory-bank/productContext.md`, `memory-bank/techContext.md` updated for Node 22+.

## TESTING

No new unit tests (no production code changes). Full `npm test` / quality pipeline used as regression guard; QA phase passed with no fixes required. Local friction noted: Node 20.18.x below rolldown optional binding expectations—environmental, not introduced by this task; CI on Node 22+ is authoritative.

## LESSONS LEARNED

- **Technical:** `vitest` / `rolldown` already expect a recent Node line; very old 20.x minors can fail at startup on optional native bindings even before the project’s new floor matters.
- **Process:** When there is nothing to unit-test (config/docs/CI only), “tests first” does not imply inventing policy tests that duplicate CI; validate through the tools that consume the config.
- **Reflection (inlined):** Initial plan included a category-error step (policy tests reading YAML/`package.json`). Rework removed it; remaining nine implementation steps matched reality. Build was straightforward substitutions. QA found nothing to fix.

## PROCESS IMPROVEMENTS

- Consider a single source of truth for Node version (e.g. `.nvmrc` + `actions/setup-node` `node-version-file`, or matrix read-from-file) so future bumps touch fewer places—worth doing if this class of change repeats.

## TECHNICAL IMPROVEMENTS

- Optional: centralize Node version for workflows and Docker via `node-version-file` or shared workflow inputs to reduce drift.

## NEXT STEPS

None.
