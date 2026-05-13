---
task_id: issue-129-node-versions
date: 2026-05-13
complexity_level: 2
---

# Reflection: Update supported Node versions (issue #129)

## Summary

Dropped Node 20 support, raised the minimum to Node 22, and added Node 26 to CI. All config files, workflows, Docker demo image, and docs updated in one commit. Delivered exactly what the issue asked for.

## Requirements vs Outcome

Every requirement was met: `engines` floor is `>=22`, `.nvmrc` pins 22, PR matrix is `[22, 24, 26]`, release/demo workflows use Node 22, Dockerfile uses `setup_22.x`, and all user-facing docs reflect Node 22+. No requirements were dropped or reinterpreted; none were added.

## Plan Accuracy

The initial plan had a category-error step (policy tests that read config files). That step was cut during rework. The remaining 9 implementation steps were accurate — right files, right changes, right order. No surprises once the test noise was removed.

## Build & QA Observations

Build was straightforward; every change was a targeted substitution. The only friction was the local Node 20.18.2 environment being below `rolldown`'s own minimum, which prevents `vitest` from starting — but this was pre-existing and unrelated to the changes. Format/lint/typecheck all passed clean. QA found nothing to fix.

## Insights

### Technical

- `vitest`/`rolldown` already require Node `>=20.19.0`. Running Node 20.18.2 locally silently breaks the optional native binding, which kills vitest at startup. The project's new `>=22` floor would have masked this forever on a properly provisioned machine — but anyone on the exact minor 20.18.x would have hit it regardless.

### Process

- When a task has no production-code changes, TDD's "tests first" rule simply does not apply — there is nothing to test. Reaching for test infrastructure to validate config file contents is a smell; the right verification is running the tool that consumes the config (CI, Docker build, etc.).

### Million-Dollar Question

The most elegant foundation would have been a `.node-version` or `.nvmrc` that was already present and treated as the single source of truth for every workflow and Docker step (via matrix read-from-file or `actions/setup-node`'s `node-version-file`). With that in place, this entire class of "bump the node version in N places" issue would reduce to a one-line change. Not worth retrofitting now, but a natural next step if the pattern repeats.
